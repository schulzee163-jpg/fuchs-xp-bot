import http from "http";
import WebSocket from "ws";

/* =====================================================
   MITSUSUNDWANDASWELT
   TEIL 1 – GRUNDSYSTEM + TÄGLICHE QUESTS
===================================================== */

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  "https://herznunvdqcmzeffblgo.supabase.co";

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const STREAMELEMENTS_JWT =
  process.env.STREAMELEMENTS_JWT;

let streamElementsChannel =
  process.env.STREAMELEMENTS_CHANNEL || null;


/* =====================================================
   HILFSFUNKTIONEN
===================================================== */

function normalisieren(username) {
  return String(username || "")
    .trim()
    .toLowerCase();
}

function zufall(min, max) {
  return Math.floor(
    Math.random() * (max - min + 1)
  ) + min;
}

function headers(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization:
      `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function supabase(path, options = {}) {
  const response = await fetch(
    `${SUPABASE_URL}${path}`,
    {
      ...options,
      headers: headers(
        options.headers || {}
      ),
    }
  );

  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `Supabase ${response.status}: ${text}`
    );
  }

  return text
    ? JSON.parse(text)
    : null;
}

async function rpc(name, body = {}) {
  return supabase(
    `/rest/v1/rpc/${name}`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}


/* =====================================================
   XP
===================================================== */

async function xpHinzufuegen(
  username,
  xp
) {
  try {
    await rpc(
      "fuchs_xp_hinzufuegen",
      {
        spieler_name:
          normalisieren(username),
        xp_menge:
          Number(xp) || 0,
      }
    );
  } catch (error) {
    console.error(
      "❌ XP hinzufügen:",
      error.message
    );
  }
}


/* =====================================================
   MITSUSUNDWANDASWELT
===================================================== */

const MITSUSUNDWANDASWELT = {
  welt:
    "MitsusundWandasWelt",

  fuchswelt:
    "Fuchswelt",

  dorf:
    "Fuchsdorf",

  legend:
    "Der Urfuchs",

  waehrung:
    "Fuchsmünzen",

  startCoins:
    100,

  startEnergy:
    100,

  startLevel:
    1,

  startXP:
    0,

  startTitel:
    "Jungfuchs",
};


/* =====================================================
   RUDEL
===================================================== */

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


/* =====================================================
   TÄGLICHE QUESTS
=====================================================

   Jeden Tag gibt es 10 persönliche Quests.

   Die Quests werden nach deutschem Datum ausgewählt.

   Wichtig:
   Der Spieler bekommt NICHT nur eine Quest.

   Es gibt immer:
   1 bis 10

   Jede Quest kann einzeln abgeschlossen werden.

===================================================== */


/* =====================================================
   TAG 1
===================================================== */

const questSetTag1 = [
  {
    nummer: 1,
    text:
      "📝 Schreibe 10 Nachrichten im Chat.",
    ziel: 10,
    xp: 50,
    typ: "nachrichten",
  },

  {
    nummer: 2,
    text:
      "📝 Schreibe 20 Nachrichten im Chat.",
    ziel: 20,
    xp: 100,
    typ: "nachrichten",
  },

  {
    nummer: 3,
    text:
      "📝 Schreibe 30 Nachrichten im Chat.",
    ziel: 30,
    xp: 150,
    typ: "nachrichten",
  },

  {
    nummer: 4,
    text:
      "📝 Schreibe 50 Nachrichten im Chat.",
    ziel: 50,
    xp: 250,
    typ: "nachrichten",
  },

  {
    nummer: 5,
    text:
      "📝 Schreibe 75 Nachrichten im Chat.",
    ziel: 75,
    xp: 350,
    typ: "nachrichten",
  },

  {
    nummer: 6,
    text:
      "⚡ Schreibe den Namen deines Lieblings-Pokémon in den Chat.",
    ziel: 1,
    xp: 50,
    typ: "pokemon_name",
  },

  {
    nummer: 7,
    text:
      "🌟 Schreibe im Chat, welches Pokémon du gerne als Partner auf einem Abenteuer hättest.",
    ziel: 1,
    xp: 75,
    typ: "pokemon_partner",
  },

  {
    nummer: 8,
    text:
      "😂 Erfinde einen lustigen Spitznamen für ein Pokémon und schreibe ihn in den Chat.",
    ziel: 1,
    xp: 100,
    typ: "pokemon_spitzname",
  },

  {
    nummer: 9,
    text:
      "🧪 Erfinde eine neue Pokémon-Attacke und schreibe ihren Namen in den Chat.",
    ziel: 1,
    xp: 125,
    typ: "pokemon_attacke",
  },

  {
    nummer: 10,
    text:
      "😂 Erfinde eine lustige Pokémon-Entwicklung und schreibe, zu welchem Pokémon sie gehört.",
    ziel: 1,
    xp: 150,
    typ: "pokemon_entwicklung",
  },
];


/* =====================================================
   FREITAG
===================================================== */

const questSetFreitag = [
  {
    nummer: 1,
    text:
      "🎭 Erfinde einen lustigen Pokémon-Namen für dich selbst und schreibe ihn in den Chat.",
    ziel: 1,
    xp: 75,
    typ: "pokemon_name",
  },

  {
    nummer: 2,
    text:
      "😂 Wenn du ein Pokémon wärst: Welche besondere Fähigkeit hättest du? Schreibe sie in den Chat.",
    ziel: 1,
    xp: 100,
    typ: "pokemon_faehigkeit",
  },

  {
    nummer: 3,
    text:
      "🎨 Erfinde eine neue Pokémon-Farbe für dein Lieblings-Pokémon und beschreibe sie kurz im Chat.",
    ziel: 1,
    xp: 100,
    typ: "pokemon_farbe",
  },

  {
    nummer: 4,
    text:
      "🎤 Stell dir vor, du bist ein Pokémon-Trainer: Wie würde dein Trainername heißen? Schreib ihn in den Chat.",
    ziel: 1,
    xp: 125,
    typ: "trainername",
  },

  {
    nummer: 5,
    text:
      "🎮 Welches Videospiel aus dem Store würdest du sofort kaufen, wenn es heute kostenlos wäre?",
    ziel: 1,
    xp: 150,
    typ: "gaming_store",
  },

  {
    nummer: 6,
    text:
      "🎵 Welchen Song könntest du gerade immer wieder hören?",
    ziel: 1,
    xp: 175,
    typ: "musik",
  },

  {
    nummer: 7,
    text:
      "🎬 Wenn dein Leben ein Videospiel wäre, wie würde das Spiel heißen?",
    ziel: 1,
    xp: 200,
    typ: "gaming",
  },

  {
    nummer: 8,
    text:
      "🐾 Wenn du ein Haustier aus einem Videospiel haben könntest, welches würdest du wählen?",
    ziel: 1,
    xp: 225,
    typ: "haustier",
  },

  {
    nummer: 9,
    text:
      "🕹️ Nenne ein Videospiel, das du niemals langweilig findest.",
    ziel: 1,
    xp: 250,
    typ: "gaming",
  },

  {
    nummer: 10,
    text:
      "🐾 Wenn dein Haustier ein Mensch wäre, welchen Beruf würde es haben?",
    ziel: 1,
    xp: 275,
    typ: "haustier_beruf",
  },
];


/* =====================================================
   SAMSTAG
===================================================== */

const questSetSamstag = [
  {
    nummer: 1,
    text:
      "🎮 Nenne dein absolutes Lieblings-Videospiel und schreibe es in den Chat.",
    ziel: 1,
    xp: 75,
    typ: "gaming",
  },

  {
    nummer: 2,
    text:
      "🐶 Wenn du dir heute ein neues Haustier aussuchen könntest, welches Tier würdest du nehmen?",
    ziel: 1,
    xp: 100,
    typ: "haustier",
  },

  {
    nummer: 3,
    text:
      "🎵 Schreibe den Titel deines Lieblingssongs in den Chat.",
    ziel: 1,
    xp: 125,
    typ: "musik",
  },

  {
    nummer: 4,
    text:
      "🎬 Welchen Film würdest du gerne noch einmal zum ersten Mal sehen können?",
    ziel: 1,
    xp: 150,
    typ: "kino",
  },

  {
    nummer: 5,
    text:
      "🚗 GTA: Wenn du in GTA ein eigenes Fahrzeug bauen könntest, wie würde es aussehen?",
    ziel: 1,
    xp: 175,
    typ: "gta",
  },

  {
    nummer: 6,
    text:
      "🚀 Wenn du für einen Tag ins Weltall fliegen könntest, was würdest du dort unbedingt machen?",
    ziel: 1,
    xp: 200,
    typ: "weltraum",
  },

  {
    nummer: 7,
    text:
      "👻 Du musst eine Nacht allein in einem verlassenen Haus verbringen. Was würdest du als Erstes mitnehmen?",
    ziel: 1,
    xp: 225,
    typ: "horror",
  },

  {
    nummer: 8,
    text:
      "🦸 Wenn du für einen Tag ein Superheld sein könntest, welche Superkraft würdest du wählen?",
    ziel: 1,
    xp: 250,
    typ: "superheld",
  },

  {
    nummer: 9,
    text:
      "🏖️ Du bekommst eine kostenlose Reise an jeden Ort der Welt. Wohin würdest du fliegen?",
    ziel: 1,
    xp: 275,
    typ: "urlaub",
  },

  {
    nummer: 10,
    text:
      "🎨 Erfinde einen Namen für einen eigenen Anime und schreibe ihn in den Chat.",
    ziel: 1,
    xp: 300,
    typ: "anime",
  },
];


/* =====================================================
   WEITERE QUEST-SETS
=====================================================

   Diese Sets sorgen dafür, dass die Welt nicht nach
   drei Tagen immer wieder dieselben Aufgaben zeigt.

   Die großen Themen sind:
   Anime
   Gaming
   GTA
   Tiere
   Musik
   Kreativität
   Quatsch
   Kino/Serien
   Superhelden
   Sport
   Fantasy
   Horror
   Weltraum
   Urlaub
   Retro-Games
   Alltag

===================================================== */

const questSet4 = [
  {
    nummer: 1,
    text:
      "🎬 Nenne deine Lieblings-Anime-Serie.",
    ziel: 1,
    xp: 75,
    typ: "anime",
  },
  {
    nummer: 2,
    text:
      "🎮 Nenne ein Spiel, das du gerade gerne spielen würdest.",
    ziel: 1,
    xp: 100,
    typ: "gaming",
  },
  {
    nummer: 3,
    text:
      "🐾 Erfinde einen Namen für ein völlig verrücktes Haustier.",
    ziel: 1,
    xp: 125,
    typ: "haustier",
  },
  {
    nummer: 4,
    text:
      "🎵 Nenne einen Song, der dich sofort in gute Laune bringt.",
    ziel: 1,
    xp: 125,
    typ: "musik",
  },
  {
    nummer: 5,
    text:
      "😂 Erfinde einen völlig sinnlosen Superhelden.",
    ziel: 1,
    xp: 150,
    typ: "quatsch",
  },
  {
    nummer: 6,
    text:
      "🦸 Welche Superkraft würdest du niemals haben wollen?",
    ziel: 1,
    xp: 175,
    typ: "superheld",
  },
  {
    nummer: 7,
    text:
      "🏖️ Nenne deinen perfekten Urlaubsort.",
    ziel: 1,
    xp: 200,
    typ: "urlaub",
  },
  {
    nummer: 8,
    text:
      "👻 Erfinde den Namen für ein Geisterhaus.",
    ziel: 1,
    xp: 225,
    typ: "horror",
  },
  {
    nummer: 9,
    text:
      "🕹️ Nenne ein Retro-Spiel, das du kennst.",
    ziel: 1,
    xp: 250,
    typ: "retro",
  },
  {
    nummer: 10,
    text:
      "🎨 Erfinde den Namen einer eigenen Fantasy-Welt.",
    ziel: 1,
    xp: 300,
    typ: "fantasy",
  },
];


/* =====================================================
   QUEST-TAGE
===================================================== */

const alleQuestSets = [
  questSetTag1,
  questSetFreitag,
  questSetSamstag,
  questSet4,
];


/* =====================================================
   DEUTSCHES DATUM
===================================================== */

function deutschesDatum() {
  return new Intl.DateTimeFormat(
    "sv-SE",
    {
      timeZone:
        "Europe/Berlin",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).format(
    new Date()
  );
}


/* =====================================================
   TAGESNUMMER
=====================================================

   Gleiche Tage bekommen immer dasselbe Quest-Set.

   Dadurch bekommt nicht jeder Spieler zufällig
   unterschiedliche Tagesquests.

   Alle Spieler haben am selben Tag dieselben
   10 persönlichen Tagesquests.

===================================================== */

function tagesNummerBerechnen() {
  const datum =
    deutschesDatum();

  const zahlen =
    datum
      .split("-")
      .map(Number);

  const jahr =
    zahlen[0];

  const monat =
    zahlen[1];

  const tag =
    zahlen[2];

  const wert =
    jahr * 10000 +
    monat * 100 +
    tag;

  return Math.abs(
    wert
  );
}


/* =====================================================
   HEUTIGES QUEST-SET
===================================================== */

function heutigeQuests() {
  const tagesNummer =
    tagesNummerBerechnen();

  const index =
    tagesNummer %
    alleQuestSets.length;

  return alleQuestSets[
    index
  ];
}


/* =====================================================
   QUEST-STATUS
=====================================================

   Dieser Speicher ist zunächst für die laufende
   Bot-Session vorgesehen.

   Im späteren Teil wird der dauerhafte Supabase-
   Speicher für MitsusundWandasWelt ergänzt.

===================================================== */

const tagesQuestStatus =
  new Map();


function questStatusKey(
  username
) {
  return (
    `${normalisieren(username)}:` +
    `${deutschesDatum()}`
  );
}


/* =====================================================
   10 QUESTS FÜR SPIELER ERSTELLEN
===================================================== */

function tagesQuestsFuerSpieler(
  username
) {
  username =
    normalisieren(username);

  const key =
    questStatusKey(
      username
    );

  let status =
    tagesQuestStatus.get(
      key
    );

  if (!status) {
    const vorlagen =
      heutigeQuests();

    status =
      vorlagen.map(
        (quest) => ({
          ...quest,

          fortschritt: 0,

          abgeschlossen:
            false,
        })
      );

    tagesQuestStatus.set(
      key,
      status
    );
  }

  return status;
}


/* =====================================================
   !QUEST
===================================================== */

async function persoenlicheQuestsAnzeigen(
  username
) {
  username =
    normalisieren(username);

  const quests =
    tagesQuestsFuerSpieler(
      username
    );

  const offene =
    quests.filter(
      (q) =>
        !q.abgeschlossen
    ).length;

  const erledigte =
    quests.filter(
      (q) =>
        q.abgeschlossen
    ).length;

  await streamelementsSenden(
    `@${username} 🎯 Heute: ${erledigte}/10 erledigt | ` +
    `${offene} offen | MitsusundWandasWelt 🦊`
  );

  for (
    const quest of quests
  ) {
    await streamelementsSenden(
      `${quest.nummer}. ${quest.text} ` +
      `(${quest.fortschritt}/${quest.ziel}) ` +
      `→ +${quest.xp} XP`
    );
  }
}


/* =====================================================
   NACHRICHTEN-QUESTS
===================================================== */

async function nachrichtenQuestsPruefen(
  username
) {
  username =
    normalisieren(username);

  const quests =
    tagesQuestsFuerSpieler(
      username
    );

  for (
    const quest of quests
  ) {
    if (
      quest.abgeschlossen
    ) {
      continue;
    }

    if (
      quest.typ !==
      "nachrichten"
    ) {
      continue;
    }

    quest.fortschritt += 1;

    if (
      quest.fortschritt >=
      quest.ziel
    ) {
      quest.fortschritt =
        quest.ziel;

      quest.abgeschlossen =
        true;

      await xpHinzufuegen(
        username,
        quest.xp
      );

      await streamelementsSenden(
        `🎉 @${username} Quest ${quest.nummer} abgeschlossen! ` +
        `+${quest.xp} XP 🦊`
      );
    }
  }
}


/* =====================================================
   TEXT-QUESTS
=====================================================

   Kreative Aufgaben werden nicht automatisch nach
   dem Inhalt bewertet.

   Sobald der Spieler eine Nachricht schreibt, die
   zu einer aktiven Kreativ-Quest gehört, kann die
   Quest später durch die entsprechende Logik
   abgeschlossen werden.

===================================================== */

async function kreativeQuestsPruefen(
  username,
  text
) {
  username =
    normalisieren(username);

  if (
    !text ||
    !String(text).trim()
  ) {
    return;
  }

  const nachricht =
    String(text)
      .trim();

  const quests =
    tagesQuestsFuerSpieler(
      username
    );

  const kreativeTypen =
    new Set([
      "pokemon_name",
      "pokemon_partner",
      "pokemon_spitzname",
      "pokemon_attacke",
      "pokemon_entwicklung",
      "pokemon_faehigkeit",
      "pokemon_farbe",
      "trainername",
      "gaming_store",
      "musik",
      "gaming",
      "haustier",
      "haustier_beruf",
      "kino",
      "gta",
      "weltraum",
      "horror",
      "superheld",
      "urlaub",
      "anime",
      "quatsch",
      "retro",
      "fantasy",
    ]);

  if (
    nachricht.startsWith("!")
  ) {
    return;
  }

  for (
    const quest of quests
  ) {
    if (
      quest.abgeschlossen
    ) {
      continue;
    }

    if (
      !kreativeTypen.has(
        quest.typ
      )
    ) {
      continue;
    }

    /*
      Eine kreative Quest zählt genau einmal.

      Der Spieler muss also nicht 10-mal schreiben.
    */

    quest.fortschritt =
      quest.ziel;

    quest.abgeschlossen =
      true;

    await xpHinzufuegen(
      username,
      quest.xp
    );

    await streamelementsSenden(
      `🎉 @${username} Quest ${quest.nummer} abgeschlossen! ` +
      `+${quest.xp} XP 🦊`
    );
  }
}


/* =====================================================
   ALLE 10 QUESTS FERTIG?
===================================================== */

async function pruefenObAlleTagesquestsFertig(
  username
) {
  username =
    normalisieren(username);

  const quests =
    tagesQuestsFuerSpieler(
      username
    );

  const alleFertig =
    quests.every(
      (quest) =>
        quest.abgeschlossen
    );

  if (
    !alleFertig
  ) {
    return;
  }

  const bereitsGemeldet =
    quests._abschlussGemeldet;

  if (
    bereitsGemeldet
  ) {
    return;
  }

  quests._abschlussGemeldet =
    true;

  await streamelementsSenden(
    `🏆🦊 @${username} hat heute ALLE 10 Tagesquests von MitsusundWandasWelt geschafft! 🎉`
  );
}


/* =====================================================
   STREAM ELEMENTS SENDEN
===================================================== */

function warten(ms) {
  return new Promise(
    (resolve) =>
      setTimeout(
        resolve,
        ms
      )
  );
}

async function streamelementsSenden(
  text
) {
  if (
    !text ||
    !String(text).trim()
  ) {
    return false;
  }

  if (
    !STREAMELEMENTS_JWT
  ) {
    console.log(
      "⚠️ StreamElements JWT fehlt."
    );

    return false;
  }

  for (
    let versuch = 1;
    versuch <= 3;
    versuch++
  ) {
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

        if (
          versuch < 3
        ) {
          await warten(
            800
          );
        }

        continue;
      }

      const channelData =
        JSON.parse(
          channelBody
        );

      const channelId =
        channelData?._id;

      if (
        !channelId
      ) {
        console.error(
          "❌ StreamElements Channel-ID konnte nicht ermittelt werden."
        );

        if (
          versuch < 3
        ) {
          await warten(
            800
          );
        }

        continue;
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
        `📤 StreamElements Versuch ${versuch}/3 ${response.status}: ${body}`
      );

      if (
        response.ok
      ) {
        return true;
      }

      if (
        versuch < 3
      ) {
        await warten(
          800
        );
      }
    } catch (
      error
    ) {
      console.error(
        `❌ StreamElements Versuch ${versuch}/3:`,
        error.message
      );

      if (
        versuch < 3
      ) {
        await warten(
          800
        );
      }
    }
  }

  return false;
}
/* =====================================================
   FUCHSPROFIL
===================================================== */

const fuchsProfile = new Map();

const levelTitel = [
  {
    min: 1,
    max: 10,
    titel: "Jungfuchs",
  },
  {
    min: 11,
    max: 20,
    titel: "Waldläufer",
  },
  {
    min: 21,
    max: 30,
    titel: "Fuchs-Kämpfer",
  },
  {
    min: 31,
    max: 40,
    titel: "Fuchsmeister",
  },
  {
    min: 41,
    max: 50,
    titel: "Fuchslegende",
  },
];


/* =====================================================
   XP-TABELLE
===================================================== */

const levelGrenzen = {
  1: 0,
  2: 100,
  3: 250,
  4: 450,
  5: 700,
  6: 950,
  7: 1200,
  8: 1500,
  9: 1900,
  10: 2500,

  11: 3200,
  12: 3700,
  13: 4200,
  14: 4700,
  15: 5200,
  16: 5700,
  17: 6200,
  18: 6700,
  19: 7100,
  20: 7500,

  21: 8250,
  22: 9000,
  23: 9750,
  24: 10500,
  25: 11250,
  26: 12000,
  27: 12750,
  28: 13500,
  29: 14250,
  30: 15000,

  31: 16250,
  32: 17500,
  33: 18750,
  34: 20000,
  35: 21250,
  36: 22500,
  37: 23500,
  38: 24500,
  39: 25500,
  40: 26500,

  41: 29250,
  42: 31000,
  43: 32750,
  44: 34500,
  45: 36250,
  46: 37500,
  47: 38500,
  48: 39250,
  49: 39750,
  50: 40000,
};


/* =====================================================
   LEVEL BERECHNEN
===================================================== */

function levelAusXP(xp) {
  xp = Number(xp) || 0;

  let level = 1;

  for (
    const [stufe, grenze] of Object.entries(
      levelGrenzen
    )
  ) {
    if (
      xp >= Number(grenze)
    ) {
      level = Number(stufe);
    }
  }

  return Math.min(
    level,
    50
  );
}


/* =====================================================
   TITEL AUS LEVEL
===================================================== */

function levelTitelHolen(level) {
  level =
    Number(level) || 1;

  const eintrag =
    levelTitel.find(
      (x) =>
        level >= x.min &&
        level <= x.max
    );

  return (
    eintrag?.titel ||
    "Jungfuchs"
  );
}


/* =====================================================
   NEUES FUCHSPROFIL
===================================================== */

function neuesFuchsprofil(
  username
) {
  return {
    spieler:
      normalisieren(username),

    fuchsname:
      "",

    level:
      1,

    xp:
      0,

    coins:
      100,

    energie:
      100,

    rudel:
      null,

    titel:
      "Jungfuchs",

    fuchsbauStufe:
      1,

    fuchsbauName:
      "",

    pvp_siege:
      0,

    pvp_niederlagen:
      0,

    achievements:
      [],

    ruf:
      0,

    chronik:
      [],

    inventar:
      [],

    questInventar:
      [],

    storyInventar:
      [],

    dekorationsInventar:
      [],

    begleiter:
      [],

    aktiveBegleiter:
      [],

    geheimnisse:
      [],

    entdeckungen:
      [],

    legenden:
      [],

    erstellt:
      new Date().toISOString(),
  };
}


/* =====================================================
   PROFIL AUS SPEICHER HOLEN
===================================================== */

async function fuchsProfilHolen(
  username
) {
  username =
    normalisieren(username);

  let profil =
    fuchsProfile.get(
      username
    );

  if (profil) {
    return profil;
  }

  /*
    Zuerst versuchen wir das vorhandene
    fuchsprofile-System weiterzuverwenden.
  */

  try {
    const rows =
      await supabase(
        `/rest/v1/fuchsprofile` +
        `?spieler=eq.${encodeURIComponent(
          username
        )}` +
        `&limit=1`
      );

    if (
      rows &&
      rows.length
    ) {
      const alt =
        rows[0];

      profil =
        neuesFuchsprofil(
          username
        );

      profil.xp =
        Number(
          alt.xp || 0
        );

      profil.level =
        levelAusXP(
          profil.xp
        );

      profil.rudel =
        alt.rudel ||
        null;

      profil.pvp_siege =
        Number(
          alt.pvp_siege || 0
        );

      profil.pvp_niederlagen =
        Number(
          alt.pvp_niederlagen || 0
        );

      profil.titel =
        levelTitelHolen(
          profil.level
        );

      if (
        alt.fuchsname
      ) {
        profil.fuchsname =
          alt.fuchsname;
      }

      if (
        alt.fuchsbau_name
      ) {
        profil.fuchsbauName =
          alt.fuchsbau_name;
      }

      fuchsProfile.set(
        username,
        profil
      );

      return profil;
    }
  } catch (
    error
  ) {
    console.error(
      "⚠️ Fuchsprofil laden:",
      error.message
    );
  }

  profil =
    neuesFuchsprofil(
      username
    );

  fuchsProfile.set(
    username,
    profil
  );

  return profil;
}


/* =====================================================
   PROFIL SPEICHERN
===================================================== */

async function fuchsProfilSpeichern(
  profil
) {
  if (
    !profil ||
    !profil.spieler
  ) {
    return false;
  }

  const username =
    normalisieren(
      profil.spieler
    );

  profil.spieler =
    username;

  fuchsProfile.set(
    username,
    profil
  );

  /*
    Nur Felder verwenden, die im bisherigen
    fuchsprofile-System bereits vorhanden sind.

    Neue MitsusundWandasWelt-Daten bleiben
    zunächst im Bot-Speicher und werden später
    gemeinsam mit der Datenbankstruktur verbunden.
  */

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

            xp:
              Number(
                profil.xp || 0
              ),

            rudel:
              profil.rudel,

            pvp_siege:
              Number(
                profil.pvp_siege || 0
              ),

            pvp_niederlagen:
              Number(
                profil.pvp_niederlagen || 0
              ),
          }),
      }
    );

    return true;
  } catch (
    error
  ) {
    console.error(
      "⚠️ Fuchsprofil speichern:",
      error.message
    );

    return false;
  }
}


/* =====================================================
   FUCHSNAME SETZEN
===================================================== */

async function fuchsnameSetzen(
  username,
  name
) {
  username =
    normalisieren(username);

  const profil =
    await fuchsProfilHolen(
      username
    );

  name =
    String(name || "")
      .trim();

  if (!name) {
    return (
      `@${username} 🦊 Schreibe deinen gewünschten Fuchsnamen dazu.`
    );
  }

  if (
    name.length < 2
  ) {
    return (
      `@${username} ❌ Dein Fuchsname muss mindestens 2 Zeichen haben.`
    );
  }

  if (
    name.length > 24
  ) {
    return (
      `@${username} ❌ Dein Fuchsname darf höchstens 24 Zeichen haben.`
    );
  }

  const ersterName =
    !profil.fuchsname;

  if (
    !ersterName
  ) {
    if (
      Number(
        profil.coins || 0
      ) < 500
    ) {
      return (
        `@${username} ❌ Eine Umbenennung kostet 500 Fuchsmünzen.`
      );
    }

    profil.coins -= 500;
  }

  profil.fuchsname =
    name;

  await fuchsProfilSpeichern(
    profil
  );

  return (
    `🦊 @${username} Dein Fuchs heißt jetzt **${name}**! ❤️`
  );
}


/* =====================================================
   FUCHSNAME ANZEIGEN
===================================================== */

function fuchsAnzeigeName(
  profil
) {
  if (
    profil?.fuchsname
  ) {
    return profil.fuchsname;
  }

  return "Jungfuchs";
}


/* =====================================================
   FUCHSBAU-NAME SETZEN
===================================================== */

async function fuchsbauNameSetzen(
  username,
  name
) {
  username =
    normalisieren(username);

  const profil =
    await fuchsProfilHolen(
      username
    );

  name =
    String(name || "")
      .trim();

  if (!name) {
    return (
      `@${username} 🏠 Schreibe den gewünschten Namen für deinen Fuchsbau dazu.`
    );
  }

  if (
    name.length < 2
  ) {
    return (
      `@${username} ❌ Der Name ist zu kurz.`
    );
  }

  if (
    name.length > 30
  ) {
    return (
      `@${username} ❌ Der Name darf höchstens 30 Zeichen haben.`
    );
  }

  if (
    profil.fuchsbauName
  ) {
    if (
      Number(
        profil.coins || 0
      ) < 500
    ) {
      return (
        `@${username} ❌ Eine Umbenennung kostet 500 Fuchsmünzen.`
      );
    }

    profil.coins -= 500;
  }

  profil.fuchsbauName =
    name;

  await fuchsProfilSpeichern(
    profil
  );

  return (
    `🏠 @${username} Dein Fuchsbau heißt jetzt **${name}**! 🦊`
  );
}


/* =====================================================
   XP + LEVEL + BELOHNUNG
===================================================== */

async function fuchsXPVergeben(
  username,
  menge
) {
  username =
    normalisieren(username);

  menge =
    Number(menge) || 0;

  if (
    menge <= 0
  ) {
    return;
  }

  const profil =
    await fuchsProfilHolen(
      username
    );

  const altesLevel =
    Number(
      profil.level || 1
    );

  profil.xp =
    Number(
      profil.xp || 0
    ) + menge;

  const neuesLevel =
    levelAusXP(
      profil.xp
    );

  profil.level =
    neuesLevel;

  profil.titel =
    levelTitelHolen(
      neuesLevel
    );

  await xpHinzufuegen(
    username,
    menge
  );

  if (
    neuesLevel >
    altesLevel
  ) {
    const levelAnzahl =
      neuesLevel -
      altesLevel;

    profil.coins =
      Number(
        profil.coins || 0
      ) +
      25 *
      levelAnzahl;

    profil.energie =
      Math.min(
        100,
        Number(
          profil.energie || 0
        ) +
        10 *
        levelAnzahl
      );

    await fuchsProfilSpeichern(
      profil
    );

    await streamelementsSenden(
      `🎉🦊 ${fuchsAnzeigeName(profil)} ist auf Level ${neuesLevel} gestiegen! ` +
      `👑 Titel: ${profil.titel} | +${25 * levelAnzahl} Fuchsmünzen`
    );

    return;
  }

  await fuchsProfilSpeichern(
    profil
  );
}


/* =====================================================
   FUCHSMÜNZEN
===================================================== */

async function fuchsmuenzenHinzufuegen(
  username,
  menge
) {
  username =
    normalisieren(username);

  menge =
    Number(menge) || 0;

  const profil =
    await fuchsProfilHolen(
      username
    );

  profil.coins =
    Math.max(
      0,
      Number(
        profil.coins || 0
      ) + menge
    );

  await fuchsProfilSpeichern(
    profil
  );

  return profil.coins;
}


/* =====================================================
   ENERGIE
===================================================== */

async function energieAendern(
  username,
  menge
) {
  username =
    normalisieren(username);

  menge =
    Number(menge) || 0;

  const profil =
    await fuchsProfilHolen(
      username
    );

  profil.energie =
    Math.max(
      0,
      Math.min(
        100,
        Number(
          profil.energie || 0
        ) + menge
      )
    );

  await fuchsProfilSpeichern(
    profil
  );

  return profil.energie;
}


/* =====================================================
   TITEL AUSWÄHLEN
===================================================== */

const freigeschalteteTitel =
  [
    "Jungfuchs",
    "Waldläufer",
    "Fuchs-Kämpfer",
    "Fuchsmeister",
    "Fuchslegende",

    "Kampfneuling",
    "Kampfgefährte",
    "Duellant",
    "Elitekämpfer",
    "Kampflegende",

    "Spurensucher",
    "Chronist",
    "Sammlerfuchs",
    "Freundesfuchs",
  ];


async function titelSetzen(
  username,
  titel
) {
  username =
    normalisieren(username);

  const profil =
    await fuchsProfilHolen(
      username
    );

  titel =
    String(titel || "")
      .trim();

  if (
    !titel
  ) {
    return (
      `@${username} 👑 Verfügbare Titel: ${freigeschalteteTitel.join(", ")}`
    );
  }

  const erlaubt =
    freigeschalteteTitel
      .some(
        (x) =>
          x.toLowerCase() ===
          titel.toLowerCase()
      );

  if (
    !erlaubt
  ) {
    return (
      `@${username} ❌ Diesen Titel gibt es nicht oder er ist noch nicht freigeschaltet.`
    );
  }

  const levelTitelAktuell =
    levelTitelHolen(
      profil.level
    );

  /*
    Level-Titel dürfen nur getragen werden,
    wenn das entsprechende Level erreicht wurde.
  */

  if (
    titel ===
      "Waldläufer" &&
    profil.level < 11
  ) {
    return (
      `@${username} ❌ Der Titel Waldläufer wird ab Level 11 freigeschaltet.`
    );
  }

  if (
    titel ===
      "Fuchs-Kämpfer" &&
    profil.level < 21
  ) {
    return (
      `@${username} ❌ Dieser Titel wird ab Level 21 freigeschaltet.`
    );
  }

  if (
    titel ===
      "Fuchsmeister" &&
    profil.level < 31
  ) {
    return (
      `@${username} ❌ Dieser Titel wird ab Level 31 freigeschaltet.`
    );
  }

  if (
    titel ===
      "Fuchslegende" &&
    profil.level < 41
  ) {
    return (
      `@${username} ❌ Dieser Titel wird ab Level 41 freigeschaltet.`
    );
  }

  profil.titel =
    titel;

  await fuchsProfilSpeichern(
    profil
  );

  return (
    `👑 @${username} trägt jetzt den Titel **${titel}**! 🦊`
  );
}


/* =====================================================
   PROFIL-ANZEIGE MITSUSUNDWANDASWELT
===================================================== */

async function mitsusProfil(
  username
) {
  username =
    normalisieren(username);

  const profil =
    await fuchsProfilHolen(
      username
    );

  const fuchsname =
    fuchsAnzeigeName(
      profil
    );

  const rudel =
    profil.rudel ||
    "noch kein Rudel";

  const bau =
    profil.fuchsbauName ||
    "noch nicht benannt";

  return (
    `🦊 ${fuchsname} | ` +
    `👑 ${profil.titel} | ` +
    `🔥 ${rudel} | ` +
    `⭐ Level ${profil.level} | ` +
    `✨ ${profil.xp} XP | ` +
    `💰 ${profil.coins} Fuchsmünzen | ` +
    `⚡ ${profil.energie}/100 Energie | ` +
    `🏠 ${bau}`
  );
}


/* =====================================================
   STARTPROFIL
===================================================== */

async function fuchsStartprofil(
  username
) {
  username =
    normalisieren(username);

  const profil =
    await fuchsProfilHolen(
      username
    );

  await fuchsProfilSpeichern(
    profil
  );

  return profil;
}
/* =====================================================
   FUCHSBAU
===================================================== */

const fuchsbauStufen = {
  1: {
    name: "🏠 Kleiner Bau",
    slots: 10,
    raeume: [
      "🛏️ Schlafhöhle",
      "📦 Vorratskiste",
      "🎨 Kleine Dekoration",
    ],
  },

  2: {
    name: "🏡 Fuchshaus",
    slots: 20,
    raeume: [
      "🛏️ Schlafhöhle",
      "📦 Schatzkammer",
      "🎨 Dekorationsplatz",
    ],
  },

  3: {
    name: "🏰 Großer Fuchsbau",
    slots: 30,
    raeume: [
      "🛏️ Schlafhöhle",
      "📦 Schatzkammer",
      "🐾 Begleiterzimmer",
      "⚔️ Trainingsraum",
      "🎨 Dekorationsraum",
    ],
  },

  4: {
    name: "✨ Fuchsanwesen",
    slots: 40,
    raeume: [
      "🛏️ Schlafhöhle",
      "📦 Schatzkammer",
      "🐾 Begleiterzimmer",
      "⚔️ Trainingsraum",
      "🎨 Dekorationsraum",
      "🔐 Geheimraum",
    ],
  },

  5: {
    name: "👑 Fuchsresidenz",
    slots: 50,
    raeume: [
      "🛏️ Schlafhöhle",
      "📦 Schatzkammer",
      "🐾 Begleiterzimmer",
      "⚔️ Trainingsraum",
      "🎨 Dekorationsraum",
      "🔐 Geheimraum",
      "🏆 Trophäenwand",
    ],
  },
};


/* =====================================================
   INVENTAR
===================================================== */

function inventarSlots(
  profil
) {
  const stufe =
    Number(
      profil?.fuchsbauStufe || 1
    );

  return (
    fuchsbauStufen[
      stufe
    ]?.slots || 10
  );
}


/*
   Normale Gegenstände:

   - werden gestapelt
   - maximal 10 pro Stapel
   - jeder Stapel zählt als 1 Slot
*/

function inventarZaehlen(
  inventar
) {
  if (
    !Array.isArray(
      inventar
    )
  ) {
    return 0;
  }

  return inventar.reduce(
    (
      summe,
      item
    ) => {
      const menge =
        Number(
          item.menge || 1
        );

      return (
        summe +
        Math.ceil(
          menge / 10
        )
      );
    },
    0
  );
}


/* =====================================================
   GEGENSTAND INS INVENTAR
===================================================== */

async function gegenstandHinzufuegen(
  username,
  name,
  menge = 1
) {
  username =
    normalisieren(username);

  const profil =
    await fuchsProfilHolen(
      username
    );

  if (
    !name
  ) {
    return false;
  }

  menge =
    Math.max(
      1,
      Number(menge) || 1
    );

  if (
    !Array.isArray(
      profil.inventar
    )
  ) {
    profil.inventar =
      [];
  }

  let verbleibend =
    menge;

  /*
    Erst vorhandene Stapel
    auffüllen.
  */

  for (
    const item of
    profil.inventar
  ) {
    if (
      String(
        item.name
      ).toLowerCase() !==
      String(
        name
      ).toLowerCase()
    ) {
      continue;
    }

    const aktuell =
      Number(
        item.menge || 0
      );

    if (
      aktuell >= 10
    ) {
      continue;
    }

    const frei =
      10 - aktuell;

    const dazu =
      Math.min(
        frei,
        verbleibend
      );

    item.menge =
      aktuell + dazu;

    verbleibend -=
      dazu;

    if (
      verbleibend <= 0
    ) {
      break;
    }
  }

  /*
    Neue Stapel anlegen.
  */

  while (
    verbleibend > 0
  ) {
    const aktuellerSlot =
      inventarZaehlen(
        profil.inventar
      );

    if (
      aktuellerSlot >=
      inventarSlots(profil)
    ) {
      await fuchsProfilSpeichern(
        profil
      );

      return {
        erfolgreich: false,
        grund:
          "Inventar voll",
      };
    }

    const stapel =
      Math.min(
        10,
        verbleibend
      );

    profil.inventar.push({
      name:
        String(name)
          .trim(),

      menge:
        stapel,
    });

    verbleibend -=
      stapel;
  }

  await fuchsProfilSpeichern(
    profil
  );

  return {
    erfolgreich: true,
  };
}


/* =====================================================
   GEGENSTAND AUS INVENTAR ENTFERNEN
===================================================== */

async function gegenstandEntfernen(
  username,
  name,
  menge = 1
) {
  username =
    normalisieren(username);

  const profil =
    await fuchsProfilHolen(
      username
    );

  if (
    !Array.isArray(
      profil.inventar
    )
  ) {
    return false;
  }

  let verbleibend =
    Math.max(
      1,
      Number(menge) || 1
    );

  for (
    let i =
      profil.inventar.length - 1;
    i >= 0;
    i--
  ) {
    const item =
      profil.inventar[i];

    if (
      String(
        item.name
      ).toLowerCase() !==
      String(
        name
      ).toLowerCase()
    ) {
      continue;
    }

    const aktuell =
      Number(
        item.menge || 0
      );

    const entfernen =
      Math.min(
        aktuell,
        verbleibend
      );

    item.menge =
      aktuell -
      entfernen;

    verbleibend -=
      entfernen;

    if (
      item.menge <= 0
    ) {
      profil.inventar.splice(
        i,
        1
      );
    }

    if (
      verbleibend <= 0
    ) {
      break;
    }
  }

  await fuchsProfilSpeichern(
    profil
  );

  return (
    verbleibend <= 0
  );
}


/* =====================================================
   QUEST-GEGENSTÄNDE
=====================================================

   Eigener Bereich.
   Keine normalen Inventarplätze.

===================================================== */

async function questGegenstandHinzufuegen(
  username,
  name,
  menge = 1
) {
  username =
    normalisieren(username);

  const profil =
    await fuchsProfilHolen(
      username
    );

  if (
    !Array.isArray(
      profil.questInventar
    )
  ) {
    profil.questInventar =
      [];
  }

  const vorhandener =
    profil.questInventar.find(
      (item) =>
        String(
          item.name
        ).toLowerCase() ===
        String(
          name
        ).toLowerCase()
    );

  if (
    vorhandener
  ) {
    vorhandener.menge =
      Number(
        vorhandener.menge || 0
      ) +
      Number(menge || 1);
  } else {
    profil.questInventar.push({
      name:
        String(name).trim(),

      menge:
        Number(menge) || 1,
    });
  }

  await fuchsProfilSpeichern(
    profil
  );

  return true;
}


/* =====================================================
   STORY-GEGENSTÄNDE
=====================================================

   Eigener Bereich.
   Nicht verkaufbar.
   Nicht verschenkbar.
   Nicht verlierbar.

===================================================== */

async function storyGegenstandHinzufuegen(
  username,
  name
) {
  username =
    normalisieren(username);

  const profil =
    await fuchsProfilHolen(
      username
    );

  if (
    !Array.isArray(
      profil.storyInventar
    )
  ) {
    profil.storyInventar =
      [];
  }

  const vorhanden =
    profil.storyInventar.find(
      (item) =>
        String(
          item.name
        ).toLowerCase() ===
        String(
          name
        ).toLowerCase()
    );

  if (
    !vorhanden
  ) {
    profil.storyInventar.push({
      name:
        String(name).trim(),

      gefunden:
        new Date().toISOString(),
    });
  }

  await fuchsProfilSpeichern(
    profil
  );

  return true;
}


/* =====================================================
   DEKORATION
===================================================== */

const dekorationen = [
  {
    name: "Kuschelbett",
    preis: 150,
    abStufe: 1,
  },

  {
    name: "Fuchslaterne",
    preis: 100,
    abStufe: 1,
  },

  {
    name: "Kleine Zimmerpflanze",
    preis: 75,
    abStufe: 1,
  },

  {
    name: "Fuchsbild",
    preis: 125,
    abStufe: 1,
  },

  {
    name: "Schöne Vorratskiste",
    preis: 200,
    abStufe: 2,
  },

  {
    name: "Holzregal",
    preis: 175,
    abStufe: 2,
  },

  {
    name: "Fuchs-Kuscheltier",
    preis: 250,
    abStufe: 2,
  },

  {
    name: "Leuchtkristall",
    preis: 400,
    abStufe: 3,
  },

  {
    name: "Trophäenständer",
    preis: 350,
    abStufe: 3,
  },

  {
    name: "Geheimnisvolle Wanddeko",
    preis: 500,
    abStufe: 4,
  },
];


/* =====================================================
   SELTENE DEKORATION
===================================================== */

const selteneDekoration = [
  {
    name:
      "Alter Urfuchs-Thron",

    quelle:
      "Geheimnis",
  },

  {
    name:
      "Alte Fuchsstatue",

    quelle:
      "Abenteuer",
  },

  {
    name:
      "Magischer kleiner Baum",

    quelle:
      "Event",
  },

  {
    name:
      "Seltener Kristallständer",

    quelle:
      "Event",
  },

  {
    name:
      "Historisches Fuchsbild",

    quelle:
      "Community-Legende",
  },
];


/* =====================================================
   TROPHÄENWAND
===================================================== */

function trophaeenPlaetze(
  profil
) {
  const stufe =
    Number(
      profil?.fuchsbauStufe || 1
    );

  if (
    stufe < 5
  ) {
    return 0;
  }

  return 10;
}


async function trophäeAusstellen(
  username,
  name
) {
  username =
    normalisieren(username);

  const profil =
    await fuchsProfilHolen(
      username
    );

  if (
    Number(
      profil.fuchsbauStufe || 1
    ) < 5
  ) {
    return (
      `@${username} 🏠 Die Trophäenwand wird erst mit Fuchsbau-Stufe 5 freigeschaltet.`
    );
  }

  if (
    !Array.isArray(
      profil.ausgestellteTrophaeen
    )
  ) {
    profil.ausgestellteTrophaeen =
      [];
  }

  if (
    profil.ausgestellteTrophaeen
      .length >=
    trophaeenPlaetze(
      profil
    )
  ) {
    return (
      `@${username} 🏆 Deine Trophäenwand ist voll.`
    );
  }

  if (
    profil.ausgestellteTrophaeen
      .includes(name)
  ) {
    return (
      `@${username} 🏆 Diese Trophäe hängt bereits an deiner Wand.`
    );
  }

  profil.ausgestellteTrophaeen.push(
    String(name).trim()
  );

  await fuchsProfilSpeichern(
    profil
  );

  return (
    `🏆 @${username} hat **${name}** an der Trophäenwand ausgestellt! 🦊`
  );
}


/* =====================================================
   FUCHSBAU ANZEIGEN
===================================================== */

async function fuchsbauAnzeigen(
  username
) {
  username =
    normalisieren(username);

  const profil =
    await fuchsProfilHolen(
      username
    );

  const stufe =
    Number(
      profil.fuchsbauStufe || 1
    );

  const bau =
    fuchsbauStufen[
      stufe
    ] ||
    fuchsbauStufen[1];

  const name =
    profil.fuchsbauName ||
    "Mein Fuchsbau";

  const deko =
    Array.isArray(
      profil.dekorationen
    )
      ? profil.dekorationen
      : [];

  const trophaeen =
    Array.isArray(
      profil.ausgestellteTrophaeen
    )
      ? profil.ausgestellteTrophaeen
      : [];

  return (
    `🏠 ${name} | ` +
    `${bau.name} | ` +
    `🎨 ${deko.length} Dekorationen | ` +
    `🏆 ${trophaeen.length}/${trophaeenPlaetze(profil)} Trophäen`
  );
}


/* =====================================================
   BAUSTUFE ERHÖHEN
===================================================== */

const bauKosten = {
  2: 500,
  3: 1500,
  4: 3500,
  5: 7500,
};


async function fuchsbauVerbessern(
  username
) {
  username =
    normalisieren(username);

  const profil =
    await fuchsProfilHolen(
      username
    );

  const alteStufe =
    Number(
      profil.fuchsbauStufe || 1
    );

  const neueStufe =
    alteStufe + 1;

  if (
    neueStufe > 5
  ) {
    return (
      `@${username} 👑 Dein Fuchsbau ist bereits auf der höchsten normalen Stufe.`
    );
  }

  const kosten =
    bauKosten[
      neueStufe
    ];

  if (
    Number(
      profil.coins || 0
    ) < kosten
  ) {
    return (
      `@${username} ❌ Du brauchst ${kosten} Fuchsmünzen für die nächste Bau-Stufe.`
    );
  }

  profil.coins -=
    kosten;

  profil.fuchsbauStufe =
    neueStufe;

  await fuchsProfilSpeichern(
    profil
  );

  const bau =
    fuchsbauStufen[
      neueStufe
    ];

  await streamelementsSenden(
    `🏠✨ ${fuchsAnzeigeName(profil)} hat den Fuchsbau zu **${bau.name}** ausgebaut! 🦊`
  );

  return (
    `@${username} 🏠 Neuer Fuchsbau: ${bau.name} | ` +
    `🎒 ${bau.slots} Inventarplätze`
  );
}


/* =====================================================
   DEKORATION PLATZIEREN
===================================================== */

async function dekorationPlatzieren(
  username,
  name
) {
  username =
    normalisieren(username);

  const profil =
    await fuchsProfilHolen(
      username
    );

  name =
    String(name || "")
      .trim();

  if (!name) {
    return (
      `@${username} 🎨 Schreibe den Namen der Dekoration dazu.`
    );
  }

  const vorhandene =
    Array.isArray(
      profil.dekorationen
    )
      ? profil.dekorationen
      : [];

  const besitzt =
    Array.isArray(
      profil.dekorationsInventar
    )
      ? profil.dekorationsInventar
          .find(
            (item) =>
              String(
                item.name
              ).toLowerCase() ===
              name.toLowerCase()
          )
      : null;

  if (!besitzt) {
    return (
      `@${username} ❌ Diese Dekoration befindet sich nicht in deinem Besitz.`
    );
  }

  profil.dekorationen =
    vorhandene;

  if (
    profil.dekorationen
      .includes(name)
  ) {
    return (
      `@${username} 🎨 Diese Dekoration ist bereits aufgestellt.`
    );
  }

  profil.dekorationen.push(
    name
  );

  await fuchsProfilSpeichern(
    profil
  );

  return (
    `🎨 @${username} hat **${name}** im Fuchsbau aufgestellt! 🏠🦊`
  );
}


/* =====================================================
   DEKORATION EINLAGERN
===================================================== */

async function dekorationEinlagern(
  username,
  name
) {
  username =
    normalisieren(username);

  const profil =
    await fuchsProfilHolen(
      username
    );

  name =
    String(name || "")
      .trim();

  if (
    !Array.isArray(
      profil.dekorationen
    )
  ) {
    profil.dekorationen =
      [];
  }

  const index =
    profil.dekorationen
      .findIndex(
        (x) =>
          String(x).toLowerCase() ===
          name.toLowerCase()
      );

  if (
    index < 0
  ) {
    return (
      `@${username} ❌ Diese Dekoration ist nicht aufgestellt.`
    );
  }

  profil.dekorationen.splice(
    index,
    1
  );

  if (
    !Array.isArray(
      profil.dekorationsInventar
    )
  ) {
    profil.dekorationsInventar =
      [];
  }

  profil.dekorationsInventar.push({
    name,
  });

  await fuchsProfilSpeichern(
    profil
  );

  return (
    `📦 @${username} **${name}** wurde wieder eingelagert. 🦊`
  );
}


/* =====================================================
   INVENTAR ANZEIGEN
===================================================== */

async function inventarAnzeigen(
  username
) {
  username =
    normalisieren(username);

  const profil =
    await fuchsProfilHolen(
      username
    );

  const normal =
    Array.isArray(
      profil.inventar
    )
      ? profil.inventar
      : [];

  const quest =
    Array.isArray(
      profil.questInventar
    )
      ? profil.questInventar
      : [];

  const story =
    Array.isArray(
      profil.storyInventar
    )
      ? profil.storyInventar
      : [];

  const slots =
    inventarSlots(
      profil
    );

  const benutzt =
    inventarZaehlen(
      normal
    );

  const normalText =
    normal.length
      ? normal
          .map(
            (x) =>
              `${x.name} ×${x.menge}`
          )
          .join(", ")
      : "leer";

  const questText =
    quest.length
      ? quest
          .map(
            (x) =>
              `${x.name} ×${x.menge}`
          )
          .join(", ")
      : "leer";

  const storyText =
    story.length
      ? story
          .map(
            (x) =>
              x.name
          )
          .join(", ")
      : "leer";

  return (
    `🎒 @${username} Inventar ` +
    `(${benutzt}/${slots} Slots) | ` +
    `📦 ${normalText} | ` +
    `📜 Quest: ${questText} | ` +
    `🔐 Story: ${storyText}`
  );
}


/* =====================================================
   FUCHSBAU / INVENTAR GRUNDWERTE
===================================================== */

async function fuchsbauGrundwerteSetzen(
  username
) {
  username =
    normalisieren(username);

  const profil =
    await fuchsProfilHolen(
      username
    );

  if (
    !profil.fuchsbauStufe
  ) {
    profil.fuchsbauStufe =
      1;
  }

  if (
    !Array.isArray(
      profil.inventar
    )
  ) {
    profil.inventar =
      [];
  }

  if (
    !Array.isArray(
      profil.questInventar
    )
  ) {
    profil.questInventar =
      [];
  }

  if (
    !Array.isArray(
      profil.storyInventar
    )
  ) {
    profil.storyInventar =
      [];
  }

  if (
    !Array.isArray(
      profil.dekorationsInventar
    )
  ) {
    profil.dekorationsInventar =
      [];
  }

  if (
    !Array.isArray(
      profil.dekorationen
    )
  ) {
    profil.dekorationen =
      [];
  }

  if (
    !Array.isArray(
      profil.ausgestellteTrophaeen
    )
  ) {
    profil.ausgestellteTrophaeen =
      [];
  }

  await fuchsProfilSpeichern(
    profil
  );

  return profil;
}
/* =====================================================
   BEGLEITER-SYSTEM
===================================================== */

const begleiterSeltenheiten = {
  gewoehnlich: {
    name: "⚪ Gewöhnlich",
    faktor: 1,
  },

  ungewoehnlich: {
    name: "🟢 Ungewöhnlich",
    faktor: 1.1,
  },

  selten: {
    name: "🔵 Selten",
    faktor: 1.2,
  },

  episch: {
    name: "🟣 Episch",
    faktor: 1.35,
  },

  legendaer: {
    name: "🟡 Legendär",
    faktor: 1.5,
  },

  mythisch: {
    name: "🔴 Mythisch",
    faktor: 1.75,
  },
};


/* =====================================================
   BEGLEITER-PERSÖNLICHKEITEN
===================================================== */

const begleiterPersoenlichkeiten = [
  "😂 Frech",
  "😴 Faul",
  "⚔️ Mutig",
  "💎 Neugierig",
  "❤️ Treu",
  "👀 Geheimnisvoll",
];


/* =====================================================
   BEGLEITER-STUFEN
===================================================== */

const begleiterStufen = [
  {
    stufe: 1,
    name: "🐣 Neuling",
    freundschaft: 0,
  },

  {
    stufe: 2,
    name: "🐾 Gefährte",
    freundschaft: 100,
  },

  {
    stufe: 3,
    name: "✨ Vertrauter",
    freundschaft: 250,
  },

  {
    stufe: 4,
    name: "🌟 Meisterbegleiter",
    freundschaft: 500,
  },

  {
    stufe: 5,
    name: "👑 Legendärer Begleiter",
    freundschaft: 1000,
  },
];


/* =====================================================
   BEGLEITER-SLOTS
===================================================== */

function begleiterSlots(
  profil
) {
  const stufe =
    Number(
      profil?.fuchsbauStufe || 1
    );

  if (stufe === 1) {
    return {
      aktiv: 1,
      reserve: 0,
    };
  }

  if (stufe === 2) {
    return {
      aktiv: 1,
      reserve: 1,
    };
  }

  if (stufe === 3) {
    return {
      aktiv: 2,
      reserve: 0,
    };
  }

  if (stufe === 4) {
    return {
      aktiv: 2,
      reserve: 2,
    };
  }

  return {
    aktiv: 3,
    reserve: 0,
  };
}


/* =====================================================
   BEGLEITER-LISTE
===================================================== */

const begleiterVorlagen = [
  {
    name: "Fuchsling",
    seltenheit: "gewoehnlich",
    faehigkeit: "Mutmachruf",
  },

  {
    name: "Waldhase",
    seltenheit: "gewoehnlich",
    faehigkeit: "Waldspürer",
  },

  {
    name: "Kleiner Feuerfuchs",
    seltenheit: "ungewoehnlich",
    faehigkeit: "Glutfunke",
  },

  {
    name: "Wasserotter",
    seltenheit: "ungewoehnlich",
    faehigkeit: "Wasserblick",
  },

  {
    name: "Eisfünkchen",
    seltenheit: "selten",
    faehigkeit: "Eisfunke",
  },

  {
    name: "Waldgeist",
    seltenheit: "selten",
    faehigkeit: "Lebenshauch",
  },

  {
    name: "Schattenkater",
    seltenheit: "episch",
    faehigkeit: "Schattenpfad",
  },

  {
    name: "Flammenwolf",
    seltenheit: "legendär",
    faehigkeit: "Flammenruf",
  },

  {
    name: "Eisdrache",
    seltenheit: "legendär",
    faehigkeit: "Frostatem",
  },

  {
    name: "Urfuchs-Geist",
    seltenheit: "mythisch",
    faehigkeit: "Echo des Urfuchses",
  },
];


/* =====================================================
   BEGLEITER ERSTELLEN
===================================================== */

function neuenBegleiterErstellen(
  name,
  seltenheit = "gewoehnlich"
) {
  const vorlage =
    begleiterVorlagen.find(
      (x) =>
        x.name.toLowerCase() ===
        String(name).toLowerCase()
    );

  const basis =
    vorlage ||
    begleiterVorlagen[0];

  const rarity =
    begleiterSeltenheiten[
      seltenheit
    ] ||
    begleiterSeltenheiten[
      basis.seltenheit
    ];

  return {
    id:
      `${Date.now()}-${zufall(1000, 9999)}`,

    name:
      basis.name,

    seltenheit:
      basis.seltenheit,

    seltenheitName:
      rarity.name,

    persoenlichkeit:
      begleiterPersoenlichkeiten[
        zufall(
          0,
          begleiterPersoenlichkeiten.length - 1
        )
      ],

    faehigkeit:
      basis.faehigkeit,

    freundschaft:
      0,

    stufe:
      1,

    stufenName:
      "🐣 Neuling",

    hunger:
      100,

    energie:
      100,

    aktiv:
      false,

    reserve:
      false,

    erstellt:
      new Date().toISOString(),

    abenteuer:
      0,

    kaempfe:
      0,

    siege:
      0,

    besondereFaehigkeitBereit:
      true,

    eiHerkunft:
      null,
  };
}


/* =====================================================
   BEGLEITER HINZUFÜGEN
===================================================== */

async function begleiterHinzufuegen(
  username,
  name,
  seltenheit
) {
  username =
    normalisieren(username);

  const profil =
    await fuchsProfilHolen(
      username
    );

  if (
    !Array.isArray(
      profil.begleiter
    )
  ) {
    profil.begleiter =
      [];
  }

  const neuer =
    neuenBegleiterErstellen(
      name,
      seltenheit
    );

  profil.begleiter.push(
    neuer
  );

  if (
    !Array.isArray(
      profil.aktiveBegleiter
    )
  ) {
    profil.aktiveBegleiter =
      [];
  }

  const slots =
    begleiterSlots(
      profil
    );

  if (
    profil.aktiveBegleiter
      .length <
    slots.aktiv
  ) {
    neuer.aktiv =
      true;

    profil.aktiveBegleiter.push(
      neuer.id
    );
  } else {
    neuer.reserve =
      true;
  }

  await fuchsProfilSpeichern(
    profil
  );

  return neuer;
}


/* =====================================================
   BEGLEITER AUSWÄHLEN
===================================================== */

async function begleiterWaehlen(
  username,
  begleiterName
) {
  username =
    normalisieren(username);

  const profil =
    await fuchsProfilHolen(
      username
    );

  if (
    !Array.isArray(
      profil.begleiter
    )
  ) {
    profil.begleiter =
      [];
  }

  const begleiter =
    profil.begleiter.find(
      (x) =>
        String(
          x.name
        ).toLowerCase() ===
        String(
          begleiterName
        ).toLowerCase()
    );

  if (!begleiter) {
    return (
      `@${username} 🐾 Diesen Begleiter besitzt du nicht.`
    );
  }

  const slots =
    begleiterSlots(
      profil
    );

  if (
    !Array.isArray(
      profil.aktiveBegleiter
    )
  ) {
    profil.aktiveBegleiter =
      [];
  }

  if (
    profil.aktiveBegleiter
      .includes(
        begleiter.id
      )
  ) {
    return (
      `@${username} 🐾 ${begleiter.name} ist bereits aktiv.`
    );
  }

  if (
    profil.aktiveBegleiter
      .length >=
    slots.aktiv
  ) {
    return (
      `@${username} 🐾 Deine aktiven Begleiterplätze sind voll.`
    );
  }

  profil.aktiveBegleiter.push(
    begleiter.id
  );

  begleiter.aktiv =
    true;

  begleiter.reserve =
    false;

  await fuchsProfilSpeichern(
    profil
  );

  return (
    `🐾 @${username} ${begleiter.name} ist jetzt dein aktiver Begleiter! ❤️`
  );
}


/* =====================================================
   BEGLEITER ABWÄHLEN
===================================================== */

async function begleiterAbwaehlen(
  username,
  begleiterName
) {
  username =
    normalisieren(username);

  const profil =
    await fuchsProfilHolen(
      username
    );

  const begleiter =
    profil.begleiter?.find(
      (x) =>
        String(
          x.name
        ).toLowerCase() ===
        String(
          begleiterName
        ).toLowerCase()
    );

  if (!begleiter) {
    return (
      `@${username} 🐾 Diesen Begleiter besitzt du nicht.`
    );
  }

  profil.aktiveBegleiter =
    (
      profil.aktiveBegleiter ||
      []
    ).filter(
      (id) =>
        id !==
        begleiter.id
    );

  begleiter.aktiv =
    false;

  begleiter.reserve =
    true;

  await fuchsProfilSpeichern(
    profil
  );

  return (
    `🐾 @${username} ${begleiter.name} ist jetzt in Reserve.`
  );
}


/* =====================================================
   BEGLEITER FREUNDSCHAFT
===================================================== */

function begleiterStufeBerechnen(
  freundschaft
) {
  freundschaft =
    Number(
      freundschaft || 0
    );

  let aktuell =
    begleiterStufen[0];

  for (
    const stufe
    of begleiterStufen
  ) {
    if (
      freundschaft >=
      stufe.freundschaft
    ) {
      aktuell =
        stufe;
    }
  }

  return aktuell;
}


/* =====================================================
   FREUNDSCHAFT ERHÖHEN
===================================================== */

async function begleiterFreundschaft(
  username,
  begleiterId,
  menge = 10
) {
  username =
    normalisieren(username);

  const profil =
    await fuchsProfilHolen(
      username
    );

  const begleiter =
    profil.begleiter?.find(
      (x) =>
        x.id ===
        begleiterId
    );

  if (!begleiter) {
    return false;
  }

  const alteStufe =
    Number(
      begleiter.stufe || 1
    );

  begleiter.freundschaft =
    Number(
      begleiter.freundschaft || 0
    ) +
    Number(menge || 0);

  const neueStufe =
    begleiterStufeBerechnen(
      begleiter.freundschaft
    );

  begleiter.stufe =
    neueStufe.stufe;

  begleiter.stufenName =
    neueStufe.name;

  if (
    neueStufe.stufe >
    alteStufe
  ) {
    await streamelementsSenden(
      `🐾✨ ${fuchsAnzeigeName(profil)}'s Begleiter ${begleiter.name} ist jetzt ${neueStufe.name}! ❤️`
    );
  }

  await fuchsProfilSpeichern(
    profil
  );

  return true;
}


/* =====================================================
   BEGLEITER FÜTTERN
===================================================== */

async function begleiterFuettern(
  username,
  begleiterName
) {
  username =
    normalisieren(username);

  const profil =
    await fuchsProfilHolen(
      username
    );

  const begleiter =
    profil.begleiter?.find(
      (x) =>
        String(
          x.name
        ).toLowerCase() ===
        String(
          begleiterName
        ).toLowerCase()
    );

  if (!begleiter) {
    return (
      `@${username} 🐾 Diesen Begleiter besitzt du nicht.`
    );
  }

  if (
    begleiter.hunger >=
    100
  ) {
    return (
      `@${username} 🐾 ${begleiter.name} ist bereits satt. ❤️`
    );
  }

  begleiter.hunger =
    Math.min(
      100,
      Number(
        begleiter.hunger || 0
      ) + 25
    );

  await begleiterFreundschaft(
    username,
    begleiter.id,
    10
  );

  return (
    `🍖 @${username} ${begleiter.name} wurde gefüttert! ❤️🐾`
  );
}


/* =====================================================
   BEGLEITER-FÄHIGKEIT
===================================================== */

async function begleiterFaehigkeit(
  username,
  begleiterName
) {
  username =
    normalisieren(username);

  const profil =
    await fuchsProfilHolen(
      username
    );

  const begleiter =
    profil.begleiter?.find(
      (x) =>
        String(
          x.name
        ).toLowerCase() ===
        String(
          begleiterName
        ).toLowerCase()
    );

  if (!begleiter) {
    return (
      `@${username} 🐾 Diesen Begleiter besitzt du nicht.`
    );
  }

  if (
    !begleiter.aktiv
  ) {
    return (
      `@${username} 🐾 ${begleiter.name} muss aktiv sein, um seine Fähigkeit einzusetzen.`
    );
  }

  if (
    !begleiter.besondereFaehigkeitBereit
  ) {
    return (
      `@${username} 🐾 ${begleiter.name}'s Spezialfähigkeit ist noch nicht bereit.`
    );
  }

  const kosten =
    20;

  if (
    Number(
      profil.energie || 0
    ) < kosten
  ) {
    return (
      `@${username} ⚡ Du brauchst ${kosten} Energie.`
    );
  }

  profil.energie -=
    kosten;

  begleiter.besondereFaehigkeitBereit =
    false;

  await fuchsProfilSpeichern(
    profil
  );

  return (
    `✨🐾 ${fuchsAnzeigeName(profil)} setzt **${begleiter.faehigkeit}** mit ${begleiter.name} ein!`
  );
}


/* =====================================================
   BEGLEITER-FÄHIGKEIT ZURÜCKSETZEN
===================================================== */

async function begleiterFaehigkeitErholen(
  username
) {
  username =
    normalisieren(username);

  const profil =
    await fuchsProfilHolen(
      username
    );

  if (
    !Array.isArray(
      profil.begleiter
    )
  ) {
    return;
  }

  for (
    const begleiter
    of profil.begleiter
  ) {
    begleiter.besondereFaehigkeitBereit =
      true;
  }

  await fuchsProfilSpeichern(
    profil
  );
}


/* =====================================================
   BEGLEITER ANZEIGEN
===================================================== */

async function begleiterAnzeigen(
  username
) {
  username =
    normalisieren(username);

  const profil =
    await fuchsProfilHolen(
      username
    );

  const liste =
    Array.isArray(
      profil.begleiter
    )
      ? profil.begleiter
      : [];

  const slots =
    begleiterSlots(
      profil
    );

  if (
    liste.length === 0
  ) {
    return (
      `@${username} 🐾 Du hast noch keinen Begleiter.`
    );
  }

  const text =
    liste
      .map(
        (b) => {
          const aktiv =
            b.aktiv
              ? " ⭐ AKTIV"
              : "";

          return (
            `${b.name} ${b.seltenheitName} | ` +
            `${b.stufenName} | ` +
            `❤️ ${b.freundschaft} | ` +
            `${b.persoenlichkeit}${aktiv}`
          );
        }
      )
      .join(" || ");

  return (
    `🐾 @${username} Begleiter ` +
    `(${slots.aktiv} aktiv / ${slots.reserve} Reserve): ` +
    text
  );
}


/* =====================================================
   BEGLEITER-INFO
===================================================== */

async function begleiterInfo(
  username,
  begleiterName
) {
  username =
    normalisieren(username);

  const profil =
    await fuchsProfilHolen(
      username
    );

  const begleiter =
    profil.begleiter?.find(
      (x) =>
        String(
          x.name
        ).toLowerCase() ===
        String(
          begleiterName
        ).toLowerCase()
    );

  if (!begleiter) {
    return (
      `@${username} 🐾 Diesen Begleiter besitzt du nicht.`
    );
  }

  return (
    `🐾 ${begleiter.name} | ` +
    `${begleiter.seltenheitName} | ` +
    `${begleiter.stufenName} | ` +
    `${begleiter.persoenlichkeit} | ` +
    `❤️ Freundschaft ${begleiter.freundschaft} | ` +
    `✨ Fähigkeit: ${begleiter.faehigkeit} | ` +
    `🍖 Hunger ${begleiter.hunger}/100`
  );
}


/* =====================================================
   BEGLEITER-ABENTEUER
===================================================== */

async function begleiterAbenteuer(
  username,
  begleiterName
) {
  username =
    normalisieren(username);

  const profil =
    await fuchsProfilHolen(
      username
    );

  const begleiter =
    profil.begleiter?.find(
      (x) =>
        String(
          x.name
        ).toLowerCase() ===
        String(
          begleiterName
        ).toLowerCase()
    );

  if (!begleiter) {
    return (
      `@${username} 🐾 Diesen Begleiter besitzt du nicht.`
    );
  }

  const kosten =
    15;

  if (
    Number(
      profil.energie || 0
    ) < kosten
  ) {
    return (
      `@${username} ⚡ Du brauchst ${kosten} Energie für das Begleiter-Abenteuer.`
    );
  }

  profil.energie -=
    kosten;

  begleiter.abenteuer =
    Number(
      begleiter.abenteuer || 0
    ) + 1;

  const wuerfel =
    zufall(
      1,
      100
    );

  let belohnung = "";

  if (
    wuerfel <= 60
  ) {
    const xp =
      zufall(
        25,
        75
      );

    const coins =
      zufall(
        10,
        30
      );

    profil.xp +=
      xp;

    profil.level =
      levelAusXP(
        profil.xp
      );

    profil.coins +=
      coins;

    belohnung =
      `✨ +${xp} XP und +${coins} Fuchsmünzen`;
  } else if (
    wuerfel <= 90
  ) {
    const xp =
      zufall(
        75,
        150
      );

    profil.xp +=
      xp;

    profil.level =
      levelAusXP(
        profil.xp
      );

    belohnung =
      `🌟 +${xp} XP`;
  } else {
    const besondere =
      "Geheimnisvolle Spur";

    await gegenstandHinzufuegen(
      username,
      besondere,
      1
    );

    belohnung =
      `🔐 Dein Begleiter hat eine **${besondere}** gefunden!`;
  }

  await begleiterFreundschaft(
    username,
    begleiter.id,
    25
  );

  await fuchsProfilSpeichern(
    profil
  );

  return (
    `🗺️🐾 ${fuchsAnzeigeName(profil)} und ${begleiter.name} waren gemeinsam unterwegs! ` +
    `${belohnung}`
  );
}


/* =====================================================
   EIER
===================================================== */

const eiZustaende = [
  "🥚 Unbekanntes Ei",
  "🔍 Untersucht",
  "✨ Leuchtend",
  "🌟 Kurz vor dem Schlüpfen",
  "🐾 Geschlüpft",
];


function neuesEiErstellen(
  seltenheit = "selten"
) {
  return {
    id:
      `ei-${Date.now()}-${zufall(1000, 9999)}`,

    seltenheit,

    zustand:
      eiZustaende[0],

    untersuchungen:
      0,

    fortschritt:
      0,

    erstellt:
      new Date().toISOString(),
  };
}


/* =====================================================
   EI UNTERSUCHEN
===================================================== */

async function eiUntersuchen(
  username,
  eiId
) {
  username =
    normalisieren(username);

  const profil =
    await fuchsProfilHolen(
      username
    );

  if (
    !Array.isArray(
      profil.eier
    )
  ) {
    profil.eier =
      [];
  }

  const ei =
    profil.eier.find(
      (x) =>
        x.id ===
        eiId
    );

  if (!ei) {
    return (
      `@${username} 🥚 Dieses Ei wurde nicht gefunden.`
    );
  }

  ei.untersuchungen =
    Number(
      ei.untersuchungen || 0
    ) + 1;

  if (
    ei.untersuchungen >= 3
  ) {
    ei.zustand =
      eiZustaende[1];
  }

  if (
    ei.untersuchungen >= 5
  ) {
    ei.zustand =
      eiZustaende[2];
  }

  await fuchsProfilSpeichern(
    profil
  );

  return (
    `🔍 @${username} untersucht das Ei. Zustand: ${ei.zustand}`
  );
}


/* =====================================================
   EI-FORTSCHRITT
===================================================== */

async function eiFortschritt(
  username
) {
  username =
    normalisieren(username);

  const profil =
    await fuchsProfilHolen(
      username
    );

  if (
    !Array.isArray(
      profil.eier
    )
  ) {
    return;
  }

  for (
    const ei of
    profil.eier
  ) {
    if (
      ei.zustand ===
      eiZustaende[4]
    ) {
      continue;
    }

    ei.fortschritt =
      Number(
        ei.fortschritt || 0
      ) + 1;

    if (
      ei.fortschritt >= 10
    ) {
      ei.zustand =
        eiZustaende[3];
    }
  }

  await fuchsProfilSpeichern(
    profil
  );
}


/* =====================================================
   EI SCHLÜPFEN
===================================================== */

async function eiSchluepfen(
  username,
  eiId
) {
  username =
    normalisieren(username);

  const profil =
    await fuchsProfilHolen(
      username
    );

  if (
    !Array.isArray(
      profil.eier
    )
  ) {
    return (
      `@${username} 🥚 Du hast keine Eier.`
    );
  }

  const index =
    profil.eier.findIndex(
      (x) =>
        x.id ===
        eiId
    );

  if (
    index < 0
  ) {
    return (
      `@${username} 🥚 Dieses Ei wurde nicht gefunden.`
    );
  }

  const ei =
    profil.eier[index];

  if (
    ei.zustand !==
    eiZustaende[3]
  ) {
    return (
      `@${username} 🥚 Dieses Ei ist noch nicht bereit zum Schlüpfen.`
    );
  }

  const kandidaten =
    begleiterVorlagen.filter(
      (x) =>
        x.seltenheit ===
        ei.seltenheit
    );

  const auswahl =
    kandidaten.length
      ? kandidaten
      : begleiterVorlagen;

  const vorlage =
    auswahl[
      zufall(
        0,
        auswahl.length - 1
      )
    ];

  const begleiter =
    await begleiterHinzufuegen(
      username,
      vorlage.name,
      vorlage.seltenheit
    );

  ei.zustand =
    eiZustaende[4];

  profil.eier.splice(
    index,
    1
  );

  await fuchsProfilSpeichern(
    profil
  );

  return (
    `🥚✨ @${username} Dein Ei ist geschlüpft! ` +
    `🐾 Willkommen, **${begleiter.name}**! ${begleiter.seltenheitName}`
  );
}


/* =====================================================
   BEGLEITER-GRUNDWERTE
===================================================== */

async function begleiterGrundwerteSetzen(
  username
) {
  username =
    normalisieren(username);

  const profil =
    await fuchsProfilHolen(
      username
    );

  if (
    !Array.isArray(
      profil.begleiter
    )
  ) {
    profil.begleiter =
      [];
  }

  if (
    !Array.isArray(
      profil.aktiveBegleiter
    )
  ) {
    profil.aktiveBegleiter =
      [];
  }

  if (
    !Array.isArray(
      profil.eier
    )
  ) {
    profil.eier =
      [];
  }

  await fuchsProfilSpeichern(
    profil
  );

  return profil;
}
/* =====================================================
   TEIL 5 – FUCHS-MARKT
===================================================== */

const fuchsMarkt = [
  /* 🏠 Fuchsbau */

  {
    name: "Kuschelbett",
    preis: 150,
    kategorie: "bau",
  },

  {
    name: "Fuchslaterne",
    preis: 100,
    kategorie: "bau",
  },

  {
    name: "Kleine Zimmerpflanze",
    preis: 75,
    kategorie: "bau",
  },

  {
    name: "Fuchsbild",
    preis: 125,
    kategorie: "bau",
  },

  {
    name: "Schöne Vorratskiste",
    preis: 200,
    kategorie: "bau",
  },

  {
    name: "Holzregal",
    preis: 175,
    kategorie: "bau",
  },

  {
    name: "Fuchs-Kuscheltier",
    preis: 250,
    kategorie: "bau",
  },

  {
    name: "Leuchtkristall",
    preis: 400,
    kategorie: "bau",
  },

  {
    name: "Trophäenständer",
    preis: 350,
    kategorie: "bau",
  },

  {
    name: "Geheimnisvolle Wanddeko",
    preis: 500,
    kategorie: "bau",
  },


  /* 🐾 Begleiter */

  {
    name: "Begleiter-Spielzeug",
    preis: 100,
    kategorie: "begleiter",
  },

  {
    name: "Lieblings-Leckerli",
    preis: 75,
    kategorie: "begleiter",
  },

  {
    name: "Kuscheldecke",
    preis: 125,
    kategorie: "begleiter",
  },

  {
    name: "Begleiter-Schleife",
    preis: 150,
    kategorie: "begleiter",
  },

  {
    name: "Kleines Begleiter-Bett",
    preis: 200,
    kategorie: "begleiter",
  },

  {
    name: "Glücksanhänger",
    preis: 250,
    kategorie: "begleiter",
  },

  {
    name: "Leuchtendes Halsband",
    preis: 350,
    kategorie: "begleiter",
  },

  {
    name: "Begleiter-Kristall",
    preis: 400,
    kategorie: "begleiter",
  },

  {
    name: "Seltenes Begleiter-Spielzeug",
    preis: 500,
    kategorie: "begleiter",
  },

  {
    name: "Legendäres Begleiter-Zubehör",
    preis: 750,
    kategorie: "begleiter",
  },


  /* 🗺️ Abenteuer */

  {
    name: "Energie-Trank",
    preis: 100,
    kategorie: "abenteuer",
  },

  {
    name: "Kleiner Heiltrank",
    preis: 125,
    kategorie: "abenteuer",
  },

  {
    name: "Alte Schatzkarte",
    preis: 200,
    kategorie: "abenteuer",
  },

  {
    name: "Fuchslaterne",
    preis: 150,
    kategorie: "abenteuer",
  },

  {
    name: "Altes Fuchs-Kompass",
    preis: 250,
    kategorie: "abenteuer",
  },

  {
    name: "Spurensucher-Lupe",
    preis: 200,
    kategorie: "abenteuer",
  },

  {
    name: "Abenteuer-Rucksack",
    preis: 300,
    kategorie: "abenteuer",
  },

  {
    name: "Glücksblatt",
    preis: 350,
    kategorie: "abenteuer",
  },

  {
    name: "Mysteriöser Schlüssel",
    preis: 500,
    kategorie: "abenteuer",
  },

  {
    name: "Uraltes Fuchs-Artefakt",
    preis: 750,
    kategorie: "abenteuer",
  },


  /* 🎁 Überraschungen */

  {
    name: "Kleine Fuchsbox",
    preis: 150,
    kategorie: "box",
  },

  {
    name: "Große Fuchsbox",
    preis: 300,
    kategorie: "box",
  },

  {
    name: "Glücksbox",
    preis: 500,
    kategorie: "box",
  },

  {
    name: "Geheimnisbox",
    preis: 750,
    kategorie: "box",
  },

  {
    name: "Urfuchs-Truhe",
    preis: 1000,
    kategorie: "box",
  },


  /* 👕 Anpassung */

  {
    name: "Fuchsmütze",
    preis: 150,
    kategorie: "anpassung",
  },

  {
    name: "Fuchsschleife",
    preis: 150,
    kategorie: "anpassung",
  },

  {
    name: "Coole Fuchsbrille",
    preis: 200,
    kategorie: "anpassung",
  },

  {
    name: "Fuchsschal",
    preis: 250,
    kategorie: "anpassung",
  },

  {
    name: "Fuchskrone",
    preis: 500,
    kategorie: "anpassung",
  },

  {
    name: "Leuchteffekt",
    preis: 400,
    kategorie: "anpassung",
  },

  {
    name: "Feuer-Aura",
    preis: 600,
    kategorie: "anpassung",
  },

  {
    name: "Eis-Aura",
    preis: 600,
    kategorie: "anpassung",
  },

  {
    name: "Wald-Aura",
    preis: 600,
    kategorie: "anpassung",
  },

  {
    name: "Wasser-Aura",
    preis: 600,
    kategorie: "anpassung",
  },


  /* ✨ Seltene Gegenstände */

  {
    name: "Urfuchs-Splitter",
    preis: 1500,
    kategorie: "selten",
    gebunden: true,
  },

  {
    name: "Kristall der fünf Kräfte",
    preis: 2000,
    kategorie: "selten",
    gebunden: true,
  },

  {
    name: "Schattenfuchs-Amulett",
    preis: 1750,
    kategorie: "selten",
    gebunden: true,
  },

  {
    name: "Flammenherz-Siegel",
    preis: 1500,
    kategorie: "selten",
    gebunden: true,
  },

  {
    name: "Tiefenquell-Siegel",
    preis: 1500,
    kategorie: "selten",
    gebunden: true,
  },

  {
    name: "Lebenskern-Siegel",
    preis: 1500,
    kategorie: "selten",
    gebunden: true,
  },

  {
    name: "Eiskristall-Siegel",
    preis: 1500,
    kategorie: "selten",
    gebunden: true,
  },

  {
    name: "Schlüssel des Geheimarchivs",
    preis: 2500,
    kategorie: "selten",
    gebunden: true,
  },

  {
    name: "Urfuchs-Krone",
    preis: 5000,
    kategorie: "selten",
    gebunden: true,
  },
];


/* =====================================================
   NICHT KÄUFLICH
===================================================== */

const nichtKaeuflich =
  "Fragment des fünften Geheimnisses";


/* =====================================================
   MARKT ANZEIGEN
===================================================== */

async function marktAnzeigen(
  username
) {
  username =
    normalisieren(username);

  const profil =
    await fuchsProfilHolen(
      username
    );

  const auswahl =
    fuchsMarkt
      .filter(
        (item) => {
          /*
            Ein Teil des Marktes rotiert täglich.
            Normale Gegenstände bleiben regelmäßig
            verfügbar.
          */

          const zahl =
            (
              tagesNummerBerechnen() +
              item.name.length
            ) % 5;

          return (
            item.kategorie ===
              "bau" ||
            zahl !== 0
          );
        }
      )
      .slice(
        0,
        15
      );

  const text =
    auswahl
      .map(
        (item) =>
          `${item.name} – ${item.preis} 🪙`
      )
      .join(" | ");

  return (
    `🏪 Fuchs-Markt | ` +
    `💰 ${profil.coins} Fuchsmünzen | ` +
    text
  );
}


/* =====================================================
   ARTIKEL KAUFEN
===================================================== */

async function marktKaufen(
  username,
  artikelName
) {
  username =
    normalisieren(username);

  const profil =
    await fuchsProfilHolen(
      username
    );

  artikelName =
    String(
      artikelName || ""
    ).trim();

  if (
    !artikelName
  ) {
    return (
      `@${username} 🏪 Schreibe den Namen des Artikels dazu.`
    );
  }

  if (
    artikelName.toLowerCase() ===
    nichtKaeuflich.toLowerCase()
  ) {
    return (
      `@${username} 🔐 Dieses Fragment kann nicht gekauft werden.`
    );
  }

  const artikel =
    fuchsMarkt.find(
      (item) =>
        item.name.toLowerCase() ===
        artikelName.toLowerCase()
    );

  if (!artikel) {
    return (
      `@${username} ❌ Dieser Gegenstand ist nicht im Fuchs-Markt.`
    );
  }

  const stufe =
    Number(
      profil.fuchsbauStufe || 1
    );

  if (
    artikel.kategorie ===
      "bau"
  ) {
    const deko =
      dekorationen.find(
        (x) =>
          x.name.toLowerCase() ===
          artikel.name.toLowerCase()
      );

    if (
      deko &&
      stufe < deko.abStufe
    ) {
      return (
        `@${username} 🔒 Diese Dekoration wird erst ab Fuchsbau-Stufe ${deko.abStufe} freigeschaltet.`
      );
    }
  }

  if (
    Number(
      profil.coins || 0
    ) < artikel.preis
  ) {
    return (
      `@${username} ❌ Du hast nicht genug Fuchsmünzen.`
    );
  }

  profil.coins -=
    artikel.preis;

  /*
    Anpassungsgegenstände werden separat gespeichert,
    Dekorationen separat und normale Gegenstände
    im normalen Inventar.
  */

  if (
    artikel.kategorie ===
    "anpassung"
  ) {
    if (
      !Array.isArray(
        profil.anpassung
      )
    ) {
      profil.anpassung =
        [];
    }

    profil.anpassung.push(
      artikel.name
    );
  } else if (
    artikel.kategorie ===
    "bau"
  ) {
    if (
      !Array.isArray(
        profil.dekorationsInventar
      )
    ) {
      profil.dekorationsInventar =
        [];
    }

    profil.dekorationsInventar.push({
      name:
        artikel.name,
    });
  } else if (
    artikel.kategorie ===
    "begleiter"
  ) {
    if (
      !Array.isArray(
        profil.begleiterInventar
      )
    ) {
      profil.begleiterInventar =
        [];
    }

    profil.begleiterInventar.push({
      name:
        artikel.name,
        menge:
          1,
    });
  } else {
    const ergebnis =
      await gegenstandHinzufuegen(
        username,
        artikel.name,
        1
      );

    if (
      !ergebnis?.erfolgreich
    ) {
      profil.coins +=
        artikel.preis;

      await fuchsProfilSpeichern(
        profil
      );

      return (
        `@${username} 🎒 Dein Inventar ist voll. Der Kauf wurde nicht durchgeführt.`
      );
    }
  }

  await fuchsProfilSpeichern(
    profil
  );

  return (
    `🏪🦊 @${username} hat **${artikel.name}** für ${artikel.preis} Fuchsmünzen gekauft!`
  );
}


/* =====================================================
   BOX ÖFFNEN
===================================================== */

async function fuchsBoxOeffnen(
  username,
  boxName
) {
  username =
    normalisieren(username);

  const profil =
    await fuchsProfilHolen(
      username
    );

  const box =
    fuchsMarkt.find(
      (x) =>
        x.name.toLowerCase() ===
        String(
          boxName
        ).toLowerCase()
    );

  if (
    !box ||
    box.kategorie !==
      "box"
  ) {
    return (
      `@${username} 🎁 Diese Box gibt es nicht.`
    );
  }

  const entfernt =
    await gegenstandEntfernen(
      username,
      box.name,
      1
    );

  if (!entfernt) {
    return (
      `@${username} 🎁 Du besitzt diese Box nicht.`
    );
  }

  const wuerfel =
    zufall(
      1,
      100
    );

  let belohnung;

  if (
    wuerfel <= 45
  ) {
    const coins =
      zufall(
        50,
        200
      );

    profil.coins +=
      coins;

    belohnung =
      `💰 +${coins} Fuchsmünzen`;
  } else if (
    wuerfel <= 75
  ) {
    const xp =
      zufall(
        50,
        200
      );

    profil.xp +=
      xp;

    profil.level =
      levelAusXP(
        profil.xp
      );

    belohnung =
      `✨ +${xp} XP`;
  } else if (
    wuerfel <= 95
  ) {
    const gegenstand =
      [
        "Energie-Trank",
        "Glücksblatt",
        "Begleiter-Spielzeug",
        "Fuchsbild",
      ][
        zufall(
          0,
          3
        )
      ];

    await gegenstandHinzufuegen(
      username,
      gegenstand,
      1
    );

    belohnung =
      `🎁 ${gegenstand}`;
  } else {
    const selten =
      [
        "Urfuchs-Splitter",
        "Schattenfuchs-Amulett",
        "Kristall der fünf Kräfte",
      ][
        zufall(
          0,
          2
        )
      ];

    await storyGegenstandHinzufuegen(
      username,
      selten
    );

    belohnung =
      `🌟🔐 ${selten}`;
  }

  await fuchsProfilSpeichern(
    profil
  );

  return (
    `🎁✨ @${username} öffnet ${box.name}: ${belohnung}`
  );
}


/* =====================================================
   FUCHS-BANK
===================================================== */

function bankStartprofil(
  profil
) {
  if (
    typeof profil.bank !==
    "object" ||
    profil.bank === null
  ) {
    profil.bank = {
      konto: 0,
      letzteZinsen: null,
    };
  }

  if (
    typeof profil.bank.konto !==
    "number"
  ) {
    profil.bank.konto =
      Number(
        profil.bank.konto || 0
      );
  }

  return profil;
}


/* =====================================================
   BANK ANZEIGEN
===================================================== */

async function bankAnzeigen(
  username
) {
  username =
    normalisieren(username);

  const profil =
    bankStartprofil(
      await fuchsProfilHolen(
        username
      )
    );

  await fuchsProfilSpeichern(
    profil
  );

  return (
    `🏦 @${username} Fuchs-Bank: ` +
    `💰 ${profil.bank.konto} Fuchsmünzen auf dem Konto | ` +
    `👛 ${profil.coins} im Geldbeutel`
  );
}


/* =====================================================
   BANK EINZAHLEN
===================================================== */

async function bankEinzahlen(
  username,
  menge
) {
  username =
    normalisieren(username);

  menge =
    Math.floor(
      Number(menge)
    );

  if (
    !Number.isFinite(
      menge
    ) ||
    menge <= 0
  ) {
    return (
      `@${username} 🏦 Gib eine gültige Menge an.`
    );
  }

  const profil =
    bankStartprofil(
      await fuchsProfilHolen(
        username
      )
    );

  if (
    profil.coins <
    menge
  ) {
    return (
      `@${username} ❌ Du hast nicht genug Fuchsmünzen im Geldbeutel.`
    );
  }

  profil.coins -=
    menge;

  profil.bank.konto +=
    menge;

  await fuchsProfilSpeichern(
    profil
  );

  return (
    `🏦 @${username} hat ${menge} Fuchsmünzen eingezahlt. Kontostand: ${profil.bank.konto} 🪙`
  );
}


/* =====================================================
   BANK AUSZAHLEN
===================================================== */

async function bankAuszahlen(
  username,
  menge
) {
  username =
    normalisieren(username);

  menge =
    Math.floor(
      Number(menge)
    );

  if (
    !Number.isFinite(
      menge
    ) ||
    menge <= 0
  ) {
    return (
      `@${username} 🏦 Gib eine gültige Menge an.`
    );
  }

  const profil =
    bankStartprofil(
      await fuchsProfilHolen(
        username
      )
    );

  if (
    profil.bank.konto <
    menge
  ) {
    return (
      `@${username} ❌ Auf deinem Bankkonto liegt nicht genug.`
    );
  }

  profil.bank.konto -=
    menge;

  profil.coins +=
    menge;

  await fuchsProfilSpeichern(
    profil
  );

  return (
    `🏦 @${username} hat ${menge} Fuchsmünzen abgehoben. 💰`
  );
}


/* =====================================================
   BANK-ZINSEN
===================================================== */

async function bankZinsenPruefen(
  username
) {
  username =
    normalisieren(username);

  const profil =
    bankStartprofil(
      await fuchsProfilHolen(
        username
      )
    );

  const heute =
    deutschesDatum();

  if (
    profil.bank.letzteZinsen ===
    heute
  ) {
    return;
  }

  const konto =
    Number(
      profil.bank.konto || 0
    );

  if (
    konto <= 0
  ) {
    profil.bank.letzteZinsen =
      heute;

    await fuchsProfilSpeichern(
      profil
    );

    return;
  }

  const zinsen =
    Math.floor(
      konto * 0.01
    );

  if (
    zinsen > 0
  ) {
    profil.bank.konto +=
      zinsen;
  }

  profil.bank.letzteZinsen =
    heute;

  await fuchsProfilSpeichern(
    profil
  );
}


/* =====================================================
   FUCHS-POST
===================================================== */

async function postSenden(
  username,
  empfaenger,
  nachricht
) {
  username =
    normalisieren(username);

  empfaenger =
    normalisieren(empfaenger);

  const profil =
    await fuchsProfilHolen(
      username
    );

  if (
    !Array.isArray(
      profil.post
    )
  ) {
    profil.post =
      [];
  }

  const post =
    {
      von:
        username,

      nachricht:
        String(
          nachricht || ""
        ).trim(),

      zeit:
        new Date().toISOString(),

      gelesen:
        false,
    };

  if (
    !post.nachricht
  ) {
    return (
      `@${username} 📬 Schreibe deine Nachricht dazu.`
    );
  }

  const ziel =
    await fuchsProfilHolen(
      empfaenger
    );

  if (
    !Array.isArray(
      ziel.posteingang
    )
  ) {
    ziel.posteingang =
      [];
  }

  ziel.posteingang.push(
    post
  );

  await fuchsProfilSpeichern(
    ziel
  );

  await streamelementsSenden(
    `📬 @${empfaenger} hat neue Fuchs-Post von @${username}! 🦊`
  );

  return (
    `📬 @${username} Nachricht an @${empfaenger} wurde verschickt.`
  );
}


/* =====================================================
   POST ANZEIGEN
===================================================== */

async function postAnzeigen(
  username
) {
  username =
    normalisieren(username);

  const profil =
    await fuchsProfilHolen(
      username
    );

  const inbox =
    Array.isArray(
      profil.posteingang
    )
      ? profil.posteingang
      : [];

  if (
    inbox.length === 0
  ) {
    return (
      `📬 @${username} Du hast keine Fuchs-Post.`
    );
  }

  const letzte =
    inbox.slice(
      -5
    );

  const text =
    letzte
      .map(
        (post) =>
          `@${post.von}: ${post.nachricht}`
      )
      .join(" | ");

  return (
    `📬 @${username} Letzte Post: ${text}`
  );
}


/* =====================================================
   TAUSCHPLATZ
===================================================== */

async function tauschAngebotErstellen(
  username,
  zielname,
  artikel,
  coins = 0
) {
  username =
    normalisieren(username);

  zielname =
    normalisieren(zielname);

  const profil =
    await fuchsProfilHolen(
      username
    );

  const ziel =
    await fuchsProfilHolen(
      zielname
    );

  artikel =
    String(
      artikel || ""
    ).trim();

  coins =
    Math.max(
      0,
      Math.floor(
        Number(coins) || 0
      )
    );

  if (
    artikel
      .toLowerCase() ===
    nichtKaeuflich.toLowerCase()
  ) {
    return (
      `@${username} 🔐 Story-Gegenstände können nicht getauscht werden.`
    );
  }

  if (
    coins >
    profil.coins
  ) {
    return (
      `@${username} ❌ Du hast nicht genug Fuchsmünzen.`
    );
  }

  const vorhanden =
    profil.inventar?.some(
      (item) =>
        String(
          item.name
        ).toLowerCase() ===
        artikel.toLowerCase()
    );

  if (
    !vorhanden &&
    artikel
  ) {
    return (
      `@${username} ❌ Du besitzt diesen Gegenstand nicht.`
    );
  }

  if (
    !Array.isArray(
      ziel.tauschangebote
    )
  ) {
    ziel.tauschangebote =
      [];
  }

  const angebot = {
    id:
      `tausch-${Date.now()}-${zufall(1000, 9999)}`,

    von:
      username,

    an:
      zielname,

    artikel:
      artikel || null,

    coins:
      coins,

    status:
      "offen",

    erstellt:
      new Date().toISOString(),
  };

  ziel.tauschangebote.push(
    angebot
  );

  await fuchsProfilSpeichern(
    ziel
  );

  return (
    `🤝 @${username} hat @${zielname} ein Tauschangebot geschickt. ` +
    `Bestätigung erforderlich.`
  );
}


/* =====================================================
   TAUSCHANGEBOTE ANZEIGEN
===================================================== */

async function tauschAnzeigen(
  username
) {
  username =
    normalisieren(username);

  const profil =
    await fuchsProfilHolen(
      username
    );

  const angebote =
    Array.isArray(
      profil.tauschangebote
    )
      ? profil.tauschangebote.filter(
          (x) =>
            x.status ===
            "offen"
        )
      : [];

  if (
    angebote.length ===
    0
  ) {
    return (
      `🤝 @${username} Du hast keine offenen Tauschangebote.`
    );
  }

  const text =
    angebote
      .map(
        (x) =>
          `#${x.id} von @${x.von}: ` +
          `${x.artikel || "kein Gegenstand"} + ${x.coins} 🪙`
      )
      .join(" | ");

  return (
    `🤝 @${username} Offene Angebote: ${text}`
  );
}


/* =====================================================
   TAUSCH ABBRECHEN
===================================================== */

async function tauschAbbrechen(
  username,
  angebotId
) {
  username =
    normalisieren(username);

  const profil =
    await fuchsProfilHolen(
      username
    );

  const angebot =
    profil.tauschangebote?.find(
      (x) =>
        x.id ===
        angebotId
    );

  if (!angebot) {
    return (
      `@${username} 🤝 Angebot nicht gefunden.`
    );
  }

  if (
    angebot.von !==
    username
  ) {
    return (
      `@${username} ❌ Du kannst nur deine eigenen Angebote abbrechen.`
    );
  }

  if (
    angebot.status !==
    "offen"
  ) {
    return (
      `@${username} 🤝 Dieses Angebot ist nicht mehr offen.`
    );
  }

  angebot.status =
    "abgebrochen";

  await fuchsProfilSpeichern(
    profil
  );

  return (
    `🤝 @${username} Das Tauschangebot wurde abgebrochen.`
  );
}


/* =====================================================
   WERTVOLLE STORY-GEGENSTÄNDE
===================================================== */

function istGebundenerGegenstand(
  name
) {
  const item =
    fuchsMarkt.find(
      (x) =>
        x.name.toLowerCase() ===
        String(
          name
        ).toLowerCase()
    );

  return (
    item?.gebunden === true ||
    String(
      name
    ).toLowerCase() ===
    nichtKaeuflich.toLowerCase()
  );
}
// ============================================================
// TEIL 6/10 – DIE FUCHSWELT
// ============================================================

const fuchsweltOrte = {
  fuchsdorf: {
    name: "🏡 Fuchsdorf",
    beschreibung: "Das Herz der MitsusundWandasWelt.",
    gebiete: ["Dorfplatz", "Fuchsbau", "Fuchs-Markt", "Abenteuer-Tafel", "Kampfplatz", "Geheimarchiv", "Tor der fünf Kräfte"]
  },

  feuertal: {
    name: "🌋 Feuertal",
    rudel: "🔥 Feuerrudel",
    beschreibung: "Ein heißes Tal voller Feuer, Lava und alter Spuren.",
    wesen: ["🔥 Flammenwolf"]
  },

  wasserlande: {
    name: "🌊 Wasserlande",
    rudel: "🌊 Wasserrudel",
    beschreibung: "Eine geheimnisvolle Wasserwelt mit Quellen, Inseln und alten Ruinen.",
    wesen: ["🌊 Wassergeist"]
  },

  fuchswald: {
    name: "🌲 Fuchswald",
    rudel: "🌲 Waldrudel",
    beschreibung: "Ein uralter Wald voller Geheimnisse.",
    wesen: ["🌲 Waldhüter"]
  },

  eisberge: {
    name: "❄️ Eisberge",
    rudel: "🧊 ICErudel",
    beschreibung: "Eine eisige Bergwelt mit Schnee, Stürmen und alten Kristallen.",
    wesen: ["❄️ Eisdrache"]
  },

  verborgeneTal: {
    name: "🌌 Verborgene Tal",
    beschreibung: "Ein geheimnisvoller Ort, der erst durch das fünfte Fragment erreichbar wird.",
    wesen: ["❓ Unbekannte Wesen"]
  }
};


// ============================================================
// TAGESZEIT
// ============================================================

function fuchsTageszeit() {
  const stunde = Number(
    new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      hour: "2-digit",
      hour12: false
    }).format(new Date())
  );

  if (stunde >= 6 && stunde < 11) return "🌅 Morgen";
  if (stunde >= 11 && stunde < 18) return "☀️ Tag";
  if (stunde >= 18 && stunde < 22) return "🌇 Abend";
  return "🌙 Nacht";
}


// ============================================================
// JAHRESZEIT
// ============================================================

function fuchsJahreszeit() {
  const monat = Number(
    new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      month: "numeric"
    }).format(new Date())
  );

  if (monat >= 3 && monat <= 5) return "🌸 Frühling";
  if (monat >= 6 && monat <= 8) return "☀️ Sommer";
  if (monat >= 9 && monat <= 11) return "🍂 Herbst";
  return "❄️ Winter";
}


// ============================================================
// WETTER
// ============================================================

const fuchsWetter = [
  "☀️ Sonnig",
  "☁️ Bewölkt",
  "🌧️ Regen",
  "⛈️ Gewitter",
  "🌫️ Nebel",
  "❄️ Schnee",
  "🌪️ Sturm"
];

function fuchsWetterAktuell() {
  const tag = Number(
    new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      day: "numeric"
    }).format(new Date())
  );

  return fuchsWetter[tag % fuchsWetter.length];
}


// ============================================================
// WELTSTATUS
// ============================================================

function fuchsWeltStatus() {
  return {
    tageszeit: fuchsTageszeit(),
    jahreszeit: fuchsJahreszeit(),
    wetter: fuchsWetterAktuell()
  };
}


// ============================================================
// WESEN
// ============================================================

const fuchsWesen = {
  schattenfuchs: {
    name: "🌑 Schattenfuchs",
    ort: "🌙 Nacht",
    beschreibung: "Ein seltenes Wesen, das nur nachts auftaucht.",
    seltenheit: "Selten"
  },

  flammenwolf: {
    name: "🔥 Flammenwolf",
    ort: "🌋 Feuertal",
    beschreibung: "Ein mächtiges Wesen aus den heißen Gebieten.",
    seltenheit: "Selten"
  },

  eisdrache: {
    name: "❄️ Eisdrache",
    ort: "❄️ Eisberge",
    beschreibung: "Ein geheimnisvoller Drache aus dem ewigen Eis.",
    seltenheit: "Episch"
  },

  wassergeist: {
    name: "🌊 Wassergeist",
    ort: "🌊 Wasserlande",
    beschreibung: "Ein alter Geist, der über die Wasserlande wacht.",
    seltenheit: "Episch"
  },

  waldhueter: {
    name: "🌲 Waldhüter",
    ort: "🌲 Fuchswald",
    beschreibung: "Der Wächter des uralten Waldes.",
    seltenheit: "Legendär"
  }
};


// ============================================================
// WESEN FÜR SPIELER
// ============================================================

function entdeckteWesen(profil) {
  if (!profil.wesenEntdeckt) {
    profil.wesenEntdeckt = [];
  }

  return profil.wesenEntdeckt;
}

function wesenEntdecken(profil, wesenKey) {
  const liste = entdeckteWesen(profil);

  if (!fuchsWesen[wesenKey]) {
    return false;
  }

  if (liste.includes(wesenKey)) {
    return false;
  }

  liste.push(wesenKey);
  return true;
}


// ============================================================
// WELTKARTE
// ============================================================

function fuchsKarte(profil) {
  const status = fuchsWeltStatus();

  let text = "🗺️ FUCHSWELT-KARTE | ";

  text += `${status.tageszeit} | ${status.jahreszeit} | ${status.wetter}\n`;

  text += "🏡 Fuchsdorf\n";
  text += " ├─ 🌋 Feuertal 🔥\n";
  text += " ├─ 🌊 Wasserlande 🌊\n";
  text += " ├─ 🌲 Fuchswald 🌲\n";
  text += " └─ ❄️ Eisberge 🧊\n";

  if (
    profil &&
    profil.fuenftesFragmentGefunden
  ) {
    text += " └─ 🌌 Verborgene Tal 🔓\n";
  } else {
    text += " └─ 🌌 Verborgene Tal 🔒\n";
  }

  return text;
}


// ============================================================
// DORF
// ============================================================

function fuchsDorfAnzeigen() {
  return (
    "🏡 FUCHSDORF\n" +
    "Willkommen im Herzen der MitsusundWandasWelt! 🦊\n\n" +
    "🏠 Fuchsbau\n" +
    "🏪 Fuchs-Markt\n" +
    "🎯 Abenteuer-Tafel\n" +
    "⚔️ Kampfplatz\n" +
    "🐾 Begleiter-Haus\n" +
    "🗺️ Weltkarte\n" +
    "🌟 Dorfplatz\n" +
    "🔐 Geheimarchiv\n" +
    "🌙 Tor der fünf Kräfte"
  );
}


// ============================================================
// GEBIETSINFORMATION
// ============================================================

function fuchsGebietInfo(gebiet) {
  const key = normalisieren(gebiet);

  const mapping = {
    "feuertal": "feuertal",
    "feuer": "feuertal",

    "wasserlande": "wasserlande",
    "wasser": "wasserlande",

    "fuchswald": "fuchswald",
    "wald": "fuchswald",

    "eisberge": "eisberge",
    "ice": "eisberge",

    "fuchsdorf": "fuchsdorf",
    "dorf": "fuchsdorf"
  };

  const ziel = mapping[key];

  if (!ziel || !fuchsweltOrte[ziel]) {
    return "❓ Dieses Gebiet kenne ich noch nicht.";
  }

  const ort = fuchsweltOrte[ziel];

  let text = `${ort.name}\n`;
  text += `${ort.beschreibung}`;

  if (ort.rudel) {
    text += `\n${ort.rudel}`;
  }

  if (ort.wesen) {
    text += `\n👾 Wesen: ${ort.wesen.join(", ")}`;
  }

  return text;
}


// ============================================================
// VIER VERLORENE KRÄFTE
// ============================================================

const fuenfKraefte = {
  feuer: {
    name: "🔥 Flammenherz-Essenz",
    bedeutung: "Mut & Stärke",
    ort: "🌋 Feuertal"
  },

  wasser: {
    name: "🌊 Tiefenquell",
    bedeutung: "Einheit & Weisheit",
    ort: "🌊 Wasserlande"
  },

  wald: {
    name: "🌲 Lebenskern",
    bedeutung: "Leben & Erneuerung",
    ort: "🌲 Fuchswald"
  },

  eis: {
    name: "🧊 Eiskristall",
    bedeutung: "Ruhe & Ausdauer",
    ort: "❄️ Eisberge"
  },

  fuenftes: {
    name: "🌙 Das fünfte Fragment",
    bedeutung: "Noch unbekannt",
    ort: "🌌 Verborgene Tal"
  }
};


// ============================================================
// KRÄFTE-STATUS
// ============================================================

function kraefteStatus(profil) {
  if (!profil.kraefte) {
    profil.kraefte = {
      feuer: false,
      wasser: false,
      wald: false,
      eis: false,
      fuenftes: false
    };
  }

  return profil.kraefte;
}


// ============================================================
// KRAFT ENTDECKEN
// ============================================================

function kraftEntdecken(profil, kraft) {
  const status = kraefteStatus(profil);

  if (!Object.prototype.hasOwnProperty.call(status, kraft)) {
    return false;
  }

  if (status[kraft]) {
    return false;
  }

  status[kraft] = true;

  if (kraft === "fuenftes") {
    profil.fuenftesFragmentGefunden = true;
  }

  return true;
}


// ============================================================
// TOR DER FÜNF KRÄFTE
// ============================================================

function torDerFuenfKraefte(profil) {
  const status = kraefteStatus(profil);

  const vierGefunden =
    status.feuer &&
    status.wasser &&
    status.wald &&
    status.eis;

  let text = "🌙 TOR DER FÜNF KRÄFTE\n\n";

  text += `${status.feuer ? "✅" : "❌"} 🔥 Flammenherz-Essenz\n`;
  text += `${status.wasser ? "✅" : "❌"} 🌊 Tiefenquell\n`;
  text += `${status.wald ? "✅" : "❌"} 🌲 Lebenskern\n`;
  text += `${status.eis ? "✅" : "❌"} 🧊 Eiskristall\n`;

  if (vierGefunden) {
    text += "\n🌙 Das Tor reagiert auf eure vier Kräfte.";
    text += "\n❓ Etwas fehlt noch...";
  } else {
    text += "\n🔒 Das Tor wartet auf die vier verlorenen Kräfte.";
  }

  if (status.fuenftes) {
    text += "\n\n🌌 Das fünfte Fragment wurde gefunden.";
    text += "\n🚪 Ein neuer Weg hat sich geöffnet.";
  }

  return text;
}


// ============================================================
// ABENTEUER
// ============================================================

const abenteuerGebiete = [
  "🌲 Fuchswald",
  "🌋 Feuertal",
  "🌊 Wasserlande",
  "❄️ Eisberge"
];

const abenteuerFunde = [
  "🪙 ein paar Fuchsmünzen",
  "✨ einen geheimnisvollen Kristall",
  "🗺️ eine alte Karte",
  "🌿 eine seltene Pflanze",
  "🔎 eine seltsame Spur",
  "📜 eine alte Nachricht",
  "🎁 eine kleine Überraschung"
];

function fuchsAbenteuerStart(profil) {
  if (!profil.abenteuer) {
    profil.abenteuer = null;
  }

  if (profil.abenteuer) {
    return "🗺️ Du bist bereits auf einem Abenteuer.";
  }

  if ((profil.energie || 0) < 10) {
    return "⚡ Du hast nicht genug Energie für ein Abenteuer.";
  }

  profil.energie = Math.max(0, (profil.energie || 0) - 10);

  const ort =
    abenteuerGebiete[
      zufall(0, abenteuerGebiete.length - 1)
    ];

  profil.abenteuer = {
    ort,
    gestartet: Date.now()
  };

  return (
    `🗺️ ABENTEUER GESTARTET!\n` +
    `Du machst dich auf den Weg nach ${ort}.\n` +
    `⚡ -10 Energie\n` +
    `🦊 Vielleicht wartet dort etwas Besonderes auf dich...`
  );
}


function fuchsAbenteuerBeenden(profil) {
  if (!profil.abenteuer) {
    return "🗺️ Du bist gerade auf keinem Abenteuer.";
  }

  const abenteuer = profil.abenteuer;

  const dauer =
    Date.now() - Number(abenteuer.gestartet || Date.now());

  const minDauer = 60 * 1000;

  if (dauer < minDauer) {
    const rest =
      Math.ceil((minDauer - dauer) / 1000);

    return `⏳ Dein Abenteuer läuft noch. Warte noch etwa ${rest} Sekunden.`;
  }

  profil.abenteuer = null;

  const fund =
    abenteuerFunde[
      zufall(0, abenteuerFunde.length - 1)
    ];

  const xp = zufall(20, 80);
  const coins = zufall(10, 40);

  profil.xp = Number(profil.xp || 0) + xp;
  profil.muenzen = Number(profil.muenzen || 0) + coins;

  return (
    `🗺️ ABENTEUER BEENDET!\n` +
    `📍 ${abenteuer.ort}\n` +
    `🔎 Gefunden: ${fund}\n` +
    `✨ +${xp} XP\n` +
    `🪙 +${coins} Fuchsmünzen`
  );
}


// ============================================================
// ENTDECKUNGSBUCH
// ============================================================

function entdeckungen(profil) {
  if (!profil.entdeckungen) {
    profil.entdeckungen = [];
  }

  return profil.entdeckungen;
}

function entdeckungHinzufuegen(profil, text) {
  const liste = entdeckungen(profil);

  if (!liste.includes(text)) {
    liste.push(text);
    return true;
  }

  return false;
}

function entdeckungsbuchAnzeigen(profil) {
  const liste = entdeckungen(profil);

  if (!liste.length) {
    return "📖 FUCHS-ENTDECKUNGSBUCH\nNoch keine Entdeckungen. 🦊";
  }

  return (
    "📖 FUCHS-ENTDECKUNGSBUCH\n" +
    liste.map((x, i) => `${i + 1}. ${x}`).join("\n")
  );
}


// ============================================================
// GEHEIMNISSE
// ============================================================

function geheimnisAnzeigen(profil) {
  if (!profil.geheimnisse) {
    profil.geheimnisse = [];
  }

  if (!profil.geheimnisse.length) {
    return (
      "🔐 FUCHS-GEHEIMNISSE\n" +
      "❓ Noch kein Geheimnis wurde entdeckt."
    );
  }

  return (
    "🔐 FUCHS-GEHEIMNISSE\n" +
    profil.geheimnisse.map((x, i) => `${i + 1}. ${x}`).join("\n")
  );
}

function geheimnisHinzufuegen(profil, text) {
  if (!profil.geheimnisse) {
    profil.geheimnisse = [];
  }

  if (profil.geheimnisse.includes(text)) {
    return false;
  }

  profil.geheimnisse.push(text);
  return true;
}


// ============================================================
// FUCHS-ARCHIV
// ============================================================

const fuchsArchiv = [
  "📜 Der Urfuchs erschuf einst die vier Kräfte.",
  "🔥 Aus der Flamme entstand das Feuerrudel.",
  "🌊 Aus dem Wasser entstand das Wasserrudel.",
  "🌲 Aus der Natur entstand das Waldrudel.",
  "🧊 Aus dem Eis entstand das ICErudel.",
  "🌙 Der Urfuchs verschwand eines Tages.",
  "❓ Sein wahrer Grund ist noch unbekannt."
];

function fuchsArchivAnzeigen() {
  return (
    "📚 FUCHS-ARCHIV\n" +
    fuchsArchiv.join("\n")
  );
}


// ============================================================
// FUCHS-CHRONIK
// ============================================================

function fuchsChronik(profil) {
  if (!profil.chronik) {
    profil.chronik = [];
  }

  return profil.chronik;
}

function chronikEintrag(profil, text) {
  const liste = fuchsChronik(profil);

  liste.push({
    text,
    zeit: new Date().toISOString()
  });

  if (liste.length > 100) {
    liste.shift();
  }
}

function chronikAnzeigen(profil) {
  const liste = fuchsChronik(profil);

  if (!liste.length) {
    return "📖 FUCHS-CHRONIK\nDeine Geschichte beginnt erst. 🦊";
  }

  const letzte = liste.slice(-10);

  return (
    "📖 FUCHS-CHRONIK\n" +
    letzte.map((x, i) => `${i + 1}. ${x.text}`).join("\n")
  );
}


// ============================================================
// FUCHS-STATUE
// ============================================================

const fuchsStatueTexte = [
  "🗿 „Ihr seid gekommen … so, wie der Urfuchs es vorausgesehen hat.“",

  "🗿 „Der Urfuchs verschwand nicht, weil er euch verlassen wollte. Er ging, weil etwas erwachte, das selbst die fünf Kräfte fürchteten.“",

  "🗿 „Sucht dort, wo die Wurzeln älter sind als eure Erinnerung.“",

  "🗿 „Wenn die vier Kräfte erwachen, wird das fünfte Fragment seinen Fuchs finden.“"
];

function fuchsStatue(profil) {
  if (!profil.statueStufe) {
    profil.statueStufe = 0;
  }

  const index =
    Math.min(
      profil.statueStufe,
      fuchsStatueTexte.length - 1
    );

  return (
    "🗿 FUCHS-STATUE\n" +
    fuchsStatueTexte[index]
  );
}


// ============================================================
// STATUE-FORTSCHRITT
// ============================================================

function fuchsStatueFortschritt(profil) {
  if (!profil.statueStufe) {
    profil.statueStufe = 0;
  }

  if (
    profil.statueStufe <
    fuchsStatueTexte.length - 1
  ) {
    profil.statueStufe++;
    return true;
  }

  return false;
}


// ============================================================
// WESEN-KAMPF
// ============================================================

function wesenBegegnung(profil) {
  const tageszeit = fuchsTageszeit();
  const entdeckungenListe = entdeckteWesen(profil);

  let verfuegbar = [];

  if (tageszeit === "🌙 Nacht") {
    verfuegbar.push("schattenfuchs");
  }

  verfuegbar.push(
    "flammenwolf",
    "wassergeist",
    "waldhueter",
    "eisdrache"
  );

  const wesenKey =
    verfuegbar[
      zufall(0, verfuegbar.length - 1)
    ];

  const wesen = fuchsWesen[wesenKey];

  if (!wesen) {
    return "👾 Keine Wesen-Begegnung.";
  }

  const neu = !entdeckungenListe.includes(wesenKey);

  if (neu) {
    wesenEntdecken(profil, wesenKey);
    entdeckungHinzufuegen(
      profil,
      `👾 ${wesen.name} entdeckt`
    );
  }

  let text =
    `👾 WESEN-BEGEGNUNG!\n` +
    `${wesen.name}\n` +
    `${wesen.beschreibung}\n` +
    `📍 ${wesen.ort}`;

  if (neu) {
    text += "\n✨ Neues Wesen im Entdeckungsbuch!";
  } else {
    text += "\n🔎 Dieses Wesen hast du bereits entdeckt.";
  }

  return text;
}


// ============================================================
// WESEN-LISTE
// ============================================================

function wesenListe(profil) {
  const entdeckt = entdeckteWesen(profil);

  return (
    "👾 FUCHSWELT-WESEN\n\n" +
    Object.entries(fuchsWesen)
      .map(([key, wesen]) => {
        const bekannt = entdeckt.includes(key);

        return (
          `${bekannt ? "✅" : "❓"} ` +
          `${bekannt ? wesen.name : "Unbekanntes Wesen"}`
        );
      })
      .join("\n")
  );
}


// ============================================================
// FÜNFTES FRAGMENT
// ============================================================

function fuenftesFragmentPruefen(profil) {
  const status = kraefteStatus(profil);

  const alleVier =
    status.feuer &&
    status.wasser &&
    status.wald &&
    status.eis;

  if (!alleVier) {
    return (
      "🌙 Das fünfte Fragment bleibt verborgen.\n" +
      "❓ Vier Kräfte müssen zuerst erwachen."
    );
  }

  if (!status.fuenftes) {
    return (
      "🌙 DAS FÜNFTE FRAGMENT\n" +
      "„Wenn die vier Kräfte erwachen, wird das fünfte Fragment seinen Fuchs finden.“\n\n" +
      "❓ Etwas in der Fuchswelt hat begonnen zu erwachen..."
    );
  }

  return (
    "🌌 DAS FÜNFTE FRAGMENT\n" +
    "✨ Das Fragment wurde gefunden.\n" +
    "🚪 Der Weg zur Verborgenen Tal ist geöffnet."
  );
}


// ============================================================
// VERBORGENE TAL
// ============================================================

function verborgenesTal(profil) {
  if (!profil.fuenftesFragmentGefunden) {
    return (
      "🌌 VERBORGENE TAL\n" +
      "🔒 Dieser Ort ist noch nicht erreichbar.\n" +
      "🌙 Etwas fehlt..."
    );
  }

  if (!profil.verborgenesTalEntdeckt) {
    profil.verborgenesTalEntdeckt = true;

    entdeckungHinzufuegen(
      profil,
      "🌌 Die Verborgene Tal wurde entdeckt."
    );

    chronikEintrag(
      profil,
      "🌌 Die Verborgene Tal wurde entdeckt."
    );

    return (
      "🌌 VERBORGENE TAL\n" +
      "✨ Du hast einen verborgenen Ort gefunden!\n\n" +
      "🏚️ Alte Ruinen\n" +
      "🌳 Ein riesiger leuchtender Baum\n" +
      "💧 Eine geheimnisvolle Quelle\n" +
      "🗿 Eine steinerne Fuchsstatue\n" +
      "❓ Unbekannte Wesen\n\n" +
      "🔎 Hier beginnt ein neues Kapitel."
    );
  }

  return (
    "🌌 VERBORGENE TAL\n" +
    "🏚️ Alte Ruinen\n" +
    "🌳 Leuchtender Baum\n" +
    "💧 Geheimnisvolle Quelle\n" +
    "🗿 Fuchsstatue\n" +
    "❓ Noch viele Geheimnisse warten..."
  );
}


// ============================================================
// HILFE FÜR DIE FUCHSWELT
// ============================================================

function fuchsWeltHilfe() {
  return (
    "🌍 FUCHSWELT-BEFEHLE\n" +
    "!dorf – Fuchsdorf anzeigen\n" +
    "!karte – Weltkarte\n" +
    "!wesen – bekannte Wesen\n" +
    "!abenteuer – Abenteuer starten\n" +
    "!entdeckungen – Entdeckungsbuch\n" +
    "!geheimnis – Geheimnisse\n" +
    "!statue – Fuchs-Statue\n" +
    "!archiv – Fuchs-Archiv\n" +
    "!chronik – deine Fuchs-Chronik\n" +
    "!rudel – dein Rudel\n" +
    "!kraft – Tor der fünf Kräfte"
  );
}
// ============================================================
// TEIL 7/10 – KAMPFSYSTEM
// ============================================================

const kampfRaenge = [
  { name: "Kampfneuling", siege: 0 },
  { name: "Kampfgefährte", siege: 5 },
  { name: "Duellant", siege: 15 },
  { name: "Elitekämpfer", siege: 30 },
  { name: "Kampflegende", siege: 50 }
];

const aktiveKaempfe = new Map();
const kampfHerausforderungen = new Map();


// ============================================================
// KAMPF-HILFSFUNKTIONEN
// ============================================================

function kampfProfilVorbereiten(profil) {
  if (profil.kampf) {
    if (typeof profil.kampf.kraft !== "number") profil.kampf.kraft = 10;
    if (typeof profil.kampf.schutz !== "number") profil.kampf.schutz = 10;
    if (typeof profil.kampf.glueck !== "number") profil.kampf.glueck = 5;
    if (typeof profil.kampf.energie !== "number") profil.kampf.energie = 100;
  } else {
    profil.kampf = {
      kraft: 10,
      schutz: 10,
      glueck: 5,
      energie: 100
    };
  }

  if (typeof profil.pvpSiege !== "number") profil.pvpSiege = 0;
  if (typeof profil.pvpNiederlagen !== "number") profil.pvpNiederlagen = 0;

  return profil;
}


function kampfRang(profil) {
  const siege = Number(profil.pvpSiege || 0);

  let rang = kampfRaenge[0];

  for (const eintrag of kampfRaenge) {
    if (siege >= eintrag.siege) {
      rang = eintrag;
    }
  }

  return rang.name;
}


function kampfStatistik(profil) {
  return (
    `⚔️ Kämpfe: ${profil.pvpSiege || 0} Siege | ` +
    `${profil.pvpNiederlagen || 0} Niederlagen | ` +
    `🏅 ${kampfRang(profil)}`
  );
}


// ============================================================
// KAMPFKRAFT
// ============================================================

function kampfWert(profil) {
  kampfProfilVorbereiten(profil);

  const kraft = Number(profil.kampf.kraft || 10);
  const schutz = Number(profil.kampf.schutz || 10);
  const glueck = Number(profil.kampf.glueck || 5);

  const begleiter = Array.isArray(profil.begleiter)
    ? profil.begleiter.filter(x => x && x.aktiv)
    : [];

  let bonus = begleiter.length * 2;

  return kraft + schutz + glueck + bonus;
}


// ============================================================
// BEGLEITER-KAMPFBONUS
// ============================================================

function begleiterKampfBonus(profil) {
  if (!Array.isArray(profil.begleiter)) {
    return 0;
  }

  return profil.begleiter
    .filter(x => x && x.aktiv)
    .reduce((summe, begleiter) => {
      const stufe = Number(begleiter.stufe || 1);
      return summe + Math.max(1, stufe);
    }, 0);
}


// ============================================================
// KAMPF-CHANCE
// ============================================================

function kampfEntscheidung(angreifer, verteidiger) {
  const a =
    kampfWert(angreifer) +
    begleiterKampfBonus(angreifer) +
    zufall(0, 20);

  const b =
    kampfWert(verteidiger) +
    begleiterKampfBonus(verteidiger) +
    zufall(0, 20);

  if (a === b) {
    return Math.random() < 0.5 ? "angreifer" : "verteidiger";
  }

  return a > b ? "angreifer" : "verteidiger";
}


// ============================================================
// KAMPF ERSTELLEN
// ============================================================

function kampfKey(a, b) {
  return [
    normalisieren(a),
    normalisieren(b)
  ].sort().join("|");
}


function kampfHerausforderungErstellen(
  herausforderer,
  ziel,
  typ = "fuchsduell"
) {
  const key = kampfKey(herausforderer, ziel);

  kampfHerausforderungen.set(key, {
    herausforderer,
    ziel,
    typ,
    erstellt: Date.now()
  });

  return key;
}


function kampfHerausforderungHolen(a, b) {
  return kampfHerausforderungen.get(kampfKey(a, b));
}


function kampfHerausforderungLoeschen(a, b) {
  kampfHerausforderungen.delete(kampfKey(a, b));
}


// ============================================================
// KAMPF ANNEHMEN
// ============================================================

async function kampfAnnehmen(
  herausfordererName,
  verteidigerName
) {
  const herausforderung =
    kampfHerausforderungHolen(
      herausfordererName,
      verteidigerName
    );

  if (!herausforderung) {
    return "❓ Es gibt keine offene Kampf-Herausforderung.";
  }

  kampfHerausforderungLoeschen(
    herausfordererName,
    verteidigerName
  );

  const a = await fuchsProfilHolen(
    herausfordererName
  );

  const b = await fuchsProfilHolen(
    verteidigerName
  );

  kampfProfilVorbereiten(a);
  kampfProfilVorbereiten(b);

  const key = kampfKey(
    herausfordererName,
    verteidigerName
  );

  aktiveKaempfe.set(key, {
    a: herausfordererName,
    b: verteidigerName,
    typ: herausforderung.typ,
    gestartet: Date.now(),
    runde: 1,
    aktionen: {}
  });

  return kampfDurchfuehren(
    herausfordererName,
    verteidigerName,
    herausforderung.typ
  );
}


// ============================================================
// KAMPF DURCHFÜHREN
// ============================================================

async function kampfDurchfuehren(
  herausfordererName,
  verteidigerName,
  typ = "fuchsduell"
) {
  const a = await fuchsProfilHolen(
    herausfordererName
  );

  const b = await fuchsProfilHolen(
    verteidigerName
  );

  kampfProfilVorbereiten(a);
  kampfProfilVorbereiten(b);

  const siegerSeite =
    kampfEntscheidung(a, b);

  let sieger;
  let verlierer;

  if (siegerSeite === "angreifer") {
    sieger = a;
    verlierer = b;
  } else {
    sieger = b;
    verlierer = a;
  }

  let xp = 100;
  let coins = 50;

  if (typ === "rudelkrieg") {
    xp = 200;
    coins = 100;
  }

  if (typ === "wesen") {
    xp = 150;
    coins = 75;
  }

  if (typ === "urfuchs") {
    xp = 500;
    coins = 250;
  }

  sieger.pvpSiege =
    Number(sieger.pvpSiege || 0) + 1;

  verlierer.pvpNiederlagen =
    Number(verlierer.pvpNiederlagen || 0) + 1;

  await fuchsXPVergeben(
    sieger.spieler,
    xp,
    `⚔️ ${kampfTypName(typ)}`
  );

  await fuchsmuenzenHinzufuegen(
    sieger,
    coins
  );

  await fuchsProfilSpeichern(sieger);
  await fuchsProfilSpeichern(verlierer);

  const siegerName =
    fuchsAnzeigeName(sieger);

  const verliererName =
    fuchsAnzeigeName(verlierer);

  const key = kampfKey(
    herausfordererName,
    verteidigerName
  );

  aktiveKaempfe.delete(key);

  chronikEintrag(
    sieger,
    `⚔️ Sieg gegen ${verliererName} im ${kampfTypName(typ)}.`
  );

  chronikEintrag(
    verlierer,
    `⚔️ Niederlage gegen ${siegerName} im ${kampfTypName(typ)}.`
  );

  return (
    `⚔️ ${kampfTypName(typ).toUpperCase()}!\n` +
    `🦊 ${siegerName} gewinnt gegen ${verliererName}!\n` +
    `🏆 +${xp} XP | 🪙 +${coins} Fuchsmünzen\n` +
    `🏅 ${kampfRang(sieger)}`
  );
}


// ============================================================
// KAMPFTYPEN
// ============================================================

function kampfTypName(typ) {
  if (typ === "rudelkrieg") {
    return "Rudelkrieg";
  }

  if (typ === "wesen") {
    return "Wesen-Kampf";
  }

  if (typ === "urfuchs") {
    return "Urfuchs-Prüfung";
  }

  return "Fuchsduell";
}


// ============================================================
// ANGRIFF
// ============================================================

function kampfAngriff(profil) {
  kampfProfilVorbereiten(profil);

  return {
    typ: "angriff",
    kraft:
      Number(profil.kampf.kraft || 10) +
      zufall(1, 10)
  };
}


// ============================================================
// VERTEIDIGEN
// ============================================================

function kampfVerteidigen(profil) {
  kampfProfilVorbereiten(profil);

  return {
    typ: "verteidigen",
    schutz:
      Number(profil.kampf.schutz || 10) +
      zufall(1, 10)
  };
}


// ============================================================
// SPEZIALAKTION
// ============================================================

function kampfSpezial(profil) {
  kampfProfilVorbereiten(profil);

  const kosten = 20;

  if (
    Number(profil.kampf.energie || 0) <
    kosten
  ) {
    return {
      ok: false,
      text: "⚡ Nicht genug Kampf-Energie."
    };
  }

  profil.kampf.energie -= kosten;

  return {
    ok: true,
    typ: "spezial",
    kraft:
      Number(profil.kampf.kraft || 10) +
      zufall(10, 25)
  };
}


// ============================================================
// BEGLEITERAKTION
// ============================================================

function kampfBegleiterAktion(profil) {
  kampfProfilVorbereiten(profil);

  const aktive =
    Array.isArray(profil.begleiter)
      ? profil.begleiter.find(x => x && x.aktiv)
      : null;

  if (!aktive) {
    return {
      ok: false,
      text: "🐾 Du hast keinen aktiven Begleiter."
    };
  }

  const kosten = 15;

  if (
    Number(profil.kampf.energie || 0) <
    kosten
  ) {
    return {
      ok: false,
      text: "⚡ Nicht genug Energie für die Begleiterfähigkeit."
    };
  }

  profil.kampf.energie -= kosten;

  const bonus =
    Number(aktive.stufe || 1) *
    zufall(2, 5);

  return {
    ok: true,
    typ: "begleiter",
    bonus
  };
}


// ============================================================
// KAMPFAKTION AUSFÜHREN
// ============================================================

async function kampfAktionAusfuehren(
  spieler,
  aktion
) {
  const profil =
    await fuchsProfilHolen(spieler);

  kampfProfilVorbereiten(profil);

  const befehl =
    normalisieren(aktion);

  if (befehl === "angriff") {
    return kampfAngriff(profil);
  }

  if (befehl === "verteidigen") {
    return kampfVerteidigen(profil);
  }

  if (befehl === "spezial") {
    return kampfSpezial(profil);
  }

  if (
    befehl === "begleiter" ||
    befehl === "begleiterkampf"
  ) {
    return kampfBegleiterAktion(profil);
  }

  return {
    ok: false,
    text: "❓ Unbekannte Kampfaktion."
  };
}


// ============================================================
// KAMPF-ANZEIGE
// ============================================================

function kampfAnzeige(
  profilA,
  profilB
) {
  kampfProfilVorbereiten(profilA);
  kampfProfilVorbereiten(profilB);

  return (
    `⚔️ KAMPFPLATZ\n` +
    `🦊 ${fuchsAnzeigeName(profilA)}\n` +
    `💪 Kraft ${profilA.kampf.kraft} | 🛡️ Schutz ${profilA.kampf.schutz}\n\n` +
    `⚔️ VS ⚔️\n\n` +
    `🦊 ${fuchsAnzeigeName(profilB)}\n` +
    `💪 Kraft ${profilB.kampf.kraft} | 🛡️ Schutz ${profilB.kampf.schutz}`
  );
}


// ============================================================
// RUDELKRIEG
// ============================================================

function rudelPunktwert(profil) {
  if (!profil.rudel) {
    return 0;
  }

  return (
    Number(profil.xp || 0) +
    Number(profil.pvpSiege || 0) * 100
  );
}


function rudelKampfEntscheidung(
  profilA,
  profilB
) {
  const a =
    rudelPunktwert(profilA) +
    zufall(0, 500);

  const b =
    rudelPunktwert(profilB) +
    zufall(0, 500);

  return a >= b
    ? "a"
    : "b";
}


// ============================================================
// WESEN-KAMPF
// ============================================================

async function wesenKampf(profil) {
  const begegnung =
    wesenBegegnung(profil);

  const bonus =
    zufall(0, 100);

  const gewonnen =
    bonus >= 35;

  if (!gewonnen) {
    chronikEintrag(
      profil,
      "👾 Ein Wesen hat dich im Kampf besiegt."
    );

    return (
      begegnung +
      "\n\n👾 Das Wesen war stärker!\n" +
      "🛡️ Du verlierst keine XP oder Münzen."
    );
  }

  const xp = 150;
  const coins = 75;

  await fuchsXPVergeben(
    profil.spieler,
    xp,
    "👾 Wesen-Kampf"
  );

  await fuchsmuenzenHinzufuegen(
    profil,
    coins
  );

  chronikEintrag(
    profil,
    "👾 Wesen-Kampf gewonnen."
  );

  return (
    begegnung +
    "\n\n🏆 Wesen besiegt!\n" +
    `✨ +${xp} XP | 🪙 +${coins} Fuchsmünzen`
  );
}


// ============================================================
// URFUCHS-PRÜFUNG
// ============================================================

async function urfuchsPruefung(profil) {
  const status =
    kraefteStatus(profil);

  const anzahl =
    [
      status.feuer,
      status.wasser,
      status.wald,
      status.eis
    ].filter(Boolean).length;

  if (anzahl < 4) {
    return (
      "🌟 URFUCHS-PRÜFUNG\n" +
      "🔒 Die Prüfung ist noch nicht bereit.\n" +
      `🔥🌊🌲🧊 Kräfte gefunden: ${anzahl}/4`
    );
  }

  const erfolg =
    zufall(1, 100) <= 60;

  if (!erfolg) {
    chronikEintrag(
      profil,
      "🌟 Die Urfuchs-Prüfung wurde noch nicht bestanden."
    );

    return (
      "🌟 URFUCHS-PRÜFUNG\n" +
      "🦊 Der Urfuchs hat dich geprüft.\n" +
      "❌ Noch bist du nicht bereit.\n" +
      "💡 Vielleicht wartet irgendwo ein weiterer Hinweis."
    );
  }

  const xp = 500;
  const coins = 250;

  await fuchsXPVergeben(
    profil.spieler,
    xp,
    "🌟 Urfuchs-Prüfung"
  );

  await fuchsmuenzenHinzufuegen(
    profil,
    coins
  );

  chronikEintrag(
    profil,
    "🌟 Urfuchs-Prüfung bestanden."
  );

  return (
    "🌟 URFUCHS-PRÜFUNG\n" +
    "🦊 Der Urfuchs erkennt deinen Mut.\n" +
    `🏆 +${xp} XP | 🪙 +${coins} Fuchsmünzen\n` +
    "❓ Doch die größte Prüfung steht noch bevor..."
  );
}


// ============================================================
// KAMPF-HILFE
// ============================================================

function kampfHilfe() {
  return (
    "⚔️ KAMPF-BEFEHLE\n" +
    "!kampf @Name – Fuchsduell starten\n" +
    "!annehmen – Kampf annehmen\n" +
    "!angriff – Angriff\n" +
    "!verteidigen – Verteidigen\n" +
    "!spezial – Spezialaktion\n" +
    "!begleiterkampf – Begleiter einsetzen\n" +
    "!wesen – Wesen entdecken\n" +
    "!urfuchs – Urfuchs-Prüfung"
  );
}
// ============================================================
// TEIL 8/10 – RUDEL, TEAMS, ERFOLGE, RUF & TITEL
// ============================================================


// ============================================================
// FUCHS-RUF
// ============================================================

function fuchsRufVorbereiten(profil) {
  if (typeof profil.ruf !== "number") {
    profil.ruf = 0;
  }

  return profil.ruf;
}


function fuchsRufHinzufuegen(profil, menge) {
  fuchsRufVorbereiten(profil);

  profil.ruf += Number(menge || 0);

  if (profil.ruf < 0) {
    profil.ruf = 0;
  }

  return profil.ruf;
}


// ============================================================
// FUCHS-RUF TITEL
// ============================================================

function fuchsRufTitel(profil) {
  const ruf = Number(profil.ruf || 0);

  if (ruf >= 5000) return "🌟 Berühmter Fuchs";
  if (ruf >= 3000) return "✨ Bekannter Fuchs";
  if (ruf >= 1500) return "🦊 Angesehener Fuchs";
  if (ruf >= 500) return "🐾 Freund des Dorfes";

  return "🦊 Jungfuchs";
}


// ============================================================
// PERSÖNLICHE TITEL
// ============================================================

const fuchsTitel = [
  "🦊 Jungfuchs",
  "🌲 Waldläufer",
  "⚔️ Fuchs-Kämpfer",
  "👑 Fuchsmeister",
  "🌟 Fuchslegende",

  "🔥 Feuerherz",
  "🛡️ Unerschütterlicher Fuchs",
  "🐾 Begleitermeister",
  "⚔️ Duellfuchs",
  "🏆 Siegesserie",
  "🛡️ Rudelheld",
  "👾 Wesenbezwinger",
  "🔐 Geheimkämpfer",

  "🗺️ Spurensucher",
  "📖 Chronist",
  "🎨 Einrichtungskünstler",
  "🤝 Fuchsfreund",
  "🏡 Dorffuchs"
];


function titelFreigeschaltet(profil) {
  if (!Array.isArray(profil.freigeschalteteTitel)) {
    profil.freigeschalteteTitel = [];
  }

  if (!profil.freigeschalteteTitel.includes("🦊 Jungfuchs")) {
    profil.freigeschalteteTitel.push("🦊 Jungfuchs");
  }

  return profil.freigeschalteteTitel;
}


function titelFreischalten(profil, titel) {
  const titelListe = titelFreigeschaltet(profil);

  if (!titelListe.includes(titel)) {
    titelListe.push(titel);
    return true;
  }

  return false;
}


function titelAnzeigen(profil) {
  const titelListe = titelFreigeschaltet(profil);

  return (
    "🏅 DEINE TITEL\n" +
    titelListe.join("\n") +
    `\n\n⭐ Aktiver Titel: ${profil.aktiverTitel || "🦊 Jungfuchs"}`
  );
}


function titelSetzenNeu(profil, titel) {
  const titelListe = titelFreigeschaltet(profil);

  const gefunden =
    titelListe.find(
      x =>
        normalisieren(x) ===
        normalisieren(titel)
    );

  if (!gefunden) {
    return {
      ok: false,
      text: "❌ Diesen Titel hast du noch nicht freigeschaltet."
    };
  }

  profil.aktiverTitel = gefunden;

  return {
    ok: true,
    text: `🏅 Dein neuer Titel ist jetzt: ${gefunden}`
  };
}


// ============================================================
// FUCHS-ERFOLGE
// ============================================================

const fuchsErfolge = {
  ersteSchritte: {
    name: "🦊 Jungfuchs gestartet",
    beschreibung: "Deine Reise beginnt.",
    bedingung: "start"
  },

  ersteQuest: {
    name: "📜 Erste Quest",
    beschreibung: "Eine Quest abgeschlossen.",
    bedingung: "quest"
  },

  erstesAbenteuer: {
    name: "🗺️ Erstes Abenteuer",
    beschreibung: "Das erste Abenteuer erlebt.",
    bedingung: "abenteuer"
  },

  erstesZuhause: {
    name: "🏡 Mein erstes Zuhause",
    beschreibung: "Deinen Fuchsbau eingerichtet.",
    bedingung: "bau"
  },

  einrichtungskuenstler: {
    name: "🎨 Einrichtungskünstler",
    beschreibung: "Mehrere Dekorationen platziert.",
    bedingung: "deko"
  },

  grosserBau: {
    name: "🏰 Großer Bau",
    beschreibung: "Einen großen Fuchsbau erreicht.",
    bedingung: "bau3"
  },

  ersterGefaehrte: {
    name: "🐾 Erster Gefährte",
    beschreibung: "Den ersten Begleiter erhalten.",
    bedingung: "begleiter"
  },

  treuerFreund: {
    name: "❤️ Treuer Freund",
    beschreibung: "Eine starke Begleiterfreundschaft aufgebaut.",
    bedingung: "freundschaft"
  },

  begleiterSammler: {
    name: "🐾 Begleiter-Sammler",
    beschreibung: "Mehrere Begleiter gesammelt.",
    bedingung: "begleiter3"
  },

  muenzsammler: {
    name: "🪙 Münzsammler",
    beschreibung: "1000 Fuchsmünzen gesammelt.",
    bedingung: "coins1000"
  },

  grosserSchatz: {
    name: "💰 Großer Schatz",
    beschreibung: "5000 Fuchsmünzen gesammelt.",
    bedingung: "coins5000"
  },

  fuchsvermoegen: {
    name: "👑 Fuchsvermögen",
    beschreibung: "10000 Fuchsmünzen gesammelt.",
    bedingung: "coins10000"
  },

  spurensucher: {
    name: "🔎 Spurensucher",
    beschreibung: "Eine besondere Spur entdeckt.",
    bedingung: "spur"
  },

  chronist: {
    name: "📖 Chronist",
    beschreibung: "Deine Geschichte dokumentiert.",
    bedingung: "chronik"
  },

  geschichteGeschrieben: {
    name: "📚 Geschichte geschrieben",
    beschreibung: "Einen wichtigen Moment erlebt.",
    bedingung: "geschichte"
  },

  teamFuchs: {
    name: "👥 Teamfuchs",
    beschreibung: "Einem Team beigetreten.",
    bedingung: "team"
  },

  fuchsfreund: {
    name: "🤝 Fuchsfreund",
    beschreibung: "Einem anderen Fuchs geholfen.",
    bedingung: "freund"
  },

  dorffuchs: {
    name: "🏡 Dorffuchs",
    beschreibung: "Ein Teil der Dorfgemeinschaft geworden.",
    bedingung: "dorf"
  },

  feuerherz: {
    name: "🔥 Feuerherz",
    beschreibung: "Eine wichtige Feuer-Prüfung bestanden.",
    bedingung: "feuer"
  },

  unerschuetterlicherFuchs: {
    name: "🛡️ Unerschütterlicher Fuchs",
    beschreibung: "Eine schwierige Prüfung bestanden.",
    bedingung: "pruefung"
  },

  begleitermeister: {
    name: "🐾 Begleitermeister",
    beschreibung: "Einen Begleiter weit entwickelt.",
    bedingung: "begleitermeister"
  },

  duellfuchs: {
    name: "⚔️ Duellfuchs",
    beschreibung: "Mehrere Fuchsduelle gewonnen.",
    bedingung: "duell"
  },

  rudelheld: {
    name: "🛡️ Rudelheld",
    beschreibung: "Für dein Rudel gekämpft.",
    bedingung: "rudel"
  },

  wesenbezwinger: {
    name: "👾 Wesenbezwinger",
    beschreibung: "Ein Wesen im Kampf besiegt.",
    bedingung: "wesen"
  },

  geheimkaempfer: {
    name: "🔐 Geheimkämpfer",
    beschreibung: "Einen geheimen Kampf entdeckt.",
    bedingung: "geheimkampf"
  }
};


// ============================================================
// ERFOLGE VERWALTEN
// ============================================================

function erfolgeVorbereiten(profil) {
  if (!Array.isArray(profil.erfolge)) {
    profil.erfolge = [];
  }

  return profil.erfolge;
}


function erfolgFreischalten(profil, key) {
  const erfolge =
    erfolgeVorbereiten(profil);

  const eintrag =
    fuchsErfolge[key];

  if (!eintrag) {
    return false;
  }

  if (erfolge.includes(key)) {
    return false;
  }

  erfolge.push(key);

  if (
    key === "feuerherz"
  ) {
    titelFreischalten(
      profil,
      "🔥 Feuerherz"
    );
  }

  if (
    key === "duellfuchs"
  ) {
    titelFreischalten(
      profil,
      "⚔️ Duellfuchs"
    );
  }

  if (
    key === "rudelheld"
  ) {
    titelFreischalten(
      profil,
      "🛡️ Rudelheld"
    );
  }

  if (
    key === "wesenbezwinger"
  ) {
    titelFreischalten(
      profil,
      "👾 Wesenbezwinger"
    );
  }

  if (
    key === "geheimkaempfer"
  ) {
    titelFreischalten(
      profil,
      "🔐 Geheimkämpfer"
    );
  }

  if (
    key === "begleitermeister"
  ) {
    titelFreischalten(
      profil,
      "🐾 Begleitermeister"
    );
  }

  return true;
}


// ============================================================
// ERFOLGE ANZEIGEN
// ============================================================

function erfolgeAnzeigen(profil) {
  const abgeschlossen =
    erfolgeVorbereiten(profil);

  const gesamt =
    Object.keys(fuchsErfolge).length;

  let text =
    `🏆 FUCHS-ERFOLGE ${abgeschlossen.length}/${gesamt}\n\n`;

  for (const [key, erfolg] of Object.entries(fuchsErfolge)) {
    const hat =
      abgeschlossen.includes(key);

    text +=
      `${hat ? "✅" : "🔒"} ${erfolg.name}\n`;

    if (hat) {
      text += `   ${erfolg.beschreibung}\n`;
    }
  }

  return text;
}


// ============================================================
// ERFOLG PRÜFEN
// ============================================================

async function erfolgePruefen(profil) {
  const neue = [];

  if (!erfolgeVorbereiten(profil).length) {
    if (erfolgFreischalten(profil, "ersteSchritte")) {
      neue.push(fuchsErfolge.ersteSchritte.name);
    }
  }

  if (
    Number(profil.xp || 0) >= 1000 &&
    erfolgFreischalten(profil, "geschichteGeschrieben")
  ) {
    neue.push(fuchsErfolge.geschichteGeschrieben.name);
  }

  if (
    Number(profil.muenzen || 0) >= 1000 &&
    erfolgFreischalten(profil, "muenzsammler")
  ) {
    neue.push(fuchsErfolge.muenzsammler.name);
  }

  if (
    Number(profil.muenzen || 0) >= 5000 &&
    erfolgFreischalten(profil, "grosserSchatz")
  ) {
    neue.push(fuchsErfolge.grosserSchatz.name);
  }

  if (
    Number(profil.muenzen || 0) >= 10000 &&
    erfolgFreischalten(profil, "fuchsvermoegen")
  ) {
    neue.push(fuchsErfolge.fuchsvermoegen.name);
  }

  if (
    Number(profil.pvpSiege || 0) >= 5 &&
    erfolgFreischalten(profil, "duellfuchs")
  ) {
    neue.push(fuchsErfolge.duellfuchs.name);
  }

  if (
    Number(profil.pvpSiege || 0) >= 1 &&
    profil.rudel &&
    erfolgFreischalten(profil, "rudelheld")
  ) {
    neue.push(fuchsErfolge.rudelheld.name);
  }

  if (
    Array.isArray(profil.begleiter) &&
    profil.begleiter.length >= 1 &&
    erfolgFreischalten(profil, "ersterGefaehrte")
  ) {
    neue.push(fuchsErfolge.ersterGefaehrte.name);
  }

  if (
    Array.isArray(profil.begleiter) &&
    profil.begleiter.length >= 3 &&
    erfolgFreischalten(profil, "begleiterSammler")
  ) {
    neue.push(fuchsErfolge.begleiterSammler.name);
  }

  if (
    Array.isArray(profil.entdeckungen) &&
    profil.entdeckungen.length >= 1 &&
    erfolgFreischalten(profil, "spurensucher")
  ) {
    neue.push(fuchsErfolge.spurensucher.name);
  }

  return neue;
}


// ============================================================
// FUCHS-RUHMESHALLE
// ============================================================

function ruhmeshalleVorbereiten() {
  if (!globalThis.fuchsRuhmeshalle) {
    globalThis.fuchsRuhmeshalle = [];
  }

  return globalThis.fuchsRuhmeshalle;
}


function ruhmeshalleEintrag(
  spieler,
  titel,
  beschreibung
) {
  const liste =
    ruhmeshalleVorbereiten();

  liste.push({
    spieler,
    titel,
    beschreibung,
    zeit: new Date().toISOString()
  });

  if (liste.length > 100) {
    liste.shift();
  }
}


function ruhmeshalleAnzeigen() {
  const liste =
    ruhmeshalleVorbereiten();

  if (!liste.length) {
    return (
      "🏆 FUCHS-RUHMESHALLE\n" +
      "Noch gibt es keine historischen Einträge."
    );
  }

  return (
    "🏆 FUCHS-RUHMESHALLE\n" +
    liste
      .slice(-10)
      .map(
        x =>
          `🌟 ${x.spieler} – ${x.titel}: ${x.beschreibung}`
      )
      .join("\n")
  );
}


// ============================================================
// FUCHS-LEGENDEN
// ============================================================

function legendenVorbereiten(profil) {
  if (!Array.isArray(profil.legenden)) {
    profil.legenden = [];
  }

  return profil.legenden;
}


function legendeHinzufuegen(
  profil,
  text
) {
  const liste =
    legendenVorbereiten(profil);

  if (liste.includes(text)) {
    return false;
  }

  liste.push(text);

  return true;
}


function legendenAnzeigen(profil) {
  const liste =
    legendenVorbereiten(profil);

  if (!liste.length) {
    return (
      "🌟 FUCHS-LEGENDEN\n" +
      "Noch keine Legende geschrieben."
    );
  }

  return (
    "🌟 FUCHS-LEGENDEN\n" +
    liste.map(x => `🌟 ${x}`).join("\n")
  );
}


// ============================================================
// RUDEL
// ============================================================

const rudelDaten = {
  feuer: {
    name: "🔥 Feuerrudel",
    gebiet: "🌋 Feuertal"
  },

  wasser: {
    name: "🌊 Wasserrudel",
    gebiet: "🌊 Wasserlande"
  },

  wald: {
    name: "🌲 Waldrudel",
    gebiet: "🌲 Fuchswald"
  },

  ice: {
    name: "🧊 ICErudel",
    gebiet: "❄️ Eisberge"
  }
};


const rudelRaenge = [
  { name: "Rudel-Anfänger", punkte: 0 },
  { name: "Rudel-Gefährten", punkte: 500 },
  { name: "Rudel-Kämpfer", punkte: 1500 },
  { name: "Rudel-Meister", punkte: 3000 },
  { name: "Legendäres Rudel", punkte: 5000 }
];


function rudelVorbereiten(profil) {
  if (typeof profil.rudelPunkte !== "number") {
    profil.rudelPunkte = 0;
  }

  return profil.rudelPunkte;
}


function rudelRang(profil) {
  const punkte =
    Number(profil.rudelPunkte || 0);

  let rang = rudelRaenge[0];

  for (const eintrag of rudelRaenge) {
    if (punkte >= eintrag.punkte) {
      rang = eintrag;
    }
  }

  return rang.name;
}


function rudelAnzeigen(profil) {
  if (!profil.rudel) {
    return (
      "🦊 Du gehörst noch keinem Rudel an.\n" +
      "!rudelwahl feuer\n" +
      "!rudelwahl wasser\n" +
      "!rudelwahl wald\n" +
      "!rudelwahl ice"
    );
  }

  rudelVorbereiten(profil);

  const daten =
    rudelDaten[profil.rudel];

  return (
    `${daten ? daten.name : "🦊 Rudel"}\n` +
    `${daten ? daten.gebiet : ""}\n` +
    `🏆 ${profil.rudelPunkte} Rudelpunkte\n` +
    `🏅 ${rudelRang(profil)}`
  );
}


// ============================================================
// RUDEL-PUNKTE
// ============================================================

function rudelPunkteHinzufuegen(
  profil,
  menge
) {
  rudelVorbereiten(profil);

  if (!profil.rudel) {
    return false;
  }

  profil.rudelPunkte +=
    Number(menge || 0);

  return true;
}


// ============================================================
// RUDELWECHSEL
// ============================================================

function rudelWechseln(profil, rudel) {
  const key = normalisieren(rudel);

  if (!rudelDaten[key]) {
    return {
      ok: false,
      text:
        "❌ Dieses Rudel gibt es nicht.\n" +
        "🔥 feuer | 🌊 wasser | 🌲 wald | 🧊 ice"
    };
  }

  if (profil.rudel === key) {
    return {
      ok: false,
      text: "🦊 Du bist bereits in diesem Rudel."
    };
  }

  if (profil.rudel) {
    return {
      ok: false,
      text:
        "🦊 Du hast bereits ein Rudel gewählt.\n" +
        "Ein Rudelwechsel wird später über das Fuchs-Archiv geregelt."
    };
  }

  profil.rudel = key;
  rudelVorbereiten(profil);

  titelFreischalten(
    profil,
    "🏡 Dorffuchs"
  );

  chronikEintrag(
    profil,
    `🦊 Dem ${rudelDaten[key].name} beigetreten.`
  );

  return {
    ok: true,
    text:
      `🎉 Willkommen im ${rudelDaten[key].name}!\n` +
      `📍 Dein Gebiet: ${rudelDaten[key].gebiet}\n` +
      `🏆 Rudelpunkte: 0`
  };
}


// ============================================================
// TEAMS
// ============================================================

const fuchsTeams = new Map();


function teamKey(name) {
  return normalisieren(name)
    .replace(/[^a-z0-9äöüß_-]/g, "")
    .slice(0, 30);
}


function teamErstellen(
  profil,
  name
) {
  const key = teamKey(name);

  if (!key || key.length < 2) {
    return {
      ok: false,
      text: "❌ Der Teamname ist zu kurz."
    };
  }

  if (fuchsTeams.has(key)) {
    return {
      ok: false,
      text: "❌ Dieses Team gibt es bereits."
    };
  }

  const team = {
    name: name.trim(),
    gruender: profil.spieler,
    mitglieder: [profil.spieler],
    punkte: 0,
    kasse: 0,
    aufgaben: [],
    abenteuer: [],
    kaempfe: 0,
    erfolge: [],
    erstellt: Date.now()
  };

  fuchsTeams.set(key, team);

  profil.team = key;

  chronikEintrag(
    profil,
    `👥 Team „${team.name}“ gegründet.`
  );

  return {
    ok: true,
    text:
      `👥 Team „${team.name}“ wurde gegründet!\n` +
      `🦊 Gründer: ${fuchsAnzeigeName(profil)}`
  };
}


function teamFinden(name) {
  return fuchsTeams.get(
    teamKey(name)
  );
}


function teamBeitreten(
  profil,
  name
) {
  const team =
    teamFinden(name);

  if (!team) {
    return {
      ok: false,
      text: "❌ Dieses Team wurde nicht gefunden."
    };
  }

  if (profil.team) {
    return {
      ok: false,
      text: "❌ Du bist bereits in einem Team."
    };
  }

  if (
    team.mitglieder.includes(
      profil.spieler
    )
  ) {
    return {
      ok: false,
      text: "🦊 Du bist bereits Mitglied."
    };
  }

  team.mitglieder.push(
    profil.spieler
  );

  profil.team =
    teamKey(name);

  erfolgFreischalten(
    profil,
    "teamFuchs"
  );

  titelFreischalten(
    profil,
    "🤝 Fuchsfreund"
  );

  chronikEintrag(
    profil,
    `👥 Dem Team „${team.name}“ beigetreten.`
  );

  return {
    ok: true,
    text:
      `👥 Willkommen im Team „${team.name}“!`
  };
}


function teamVerlassen(profil) {
  if (!profil.team) {
    return {
      ok: false,
      text: "❌ Du bist in keinem Team."
    };
  }

  const team =
    fuchsTeams.get(profil.team);

  if (team) {
    team.mitglieder =
      team.mitglieder.filter(
        x => x !== profil.spieler
      );
  }

  profil.team = null;

  return {
    ok: true,
    text: "👥 Du hast das Team verlassen."
  };
}


function teamAnzeigen(profil) {
  if (!profil.team) {
    return (
      "👥 Du bist noch in keinem Team.\n" +
      "!teamgründen [Name]\n" +
      "!teambeitreten [Name]"
    );
  }

  const team =
    fuchsTeams.get(profil.team);

  if (!team) {
    profil.team = null;

    return "❌ Dein Team konnte nicht gefunden werden.";
  }

  return (
    `👥 TEAM ${team.name}\n` +
    `👑 Gründer: ${team.gruender}\n` +
    `👥 Mitglieder: ${team.mitglieder.length}\n` +
    `🏆 Punkte: ${team.punkte}\n` +
    `💰 Teamkasse: ${team.kasse} Fuchsmünzen\n` +
    `⚔️ Kämpfe: ${team.kaempfe}`
  );
}


// ============================================================
// TEAM-PUNKTE
// ============================================================

function teamPunkteHinzufuegen(
  profil,
  menge
) {
  if (!profil.team) {
    return false;
  }

  const team =
    fuchsTeams.get(profil.team);

  if (!team) {
    return false;
  }

  team.punkte +=
    Number(menge || 0);

  return true;
}


// ============================================================
// TEAM-KASSE
// ============================================================

function teamKasseHinzufuegen(
  profil,
  menge
) {
  if (!profil.team) {
    return false;
  }

  const team =
    fuchsTeams.get(profil.team);

  if (!team) {
    return false;
  }

  team.kasse +=
    Number(menge || 0);

  if (team.kasse < 0) {
    team.kasse = 0;
  }

  return true;
}


// ============================================================
// TEAM-HILFE
// ============================================================

function teamHilfe() {
  return (
    "👥 TEAM-BEFEHLE\n" +
    "!team – dein Team\n" +
    "!teamgründen [Name] – Team erstellen\n" +
    "!teambeitreten [Name] – Team beitreten\n" +
    "!teamverlassen – Team verlassen\n" +
    "!teampunkte – Teamfortschritt"
  );
}


// ============================================================
// RUDEL-HILFE
// ============================================================

function rudelHilfe() {
  return (
    "🐾 RUDEL\n" +
    "🔥 Feuerrudel – Feuertal\n" +
    "🌊 Wasserrudel – Wasserlande\n" +
    "🌲 Waldrudel – Fuchswald\n" +
    "🧊 ICErudel – Eisberge"
  );
}
// ============================================================
// TEIL 9/10 – POST, TAUSCH, BONUS, SCHICKSAL & ANPASSUNG
// ============================================================


// ============================================================
// FUCHS-POST
// ============================================================

function postVorbereiten(profil) {
  if (!Array.isArray(profil.post)) {
    profil.post = [];
  }

  return profil.post;
}

// ============================================================
// POSTEINGANG
// ============================================================

// ============================================================
// UNGELESENE POST
// ============================================================

function ungelesenePost(profil) {
  const liste =
    postVorbereiten(profil);

  return liste.filter(
    x => !x.gelesen
  ).length;
}


// ============================================================
// FUCHS-TAUSCHPLATZ
// ============================================================

const offeneTausche = new Map();


function tauschKey(
  a,
  b
) {
  return (
    normalisieren(a) +
    "|" +
    normalisieren(b) +
    "|" +
    Date.now()
  );
}


function tauschAngebotErstellen(
  sender,
  empfaenger,
  gegenstand,
  menge,
  muenzen
) {
  const anzahl =
    Math.max(
      1,
      Number(menge || 1)
    );

  const coins =
    Math.max(
      0,
      Number(muenzen || 0)
    );

  if (!gegenstand) {
    return {
      ok: false,
      text: "❌ Bitte einen Gegenstand angeben."
    };
  }

  if (
    istGebundenerGegenstand(
      gegenstand
    )
  ) {
    return {
      ok: false,
      text:
        "🔐 Dieser Gegenstand ist an die Geschichte gebunden und kann nicht getauscht werden."
    };
  }

  const vorhanden =
    inventarZaehlen(
      sender,
      gegenstand
    );

  if (vorhanden < anzahl) {
    return {
      ok: false,
      text:
        `❌ Du hast nicht genug ${gegenstand}.`
    };
  }

  if (
    coins >
    Number(sender.muenzen || 0)
  ) {
    return {
      ok: false,
      text:
        "❌ Du hast nicht genug Fuchsmünzen."
    };
  }

  const key =
    tauschKey(
      sender.spieler,
      empfaenger
    );

  offeneTausche.set(
    key,
    {
      key,
      von: sender.spieler,
      an: empfaenger,
      gegenstand,
      menge: anzahl,
      muenzen: coins,
      erstellt: Date.now(),
      bestaetigtVon: [],
      status: "offen"
    }
  );

  return {
    ok: true,
    text:
      `🔄 Tauschangebot erstellt!\n` +
      `📦 ${anzahl}x ${gegenstand}\n` +
      `🪙 ${coins} Fuchsmünzen\n` +
      `🤝 Der andere Fuchs muss das Angebot noch bestätigen.`
  };
}


// ============================================================
// TAUSCHANGEBOTE ANZEIGEN
// ============================================================

function tauschAngeboteAnzeigen(
  spieler
) {
  const angebote =
    [...offeneTausche.values()]
      .filter(
        x =>
          x.an === spieler ||
          x.von === spieler
      );

  if (!angebote.length) {
    return (
      "🔄 TAUSCHPLATZ\n" +
      "Keine offenen Angebote."
    );
  }

  return (
    "🔄 TAUSCHPLATZ\n" +
    angebote
      .map(
        x =>
          `📦 ${x.von} → ${x.an}: ${x.menge}x ${x.gegenstand} + ${x.muenzen} 🪙`
      )
      .join("\n")
  );
}


// ============================================================
// TAUSCH ABBRECHEN
// ============================================================

function tauschAbbrechen(
  key,
  spieler
) {
  const angebot =
    offeneTausche.get(key);

  if (!angebot) {
    return {
      ok: false,
      text: "❌ Dieses Tauschangebot existiert nicht."
    };
  }

  if (
    angebot.von !== spieler
  ) {
    return {
      ok: false,
      text:
        "❌ Nur der Ersteller kann das Angebot abbrechen."
    };
  }

  offeneTausche.delete(key);

  return {
    ok: true,
    text:
      "❌ Tauschangebot wurde abgebrochen."
  };
}


// ============================================================
// FUCHS-SCHICKSAL
// ============================================================

const fuchsSchicksale = [
  {
    key: "krieger",
    name: "⚔️ Kriegerweg",
    beschreibung:
      "Du suchst Herausforderungen und stellst dich mutig deinen Gegnern."
  },

  {
    key: "entdecker",
    name: "🗺️ Entdeckerweg",
    beschreibung:
      "Du folgst Spuren, erkundest neue Orte und suchst Geheimnisse."
  },

  {
    key: "sammler",
    name: "💎 Sammlerweg",
    beschreibung:
      "Du liebst seltene Gegenstände, Dekorationen und besondere Funde."
  },

  {
    key: "freund",
    name: "🤝 Freundesweg",
    beschreibung:
      "Du stärkst die Gemeinschaft und hilfst anderen Füchsen."
  },

  {
    key: "geheimnis",
    name: "🔐 Geheimnisweg",
    beschreibung:
      "Du folgst den versteckten Hinweisen der Fuchswelt."
  }
];


function schicksalVorbereiten(profil) {
  if (!Array.isArray(profil.schicksal)) {
    profil.schicksal = [];
  }

  return profil.schicksal;
}


function schicksalWaehlen(
  profil,
  key
) {
  const gefunden =
    fuchsSchicksale.find(
      x =>
        x.key ===
        normalisieren(key)
    );

  if (!gefunden) {
    return {
      ok: false,
      text:
        "❌ Dieses Schicksal gibt es nicht."
    };
  }

  const liste =
    schicksalVorbereiten(profil);

  if (liste.includes(gefunden.key)) {
    return {
      ok: false,
      text:
        "✨ Diesen Schicksalsweg gehst du bereits."
    };
  }

  liste.push(gefunden.key);

  chronikEintrag(
    profil,
    `🌟 Den ${gefunden.name} gewählt.`
  );

  return {
    ok: true,
    text:
      `🌟 SCHICKSALSWEG\n` +
      `${gefunden.name}\n` +
      `${gefunden.beschreibung}\n\n` +
      "✨ Du kannst mehrere Wege gleichzeitig verfolgen."
  };
}


function schicksalAnzeigen(profil) {
  const liste =
    schicksalVorbereiten(profil);

  let text =
    "🌟 FUCHS-SCHICKSAL\n\n";

  for (const weg of fuchsSchicksale) {
    const aktiv =
      liste.includes(weg.key);

    text +=
      `${aktiv ? "✅" : "⬜"} ${weg.name}\n`;

    if (aktiv) {
      text +=
        `   ${weg.beschreibung}\n`;
    }
  }

  return text;
}


// ============================================================
// FUCHS-ANPASSUNG
// ============================================================

function anpassungVorbereiten(profil) {
  if (!profil.anpassung) {
    profil.anpassung = {
      muetze: null,
      schleife: null,
      brille: null,
      schal: null,
      krone: null,
      effekt: null,
      aura: null
    };
  }

  return profil.anpassung;
}


function anpassungSetzen(
  profil,
  kategorie,
  wert
) {
  const daten =
    anpassungVorbereiten(profil);

  const erlaubte = [
    "muetze",
    "schleife",
    "brille",
    "schal",
    "krone",
    "effekt",
    "aura"
  ];

  if (!erlaubte.includes(kategorie)) {
    return {
      ok: false,
      text: "❌ Diese Anpassung gibt es nicht."
    };
  }

  daten[kategorie] =
    wert;

  return {
    ok: true,
    text:
      `🎨 Deine Fuchs-Anpassung wurde geändert: ${wert}`
  };
}


function anpassungAnzeigen(profil) {
  const daten =
    anpassungVorbereiten(profil);

  return (
    "🎨 FUCHS-ANPASSUNG\n" +
    `🧢 Mütze: ${daten.muetze || "keine"}\n` +
    `🎀 Schleife: ${daten.schleife || "keine"}\n` +
    `👓 Brille: ${daten.brille || "keine"}\n` +
    `🧣 Schal: ${daten.schal || "keiner"}\n` +
    `👑 Krone: ${daten.krone || "keine"}\n` +
    `✨ Effekt: ${daten.effekt || "keiner"}\n` +
    `🌟 Aura: ${daten.aura || "keine"}`
  );
}


// ============================================================
// TÄGLICHER FUCHS-BONUS
// ============================================================

function bonusDatum() {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Europe/Berlin"
    }
  ).format(new Date());
}


async function taeglicherFuchsBonus(
  profil
) {
  const heute =
    bonusDatum();

  if (
    profil.letzterBonus === heute
  ) {
    return (
      "🎁 Deinen Fuchs-Bonus hast du heute bereits abgeholt."
    );
  }

  profil.letzterBonus =
    heute;

  const roll =
    zufall(1, 100);

  let text =
    "🎁 TÄGLICHER FUCHS-BONUS!\n";

  if (roll <= 45) {
    const coins =
      zufall(50, 150);

    await fuchsmuenzenHinzufuegen(
      profil,
      coins
    );

    text +=
      `🪙 +${coins} Fuchsmünzen!`;
  }

  else if (roll <= 70) {
    const energie =
      zufall(10, 25);

    profil.energie =
      Math.min(
        100,
        Number(profil.energie || 0) +
        energie
      );

    text +=
      `⚡ +${energie} Energie!`;
  }

  else if (roll <= 90) {
    const xp =
      zufall(25, 75);

    await fuchsXPVergeben(
      profil.spieler,
      xp,
      "🎁 Täglicher Bonus"
    );

    text +=
      `✨ +${xp} XP!`;
  }

  else {
    const besondereItems = [
      "Kleine Fuchsbox",
      "Glücksblatt",
      "Fuchskuscheltier",
      "Leuchtkristall"
    ];

    const item =
      besondereItems[
        zufall(
          0,
          besondereItems.length - 1
        )
      ];

    gegenstandHinzufuegen(
      profil,
      item,
      1
    );

    text +=
      `🎁 Besonderer Fund: ${item}!`;
  }

  chronikEintrag(
    profil,
    "🎁 Täglichen Fuchs-Bonus abgeholt."
  );

  return text;
}


// ============================================================
// FUCHS-POST / TAUSCH / BONUS HILFE
// ============================================================

function sozialeHilfe() {
  return (
    "🤝 SOZIALE FUCHS-BEFEHLE\n" +
    "!post – Posteingang\n" +
    "!post @Name Nachricht – Nachricht senden\n" +
    "!tausch @Name – Tauschangebote\n" +
    "!bonus – täglicher Fuchs-Bonus\n" +
    "!schicksal – deine Schicksalswege\n" +
    "!anpassung – Fuchs-Anpassung"
  );
}


// ============================================================
// FUCHS-STATISTIK
// ============================================================

function fuchsStatistik(profil) {
  return (
    "📊 FUCHS-STATISTIK\n" +
    `🦊 ${fuchsAnzeigeName(profil)}\n` +
    `✨ XP: ${profil.xp || 0}\n` +
    `🪙 Fuchsmünzen: ${profil.muenzen || 0}\n` +
    `⚡ Energie: ${profil.energie || 0}\n` +
    `⭐ Ruf: ${profil.ruf || 0}\n` +
    `🏅 Titel: ${profil.aktiverTitel || "🦊 Jungfuchs"}\n` +
    `${kampfStatistik(profil)}`
  );
}


// ============================================================
// FUCHS-KERN
// ============================================================

function fuchskernVorbereiten(profil) {
  if (!profil.fuchskern) {
    profil.fuchskern = {
      mut: 0,
      wissen: 0,
      vertrauen: 0,
      entdeckung: 0
    };
  }

  return profil.fuchskern;
}


function fuchskernWertHinzufuegen(
  profil,
  typ,
  menge = 1
) {
  const kern =
    fuchskernVorbereiten(profil);

  if (
    !Object.prototype.hasOwnProperty.call(
      kern,
      typ
    )
  ) {
    return false;
  }

  kern[typ] +=
    Number(menge || 0);

  return true;
}


function fuchskernAnzeigen(profil) {
  const kern =
    fuchskernVorbereiten(profil);

  return (
    "❤️ FUCHSKERN\n" +
    `⚔️ Mut: ${kern.mut}\n` +
    `🧠 Wissen: ${kern.wissen}\n` +
    `❤️ Vertrauen: ${kern.vertrauen}\n` +
    `🔎 Entdeckung: ${kern.entdeckung}`
  );
}


// ============================================================
// FUCHS-RUF / SCHICKSAL KOMPAKT
// ============================================================

function fuchsIdentitaet(profil) {
  return (
    `🦊 ${fuchsAnzeigeName(profil)} | ` +
    `${profil.rudel ? rudelDaten[profil.rudel]?.name || "" : "🌱 Noch kein Rudel"} | ` +
    `${profil.aktiverTitel || "🦊 Jungfuchs"}`
  );
}
// ============================================================
// TEIL 10/10 – TWITCH, BEFEHLE, WEBSERVER & START
// ============================================================


// ============================================================
// TWITCH / STREAM-ELEMENTS
// ============================================================

let streamElementsSocket = null;
let streamElementsVerbunden = false;
let streamElementsChannelId = null;


function twitchSpielerName(message) {
  if (
    message &&
    message.data &&
    message.data.sender &&
    message.data.sender.username
  ) {
    return message.data.sender.username;
  }

  if (
    message &&
    message.sender &&
    message.sender.username
  ) {
    return message.sender.username;
  }

  return "unbekannterfuchs";
}


function twitchNachrichtText(message) {
  if (
    message &&
    message.data &&
    typeof message.data.message === "string"
  ) {
    return message.data.message;
  }

  if (
    message &&
    typeof message.message === "string"
  ) {
    return message.message;
  }

  return "";
}


// ============================================================
// @NAME ERKENNEN
// ============================================================

function benutzernameAusText(text) {
  if (!text) {
    return null;
  }

  const treffer =
    text.match(/@([a-zA-Z0-9_]+)/);

  if (!treffer) {
    return null;
  }

  return treffer[1];
}


// ============================================================
// FUCHSMISS AUTOMATISCHE ANNAHME
// ============================================================

function istFuchsMiss(spieler) {
  const name =
    normalisieren(spieler);

  return (
    name ===
      "fuchsmissvegetalover2_0" ||
    name ===
      "fuchsmissvegetalover2"
  );
}


// ============================================================
// BEFEHL HILFE
// ============================================================

function alleBefehle() {
  return (
    "🦊 MITSUSUNDWANDASWELT\n" +
    "━━━━━━━━━━━━━━━━━━\n" +
    "👤 !profil – dein Fuchsprofil\n" +
    "📜 !quest – Tagesquests\n" +
    "🏡 !bau – Fuchsbau\n" +
    "🎨 !anpassung – Anpassung\n" +
    "🎒 !inventar – Inventar\n" +
    "🏪 !markt – Fuchs-Markt\n" +
    "💰 !kaufen [Item] – kaufen\n" +
    "🎁 !bonus – Tagesbonus\n" +
    "🏦 !bank – Fuchs-Bank\n" +
    "📬 !post – Posteingang\n" +
    "🔄 !tausch – Tauschplatz\n" +
    "🐾 !begleiter – Begleiter\n" +
    "🗺️ !abenteuer – Abenteuer\n" +
    "🗺️ !karte – Weltkarte\n" +
    "👾 !wesen – Wesen\n" +
    "🔎 !entdeckungen – Entdeckungen\n" +
    "🔐 !geheimnis – Geheimnisse\n" +
    "🗿 !statue – Fuchs-Statue\n" +
    "📚 !archiv – Fuchs-Archiv\n" +
    "📖 !chronik – deine Chronik\n" +
    "🌟 !schicksal – Schicksalswege\n" +
    "❤️ !fuchskern – Fuchskern\n" +
    "🏆 !erfolge – Erfolge\n" +
    "🏅 !titel – Titel\n" +
    "👥 !team – Team\n" +
    "🐾 !rudel – Rudel\n" +
    "⚔️ !kampf @Name – Fuchsduell\n" +
    "🤝 !annehmen – Kampf annehmen\n" +
    "⚔️ !angriff – Angriff\n" +
    "🛡️ !verteidigen – Verteidigen\n" +
    "✨ !spezial – Spezialaktion\n" +
    "🐾 !begleiterkampf – Begleiterfähigkeit\n" +
    "👾 !wesen-kampf – Wesen-Kampf\n" +
    "🌟 !urfuchs – Urfuchs-Prüfung\n" +
    "🏡 !dorf – Fuchsdorf"
  );
}


// ============================================================
// PROFIL-ANZEIGE
// ============================================================

function profilAnzeigen(profil) {
  const level =
    levelAusXP(
      Number(profil.xp || 0)
    );

  const titel =
    profil.aktiverTitel ||
    levelTitelHolen(level);

  const rudel =
    profil.rudel &&
    rudelDaten[profil.rudel]
      ? rudelDaten[profil.rudel].name
      : "🌱 Noch kein Rudel";

  return (
    `🦊 ${fuchsAnzeigeName(profil)}\n` +
    `⭐ Level ${level} – ${titel}\n` +
    `✨ XP: ${profil.xp || 0}\n` +
    `🪙 Fuchsmünzen: ${profil.muenzen || 0}\n` +
    `⚡ Energie: ${profil.energie || 0}\n` +
    `${rudel}\n` +
    `⭐ Ruf: ${profil.ruf || 0}\n` +
    `🏅 ${kampfStatistik(profil)}`
  );
}


// ============================================================
// QUEST ANZEIGE
// ============================================================

function questAusgabe(
  spieler
) {
  return persoenlicheQuestsAnzeigen(
    spieler
  );
}


// ============================================================
// BEFEHL VERARBEITEN
// ============================================================

async function befehlVerarbeiten(
  spieler,
  nachricht
) {
  const text =
    String(nachricht || "").trim();

  if (!text.startsWith("!")) {
    return null;
  }

  const teile =
    text.split(/\s+/);

  const befehl =
    normalisieren(
      teile.shift() || ""
    );

  const rest =
    teile.join(" ").trim();

  const profil =
    await fuchsProfilHolen(
      spieler
    );

  fuchsbauGrundwerteSetzen(
    profil
  );

  kampfProfilVorbereiten(
    profil
  );

  fuchsRufVorbereiten(
    profil
  );

  titelFreigeschaltet(
    profil
  );

  erfolgeVorbereiten(
    profil
  );

  schicksalVorbereiten(
    profil
  );

  kraefteStatus(
    profil
  );

  // ----------------------------------------------------------
  // HILFE
  // ----------------------------------------------------------

  if (
    befehl === "!hilfe" ||
    befehl === "!allebefehle"
  ) {
    return alleBefehle();
  }


  // ----------------------------------------------------------
  // PROFIL
  // ----------------------------------------------------------

  if (
    befehl === "!profil" ||
    befehl === "!xp"
  ) {
    await erfolgePruefen(profil);
    await fuchsProfilSpeichern(profil);

    return profilAnzeigen(profil);
  }


  // ----------------------------------------------------------
  // QUEST
  // ----------------------------------------------------------

  if (
    befehl === "!quest"
  ) {
    return questAusgabe(
      spieler
    );
  }


  // ----------------------------------------------------------
  // FUCHSBAU
  // ----------------------------------------------------------

  if (
    befehl === "!bau"
  ) {
    const ziel =
      benutzernameAusText(rest);

    if (ziel) {
      const fremdProfil =
        await fuchsProfilHolen(ziel);

      return fuchsbauAnzeigen(
        fremdProfil
      );
    }

    return fuchsbauAnzeigen(
      profil
    );
  }


  if (
    befehl === "!bauupgrade"
  ) {
    const ergebnis =
      await fuchsbauVerbessern(
        profil
      );

    await fuchsProfilSpeichern(
      profil
    );

    return ergebnis;
  }


  // ----------------------------------------------------------
  // INVENTAR
  // ----------------------------------------------------------

  if (
    befehl === "!inventar"
  ) {
    return inventarAnzeigen(
      profil
    );
  }


  // ----------------------------------------------------------
  // MARKT
  // ----------------------------------------------------------

  if (
    befehl === "!markt"
  ) {
    return marktAnzeigen();
  }


  // ----------------------------------------------------------
  // KAUFEN
  // ----------------------------------------------------------

  if (
    befehl === "!kaufen"
  ) {
    if (!rest) {
      return (
        "🏪 Schreibe !markt für die aktuellen Artikel."
      );
    }

    const ergebnis =
      await marktKaufen(
        profil,
        rest
      );

    await fuchsProfilSpeichern(
      profil
    );

    return ergebnis;
  }


  // ----------------------------------------------------------
  // BONUS
  // ----------------------------------------------------------

  if (
    befehl === "!bonus"
  ) {
    const ergebnis =
      await taeglicherFuchsBonus(
        profil
      );

    await fuchsProfilSpeichern(
      profil
    );

    return ergebnis;
  }


  // ----------------------------------------------------------
  // BANK
  // ----------------------------------------------------------

  if (
    befehl === "!bank"
  ) {
    return bankAnzeigen(
      profil
    );
  }


  if (
    befehl === "!bankeinzahlen"
  ) {
    const menge =
      Number(teile[0]);

    const ergebnis =
      await bankEinzahlen(
        profil,
        menge
      );

    await fuchsProfilSpeichern(
      profil
    );

    return ergebnis;
  }


  if (
    befehl === "!bankauszahlen"
  ) {
    const menge =
      Number(teile[0]);

    const ergebnis =
      await bankAuszahlen(
        profil,
        menge
      );

    await fuchsProfilSpeichern(
      profil
    );

    return ergebnis;
  }


  // ----------------------------------------------------------
  // POST
  // ----------------------------------------------------------

  if (
    befehl === "!post"
  ) {
    const ziel =
      benutzernameAusText(rest);

    if (!ziel) {
      return postAnzeigen(
        profil
      );
    }

    const nachrichtStart =
      rest.indexOf(" ");

    const nachricht =
      nachrichtStart >= 0
        ? rest
            .slice(nachrichtStart)
            .trim()
        : "";

    const zielProfil =
      await fuchsProfilHolen(
        ziel
      );

    const ergebnis =
      postSenden(
        profil,
        zielProfil.spieler,
        nachricht
      );

    return ergebnis.text;
  }


  // ----------------------------------------------------------
  // TAUSCH
  // ----------------------------------------------------------

  if (
    befehl === "!tausch"
  ) {
    if (!rest) {
      return tauschAngeboteAnzeigen(
        spieler
      );
    }

    const ziel =
      benutzernameAusText(rest);

    if (!ziel) {
      return tauschAngeboteAnzeigen(
        spieler
      );
    }

    return (
      `🔄 Tauschangebot für @${ziel} vorbereiten.\n` +
      `Nutze später die Tauschfunktion.`
    );
  }


  // ----------------------------------------------------------
  // BEGLEITER
  // ----------------------------------------------------------

  if (
    befehl === "!begleiter"
  ) {
    return begleiterAnzeigen(
      profil
    );
  }


  if (
    befehl === "!begleiterinfo"
  ) {
    return begleiterInfo(
      profil,
      rest
    );
  }


  if (
    befehl === "!begleiterwahl"
  ) {
    const ergebnis =
      begleiterWaehlen(
        profil,
        rest
      );

    await fuchsProfilSpeichern(
      profil
    );

    return ergebnis;
  }


  if (
    befehl === "!begleiterfüttern" ||
    befehl === "!begleiterfuettern"
  ) {
    const ergebnis =
      await begleiterFuettern(
        profil
      );

    await fuchsProfilSpeichern(
      profil
    );

    return ergebnis;
  }


  if (
    befehl === "!begleiterfähigkeit" ||
    befehl === "!begleiterfaehigkeit"
  ) {
    return begleiterFaehigkeit(
      profil
    );
  }


  if (
    befehl === "!begleiterabenteuer"
  ) {
    const ergebnis =
      await begleiterAbenteuer(
        profil
      );

    await fuchsProfilSpeichern(
      profil
    );

    return ergebnis;
  }


  // ----------------------------------------------------------
  // FUCHSWELT
  // ----------------------------------------------------------

  if (
    befehl === "!dorf"
  ) {
    return fuchsDorfAnzeigen();
  }


  if (
    befehl === "!karte"
  ) {
    return fuchsKarte(
      profil
    );
  }


  if (
    befehl === "!wesen"
  ) {
    return wesenListe(
      profil
    );
  }


  if (
    befehl === "!wesen-kampf" ||
    befehl === "!wesenkampf"
  ) {
    const ergebnis =
      await wesenKampf(
        profil
      );

    await fuchsProfilSpeichern(
      profil
    );

    return ergebnis;
  }


  if (
    befehl === "!abenteuer"
  ) {
    if (
      profil.abenteuer
    ) {
      const ergebnis =
        fuchsAbenteuerBeenden(
          profil
        );

      await fuchsProfilSpeichern(
        profil
      );

      return ergebnis;
    }

    const ergebnis =
      fuchsAbenteuerStart(
        profil
      );

    await fuchsProfilSpeichern(
      profil
    );

    return ergebnis;
  }


  if (
    befehl === "!entdeckungen"
  ) {
    return entdeckungsbuchAnzeigen(
      profil
    );
  }


  if (
    befehl === "!geheimnis"
  ) {
    return geheimnisAnzeigen(
      profil
    );
  }


  if (
    befehl === "!statue"
  ) {
    const vorher =
      profil.statueStufe || 0;

    const ergebnis =
      fuchsStatue(
        profil
      );

    if (
      vorher <
      fuchsStatueTexte.length - 1
    ) {
      fuchsStatueFortschritt(
        profil
      );

      chronikEintrag(
        profil,
        "🗿 Die Fuchs-Statue wurde untersucht."
      );

      await fuchsProfilSpeichern(
        profil
      );
    }

    return ergebnis;
  }


  if (
    befehl === "!archiv"
  ) {
    return fuchsArchivAnzeigen();
  }


  if (
    befehl === "!chronik"
  ) {
    return chronikAnzeigen(
      profil
    );
  }


  if (
    befehl === "!kraft"
  ) {
    return torDerFuenfKraefte(
      profil
    );
  }


  if (
    befehl === "!fuchskern"
  ) {
    return fuchskernAnzeigen(
      profil
    );
  }


  // ----------------------------------------------------------
  // RUDEL
  // ----------------------------------------------------------

  if (
    befehl === "!rudel"
  ) {
    return rudelAnzeigen(
      profil
    );
  }


  if (
    befehl === "!rudelwahl"
  ) {
    const ergebnis =
      rudelWechseln(
        profil,
        rest
      );

    await fuchsProfilSpeichern(
      profil
    );

    return ergebnis.text;
  }


  // ----------------------------------------------------------
  // TEAMS
  // ----------------------------------------------------------

  if (
    befehl === "!team"
  ) {
    return teamAnzeigen(
      profil
    );
  }


  if (
    befehl === "!teamgründen" ||
    befehl === "!teamgruenden"
  ) {
    const ergebnis =
      teamErstellen(
        profil,
        rest
      );

    return ergebnis.text;
  }


  if (
    befehl === "!teambeitreten"
  ) {
    const ergebnis =
      teamBeitreten(
        profil,
        rest
      );

    return ergebnis.text;
  }


  if (
    befehl === "!teamverlassen"
  ) {
    const ergebnis =
      teamVerlassen(
        profil
      );

    return ergebnis.text;
  }


  // ----------------------------------------------------------
  // ERFOLGE
  // ----------------------------------------------------------

  if (
    befehl === "!erfolge"
  ) {
    await erfolgePruefen(
      profil
    );

    await fuchsProfilSpeichern(
      profil
    );

    return erfolgeAnzeigen(
      profil
    );
  }


  if (
    befehl === "!titel"
  ) {
    return titelAnzeigen(
      profil
    );
  }


  if (
    befehl === "!titelauswahl"
  ) {
    const ergebnis =
      titelSetzenNeu(
        profil,
        rest
      );

    await fuchsProfilSpeichern(
      profil
    );

    return ergebnis.text;
  }


  if (
    befehl === "!ruhm"
  ) {
    return ruhmeshalleAnzeigen();
  }


  if (
    befehl === "!legenden"
  ) {
    return legendenAnzeigen(
      profil
    );
  }


  // ----------------------------------------------------------
  // SCHICKSAL
  // ----------------------------------------------------------

  if (
    befehl === "!schicksal"
  ) {
    return schicksalAnzeigen(
      profil
    );
  }


  if (
    befehl === "!schicksalsweg"
  ) {
    const ergebnis =
      schicksalWaehlen(
        profil,
        rest
      );

    await fuchsProfilSpeichern(
      profil
    );

    return ergebnis.text;
  }


  // ----------------------------------------------------------
  // ANPASSUNG
  // ----------------------------------------------------------

  if (
    befehl === "!anpassung"
  ) {
    return anpassungAnzeigen(
      profil
    );
  }


  // ----------------------------------------------------------
  // KAMPF
  // ----------------------------------------------------------

  if (
    befehl === "!kampf" ||
    befehl === "!pvp"
  ) {
    const ziel =
      benutzernameAusText(rest);

    if (!ziel) {
      return (
        "⚔️ Schreibe !kampf @Name"
      );
    }

    if (
      normalisieren(ziel) ===
      normalisieren(spieler)
    ) {
      return (
        "🦊 Du kannst dich nicht selbst herausfordern."
      );
    }

    kampfHerausforderungErstellen(
      spieler,
      ziel,
      "fuchsduell"
    );

    if (
      istFuchsMiss(ziel)
    ) {
      const ergebnis =
        await kampfAnnehmen(
          spieler,
          ziel
        );

      return (
        `⚔️ @${ziel} hat die Herausforderung automatisch angenommen!\n` +
        ergebnis
      );
    }

    return (
      `⚔️ @${ziel} wurde herausgefordert!\n` +
      `🤝 @${ziel} muss !annehmen schreiben.`
    );
  }


  // ----------------------------------------------------------
  // ANNEHMEN
  // ----------------------------------------------------------

  if (
    befehl === "!annehmen"
  ) {
    const herausforderung =
      [...kampfHerausforderungen.values()]
        .find(
          x =>
            normalisieren(x.ziel) ===
            normalisieren(spieler)
        );

    if (!herausforderung) {
      return (
        "❓ Du hast keine offene Kampf-Herausforderung."
      );
    }

    const ergebnis =
      await kampfAnnehmen(
        herausforderung.herausforderer,
        spieler
      );

    return ergebnis;
  }


  // ----------------------------------------------------------
  // KAMPFAKTIONEN
  // ----------------------------------------------------------

  if (
    befehl === "!angriff" ||
    befehl === "!verteidigen" ||
    befehl === "!spezial" ||
    befehl === "!begleiterkampf"
  ) {
    const ergebnis =
      await kampfAktionAusfuehren(
        spieler,
        befehl.slice(1)
      );

    await fuchsProfilSpeichern(
      profil
    );

    return ergebnis.text ||
      (
        `⚔️ Aktion ausgeführt: ${befehl.slice(1)}`
      );
  }


  // ----------------------------------------------------------
  // URFUCHS
  // ----------------------------------------------------------

  if (
    befehl === "!urfuchs"
  ) {
    const ergebnis =
      await urfuchsPruefung(
        profil
      );

    await fuchsProfilSpeichern(
      profil
    );

    return ergebnis;
  }


  // ----------------------------------------------------------
  // POKEMON-LEGACY
  // ----------------------------------------------------------

  if (
    befehl === "!pokemon"
  ) {
    const eigenePokemon = {
      fuchsmissvegetalover2_0: "Pikachu",
      vegetalover2_0: "Glumanda"
    };

    const pokemon =
      eigenePokemon[
        normalisieren(spieler)
      ];

    if (pokemon) {
      return (
        `⚡ Dein Pokémon ist ${pokemon}!`
      );
    }

    return (
      "⚡ Du hast aktuell kein Pokémon zugewiesen."
    );
  }


  if (
    befehl === "!pokekampf"
  ) {
    return (
      "⚡ Pokémon-Kämpfe sind als alte Fuchs-Funktion weiterhin verfügbar."
    );
  }


  // ----------------------------------------------------------
  // UNBEKANNTER BEFEHL
  // ----------------------------------------------------------

  return null;
}


// ============================================================
// CHAT-NACHRICHT
// ============================================================

async function chatNachrichtVerarbeiten(
  spieler,
  nachricht
) {
  if (!spieler) {
    return;
  }

  if (!nachricht) {
    return;
  }

  // Nachrichtenquests immer prüfen
  try {
    await nachrichtenQuestsPruefen(
      spieler
    );
  } catch (error) {
    console.error(
      "Questprüfung Fehler:",
      error.message
    );
  }

  if (
    nachricht.trim().startsWith("!")
  ) {
    const antwort =
      await befehlVerarbeiten(
        spieler,
        nachricht
      );

    if (antwort) {
      await streamelementsSenden(
        antwort
      );
    }

    return;
  }

  // Kreative Aufgaben prüfen
  try {
    const kreativeAntwort =
      kreativeQuestsPruefen(
        spieler,
        nachricht
      );

    if (kreativeAntwort) {
      await streamelementsSenden(
        kreativeAntwort
      );
    }
  } catch (error) {
    console.error(
      "Kreativquest Fehler:",
      error.message
    );
  }
}


// ============================================================
// STREAM-ELEMENTS VERBINDUNG
// ============================================================

function streamelementsSocketStarten() {
  const jwt =
    process.env.STREAMELEMENTS_JWT;

  if (!jwt) {
    console.error(
      "❌ STREAMELEMENTS_JWT fehlt."
    );
    return;
  }

  try {
    streamElementsSocket =
      new WebSocket(
        "wss://astro.streamelements.com/"
      );

    streamElementsSocket.on(
      "open",
      () => {
        streamElementsVerbunden = true;

        console.log(
          "🟢 StreamElements WebSocket verbunden."
        );

        streamElementsSocket.send(
          JSON.stringify({
            op: 0,
            d: {
              token: jwt
            }
          })
        );

        streamElementsSocket.send(
          JSON.stringify({
            op: 4,
            d: {
              topic:
                "channel.chat.message",
              token: jwt
            }
          })
        );

        console.log(
          "📡 Chat-Topic abonniert."
        );
      }
    );


    streamElementsSocket.on(
      "message",
      async raw => {
        try {
          const daten =
            JSON.parse(
              raw.toString()
            );

          if (
            daten &&
            daten.d &&
            daten.d.topic ===
              "channel.chat.message"
          ) {
            const message =
              daten.d;

            const spieler =
              twitchSpielerName(
                message
              );

            const text =
              twitchNachrichtText(
                message
              );

            await chatNachrichtVerarbeiten(
              spieler,
              text
            );
          }
        } catch (error) {
          console.error(
            "WebSocket Nachricht Fehler:",
            error.message
          );
        }
      }
    );


    streamElementsSocket.on(
      "close",
      () => {
        streamElementsVerbunden = false;

        console.log(
          "🔴 StreamElements WebSocket getrennt."
        );

        setTimeout(
          streamelementsSocketStarten,
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
      "❌ WebSocket konnte nicht gestartet werden:",
      error.message
    );

    setTimeout(
      streamelementsSocketStarten,
      5000
    );
  }
}


// ============================================================
// HTTP-SERVER
// ============================================================

const server =
  http.createServer(
    async (req, res) => {
      try {
        const url =
          new URL(
            req.url,
            `http://${req.headers.host || "localhost"}`
          );


        // ------------------------------------------------------
        // STARTSEITE
        // ------------------------------------------------------

        if (
          url.pathname === "/"
        ) {
          res.writeHead(
            200,
            {
              "Content-Type":
                "text/html; charset=utf-8"
            }
          );

          res.end(`
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MitsusundWandasWelt</title>
<style>
body {
  margin: 0;
  background: #111;
  color: white;
  font-family: Arial, sans-serif;
  text-align: center;
  padding: 40px 20px;
}
.box {
  max-width: 700px;
  margin: auto;
  padding: 30px;
  border-radius: 20px;
  background: #1d1d1d;
}
h1 {
  font-size: 32px;
}
p {
  font-size: 18px;
}
</style>
</head>
<body>
<div class="box">
<h1>🦊 MitsusundWandasWelt</h1>
<p>🌍 Die Fuchswelt ist online.</p>
<p>🏡 Fuchsdorf wartet auf euch.</p>
<p>❤️ Viel Spaß in der Fuchswelt!</p>
</div>
</body>
</html>
          `);

          return;
        }


        // ------------------------------------------------------
        // PVP OVERLAY
        // ------------------------------------------------------

        if (
          url.pathname === "/pvp"
        ) {
          res.writeHead(
            200,
            {
              "Content-Type":
                "text/html; charset=utf-8"
            }
          );

          res.end(`
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Fuchs PvP</title>
<style>
body {
  margin: 0;
  background: transparent;
  color: white;
  font-family: Arial, sans-serif;
  overflow: hidden;
}
#kampf {
  display: none;
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
  text-align: center;
  background: rgba(0,0,0,0.65);
  border-radius: 20px;
}
.name {
  font-size: 30px;
  font-weight: bold;
}
.vs {
  font-size: 24px;
  margin: 15px;
}
.info {
  font-size: 18px;
}
</style>
</head>
<body>

<div id="kampf">
  <div id="spieler1" class="name">🦊 Fuchs 1</div>
  <div class="info" id="info1"></div>

  <div class="vs">⚔️ VS ⚔️</div>

  <div id="spieler2" class="name">🦊 Fuchs 2</div>
  <div class="info" id="info2"></div>
</div>

<script>
async function laden() {
  try {
    const antwort =
      await fetch("/pvp-data");

    if (!antwort.ok) {
      return;
    }

    const daten =
      await antwort.json();

    const box =
      document.getElementById("kampf");

    if (
      !daten ||
      !daten.aktiv
    ) {
      box.style.display = "none";
      return;
    }

    box.style.display = "block";

    document.getElementById(
      "spieler1"
    ).textContent =
      "🦊 " +
      (daten.spieler1 || "Fuchs 1");

    document.getElementById(
      "spieler2"
    ).textContent =
      "🦊 " +
      (daten.spieler2 || "Fuchs 2");

    document.getElementById(
      "info1"
    ).textContent =
      daten.info1 || "";

    document.getElementById(
      "info2"
    ).textContent =
      daten.info2 || "";

  } catch (error) {
    console.error(error);
  }
}

laden();
setInterval(
  laden,
  3000
);
</script>

</body>
</html>
          `);

          return;
        }


        // ------------------------------------------------------
        // PVP DATEN
        // ------------------------------------------------------

        if (
          url.pathname === "/pvp-data"
        ) {
          const kaempfe =
            [
              ...aktiveKaempfe.values()
            ];

          if (!kaempfe.length) {
            res.writeHead(
              200,
              {
                "Content-Type":
                  "application/json; charset=utf-8"
              }
            );

            res.end(
              JSON.stringify({
                aktiv: false
              })
            );

            return;
          }

          const kampf =
            kaempfe[
              kaempfe.length - 1
            ];

          const profil1 =
            await fuchsProfilHolen(
              kampf.a
            );

          const profil2 =
            await fuchsProfilHolen(
              kampf.b
            );

          res.writeHead(
            200,
            {
              "Content-Type":
                "application/json; charset=utf-8"
            }
          );

          res.end(
            JSON.stringify({
              aktiv: true,
              spieler1:
                fuchsAnzeigeName(profil1),
              spieler2:
                fuchsAnzeigeName(profil2),
              info1:
                `${profil1.rudel || ""} | ⚔️ ${profil1.pvpSiege || 0} Siege`,
              info2:
                `${profil2.rudel || ""} | ⚔️ ${profil2.pvpSiege || 0} Siege`
            })
          );

          return;
        }


        // ------------------------------------------------------
        // HEALTH
        // ------------------------------------------------------

        if (
          url.pathname === "/health"
        ) {
          res.writeHead(
            200,
            {
              "Content-Type":
                "application/json"
            }
          );

          res.end(
            JSON.stringify({
              ok: true,
              bot:
                "MitsusundWandasWelt",
              streamelements:
                streamElementsVerbunden
            })
          );

          return;
        }


        // ------------------------------------------------------
        // 404
        // ------------------------------------------------------

        res.writeHead(
          404,
          {
            "Content-Type":
              "text/plain; charset=utf-8"
          }
        );

        res.end(
          "🦊 Nicht gefunden."
        );

      } catch (error) {
        console.error(
          "HTTP Fehler:",
          error.message
        );

        res.writeHead(
          500,
          {
            "Content-Type":
              "text/plain; charset=utf-8"
          }
        );

        res.end(
          "🦊 Interner Fuchs-Fehler."
        );
      }
    }
  );


// ============================================================
// SERVER START
// ============================================================

const PORT =
  Number(
    process.env.PORT || 10000
  );

server.listen(
  PORT,
  () => {
    console.log(
      `🟢 MitsusundWandasWelt läuft auf Port ${PORT}.`
    );

    console.log(
      `🌍 https://fuchs-xp-bot1.onrender.com`
    );

    streamelementsSocketStarten();
  }
);


// ============================================================
// FEHLERBEHANDLUNG
// ============================================================

process.on(
  "uncaughtException",
  error => {
    console.error(
      "❌ Uncaught Exception:",
      error
    );
  }
);


process.on(
  "unhandledRejection",
  error => {
    console.error(
      "❌ Unhandled Rejection:",
      error
    );
  }
);