import http from "http";
import WebSocket from "ws";


/* =====================================================
   MITSUSUNDWANDASWELT
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

let streamElementsChannelId =
  null;

let ws = null;
let wsReconnectTimer = null;


/* =====================================================
   GRUNDWERTE
===================================================== */

const profileCache =
  new Map();

const offeneKaempfe =
  new Map();

const tagesQuestCache =
  new Map();

const abenteuerCooldown =
  new Map();

let aktuellerPvpKampf =
  null;


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
   FESTE POKÉMON
===================================================== */

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
    Math.random() *
      (max - min + 1)
  ) + min;
}


function warten(ms) {
  return new Promise(
    resolve =>
      setTimeout(resolve, ms)
  );
}


function datumBerlin() {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        "Europe/Berlin",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).format(new Date());
}


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


/* =====================================================
   SUPABASE
===================================================== */

async function supabase(
  path,
  options = {}
) {
  if (
    !SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY fehlt"
    );
  }

  const response =
    await fetch(
      `${SUPABASE_URL}${path}`,
      {
        ...options,
        headers: headers(
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

async function streamElementsKanalHolen() {
  if (
    !STREAMELEMENTS_JWT
  ) {
    console.log(
      "⚠️ STREAMELEMENTS_JWT fehlt."
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
      throw new Error(
        `StreamElements ${response.status}: ${text}`
      );
    }

    const data =
      JSON.parse(text);

    streamElementsChannelId =
      data?._id || null;

    console.log(
      "📺 StreamElements Channel-ID:",
      streamElementsChannelId
    );

    return streamElementsChannelId;
  } catch (error) {
    console.error(
      "❌ StreamElements Kanal:",
      error.message
    );

    return null;
  }
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
    return false;
  }

  if (
    !streamElementsChannelId
  ) {
    await streamElementsKanalHolen();
  }

  if (
    !streamElementsChannelId
  ) {
    return false;
  }

  try {
    const response =
      await fetch(
        `https://api.streamelements.com/kappa/v2/bot/${encodeURIComponent(
          streamElementsChannelId
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
      "❌ StreamElements Senden:",
      error.message
    );

    return false;
  }
}


/* =====================================================
   LEVELSYSTEM
===================================================== */

const levelXP = [
  0,
  100,
  250,
  450,
  700,
  1000,
  1350,
  1750,
  2200,
  2500,
  3000,
  3500,
  4000,
  4500,
  5000,
  5500,
  6000,
  6500,
  7000,
  7500,
  8250,
  9000,
  9750,
  10500,
  11250,
  12000,
  12750,
  13500,
  14250,
  15000,
  16000,
  17000,
  18000,
  19000,
  20000,
  21250,
  22500,
  23750,
  25000,
  26250,
  28000,
  30000,
  32000,
  34000,
  36000,
  38000,
  40000,
  42500,
  45000,
  47500,
  50000,
];


function levelAusXP(xp) {
  let level = 1;

  for (
    let i = 1;
    i < levelXP.length;
    i++
  ) {
    if (
      Number(xp || 0) >=
      levelXP[i]
    ) {
      level = i + 1;
    }
  }

  return Math.min(
    level,
    50
  );
}


function levelTitel(level) {
  if (level <= 10) {
    return "Jungfuchs";
  }

  if (level <= 20) {
    return "Waldläufer";
  }

  if (level <= 30) {
    return "Fuchs-Kämpfer";
  }

  if (level <= 40) {
    return "Fuchsmeister";
  }

  return "Fuchslegende";
}


/* =====================================================
   PROFIL
===================================================== */

function neuesProfil(
  username
) {
  username =
    normalisieren(username);

  return {
    spieler: username,

    xp: 0,

    rudel: null,

    pokemon:
      eigenePokemon[
        username
      ] || null,

    pvp_siege: 0,

    pvp_niederlagen: 0,

    coins: 100,

    energy: 100,

    fuchsName: "",

    denName:
      "Fuchsbau",

    denStufe: 1,

    inventory: [],

    companions: [],

    erfolge: [],

    ruf: 0,

    chronik: [],

    entdeckungen: [],

    schicksal: [],

    titel:
      "Jungfuchs",

    fuenftesFragment: 0,
  };
}


async function fuchsProfilHolen(
  username
) {
  username =
    normalisieren(username);

  if (
    profileCache.has(username)
  ) {
    return profileCache.get(
      username
    );
  }

  let profil =
    neuesProfil(username);

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
      profil = {
        ...profil,
        ...rows[0],
      };
    }
  } catch (error) {
    console.error(
      "⚠️ Profil laden:",
      error.message
    );
  }

  if (
    !Array.isArray(
      profil.inventory
    )
  ) {
    profil.inventory = [];
  }

  if (
    !Array.isArray(
      profil.companions
    )
  ) {
    profil.companions = [];
  }

  if (
    !Array.isArray(
      profil.erfolge
    )
  ) {
    profil.erfolge = [];
  }

  if (
    !Array.isArray(
      profil.chronik
    )
  ) {
    profil.chronik = [];
  }

  if (
    !Array.isArray(
      profil.entdeckungen
    )
  ) {
    profil.entdeckungen = [];
  }

  if (
    !Array.isArray(
      profil.schicksal
    )
  ) {
    profil.schicksal = [];
  }

  profil.xp =
    Number(profil.xp || 0);

  profil.coins =
    Number(
      profil.coins ?? 100
    );

  profil.energy =
    Number(
      profil.energy ?? 100
    );

  profileCache.set(
    username,
    profil
  );

  return profil;
}


async function fuchsProfilSpeichern(
  profil
) {
  profileCache.set(
    profil.spieler,
    profil
  );

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
              profil.spieler,

            xp:
              Number(
                profil.xp || 0
              ),

            rudel:
              profil.rudel,

            pokemon:
              profil.pokemon,

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
  } catch (error) {
    console.error(
      "⚠️ Profil speichern:",
      error.message
    );
  }
}


/* =====================================================
   XP & MÜNZEN
===================================================== */

async function fuchsXPVergeben(
  username,
  menge
) {
  username =
    normalisieren(username);

  const profil =
    await fuchsProfilHolen(
      username
    );

  const vorher =
    levelAusXP(
      profil.xp
    );

  profil.xp +=
    Number(menge || 0);

  const nachher =
    levelAusXP(
      profil.xp
    );

  if (
    nachher > vorher
  ) {
    profil.coins += 25;

    profil.energy =
      Math.min(
        100,
        profil.energy + 10
      );

    profil.titel =
      levelTitel(nachher);

    await streamelementsSenden(
      `🦊 @${username} Level ${nachher}! ${profil.titel} – +25 💰 und +10 ⚡`
    );
  }

  await fuchsProfilSpeichern(
    profil
  );

  return profil;
}


async function fuchsMuenzenVergeben(
  username,
  menge
) {
  const profil =
    await fuchsProfilHolen(
      username
    );

  profil.coins +=
    Number(menge || 0);

  await fuchsProfilSpeichern(
    profil
  );

  return profil;
}


async function energieAendern(
  username,
  menge
) {
  const profil =
    await fuchsProfilHolen(
      username
    );

  profil.energy =
    Math.max(
      0,
      Math.min(
        100,
        profil.energy +
          Number(menge || 0)
      )
    );

  await fuchsProfilSpeichern(
    profil
  );

  return profil;
}


/* =====================================================
   FUCHSNAME & BAUNAME
===================================================== */

async function fuchsnameSetzen(
  username,
  name
) {
  const profil =
    await fuchsProfilHolen(
      username
    );

  name =
    String(name || "")
      .trim()
      .slice(0, 24);

  if (!name) {
    return (
      `@${username} ❌ Bitte einen Namen angeben.`
    );
  }

  profil.fuchsName =
    name;

  await fuchsProfilSpeichern(
    profil
  );

  return (
    `@${username} 🦊 Dein Fuchs heißt jetzt ${name}!`
  );
}


async function fuchsbauNameSetzen(
  username,
  name
) {
  const profil =
    await fuchsProfilHolen(
      username
    );

  name =
    String(name || "")
      .trim()
      .slice(0, 30);

  if (!name) {
    return (
      `@${username} ❌ Bitte einen Namen für deinen Bau angeben.`
    );
  }

  profil.denName =
    name;

  await fuchsProfilSpeichern(
    profil
  );

  return (
    `@${username} 🏠 Dein Fuchsbau heißt jetzt „${name}“!`
  );
}


/* =====================================================
   RUDELWAHL
===================================================== */

async function rudelwahl(
  username,
  auswahl
) {
  const profil =
    await fuchsProfilHolen(
      username
    );

  const key =
    normalisieren(
      auswahl
    );

  if (
    !rudelMap[key]
  ) {
    return (
      `@${username} ❌ Wähle: feuer, wasser, wald oder ice.`
    );
  }

  profil.rudel =
    rudelMap[key];

  await fuchsProfilSpeichern(
    profil
  );

  return (
    `@${username} ${profil.rudel} Willkommen in deinem Rudel! 🦊`
  );
}


/* =====================================================
   PROFILANZEIGE
===================================================== */

function fuchsAnzeigeName(
  profil
) {
  return (
    profil.fuchsName ||
    profil.spieler
  );
}


async function profilAnzeigen(
  username
) {
  const profil =
    await fuchsProfilHolen(
      username
    );

  const level =
    levelAusXP(
      profil.xp
    );

  return (
    `🦊 ${fuchsAnzeigeName(profil)} | ` +
    `${profil.rudel || "🐺 Noch kein Rudel"} | ` +
    `👑 ${profil.titel || levelTitel(level)} | ` +
    `Level ${level} | ` +
    `✨ ${profil.xp} XP | ` +
    `💰 ${profil.coins} | ` +
    `⚡ ${profil.energy}/100 | ` +
    `⚔️ ${profil.pvp_siege || 0} Siege / ` +
    `${profil.pvp_niederlagen || 0} Niederlagen | ` +
    `📣 Ruf ${profil.ruf || 0}`
  );
}


/* =====================================================
   TAGESQUEST-VORLAGEN
===================================================== */

const questSetTag1 = [
  {
    text:
      "📝 Schreibe 10 Nachrichten im Chat",
    ziel: 10,
    xp: 50,
    typ: "nachrichten",
  },
  {
    text:
      "📝 Schreibe 20 Nachrichten im Chat",
    ziel: 20,
    xp: 100,
    typ: "nachrichten",
  },
  {
    text:
      "📝 Schreibe 30 Nachrichten im Chat",
    ziel: 30,
    xp: 150,
    typ: "nachrichten",
  },
  {
    text:
      "📝 Schreibe 50 Nachrichten im Chat",
    ziel: 50,
    xp: 250,
    typ: "nachrichten",
  },
  {
    text:
      "📝 Schreibe 75 Nachrichten im Chat",
    ziel: 75,
    xp: 350,
    typ: "nachrichten",
  },
  {
    text:
      "⚡ Schreibe den Namen deines Lieblings-Pokémon in den Chat",
    ziel: 1,
    xp: 50,
    typ: "kreativ",
  },
  {
    text:
      "🌟 Schreibe im Chat, welches Pokémon du gerne als Partner auf einem Abenteuer hättest",
    ziel: 1,
    xp: 75,
    typ: "kreativ",
  },
  {
    text:
      "😂 Erfinde einen lustigen Spitznamen für ein Pokémon und schreibe ihn in den Chat",
    ziel: 1,
    xp: 100,
    typ: "kreativ",
  },
  {
    text:
      "🧪 Erfinde eine neue Pokémon-Attacke und schreibe ihren Namen in den Chat",
    ziel: 1,
    xp: 125,
    typ: "kreativ",
  },
  {
    text:
      "😂 Erfinde eine lustige Pokémon-Entwicklung und schreibe, zu welchem Pokémon sie gehört",
    ziel: 1,
    xp: 150,
    typ: "kreativ",
  },
];


const questSetFreitag = [
  {
    text:
      "🎭 Erfinde einen lustigen Pokémon-Namen für dich selbst und schreibe ihn in den Chat",
    ziel: 1,
    xp: 75,
    typ: "kreativ",
  },
  {
    text:
      "😂 Wenn du ein Pokémon wärst: Welche besondere Fähigkeit hättest du? Schreibe sie in den Chat",
    ziel: 1,
    xp: 100,
    typ: "kreativ",
  },
  {
    text:
      "🎨 Erfinde eine neue Pokémon-Farbe für dein Lieblings-Pokémon und beschreibe sie kurz im Chat",
    ziel: 1,
    xp: 100,
    typ: "kreativ",
  },
  {
    text:
      "🎤 Stell dir vor, du bist ein Pokémon-Trainer: Wie würde dein Trainername heißen? Schreib ihn in den Chat",
    ziel: 1,
    xp: 125,
    typ: "kreativ",
  },
  {
    text:
      "🎮 Welches Videospiel aus dem Store würdest du sofort kaufen, wenn es heute kostenlos wäre?",
    ziel: 1,
    xp: 150,
    typ: "kreativ",
  },
  {
    text:
      "🎵 Welchen Song könntest du gerade immer wieder hören?",
    ziel: 1,
    xp: 175,
    typ: "kreativ",
  },
  {
    text:
      "🎬 Wenn dein Leben ein Videospiel wäre, wie würde das Spiel heißen?",
    ziel: 1,
    xp: 200,
    typ: "kreativ",
  },
  {
    text:
      "🐾 Wenn du ein Haustier aus einem Videospiel haben könntest, welches würdest du wählen?",
    ziel: 1,
    xp: 225,
    typ: "kreativ",
  },
  {
    text:
      "🕹️ Nenne ein Videospiel, das du niemals langweilig findest.",
    ziel: 1,
    xp: 250,
    typ: "kreativ",
  },
  {
    text:
      "🐾 Wenn dein Haustier ein Mensch wäre, welchen Beruf würde es haben?",
    ziel: 1,
    xp: 275,
    typ: "kreativ",
  },
];


const questSetSamstag = [
  {
    text:
      "🎮 Nenne dein absolutes Lieblings-Videospiel und schreibe es in den Chat.",
    ziel: 1,
    xp: 75,
    typ: "kreativ",
  },
  {
    text:
      "🐶 Wenn du dir heute ein neues Haustier aussuchen könntest, welches Tier würdest du nehmen?",
    ziel: 1,
    xp: 100,
    typ: "kreativ",
  },
  {
    text:
      "🎵 Schreibe den Titel deines Lieblingssongs in den Chat.",
    ziel: 1,
    xp: 125,
    typ: "kreativ",
  },
  {
    text:
      "🎬 Welchen Film würdest du gerne noch einmal zum ersten Mal sehen können?",
    ziel: 1,
    xp: 150,
    typ: "kreativ",
  },
  {
    text:
      "🚗 GTA: Wenn du in GTA ein eigenes Fahrzeug bauen könntest, wie würde es aussehen?",
    ziel: 1,
    xp: 175,
    typ: "kreativ",
  },
  {
    text:
      "🚀 Wenn du für einen Tag ins Weltall fliegen könntest, was würdest du dort unbedingt machen?",
    ziel: 1,
    xp: 200,
    typ: "kreativ",
  },
  {
    text:
      "👻 Du musst eine Nacht allein in einem verlassenen Haus verbringen. Was würdest du als Erstes mitnehmen?",
    ziel: 1,
    xp: 225,
    typ: "kreativ",
  },
  {
    text:
      "🦸 Wenn du für einen Tag ein Superheld sein könntest, welche Superkraft würdest du wählen?",
    ziel: 1,
    xp: 250,
    typ: "kreativ",
  },
  {
    text:
      "🏖️ Du bekommst eine kostenlose Reise an jeden Ort der Welt. Wohin würdest du fliegen?",
    ziel: 1,
    xp: 275,
    typ: "kreativ",
  },
  {
    text:
      "🎨 Erfinde einen Namen für einen eigenen Anime und schreibe ihn in den Chat.",
    ziel: 1,
    xp: 300,
    typ: "kreativ",
  },
];


const questSetSonntag = [
  {
    text:
      "🎬 Nenne deine Lieblingsserie.",
    ziel: 1,
    xp: 75,
    typ: "kreativ",
  },
  {
    text:
      "🎮 Welches Spiel würdest du gerne einmal ausprobieren?",
    ziel: 1,
    xp: 100,
    typ: "kreativ",
  },
  {
    text:
      "🐾 Erfinde einen Namen für ein Fantasie-Haustier.",
    ziel: 1,
    xp: 125,
    typ: "kreativ",
  },
  {
    text:
      "🎵 Nenne einen Song, der gute Laune macht.",
    ziel: 1,
    xp: 150,
    typ: "kreativ",
  },
  {
    text:
      "🧙 Erfinde einen Namen für einen Fantasy-Charakter.",
    ziel: 1,
    xp: 175,
    typ: "kreativ",
  },
  {
    text:
      "👻 Erfinde den Namen eines Horrorfilms.",
    ziel: 1,
    xp: 200,
    typ: "kreativ",
  },
  {
    text:
      "⚽ Nenne deinen Lieblingssport.",
    ziel: 1,
    xp: 225,
    typ: "kreativ",
  },
  {
    text:
      "🎨 Erfinde ein neues Fuchs-Outfit.",
    ziel: 1,
    xp: 250,
    typ: "kreativ",
  },
  {
    text:
      "🏠 Beschreibe dein perfektes Zuhause.",
    ziel: 1,
    xp: 275,
    typ: "kreativ",
  },
  {
    text:
      "😂 Erfinde einen lustigen Namen für einen Fuchs.",
    ziel: 1,
    xp: 300,
    typ: "kreativ",
  },
];


const questSetMontag = [
  {
    text:
      "🎮 Nenne dein meistgespieltes Spiel.",
    ziel: 1,
    xp: 75,
    typ: "kreativ",
  },
  {
    text:
      "🎬 Nenne einen Anime, den du empfehlen würdest.",
    ziel: 1,
    xp: 100,
    typ: "kreativ",
  },
  {
    text:
      "🎵 Nenne deinen Lieblingskünstler.",
    ziel: 1,
    xp: 125,
    typ: "kreativ",
  },
  {
    text:
      "🐾 Erfinde einen Namen für einen Super-Hund.",
    ziel: 1,
    xp: 150,
    typ: "kreativ",
  },
  {
    text:
      "🦸 Erfinde einen Superheldennamen.",
    ziel: 1,
    xp: 175,
    typ: "kreativ",
  },
  {
    text:
      "🚗 GTA: Erfinde einen Namen für einen GTA-Charakter.",
    ziel: 1,
    xp: 200,
    typ: "kreativ",
  },
  {
    text:
      "🕹️ Nenne ein Retro-Spiel.",
    ziel: 1,
    xp: 225,
    typ: "kreativ",
  },
  {
    text:
      "🏖️ Nenne dein Traumurlaubsziel.",
    ziel: 1,
    xp: 250,
    typ: "kreativ",
  },
  {
    text:
      "👻 Erfinde ein gruseliges Wesen.",
    ziel: 1,
    xp: 275,
    typ: "kreativ",
  },
  {
    text:
      "🌟 Erfinde einen Namen für ein Fuchsdorf.",
    ziel: 1,
    xp: 300,
    typ: "kreativ",
  },
];


const questSetDienstag = [
  {
    text:
      "🎮 Nenne ein Spiel, das du jederzeit wieder spielen würdest.",
    ziel: 1,
    xp: 75,
    typ: "kreativ",
  },
  {
    text:
      "🎨 Erfinde eine neue Farbe.",
    ziel: 1,
    xp: 100,
    typ: "kreativ",
  },
  {
    text:
      "🐾 Nenne dein Lieblingstier.",
    ziel: 1,
    xp: 125,
    typ: "kreativ",
  },
  {
    text:
      "🎵 Nenne einen Song aus einem Videospiel.",
    ziel: 1,
    xp: 150,
    typ: "kreativ",
  },
  {
    text:
      "🧙 Erfinde einen Zauberspruch.",
    ziel: 1,
    xp: 175,
    typ: "kreativ",
  },
  {
    text:
      "🎬 Erfinde einen Filmtitel.",
    ziel: 1,
    xp: 200,
    typ: "kreativ",
  },
  {
    text:
      "⚽ Erfinde einen Namen für ein Sportteam.",
    ziel: 1,
    xp: 225,
    typ: "kreativ",
  },
  {
    text:
      "🏠 Erfinde einen Namen für dein Traumhaus.",
    ziel: 1,
    xp: 250,
    typ: "kreativ",
  },
  {
    text:
      "😂 Erfinde einen lustigen Fuchs-Witz.",
    ziel: 1,
    xp: 275,
    typ: "kreativ",
  },
  {
    text:
      "🌌 Erfinde einen Namen für einen fremden Planeten.",
    ziel: 1,
    xp: 300,
    typ: "kreativ",
  },
];


const questSetMittwoch = [
  {
    text:
      "🎮 Nenne ein Spiel mit einem coolen Charakter.",
    ziel: 1,
    xp: 75,
    typ: "kreativ",
  },
  {
    text:
      "🎬 Nenne deinen Lieblingsfilm.",
    ziel: 1,
    xp: 100,
    typ: "kreativ",
  },
  {
    text:
      "🐾 Erfinde ein ungewöhnliches Haustier.",
    ziel: 1,
    xp: 125,
    typ: "kreativ",
  },
  {
    text:
      "🎵 Nenne einen Song, den du laut mitsingen kannst.",
    ziel: 1,
    xp: 150,
    typ: "kreativ",
  },
  {
    text:
      "🦸 Erfinde eine Superkraft.",
    ziel: 1,
    xp: 175,
    typ: "kreativ",
  },
  {
    text:
      "🧙 Erfinde einen Fantasy-Ort.",
    ziel: 1,
    xp: 200,
    typ: "kreativ",
  },
  {
    text:
      "👻 Erfinde ein Geisterwesen.",
    ziel: 1,
    xp: 225,
    typ: "kreativ",
  },
  {
    text:
      "🎨 Erfinde ein Fuchs-Tattoo.",
    ziel: 1,
    xp: 250,
    typ: "kreativ",
  },
  {
    text:
      "🏖️ Nenne deinen perfekten freien Tag.",
    ziel: 1,
    xp: 275,
    typ: "kreativ",
  },
  {
    text:
      "😂 Erfinde einen lustigen Anime-Titel.",
    ziel: 1,
    xp: 300,
    typ: "kreativ",
  },
];


const questSets = [
  questSetTag1,
  questSetMontag,
  questSetDienstag,
  questSetMittwoch,
  questSetFreitag,
  questSetSamstag,
  questSetSonntag,
];


function questSetFuerHeute() {
  const tag =
    new Date().getDay();

  return (
    questSets[tag] ||
    questSetTag1
  );
}


/* =====================================================
   TAGESQUEST STATUS
===================================================== */

function tagesQuestStatus(
  username
) {
  username =
    normalisieren(username);

  const datum =
    datumBerlin();

  const key =
    `${username}:${datum}`;

  if (
    !tagesQuestCache.has(key)
  ) {
    const quests =
      questSetFuerHeute();

    tagesQuestCache.set(
      key,
      quests.map(
        quest => ({
          text:
            quest.text,

          ziel:
            quest.ziel,

          xp:
            quest.xp,

          typ:
            quest.typ,

          fortschritt: 0,

          fertig: false,
        })
      )
    );
  }

  return tagesQuestCache.get(
    key
  );
}


function heutigeQuests() {
  return questSetFuerHeute();
}


/* =====================================================
   QUEST ANZEIGE
===================================================== */

async function questAnzeigen(
  username
) {
  const quests =
    heutigeQuests();

  const status =
    tagesQuestStatus(
      username
    );

  const fertig =
    status.filter(
      q => q.fertig
    ).length;

  const kurz =
    quests
      .map(
        (q, index) =>
          `${index + 1}.${status[index].fertig ? "✅" : "⬜"} ${q.text}`
      )
      .join(" | ");

  return (
    `@${username} 📜 Heute ${fertig}/10 erledigt: ${kurz}`
  );
}


/* =====================================================
   QUESTS PRÜFEN
===================================================== */

async function questNachrichtPruefen(
  username,
  text
) {
  const status =
    tagesQuestStatus(
      username
    );

  let belohnung =
    0;

  let erledigte =
    [];

  for (
    let i = 0;
    i < status.length;
    i++
  ) {
    const quest =
      status[i];

    if (
      quest.fertig
    ) {
      continue;
    }

    if (
      quest.typ ===
      "nachrichten"
    ) {
      quest.fortschritt =
        Math.min(
          quest.ziel,
          quest.fortschritt + 1
        );
    }

    if (
      quest.typ ===
      "kreativ" &&
      String(text || "").trim()
        .length > 0
    ) {
      if (
        String(text)
          .trim()
          .length >= 2
      ) {
        quest.fortschritt =
          Math.min(
            quest.ziel,
            quest.fortschritt + 1
          );
      }
    }

    if (
      quest.fortschritt >=
      quest.ziel
    ) {
      quest.fertig =
        true;

      belohnung +=
        quest.xp;

      erledigte.push(
        quest.text
      );
    }
  }

  if (
    belohnung > 0
  ) {
    await fuchsXPVergeben(
      username,
      belohnung
    );

    await streamelementsSenden(
      `🎉 @${username} Quest abgeschlossen! +${belohnung} XP 🦊`
    );
  }

  const alleFertig =
    status.every(
      q => q.fertig
    );

  if (alleFertig) {
    await streamelementsSenden(
      `🏆 @${username} hat heute alle 10 Fuchs-Quests geschafft! 🌟🦊`
    );
  }

  return erledigte;
}
// ============================================================
// NEUER KOMPLETTCODE – TEIL 2/4
// Fuchswelt: Wirtschaft, Inventar, Fuchsbau, Begleiter,
// Erfolge, Ruf, Chronik und Welt
// ============================================================

// ------------------------------------------------------------
// QUEST-TAGE KORRIGIEREN
// ------------------------------------------------------------
// Sonntag = 0
// Montag  = 1
// Dienstag = 2
// Mittwoch = 3
// Donnerstag = 4
// Freitag = 5
// Samstag = 6

questSetFuerHeute = function () {
  const tag = new Date().getDay();

  if (tag === 0) return questSetSonntag;
  if (tag === 1) return questSetMontag;
  if (tag === 2) return questSetDienstag;
  if (tag === 3) return questSetMittwoch;
  if (tag === 4) return questSetDonnerstag;
  if (tag === 5) return questSetFreitag;
  return questSetSamstag;
};

// Falls einzelne Tageslisten aus Teil 1 noch fehlen,
// werden sie hier ergänzt.

const questSetDonnerstag = [
  {
    id: "do1",
    text: "🎬 Nenne eine Serie, die du jederzeit wieder anschauen würdest.",
    xp: 75
  },
  {
    id: "do2",
    text: "🎮 Nenne ein Videospiel, das du gerne mit Freunden spielen würdest.",
    xp: 100
  },
  {
    id: "do3",
    text: "🦸 Wenn du einen Superheldennamen hättest: Wie würdest du heißen?",
    xp: 125
  },
  {
    id: "do4",
    text: "🎨 Erfinde einen Namen für einen eigenen Charakter.",
    xp: 150
  },
  {
    id: "do5",
    text: "👻 Welches Horrorspiel würdest du dich nachts trotzdem trauen zu spielen?",
    xp: 175
  },
  {
    id: "do6",
    text: "🎵 Nenne einen Song, der sofort gute Laune macht.",
    xp: 200
  },
  {
    id: "do7",
    text: "🚀 Wenn du einen Tag im Weltall verbringen könntest: Was wäre dein erstes Ziel?",
    xp: 225
  },
  {
    id: "do8",
    text: "🐾 Welches Tier wäre dein perfekter Begleiter auf einem Abenteuer?",
    xp: 250
  },
  {
    id: "do9",
    text: "🧙 Erfinde einen Namen für einen mächtigen Fantasy-Zauber.",
    xp: 275
  },
  {
    id: "do10",
    text: "🏠 Wie würde dein perfektes Zuhause in der Fuchswelt aussehen?",
    xp: 300
  }
];

const questSetSonntag = [
  {
    id: "so1",
    text: "🎮 Nenne dein Lieblingsspiel für einen entspannten Abend.",
    xp: 75
  },
  {
    id: "so2",
    text: "🐶 Wenn dein Haustier sprechen könnte: Was würde es zuerst sagen?",
    xp: 100
  },
  {
    id: "so3",
    text: "🎬 Nenne deinen Lieblingsfilm.",
    xp: 125
  },
  {
    id: "so4",
    text: "🎵 Welcher Song gehört für dich zu einem perfekten Abend?",
    xp: 150
  },
  {
    id: "so5",
    text: "⚽ Nenne einen Sport, den du gerne einmal ausprobieren würdest.",
    xp: 175
  },
  {
    id: "so6",
    text: "🦊 Erfinde einen lustigen Namen für einen Fuchs.",
    xp: 200
  },
  {
    id: "so7",
    text: "🏖️ Beschreibe deinen perfekten Urlaub in wenigen Worten.",
    xp: 225
  },
  {
    id: "so8",
    text: "👻 Erfinde einen Namen für ein gruseliges Wesen.",
    xp: 250
  },
  {
    id: "so9",
    text: "🎨 Erfinde einen Namen für eine geheime Fuchswelt.",
    xp: 275
  },
  {
    id: "so10",
    text: "🌟 Was wäre dein größter Wunsch für die Fuchswelt?",
    xp: 300
  }
];


// ------------------------------------------------------------
// ERWEITERTER SPIELER-STATUS
// ------------------------------------------------------------

function spielerStatus(profil) {
  if (!profil) return null;

  if (typeof profil.muenzen !== "number") profil.muenzen = 100;
  if (typeof profil.energie !== "number") profil.energie = 100;

  if (!profil.fuchsname) profil.fuchsname = "";
  if (!profil.bauname) profil.bauname = "Kleiner Bau";

  if (!Array.isArray(profil.inventar)) profil.inventar = [];
  if (!Array.isArray(profil.begleiter)) profil.begleiter = [];
  if (!Array.isArray(profil.erfolge)) profil.erfolge = [];
  if (!Array.isArray(profil.chronik)) profil.chronik = [];
  if (!Array.isArray(profil.entdeckungen)) profil.entdeckungen = [];
  if (!Array.isArray(profil.titelListe)) profil.titelListe = [];

  if (typeof profil.bauStufe !== "number") profil.bauStufe = 1;
  if (typeof profil.ruf !== "number") profil.ruf = 0;

  if (!profil.titel) profil.titel = "Jungfuchs";

  if (!profil.wege) {
    profil.wege = {
      krieger: 0,
      entdecker: 0,
      sammler: 0,
      freunde: 0,
      geheimnis: 0
    };
  }

  if (!profil.kleidung) profil.kleidung = [];
  if (!profil.deko) profil.deko = [];

  return profil;
}


// ------------------------------------------------------------
// FUCHSMÜNZEN
// ------------------------------------------------------------

function muenzenHolen(profil) {
  spielerStatus(profil);
  return profil.muenzen;
}

function muenzenGeben(profil, menge) {
  spielerStatus(profil);

  menge = Number(menge) || 0;
  profil.muenzen += menge;

  if (profil.muenzen < 0) {
    profil.muenzen = 0;
  }

  return profil.muenzen;
}

function muenzenAusgeben(profil, menge) {
  spielerStatus(profil);

  menge = Number(menge) || 0;

  if (menge <= 0) return false;
  if (profil.muenzen < menge) return false;

  profil.muenzen -= menge;
  return true;
}


// ------------------------------------------------------------
// ENERGIE
// ------------------------------------------------------------

function energieHolen(profil) {
  spielerStatus(profil);
  return profil.energie;
}

function energieGeben(profil, menge) {
  spielerStatus(profil);

  menge = Number(menge) || 0;

  profil.energie += menge;

  if (profil.energie > 100) {
    profil.energie = 100;
  }

  return profil.energie;
}

function energieVerbrauchen(profil, menge) {
  spielerStatus(profil);

  menge = Number(menge) || 0;

  if (menge <= 0) return true;
  if (profil.energie < menge) return false;

  profil.energie -= menge;
  return true;
}


// ------------------------------------------------------------
// INVENTAR
// ------------------------------------------------------------

function inventarAnzahl(profil, itemName) {
  spielerStatus(profil);

  const gesucht = normalisieren(itemName);

  return profil.inventar
    .filter(x => normalisieren(x.name) === gesucht)
    .reduce((summe, x) => summe + (Number(x.menge) || 0), 0);
}

function inventarHinzufuegen(profil, itemName, menge = 1) {
  spielerStatus(profil);

  menge = Number(menge) || 1;

  if (menge <= 0) return;

  const vorhanden = profil.inventar.find(
    x => normalisieren(x.name) === normalisieren(itemName)
  );

  if (vorhanden) {
    vorhanden.menge += menge;
  } else {
    profil.inventar.push({
      name: itemName,
      menge
    });
  }
}

function inventarEntfernen(profil, itemName, menge = 1) {
  spielerStatus(profil);

  menge = Number(menge) || 1;

  const index = profil.inventar.findIndex(
    x => normalisieren(x.name) === normalisieren(itemName)
  );

  if (index === -1) return false;

  const eintrag = profil.inventar[index];

  if (eintrag.menge < menge) return false;

  eintrag.menge -= menge;

  if (eintrag.menge <= 0) {
    profil.inventar.splice(index, 1);
  }

  return true;
}

function inventarText(profil) {
  spielerStatus(profil);

  if (profil.inventar.length === 0) {
    return "📦 Dein Inventar ist noch leer.";
  }

  return profil.inventar
    .map(x => `${x.name} x${x.menge}`)
    .join(" | ");
}


// ------------------------------------------------------------
// FUCHSBAU
// ------------------------------------------------------------

const bauStufen = {
  1: {
    name: "🏠 Kleiner Bau",
    slots: 10,
    aktiveBegleiter: 1,
    reserveBegleiter: 0
  },
  2: {
    name: "🏡 Fuchshaus",
    slots: 20,
    aktiveBegleiter: 1,
    reserveBegleiter: 1
  },
  3: {
    name: "🏰 Großer Fuchsbau",
    slots: 30,
    aktiveBegleiter: 2,
    reserveBegleiter: 0
  },
  4: {
    name: "✨ Fuchsanwesen",
    slots: 40,
    aktiveBegleiter: 2,
    reserveBegleiter: 2
  },
  5: {
    name: "👑 Fuchsresidenz",
    slots: 50,
    aktiveBegleiter: 3,
    reserveBegleiter: 0
  }
};

function bauInfo(profil) {
  spielerStatus(profil);

  return bauStufen[profil.bauStufe] || bauStufen[1];
}


// ------------------------------------------------------------
// FUCHSNAME
// ------------------------------------------------------------

function fuchsnameSetzen(profil, name) {
  spielerStatus(profil);

  if (!name) return "❌ Bitte gib einen Namen ein.";

  name = name.trim();

  if (name.length < 2) {
    return "❌ Dein Fuchsname muss mindestens 2 Zeichen haben.";
  }

  if (name.length > 24) {
    return "❌ Dein Fuchsname darf höchstens 24 Zeichen haben.";
  }

  if (!profil.fuchsname) {
    profil.fuchsname = name;
    return `🦊 Dein Fuchs heißt jetzt **${name}**!`;
  }

  if (!muenzenAusgeben(profil, 500)) {
    return "❌ Das Umbenennen kostet 500 Fuchsmünzen.";
  }

  profil.fuchsname = name;

  return `🦊 Dein Fuchs heißt jetzt **${name}**! -500 💰`;
}


// ------------------------------------------------------------
// BAUNAME
// ------------------------------------------------------------

function baunameSetzen(profil, name) {
  spielerStatus(profil);

  if (!name) return "❌ Bitte gib einen Namen für deinen Bau ein.";

  name = name.trim();

  if (name.length < 2) {
    return "❌ Der Bauname muss mindestens 2 Zeichen haben.";
  }

  if (name.length > 30) {
    return "❌ Der Bauname darf höchstens 30 Zeichen haben.";
  }

  if (!profil.bauname || profil.bauname === "Kleiner Bau") {
    profil.bauname = name;
    return `🏠 Dein Bau heißt jetzt **${name}**!`;
  }

  if (!muenzenAusgeben(profil, 500)) {
    return "❌ Das Umbenennen kostet 500 Fuchsmünzen.";
  }

  profil.bauname = name;

  return `🏠 Dein Bau heißt jetzt **${name}**! -500 💰`;
}


// ------------------------------------------------------------
// ERFOLGE
// ------------------------------------------------------------

const fuchsErfolge = {
  jungfuchs: {
    name: "🦊 Jungfuchs gestartet",
    beschreibung: "Du hast die Fuchswelt betreten.",
    xp: 25,
    muenzen: 25
  },

  erstequest: {
    name: "📜 Erste Quest",
    beschreibung: "Du hast deine erste Quest abgeschlossen.",
    xp: 50,
    muenzen: 25
  },

  ersteskampf: {
    name: "⚔️ Erstes Duell",
    beschreibung: "Du hast deinen ersten Kampf gewonnen.",
    xp: 100,
    muenzen: 50
  },

  erstesabenteuer: {
    name: "🗺️ Erstes Abenteuer",
    beschreibung: "Du hast dein erstes Abenteuer abgeschlossen.",
    xp: 100,
    muenzen: 50
  },

  ersteszuhause: {
    name: "🏠 Mein erstes Zuhause",
    beschreibung: "Du hast deinen eigenen Fuchsbau eingerichtet.",
    xp: 100,
    muenzen: 50
  },

  einrichtungskuenstler: {
    name: "🎨 Einrichtungskünstler",
    beschreibung: "Du hast mehrere Dekorationen gesammelt.",
    xp: 200,
    muenzen: 100
  },

  ersterbegleiter: {
    name: "🐾 Erster Gefährte",
    beschreibung: "Du hast deinen ersten Begleiter erhalten.",
    xp: 100,
    muenzen: 50
  },

  treuerfreund: {
    name: "❤️ Treuer Freund",
    beschreibung: "Deine Freundschaft mit einem Begleiter ist gewachsen.",
    xp: 150,
    muenzen: 75
  },

  begleitersammler: {
    name: "🐾 Begleiter-Sammler",
    beschreibung: "Du hast mehrere Begleiter gesammelt.",
    xp: 250,
    muenzen: 125
  },

  muenzsammler: {
    name: "💰 Münzsammler",
    beschreibung: "Du hast insgesamt 1.000 Fuchsmünzen verdient.",
    xp: 150,
    muenzen: 100
  },

  grosserSchatz: {
    name: "💎 Großer Schatz",
    beschreibung: "Du hast insgesamt 5.000 Fuchsmünzen verdient.",
    xp: 300,
    muenzen: 200
  },

  fuchsvermoegen: {
    name: "👑 Fuchsvermögen",
    beschreibung: "Du hast insgesamt 10.000 Fuchsmünzen verdient.",
    xp: 500,
    muenzen: 500
  },

  spurensucher: {
    name: "🔎 Spurensucher",
    beschreibung: "Du hast eine geheime Spur entdeckt.",
    xp: 200,
    muenzen: 100
  },

  chronist: {
    name: "📚 Chronist",
    beschreibung: "Du hast einen besonderen Moment in deiner Chronik festgehalten.",
    xp: 150,
    muenzen: 75
  },

  teamfuchs: {
    name: "🤝 Teamfuchs",
    beschreibung: "Du hast bei einer Team-Aktion mitgemacht.",
    xp: 150,
    muenzen: 75
  },

  fuchsfreund: {
    name: "❤️ Fuchsfreund",
    beschreibung: "Du hast einem anderen Fuchs geholfen.",
    xp: 100,
    muenzen: 50
  }
};

function erfolgHat(profil, id) {
  spielerStatus(profil);
  return profil.erfolge.includes(id);
}

async function erfolgFreischalten(profil, id) {
  spielerStatus(profil);

  const erfolg = fuchsErfolge[id];

  if (!erfolg) return null;
  if (erfolgHat(profil, id)) return null;

  profil.erfolge.push(id);

  profil.xp += erfolg.xp;
  profil.muenzen += erfolg.muenzen;

  if (!profil.titelListe.includes(erfolg.name)) {
    profil.titelListe.push(erfolg.name);
  }

  profil.chronik.push({
    datum: new Date().toISOString(),
    typ: "erfolg",
    text: erfolg.name
  });

  return `🏆 ${erfolg.name} freigeschaltet! +${erfolg.xp} XP +${erfolg.muenzen} 💰`;
}


// ------------------------------------------------------------
// RUF
// ------------------------------------------------------------

function rufGeben(profil, menge) {
  spielerStatus(profil);

  profil.ruf += Number(menge) || 0;

  if (profil.ruf < 0) {
    profil.ruf = 0;
  }

  return profil.ruf;
}


// ------------------------------------------------------------
// CHRONIK
// ------------------------------------------------------------

function chronikEintrag(profil, text, typ = "normal") {
  spielerStatus(profil);

  profil.chronik.push({
    datum: new Date().toISOString(),
    typ,
    text
  });

  // Chronik soll nicht unbegrenzt wachsen
  if (profil.chronik.length > 200) {
    profil.chronik = profil.chronik.slice(-200);
  }
}

function chronikText(profil) {
  spielerStatus(profil);

  if (profil.chronik.length === 0) {
    return "📚 Deine Fuchs-Chronik ist noch leer.";
  }

  const letzte = profil.chronik.slice(-5).reverse();

  return letzte
    .map(x => `• ${x.text}`)
    .join(" | ");
}


// ------------------------------------------------------------
// ENTDECKUNGEN
// ------------------------------------------------------------

function entdeckungHinzufuegen(profil, text) {
  spielerStatus(profil);

  if (!profil.entdeckungen.includes(text)) {
    profil.entdeckungen.push(text);

    chronikEintrag(
      profil,
      `🗺️ Entdeckung: ${text}`,
      "entdeckung"
    );

    return true;
  }

  return false;
}


// ------------------------------------------------------------
// BEGLEITER
// ------------------------------------------------------------

const begleiterNamen = [
  "Funkel",
  "Momo",
  "Keks",
  "Lumi",
  "Flocke",
  "Schatzi",
  "Nox",
  "Flämmchen",
  "Wasserpfote",
  "Blattfeder"
];

const begleiterSeltenheiten = [
  "Gewöhnlich",
  "Ungewöhnlich",
  "Selten",
  "Episch",
  "Legendär",
  "Mythisch"
];

const begleiterPersoenlichkeiten = [
  "Frech",
  "Faul",
  "Mutig",
  "Neugierig",
  "Treu",
  "Geheimnisvoll"
];

function zufallsBegleiter() {
  const name = begleiterNamen[zufall(begleiterNamen.length)];

  const seltenheit =
    begleiterSeltenheiten[
      Math.min(5, zufall(100) < 3 ? 5 :
      zufall(100) < 10 ? 4 :
      zufall(100) < 25 ? 3 :
      zufall(100) < 45 ? 2 :
      zufall(100) < 70 ? 1 : 0)
    ];

  const persoenlichkeit =
    begleiterPersoenlichkeiten[
      zufall(begleiterPersoenlichkeiten.length)
    ];

  return {
    id: `${Date.now()}_${zufall(99999)}`,
    name,
    seltenheit,
    persoenlichkeit,
    stufe: 1,
    erfahrung: 0,
    freundschaft: 0,
    aktiv: false
  };
}

function aktiveBegleiter(profil) {
  spielerStatus(profil);

  return profil.begleiter.filter(x => x.aktiv);
}

function begleiterText(profil) {
  spielerStatus(profil);

  if (profil.begleiter.length === 0) {
    return "🐾 Du hast noch keinen Begleiter.";
  }

  return profil.begleiter
    .map(x =>
      `${x.name} (${x.seltenheit}) – ${x.persoenlichkeit} – Stufe ${x.stufe}`
    )
    .join(" | ");
}


// ------------------------------------------------------------
// WELT / DORF
// ------------------------------------------------------------

const fuchsdorfOrte = [
  "🏠 Fuchsbau",
  "🏪 Fuchs-Markt",
  "🎯 Abenteuer-Tafel",
  "⚔️ Kampfplatz",
  "🐾 Begleiter-Haus",
  "🗺️ Weltkarte",
  "🌟 Dorfplatz",
  "🔐 Geheimarchiv",
  "🌙 Tor der fünf Kräfte"
];

const fuchsweltGebiete = {
  feuer: "🌋 Feuertal",
  wasser: "🌊 Wasserlande",
  wald: "🌲 Fuchswald",
  ice: "❄️ Eisberge"
};

const fuchsweltWesen = [
  "🌑 Schattenfuchs",
  "🔥 Flammenwolf",
  "❄️ Eisdrache",
  "🌊 Wassergeist",
  "🌲 Waldhüter"
];


// ------------------------------------------------------------
// WETTER / TAGESZEIT
// ------------------------------------------------------------

function tageszeit() {
  const stunde = new Date().getHours();

  if (stunde >= 5 && stunde < 10) return "🌅 Morgen";
  if (stunde >= 10 && stunde < 18) return "☀️ Tag";
  if (stunde >= 18 && stunde < 22) return "🌇 Abend";

  return "🌙 Nacht";
}

const wetterListe = [
  "☀️ Sonnig",
  "☁️ Bewölkt",
  "🌧️ Regen",
  "⛈️ Gewitter",
  "🌫️ Nebel",
  "❄️ Schnee",
  "🌪️ Sturm",
  "✨ Magisches Wetter"
];


// ------------------------------------------------------------
// TITEL
// ------------------------------------------------------------

function titelSetzen(profil, titel) {
  spielerStatus(profil);

  if (!profil.titelListe.includes(titel)) {
    return false;
  }

  profil.titel = titel;
  return true;
}


// ------------------------------------------------------------
// PROFILTEXT ERWEITERN
// ------------------------------------------------------------

function erweitertesProfilText(profil, username) {
  spielerStatus(profil);

  const bau = bauInfo(profil);

  const fuchsname =
    profil.fuchsname ||
    username ||
    "Unbenannter Fuchs";

  const rudel =
    profil.rudel ||
    "Noch kein Rudel";

  const begleiter =
    profil.begleiter.length;

  return [
    `🦊 ${fuchsname}`,
    `🏷️ Titel: ${profil.titel}`,
    `🐾 ${rudel}`,
    `⭐ Level ${profil.level || 1}`,
    `✨ ${profil.xp || 0} XP`,
    `💰 ${profil.muenzen} Fuchsmünzen`,
    `⚡ ${profil.energie}/100 Energie`,
    `📣 Ruf: ${profil.ruf}`,
    `🏠 ${profil.bauname}`,
    `🏡 Bau: ${bau.name}`,
    `🐾 Begleiter: ${begleiter}`,
    `🏆 Erfolge: ${profil.erfolge.length}`,
    `🗺️ Entdeckungen: ${profil.entdeckungen.length}`
  ].join(" | ");
}


// ------------------------------------------------------------
// FUCHSDORF
// ------------------------------------------------------------

function dorfText() {
  return (
    `🏡 FUCHSDORF: ` +
    fuchsdorfOrte.join(" • ")
  );
}


// ------------------------------------------------------------
// R U D E L - INFORMATION
// ------------------------------------------------------------

function rudelText() {
  return Object.entries(fuchsweltGebiete)
    .map(([key, name]) => {
      const rudel = rudelMap[key] || key;
      return `${rudel} → ${name}`;
    })
    .join(" | ");
}


// ------------------------------------------------------------
// WELTKARTE
// ------------------------------------------------------------

function karteText() {
  return (
    `🗺️ FUCHSWELT: ` +
    `🏡 Fuchsdorf | ` +
    `🔥 Feuertal | ` +
    `🌊 Wasserlande | ` +
    `🌲 Fuchswald | ` +
    `🧊 Eisberge | ` +
    `🌙 Tor der fünf Kräfte`
  );
}


// ------------------------------------------------------------
// WESEN
// ------------------------------------------------------------

function wesenText() {
  return (
    `🐾 Wesen der Fuchswelt: ` +
    fuchsweltWesen.join(" | ")
  );
}


// ------------------------------------------------------------
// ENTDECKUNGEN ANZEIGEN
// ------------------------------------------------------------

function entdeckungenText(profil) {
  spielerStatus(profil);

  if (profil.entdeckungen.length === 0) {
    return "🗺️ Noch keine Entdeckungen. Deine Reise beginnt erst!";
  }

  return (
    `🗺️ Deine Entdeckungen: ` +
    profil.entdeckungen.slice(-10).join(" | ")
  );
}


// ------------------------------------------------------------
// GEHEIMNIS
// ------------------------------------------------------------

function geheimnisText(profil) {
  spielerStatus(profil);

  if (profil.entdeckungen.includes("Unterwasser-Tür")) {
    return "🔐 Unter Wasser wurde eine verschlossene Tür entdeckt. Dahinter scheint etwas auf euch zu warten...";
  }

  if (profil.entdeckungen.includes("Wasserperle")) {
    return "🌊 Die Wasserperle erlaubt es dir, unter Wasser zu atmen. Vielleicht findest du damit einen weiteren Weg.";
  }

  return "🔐 Das Geheimarchiv schweigt noch. Manche Geheimnisse zeigen sich erst, wenn die Zeit gekommen ist.";
}


// ------------------------------------------------------------
// EXPORT / STATUSMARKER
// ------------------------------------------------------------

console.log("🦊 Fuchswelt Teil 2 geladen.");
// ============================================================
// NEUER KOMPLETTCODE – TEIL 3/4
// Fuchswelt: Markt, Käufe, Bank, Abenteuer, Kampf
// ============================================================

// ------------------------------------------------------------
// FUCHS-MARKT
// ------------------------------------------------------------

const fuchsMarkt = [
  // 🏠 Fuchsbau
  { name: "Kuschelbett", preis: 150, kategorie: "bau" },
  { name: "Fuchslaterne", preis: 100, kategorie: "bau" },
  { name: "Kleine Zimmerpflanze", preis: 75, kategorie: "bau" },
  { name: "Fuchsbild", preis: 125, kategorie: "bau" },
  { name: "Schöne Vorratskiste", preis: 200, kategorie: "bau" },
  { name: "Holzregal", preis: 175, kategorie: "bau" },
  { name: "Fuchs-Kuscheltier", preis: 250, kategorie: "bau" },
  { name: "Leuchtkristall", preis: 400, kategorie: "bau" },
  { name: "Trophäenständer", preis: 350, kategorie: "bau" },
  { name: "Geheimnisvolle Wanddeko", preis: 500, kategorie: "bau" },

  // 🐾 Begleiter
  { name: "Begleiter-Spielzeug", preis: 100, kategorie: "begleiter" },
  { name: "Lieblings-Leckerli", preis: 75, kategorie: "begleiter" },
  { name: "Kuscheldecke", preis: 125, kategorie: "begleiter" },
  { name: "Begleiter-Schleife", preis: 150, kategorie: "begleiter" },
  { name: "Kleines Begleiter-Bett", preis: 200, kategorie: "begleiter" },
  { name: "Glücksanhänger", preis: 250, kategorie: "begleiter" },
  { name: "Leuchtendes Halsband", preis: 350, kategorie: "begleiter" },
  { name: "Begleiter-Kristall", preis: 400, kategorie: "begleiter" },
  { name: "Seltenes Begleiter-Spielzeug", preis: 500, kategorie: "begleiter" },
  { name: "Legendäres Begleiter-Zubehör", preis: 750, kategorie: "begleiter" },

  // 🗺️ Abenteuer
  { name: "Energie-Trank", preis: 100, kategorie: "abenteuer" },
  { name: "Kleiner Heiltrank", preis: 125, kategorie: "abenteuer" },
  { name: "Alte Schatzkarte", preis: 200, kategorie: "abenteuer" },
  { name: "Fuchslaterne", preis: 150, kategorie: "abenteuer" },
  { name: "Altes Fuchs-Kompass", preis: 250, kategorie: "abenteuer" },
  { name: "Spurensucher-Lupe", preis: 200, kategorie: "abenteuer" },
  { name: "Abenteuer-Rucksack", preis: 300, kategorie: "abenteuer" },
  { name: "Glückblatt", preis: 350, kategorie: "abenteuer" },
  { name: "Mysteriöser Schlüssel", preis: 500, kategorie: "abenteuer" },
  { name: "Uraltes Fuchs-Artefakt", preis: 750, kategorie: "abenteuer" },

  // 📦 Boxen
  { name: "Kleine Fuchsbox", preis: 150, kategorie: "box" },
  { name: "Große Fuchsbox", preis: 300, kategorie: "box" },
  { name: "Glücksbox", preis: 500, kategorie: "box" },
  { name: "Geheimnisbox", preis: 750, kategorie: "box" },
  { name: "Urfuchs-Truhe", preis: 1000, kategorie: "box" },

  // 🎨 Anpassung
  { name: "Fuchsmütze", preis: 150, kategorie: "anpassung" },
  { name: "Fuchsschleife", preis: 150, kategorie: "anpassung" },
  { name: "Coole Fuchsbrille", preis: 200, kategorie: "anpassung" },
  { name: "Fuchsschal", preis: 250, kategorie: "anpassung" },
  { name: "Fuchskrone", preis: 500, kategorie: "anpassung" },
  { name: "Leuchteffekt", preis: 400, kategorie: "anpassung" },
  { name: "Feuer-Aura", preis: 600, kategorie: "anpassung" },
  { name: "Eis-Aura", preis: 600, kategorie: "anpassung" },
  { name: "Wald-Aura", preis: 600, kategorie: "anpassung" },
  { name: "Wasser-Aura", preis: 600, kategorie: "anpassung" },

  // 🌟 Seltene Gegenstände
  { name: "Urfuchs-Splitter", preis: 1500, kategorie: "selten" },
  { name: "Kristall der fünf Kräfte", preis: 2000, kategorie: "selten" },
  { name: "Schattenfuchs-Amulett", preis: 1750, kategorie: "selten" },
  { name: "Flammenherz-Siegel", preis: 1500, kategorie: "selten" },
  { name: "Tiefenquell-Siegel", preis: 1500, kategorie: "selten" },
  { name: "Lebenskern-Siegel", preis: 1500, kategorie: "selten" },
  { name: "Eiskristall-Siegel", preis: 1500, kategorie: "selten" },
  { name: "Schlüssel des Geheimarchivs", preis: 2500, kategorie: "selten" },
  { name: "Urfuchs-Krone", preis: 5000, kategorie: "selten" }
];

function marktArtikelFinden(name) {
  if (!name) return null;

  const gesucht = normalisieren(name);

  return fuchsMarkt.find(
    artikel => normalisieren(artikel.name) === gesucht
  ) || null;
}

function marktText() {
  return fuchsMarkt
    .map(
      artikel =>
        `${artikel.name} – ${artikel.preis} 💰`
    )
    .join(" | ");
}


// ------------------------------------------------------------
// MARKT-KAUF
// ------------------------------------------------------------

function artikelKaufen(profil, artikelName) {
  spielerStatus(profil);

  const artikel = marktArtikelFinden(artikelName);

  if (!artikel) {
    return {
      ok: false,
      text: "❌ Diesen Gegenstand gibt es aktuell nicht im Fuchs-Markt."
    };
  }

  if (!muenzenAusgeben(profil, artikel.preis)) {
    return {
      ok: false,
      text:
        `❌ Du brauchst ${artikel.preis} 💰 für ${artikel.name}.`
    };
  }

  inventarHinzufuegen(profil, artikel.name, 1);

  chronikEintrag(
    profil,
    `🛍️ ${artikel.name} für ${artikel.preis} 💰 gekauft.`,
    "markt"
  );

  return {
    ok: true,
    text:
      `🛍️ ${artikel.name} gekauft! ` +
      `-${artikel.preis} 💰`
  };
}


// ------------------------------------------------------------
// BOXEN
// ------------------------------------------------------------

const boxBelohnungen = [
  "Energie-Trank",
  "Kleiner Heiltrank",
  "Begleiter-Spielzeug",
  "Lieblings-Leckerli",
  "Fuchslaterne",
  "Kleine Zimmerpflanze",
  "Fuchsbild",
  "Fuchsmütze"
];

function boxOeffnen(profil, boxName) {
  spielerStatus(profil);

  if (!inventarEntfernen(profil, boxName, 1)) {
    return "❌ Du besitzt diese Box nicht.";
  }

  const zahl = zufall(100);

  if (boxName === "Urfuchs-Truhe" && zahl < 10) {
    inventarHinzufuegen(
      profil,
      "Urfuchs-Splitter",
      1
    );

    return "🌟 Die Urfuchs-Truhe enthält einen **Urfuchs-Splitter**!";
  }

  if (boxName === "Geheimnisbox" && zahl < 10) {
    inventarHinzufuegen(
      profil,
      "Schlüssel des Geheimarchivs",
      1
    );

    return "🔐 Die Geheimnisbox enthält einen **Schlüssel des Geheimarchivs**!";
  }

  const belohnung =
    boxBelohnungen[
      zufall(boxBelohnungen.length)
    ];

  inventarHinzufuegen(profil, belohnung, 1);

  return `📦 Die Box wurde geöffnet! Du erhältst: ${belohnung}`;
}


// ------------------------------------------------------------
// BANK
// ------------------------------------------------------------

function bankInitialisieren(profil) {
  spielerStatus(profil);

  if (typeof profil.bank !== "number") {
    profil.bank = 0;
  }

  if (!profil.bankLetzterZins) {
    profil.bankLetzterZins = "";
  }
}

function bankText(profil) {
  bankInitialisieren(profil);

  return (
    `🏦 Fuchs-Bank: ${profil.bank} 💰 ` +
    `| Im Geldbeutel: ${profil.muenzen} 💰`
  );
}

function bankEinzahlen(profil, menge) {
  bankInitialisieren(profil);

  menge = Number(menge);

  if (!Number.isFinite(menge) || menge <= 0) {
    return "❌ Ungültige Menge.";
  }

  menge = Math.floor(menge);

  if (!muenzenAusgeben(profil, menge)) {
    return "❌ Du hast nicht genug Fuchsmünzen.";
  }

  profil.bank += menge;

  chronikEintrag(
    profil,
    `🏦 ${menge} 💰 auf die Fuchs-Bank eingezahlt.`,
    "bank"
  );

  return `🏦 ${menge} 💰 eingezahlt. Bankguthaben: ${profil.bank} 💰`;
}

function bankAuszahlen(profil, menge) {
  bankInitialisieren(profil);

  menge = Number(menge);

  if (!Number.isFinite(menge) || menge <= 0) {
    return "❌ Ungültige Menge.";
  }

  menge = Math.floor(menge);

  if (profil.bank < menge) {
    return "❌ Auf deiner Bank liegt nicht genug Geld.";
  }

  profil.bank -= menge;
  profil.muenzen += menge;

  return `🏦 ${menge} 💰 ausgezahlt.`;
}


// ------------------------------------------------------------
// TAGESBONUS
// ------------------------------------------------------------

function tagesBonus(profil) {
  spielerStatus(profil);

  const heute = datumBerlin();

  if (profil.letzterBonus === heute) {
    return "🎁 Deinen Tagesbonus hast du heute bereits abgeholt.";
  }

  profil.letzterBonus = heute;

  const muenzen = 50 + zufall(101);

  profil.muenzen += muenzen;

  let extra = "";

  if (zufall(100) < 25) {
    energieGeben(profil, 25);
    extra = " +25 ⚡ Energie";
  }

  chronikEintrag(
    profil,
    `🎁 Tagesbonus: +${muenzen} 💰`,
    "bonus"
  );

  return (
    `🎁 Tagesbonus erhalten: +${muenzen} 💰${extra}!`
  );
}


// ------------------------------------------------------------
// ABENTEUER
// ------------------------------------------------------------

const abenteuerOrte = [
  "🌲 Fuchswald",
  "🌊 Wasserlande",
  "🌋 Feuertal",
  "❄️ Eisberge",
  "🏡 Fuchsdorf"
];

const abenteuerFunde = [
  "eine alte Fuchsmünze",
  "eine geheimnisvolle Spur",
  "einen glänzenden Kristall",
  "eine alte Karte",
  "eine seltsame Feder",
  "einen kleinen Schatz",
  "ein unbekanntes Symbol",
  "eine leuchtende Pflanze"
];

function abenteuerStarten(profil) {
  spielerStatus(profil);

  const username = profil.spieler || "Fuchs";

  if (!profil.abenteuerLetzterTag) {
    profil.abenteuerLetzterTag = "";
  }

  const jetzt = Date.now();

  if (
    profil.abenteuerLetzterStart &&
    jetzt - profil.abenteuerLetzterStart < 60000
  ) {
    return "🗺️ Dein letztes Abenteuer ist noch nicht lange her.";
  }

  if (!energieVerbrauchen(profil, 20)) {
    return "⚡ Du hast nicht genug Energie. Du brauchst 20 Energie.";
  }

  profil.abenteuerLetzterStart = jetzt;

  const ort =
    abenteuerOrte[
      zufall(abenteuerOrte.length)
    ];

  const fund =
    abenteuerFunde[
      zufall(abenteuerFunde.length)
    ];

  const xp = 50 + zufall(101);
  const coins = 25 + zufall(76);

  profil.xp += xp;
  profil.muenzen += coins;

  let extra = "";

  if (zufall(100) < 20) {
    const item = "Alte Schatzkarte";

    inventarHinzufuegen(profil, item, 1);
    extra = ` | 🗺️ Fund: ${item}`;
  }

  if (zufall(100) < 10) {
    const neu = entdeckungHinzufuegen(
      profil,
      fund
    );

    if (neu) {
      extra += ` | 🔎 Neue Entdeckung: ${fund}`;
    }
  }

  chronikEintrag(
    profil,
    `${username} war auf einem Abenteuer in ${ort}.`,
    "abenteuer"
  );

  return (
    `🗺️ Abenteuer abgeschlossen in ${ort}! ` +
    `Du hast ${fund} gefunden. ` +
    `+${xp} XP +${coins} 💰 -20 ⚡${extra}`
  );
}


// ------------------------------------------------------------
// KAMPF
// ------------------------------------------------------------

const kampfRangListe = [
  { min: 0, name: "Kampfneuling" },
  { min: 5, name: "Kampfgefährte" },
  { min: 15, name: "Duellant" },
  { min: 30, name: "Elitekämpfer" },
  { min: 50, name: "Kampflegende" }
];

function kampfRang(profil) {
  const siege = Number(profil.pvp_siege) || 0;

  let rang = kampfRangListe[0].name;

  for (const eintrag of kampfRangListe) {
    if (siege >= eintrag.min) {
      rang = eintrag.name;
    }
  }

  return rang;
}

function kampfGewinnen(profil) {
  spielerStatus(profil);

  profil.pvp_siege =
    (Number(profil.pvp_siege) || 0) + 1;

  const xp = 100;
  const coins = 50;

  profil.xp += xp;
  profil.muenzen += coins;

  rufGeben(profil, 10);

  chronikEintrag(
    profil,
    `⚔️ Kampf gewonnen! +${xp} XP +${coins} 💰`,
    "kampf"
  );

  return {
    xp,
    coins,
    rang: kampfRang(profil)
  };
}

function kampfVerlieren(profil) {
  spielerStatus(profil);

  profil.pvp_niederlagen =
    (Number(profil.pvp_niederlagen) || 0) + 1;

  chronikEintrag(
    profil,
    "⚔️ Kampf verloren.",
    "kampf"
  );
}


// ------------------------------------------------------------
// POKÉMON-KAMPF
// ------------------------------------------------------------

function pokemonFuerSpieler(username) {
  const key = normalisieren(username);

  return eigenePokemon[key] || null;
}

function pokemonKampfText(username1, username2) {
  const pokemon1 =
    pokemonFuerSpieler(username1);

  const pokemon2 =
    pokemonFuerSpieler(username2);

  if (!pokemon1 || !pokemon2) {
    return null;
  }

  return {
    pokemon1,
    pokemon2
  };
}


// ------------------------------------------------------------
// OFFENE KÄMPFE
// ------------------------------------------------------------

function kampfSchluessel(a, b) {
  return [
    normalisieren(a),
    normalisieren(b)
  ].sort().join(":");
}

function kampfAnlegen(herausforderer, ziel) {
  const schluessel =
    kampfSchluessel(
      herausforderer,
      ziel
    );

  offeneKaempfe.set(
    schluessel,
    {
      herausforderer,
      ziel,
      erstellt: Date.now()
    }
  );

  return schluessel;
}

function kampfFinden(a, b) {
  const schluessel =
    kampfSchluessel(a, b);

  return offeneKaempfe.get(schluessel);
}

function kampfLoeschen(a, b) {
  const schluessel =
    kampfSchluessel(a, b);

  offeneKaempfe.delete(schluessel);
}


// ------------------------------------------------------------
// KAMPFZUFALL
// ------------------------------------------------------------

function kampfEntscheiden(profil1, profil2) {
  spielerStatus(profil1);
  spielerStatus(profil2);

  const kraft1 =
    50 + zufall(51) +
    (profil1.pvp_siege || 0);

  const kraft2 =
    50 + zufall(51) +
    (profil2.pvp_siege || 0);

  return kraft1 >= kraft2 ? profil1 : profil2;
}


// ------------------------------------------------------------
// AUTOMATISCHE PVP-ANNAHME FÜR FUCHSMISS
// ------------------------------------------------------------

function istFuchsMiss(username) {
  return normalisieren(username) ===
    normalisieren("fuchsmissVegetalover2_0");
}


// ------------------------------------------------------------
// STORY
// ------------------------------------------------------------

const storyTexte = {
  urfuchs:
    "🌟 Der Urfuchs verschwand, weil er wusste, dass eine neue Generation kommen würde.",

  fuenftesFragment:
    "🌙 Wenn die vier Kräfte erwachen, wird das fünfte Fragment seinen Fuchs finden.",

  statue1:
    "🗿 Ihr seid gekommen … so, wie der Urfuchs es vorausgesehen hat.",

  statue2:
    "🗿 Der Urfuchs verschwand nicht, weil er euch verlassen wollte. Er ging, weil etwas erwachte, das selbst die fünf Kräfte fürchteten.",

  waldhueter:
    "🌲 Es ist noch nicht zu spät … aber ihr müsst ihn finden.",

  wassergeist:
    "🌊 Der Waldhüter war hier. Doch er suchte nicht nach mir … er suchte nach etwas, das unter uns schläft.",

  unterwasser:
    "🌊 Eine verschlossene Tür liegt unter dem Wasser. Niemand weiß, was sich dahinter befindet."
};

function fuchsstaturText(profil) {
  spielerStatus(profil);

  const anzahl =
    profil.storyStatuen || 0;

  if (anzahl <= 0) {
    profil.storyStatuen = 1;

    return storyTexte.statue1;
  }

  if (anzahl === 1) {
    profil.storyStatuen = 2;

    return storyTexte.statue2;
  }

  return (
    "🗿 Die Fuchsstatue schweigt. " +
    "Doch tief in ihrem Inneren scheint etwas zu leuchten..."
  );
}


// ------------------------------------------------------------
// STORY-ENTDECKUNGEN
// ------------------------------------------------------------

function wasserUnterwasserEntdeckung(profil) {
  spielerStatus(profil);

  inventarHinzufuegen(
    profil,
    "Wasserperle",
    1
  );

  entdeckungHinzufuegen(
    profil,
    "Wasserperle"
  );

  entdeckungHinzufuegen(
    profil,
    "Unterwasser-Tür"
  );

  return (
    "🌊 Du findest eine leuchtende Wasserperle. " +
    "Sie lässt dich unter Wasser atmen. " +
    "Dort entdeckst du eine alte Ruine und eine **verschlossene Tür 🚪**."
  );
}


// ------------------------------------------------------------
// TEIL 3 ENDE
// ------------------------------------------------------------

console.log("🦊 Fuchswelt Teil 3 geladen.");
// ============================================================
// NEUER KOMPLETTCODE – TEIL 4/4
// Twitch / StreamElements / Befehle / PvP / Overlay / Server
// ============================================================


// ------------------------------------------------------------
// PROFIL SPEICHERN – ERWEITERTE DATEN
// ------------------------------------------------------------

async function erweitertesProfilSpeichern(profil) {
  if (!profil || !profil.spieler) return;

  spielerStatus(profil);
  bankInitialisieren(profil);

  // Die vorhandenen Datenbankfelder werden weiterhin benutzt.
  // Zusätzliche Spielwerte bleiben während der laufenden Bot-
  // Session im Profil erhalten.
  await fuchsProfilSpeichern(profil);
}


// ------------------------------------------------------------
// PROFIL LADEN
// ------------------------------------------------------------

async function profilFuerUser(username) {
  const profil = await fuchsProfilLaden(username);

  if (!profil) {
    return null;
  }

  spielerStatus(profil);
  bankInitialisieren(profil);

  return profil;
}


// ------------------------------------------------------------
// XP / LEVEL
// ------------------------------------------------------------

async function xpGeben(profil, menge) {
  if (!profil) return;

  menge = Number(menge) || 0;

  profil.xp =
    (Number(profil.xp) || 0) + menge;

  const altesLevel =
    Number(profil.level) || 1;

  let neuesLevel = altesLevel;

  for (let i = levelSchwellen.length - 1; i >= 0; i--) {
    if (profil.xp >= levelSchwellen[i]) {
      neuesLevel = i + 1;
      break;
    }
  }

  profil.level = neuesLevel;

  if (neuesLevel > altesLevel) {
    profil.titel =
      levelTitel[neuesLevel] ||
      profil.titel ||
      "Jungfuchs";

    await erweitertesProfilSpeichern(profil);

    return (
      `🎉 ${profil.fuchsname || profil.spieler} ` +
      `erreicht Level ${neuesLevel}! 🦊`
    );
  }

  await erweitertesProfilSpeichern(profil);

  return null;
}


// ------------------------------------------------------------
// BENUTZERNAME AUS CHAT
// ------------------------------------------------------------

function usernameAusNachricht(data) {
  if (!data) return "";

  return (
    data.username ||
    data.user?.username ||
    data.user?.displayName ||
    data.sender?.username ||
    data.sender?.displayName ||
    ""
  );
}


// ------------------------------------------------------------
// CHAT-TEXT AUS STREAM-ELEMENTS
// ------------------------------------------------------------

function chatTextAusNachricht(data) {
  if (!data) return "";

  if (typeof data.message === "string") {
    return data.message;
  }

  if (typeof data.text === "string") {
    return data.text;
  }

  if (typeof data.content === "string") {
    return data.content;
  }

  return "";
}


// ------------------------------------------------------------
// MENTION AUS COMMAND
// ------------------------------------------------------------

function zielAusArgument(args) {
  if (!args || !args.length) return "";

  return String(args[0])
    .replace(/^@/, "")
    .trim();
}


// ------------------------------------------------------------
// PROFIL ANZEIGEN
// ------------------------------------------------------------

async function commandProfil(username, args) {
  const ziel =
    zielAusArgument(args) ||
    username;

  const profil =
    await profilFuerUser(ziel);

  if (!profil) {
    return `❌ Profil von ${ziel} konnte nicht geladen werden.`;
  }

  const name =
    profil.fuchsname ||
    profil.spieler ||
    ziel;

  const rudel =
    profil.rudel ||
    "Kein Rudel";

  const bau =
    bauInfo(profil);

  return (
    `🦊 ${name} | ` +
    `🏷️ ${profil.titel || "Jungfuchs"} | ` +
    `${rudel} | ` +
    `⭐ Level ${profil.level || 1} | ` +
    `✨ ${profil.xp || 0} XP | ` +
    `💰 ${profil.muenzen || 100} 💰 | ` +
    `⚡ ${profil.energie || 100}/100 | ` +
    `📣 Ruf ${profil.ruf || 0} | ` +
    `🏠 ${bau.name}`
  );
}


// ------------------------------------------------------------
// QUEST COMMAND
// ------------------------------------------------------------

async function commandQuest(username) {
  const profil =
    await profilFuerUser(username);

  if (!profil) {
    return "❌ Dein Profil konnte nicht geladen werden.";
  }

  const quests =
    heutigeQuests(profil);

  return questAnzeigen(profil, quests);
}


// ------------------------------------------------------------
// INVENTAR COMMAND
// ------------------------------------------------------------

async function commandInventar(username) {
  const profil =
    await profilFuerUser(username);

  if (!profil) {
    return "❌ Dein Profil konnte nicht geladen werden.";
  }

  return (
    `📦 Inventar von ${profil.fuchsname || username}: ` +
    inventarText(profil)
  );
}


// ------------------------------------------------------------
// MARKT COMMAND
// ------------------------------------------------------------

function commandMarkt() {
  return (
    `🏪 FUCHS-MARKT: ` +
    `Kuschelbett 150 💰 | ` +
    `Fuchslaterne 100 💰 | ` +
    `Fuchsbild 125 💰 | ` +
    `Begleiter-Spielzeug 100 💰 | ` +
    `Energie-Trank 100 💰 | ` +
    `Alte Schatzkarte 200 💰 | ` +
    `Kleine Fuchsbox 150 💰 | ` +
    `Große Fuchsbox 300 💰 | ` +
    `Glücksbox 500 💰 | ` +
    `Geheimnisbox 750 💰 | ` +
    `Urfuchs-Truhe 1000 💰`
  );
}


// ------------------------------------------------------------
// KAUFEN COMMAND
// ------------------------------------------------------------

async function commandKaufen(username, args) {
  const profil =
    await profilFuerUser(username);

  if (!profil) {
    return "❌ Dein Profil konnte nicht geladen werden.";
  }

  const item =
    args.join(" ").trim();

  if (!item) {
    return "❌ Beispiel: !kaufen Kuschelbett";
  }

  const ergebnis =
    artikelKaufen(profil, item);

  if (ergebnis.ok) {
    await erweitertesProfilSpeichern(profil);
  }

  return ergebnis.text;
}


// ------------------------------------------------------------
// BOX ÖFFNEN
// ------------------------------------------------------------

async function commandBox(username, args) {
  const profil =
    await profilFuerUser(username);

  if (!profil) {
    return "❌ Dein Profil konnte nicht geladen werden.";
  }

  const box =
    args.join(" ").trim();

  if (!box) {
    return "❌ Beispiel: !box Kleine Fuchsbox";
  }

  const text =
    boxOeffnen(profil, box);

  await erweitertesProfilSpeichern(profil);

  return text;
}


// ------------------------------------------------------------
// BANK COMMAND
// ------------------------------------------------------------

async function commandBank(username, args) {
  const profil =
    await profilFuerUser(username);

  if (!profil) {
    return "❌ Dein Profil konnte nicht geladen werden.";
  }

  bankInitialisieren(profil);

  if (!args.length) {
    return bankText(profil);
  }

  const aktion =
    normalisieren(args[0]);

  const menge =
    Number(args[1]);

  let text;

  if (
    aktion === "einzahlen" ||
    aktion === "einzahl"
  ) {
    text =
      bankEinzahlen(profil, menge);
  } else if (
    aktion === "auszahlen" ||
    aktion === "auszahl"
  ) {
    text =
      bankAuszahlen(profil, menge);
  } else {
    text =
      "🏦 !bank | !bank einzahlen 100 | !bank auszahlen 100";
  }

  await erweitertesProfilSpeichern(profil);

  return text;
}


// ------------------------------------------------------------
// TAGESBONUS
// ------------------------------------------------------------

async function commandBonus(username) {
  const profil =
    await profilFuerUser(username);

  if (!profil) {
    return "❌ Dein Profil konnte nicht geladen werden.";
  }

  const text =
    tagesBonus(profil);

  await erweitertesProfilSpeichern(profil);

  return text;
}


// ------------------------------------------------------------
// BAU COMMAND
// ------------------------------------------------------------

async function commandBau(username, args) {
  const ziel =
    zielAusArgument(args) ||
    username;

  const profil =
    await profilFuerUser(ziel);

  if (!profil) {
    return `❌ Der Bau von ${ziel} konnte nicht geladen werden.`;
  }

  const bau =
    bauInfo(profil);

  return (
    `🏠 ${profil.fuchsname || ziel}s Bau: ` +
    `${profil.bauname || bau.name} | ` +
    `${bau.name} | ` +
    `📦 ${bau.slots} Inventarplätze | ` +
    `🐾 ${bau.aktiveBegleiter} aktive Begleiter`
  );
}


// ------------------------------------------------------------
// BEGLEITER COMMAND
// ------------------------------------------------------------

async function commandBegleiter(username) {
  const profil =
    await profilFuerUser(username);

  if (!profil) {
    return "❌ Dein Profil konnte nicht geladen werden.";
  }

  return (
    `🐾 Begleiter von ${profil.fuchsname || username}: ` +
    begleiterText(profil)
  );
}


// ------------------------------------------------------------
// BEGLEITER WAHL
// ------------------------------------------------------------

async function commandBegleiterWahl(username, args) {
  const profil =
    await profilFuerUser(username);

  if (!profil) {
    return "❌ Dein Profil konnte nicht geladen werden.";
  }

  const name =
    args.join(" ").trim();

  if (!name) {
    return "❌ Beispiel: !begleiterwahl Funkel";
  }

  const begleiter =
    profil.begleiter.find(
      x =>
        normalisieren(x.name) ===
        normalisieren(name)
    );

  if (!begleiter) {
    return "❌ Diesen Begleiter besitzt du nicht.";
  }

  const bau =
    bauInfo(profil);

  const aktive =
    aktiveBegleiter(profil);

  if (
    !begleiter.aktiv &&
    aktive.length >= bau.aktiveBegleiter
  ) {
    return (
      `❌ Du kannst aktuell höchstens ` +
      `${bau.aktiveBegleiter} Begleiter aktiv haben.`
    );
  }

  begleiter.aktiv =
    !begleiter.aktiv;

  await erweitertesProfilSpeichern(profil);

  return (
    `🐾 ${begleiter.name} ist jetzt ` +
    `${begleiter.aktiv ? "aktiv" : "nicht mehr aktiv"}!`
  );
}


// ------------------------------------------------------------
// ERFOLGE COMMAND
// ------------------------------------------------------------

async function commandErfolge(username) {
  const profil =
    await profilFuerUser(username);

  if (!profil) {
    return "❌ Dein Profil konnte nicht geladen werden.";
  }

  if (profil.erfolge.length === 0) {
    return "🏆 Du hast noch keine Fuchs-Erfolge.";
  }

  const namen =
    profil.erfolge
      .map(id => fuchsErfolge[id]?.name)
      .filter(Boolean);

  return (
    `🏆 Deine Erfolge: ` +
    namen.join(" | ")
  );
}


// ------------------------------------------------------------
// ABENTEUER COMMAND
// ------------------------------------------------------------

async function commandAbenteuer(username) {
  const profil =
    await profilFuerUser(username);

  if (!profil) {
    return "❌ Dein Profil konnte nicht geladen werden.";
  }

  const text =
    abenteuerStarten(profil);

  await erweitertesProfilSpeichern(profil);

  return text;
}


// ------------------------------------------------------------
// DORF / KARTE / WESEN / GEHEIMNIS
// ------------------------------------------------------------

async function commandWelt(username, befehl) {
  const profil =
    await profilFuerUser(username);

  if (!profil) {
    return "❌ Dein Profil konnte nicht geladen werden.";
  }

  switch (befehl) {
    case "dorf":
      return dorfText();

    case "karte":
      return karteText();

    case "wesen":
      return wesenText();

    case "rudel":
      return rudelText();

    case "entdeckungen":
      return entdeckungenText(profil);

    case "geheimnis":
      return geheimnisText(profil);

    case "fuchsstatur":
      const statue =
        fuchsstaturText(profil);

      await erweitertesProfilSpeichern(profil);

      return statue;

    default:
      return "🦊 Die Fuchswelt ist noch voller Geheimnisse.";
  }
}


// ------------------------------------------------------------
// PVP HERAUSFORDERUNG
// ------------------------------------------------------------

async function commandKampf(username, args) {
  if (!args.length) {
    return "⚔️ Beispiel: !kampf @Spieler";
  }

  const ziel =
    zielAusArgument(args);

  if (!ziel) {
    return "❌ Bitte nenne einen Spieler.";
  }

  if (
    normalisieren(ziel) ===
    normalisieren(username)
  ) {
    return "🦊 Du kannst dich nicht selbst herausfordern.";
  }

  if (kampfFinden(username, ziel)) {
    return "⚔️ Zwischen diesen beiden Füchsen gibt es bereits eine offene Herausforderung.";
  }

  kampfAnlegen(
    username,
    ziel
  );

  return (
    `⚔️ ${username} fordert @${ziel} ` +
    `zu einem Fuchsduell heraus! ` +
    `@${ziel} schreibe !annehmen`
  );
}


// ------------------------------------------------------------
// KAMPF ANNEHMEN
// ------------------------------------------------------------

async function commandAnnehmen(username) {
  let gefundenerKampf = null;

  for (const kampf of offeneKaempfe.values()) {
    if (
      normalisieren(kampf.ziel) ===
      normalisieren(username)
    ) {
      gefundenerKampf = kampf;
      break;
    }
  }

  if (!gefundenerKampf) {
    return "❌ Du hast keine offene Kampfherausforderung.";
  }

  const a =
    await profilFuerUser(
      gefundenerKampf.herausforderer
    );

  const b =
    await profilFuerUser(
      gefundenerKampf.ziel
    );

  if (!a || !b) {
    return "❌ Die Kampfprofile konnten nicht geladen werden.";
  }

  const gewinner =
    kampfEntscheiden(a, b);

  const verlierer =
    gewinner === a ? b : a;

  const ergebnis =
    kampfGewinnen(gewinner);

  kampfVerlieren(verlierer);

  kampfLoeschen(
    gefundenerKampf.herausforderer,
    gefundenerKampf.ziel
  );

  await erweitertesProfilSpeichern(a);
  await erweitertesProfilSpeichern(b);

  const gewinnerName =
    gewinner.fuchsname ||
    gewinner.spieler;

  const verliererName =
    verlierer.fuchsname ||
    verlierer.spieler;

  return (
    `⚔️ FUCHSDUELL! ` +
    `@${gewinnerName} gewinnt gegen ` +
    `@${verliererName}! ` +
    `🏆 +${ergebnis.xp} XP +${ergebnis.coins} 💰 ` +
    `| Rang: ${ergebnis.rang}`
  );
}


// ------------------------------------------------------------
// POKÉMON-KAMPF
// ------------------------------------------------------------

async function commandPokeKampf(username) {
  const eigene =
    pokemonFuerSpieler(username);

  if (!eigene) {
    return (
      "❌ Für deinen Account ist kein festes Pokémon hinterlegt."
    );
  }

  const gegner =
    username === "fuchsmissVegetalover2_0"
      ? "vegetalover2_0"
      : "fuchsmissVegetalover2_0";

  const gegnerPokemon =
    pokemonFuerSpieler(gegner);

  if (!gegnerPokemon) {
    return "❌ Für den Gegner ist kein Pokémon hinterlegt.";
  }

  const ersterGewinner =
    zufall(2) === 0;

  const gewinner =
    ersterGewinner
      ? username
      : gegner;

  const pokemonGewinner =
    ersterGewinner
      ? eigene
      : gegnerPokemon;

  const profilGewinner =
    await profilFuerUser(gewinner);

  if (profilGewinner) {
    profilGewinner.xp =
      (profilGewinner.xp || 0) + 100;

    profilGewinner.muenzen =
      (profilGewinner.muenzen || 100) + 50;

    await erweitertesProfilSpeichern(
      profilGewinner
    );
  }

  return (
    `⚡ POKÉMON-KAMPF! ` +
    `@${username} ${eigene} ⚔️ ` +
    `@${gegner} ${gegnerPokemon} → ` +
    `🏆 @${gewinner} gewinnt mit ${pokemonGewinner}! ` +
    `+100 XP +50 💰`
  );
}


// ------------------------------------------------------------
// AUTOMATISCHER PVP FÜR FUCHSMISS
// ------------------------------------------------------------

async function autoPvp(username, text) {
  if (!text) return null;

  const teile =
    text.trim().split(/\s+/);

  if (
    teile[0]?.toLowerCase() !== "!kampf"
  ) {
    return null;
  }

  if (!istFuchsMiss(username)) {
    return null;
  }

  if (!teile[1]) {
    return null;
  }

  const herausforderer =
    teile[1].replace(/^@/, "");

  if (
    normalisieren(herausforderer) ===
    normalisieren(username)
  ) {
    return null;
  }

  const zielProfil =
    await profilFuerUser(username);

  const herausfordererProfil =
    await profilFuerUser(herausforderer);

  if (!zielProfil || !herausfordererProfil) {
    return null;
  }

  kampfAnlegen(
    herausforderer,
    username
  );

  const gewinner =
    kampfEntscheiden(
      zielProfil,
      herausfordererProfil
    );

  const verlierer =
    gewinner === zielProfil
      ? herausfordererProfil
      : zielProfil;

  const ergebnis =
    kampfGewinnen(gewinner);

  kampfVerlieren(verlierer);

  kampfLoeschen(
    herausforderer,
    username
  );

  await erweitertesProfilSpeichern(
    zielProfil
  );

  await erweitertesProfilSpeichern(
    herausfordererProfil
  );

  return (
    `⚔️ AUTO-FUCHSDUELL! ` +
    `@${gewinner.fuchsname || gewinner.spieler} ` +
    `gewinnt! 🏆 +${ergebnis.xp} XP +${ergebnis.coins} 💰`
  );
}


// ------------------------------------------------------------
// HILFE
// ------------------------------------------------------------

function hilfeText() {
  return (
    `🦊 FUCHSWELT-BEFEHLE: ` +
    `!profil | !quest | !markt | !kaufen [Item] | ` +
    `!inventar | !bank | !bonus | !bau | !begleiter | ` +
    `!begleiterwahl [Name] | !erfolge | !abenteuer | ` +
    `!dorf | !karte | !rudel | !wesen | !entdeckungen | ` +
    `!geheimnis | !fuchsstatur | !kampf @Name | !annehmen | ` +
    `!pokekampf`
  );
}


// ------------------------------------------------------------
// ALLE BEFEHLE
// ------------------------------------------------------------

async function commandVerarbeiten(username, text) {
  if (!text || !text.startsWith("!")) {
    return null;
  }

  const teile =
    text.trim().split(/\s+/);

  const command =
    teile[0]
      .toLowerCase()
      .replace("!", "");

  const args =
    teile.slice(1);

  switch (command) {
    case "profil":
      return commandProfil(username, args);

    case "quest":
      return commandQuest(username);

    case "markt":
      return commandMarkt();

    case "kaufen":
      return commandKaufen(username, args);

    case "box":
      return commandBox(username, args);

    case "inventar":
      return commandInventar(username);

    case "bank":
      return commandBank(username, args);

    case "bonus":
    case "tagesbonus":
      return commandBonus(username);

    case "bau":
      return commandBau(username, args);

    case "begleiter":
      return commandBegleiter(username);

    case "begleiterwahl":
      return commandBegleiterWahl(
        username,
        args
      );

    case "erfolge":
      return commandErfolge(username);

    case "abenteuer":
      return commandAbenteuer(username);

    case "dorf":
    case "karte":
    case "rudel":
    case "wesen":
    case "entdeckungen":
    case "geheimnis":
    case "fuchsstatur":
      return commandWelt(
        username,
        command
      );

    case "kampf":
    case "pvp":
      return commandKampf(
        username,
        args
      );

    case "annehmen":
      return commandAnnehmen(username);

    case "pokekampf":
      return commandPokeKampf(username);

    case "hilfe":
    case "allebefehle":
      return hilfeText();

    default:
      return null;
  }
}


// ------------------------------------------------------------
// CHAT-NACHRICHT VERARBEITEN
// ------------------------------------------------------------

async function chatVerarbeiten(username, text) {
  if (!username) return null;

  const profil =
    await profilFuerUser(username);

  if (!profil) {
    return null;
  }

  // Jede Chatnachricht kann für die persönliche Quest
  // gezählt werden.
  await questNachrichtPruefen(
    profil,
    text
  );

  // Automatische Annahme für FuchsMiss
  const autoAntwort =
    await autoPvp(
      username,
      text
    );

  if (autoAntwort) {
    return autoAntwort;
  }

  const antwort =
    await commandVerarbeiten(
      username,
      text
    );

  if (antwort) {
    await erweitertesProfilSpeichern(
      profil
    );

    return antwort;
  }

  // Kleine Chance auf normale Fuchs-Chatbelohnung
  if (zufall(100) < 5) {
    profil.muenzen =
      (profil.muenzen || 100) + 1;

    await erweitertesProfilSpeichern(
      profil
    );
  }

  return null;
}


// ------------------------------------------------------------
// HTTP SERVER
// ------------------------------------------------------------

const server =
  http.createServer(
    async (req, res) => {

      const url =
        new URL(
          req.url,
          `http://${req.headers.host || "localhost"}`
        );

      // ------------------------------------------------------
      // STARTSEITE
      // ------------------------------------------------------

      if (url.pathname === "/") {
        res.writeHead(
          200,
          {
            "Content-Type":
              "text/plain; charset=utf-8"
          }
        );

        res.end(
          "🦊 MitsusundWandasWelt – Fuchswelt Bot läuft!"
        );

        return;
      }

      // ------------------------------------------------------
      // PVP OVERLAY
      // ------------------------------------------------------

      if (url.pathname === "/pvp") {
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
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Fuchs PvP</title>
<style>
html,body{
  margin:0;
  padding:0;
  background:transparent;
  font-family:Arial,sans-serif;
  color:white;
}
#box{
  width:100%;
  box-sizing:border-box;
  padding:18px;
  border-radius:18px;
  background:rgba(20,20,30,.88);
  text-align:center;
  font-size:24px;
}
small{
  display:block;
  margin-top:8px;
  font-size:16px;
}
</style>
</head>
<body>
<div id="box">
  🦊 Fuchs-PvP
  <small>Warte auf ein Duell...</small>
</div>

<script>
async function laden(){
  try{
    const r = await fetch("/pvp-data");
    const d = await r.json();

    const box =
      document.getElementById("box");

    if(!d.aktiv){
      box.innerHTML =
        "🦊 Fuchs-PvP" +
        "<small>Warte auf ein Duell...</small>";
      return;
    }

    box.innerHTML =
      "⚔️ " +
      d.herausforderer +
      " VS " +
      d.ziel +
      "<small>" +
      (d.status || "Duell läuft...") +
      "</small>";
  }catch(e){}
}

laden();
setInterval(laden,2000);
</script>
</body>
</html>
        `);

        return;
      }

      // ------------------------------------------------------
      // PVP DATA
      // ------------------------------------------------------

      if (url.pathname === "/pvp-data") {
        const kaempfe =
          Array.from(
            offeneKaempfe.values()
          );

        if (kaempfe.length === 0) {
          res.writeHead(
            200,
            {
              "Content-Type":
                "application/json; charset=utf-8"
            }
          );

          res.end(
            JSON.stringify({
              aktiv:false
            })
          );

          return;
        }

        const kampf =
          kaempfe[0];

        res.writeHead(
          200,
          {
            "Content-Type":
              "application/json; charset=utf-8"
          }
        );

        res.end(
          JSON.stringify({
            aktiv:true,
            herausforderer:
              kampf.herausforderer,
            ziel:
              kampf.ziel,
            status:
              "⚔️ Herausforderung offen!"
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

      res.end("404");
    }
  );


// ------------------------------------------------------------
// SERVER START
// ------------------------------------------------------------

const PORT =
  Number(process.env.PORT) || 10000;

server.listen(
  PORT,
  () => {
    console.log(
      `🦊 Fuchswelt-Server läuft auf Port ${PORT}`
    );
  }
);


// ------------------------------------------------------------
// STREAMELEMENTS WEBSOCKET
// ------------------------------------------------------------

let ws = null;

function streamelementsVerbinden() {
  if (!STREAMELEMENTS_JWT) {
    console.log(
      "⚠️ STREAMELEMENTS_JWT fehlt."
    );
    return;
  }

  ws =
    new WebSocket(
      STREAMELEMENTS_WS
    );

  ws.on(
    "open",
    () => {
      console.log(
        "🦊 StreamElements WebSocket verbunden."
      );

      ws.send(
        JSON.stringify({
          op: 0,
          d: {
            token:
              STREAMELEMENTS_JWT,
            nonce:
              `${Date.now()}`
          }
        })
      );
    }
  );

  ws.on(
    "message",
    async raw => {
      try {
        const packet =
          JSON.parse(
            raw.toString()
          );

        if (
          packet.op === 1 &&
          packet.d
        ) {
          const channel =
            STREAMELEMENTS_CHANNEL ||
            packet.d.channel;

          ws.send(
            JSON.stringify({
              op: 2,
              d: {
                type:
                  "subscribe",
                nonce:
                  `${Date.now()}`,
                condition: {
                  channel
                },
                topics: [
                  "channel.chat.message"
                ]
              }
            })
          );

          console.log(
            "🦊 Chat-Topic abonniert."
          );

          return;
        }

        const data =
          packet.d;

        if (!data) return;

        const username =
          usernameAusNachricht(data);

        const text =
          chatTextAusNachricht(data);

        if (!username || !text) {
          return;
        }

        const antwort =
          await chatVerarbeiten(
            username,
            text
          );

        if (antwort) {
          await streamelementsSenden(
            antwort
          );
        }

      } catch (error) {
        console.error(
          "❌ Fehler bei Chat-Nachricht:",
          error
        );
      }
    }
  );

  ws.on(
    "close",
    () => {
      console.log(
        "⚠️ StreamElements getrennt. Neuer Verbindungsversuch..."
      );

      setTimeout(
        streamelementsVerbinden,
        5000
      );
    }
  );

  ws.on(
    "error",
    error => {
      console.error(
        "❌ StreamElements WebSocket Fehler:",
        error.message
      );
    }
  );
}


// ------------------------------------------------------------
// WEBSOCKET STARTEN
// ------------------------------------------------------------

streamelementsVerbinden();


// ------------------------------------------------------------
// ALLES GELADEN
// ------------------------------------------------------------

console.log(
  "🦊❤️ MITSUSUNDWANDASWELT – FUCHSWELT BOT BEREIT!"
);