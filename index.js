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
    apikey:
      SUPABASE_SERVICE_ROLE_KEY,

    Authorization:
      `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,

    "Content-Type":
      "application/json",

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


/* =====================================================
   STREAM ELEMENTS
   ===================================================== */

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

    if (
      !channelResponse.ok
    ) {
      console.error(
        `❌ StreamElements Channel-ID ${channelResponse.status}: ${channelBody}`
      );

      return false;
    }

    const channelData =
      JSON.parse(channelBody);

    const channelId =
      channelData?._id;

    if (!channelId) {
      console.error(
        "❌ StreamElements Channel-ID konnte nicht ermittelt werden."
      );

      return false;
    }

    console.log(
      `✅ StreamElements Channel-ID gefunden: ${channelId}`
    );

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

          body:
            JSON.stringify({
              message:
                String(text),
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
      "❌ StreamElements senden:",
      error.message
    );

    return false;
  }
}


/* =====================================================
   AKTIVITÄT
   ===================================================== */

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


/* =====================================================
   NORMALE QUESTS
   ===================================================== */

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
}const persoenlicheQuests = {
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


/* =====================================================
   PERSÖNLICHE QUESTS
   ===================================================== */

const persoenlicheQuestStatus =
  new Map();

function persoenlicheQuestStatusHolen(
  username
) {
  let status =
    persoenlicheQuestStatus.get(
      username
    );

  if (
    !status ||
    (
      !status.abgeschlossen &&
      Date.now() -
        status.gestartet >
        60000
    )
  ) {
    const nummer =
      6 +
      Math.floor(
        Math.random() *
        Object.keys(
          persoenlicheQuests
        ).length
      );

    status = {
      quest_nummer:
        nummer,

      fortschritt:
        0,

      gestartet:
        Date.now(),

      abgeschlossen:
        false,
    };

    persoenlicheQuestStatus.set(
      username,
      status
    );
  }

  return status;
}


async function persoenlicheQuestsAnlegen(
  username
) {
  persoenlicheQuestStatusHolen(
    username
  );
}


async function persoenlicheQuestsHolen(
  username
) {
  return [
    persoenlicheQuestStatusHolen(
      username
    ),
  ];
}


async function persoenlicheQuestAnzeigen(
  username
) {
  try {

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

    const quest =
      persoenlicheQuests[
        Number(
          aktive.quest_nummer
        )
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


async function persoenlicheQuestPruefen(
  username,
  text
) {
  try {

    const status =
      persoenlicheQuestStatusHolen(
        username
      );

    if (
      status.abgeschlossen ||
      !text
    ) {
      return;
    }

    const quest =
      persoenlicheQuests[
        Number(
          status.quest_nummer
        )
      ];

    if (!quest) {
      return;
    }

    if (
      text.trim().toLowerCase() !==
      quest.wort.toLowerCase()
    ) {
      return;
    }

    status.fortschritt +=
      1;

    if (
      status.fortschritt >=
      quest.ziel
    ) {

      status.abgeschlossen =
        true;

      await streamelementsSenden(
        `@${username} 🎉 Persönliche Quest geschafft! +10 FuchsXP 🦊`
      );

      try {

        await rpc(
          "fuchs_xp_hinzufuegen",
          {
            spieler_name:
              username,

            xp_menge:
              10,
          }
        );

      } catch (xpError) {

        console.error(
          "❌ Persönliche Quest XP:",
          xpError.message
        );
      }
    }

  } catch (error) {

    console.error(
      "❌ Persönliche Quest prüfen:",
      error.message
    );
  }
}


/* =====================================================
   PVP / POKÉMON
   ===================================================== */

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

    return rows?.[0] ||
      null;

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
      verfuegbarePokemon.filter(
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
  }  try {
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
      typ:
        "rudel",
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
    Math.random() <
    0.5
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
      `/rest/v1/fuchsprofile?spieler=eq.${encodeURIComponent(
        gewinner
      )}`,
      {
        method:
          "PATCH",
        body:
          JSON.stringify({
            pvp_siege:
              Number(
                sieg?.[0]
                  ?.pvp_siege ||
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
      `/rest/v1/fuchsprofile?spieler=eq.${encodeURIComponent(
        verlierer
      )}`,
      {
        method:
          "PATCH",
        body:
          JSON.stringify({
            pvp_niederlagen:
              Number(
                niederlage?.[0]
                  ?.pvp_niederlagen ||
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

async function pokemonKampfStart(
  username,
  gegner
) {
  if (
    !gegner ||
    gegner.toLowerCase() ===
      username.toLowerCase()
  ) {
    return (
      `@${username} Du kannst dich nicht selbst zum Pokémon-Kampf herausfordern.`
    );
  }

  const linksPokemon =
    await pokemonHolen(
      username
    );

  const rechtsPokemon =
    await pokemonHolen(
      gegner
    );

  if (!linksPokemon) {
    return (
      `@${username} 🐾 Du hast noch kein Pokémon gewählt. Schreibe !pokemon für die Auswahl.`
    );
  }

  if (!rechtsPokemon) {
    return (
      `@${username} 🐾 @${gegner} hat noch kein Pokémon gewählt.`
    );
  }

  offeneKaempfe.set(
    gegner.toLowerCase(),
    {
      typ:
        "pokemon",
      herausforderer:
        username,
      gegner:
        gegner,
      herausfordererPokemon:
        linksPokemon,
      gegnerPokemon:
        rechtsPokemon,
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
      "pokemon",
    herausforderer:
      username,
    gegner:
      gegner,
    herausfordererPokemon:
      linksPokemon,
    gegnerPokemon:
      rechtsPokemon,
    gestartet:
      Date.now(),
  };

  return (
    `🐾⚔️ @${username} fordert @${gegner} zum Pokémon-Kampf heraus! @${gegner} hat 60 Sekunden Zeit mit !annehmen zu antworten!`
  );
}async function pvpAnnehmen(
  username
) {
  return kampfAnnehmen(
    username
  );
}

async function profil(
  username
) {
  try {
    const p =
      await spielerProfilHolen(
        username
      );

    if (!p) {
      return (
        `@${username} 🦊 Dein Profil wurde noch nicht gefunden.`
      );
    }

    const pokemon =
      await pokemonHolen(
        username
      );

    return (
      `@${username} 🦊 Profil | XP: ${
        p.xp || 0
      } | Rudel: ${
        p.rudel ||
        "noch nicht gewählt"
      } | Pokémon: ${
        pokemon ||
        "noch nicht gewählt"
      } | PvP-Siege: ${
        p.pvp_siege || 0
      } | PvP-Niederlagen: ${
        p.pvp_niederlagen ||
        0
      }`
    );
  } catch (error) {
    console.error(
      "❌ Profil:",
      error.message
    );

    return (
      `@${username} ❌ Dein Profil konnte nicht geladen werden.`
    );
  }
}

const rudelMap = {
  feuer:
    "🔥 Feuerrudel",
  wasser:
    "🌊 Wasserrudel",
  wald:
    "🌲 Waldrudel",
  ice:
    "🧊 ICErudel",
};

async function rudelwahl(
  username,
  auswahl
) {
  if (!auswahl) {
    return (
      `@${username} 🐺 Wähle dein Rudel: !rudelwahl Feuer | !rudelwahl Wasser | !rudelwahl Wald | !rudelwahl ICE`
    );
  }

  const key =
    auswahl
      .trim()
      .toLowerCase();

  const rudel =
    rudelMap[key];

  if (!rudel) {
    return (
      `@${username} ❌ Dieses Rudel gibt es nicht. Wähle Feuer, Wasser, Wald oder ICE.`
    );
  }

  try {
    await supabase(
      "/rest/v1/fuchsprofile?on_conflict=spieler",
      {
        method:
          "POST",
        headers: {
          Prefer:
            "resolution=merge-duplicates",
        },
        body:
          JSON.stringify({
            spieler:
              username,
            rudel:
              rudel,
          }),
      }
    );

    return (
      `@${username} 🐺 Du bist jetzt im ${rudel}!`
    );
  } catch (error) {
    console.error(
      "❌ Rudel speichern:",
      error.message
    );

    return (
      `@${username} ❌ Dein Rudel konnte nicht gespeichert werden.`
    );
  }
}

async function persoenlicheQuestPruefen(
  username,
  text
) {
  try {
    await persoenlicheQuestsAnlegen(
      username
    );

    const vorher =
      await persoenlicheQuestsHolen(
        username
      );

    const aktiveVorher =
      vorher.find(
        q => !q.abgeschlossen
      );

    if (!aktiveVorher) {
      return;
    }

    const nummer =
      Number(
        aktiveVorher.quest_nummer
      );

    const quest =
      persoenlicheQuests[
        nummer
      ];

    if (!quest) {
      return;
    }

    const wort =
      quest.wort.toLowerCase();

    const nachricht =
      text.toLowerCase();

    if (
      !nachricht.includes(
        wort
      )
    ) {
      return;
    }

    await rpc(
      "persoenliche_quest_pruefen",
      {
        spieler_name:
          username,
        nachricht:
          text,
      }
    );

    const nachher =
      await persoenlicheQuestsHolen(
        username
      );

    const aktiveNachher =
      nachher.find(
        q =>
          Number(
            q.quest_nummer
          ) === nummer
      );

    if (
      aktiveNachher &&
      aktiveNachher.abgeschlossen &&
      !aktiveVorher.abgeschlossen
    ) {
      await rpc(
        "fuchs_xp_hinzufuegen",
        {
          spieler_name:
            username,
          xp_menge:
            10,
        }
      );

      await streamelementsSenden(
        `@${username} 🎉 Persönliche Quest geschafft! +10 FuchsXP 🦊`
      );
    }
  } catch (error) {
    console.error(
      "❌ Persönliche Quest:",
      error.message
    );
  }
}

async function alleBefehle(
  username
) {
  await streamelementsSenden(
    `@${username} 🦊 Befehle: !profil | !rudelwahl Feuer/Wasser/Wald/ICE | !pokemon | !pokemon Name | !quest | !pvp @Name | !pokekampf @Name | !annehmen | !allebefehle`
  );
}

async function chatVerarbeiten(
  message
) {
  if (
    message.type ===
    "response"
  ) {
    return;
  }

  if (
    message.type !==
    "message"
  ) {
    return;
  }

  if (
    message.topic !==
    "channel.chat.message"
  ) {
    return;
  }

  const data =
    message.data;

  const broadcasterChannel =
    data?.broadcaster_user_login ||
    data?.broadcaster_user_name ||
    data?.broadcaster?.username ||
    data?.broadcaster?.channel_slug;

  if (broadcasterChannel) {
    streamElementsChannel =
      broadcasterChannel.toLowerCase();
  }

  const usernameRaw =
    data?.chatter_user_name ||
    data?.chatter_user_login ||
    data?.sender?.user_name ||
    data?.sender?.username ||
    data?.username ||
    data?.user?.name;

  if (!usernameRaw) {
    return;
  }

  const username =
    usernameRaw
      .trim()
      .toLowerCase();

  if (
    username ===
    "streamelements"
  ) {
    return;
  }

  const text =
    data?.message?.text ||
    data?.text ||
    "";

  console.log(
    `💬 ${username}: ${text}`
  );

  await aktivitaetSpeichern(
    username
  );

  const pvpMatch =
    text.match(
      /^!pvp\s+@?([a-zA-Z0-9_]+)$/i
    );

  if (pvpMatch) {
    const antwort =
      await pvpStart(
        username,
        pvpMatch[1]
      );

    if (antwort) {
      await streamelementsSenden(
        antwort
      );
    }

    return;
  }

  const pokemonMatch =
    text.match(
      /^!pokemon(?:\s+(.+))?$/i
    );

  if (pokemonMatch) {
    await streamelementsSenden(
      await pokemonWahl(
        username,
        pokemonMatch[1]
      )
    );

    return;
  }

  const pokemonKampfMatch =
    text.match(
      /^!pokekampf\s+@?([a-zA-Z0-9_]+)$/i
    );

  if (pokemonKampfMatch) {
    const antwort =
      await pokemonKampfStart(
        username,
        pokemonKampfMatch[1]
      );

    if (antwort) {
      await streamelementsSenden(
        antwort
      );
    }

    return;
  }

  if (
    /^!annehmen$/i.test(
      text.trim()
    )
  ) {
    const antwort =
      await kampfAnnehmen(
        username
      );

    if (antwort) {
      await streamelementsSenden(
        antwort
      );
    }

    return;
  }

  if (
    /^!profil$/i.test(
      text.trim()
    )
  ) {
    await streamelementsSenden(
      await profil(
        username
      )
    );

    return;
  }

  const rudelMatch =
    text.match(
      /^!rudelwahl\s+(.+)$/i
    );

  if (rudelMatch) {
    await streamelementsSenden(
      await rudelwahl(
        username,
        rudelMatch[1]
      )
    );

    return;
  }

  if (
    /^!quest$/i.test(
      text.trim()
    )
  ) {
    await persoenlicheQuestAnzeigen(
      username
    );

    return;
  }

  if (
    /^!allebefehle$/i.test(
      text.trim()
    )
  ) {
    await alleBefehle(
      username
    );

    return;
  }

  await questsPruefen(
    username,
    text
  );

  await persoenlicheQuestPruefen(
    username,
    text
  );
}  const server =
    http.createServer(
      async (req, res) => {
        try {
          if (
            req.url ===
            "/pvp"
          ) {
            res.writeHead(
              200,
              {
                "Content-Type":
                  "text/html; charset=utf-8",
              }
            );

            res.end(`
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
/>
<title>Fuchs PvP</title>
<style>
* {
  box-sizing:
    border-box;
}
html,
body {
  margin:
    0;
  padding:
    0;
  width:
    100%;
  height:
    100%;
  overflow:
    hidden;
  background:
    transparent;
  font-family:
    Arial,
    sans-serif;
}
#kampf {
  width:
    100%;
  height:
    100%;
  display:
    flex;
  align-items:
    center;
  justify-content:
    center;
  opacity:
    0;
  transition:
    opacity
    0.5s
    ease;
}
.box {
  width:
    92%;
  max-width:
    1000px;
  padding:
    28px;
  border-radius:
    28px;
  background:
    rgba(
      20,
      20,
      30,
      0.94
    );
  border:
    3px solid
    rgba(
      255,
      255,
      255,
      0.18
    );
  box-shadow:
    0 0 35px
    rgba(
      0,
      0,
      0,
      0.65
    );
  color:
    white;
  text-align:
    center;
}
.titel {
  font-size:
    38px;
  font-weight:
    900;
  margin-bottom:
    24px;
}
.kaempfer {
  display:
    flex;
  align-items:
    center;      }
    }

    document
      .getElementById(
        "kampf"
      )
      .style.opacity = 1;

  } catch (error) {

    console.error(
      "Overlay:",
      error
    );

  }

}

setInterval(
  datenLaden,
  1000
);

datenLaden();

</script>

</body>
</html>
          `);

          return;
        }

        if (
          req.url ===
          "/pvp-data"
        ) {

          res.writeHead(
            200,
            {
              "Content-Type":
                "application/json; charset=utf-8",
              "Cache-Control":
                "no-cache, no-store, must-revalidate",
            }
          );

          res.end(
            JSON.stringify(
              aktuellerPvpKampf ||
              {
                status:
                  "hidden",
              }
            )
          );

          return;
        }

        if (
          req.url ===
          "/"
        ) {

          res.writeHead(
            200,
            {
              "Content-Type":
                "text/plain; charset=utf-8",
            }
          );

          res.end(
            "🦊 Fuchs-XP-Bot läuft!"
          );

          return;
        }

        res.writeHead(
          404,
          {
            "Content-Type":
              "text/plain; charset=utf-8",
          }
        );

        res.end(
          "404"
        );

      } catch (error) {

        console.error(
          "❌ HTTP-Fehler:",
          error.message
        );

        res.writeHead(
          500,
          {
            "Content-Type":
              "text/plain; charset=utf-8",
          }
        );

        res.end(
          "500"
        );

      }
    }
  );

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
            const subscribeMessage =
              {
                type:
                  "subscribe",
                nonce:
                  `fuchs-${Date.now()}-${Math.random()
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
            if (
              message.error
            ) {
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
      (
        code,
        reason
      ) => {
        console.log(
          `🔌 StreamElements WebSocket getrennt (${code}) ${
            reason?.toString?.() || ""
          }`
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

// Ende der index.js
/* =====================================================
   QUESTS / PERSÖNLICHE QUESTS
===================================================== */

async function questFortschrittPruefen(
  username,
  text
) {
  try {
    await rpc(
      "quest_nachricht_verarbeiten",
      {
        p_username:
          normalisieren(username),

        p_nachricht:
          String(text || ""),
      }
    );
  } catch (error) {
    console.error(
      "❌ Quest-Verarbeitung:",
      error.message
    );
  }
}


/* =====================================================
   PERSÖNLICHE QUEST-STATUS
===================================================== */

const persoenlicheQuestStatus =
  new Map();

const persoenlicheQuestVorlagen =
  [
    {
      text:
        "Schreibe 5 Nachrichten im Chat.",
      ziel:
        5,
      xp:
        50,
    },

    {
      text:
        "Schreibe 10 Nachrichten im Chat.",
      ziel:
        10,
      xp:
        100,
    },

    {
      text:
        "Schreibe 20 Nachrichten im Chat.",
      ziel:
        20,
      xp:
        200,
    },
  ];

function persoenlicheQuestStatusHolen(
  username
) {
  username =
    normalisieren(username);

  let status =
    persoenlicheQuestStatus.get(
      username
    );

  if (!status) {
    const vorlage =
      persoenlicheQuestVorlagen[
        zufall(
          0,
          persoenlicheQuestVorlagen.length -
            1
        )
      ];

    status =
      {
        text:
          vorlage.text,

        ziel:
          vorlage.ziel,

        xp:
          vorlage.xp,

        fortschritt:
          0,

        abgeschlossen:
          false,
      };

    persoenlicheQuestStatus.set(
      username,
      status
    );
  }

  return status;
}


async function persoenlicheQuestAnzeigen(
  username
) {
  username =
    normalisieren(username);

  const quest =
    persoenlicheQuestStatusHolen(
      username
    );

  if (
    quest.abgeschlossen
  ) {
    await streamelementsSenden(
      `🎯 @${username} deine persönliche Quest ist bereits abgeschlossen!`
    );

    return;
  }

  await streamelementsSenden(
    `🎯 @${username} persönliche Quest: ${quest.text} (${quest.fortschritt}/${quest.ziel}) – Belohnung: ${quest.xp} XP`
  );
}


async function persoenlicheQuestPruefen(
  username,
  text
) {
  username =
    normalisieren(username);

  const quest =
    persoenlicheQuestStatusHolen(
      username
    );

  if (
    quest.abgeschlossen
  ) {
    return;
  }

  quest.fortschritt++;

  if (
    quest.fortschritt >=
    quest.ziel
  ) {
    quest.fortschritt =
      quest.ziel;

    quest.abgeschlossen =
      true;

    persoenlicheQuestStatus.set(
      username,
      quest
    );

    await xpHinzufuegen(
      username,
      quest.xp
    );

    await streamelementsSenden(
      `🎉 @${username} persönliche Quest abgeschlossen! +${quest.xp} XP`
    );

    return;
  }

  persoenlicheQuestStatus.set(
    username,
    quest
  );
}


/* =====================================================
   NORMALE QUESTS
===================================================== */

async function questsPruefen(
  username,
  text
) {
  try {
    await questFortschrittPruefen(
      username,
      text
    );
  } catch (error) {
    console.error(
      "❌ Normale Quest Prüfung:",
      error.message
    );
  }
}
/* =====================================================
   PVP / POKÉMON-KAMPF
===================================================== */

const offeneKaempfe =
  new Map();

let aktuellerPvpKampf =
  null;


async function pvpProfil(
  username
) {
  username =
    normalisieren(username);

  const daten =
    await supabase(
      `/rest/v1/fuchsprofile?username=eq.${encodeURIComponent(username)}&select=username,rudel,xp,pvp_siege,pvp_niederlagen,pokemon`
    );

  return (
    daten &&
    daten.length
      ? daten[0]
      : null
  );
}


/* =====================================================
   RUDEL-PVP STARTEN
===================================================== */

async function pvpStart(
  angreifer,
  verteidiger
) {
  angreifer =
    normalisieren(
      angreifer
    );

  verteidiger =
    normalisieren(
      verteidiger
    );

  if (
    !verteidiger ||
    verteidiger ===
      angreifer
  ) {
    return "❌ Nutze !pvp @Name";
  }

  await aktivitaetSpeichern(
    angreifer
  );

  await aktivitaetSpeichern(
    verteidiger
  );

  const a =
    await pvpProfil(
      angreifer
    );

  const v =
    await pvpProfil(
      verteidiger
    );

  if (!a || !v) {
    return "❌ Ein Profil konnte nicht geladen werden.";
  }

  if (!a.rudel) {
    return `❌ @${angreifer} muss zuerst ein Rudel mit !rudelwahl wählen.`;
  }

  if (!v.rudel) {
    return `❌ @${verteidiger} hat noch kein Rudel.`;
  }

  if (
    offeneKaempfe.size
  ) {
    return "⚔️ Es läuft bereits eine Kampf-Anfrage.";
  }

  const kampf =
    {
      angreifer,
      verteidiger,
      typ:
        "rudel",
      erstellt:
        Date.now(),
    };

  offeneKaempfe.set(
    verteidiger,
    kampf
  );

  if (
    verteidiger ===
    "fuchsmissvegetalover2_0"
  ) {
    return await kampfAnnehmen(
      verteidiger
    );
  }

  return (
    `⚔️ @${angreifer} fordert @${verteidiger} ` +
    `zum Rudel-Kampf heraus! @${verteidiger} ` +
    `kann mit !annehmen annehmen.`
  );
}


/* =====================================================
   POKÉMON-KAMPF STARTEN
===================================================== */

async function pokemonKampfStart(
  angreifer,
  verteidiger
) {
  angreifer =
    normalisieren(
      angreifer
    );

  verteidiger =
    normalisieren(
      verteidiger
    );

  if (
    !verteidiger ||
    verteidiger ===
      angreifer
  ) {
    return "❌ Nutze !pokekampf @Name";
  }

  await aktivitaetSpeichern(
    angreifer
  );

  await aktivitaetSpeichern(
    verteidiger
  );

  const a =
    await pvpProfil(
      angreifer
    );

  const v =
    await pvpProfil(
      verteidiger
    );

  if (!a || !v) {
    return "❌ Ein Profil konnte nicht geladen werden.";
  }

  if (!a.pokemon) {
    return `❌ @${angreifer} hat noch kein Pokémon.`;
  }

  if (!v.pokemon) {
    return `❌ @${verteidiger} hat noch kein Pokémon.`;
  }

  if (
    offeneKaempfe.size
  ) {
    return "⚔️ Es läuft bereits eine Kampf-Anfrage.";
  }

  const kampf =
    {
      angreifer,
      verteidiger,
      typ:
        "pokemon",
      erstellt:
        Date.now(),
    };

  offeneKaempfe.set(
    verteidiger,
    kampf
  );

  if (
    verteidiger ===
    "fuchsmissvegetalover2_0"
  ) {
    return await kampfAnnehmen(
      verteidiger
    );
  }

  return (
    `⚡ @${angreifer} fordert @${verteidiger} ` +
    `zum Pokémon-Kampf heraus! @${verteidiger} ` +
    `kann mit !annehmen annehmen.`
  );
}


/* =====================================================
   KAMPF ANNEHMEN
===================================================== */

async function kampfAnnehmen(
  username
) {
  username =
    normalisieren(username);

  const kampf =
    offeneKaempfe.get(
      username
    );

  if (!kampf) {
    return "❌ Für dich gibt es keinen offenen Kampf.";
  }

  if (
    Date.now() -
      kampf.erstellt >
    60000
  ) {
    offeneKaempfe.delete(
      username
    );

    return "⌛ Die Kampf-Anfrage ist abgelaufen.";
  }

  offeneKaempfe.delete(
    username
  );

  const angreifer =
    await pvpProfil(
      kampf.angreifer
    );

  const verteidiger =
    await pvpProfil(
      kampf.verteidiger
    );

  if (
    !angreifer ||
    !verteidiger
  ) {
    return "❌ Kampf konnte nicht gestartet werden.";
  }

  if (
    kampf.typ ===
    "pokemon"
  ) {
    if (
      !angreifer.pokemon ||
      !verteidiger.pokemon
    ) {
      return "❌ Beide Spieler brauchen ein Pokémon.";
    }
  }

  const gewinner =
    Math.random() < 0.5
      ? angreifer
      : verteidiger;

  const verlierer =
    gewinner.username ===
    angreifer.username
      ? verteidiger
      : angreifer;

  aktuellerPvpKampf =
    {
      ...kampf,

      gewinner:
        gewinner.username,

      verlierer:
        verlierer.username,

      gestartet:
        Date.now(),
    };

  await xpHinzufuegen(
    gewinner.username,
    100
  );

  try {
    await supabase(
      `/rest/v1/fuchsprofile?username=eq.${encodeURIComponent(
        gewinner.username
      )}`,
      {
        method:
          "PATCH",

        body:
          JSON.stringify({
            pvp_siege:
              Number(
                gewinner.pvp_siege ||
                  0
              ) + 1,
          }),
      }
    );

    await supabase(
      `/rest/v1/fuchsprofile?username=eq.${encodeURIComponent(
        verlierer.username
      )}`,
      {
        method:
          "PATCH",

        body:
          JSON.stringify({
            pvp_niederlagen:
              Number(
                verlierer.pvp_niederlagen ||
                  0
              ) + 1,
          }),
      }
    );
  } catch (error) {
    console.error(
      "❌ PvP Statistik Fehler:",
      error.message
    );
  }

  if (
    kampf.typ ===
    "pokemon"
  ) {
    return (
      `⚡ POKÉMON-KAMPF! ` +
      `@${angreifer.username} ${angreifer.pokemon} ⚔️ ` +
      `@${verteidiger.username} ${verteidiger.pokemon} ` +
      `→ 🏆 @${gewinner.username} gewinnt +100 XP!`
    );
  }

  return (
    `⚔️ RUDEL-KAMPF! ` +
    `@${angreifer.username} [${angreifer.rudel}] ⚔️ ` +
    `@${verteidiger.username} [${verteidiger.rudel}] ` +
    `→ 🏆 @${gewinner.username} gewinnt +100 XP!`
  );
}
/* =====================================================
   CHAT VERARBEITEN
===================================================== */

async function chatVerarbeiten(message) {
  if (message.type === "response") return;
  if (message.type !== "message") return;
  if (message.topic !== "channel.chat.message") return;

  const data = message.data;

  const broadcasterChannel =
    data?.broadcaster_user_login ||
    data?.broadcaster_user_name ||
    data?.broadcaster?.username ||
    data?.broadcaster?.channel_slug;

  if (broadcasterChannel) {
    streamElementsChannel =
      broadcasterChannel.toLowerCase();
  }

  const usernameRaw =
    data?.chatter_user_name ||
    data?.chatter_user_login ||
    data?.sender?.user_name ||
    data?.sender?.username ||
    data?.username ||
    data?.user?.name;

  if (!usernameRaw) return;

  const username =
    usernameRaw.trim().toLowerCase();

  if (username === "streamelements") return;

  const text =
    data?.message?.text ||
    data?.text ||
    "";

  console.log(`💬 ${username}: ${text}`);

  await aktivitaetSpeichern(username);

  const pvpMatch =
    text.match(
      /^!pvp\s+@?([a-zA-Z0-9_]+)$/i
    );

  if (pvpMatch) {
    const antwort =
      await pvpStart(
        username,
        pvpMatch[1]
      );

    if (antwort) {
      await streamelementsSenden(antwort);
    }

    return;
  }

  const pokemonMatch =
    text.match(
      /^!pokemon(?:\s+(.+))?$/i
    );

  if (pokemonMatch) {
    await streamelementsSenden(
      await pokemonWahl(
        username,
        pokemonMatch[1]
      )
    );

    return;
  }

  const pokemonKampfMatch =
    text.match(
      /^!pokekampf\s+@?([a-zA-Z0-9_]+)$/i
    );

  if (pokemonKampfMatch) {
    const antwort =
      await pokemonKampfStart(
        username,
        pokemonKampfMatch[1]
      );

    if (antwort) {
      await streamelementsSenden(antwort);
    }

    return;
  }

  if (
    /^!annehmen$/i.test(
      text.trim()
    )
  ) {
    const antwort =
      await kampfAnnehmen(username);

    if (antwort) {
      await streamelementsSenden(antwort);
    }

    return;
  }

  if (
    /^!profil$/i.test(
      text.trim()
    )
  ) {
    await streamelementsSenden(
      await profil(username)
    );

    return;
  }

  const rudelMatch =
    text.match(
      /^!rudelwahl\s+(.+)$/i
    );

  if (rudelMatch) {
    await streamelementsSenden(
      await rudelwahl(
        username,
        rudelMatch[1]
      )
    );

    return;
  }

  if (
    /^!quest$/i.test(
      text.trim()
    )
  ) {
    await persoenlicheQuestAnzeigen(username);
    return;
  }

  if (
    /^!allebefehle$/i.test(
      text.trim()
    )
  ) {
    await alleBefehle(username);
    return;
  }

  await questsPruefen(
    username,
    text
  );

  await persoenlicheQuestPruefen(
    username,
    text
  );
}


/* =====================================================
   HTTP SERVER / PVP OVERLAY
===================================================== */

const server =
  http.createServer(
    async (req, res) => {
      try {
        if (req.url === "/") {
          res.writeHead(
            200,
            {
              "Content-Type":
                "text/plain; charset=utf-8"
            }
          );

          res.end(
            "🦊 Fuchs-XP-Bot läuft!"
          );

          return;
        }

        if (req.url === "/pvp") {
          res.writeHead(
            200,
            {
              "Content-Type":
                "text/html; charset=utf-8"
            }
          );

          res.end(`<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Fuchs PvP</title>

<style>
html,body{
  margin:0;
  padding:0;
  width:100%;
  height:100%;
  overflow:hidden;
  background:transparent;
  font-family:Arial,sans-serif;
}

#app{
  width:100%;
  height:100%;
  display:flex;
  align-items:center;
  justify-content:center;
}

.card{
  min-width:700px;
  max-width:90vw;
  padding:28px;
  border-radius:24px;
  background:rgba(20,20,20,.92);
  color:white;
  text-align:center;
  box-shadow:0 0 30px rgba(0,0,0,.5);
}

.title{
  font-size:38px;
  font-weight:900;
  margin-bottom:25px;
}

.fighters{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:30px;
}

.fighter{
  min-width:250px;
  padding:20px;
  border-radius:18px;
  background:rgba(255,255,255,.08);
}

.name{
  font-size:27px;
  font-weight:800;
}

.detail{
  margin-top:10px;
  font-size:22px;
}

.vs{
  font-size:40px;
  font-weight:900;
}

.winner{
  margin-top:25px;
  font-size:28px;
  font-weight:900;
}
</style>
</head>

<body>

<div id="app"></div>

<script>
async function laden(){
  try{
    const response =
      await fetch("/pvp-data");

    const data =
      await response.json();

    const app =
      document.getElementById("app");

    if(!data || !data.kampf){
      app.innerHTML="";
      return;
    }

    const kampf =
      data.kampf;

    const pokemon =
      kampf.typ === "pokemon";

    const title =
      pokemon
        ? "🐾 POKÉMON-KAMPF 🐾"
        : "⚔️ RUDEL-KAMPF ⚔️";

    const detail1 =
      pokemon
        ? (kampf.angreiferPokemon || "")
        : (kampf.angreiferRudel || "");

    const detail2 =
      pokemon
        ? (kampf.verteidigerPokemon || "")
        : (kampf.verteidigerRudel || "");

    app.innerHTML =
      \`
      <div class="card">

        <div class="title">
          \${title}
        </div>

        <div class="fighters">

          <div class="fighter">
            <div class="name">
              @\${kampf.angreifer}
            </div>

            <div class="detail">
              \${detail1}
            </div>
          </div>

          <div class="vs">
            ⚔️
          </div>

          <div class="fighter">
            <div class="name">
              @\${kampf.verteidiger}
            </div>

            <div class="detail">
              \${detail2}
            </div>
          </div>

        </div>

        <div class="winner">
          🏆 @\${kampf.gewinner}
        </div>

      </div>
      \`;
  }
  catch(error){
    console.error(error);
  }
}

laden();

setInterval(
  laden,
  1000
);
</script>

</body>
</html>`);

          return;
        }


        if (req.url === "/pvp-data") {

          res.writeHead(
            200,
            {
              "Content-Type":
                "application/json; charset=utf-8",

              "Cache-Control":
                "no-store"
            }
          );

          if (!aktuellerPvpKampf) {

            res.end(
              JSON.stringify({
                kampf:null
              })
            );

            return;
          }

          const a =
            await pvpProfil(
              aktuellerPvpKampf.angreifer
            );

          const v =
            await pvpProfil(
              aktuellerPvpKampf.verteidiger
            );

          res.end(
            JSON.stringify({
              kampf:{
                ...aktuellerPvpKampf,

                angreiferRudel:
                  a?.rudel || "",

                verteidigerRudel:
                  v?.rudel || "",

                angreiferPokemon:
                  a?.pokemon || "",

                verteidigerPokemon:
                  v?.pokemon || ""
              }
            })
          );

          return;
        }


        res.writeHead(
          404,
          {
            "Content-Type":
              "text/plain; charset=utf-8"
          }
        );

        res.end("404");

      }
      catch(error){

        console.error(
          "❌ HTTP Fehler:",
          error
        );

        res.writeHead(500);
        res.end("500");
      }
    }
  );


/* =====================================================
   STREAM ELEMENTS WEBSOCKET
===================================================== */

let ws = null;

let wsVerbunden = false;

let wsReconnectTimer = null;


async function streamelementsVerbinden(){

  if (!STREAMELEMENTS_JWT) {

    console.error(
      "❌ STREAMELEMENTS_JWT fehlt."
    );

    return;
  }

  if (
    ws &&
    ws.readyState ===
      WebSocket.OPEN
  ) {
    return;
  }

  console.log(
    "🔌 Verbinde StreamElements WebSocket..."
  );

  ws =
    new WebSocket(
      "wss://astro.streamelements.com/"
    );


  ws.on(
    "open",
    () => {

      wsVerbunden =
        true;

      console.log(
        "✅ StreamElements WebSocket verbunden."
      );

      try {

        ws.send(
          JSON.stringify({
            op:"subscribe",
            jwt:
              STREAMELEMENTS_JWT,
            type:
              "channel.chat.message"
          })
        );

        console.log(
          "📡 StreamElements Chat-Topic wird abonniert."
        );

      }
      catch(error){

        console.error(
          "❌ Subscribe Fehler:",
          error.message
        );
      }
    }
  );


  ws.on(
    "message",
    async data => {

      try {

        const message =
          JSON.parse(
            data.toString()
          );

        console.log(
          "📩 SE:",
          JSON.stringify(message)
        );

        if (
          message.type ===
            "response" &&
          message.success
        ) {

          console.log(
            "✅ StreamElements Chat-Topic bestätigt."
          );
        }

        await chatVerarbeiten(
          message
        );

      }
      catch(error){

        console.error(
          "❌ WebSocket Nachricht:",
          error.message
        );
      }
    }
  );


  ws.on(
    "close",
    () => {

      wsVerbunden =
        false;

      console.log(
        "🔌 StreamElements WebSocket geschlossen."
      );

      if (
        wsReconnectTimer
      ) {
        return;
      }

      wsReconnectTimer =
        setTimeout(
          () => {

            wsReconnectTimer =
              null;

            streamelementsVerbinden();

          },
          5000
        );
    }
  );


  ws.on(
    "error",
    error => {

      console.error(
        "❌ StreamElements WebSocket:",
        error.message
      );
    }
  );
}


/* =====================================================
   SERVER START
===================================================== */

const PORT =
  process.env.PORT ||
  10000;


server.listen(
  PORT,
  async () => {

    console.log(
      `🚀 Server läuft auf Port ${PORT}`
    );

    try {

      await streamElementsChannelHolen();

      console.log(
        "📺 StreamElements Kanal:",
        streamElementsChannel
      );

    }
    catch(error){

      console.error(
        "⚠️ StreamElements Kanal konnte nicht geladen werden:",
        error.message
      );
    }

    await streamelementsVerbinden();
  }
);
