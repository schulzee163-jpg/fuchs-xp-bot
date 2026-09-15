import http from "http";
import WebSocket from "ws";

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  "https://herznunvdqcmzeffblgo.supabase.co";

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const STREAMELEMENTS_JWT =
  process.env.STREAMELEMENTS_JWT;

let streamElementsChannel =
  process.env.STREAMELEMENTS_CHANNEL ||
  null;

function headers(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization:
      `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function supabase(
  path,
  options = {}
) {
  const response =
    await fetch(
      `${SUPABASE_URL}${path}`,
      {
        ...options,
        headers:
          headers(
            options.headers || {}
          ),
      }
    );

  const text =
    await response.text();

  if (!response.ok) {
    throw new Error(
      `Supabase ${response.status}: ${text}`
    );
  }

  return text
    ? JSON.parse(text)
    : null;
}

async function rpc(
  name,
  body = {}
) {
  return supabase(
    `/rest/v1/rpc/${name}`,
    {
      method: "POST",
      body:
        JSON.stringify(body),
    }
  );
}

/* =========================================================
   STREAM ELEMENTS
   ========================================================= */

async function streamelementsSenden(
  text
) {
  if (
    !text ||
    !String(text).trim()
  ) {
    return false;
  }

  if (!STREAMELEMENTS_JWT) {
    console.log(
      "⚠️ StreamElements JWT fehlt."
    );
    return false;
  }

  try {
    const channelResponse =
      await fetch(
        "https://api.streamelements.com/kappa/v2/channels/me",
        {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${STREAMELEMENTS_JWT}`,
            Accept:
              "application/json",
          },
        }
      );

    const channelBody =
      await channelResponse.text();

    if (!channelResponse.ok) {
      console.error(
        `❌ StreamElements Channel-ID ${channelResponse.status}: ${channelBody}`
      );
      return false;
    }

    const channelData =
      JSON.parse(channelBody);

    const channelId =
      channelData._id;

    if (!channelId) {
      console.error(
        "❌ StreamElements Channel-ID konnte nicht ermittelt werden."
      );
      return false;
    }

    const response =
      await fetch(
        `https://api.streamelements.com/kappa/v2/bot/${encodeURIComponent(
          channelId
        )}/say`,
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${STREAMELEMENTS_JWT}`,
            "Content-Type":
              "application/json",
            Accept:
              "application/json",
          },
          body: JSON.stringify({
            message: String(text),
          }),
        }
      );

    const body =
      await response.text();

    console.log(
      `📤 StreamElements Antwort ${response.status}: ${body}`
    );

    if (!response.ok) {
      console.error(
        `❌ StreamElements ${response.status}: ${body}`
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "❌ StreamElements Senden:",
      error.message
    );
    return false;
  }
}

/* =========================================================
   AKTIVITÄT
   ========================================================= */

async function aktivitaetSpeichern(
  username
) {
  try {
    await supabase(
      "/rest/v1/fuchs_aktivitaet?on_conflict=spieler",
      {
        method: "POST",
        headers: {
          Prefer:
            "resolution=merge-duplicates",
        },
        body:
          JSON.stringify({
            spieler:
              username,
            letzte_aktivitaet:
              new Date().toISOString(),
          }),
      }
    );
  } catch (error) {
    console.error(
      "❌ Aktivität speichern:",
      error.message
    );
  }
}

/* =========================================================
   NORMALE QUESTS
   ========================================================= */

const normaleZiele = {
  1: 10,
  2: 5,
  3: 1,
  4: 3,
  5: 2,
};

async function questsAnlegen(
  username
) {
  try {
    await rpc(
      "fuchs_quests_anlegen",
      {
        spieler_name:
          username,
      }
    );
  } catch (error) {
    console.error(
      "❌ Normale Quests anlegen:",
      error.message
    );
  }
}

async function questFortschrittHolen(
  username
) {
  const datum =
    new Date()
      .toISOString()
      .slice(0, 10);

  try {
    return await supabase(
      `/rest/v1/quest_fortschritt` +
      `?spieler=eq.${encodeURIComponent(username)}` +
      `&datum=eq.${datum}` +
      `&order=quest_nummer.asc`
    );
  } catch (error) {
    console.error(
      "❌ Quest-Fortschritt:",
      error.message
    );
    return [];
  }
}

async function questsPruefen(
  username,
  text
) {
  try {
    await questsAnlegen(
      username
    );

    const vorher =
      await questFortschrittHolen(
        username
      );

    await rpc(
      "quest_nachricht_verarbeiten",
      {
        spieler_name:
          username,
        nachricht:
          text,
      }
    );

    const nachher =
      await questFortschrittHolen(
        username
      );

    const vorherMap =
      new Map(
        vorher.map(q => [
          Number(
            q.quest_nummer
          ),
          Number(
            q.fortschritt || 0
          ),
        ])
      );

    for (
      const q of nachher
    ) {
      const nummer =
        Number(
          q.quest_nummer
        );

      const alt =
        vorherMap.get(
          nummer
        ) || 0;

      const neu =
        Number(
          q.fortschritt || 0
        );

      if (
        normaleZiele[nummer] &&
        neu >=
          normaleZiele[nummer] &&
        alt <
          normaleZiele[nummer]
      ) {
        await streamelementsSenden(
          `@${username} ✅ Quest erfolgreich erledigt! +10 FuchsXP 🦊`
        );
      }
    }

    const alleFertig =
      [1, 2, 3, 4, 5]
        .every(n => {
          const q =
            nachher.find(
              x =>
                Number(
                  x.quest_nummer
                ) === n
            );

          return (
            q &&
            Number(
              q.fortschritt || 0
            ) >=
              normaleZiele[n]
          );
        });

    const vorherAlleFertig =
      [1, 2, 3, 4, 5]
        .every(n => {
          const q =
            vorher.find(
              x =>
                Number(
                  x.quest_nummer
                ) === n
            );

          return (
            q &&
            Number(
              q.fortschritt || 0
            ) >=
              normaleZiele[n]
          );
        });

    if (
      alleFertig &&
      !vorherAlleFertig
    ) {
      await streamelementsSenden(
        `@${username} 🏆 Du hast heute alle 5 normalen Aufgaben erledigt! 🦊`
      );
    }
  } catch (error) {
    console.error(
      "❌ Normale Quests:",
      error.message
    );
  }
}

/* =========================================================
   PERSÖNLICHE QUESTS
   ========================================================= */

const persoenlicheQuests = {
  6: {
    wort:
      "gaming",
    ziel:
      2,
    text:
      "🎮 Deine persönliche Aufgabe ist: Schreibe „Gaming“ 2-mal innerhalb von 60 Sekunden.",
  },

  7: {
    wort:
      "twitch",
    ziel:
      2,
    text:
      "💜 Deine persönliche Aufgabe ist: Schreibe „Twitch“ 2-mal innerhalb von 60 Sekunden.",
  },

  8: {
    wort:
      "rudel",
    ziel:
      2,
    text:
      "🐺 Deine persönliche Aufgabe ist: Schreibe „Rudel“ 2-mal innerhalb von 60 Sekunden.",
  },

  9: {
    wort:
      "hallo",
    ziel:
      3,
    text:
      "👋 Deine persönliche Aufgabe ist: Schreibe „Hallo“ 3-mal innerhalb von 60 Sekunden.",
  },

  10: {
    wort:
      "mega",
    ziel:
      2,
    text:
      "🌟 Deine persönliche Aufgabe ist: Schreibe „Mega“ 2-mal innerhalb von 60 Sekunden.",
  },
};

async function persoenlicheQuestsAnlegen(
  username
) {
  try {
    await rpc(
      "persoenliche_quest_pruefen",
      {
        spieler_name:
          username,
        nachricht:
          "",
      }
    );
  } catch (error) {
    console.error(
      "❌ Persönliche Quests anlegen:",
      error.message
    );
  }
}

async function persoenlicheQuestsHolen(
  username
) {
  const datum =
    new Date()
      .toISOString()
      .slice(0, 10);

  try {
    return await supabase(
      `/rest/v1/daily_quest_assignments` +
      `?spieler=eq.${encodeURIComponent(username)}` +
      `&datum=eq.${datum}` +
      `&quest_nummer=gte.6` +
      `&quest_nummer=lte.10` +
      `&order=quest_nummer.asc`
    );
  } catch (error) {
    console.error(
      "❌ Persönliche Quests holen:",
      error.message
    );
    return [];
  }
}

async function persoenlicheQuestAnzeigen(
  username
) {
  try {
    await persoenlicheQuestsAnlegen(
      username
    );

    const quests =
      await persoenlicheQuestsHolen(
        username
      );

    const aktive =
      quests.find(
        q =>
          !q.abgeschlossen
      );

    if (!aktive) {
      await streamelementsSenden(
        `@${username} 🎉 Du hast heute alle persönlichen Aufgaben geschafft! Komm morgen wieder für neue Aufgaben! 🦊🏆`
      );
      return;
    }

    const nummer =
      Number(
        aktive.quest_nummer
      );

    const quest =
      persoenlicheQuests[
        nummer
      ];

    if (!quest) {
      return;
    }

    await streamelementsSenden(
      `@${username} ${quest.text} → ${Number(
        aktive.fortschritt || 0
      )}/${quest.ziel}`
    );
  } catch (error) {
    console.error(
      "❌ Persönliche Quest anzeigen:",
      error.message
    );
  }
}

/* =========================================================
   PVP / POKEMON GRUNDLAGEN
   ========================================================= */

const offeneKaempfe =
  new Map();

let aktuellerPvpKampf =
  null;

const eigenePokemon = {
  fuchsmissvegetalover2_0:
    "Pikachu",

  vegetalover2_0:
    "Glumanda",
};

const verfuegbarePokemon = [
  "Schiggy",
  "Bisasam",
  "Evoli",
  "Relaxo",
  "Mauzi",
  "Enton",
  "Pummeluff",
  "Vulpix",
  "Fukano",
  "Abra",
  "Knofensa",
  "Ponita",
  "Lapras",
  "Dratini",
  "Riolu",
  "Lucario",
  "Gengar",
  "Absol",
  "Raupy",
  "Sterndu",
];
function pokemonNameNormalisieren(

  name

) {

  if (!name) {

    return null;

  }

  const gesucht =

    name

      .trim()

      .toLowerCase();

  const festesPokemon =

    Object.values(

      eigenePokemon

    ).find(

      pokemon =>

        pokemon.toLowerCase() ===

        gesucht

    );

  if (festesPokemon) {

    return festesPokemon;

  }

  const gefunden =

    verfuegbarePokemon.find(

      pokemon =>

        pokemon.toLowerCase() ===

        gesucht

    );

  return gefunden || null;

}

async function spielerProfilHolen(

  username

) {

  try {

    const rows =

      await supabase(

        `/rest/v1/fuchsprofile` +

        `?spieler=eq.${encodeURIComponent(username)}` +

        `&limit=1`

      );

    return rows?.[0] || null;

  } catch (error) {

    console.error(

      "❌ Profil holen:",

      error.message

    );

    return null;

  }

}

async function pokemonHolen(

  username

) {

  const festesPokemon =

    eigenePokemon[

      username.toLowerCase()

    ];

  if (festesPokemon) {

    return festesPokemon;

  }

  const profil =

    await spielerProfilHolen(

      username

    );

  return (

    profil?.pokemon ||

    null

  );

}

function rudelHolen(

  profil

) {

  return (

    profil?.rudel ||

    "🐺 Noch kein Rudel"

  );

}

async function pokemonWahl(

  username,

  pokemon

) {

  if (!pokemon) {

    const vergeben =

      new Set(

        Object.values(

          eigenePokemon

        ).map(

          p =>

            p.toLowerCase()

        )

      );

    const freie =

      verfuegbarePokemon

        .filter(

          p =>

            !vergeben.has(

              p.toLowerCase()

            )

        );

    return (

      `@${username} 🐾 Zuschauer, wähle dein Pokémon mit !pokemon NAME | ⚡ Pikachu ist für Fuchsmissvegetalover2_0 vergeben | 🔥 Glumanda ist für vegetalover2_0 vergeben | Frei: ${freie.join(", ")}`

    );

  }

  const gewaehltesPokemon =

    pokemonNameNormalisieren(

      pokemon

    );

  if (!gewaehltesPokemon) {

    return (

      `@${username} ❌ Dieses Pokémon gibt es nicht in der Auswahl. Schreibe !pokemon für die Liste.`

    );

  }

  const festVergebenVon =

    Object.entries(

      eigenePokemon

    ).find(

      ([, p]) =>

        p.toLowerCase() ===

        gewaehltesPokemon.toLowerCase()

    );

  if (

    festVergebenVon &&

    festVergebenVon[0].toLowerCase() !==

      username.toLowerCase()

  ) {

    return (

      `@${username} ❌ ${gewaehltesPokemon} ist bereits vergeben. Bitte wähle ein anderes Pokémon.`

    );

  }

  try {

    const rows =

      await supabase(

        `/rest/v1/fuchsprofile` +

        `?pokemon=eq.${encodeURIComponent(

          gewaehltesPokemon

        )}` +

        `&select=spieler,pokemon`

      );

    const andererSpieler =

      rows?.find(

        row =>

          row.spieler &&

          row.spieler.toLowerCase() !==

            username.toLowerCase()

      );

    if (andererSpieler) {

      return (

        `@${username} ❌ ${gewaehltesPokemon} ist bereits von @${andererSpieler.spieler} vergeben. Bitte wähle ein anderes Pokémon.`

      );

    }

  } catch (error) {

    console.error(

      "❌ Pokémon-Belegung prüfen:",

      error.message

    );

  }

  try {

    await supabase(

      "/rest/v1/fuchsprofile?on_conflict=spieler",

      {

        method: "POST",

        headers: {

          Prefer:

            "resolution=merge-duplicates",

        },

        body:

          JSON.stringify({

            spieler:

              username,

            pokemon:

              gewaehltesPokemon,

          }),

      }

    );

    return (

      `@${username} 🐾 Dein Pokémon ist jetzt ${gewaehltesPokemon}!`

    );

  } catch (error) {

    console.error(

      "❌ Pokémon speichern:",

      error.message

    );

    return (

      `@${username} ❌ Dein Pokémon konnte nicht gespeichert werden.`

    );

  }

}

async function pvpStart(

  username,

  gegner

) {

  if (

    !gegner ||

    gegner.toLowerCase() ===

      username.toLowerCase()

  ) {

    return (

      `@${username} Du kannst dich nicht selbst herausfordern.`

    );

  }

  const linksProfil =

    await spielerProfilHolen(

      username

    );

  const rechtsProfil =

    await spielerProfilHolen(

      gegner

    );

  offeneKaempfe.set(

    gegner.toLowerCase(),

    {

      typ: "rudel",

      herausforderer:

        username,

      gegner:

        gegner,

      herausfordererRudel:

        rudelHolen(

          linksProfil

        ),

      gegnerRudel:

        rudelHolen(

          rechtsProfil

        ),

      erstellt:

        Date.now(),

    }

  );

  if (

    gegner.toLowerCase() ===

    "fuchsmissvegetalover2_0"

  ) {

    return await kampfAnnehmen(

      gegner

    );

  }

  aktuellerPvpKampf = {

    status:

      "waiting",

    typ:

      "rudel",

    herausforderer:

      username,

    gegner:

      gegner,

    gestartet:

      Date.now(),

  };

  return (

    `⚔️ @${username} fordert @${gegner} zum Rudel-PvP heraus! @${gegner} hat 60 Sekunden Zeit mit !annehmen zu antworten!`

  );

}

async function kampfAnnehmen(

  username

) {

  const kampf =

    offeneKaempfe.get(

      username.toLowerCase()

    );

  if (!kampf) {

    return null;

  }

  if (

    Date.now() -

      kampf.erstellt >

    60000

  ) {

    offeneKaempfe.delete(

      username.toLowerCase()

    );

    aktuellerPvpKampf =

      null;

    return (

      `@${username} Die Herausforderung ist abgelaufen.`

    );

  }

  offeneKaempfe.delete(

    username.toLowerCase()

  );

  const gewinner =

    Math.random() < 0.5

      ? kampf.herausforderer

      : username;

  const verlierer =

    gewinner ===

      kampf.herausforderer

      ? username

      : kampf.herausforderer;

  const istPokemon =

    kampf.typ ===

    "pokemon";

  const linksProfil =

    await spielerProfilHolen(

      kampf.herausforderer

    );

  const rechtsProfil =

    await spielerProfilHolen(

      username

    );

  let linksRudel =

    linksProfil?.rudel ||

    "🐺 Noch kein Rudel";

  let rechtsRudel =

    rechtsProfil?.rudel ||

    "🐺 Noch kein Rudel";

  let linksPokemon =

    linksProfil?.pokemon ||

    null;

  let rechtsPokemon =

    rechtsProfil?.pokemon ||

    null;

  if (istPokemon) {

    linksPokemon =

      linksPokemon ||

      await pokemonHolen(

        kampf.herausforderer

      );

    rechtsPokemon =

      rechtsPokemon ||

      await pokemonHolen(

        username

      );

    if (

      !linksPokemon ||

      !rechtsPokemon

    ) {

      return (

        `@${username} 🐾 Für einen Pokémon-Kampf müssen beide Spieler ein Pokémon gewählt haben.`

      );

    }

  }

  aktuellerPvpKampf = {

    status:

      "fight",

    typ:

      kampf.typ,

    id:

      `${Date.now()}-${Math.random()

        .toString(36)

        .slice(2)}`,

    herausforderer:

      kampf.herausforderer,

    gegner:

      username,

    linksRudel:

      kampf.herausfordererRudel ||

      linksRudel,

    rechtsRudel:

      kampf.gegnerRudel ||

      rechtsRudel,

    linksPokemon:

      kampf.herausfordererPokemon ||

      linksPokemon,

    rechtsPokemon:

      kampf.gegnerPokemon ||

      rechtsPokemon,

    gewinner:

      gewinner,

    verlierer:

      verlierer,

    gestartet:

      Date.now(),

  };

  await rpc(

    "fuchs_xp_hinzufuegen",

    {

      spieler_name:

        gewinner,

      xp_menge:

        100,

    }

  );

  try {

    const sieg =

      await supabase(

        `/rest/v1/fuchsprofile` +

        `?spieler=eq.${encodeURIComponent(

          gewinner

        )}` +

        `&select=pvp_siege&limit=1`

      );

    await supabase(

      `/rest/v1/fuchsprofile` +

      `?spieler=eq.${encodeURIComponent(

        gewinner

      )}`,

      {

        method:

          "PATCH",

        body:

          JSON.stringify({

            pvp_siege:

              Number(

                sieg?.[0]?.pvp_siege ||

                0

              ) + 1,

          }),

      }

    );

    const niederlage =

      await supabase(

        `/rest/v1/fuchsprofile` +

        `?spieler=eq.${encodeURIComponent(

          verlierer

        )}` +

        `&select=pvp_niederlagen&limit=1`

      );

    await supabase(

      `/rest/v1/fuchsprofile` +

      `?spieler=eq.${encodeURIComponent(

        verlierer

      )}`,

      {

        method:

          "PATCH",

        body:

          JSON.stringify({

            pvp_niederlagen:

              Number(

                niederlage?.[0]?.pvp_niederlagen ||

                0

              ) + 1,

          }),

      }

    );

  } catch (error) {

    console.error(

      "❌ PvP-Statistik:",

      error.message

    );

  }

  if (istPokemon) {

    return (

      `🐾⚔️ POKÉMON-KAMPF! @${kampf.herausforderer} ${linksPokemon} 🆚 ${rechtsPokemon} @${username} | 🏆 Gewinner: @${gewinner}! +100 FuchsXP 🦊 | 💀 @${verlierer} verliert.`

    );

  }

  return (

    `⚔️ RUDEL-PVP! @${kampf.herausforderer} ${linksRudel} 🆚 ${rechtsRudel} @${username} | 🏆 Gewinner: @${gewinner}! +100 FuchsXP 🦊 | 💀 @${verlierer} verliert.`

  );

}
let streamElementsSocket =
  null;

function streamElementsVerbinden() {
  try {
    streamElementsSocket =
      new WebSocket(
        "wss://astro.streamelements.com/"
      );

    streamElementsSocket.on(
      "open",
      () => {
        console.log(
          "🔌 StreamElements WebSocket verbunden."
        );
      }
    );

    streamElementsSocket.on(
      "message",
      async raw => {
        try {
          const message =
            JSON.parse(
              raw.toString()
            );

          if (
            message.type ===
            "welcome"
          ) {
            const subscribeMessage = {
              type: "subscribe",
              nonce: `fuchs-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}`,
              data: {
                topic:
                  "channel.chat.message",
                token:
                  STREAMELEMENTS_JWT,
                token_type:
                  "jwt",
              },
            };

            streamElementsSocket.send(
              JSON.stringify(
                subscribeMessage
              )
            );

            console.log(
              "📡 StreamElements Chat-Topic wird abonniert."
            );

            return;
          }

          if (
            message.type ===
            "response"
          ) {
            if (message.error) {
              console.error(
                "❌ StreamElements Abo-Fehler:",
                message.error
              );
            } else {
              console.log(
                "✅ StreamElements Chat-Topic bestätigt."
              );
            }

            return;
          }

          await chatVerarbeiten(
            message
          );
        } catch (error) {
          console.error(
            "❌ WebSocket Nachricht:",
            error.message
          );
        }
      }
    );

    streamElementsSocket.on(
      "close",
      (code, reason) => {
        console.log(
          `🔌 StreamElements WebSocket getrennt (${code}) ${reason?.toString?.() || ""}`
        );

        setTimeout(
          streamElementsVerbinden,
          5000
        );
      }
    );

    streamElementsSocket.on(
      "error",
      error => {
        console.error(
          "❌ StreamElements WebSocket:",
          error.message
        );
      }
    );
  } catch (error) {
    console.error(
      "❌ WebSocket Verbindung:",
      error.message
    );

    setTimeout(
      streamElementsVerbinden,
      5000
    );
  }
}

const PORT =
  process.env.PORT ||
  10000;

server.listen(
  PORT,
  () => {
    console.log(
      `🦊 Fuchs-XP-Bot gestartet auf Port ${PORT}`
    );

    console.log(
      `🌐 PvP-Overlay: /pvp`
    );

    streamElementsVerbinden();
  }
);
