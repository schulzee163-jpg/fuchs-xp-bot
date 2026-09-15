import http from "http";
import WebSocket from "ws";

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  "https://herznunvdqcmzeffblgo.supabase.co";

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const STREAMELEMENTS_JWT =
  process.env.STREAMELEMENTS_JWT;

let streamElementsRoomId = null;


// =====================================================
// SUPABASE
// =====================================================

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


// =====================================================
// STREAMELEMENTS
// =====================================================

async function streamelementsSenden(
  text
) {
  if (
    !STREAMELEMENTS_JWT ||
    !streamElementsRoomId
  ) {
    console.log(
      "⚠️ StreamElements JWT oder Room-ID fehlt."
    );

    return false;
  }

  try {

    const response =
      await fetch(
        `https://api.streamelements.com/kappa/v2/bot/${encodeURIComponent(
          streamElementsRoomId
        )}/say`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${STREAMELEMENTS_JWT}`,

            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              message: text,
            }),
        }
      );

    const body =
      await response.text();

    if (!response.ok) {

      console.error(
        `❌ StreamElements ${response.status}: ${body}`
      );

      return false;
    }

    console.log(
      `📤 StreamElements: ${text}`
    );

    return true;

  } catch (error) {

    console.error(
      "❌ StreamElements senden:",
      error.message
    );

    return false;
  }
}


// =====================================================
// AKTIVITÄT
// =====================================================

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


// =====================================================
// NORMALE QUESTS
// =====================================================

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


// =====================================================
// PERSÖNLICHE QUESTS
// =====================================================

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


// =====================================================
// PVP / POKÉMON
// =====================================================

const offeneKaempfe =
  new Map();

let aktuellerPvpKampf =
  null;


// =====================================================
// DEINE FESTEN POKÉMON
// =====================================================

// ⚡ Pikachu ist für dich fest vergeben.
// 🔥 Glumanda ist für vegetalover2_0 fest vergeben.

const eigenePokemon = {

  fuchsmissvegetalover2_0:
    "Pikachu",

  vegetalover2_0:
    "Glumanda",
};


// =====================================================
// POKÉMON-AUSWAHL
// =====================================================

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


// =====================================================
// POKÉMON NORMALISIEREN
// =====================================================

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


// =====================================================
// PROFIL HOLEN
// =====================================================

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


// =====================================================
// POKÉMON WÄHLEN
// =====================================================

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


  // Prüfen, ob ein anderes Zuschauer-Pokémon
  // bereits von jemand anderem benutzt wird.
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


// =====================================================
// RUDEL-PVP START
// =====================================================

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


  // ===================================================
  // AUTOMATISCHE ANNAHME FÜR DICH
  // ===================================================

  if (
    gegner.toLowerCase() ===
    "fuchsmissvegetalover2_0"
  ) {

    const antwort =
      await kampfAnnehmen(
        gegner
      );

    if (antwort) {
      await streamelementsSenden(
        antwort
      );
    }

    return null;
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
// =====================================================
// KAMPF ANNEHMEN
// =====================================================

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


  // ===================================================
  // POKÉMON AUS DEN FESTEN ZUWEISUNGEN HOLEN
  // ===================================================

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


  // ===================================================
  // AKTIVEN KAMPF FÜR DAS OVERLAY SETZEN
  // ===================================================

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


  // ===================================================
  // +100 FUCHSXP
  // ===================================================

  await rpc(
    "fuchs_xp_hinzufuegen",
    {
      spieler_name:
        gewinner,

      xp_menge:
        100,
    }
  );


  // ===================================================
  // PVP SIEG / NIEDERLAGE
  // ===================================================

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


  // ===================================================
  // CHAT-NACHRICHT
  // ===================================================

  if (istPokemon) {

    return (
      `🐾⚔️ POKÉMON-KAMPF! @${kampf.herausforderer} ${linksPokemon} 🆚 ${rechtsPokemon} @${username} | 🏆 Gewinner: @${gewinner}! +100 FuchsXP 🦊 | 💀 @${verlierer} verliert.`
    );

  }


  return (
    `⚔️ RUDEL-PVP! @${kampf.herausforderer} ${linksRudel} 🆚 ${rechtsRudel} @${username} | 🏆 Gewinner: @${gewinner}! +100 FuchsXP 🦊 | 💀 @${verlierer} verliert.`
  );
}


// =====================================================
// POKÉMON-KAMPF START
// =====================================================

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


  // ===================================================
  // AUTOMATISCHE ANNAHME FÜR DICH
  // ===================================================

  if (
  gegner.toLowerCase() ===
  "fuchsmissvegetalover2_0"
) {
  return await kampfAnnehmen(
    gegner
  );
}

    return null;
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
}


// =====================================================
// KOMPATIBILITÄT
// =====================================================

async function pvpAnnehmen(
  username
) {
  return kampfAnnehmen(
    username
  );
}
// =====================================================
// POKÉMON / PROFIL / RUDEL
// =====================================================

async function profil(username) {
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
      `@${username} 🦊 Profil | XP: ${p.xp || 0} | Rudel: ${p.rudel || "noch nicht gewählt"} | Pokémon: ${pokemon || "noch nicht gewählt"} | PvP-Siege: ${p.pvp_siege || 0} | PvP-Niederlagen: ${p.pvp_niederlagen || 0}`
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


// =====================================================
// RUDELWAHL
// =====================================================

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


// =====================================================
// PERSÖNLICHE QUEST PRÜFEN
// =====================================================

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
        q =>
          !q.abgeschlossen
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


// =====================================================
// ALLE BEFEHLE
// =====================================================

async function alleBefehle(
  username
) {

  await streamelementsSenden(
    `@${username} 🦊 Befehle: !profil | !rudelwahl Feuer/Wasser/Wald/ICE | !pokemon | !pokemon Name | !quest | !pvp @Name | !pokekampf @Name | !annehmen | !allebefehle`
  );
}


// =====================================================
// CHAT
// =====================================================

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


  if (message.room) {
    streamElementsRoomId =
      message.room;
  }


  const data =
    message.data;


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


  // ===================================================
  // !PVP
  // ===================================================

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


  // ===================================================
  // !POKEMON
  // ===================================================

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


  // ===================================================
  // !POKEKAMPF
  // ===================================================

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


  // ===================================================
  // !ANNEHMEN
  // ===================================================

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


  // ===================================================
  // !PROFIL
  // ===================================================

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


  // ===================================================
  // !RUDELWAHL
  // ===================================================

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


  // ===================================================
  // !QUEST
  // ===================================================

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


  // ===================================================
  // !ALLEBEFEHLE
  // ===================================================

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


  // ===================================================
  // QUESTS BEARBEITEN
  // ===================================================

  await questsPruefen(
    username,
    text
  );


  await persoenlicheQuestPruefen(
    username,
    text
  );
}
// =====================================================
// HTTP-SERVER / PVP-OVERLAY
// =====================================================

const server =
  http.createServer(
    async (req, res) => {

      try {

        // ---------------------------------------------
        // PVP OVERLAY
        // ---------------------------------------------

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
    center;

  justify-content:
    space-between;

  gap:
    20px;
}

.spieler {
  flex:
    1;

  min-width:
    0;
}

.name {
  font-size:
    28px;

  font-weight:
    800;

  margin-bottom:
    10px;

  overflow:
    hidden;

  text-overflow:
    ellipsis;
}

.rudel,
.pokemon {
  font-size:
    24px;

  margin:
    8px
    0;
}

.vs {
  font-size:
    42px;

  font-weight:
    900;

  flex:
    0
    0
    auto;
}

.sieger {
  margin-top:
    22px;

  font-size:
    26px;

  font-weight:
    800;
}

.warten {
  font-size:
    28px;

  font-weight:
    800;

  margin-top:
    20px;
}

</style>

</head>

<body>

<div id="kampf">

  <div class="box">

    <div
      id="titel"
      class="titel"
    >
      ⚔️ RUDEL-KAMPF ⚔️
    </div>


    <div class="kaempfer">

      <div class="spieler">

        <div
          id="linksName"
          class="name"
        >
        </div>

        <div
          id="linksRudel"
          class="rudel"
        >
        </div>

        <div
          id="linksPokemon"
          class="pokemon"
        >
        </div>

      </div>


      <div
        id="vs"
        class="vs"
      >
        🆚
      </div>


      <div class="spieler">

        <div
          id="rechtsName"
          class="name"
        >
        </div>

        <div
          id="rechtsRudel"
          class="rudel"
        >
        </div>

        <div
          id="rechtsPokemon"
          class="pokemon"
        >
        </div>

      </div>

    </div>


    <div
      id="warten"
      class="warten"
    >
    </div>


    <div
      id="sieger"
      class="sieger"
    >
    </div>

  </div>

</div>


<script>

let letzterKampf =
  null;


async function datenLaden() {

  try {

    const response =
      await fetch(
        "/pvp-data"
      );


    if (
      !response.ok
    ) {
      return;
    }


    const data =
      await response.json();


    if (
      !data ||
      !data.status
    ) {

      document
        .getElementById(
          "kampf"
        )
        .style.opacity = 0;

      return;
    }


    const typ =
      data.typ ||
      "pvp";


    const kampfNeu =
      JSON.stringify(
        data
      ) !==
      JSON.stringify(
        letzterKampf
      );


    if (
      kampfNeu
    ) {

      letzterKampf =
        data;


      document
        .getElementById(
          "titel"
        )
        .textContent =
          typ ===
          "pokemon"
            ? "🐾 POKÉMON-KAMPF 🐾"
            : "⚔️ RUDEL-KAMPF ⚔️";


      document
        .getElementById(
          "linksName"
        )
        .textContent =
          "@" +
          (
            data.herausforderer ||
            ""
          );


      document
        .getElementById(
          "rechtsName"
        )
        .textContent =
          "@" +
          (
            data.gegner ||
            ""
          );


      document
        .getElementById(
          "linksRudel"
        )
        .textContent =
          typ ===
          "pokemon"
            ? ""
            : (
                data.linksRudel ||
                ""
              );


      document
        .getElementById(
          "rechtsRudel"
        )
        .textContent =
          typ ===
          "pokemon"
            ? ""
            : (
                data.rechtsRudel ||
                ""
              );


      document
        .getElementById(
          "linksPokemon"
        )
        .textContent =
          typ ===
          "pokemon"
            ? (
                data.linksPokemon ||
                ""
              )
            : "";


      document
        .getElementById(
          "rechtsPokemon"
        )
        .textContent =
          typ ===
          "pokemon"
            ? (
                data.rechtsPokemon ||
                ""
              )
            : "";


      const warten =
        document
          .getElementById(
            "warten"
          );


      const sieger =
        document
          .getElementById(
            "sieger"
          );


      if (
        data.status ===
        "waiting"
      ) {

        warten.textContent =
          "⏳ WARTET AUF !ANNEHMEN";

        sieger.textContent =
          "";

      } else {

        warten.textContent =
          "";

        if (
          data.gewinner
        ) {

          sieger.textContent =
            "🏆 Gewinner: @" +
            data.gewinner;

        } else {

          sieger.textContent =
            "";
        }
      }
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


        // ---------------------------------------------
        // PVP-DATEN
        // ---------------------------------------------

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


        // ---------------------------------------------
        // HEALTH
        // ---------------------------------------------

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


// =====================================================
// WEBSOCKET STREAM ELEMENTS
// =====================================================

let streamElementsSocket =
  null;


function streamElementsVerbinden() {

  try {

    streamElementsSocket =
      new WebSocket(
      "wss://astro.streamelements.com"
      );


    streamElementsSocket.on(
      "open",
      () => {

        console.log(
          "🔌 StreamElements WebSocket verbunden."
        );


        const subscribeMessage =
          {
            method:
              "subscribe",

            topics:
              [
                `channel.chat.message`
              ],
          };


        streamElementsSocket.send(
          JSON.stringify(
            subscribeMessage
          )
        );


        console.log(
          "📡 StreamElements Chat-Topic abonniert."
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
      () => {

        console.log(
          "🔌 StreamElements WebSocket getrennt."
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


// =====================================================
// SERVER START
// =====================================================

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
