import http from "http";
import WebSocket from "ws";


/* =====================================================
   KONFIGURATION
===================================================== */

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  "https://herznunvdqcmzeffblgo.supabase.co";

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const STREAMELEMENTS_JWT =
  process.env.STREAMELEMENTS_JWT || "";

const PORT =
  process.env.PORT || 10000;

let streamElementsChannel =
  process.env.STREAMELEMENTS_CHANNEL || null;


/* =====================================================
   POKÉMON
===================================================== */

const eigenePokemon = {
  fuchsmissvegetalover2_0: "Pikachu",
  vegetalover2_0: "Glumanda",
};

const pokemonListe = [
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


/* =====================================================
   RUDEL
===================================================== */

const rudelMap = {
  feuer: "🔥 Feuerrudel",
  wasser: "🌊 Wasserrudel",
  wald: "🌲 Waldrudel",
  ice: "🧊 ICErudel",
};


/* =====================================================
   PVP
===================================================== */

const offeneKaempfe = new Map();

let aktuellerPvpKampf = null;


/* =====================================================
   WEBSOCKET
===================================================== */

let ws = null;

let wsReconnectTimer = null;

let wsReconnectToken = null;


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


function dbHeaders(extra = {}) {
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
      SUPABASE_URL + path,
      {
        ...options,

        headers:
          dbHeaders(
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
      "❌ XP:",
      error.message
    );
  }
}


/* =====================================================
   PROFIL HOLEN
===================================================== */

async function profilHolen(
  username
) {

  try {

    const rows =
      await supabase(
        `/rest/v1/fuchsprofile` +
        `?spieler=eq.${encodeURIComponent(
          normalisieren(username)
        )}` +
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


/* =====================================================
   PROFIL ANLEGEN
===================================================== */

async function profilAnlegen(
  username
) {

  const user =
    normalisieren(username);

  let profil =
    await profilHolen(user);

  if (profil) {
    return profil;
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
            spieler: user,
            xp: 0,
            rudel: null,
            pokemon: null,
            pvp_siege: 0,
            pvp_niederlagen: 0,
          }),
      }
    );

  } catch (error) {

    console.error(
      "❌ Profil anlegen:",
      error.message
    );
  }

  profil =
    await profilHolen(user);

  return (
    profil || {
      spieler: user,
      xp: 0,
      rudel: null,
      pokemon: null,
      pvp_siege: 0,
      pvp_niederlagen: 0,
    }
  );
}


/* =====================================================
   XP BEFEHL
===================================================== */

async function xpAnzeigen(
  username
) {

  const profil =
    await profilAnlegen(
      username
    );

  const xp =
    Number(
      profil.xp || 0
    );

  const level =
    Math.floor(
      xp / 100
    ) + 1;

  return (
    `🦊 @${username} ` +
    `du hast ${xp} XP ` +
    `und bist Level ${level}!`
  );
}


/* =====================================================
   STREAM ELEMENTS KANAL
===================================================== */

async function streamElementsChannelHolen() {

  if (streamElementsChannel) {
    return streamElementsChannel;
  }

  if (!STREAMELEMENTS_JWT) {

    console.error(
      "❌ STREAMELEMENTS_JWT fehlt."
    );

    return null;
  }

  try {

    const response =
      await fetch(
        "https://api.streamelements.com/kappa/v2/channels/me",
        {
          headers: {
            Authorization:
              `Bearer ${STREAMELEMENTS_JWT}`,

            Accept:
              "application/json",
          },
        }
      );

    const text =
      await response.text();

    if (!response.ok) {
      throw new Error(text);
    }

    const data =
      JSON.parse(text);

    streamElementsChannel =
      data?._id ||
      data?.channel?._id ||
      data?.username ||
      null;

    return streamElementsChannel;

  } catch (error) {

    console.error(
      "❌ StreamElements Kanal:",
      error.message
    );

    return null;
  }
}


/* =====================================================
   STREAM ELEMENTS NACHRICHT
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

    console.error(
      "❌ StreamElements JWT fehlt."
    );

    return false;
  }

  try {

    const channelId =
      await streamElementsChannelHolen();

    if (!channelId) {
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
      `📤 StreamElements ${response.status}: ${body}`
    );

    return response.ok;

  } catch (error) {

    console.error(
      "❌ StreamElements senden:",
      error.message
    );

    return false;
  }
}


/* =====================================================
   NORMALE QUESTS
===================================================== */

async function normaleQuestsPruefen(
  username,
  text
) {

  try {

    await rpc(
      "quest_nachricht_verarbeiten",
      {
        spieler_name:
          normalisieren(username),

        nachricht:
          String(text || ""),
      }
    );

  } catch (error) {

    console.error(
      "❌ Normale Quest:",
      error.message
    );
  }
}


/* =====================================================
   PERSÖNLICHE TAGESQUESTS
===================================================== */

const persoenlicheQuestStatus =
  new Map();


/* =====================================================
   MONTAG
===================================================== */

const questMontag = [

  {
    text:
      "📝 Schreibe 10 Nachrichten im Chat.",
    ziel: 10,
    xp: 50,
    typ: "messages",
  },

  {
    text:
      "📝 Schreibe 20 Nachrichten im Chat.",
    ziel: 20,
    xp: 100,
    typ: "messages",
  },

  {
    text:
      "📝 Schreibe 30 Nachrichten im Chat.",
    ziel: 30,
    xp: 150,
    typ: "messages",
  },

  {
    text:
      "📝 Schreibe 50 Nachrichten im Chat.",
    ziel: 50,
    xp: 250,
    typ: "messages",
  },

  {
    text:
      "📝 Schreibe 75 Nachrichten im Chat.",
    ziel: 75,
    xp: 350,
    typ: "messages",
  },

  {
    text:
      "⚡ Schreibe den Namen deines Lieblings-Pokémon in den Chat.",
    ziel: 1,
    xp: 50,
    typ: "creative",
  },

  {
    text:
      "🌟 Schreibe, welches Pokémon du gerne als Partner auf einem Abenteuer hättest.",
    ziel: 1,
    xp: 75,
    typ: "creative",
  },

  {
    text:
      "😂 Erfinde einen lustigen Spitznamen für ein Pokémon und schreibe ihn in den Chat.",
    ziel: 1,
    xp: 100,
    typ: "creative",
  },

  {
    text:
      "🧪 Erfinde eine neue Pokémon-Attacke und schreibe ihren Namen in den Chat.",
    ziel: 1,
    xp: 125,
    typ: "creative",
  },

  {
    text:
      "😂 Erfinde eine lustige Pokémon-Entwicklung und schreibe, zu welchem Pokémon sie gehört.",
    ziel: 1,
    xp: 150,
    typ: "creative",
  },
];


/* =====================================================
   DIENSTAG
===================================================== */

const questDienstag = [

  {
    text:
      "📝 Schreibe 10 Nachrichten im Chat.",
    ziel: 10,
    xp: 50,
    typ: "messages",
  },

  {
    text:
      "📝 Schreibe 20 Nachrichten im Chat.",
    ziel: 20,
    xp: 100,
    typ: "messages",
  },

  {
    text:
      "📝 Schreibe 30 Nachrichten im Chat.",
    ziel: 30,
    xp: 150,
    typ: "messages",
  },

  {
    text:
      "📝 Schreibe 50 Nachrichten im Chat.",
    ziel: 50,
    xp: 250,
    typ: "messages",
  },

  {
    text:
      "📝 Schreibe 75 Nachrichten im Chat.",
    ziel: 75,
    xp: 350,
    typ: "messages",
  },

  {
    text:
      "🎬 Nenne einen Anime, den du gerne weiterempfehlen würdest.",
    ziel: 1,
    xp: 75,
    typ: "creative",
  },

  {
    text:
      "🎮 Nenne dein Lieblingsspiel aus dem Store.",
    ziel: 1,
    xp: 100,
    typ: "creative",
  },

  {
    text:
      "😂 Erfinde einen lustigen Namen für einen Videospiel-Charakter.",
    ziel: 1,
    xp: 125,
    typ: "creative",
  },

  {
    text:
      "🐾 Wenn dein Haustier ein Videospiel hätte, wie würde es heißen?",
    ziel: 1,
    xp: 150,
    typ: "creative",
  },

  {
    text:
      "🎨 Erfinde den Namen für deine eigene Anime-Welt.",
    ziel: 1,
    xp: 175,
    typ: "creative",
  },
];


/* =====================================================
   MITTWOCH
===================================================== */

const questMittwoch = [

  {
    text:
      "📝 Schreibe 10 Nachrichten im Chat.",
    ziel: 10,
    xp: 50,
    typ: "messages",
  },

  {
    text:
      "📝 Schreibe 20 Nachrichten im Chat.",
    ziel: 20,
    xp: 100,
    typ: "messages",
  },

  {
    text:
      "📝 Schreibe 30 Nachrichten im Chat.",
    ziel: 30,
    xp: 150,
    typ: "messages",
  },

  {
    text:
      "📝 Schreibe 50 Nachrichten im Chat.",
    ziel: 50,
    xp: 250,
    typ: "messages",
  },

  {
    text:
      "📝 Schreibe 75 Nachrichten im Chat.",
    ziel: 75,
    xp: 350,
    typ: "messages",
  },

  {
    text:
      "🌳 Welchen Ort in der Fuchswelt würdest du gerne besuchen?",
    ziel: 1,
    xp: 75,
    typ: "creative",
  },

  {
    text:
      "🦊 Erfinde einen Namen für deinen eigenen Fuchs.",
    ziel: 1,
    xp: 100,
    typ: "creative",
  },

  {
    text:
      "✨ Erfinde einen magischen Gegenstand für die Fuchswelt.",
    ziel: 1,
    xp: 125,
    typ: "creative",
  },

  {
    text:
      "🐾 Erfinde ein neues Wesen für die Fuchswelt.",
    ziel: 1,
    xp: 150,
    typ: "creative",
  },

  {
    text:
      "🌟 Erfinde einen Namen für ein geheimes Gebiet der Fuchswelt.",
    ziel: 1,
    xp: 175,
    typ: "creative",
  },
];


/* =====================================================
   DONNERSTAG
===================================================== */

const questDonnerstag = [

  {
    text:
      "📝 Schreibe 10 Nachrichten im Chat.",
    ziel: 10,
    xp: 50,
    typ: "messages",
  },

  {
    text:
      "📝 Schreibe 20 Nachrichten im Chat.",
    ziel: 20,
    xp: 100,
    typ: "messages",
  },

  {
    text:
      "📝 Schreibe 30 Nachrichten im Chat.",
    ziel: 30,
    xp: 150,
    typ: "messages",
  },

  {
    text:
      "📝 Schreibe 50 Nachrichten im Chat.",
    ziel: 50,
    xp: 250,
    typ: "messages",
  },

  {
    text:
      "📝 Schreibe 75 Nachrichten im Chat.",
    ziel: 75,
    xp: 350,
    typ: "messages",
  },

  {
    text:
      "🔥 Erfinde einen Namen für einen neuen Ort im Feuertal.",
    ziel: 1,
    xp: 75,
    typ: "creative",
  },

  {
    text:
      "🌊 Erfinde einen Namen für einen geheimen Ort in den Wasserlanden.",
    ziel: 1,
    xp: 100,
    typ: "creative",
  },

  {
    text:
      "🌲 Erfinde ein Geheimnis, das im Fuchswald verborgen sein könnte.",
    ziel: 1,
    xp: 125,
    typ: "creative",
  },

  {
    text:
      "🧊 Erfinde ein Wesen, das in den Eisbergen lebt.",
    ziel: 1,
    xp: 150,
    typ: "creative",
  },

  {
    text:
      "🌙 Erfinde einen Namen für ein Geheimnis der Nacht.",
    ziel: 1,
    xp: 175,
    typ: "creative",
  },
];


/* =====================================================
   FREITAG
===================================================== */

const questFreitag = [

  {
    text:
      "🎭 Erfinde einen lustigen Pokémon-Namen für dich selbst und schreibe ihn in den Chat.",
    ziel: 1,
    xp: 75,
    typ: "creative",
  },

  {
    text:
      "😂 Wenn du ein Pokémon wärst: Welche besondere Fähigkeit hättest du?",
    ziel: 1,
    xp: 100,
    typ: "creative",
  },

  {
    text:
      "🎨 Erfinde eine neue Pokémon-Farbe für dein Lieblings-Pokémon und beschreibe sie kurz.",
    ziel: 1,
    xp: 100,
    typ: "creative",
  },

  {
    text:
      "🎤 Wie würde dein Pokémon-Trainername heißen?",
    ziel: 1,
    xp: 125,
    typ: "creative",
  },

  {
    text:
      "🎮 Welches Videospiel aus dem Store würdest du sofort kaufen, wenn es heute kostenlos wäre?",
    ziel: 1,
    xp: 150,
    typ: "creative",
  },

  {
    text:
      "🎵 Welchen Song könntest du gerade immer wieder hören?",
    ziel: 1,
    xp: 175,
    typ: "creative",
  },

  {
    text:
      "🎬 Wenn dein Leben ein Videospiel wäre, wie würde das Spiel heißen?",
    ziel: 1,
    xp: 200,
    typ: "creative",
  },

  {
    text:
      "🐾 Wenn du ein Haustier aus einem Videospiel haben könntest, welches würdest du wählen?",
    ziel: 1,
    xp: 225,
    typ: "creative",
  },

  {
    text:
      "🕹️ Nenne ein Videospiel, das du niemals langweilig findest.",
    ziel: 1,
    xp: 250,
    typ: "creative",
  },

  {
    text:
      "🐾 Wenn dein Haustier ein Mensch wäre, welchen Beruf würde es haben?",
    ziel: 1,
    xp: 275,
    typ: "creative",
  },
];


/* =====================================================
   SAMSTAG
===================================================== */

const questSamstag = [

  {
    text:
      "🎮 Nenne dein absolutes Lieblings-Videospiel.",
    ziel: 1,
    xp: 75,
    typ: "creative",
  },

  {
    text:
      "🐶 Wenn du dir heute ein neues Haustier aussuchen könntest, welches Tier würdest du nehmen?",
    ziel: 1,
    xp: 100,
    typ: "creative",
  },

  {
    text:
      "🎵 Schreibe den Titel deines Lieblingssongs in den Chat.",
    ziel: 1,
    xp: 125,
    typ: "creative",
  },

  {
    text:
      "🎬 Welchen Film würdest du gerne noch einmal zum ersten Mal sehen können?",
    ziel: 1,
    xp: 150,
    typ: "creative",
  },

  {
    text:
      "🚗 GTA: Wenn du in GTA ein eigenes Fahrzeug bauen könntest, wie würde es aussehen?",
    ziel: 1,
    xp: 175,
    typ: "creative",
  },

  {
    text:
      "🚀 Wenn du für einen Tag ins Weltall fliegen könntest, was würdest du dort unbedingt machen?",
    ziel: 1,
    xp: 200,
    typ: "creative",
  },

  {
    text:
      "👻 Du musst eine Nacht allein in einem verlassenen Haus verbringen. Was würdest du mitnehmen?",
    ziel: 1,
    xp: 225,
    typ: "creative",
  },

  {
    text:
      "🦸 Wenn du für einen Tag ein Superheld sein könntest, welche Superkraft würdest du wählen?",
    ziel: 1,
    xp: 250,
    typ: "creative",
  },

  {
    text:
      "🏖️ Du bekommst eine kostenlose Reise an jeden Ort der Welt. Wohin würdest du fliegen?",
    ziel: 1,
    xp: 275,
    typ: "creative",
  },

  {
    text:
      "🎨 Erfinde einen Namen für einen eigenen Anime.",
    ziel: 1,
    xp: 300,
    typ: "creative",
  },
];


/* =====================================================
   SONNTAG
===================================================== */

const questSonntag = [

  ...questMontag,
];


/* =====================================================
   TAGESSET AUSWÄHLEN
===================================================== */

function tagesQuestSet() {

  const tag =
    new Date().getDay();

  if (tag === 1) {
    return questMontag;
  }

  if (tag === 2) {
    return questDienstag;
  }

  if (tag === 3) {
    return questMittwoch;
  }

  if (tag === 4) {
    return questDonnerstag;
  }

  if (tag === 5) {
    return questFreitag;
  }

  if (tag === 6) {
    return questSamstag;
  }

  return questSonntag;
}


/* =====================================================
   BERLIN DATUM
===================================================== */

function berlinDatum() {

  return new Intl.DateTimeFormat(
    "de-DE",
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
   QUEST STATUS
===================================================== */

function persoenlicheQuestsHolen(
  username
) {

  username =
    normalisieren(username);

  const datum =
    berlinDatum();

  let status =
    persoenlicheQuestStatus.get(
      username
    );

  if (
    !status ||
    status.datum !== datum
  ) {

    status = {

      datum,

      quests:
        tagesQuestSet().map(
          q => ({
            text: q.text,
            ziel: q.ziel,
            xp: q.xp,
            typ: q.typ,
            fortschritt: 0,
            abgeschlossen: false,
          })
        ),
    };

    persoenlicheQuestStatus.set(
      username,
      status
    );
  }

  return status;
}


/* =====================================================
   QUEST ANZEIGEN
===================================================== */

async function persoenlicheQuestAnzeigen(
  username
) {

  const status =
    persoenlicheQuestsHolen(
      username
    );

  const liste =
    status.quests
      .map(
        (q, i) => {

          const symbol =
            q.abgeschlossen
              ? "✅"
              : "⬜";

          return (
            `${symbol} ${i + 1}. ` +
            `${q.text} ` +
            `(${q.fortschritt}/${q.ziel}) ` +
            `+${q.xp} XP`
          );
        }
      )
      .join(" | ");

  return (
    `🎯 @${username} Tagesquests: ${liste}`
  );
}


/* =====================================================
   QUEST PRÜFEN
===================================================== */

async function persoenlicheQuestPruefen(
  username,
  text
) {

  username =
    normalisieren(username);

  const nachricht =
    String(text || "").trim();

  if (!nachricht) {
    return;
  }


  /*
     WICHTIG:

     Befehle werden hier niemals
     als persönliche Quest gezählt.
  */

  if (
    nachricht.startsWith("!")
  ) {
    return;
  }


  const status =
    persoenlicheQuestsHolen(
      username
    );


  /*
     NACHRICHTENQUESTS

     Jede normale Chatnachricht
     erhöht den Nachrichtenstand.
  */

  for (
    const quest
    of status.quests
  ) {

    if (
      quest.abgeschlossen
    ) {
      continue;
    }

    if (
      quest.typ ===
      "messages"
    ) {

      quest.fortschritt =
        Math.min(
          quest.ziel,
          quest.fortschritt + 1
        );

      if (
        quest.fortschritt >=
        quest.ziel
      ) {

        quest.abgeschlossen =
          true;

        await xpHinzufuegen(
          username,
          quest.xp
        );

        await streamelementsSenden(
          `🎉 @${username} Tagesquest geschafft! ${quest.text} → +${quest.xp} XP 🦊`
        );
      }
    }
  }


  /*
     KREATIVE QUESTS

     PRO CHATNACHRICHT wird
     HÖCHSTENS EINE kreative Quest
     abgeschlossen.

     Dadurch kann niemals eine
     einzige Nachricht alle fünf
     kreativen Quests abschließen.
  */

  const kreativeQuest =
    status.quests.find(
      q =>
        !q.abgeschlossen &&
        q.typ === "creative"
    );

  if (!kreativeQuest) {
    return;
  }


  kreativeQuest.fortschritt = 1;

  kreativeQuest.abgeschlossen =
    true;


  await xpHinzufuegen(
    username,
    kreativeQuest.xp
  );


  await streamelementsSenden(
    `🎉 @${username} Tagesquest geschafft! ${kreativeQuest.text} → +${kreativeQuest.xp} XP 🦊`
  );
}


/* =====================================================
   RUDELWAHL
===================================================== */

async function rudelwahl(
  username,
  auswahl
) {

  const key =
    normalisieren(
      auswahl
    );

  const rudel =
    rudelMap[key];

  if (!rudel) {

    return (
      `@${username} ❌ Dieses Rudel gibt es nicht. ` +
      `Wähle Feuer, Wasser, Wald oder ICE.`
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
              normalisieren(username),

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


/* =====================================================
   POKÉMON WAHL
===================================================== */

async function pokemonWahl(
  username,
  auswahl
) {

  const user =
    normalisieren(
      username
    );

  const fest =
    eigenePokemon[user];

  if (!auswahl) {

    const profil =
      await profilAnlegen(
        user
      );

    const pokemon =
      fest ||
      profil.pokemon;

    if (!pokemon) {

      return (
        `@${username} 🐾 Du hast noch kein Pokémon. ` +
        `Nutze !pokemon Name`
      );
    }

    return (
      `@${username} 🐾 Dein Pokémon ist ${pokemon}!`
    );
  }


  const pokemon =
    pokemonListe.find(
      p =>
        p.toLowerCase() ===
        String(auswahl)
          .trim()
          .toLowerCase()
    );


  if (!pokemon) {

    return (
      `@${username} ❌ Dieses Pokémon ist nicht verfügbar.`
    );
  }


  if (fest) {

    return (
      `@${username} ⚡ Dein festes Pokémon ist ${fest}.`
    );
  }


  try {

    await supabase(
      `/rest/v1/fuchsprofile?spieler=eq.${encodeURIComponent(
        user
      )}`,
      {
        method: "PATCH",

        body:
          JSON.stringify({
            pokemon,
          }),
      }
    );

    return (
      `@${username} 🐾 Dein Pokémon ist jetzt ${pokemon}!`
    );

  } catch (error) {

    console.error(
      "❌ Pokémon:",
      error.message
    );

    return (
      `@${username} ❌ Pokémon konnte nicht gespeichert werden.`
    );
  }
}


/* =====================================================
   PROFIL
===================================================== */

async function profil(
  username
) {

  const p =
    await profilAnlegen(
      username
    );

  const xp =
    Number(
      p.xp || 0
    );

  const level =
    Math.floor(
      xp / 100
    ) + 1;

  const pokemon =
    eigenePokemon[
      normalisieren(username)
    ] ||
    p.pokemon ||
    "kein Pokémon";

  return (
    `🦊 @${username} ` +
    `| Level ${level} ` +
    `| ${xp} XP ` +
    `| ${p.rudel || "❓ kein Rudel"} ` +
    `| 🐾 ${pokemon} ` +
    `| ⚔️ ${p.pvp_siege || 0} Siege ` +
    `/ ${p.pvp_niederlagen || 0} Niederlagen`
  );
}


/* =====================================================
   PVP START
===================================================== */

async function pvpStart(
  username,
  gegner
) {

  const angreifer =
    normalisieren(
      username
    );

  const verteidiger =
    normalisieren(
      gegner
    );

  if (
    !verteidiger ||
    angreifer === verteidiger
  ) {

    return (
      `@${username} ❌ Ungültiger Gegner.`
    );
  }


  const a =
    await profilAnlegen(
      angreifer
    );

  const v =
    await profilAnlegen(
      verteidiger
    );


  const kampf = {

    angreifer,

    verteidiger,

    typ:
      "rudel",

    angreiferRudel:
      a.rudel || "",

    verteidigerRudel:
      v.rudel || "",

    angreiferPokemon:
      eigenePokemon[angreifer] ||
      a.pokemon ||
      "",

    verteidigerPokemon:
      eigenePokemon[verteidiger] ||
      v.pokemon ||
      "",
  };


  offeneKaempfe.set(
    verteidiger,
    kampf
  );


  /*
     FuchsMiss akzeptiert
     automatisch.
  */

  if (
    angreifer ===
    "fuchsmissvegetalover2_0" ||
    verteidiger ===
    "fuchsmissvegetalover2_0"
  ) {

    return kampfAnnehmen(
      verteidiger
    );
  }


  return (
    `⚔️ @${angreifer} fordert @${verteidiger} heraus! ` +
    `@${verteidiger} schreibe !annehmen`
  );
}


/* =====================================================
   POKÉMON KAMPF
===================================================== */

async function pokemonKampfStart(
  username,
  gegner
) {

  const angreifer =
    normalisieren(
      username
    );

  const verteidiger =
    normalisieren(
      gegner
    );


  if (
    !verteidiger ||
    angreifer === verteidiger
  ) {

    return (
      `@${username} ❌ Ungültiger Gegner.`
    );
  }


  const a =
    await profilAnlegen(
      angreifer
    );

  const v =
    await profilAnlegen(
      verteidiger
    );


  const pokemonA =
    eigenePokemon[angreifer] ||
    a.pokemon;

  const pokemonV =
    eigenePokemon[verteidiger] ||
    v.pokemon;


  if (!pokemonA) {

    return (
      `@${username} ❌ Du hast noch kein Pokémon.`
    );
  }


  if (!pokemonV) {

    return (
      `@${username} ❌ Der Gegner hat noch kein Pokémon.`
    );
  }


  offeneKaempfe.set(
    verteidiger,
    {
      angreifer,

      verteidiger,

      typ:
        "pokemon",

      angreiferRudel:
        a.rudel || "",

      verteidigerRudel:
        v.rudel || "",

      angreiferPokemon:
        pokemonA,

      verteidigerPokemon:
        pokemonV,
    }
  );


  if (
    angreifer ===
    "fuchsmissvegetalover2_0" ||
    verteidiger ===
    "fuchsmissvegetalover2_0"
  ) {

    return kampfAnnehmen(
      verteidiger
    );
  }


  return (
    `⚡ @${angreifer} fordert @${verteidiger} zum Pokémon-Kampf heraus! ` +
    `@${verteidiger} schreibe !annehmen`
  );
}


/* =====================================================
   KAMPF ANNEHMEN
===================================================== */

async function kampfAnnehmen(
  username
) {

  const user =
    normalisieren(
      username
    );

  const kampf =
    offeneKaempfe.get(
      user
    );


  if (!kampf) {

    return (
      `@${username} ❌ Es gibt keine offene Herausforderung.`
    );
  }


  offeneKaempfe.delete(
    user
  );


  const gewinner =
    Math.random() < 0.5
      ? kampf.angreifer
      : kampf.verteidiger;


  const verlierer =
    gewinner ===
    kampf.angreifer
      ? kampf.verteidiger
      : kampf.angreifer;


  aktuellerPvpKampf = {

    ...kampf,

    gewinner,
  };


  try {

    await xpHinzufuegen(
      gewinner,
      100
    );


    const winnerProfil =
      await profilHolen(
        gewinner
      );


    const loserProfil =
      await profilHolen(
        verlierer
      );


    await supabase(
      `/rest/v1/fuchsprofile?spieler=eq.${encodeURIComponent(
        gewinner
      )}`,
      {
        method: "PATCH",

        body:
          JSON.stringify({
            pvp_siege:
              Number(
                winnerProfil?.pvp_siege ||
                0
              ) + 1,
          }),
      }
    );


    await supabase(
      `/rest/v1/fuchsprofile?spieler=eq.${encodeURIComponent(
        verlierer
      )}`,
      {
        method: "PATCH",

        body:
          JSON.stringify({
            pvp_niederlagen:
              Number(
                loserProfil?.pvp_niederlagen ||
                0
              ) + 1,
          }),
      }
    );

  } catch (error) {

    console.error(
      "❌ Kampf DB:",
      error.message
    );
  }


  if (
    kampf.typ ===
    "pokemon"
  ) {

    return (
      `⚡ POKÉMON-KAMPF! ` +
      `@${kampf.angreifer} ${kampf.angreiferPokemon} ⚔️ ` +
      `@${kampf.verteidiger} ${kampf.verteidigerPokemon} ` +
      `→ 🏆 @${gewinner} gewinnt +100 XP!`
    );
  }


  return (
    `⚔️ RUDEL-KAMPF! ` +
    `@${kampf.angreifer} [${kampf.angreiferRudel || "kein Rudel"}] ⚔️ ` +
    `@${kampf.verteidiger} [${kampf.verteidigerRudel || "kein Rudel"}] ` +
    `→ 🏆 @${gewinner} gewinnt +100 XP!`
  );
}


/* =====================================================
   ALLE BEFEHLE
===================================================== */

async function alleBefehle(
  username
) {

  return (
    `@${username} 🦊 Befehle: ` +
    `!xp | ` +
    `!profil | ` +
    `!quest | ` +
    `!rudelwahl Feuer/Wasser/Wald/ICE | ` +
    `!pokemon | ` +
    `!pokemon Name | ` +
    `!pvp @Name | ` +
    `!pokekampf @Name | ` +
    `!annehmen | ` +
    `!allebefehle`
  );
}


/* =====================================================
   CHAT VERARBEITEN
===================================================== */

async function chatVerarbeiten(
  message
) {

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
    message.data || {};


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
    normalisieren(
      usernameRaw
    );


  if (
    username ===
    "streamelements"
  ) {
    return;
  }


  const text =
    String(
      data?.message?.text ||
      data?.text ||
      ""
    ).trim();


  if (!text) {
    return;
  }


  console.log(
    `💬 ${username}: ${text}`
  );


  /* =================================================
     !XP
  ================================================= */

  if (
    /^!xp$/i.test(
      text
    )
  ) {

    await streamelementsSenden(
      await xpAnzeigen(
        username
      )
    );

    return;
  }


  /* =================================================
     !PROFIL
  ================================================= */

  if (
    /^!profil$/i.test(
      text
    )
  ) {

    await streamelementsSenden(
      await profil(
        username
      )
    );

    return;
  }


  /* =================================================
     !QUEST
  ================================================= */

  if (
    /^!quest$/i.test(
      text
    )
  ) {

    await streamelementsSenden(
      await persoenlicheQuestAnzeigen(
        username
      )
    );

    return;
  }


  /* =================================================
     !ALLEBEFEHLE
  ================================================= */

  if (
    /^!allebefehle$/i.test(
      text
    )
  ) {

    await streamelementsSenden(
      await alleBefehle(
        username
      )
    );

    return;
  }


  /* =================================================
     !RUDELWAHL
  ================================================= */

  let match =
    text.match(
      /^!rudelwahl\s+(.+)$/i
    );


  if (match) {

    await streamelementsSenden(
      await rudelwahl(
        username,
        match[1]
      )
    );

    return;
  }


  /* =================================================
     !POKEMON
  ================================================= */

  match =
    text.match(
      /^!pokemon(?:\s+(.+))?$/i
    );


  if (match) {

    await streamelementsSenden(
      await pokemonWahl(
        username,
        match[1]
      )
    );

    return;
  }


  /* =================================================
     !PVP
  ================================================= */

  match =
    text.match(
      /^!pvp\s+@?([a-zA-Z0-9_]+)$/i
    );


  if (match) {

    try {

      const antwort =
        await pvpStart(
          username,
          match[1]
        );

      if (antwort) {

        await streamelementsSenden(
          antwort
        );
      }

    } catch (error) {

      console.error(
        "❌ !pvp:",
        error.message
      );

      await streamelementsSenden(
        `@${username} ❌ Der PvP-Kampf konnte nicht gestartet werden.`
      );
    }

    return;
  }


  /* =================================================
     !POKEKAMPF
  ================================================= */

  match =
    text.match(
      /^!pokekampf\s+@?([a-zA-Z0-9_]+)$/i
    );


  if (match) {

    const antwort =
      await pokemonKampfStart(
        username,
        match[1]
      );

    if (antwort) {

      await streamelementsSenden(
        antwort
      );
    }

    return;
  }


  /* =================================================
     !ANNEHMEN
  ================================================= */

  if (
    /^!annehmen$/i.test(
      text
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


  /* =================================================
     ANDERE BEFEHLE

     Alle Nachrichten mit !
     werden NICHT als persönliche
     Quest gezählt.
  ================================================= */

  if (
    text.startsWith("!")
  ) {
    return;
  }


  /* =================================================
     NORMALE CHATNACHRICHT
  ================================================= */

  await normaleQuestsPruefen(
    username,
    text
  );


  await persoenlicheQuestPruefen(
    username,
    text
  );
}


/* =====================================================
   PVP OVERLAY
===================================================== */

const overlay = `
<!DOCTYPE html>

<html lang="de">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1.0"
>

<title>Fuchs PvP</title>

<style>

html,
body {

  margin: 0;

  width: 100%;

  height: 100%;

  overflow: hidden;

  background:
    transparent;

  font-family:
    Arial,
    sans-serif;
}

.card {

  margin: auto;

  margin-top: 8%;

  max-width: 900px;

  padding: 28px;

  border-radius: 24px;

  background:
    rgba(20,20,20,.92);

  color: white;

  text-align: center;
}

.fighters {

  display: flex;

  justify-content: center;

  align-items: center;

  gap: 25px;
}

.fighter {

  min-width: 250px;

  padding: 20px;

  border-radius: 18px;

  background:
    rgba(255,255,255,.08);
}

.name {

  font-size: 28px;

  font-weight: 800;
}

.detail {

  font-size: 22px;

  margin-top: 10px;
}

.vs {

  font-size: 40px;
}

.winner {

  font-size: 28px;

  font-weight: 900;

  margin-top: 25px;
}

</style>

</head>

<body>

<div id="app"></div>

<script>

async function laden() {

  try {

    const response =
      await fetch(
        "/pvp-data",
        {
          cache:
            "no-store"
        }
      );

    const data =
      await response.json();

    const kampf =
      data.kampf;

    const app =
      document.getElementById(
        "app"
      );

    if (!kampf) {

      app.innerHTML = "";

      return;
    }

    const pokemon =
      kampf.typ ===
      "pokemon";

    const titel =
      pokemon
        ? "🐾 POKÉMON-KAMPF 🐾"
        : "⚔️ RUDEL-KAMPF ⚔️";

    const detail1 =
      pokemon
        ? kampf.angreiferPokemon
        : kampf.angreiferRudel;

    const detail2 =
      pokemon
        ? kampf.verteidigerPokemon
        : kampf.verteidigerRudel;

    app.innerHTML =

      '<div class="card">' +

      '<h1>' +
      titel +
      '</h1>' +

      '<div class="fighters">' +

      '<div class="fighter">' +

      '<div class="name">' +
      '@' +
      kampf.angreifer +
      '</div>' +

      '<div class="detail">' +
      (detail1 || "") +
      '</div>' +

      '</div>' +

      '<div class="vs">⚔️</div>' +

      '<div class="fighter">' +

      '<div class="name">' +
      '@' +
      kampf.verteidiger +
      '</div>' +

      '<div class="detail">' +
      (detail2 || "") +
      '</div>' +

      '</div>' +

      '</div>' +

      '<div class="winner">' +
      '🏆 @' +
      kampf.gewinner +
      '</div>' +

      '</div>';

  } catch (error) {

    console.error(
      error
    );
  }
}

laden();

setInterval(
  laden,
  1000
);

</script>

</body>

</html>
`;


/* =====================================================
   HTTP SERVER
===================================================== */

const server =
  http.createServer(
    async (
      req,
      res
    ) => {

      try {

        /* =============================================
           STARTSEITE
        ============================================= */

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


        /* =============================================
           PVP OVERLAY
        ============================================= */

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

          res.end(
            overlay
          );

          return;
        }


        /* =============================================
           PVP DATEN
        ============================================= */

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
                "no-store",
            }
          );

          res.end(
            JSON.stringify({
              kampf:
                aktuellerPvpKampf,
            })
          );

          return;
        }


        /* =============================================
           404
        ============================================= */

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
          "❌ HTTP:",
          error.message
        );

        res.writeHead(
          500
        );

        res.end(
          "500"
        );
      }
    }
  );


/* =====================================================
   STREAM ELEMENTS WEBSOCKET
===================================================== */

function streamelementsVerbinden() {

  if (
    !STREAMELEMENTS_JWT
  ) {

    console.error(
      "❌ STREAMELEMENTS_JWT fehlt."
    );

    return;
  }


  if (
    ws &&
    (
      ws.readyState ===
      WebSocket.OPEN ||

      ws.readyState ===
      WebSocket.CONNECTING
    )
  ) {

    return;
  }


  const url =
    wsReconnectToken

      ? `wss://astro.streamelements.com/?reconnect_token=${encodeURIComponent(
          wsReconnectToken
        )}`

      : "wss://astro.streamelements.com/";


  console.log(
    "🔌 Verbinde StreamElements WebSocket..."
  );


  ws =
    new WebSocket(
      url
    );


  ws.on(
    "open",
    () => {

      console.log(
        "✅ StreamElements WebSocket verbunden."
      );
    }
  );


  ws.on(
    "message",
    async raw => {

      try {

        const message =
          JSON.parse(
            raw.toString()
          );


        /* ===========================================
           WELCOME
        =========================================== */

        if (
          message.type ===
          "welcome"
        ) {

          wsReconnectToken =
            null;


          ws.send(
            JSON.stringify({

              type:
                "subscribe",

              nonce:
                `fuchs-${Date.now()}-${zufall(
                  1000,
                  9999
                )}`,

              data: {

                topic:
                  "channel.chat.message",

                token:
                  STREAMELEMENTS_JWT,

                token_type:
                  "jwt",
              },
            })
          );


          console.log(
            "📡 channel.chat.message abonniert."
          );

          return;
        }


        /* ===========================================
           RECONNECT
        =========================================== */

        if (
          message.type ===
          "reconnect"
        ) {

          wsReconnectToken =
            message?.data?.reconnect_token ||
            null;

          try {
            ws.close();
          } catch {}

          return;
        }


        /* ===========================================
           FEHLER
        =========================================== */

        if (
          message.type ===
            "response" &&
          message.error
        ) {

          console.error(
            "❌ StreamElements:",
            message.error
          );

          return;
        }


        /* ===========================================
           CHAT
        =========================================== */

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


  ws.on(
    "close",
    () => {

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
        "❌ WebSocket Fehler:",
        error.message
      );
    }
  );
}


/* =====================================================
   BOT STARTEN
===================================================== */

server.listen(
  PORT,
  async () => {

    console.log(
      `🚀 Fuchs-XP-Bot läuft auf Port ${PORT}`
    );

    console.log(
      "🌐 PvP: /pvp"
    );


    try {

      await streamElementsChannelHolen();

      console.log(
        "📺 StreamElements Kanal:",
        streamElementsChannel
      );

    } catch (error) {

      console.error(
        "⚠️ StreamElements Kanal:",
        error.message
      );
    }


    streamelementsVerbinden();
  }
);