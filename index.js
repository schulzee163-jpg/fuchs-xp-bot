import http from "http";
import WebSocket from "ws";

/* =========================================================
   🌍 MITSUSUNDWANDASWELT
   🦊 FUCHSWELT BOT + FISCHEN & DORFBAU
   Twitch + StreamElements + Supabase + Render
========================================================= */


/* =========================================================
   ⚙️ KONFIGURATION
========================================================= */

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  "https://herznunvdqcmzeffblgo.supabase.co";

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const STREAMELEMENTS_JWT =
  process.env.STREAMELEMENTS_JWT || "";

const PORT =
  Number(process.env.PORT || 10000);

let streamElementsChannel =
  process.env.STREAMELEMENTS_CHANNEL || null;


/* =========================================================
   🦊 POKÉMON
========================================================= */

const eigenePokemon = {
  fuchsmissvegetalover2_0: "Pikachu",
  vegetalover2_0: "Glumanda"
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
  "Sterndu"
];


/* =========================================================
   🐾 RUDEL
========================================================= */

const rudel = {
  feuer: "🔥 Feuerrudel",
  wasser: "🌊 Wasserrudel",
  wald: "🌲 Waldrudel",
  ice: "🧊 ICErudel"
};

const gebiete = {
  feuer: "🌋 Feuertal",
  wasser: "🌊 Wasserlande",
  wald: "🌲 Fuchswald",
  ice: "❄️ Eisberge"
};


/* =========================================================
   👹 WESEN
========================================================= */

const wesen = [
  "🌑 Schattenfuchs",
  "🔥 Flammenwolf",
  "❄️ Eisdrache",
  "🌊 Wassergeist",
  "🌲 Waldhüter"
];


/* =========================================================
   🏠 FUCHSBAU
========================================================= */

const fuchsbauStufen = [
  "🏠 Kleiner Bau",
  "🏡 Fuchshaus",
  "🏰 Großer Fuchsbau",
  "✨ Fuchsanwesen",
  "👑 Fuchsresidenz"
];

const raeume = [
  "Schlafhöhle",
  "Schatzkammer",
  "Begleiterzimmer",
  "Trainingsraum",
  "Dekorationsraum",
  "Geheimraum"
];


/* =========================================================
   🏅 TITEL
========================================================= */

const titel = [
  "Jungfuchs",
  "Abenteurer",
  "Chronist",
  "Duellfuchs",
  "Rudelheld",
  "Wesenbezwinger",
  "Begleitermeister",
  "Spurensucher",
  "Kampflegende",
  "Dorffuchs"
];


/* =========================================================
   🏆 ERFOLGE
========================================================= */

const erfolge = [
  "Jungfuchs gestartet",
  "Erste Quest",
  "Erstes Abenteuer",
  "Mein erstes Zuhause",
  "Einrichtungskünstler",
  "Großer Bau",
  "Erster Gefährte",
  "Treuer Freund",
  "Begleiter-Sammler",
  "Münzsammler 1000",
  "Großer Schatz 5000",
  "Fuchsvermögen 10000",
  "Spurensucher",
  "Chronist",
  "Geschichte geschrieben",
  "Teamfuchs",
  "Fuchsfreund",
  "Dorffuchs"
];


/* =========================================================
   🌟 SCHICKSAL
========================================================= */

const schicksal = [
  "⚔️ Kriegerweg",
  "🗺️ Entdeckerweg",
  "💎 Sammlerweg",
  "🤝 Freundesweg",
  "🔐 Geheimnisweg"
];


/* =========================================================
   🌟 URFUCHS-GESCHICHTE
========================================================= */

const story = [
  "🌟 Der Urfuchs entdeckte einst Feuer, Wasser, Natur und Eis.",
  "🌟 Aus diesen Kräften entstanden die vier Rudel.",
  "🌟 Der Urfuchs verschwand, weil er wusste, dass eine neue Generation kommen würde.",
  "🔥 Flammenherz-Essenz – Mut und Stärke.",
  "🌊 Tiefenquell – Einheit und Weisheit.",
  "🌲 Lebenskern – Leben und Erneuerung.",
  "🧊 Eiskristall – Ruhe und Ausdauer.",
  "🌙 Das fünfte Fragment: Wenn die vier Kräfte erwachen, wird das fünfte Fragment seinen Fuchs finden.",
  "🌌 Das Verborgene Tal.",
  "🗿 Die Fuchsstatur: Ihr seid gekommen … so, wie der Urfuchs es vorausgesehen hat.",
  "⚫ Ein schwarzes Zeichen mit einem geteilten Kreis und Fuchssymbol.",
  "🌳 Der alte Baum im Fuchswald trägt die Worte: Er erwacht.",
  "🌲 Der Waldhüter: Es ist noch nicht zu spät … aber ihr müsst ihn finden.",
  "🌊 In den Wasserlanden liegt eine Insel mit einer leuchtenden Quelle.",
  "🚪 Die Spur endet an einer verschlossenen Unterwassertür."
];


/* =========================================================
   🏪 FUCHS-MARKT
========================================================= */

const markt = [
  ["Kuschelbett",150,"den"],
  ["Fuchslaterne",100,"den"],
  ["Kleine Zimmerpflanze",75,"den"],
  ["Fuchsbild",125,"den"],
  ["Schöne Vorratskiste",200,"den"],
  ["Holzregal",175,"den"],
  ["Fuchs-Kuscheltier",250,"den"],
  ["Leuchtkristall",400,"den"],
  ["Trophäenständer",350,"den"],
  ["Geheimnisvolle Wanddeko",500,"den"],

  ["Begleiter-Spielzeug",100,"begleiter"],
  ["Lieblings-Leckerli",75,"begleiter"],
  ["Kuscheldecke",125,"begleiter"],
  ["Begleiter-Schleife",150,"begleiter"],
  ["Kleines Begleiter-Bett",200,"begleiter"],
  ["Glücksanhänger",250,"begleiter"],
  ["Leuchtendes Halsband",350,"begleiter"],
  ["Begleiter-Kristall",400,"begleiter"],
  ["Seltenes Begleiter-Spielzeug",500,"begleiter"],
  ["Legendäres Begleiter-Zubehör",750,"begleiter"],

  ["Energie-Trank",100,"abenteuer"],
  ["Kleiner Heiltrank",125,"abenteuer"],
  ["Alte Schatzkarte",200,"abenteuer"],
  ["Fuchslaterne",150,"abenteuer"],
  ["Altes Fuchs-Kompass",250,"abenteuer"],
  ["Spurensucher-Lupe",200,"abenteuer"],
  ["Abenteuer-Rucksack",300,"abenteuer"],
  ["Glückblatt",350,"abenteuer"],
  ["Mysteriöser Schlüssel",500,"abenteuer"],
  ["Uraltes Fuchs-Artefakt",750,"abenteuer"],

  ["Kleine Fuchsbox",150,"box"],
  ["Große Fuchsbox",300,"box"],
  ["Glücksbox",500,"box"],
  ["Geheimnisbox",750,"box"],
  ["Urfuchs-Truhe",1000,"box"],

  ["Fuchsmütze",150,"custom"],
  ["Fuchsschleife",150,"custom"],
  ["Coole Fuchsbrille",200,"custom"],
  ["Fuchsschal",250,"custom"],
  ["Fuchskrone",500,"custom"],
  ["Leuchteffekt",400,"custom"],
  ["Feuer-Aura",600,"custom"],
  ["Eis-Aura",600,"custom"],
  ["Wald-Aura",600,"custom"],
  ["Wasser-Aura",600,"custom"],

  ["Urfuchs-Splitter",1500,"rare"],
  ["Kristall der fünf Kräfte",2000,"rare"],
  ["Schattenfuchs-Amulett",1750,"rare"],
  ["Flammenherz-Siegel",1500,"rare"],
  ["Tiefenquell-Siegel",1500,"rare"],
  ["Lebenskern-Siegel",1500,"rare"],
  ["Eiskristall-Siegel",1500,"rare"],
  ["Schlüssel des Geheimarchivs",2500,"rare"],
  ["Urfuchs-Krone",5000,"rare"]
];


/* =========================================================
   🎣 FISCHEN & FUNDSTÜCKE
========================================================= */

const angelFunde = [
  { name: "🐟 Silberforelle", gewicht: 18, art: "fisch" },
  { name: "🐠 Buntbarsch", gewicht: 16, art: "fisch" },
  { name: "🐟 Goldkarpfen", gewicht: 7, art: "fisch", selten: true },
  { name: "🦀 Flusskrabbe", gewicht: 12, art: "tier" },
  { name: "🐙 Kleiner Wassergeist", gewicht: 5, art: "wesen", selten: true },
  { name: "🪵 Treibholz", gewicht: 15, art: "material" },
  { name: "🪨 Alter Baustein", gewicht: 13, art: "material" },
  { name: "🌿 Wasserpflanze", gewicht: 12, art: "material" },
  { name: "💎 Kristallsplitter", gewicht: 7, art: "material", selten: true },
  { name: "🗺️ Alte Schatzkarte", gewicht: 3, art: "story", selten: true },
  { name: "🗝️ Unterwasserschlüssel", gewicht: 2, art: "story", selten: true },
  { name: "🌊 Wasser-Kristall", gewicht: 2, art: "story", selten: true },
  { name: "🌟 Urfuchs-Splitter", gewicht: 1, art: "story", legendär: true }
];

const dorfBauten = {
  angelsteg: {
    name: "🎣 Angelsteg",
    kosten: { "🪵 Treibholz": 5, "🪨 Alter Baustein": 3 }
  },
  kraeuterkueche: {
    name: "🧪 Kräuterküche",
    kosten: { "🪵 Treibholz": 4, "🌿 Wasserpflanze": 2 }
  },
  kristallwerkstatt: {
    name: "🔮 Kristallwerkstatt",
    kosten: { "🪨 Alter Baustein": 6, "💎 Kristallsplitter": 2 }
  },
  schatzkammer: {
    name: "💎 Schatzkammer",
    kosten: { "🪨 Alter Baustein": 8, "🪵 Treibholz": 4, "💎 Kristallsplitter": 3 }
  },
  geheimarchiv: {
    name: "🔐 Geheimarchiv",
    kosten: { "🗝️ Unterwasserschlüssel": 1, "💎 Kristallsplitter": 5 }
  }
};

function fish(username) {
  const w = spieler(username);

  if (!w.inventar || typeof w.inventar !== "object") {
    w.inventar = {};
  }

  const fund = angelFunde[zufall(0, angelFunde.length - 1)];
  const bonus = zufall(5, 25);

  inventarHinzufuegen(w, fund.name);
  w.ruf += 1;

  if (!w.entdeckungen.includes(fund.name)) {
    w.entdeckungen.push(fund.name);
  }

  chronikEintrag(w, `Gefunden: ${fund.name}`);

  if (fund.legendär) {
    erfolgFreischalten(w, "Großer Schatz 5000");
    titelAktualisieren(w);
    return `🎣🌟 LEGENDÄR! @${username} hat ${fund.name} gefunden! x1 • Dieser Fund gehört zur Geschichte der Fuchswelt.`;
  }

  if (fund.selten) {
    return `🎣✨ @${username} hat ${fund.name} gefunden! x1 • Ein seltener Fund für deine Fuchswelt.`;
  }

  if (fund.art === "fisch" || fund.art === "tier") {
    return `🎣 @${username} hat ${fund.name} gefangen! x1 • +${bonus}🪙 Wert für spätere Verwendung/Verkauf.`;
  }

  return `🎣 @${username} hat ${fund.name} gefunden! x1 • Gut für deine Fuchswelt und den Ausbau deines Dorfes.`;
}

function bauen(username, projekt) {
  const w = spieler(username);
  const key = normalisieren(projekt).replace(/\s+/g, "");
  const bau = dorfBauten[key];

  if (!bau) {
    return `🏗️ @${username} Mögliche Bauprojekte: ${Object.keys(dorfBauten).join(", ")}. Beispiel: !bauen angelsteg`;
  }

  if (!w.dorfBauten || typeof w.dorfBauten !== "object") {
    w.dorfBauten = {};
  }

  if (w.dorfBauten[key]) {
    return `🏡 @${username} ${bau.name} steht bereits in deinem Dorf.`;
  }

  const fehlend = Object.entries(bau.kosten)
    .filter(([item, menge]) => (w.inventar[item] || 0) < menge)
    .map(([item, menge]) => `${item} ${Math.max(0, menge - (w.inventar[item] || 0))}x`);

  if (fehlend.length) {
    return `🏗️ @${username} Für ${bau.name} fehlen: ${fehlend.join(" | ")}.`;
  }

  for (const [item, menge] of Object.entries(bau.kosten)) {
    inventarEntfernen(w, item, menge);
  }

  w.dorfBauten[key] = true;
  chronikEintrag(w, `Dorf gebaut: ${bau.name}`);

  return `🏡✨ @${username} ${bau.name} wurde gebaut! Die benötigten Fundstücke wurden aus deinem Inventar genommen.`;
}



/* =========================================================
   🐾 BEGLEITER
========================================================= */

const begleiterNamen = [
  "Funkelpfote",
  "Mondschweif",
  "Keks",
  "Flitz",
  "Momo",
  "Schattenpfote",
  "Glitzer",
  "Waldnase"
];

const begleiterPersoenlichkeiten = [
  "Frech",
  "Faul",
  "Mutig",
  "Neugierig",
  "Treu",
  "Geheimnisvoll"
];

const begleiterRaritaeten = [
  "Gewöhnlich",
  "Ungewöhnlich",
  "Selten",
  "Episch",
  "Legendär",
  "Mythisch"
];


/* =========================================================
   🧰 HILFSFUNKTIONEN
========================================================= */

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

function levelAusXP(xp) {
  return Math.floor(
    Number(xp || 0) / 100
  ) + 1;
}

function berlinDatum() {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Europe/Berlin",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }
  ).format(new Date());
}

function berlinStunde() {
  return Number(
    new Intl.DateTimeFormat(
      "de-DE",
      {
        timeZone: "Europe/Berlin",
        hour: "2-digit",
        hour12: false
      }
    ).format(new Date())
  );
}

function tageszeit() {
  const h = berlinStunde();

  if (h < 6) return "🌙 Nacht";
  if (h < 11) return "🌅 Morgen";
  if (h < 18) return "☀️ Tag";
  if (h < 22) return "🌇 Abend";

  return "🌙 Nacht";
}

function jahreszeit() {
  const monat = Number(
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone: "Europe/Berlin",
        month: "2-digit"
      }
    ).format(new Date())
  );

  if (monat <= 2 || monat === 12)
    return "❄️ Winter";

  if (monat <= 5)
    return "🌱 Frühling";

  if (monat <= 8)
    return "☀️ Sommer";

  return "🍂 Herbst";
}

function wetter() {
  const wetterListe = [
    "☀️ sonnig",
    "☁️ bewölkt",
    "🌧️ Regen",
    "⛈️ Gewitter",
    "🌫️ Nebel",
    "❄️ Schnee",
    "🌪️ Sturm",
    "✨ magisches Wetter"
  ];

  return wetterListe[
    zufall(0, wetterListe.length - 1)
  ];
}

function itemFinden(name) {
  const such = normalisieren(name);

  return markt.find(
    item =>
      normalisieren(item[0]) === such
  ) ||
  markt.find(
    item =>
      normalisieren(item[0]).includes(such)
  );
}


/* =========================================================
   🗄️ SUPABASE
========================================================= */

async function supabase(path, options = {}) {

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY fehlt."
    );
  }

  const response =
    await fetch(
      `${SUPABASE_URL}${path}`,
      {
        ...options,

        headers: {
          apikey:
            SUPABASE_SERVICE_ROLE_KEY,

          Authorization:
            `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,

          "Content-Type":
            "application/json",

          ...(options.headers || {})
        }
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
        JSON.stringify(body)
    }
  );
}

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
          Number(xp) || 0
      }
    );

  } catch (error) {

    console.error(
      "❌ XP hinzufügen:",
      error.message
    );

  }
}

async function profilDB(username) {

  try {

    const data =
      await supabase(
        `/rest/v1/fuchsprofile` +
        `?spieler=eq.${encodeURIComponent(
          normalisieren(username)
        )}` +
        `&limit=1`
      );

    return data?.[0] || null;

  } catch (error) {

    console.error(
      "❌ Profil laden:",
      error.message
    );

    return null;
  }
}

async function aktivitaetSpeichern(
  username
) {

  try {

    await supabase(
      `/rest/v1/fuchs_aktivitaet?on_conflict=spieler`,
      {
        method: "POST",

        headers: {
          Prefer:
            "resolution=merge-duplicates"
        },

        body:
          JSON.stringify({
            spieler:
              normalisieren(username),

            letzte_aktivitaet:
              new Date().toISOString()
          })
      }
    );

  } catch (error) {

    console.error(
      "❌ Aktivität:",
      error.message
    );

  }
}


/* =========================================================
   📺 STREAM ELEMENTS
========================================================= */

async function streamElementsChannelHolen() {

  if (
    streamElementsChannel ||
    !STREAMELEMENTS_JWT
  ) {
    return streamElementsChannel;
  }

  const response =
    await fetch(
      "https://api.streamelements.com/kappa/v2/channels/me",
      {
        headers: {
          Authorization:
            `Bearer ${STREAMELEMENTS_JWT}`,

          Accept:
            "application/json"
        }
      }
    );

  const text =
    await response.text();

  if (!response.ok) {

    throw new Error(
      `StreamElements Channel ${response.status}: ${text}`
    );

  }

  const data =
    JSON.parse(text);

  streamElementsChannel =
    data?._id ||
    null;

  return streamElementsChannel;
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

  if (!STREAMELEMENTS_JWT) {

    console.log(
      "⚠️ StreamElements JWT fehlt."
    );

    return false;
  }

  try {

    const channelId =
      await streamElementsChannelHolen();

    if (!channelId) {

      console.error(
        "❌ StreamElements Channel-ID fehlt."
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
              "application/json"
          },

          body:
            JSON.stringify({
              message:
                String(text).slice(0, 480)
            })
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


/* =========================================================
   🌍 FUCHSWELT – SPIELERDATEN
========================================================= */

const welt = new Map();

function neuerSpieler(username) {

  return {

    foxName: null,

    bauName:
      "Mein Fuchsbau",

    stufe: 1,

    muenzen: 100,

    energie: 100,

    rudel: null,

    pokemon:
      eigenePokemon[
        normalisieren(username)
      ] || null,

    inventar: {},

    begleiter: [],

    aktiveBegleiter: [],

    freundschaft: 0,

    ruf: 0,

    erfolge: [],

    titel:
      "Jungfuchs",

    schicksal: [],

    chronik: [],

    entdeckungen: [],

    storyIndex: 0,

    kraefte: {
      feuer: false,
      wasser: false,
      wald: false,
      ice: false
    },

    fuenftesFragment: false,

    geheimarchiv:
      false,

    tor:
      false,

    legenden: [],

    ruhmeshalle: [],

    fuchskern: 0,

    dekor: [],

    dorfBauten: {},

    bank: 0,

    post: [],

    tausch: [],

    teams: [],

    questTag: null,

    questIndex: 0,

    questAntworten: [],

    messageCount: 0,

    letzterDailyBonus:
      null,

    adventure: null
  };
}

function spieler(username) {

  const u =
    normalisieren(username);

  if (!welt.has(u)) {

    welt.set(
      u,
      neuerSpieler(u)
    );

  }

  return welt.get(u);
}


/* =========================================================
   📖 CHRONIK / ERFOLGE
========================================================= */

function chronikEintrag(
  w,
  text
) {

  w.chronik.unshift(
    `${new Date().toLocaleString(
      "de-DE"
    )}: ${text}`
  );

  w.chronik =
    w.chronik.slice(0, 50);
}

function erfolgFreischalten(
  w,
  name
) {

  if (
    !w.erfolge.includes(name)
  ) {

    w.erfolge.push(name);

    return true;
  }

  return false;
}

function titelAktualisieren(w) {

  if (
    w.erfolge.length >= 15
  ) {
    w.titel =
      "Dorffuchs";
  }

  else if (
    w.erfolge.length >= 10
  ) {
    w.titel =
      "Spurensucher";
  }

  else if (
    w.erfolge.length >= 5
  ) {
    w.titel =
      "Abenteurer";
  }
}

function inventarHinzufuegen(
  w,
  item,
  menge = 1
) {

  w.inventar[item] =
    (w.inventar[item] || 0)
    + menge;
}

function inventarEntfernen(
  w,
  item,
  menge = 1
) {

  if (
    (w.inventar[item] || 0)
    < menge
  ) {
    return false;
  }

  w.inventar[item] -= menge;

  if (
    w.inventar[item] <= 0
  ) {
    delete w.inventar[item];
  }

  return true;
}


/* =========================================================
   🎯 PERSÖNLICHE TAGESQUESTS
   IMMER NUR EINE QUEST
========================================================= */

const tagesquests = {

  0: [
    ["🎮 Nenne dein Lieblingsspiel für einen entspannten Abend.",10],
    ["🐶 Was würde dein Haustier zuerst sagen, wenn es sprechen könnte?",10],
    ["🎬 Nenne deinen Lieblingsfilm.",10],
    ["🎵 Welcher Song gehört zu einem perfekten Abend?",10],
    ["⚽ Welchen Sport würdest du ausprobieren?",10],
    ["🦊 Erfinde einen lustigen Fuchsnamen.",10],
    ["🏖️ Beschreibe deinen perfekten Urlaub.",10],
    ["👻 Erfinde einen Namen für ein gruseliges Wesen.",10],
    ["🎨 Erfinde einen Namen für eine geheime Fuchswelt.",10],
    ["🌟 Was ist dein größter Wunsch für die Fuchswelt?",10]
  ],

  1: [
    ["📝 Schreibe 10 Nachrichten im Chat.",10],
    ["📝 Schreibe 20 Nachrichten im Chat.",10],
    ["📝 Schreibe 30 Nachrichten im Chat.",10],
    ["📝 Schreibe 50 Nachrichten im Chat.",10],
    ["📝 Schreibe 75 Nachrichten im Chat.",10],
    ["⚡ Schreibe den Namen deines Lieblings-Pokémon in den Chat.",10],
    ["🌟 Schreibe, welches Pokémon du gerne als Partner auf einem Abenteuer hättest.",10],
    ["😂 Erfinde einen lustigen Spitznamen für ein Pokémon.",10],
    ["🧪 Erfinde eine neue Pokémon-Attacke.",10],
    ["😂 Erfinde eine lustige Pokémon-Entwicklung.",10]
  ],

  2: [
    ["🎬 Nenne deinen Lieblings-Anime.",10],
    ["🎮 Nenne ein Spiel, das du gerade gerne spielen würdest.",10],
    ["🐾 Welches Tier passt am besten zu deinem Charakter?",10],
    ["🎵 Nenne einen Song, den du mit einem Abenteuer verbindest.",10],
    ["😂 Erfinde einen lustigen NPC-Namen.",10],
    ["🦸 Welche Superkraft würdest du testen?",10],
    ["🧙 Erfinde einen Namen für eine Fantasy-Stadt.",10],
    ["🚗 GTA: Was wäre dein perfekter GTA-Job?",10],
    ["👻 Erfinde ein Wesen, das nachts durch Fuchsdorf läuft.",10],
    ["🎨 Erfinde einen Namen für ein eigenes Videospiel.",10]
  ],

  3: [
    ["🌳 Erfinde einen Namen für einen alten Baum.",10],
    ["💧 Erfinde einen Namen für eine magische Quelle.",10],
    ["🔥 Erfinde einen Namen für einen Vulkanort.",10],
    ["🧊 Erfinde einen Namen für einen Eispalast.",10],
    ["🌊 Erfinde einen Namen für eine Unterwasserstadt.",10],
    ["🦊 Erfinde einen neuen Fuchstitel.",10],
    ["🗝️ Erfinde einen Namen für einen geheimen Schlüssel.",10],
    ["📖 Erfinde einen Titel für ein Kapitel der Fuchs-Chronik.",10],
    ["👹 Erfinde einen Namen für ein seltenes Wesen.",10],
    ["🌙 Erfinde einen Namen für eine Nachtprüfung.",10]
  ],

  4: [
    ["🎬 Nenne eine Serie, die du jederzeit wieder anschauen würdest.",10],
    ["🎮 Nenne ein Videospiel, das du gerne mit Freunden spielen würdest.",10],
    ["🦸 Wie würde dein Superheldenname heißen?",10],
    ["🎨 Erfinde einen Namen für einen eigenen Charakter.",10],
    ["👻 Welches Horrorspiel würdest du nachts spielen?",10],
    ["🎵 Nenne einen Song, der sofort gute Laune macht.",10],
    ["🚀 Was wäre dein erstes Ziel im Weltall?",10],
    ["🐾 Welches Tier wäre dein perfekter Abenteuerbegleiter?",10],
    ["🧙 Erfinde einen Namen für einen mächtigen Fantasy-Zauber.",10],
    ["🏠 Wie würde dein perfektes Zuhause in der Fuchswelt aussehen?",10]
  ],

  5: [
    ["🎭 Erfinde einen lustigen Pokémon-Namen für dich selbst.",10],
    ["😂 Welche besondere Fähigkeit hättest du als Pokémon?",10],
    ["🎨 Erfinde eine neue Pokémon-Farbe.",10],
    ["🎤 Wie würde dein Pokémon-Trainername heißen?",10],
    ["🎮 Welches Videospiel würdest du sofort kaufen?",10],
    ["🎵 Welchen Song könntest du gerade immer wieder hören?",10],
    ["🎬 Wie würde dein Leben als Videospiel heißen?",10],
    ["🐾 Welches Videospiel-Haustier würdest du wählen?",10],
    ["🕹️ Nenne ein Spiel, das nie langweilig wird.",10],
    ["🐾 Wenn dein Haustier Mensch wäre: Welchen Beruf hätte es?",10]
  ],

  6: [
    ["🎮 Nenne dein absolutes Lieblings-Videospiel.",10],
    ["🐶 Welches Haustier würdest du heute wählen?",10],
    ["🎵 Schreibe deinen Lieblingssong.",10],
    ["🎬 Welchen Film würdest du gerne zum ersten Mal sehen?",10],
    ["🚗 GTA: Wie sähe dein eigenes Fahrzeug aus?",10],
    ["🚀 Was würdest du im Weltall unbedingt machen?",10],
    ["👻 Was würdest du in ein verlassenes Haus mitnehmen?",10],
    ["🦸 Welche Superkraft würdest du wählen?",10],
    ["🏖️ Wohin würdest du kostenlos reisen?",10],
    ["🎨 Erfinde einen Namen für einen eigenen Anime.",10]
  ]
};

function questHeute() {

  return (
    tagesquests[
      new Date().getDay()
    ] ||
    tagesquests[0]
  );
}

function questTagPruefen(w) {

  const heute =
    berlinDatum();

  if (
    w.questTag !== heute
  ) {

    w.questTag =
      heute;

    w.questIndex =
      0;

    w.questAntworten =
      [];

    w.messageCount =
      0;
  }
}

function questAnzeigen(
  username
) {

  const w =
    spieler(username);

  questTagPruefen(w);

  if (
    w.questIndex >= 10
  ) {

    return (
      `🦊 @${username} Du hast heute bereits ` +
      `alle 10 persönlichen Aufgaben abgeschlossen. ` +
      `Komm morgen wieder, da bekommst du neue Aufgaben.`
    );
  }

  const q =
    questHeute()[w.questIndex];

  return (
    `🎯 @${username} Deine persönliche Tagesquest ` +
    `${w.questIndex + 1}/10: ` +
    `${q[0]} → Belohnung: +${q[1]} XP 🦊 ` +
    `Antworte mit !antwort [deine Antwort]`
  );
}

async function questAntwort(
  username,
  antwort
) {

  const w =
    spieler(username);

  questTagPruefen(w);

  if (
    w.questIndex >= 10
  ) {

    return (
      `🦊 @${username} Du hast heute bereits ` +
      `alle 10 persönlichen Aufgaben abgeschlossen.`
    );
  }

  if (
    !antwort.trim()
  ) {

    return (
      `🦊 @${username} Bitte schreibe eine Antwort ` +
      `hinter !antwort.`
    );
  }

  const q =
    questHeute()[w.questIndex];

  const nr =
    w.questIndex + 1;

  w.questAntworten.push({
    nummer: nr,
    antwort:
      antwort.trim()
  });

  w.questIndex++;

  await xpHinzufuegen(
    username,
    q[1]
  );

  w.muenzen += 5;

  w.ruf += 1;

  chronikEintrag(
    w,
    `Tagesquest ${nr}/10 abgeschlossen`
  );

  erfolgFreischalten(
    w,
    "Erste Quest"
  );

  titelAktualisieren(w);

  if (
    nr >= 10
  ) {

    chronikEintrag(
      w,
      "Alle 10 persönlichen Tagesquests abgeschlossen"
    );

    return (
      `🎉 @${username} Du hast heute deine ` +
      `10 persönlichen Aufgaben abgeschlossen ` +
      `und +${q[1]} XP bekommen. 🦊 ` +
      `Komm morgen wieder, da bekommst du neue Aufgaben.`
    );
  }

  return (
    `🎉 @${username} Tagesquest ${nr}/10 ` +
    `erfolgreich abgeschlossen! → +${q[1]} XP 🦊 ` +
    `Schreibe !quest, wenn du deine nächste Aufgabe möchtest.`
  );
}


/* =========================================================
   🦊 PROFIL
========================================================= */

async function profil(
  username
) {

  const w =
    spieler(username);

  const p =
    await profilDB(username);

  const xp =
    Number(p?.xp || 0);

  return (
    `🦊 ${w.foxName || username} | ` +
    `${w.rudel || "❔ Noch kein Rudel"} | ` +
    `👑 ${w.titel} | ` +
    `⭐ Level ${levelAusXP(xp)} | ` +
    `${xp} XP | ` +
    `💰 ${w.muenzen}🪙 | ` +
    `⚡ ${w.energie} Energie | ` +
    `⭐ Ruf ${w.ruf} | ` +
    `🏠 ${fuchsbauStufen[w.stufe - 1]}`
  );
}


/* =========================================================
   🏡 FUCHSDORF
========================================================= */

function dorf(username) {

  const w = spieler(username);
  const gebaut = Object.keys(w.dorfBauten || {});

  return (
    `🏡 MitsusundWandasWelt – Fuchsdorf! 🦊 ` +
    `🏠 Fuchsbau • 🏪 Fuchs-Markt • ` +
    `🎯 Abenteuer-Tafel • ⚔️ Kampfplatz • ` +
    `🐾 Begleiter-Haus • 🗺️ Weltkarte • ` +
    `🌟 Dorfplatz • 🔐 Geheimarchiv • ` +
    `🌙 Tor der fünf Kräfte` +
    (gebaut.length ? ` | 🏗️ Gebaut: ${gebaut.join(", ")}` : ` | 🏗️ Noch keine eigenen Gebäude`)
  );
}


/* =========================================================
   🏠 FUCHSBAU
========================================================= */

function bau(
  username
) {

  const w =
    spieler(username);

  const slots =
    w.stufe * 10;

  const verfuegbareRaeume =
    raeume.slice(
      0,
      Math.min(
        1 + w.stufe,
        raeume.length
      )
    );

  return (
    `🏠 @${username} ${w.bauName} | ` +
    `${fuchsbauStufen[w.stufe - 1]} | ` +
    `🎒 ${slots} Lagerplätze | ` +
    `🚪 Räume: ${verfuegbareRaeume.join(", ")} | ` +
    `🎨 Deko: ${w.dekor.length}`
  );
}


/* =========================================================
   🦊 FUCHSNAME
========================================================= */

function fuchsname(
  username,
  name
) {

  const w =
    spieler(username);

  const neuerName =
    String(name || "")
      .trim()
      .slice(0, 25);

  if (!neuerName) {

    return (
      `🦊 @${username} Nutze ` +
      `!fuchsname [Name].`
    );
  }

  if (
    w.foxName &&
    w.muenzen < 500
  ) {

    return (
      `🦊 @${username} Eine Umbenennung ` +
      `kostet 500🪙.`
    );
  }

  if (w.foxName) {
    w.muenzen -= 500;
  }

  w.foxName =
    neuerName;

  chronikEintrag(
    w,
    `Fuchsname geändert: ${neuerName}`
  );

  return (
    `🦊 @${username} Dein Fuchs heißt jetzt ` +
    `${neuerName}!`
  );
}


/* =========================================================
   🏠 BAUNAME
========================================================= */

function bauname(
  username,
  name
) {

  const w =
    spieler(username);

  const neuerName =
    String(name || "")
      .trim()
      .slice(0, 30);

  if (!neuerName) {

    return (
      `🏠 @${username} Nutze ` +
      `!bauname [Name].`
    );
  }

  if (
    w.bauName !== "Mein Fuchsbau" &&
    w.muenzen < 500
  ) {

    return (
      `🏠 @${username} Eine Umbenennung ` +
      `kostet 500🪙.`
    );
  }

  if (
    w.bauName !== "Mein Fuchsbau"
  ) {
    w.muenzen -= 500;
  }

  w.bauName =
    neuerName;

  return (
    `🏠 @${username} Dein Fuchsbau heißt jetzt ` +
    `„${neuerName}“!`
  );
}


/* =========================================================
   🏪 MARKT
========================================================= */

function marktAnzeigen() {

  const auswahl =
    markt
      .slice()
      .sort(
        () => Math.random() - 0.5
      )
      .slice(0, 12);

  return (
    `🏪 Fuchs-Markt heute: ` +
    auswahl
      .map(
        item =>
          `${item[0]} ${item[1]}🪙`
      )
      .join(" | ")
  );
}


/* =========================================================
   🛍️ KAUFEN
========================================================= */

async function kaufen(
  username,
  name
) {

  const w =
    spieler(username);

  const item =
    itemFinden(name);

  if (!item) {

    return (
      `🦊 @${username} Dieses Item ` +
      `gibt es nicht im Fuchs-Markt.`
    );
  }

  if (
    w.muenzen < item[1]
  ) {

    return (
      `💰 @${username} Du hast nicht genug ` +
      `Fuchsmünzen. Preis: ${item[1]}🪙`
    );
  }

  w.muenzen -=
    item[1];

  inventarHinzufuegen(
    w,
    item[0]
  );

  chronikEintrag(
    w,
    `Gekauft: ${item[0]}`
  );

  if (
    item[2] === "box"
  ) {

    const belohnungen = [
      "Fuchslaterne",
      "Begleiter-Spielzeug",
      "Energie-Trank",
      "Alte Schatzkarte"
    ];

    const reward =
      belohnungen[
        zufall(
          0,
          belohnungen.length - 1
        )
      ];

    inventarHinzufuegen(
      w,
      reward
    );

    return (
      `📦 @${username} ${item[0]} geöffnet! ` +
      `Du bekommst ${reward}.`
    );
  }

  return (
    `🛍️ @${username} gekauft: ` +
    `${item[0]} für ${item[1]}🪙.`
  );
}


/* =========================================================
   🎒 INVENTAR
========================================================= */

function inventar(
  username
) {

  const w =
    spieler(username);

  // 🛠️ Sicherheit: ältere Spielerobjekte können noch kein Inventar besitzen.
  if (!w.inventar || typeof w.inventar !== "object") {
    w.inventar = {};
  }

  const items =
    Object.entries(
      w.inventar
    );

  if (!items.length) {

    return (
      `🎒 @${username} Dein Inventar ist leer.`
    );
  }

  return (
    `🎒 @${username} Inventar: ` +
    items
      .map(
        ([name, menge]) =>
          `${name} x${menge}`
      )
      .join(" | ")
  );
}


/* =========================================================
   🏦 BANK
========================================================= */

function bank(
  username
) {

  const w =
    spieler(username);

  return (
    `🏦 @${username} Fuchs-Bank: ` +
    `Konto ${w.bank}🪙 | ` +
    `Bargeld ${w.muenzen}🪙 | ` +
    `Tageszins 1% mit !bank zins`
  );
}

function bankAktion(
  username,
  aktion,
  menge
) {

  const w =
    spieler(username);

  const n =
    Math.max(
      0,
      Number(menge) || 0
    );

  if (
    aktion === "einzahlen"
  ) {

    if (
      w.muenzen < n
    ) {

      return (
        `🏦 @${username} Dafür hast du ` +
        `nicht genug Bargeld.`
      );
    }

    w.muenzen -= n;
    w.bank += n;

    return (
      `🏦 @${username} ${n}🪙 eingezahlt.`
    );
  }

  if (
    aktion === "abheben"
  ) {

    if (
      w.bank < n
    ) {

      return (
        `🏦 @${username} So viel liegt ` +
        `nicht auf deiner Bank.`
      );
    }

    w.bank -= n;
    w.muenzen += n;

    return (
      `🏦 @${username} ${n}🪙 abgehoben.`
    );
  }

  if (
    aktion === "zins"
  ) {

    const zins =
      Math.floor(
        w.bank * 0.01
      );

    w.bank += zins;

    return (
      `🏦 @${username} Tageszins: +${zins}🪙.`
    );
  }

  return bank(username);
}


/* =========================================================
   🎁 SCHENKEN
========================================================= */

function schenken(
  username,
  ziel,
  menge
) {

  const w =
    spieler(username);

  const empfaenger =
    spieler(ziel);

  const n =
    Math.max(
      0,
      Number(menge) || 0
    );

  if (
    w.muenzen < n
  ) {

    return (
      `💰 @${username} Du hast nicht genug Münzen.`
    );
  }

  w.muenzen -= n;
  empfaenger.muenzen += n;

  chronikEintrag(
    w,
    `${n} Münzen an ${ziel} verschenkt`
  );

  chronikEintrag(
    empfaenger,
    `${n} Münzen von ${username} erhalten`
  );

  return (
    `🎁 @${username} hat @${ziel} ` +
    `${n}🪙 geschenkt.`
  );
}


/* =========================================================
   📬 POST
========================================================= */

function post(
  username,
  ziel,
  text
) {

  const empfaenger =
    spieler(ziel);

  empfaenger.post.push({
    von: username,
    text:
      text ||
      "📬 Eine Nachricht aus der Fuchswelt"
  });

  return (
    `📬 @${username} Nachricht an ` +
    `@${ziel} zugestellt.`
  );
}


/* =========================================================
   🔄 TAUSCHPLATZ
========================================================= */

function tausch(
  username,
  ziel
) {

  const w =
    spieler(username);

  w.tausch.push({
    mit: ziel,
    status: "offen"
  });

  return (
    `🔄 @${username} hat einen Tauschplatz ` +
    `mit @${ziel} eröffnet. ` +
    `Storygebundene Gegenstände bleiben geschützt.`
  );
}


/* =========================================================
   🐾 BEGLEITER
========================================================= */

function neuerBegleiter() {

  return {

    name:
      begleiterNamen[
        zufall(
          0,
          begleiterNamen.length - 1
        )
      ] +
      zufall(1, 99),

    rarity:
      begleiterRaritaeten[
        zufall(
          0,
          begleiterRaritaeten.length - 1
        )
      ],

    level:
      "Neuling",

    persoenlichkeit:
      begleiterPersoenlichkeiten[
        zufall(
          0,
          begleiterPersoenlichkeiten.length - 1
        )
      ]
  };
}

function begleiterAnzeigen(
  username
) {

  const w =
    spieler(username);

  if (!Array.isArray(w.begleiter)) {
    w.begleiter = [];
  }

  if (!Array.isArray(w.aktiveBegleiter)) {
    w.aktiveBegleiter = [];
  }

  console.log(
    `🐾 Begleiter-Befehl für ${username}: ${w.begleiter.length} Begleiter`
  );

  if (!w.begleiter.length) {

    return (
      `🐾 @${username} Du hast noch keinen Begleiter. ` +
      `Nutze !begleiterabenteuer, um deinen ersten Begleiter zu finden.`
    );
  }

  const aktive =
    w.aktiveBegleiter.length
      ? ` | Aktiv: ${w.aktiveBegleiter.join(", ")}`
      : ` | Noch kein Begleiter aktiv`;

  return (
    `🐾 @${username} Deine Begleiter: ` +
    w.begleiter
      .map(
        b =>
          `${b.name} (${b.rarity}, ${b.level}, ${b.persoenlichkeit})`
      )
      .join(" | ") +
    aktive +
    ` | Auswahl: !begleiterwahl [Name]`
  );
}

function begleiterInfo(
  username,
  name
) {

  const w =
    spieler(username);

  const b =
    w.begleiter.find(
      x =>
        normalisieren(x.name) ===
        normalisieren(name)
    );

  if (!b) {

    return (
      `🐾 @${username} Begleiter nicht gefunden.`
    );
  }

  return (
    `🐾 ${b.name}: ` +
    `${b.rarity} | ` +
    `Persönlichkeit: ${b.persoenlichkeit} | ` +
    `Stufe: ${b.level}`
  );
}

function begleiterWahl(
  username,
  name
) {

  const w =
    spieler(username);

  if (!Array.isArray(w.begleiter)) {
    w.begleiter = [];
  }

  if (!Array.isArray(w.aktiveBegleiter)) {
    w.aktiveBegleiter = [];
  }

  console.log(
    `🐾 Begleiterwahl für ${username}: ${name || "keine Auswahl"}`
  );

  if (!name || !name.trim()) {

    if (!w.begleiter.length) {
      return (
        `🐾 @${username} Du hast noch keinen Begleiter. ` +
        `Nutze zuerst !begleiterabenteuer.`
      );
    }

    return (
      `🐾 @${username} Wähle einen Begleiter: ` +
      w.begleiter.map(b => b.name).join(", ") +
      `. Beispiel: !begleiterwahl ${w.begleiter[0].name}`
    );
  }

  const b =
    w.begleiter.find(
      x =>
        normalisieren(x.name) ===
        normalisieren(name.trim())
    );

  if (!b) {

    return (
      `🐾 @${username} Begleiter nicht gefunden. ` +
      `Deine Auswahl: ${w.begleiter.map(x => x.name).join(", ") || "noch keiner"}.`
    );
  }

  const max =
    w.stufe >= 5
      ? 3
      : w.stufe >= 3
        ? 2
        : 1;

  if (
    w.aktiveBegleiter.length >= max &&
    !w.aktiveBegleiter.includes(b.name)
  ) {

    return (
      `🐾 @${username} Dein Fuchsbau erlaubt ` +
      `aktuell ${max} aktive Begleiter.`
    );
  }

  if (!w.aktiveBegleiter.includes(b.name)) {
    w.aktiveBegleiter.push(b.name);
  }

  return (
    `🐾 @${username} ${b.name} ist jetzt aktiv! 🐾`
  );
}

function begleiterFuettern(
  username
) {

  const w =
    spieler(username);

  if (
    !w.begleiter.length
  ) {

    return (
      `🐾 @${username} Du hast noch keinen Begleiter.`
    );
  }

  w.freundschaft++;
  w.ruf++;

  return (
    `❤️ @${username} Deine Begleiter freuen ` +
    `sich über das Leckerli! Freundschaft +1.`
  );
}

function begleiterFaehigkeit(
  username
) {

  const w =
    spieler(username);

  if (
    !w.aktiveBegleiter.length
  ) {

    return (
      `🐾 @${username} Aktiviere zuerst ` +
      `einen Begleiter mit !begleiterwahl [Name].`
    );
  }

  w.ruf++;

  return (
    `✨ @${username} Dein Begleiter setzt ` +
    `seine Spezialfähigkeit ein! +1 Ruf.`
  );
}


/* =========================================================
   🗺️ ABENTEUER
========================================================= */

async function abenteuer(
  username
) {

  const w =
    spieler(username);

  if (
    w.energie < 10
  ) {

    return (
      `⚡ @${username} Du brauchst mindestens ` +
      `10 Energie.`
    );
  }

  w.energie -= 10;

  const coins =
    zufall(10, 60);

  const xp =
    zufall(10, 50);

  const funde = [
    "🍃 seltsame Blätter",
    "🪨 einen alten Stein",
    "🗝️ einen kleinen Schlüssel",
    "💎 einen glitzernden Kristall",
    "📜 eine alte Karte"
  ];

  const fund =
    funde[
      zufall(
        0,
        funde.length - 1
      )
    ];

  w.muenzen += coins;
  w.ruf++;

  inventarHinzufuegen(
    w,
    fund
  );

  if (
    !w.entdeckungen.includes(fund)
  ) {

    w.entdeckungen.push(
      fund
    );
  }

  if (
    w.storyIndex < story.length
  ) {

    w.storyIndex++;
  }

  await xpHinzufuegen(
    username,
    xp
  );

  chronikEintrag(
    w,
    "Abenteuer gestartet"
  );

  let extra = "";

  if (
    tageszeit().includes("Nacht") &&
    zufall(1, 4) === 1
  ) {

    extra =
      " 🌑 Der Schattenfuchs wurde gesehen!";
  }

  if (
    w.storyIndex >=
    story.length - 1
  ) {

    extra +=
      " 🚪 Die Spur endet an einer verschlossenen Unterwassertür.";
  }

  return (
    `🗺️ @${username} Abenteuer beendet: ` +
    `${fund} • +${coins}🪙 • +${xp} XP • ` +
    `⚡ -10${extra}`
  );
}


/* =========================================================
   🗺️ WELTKARTE
========================================================= */

function karte() {

  return (
    `🗺️ Fuchs-Weltkarte: ` +
    `🏡 Fuchsdorf | ` +
    `🌋 Feuertal | ` +
    `🌊 Wasserlande | ` +
    `🌲 Fuchswald | ` +
    `❄️ Eisberge | ` +
    `🌌 Verborgene Tal | ` +
    `🚪 verschlossene Unterwassertür`
  );
}


/* =========================================================
   👹 WESEN
========================================================= */

function wesenAnzeigen() {

  return (
    `👹 Wesen der Fuchswelt: ` +
    wesen.join(" | ") +
    ` | 🌑 Schattenfuchs erscheint nur nachts.`
  );
}


/* =========================================================
   🌦️ WETTER
========================================================= */

function wetterAnzeigen() {

  return (
    `🌦️ ${jahreszeit()} • ` +
    `${tageszeit()} • ` +
    `${wetter()}`
  );
}


/* =========================================================
   🔎 GEHEIMNIS
========================================================= */

function geheimnis(
  username
) {

  const w =
    spieler(username);

  if (
    w.storyIndex < 8
  ) {

    return (
      `🔎 @${username} Im Geheimnisarchiv ` +
      `liegt noch vieles verborgen. ` +
      `Dein nächster Hinweis wartet in den Abenteuern.`
    );
  }

  return (
    `🔎 @${username} Die Spur führt weiter: ` +
    `🌳 → 🌙 → 💧 → 🚪`
  );
}


/* =========================================================
   🗿 FUCHSSTATUR
========================================================= */

function fuchsstatur(
  username
) {

  const w =
    spieler(username);

  const start =
    9;

  const ende =
    Math.min(
      story.length,
      start + Math.max(
        1,
        w.storyIndex
      )
    );

  const texte =
    story.slice(
      start,
      ende
    );

  if (!texte.length) {

    return (
      `🗿 @${username} Ihr seid gekommen … ` +
      `so, wie der Urfuchs es vorausgesehen hat.`
    );
  }

  return (
    `🗿 @${username} Fuchsstatur: ` +
    texte.join(" | ")
  );
}


/* =========================================================
   🌙 TOR DER FÜNF KRÄFTE
========================================================= */

function torDerFuenfKraefte(
  username
) {

  const w =
    spieler(username);

  if (
    w.storyIndex < 8
  ) {

    return (
      `🌙 @${username} Das Tor der fünf Kräfte ` +
      `ist noch verschlossen. Suche weiter nach den vier Kräften.`
    );
  }

  w.tor =
    true;

  return (
    `🌙 @${username} Das Tor der fünf Kräfte reagiert! ` +
    `Vier bekannte Kräfte und ein unbekannter fünfter Platz leuchten.`
  );
}


/* =========================================================
   🌟 SCHICKSAL
========================================================= */

function schicksalAnzeigen(
  username,
  name
) {

  const w =
    spieler(username);

  if (name) {

    const pfad =
      schicksal.find(
        x =>
          normalisieren(x)
            .includes(
              normalisieren(name)
            )
      );

    if (
      pfad &&
      !w.schicksal.includes(pfad)
    ) {

      w.schicksal.push(
        pfad
      );

      chronikEintrag(
        w,
        `Schicksalspfad gewählt: ${pfad}`
      );
    }
  }

  return (
    `🌟 @${username} Deine Fuchs-Schicksalspfade: ` +
    `${
      w.schicksal.length
        ? w.schicksal.join(" • ")
        : "Noch keine gewählt"
    }`
  );
}


/* =========================================================
   🏅 ERFOLGE
========================================================= */

function erfolgeAnzeigen(
  username
) {

  const w =
    spieler(username);

  return (
    `🏅 @${username} Fuchs-Erfolge: ` +
    `${
      w.erfolge.length
        ? w.erfolge.join(" • ")
        : "Noch keine"
    }`
  );
}


/* =========================================================
   📖 CHRONIK
========================================================= */

function chronikAnzeigen(
  username
) {

  const w =
    spieler(username);

  return (
    `📖 @${username} Fuchs-Chronik: ` +
    `${
      w.chronik.length
        ? w.chronik.slice(0, 5).join(" | ")
        : "Noch leer"
    }`
  );
}


/* =========================================================
   📚 ARCHIV
========================================================= */

function archivAnzeigen() {

  return (
    `📚 Fuchs-Archiv: ` +
    `Hier wird die gemeinsame Geschichte ` +
    `von MitsusundWandasWelt gesammelt. ` +
    `Unbekannte Dinge erscheinen als ❓.`
  );
}


/* =========================================================
   📖 ENTDECKUNGSBUCH
========================================================= */

function entdeckungenAnzeigen(
  username
) {

  const w =
    spieler(username);

  return (
    `📖 @${username} Fuchs-Entdeckungsbuch: ` +
    `${
      w.entdeckungen.length
        ? w.entdeckungen.join(" • ")
        : "❓ Noch keine Entdeckungen"
    }`
  );
}


/* =========================================================
   ⭐ FUCHS-RUF
========================================================= */

function rufAnzeigen(
  username
) {

  const w =
    spieler(username);

  return (
    `⭐ @${username} Dein Fuchs-Ruf beträgt ` +
    `${w.ruf}.`
  );
}


/* =========================================================
   🏆 RUHMESHALLE
========================================================= */

function ruhmeshalle(
  username
) {

  const w =
    spieler(username);

  return (
    `🏆 @${username} Fuchs-Ruhmeshalle: ` +
    `${
      w.ruhmeshalle.length
        ? w.ruhmeshalle.join(" • ")
        : "Noch keine besonderen historischen Momente."
    }`
  );
}


/* =========================================================
   ⭐ LEGENDEN
========================================================= */

function legenden(
  username
) {

  const w =
    spieler(username);

  return (
    `⭐ @${username} Fuchs-Legenden: ` +
    `${
      w.legenden.length
        ? w.legenden.join(" • ")
        : "Noch keine Legenden."
    }`
  );
}


/* =========================================================
   ❤️ FUCHSKERN
========================================================= */

function fuchskern(
  username
) {

  const w =
    spieler(username);

  w.fuchskern++;

  return (
    `❤️ @${username} Dein Fuchskern leuchtet! ` +
    `Fuchskern-Stufe ${w.fuchskern}.`
  );
}


/* =========================================================
   🎉 EVENTS
========================================================= */

function event() {

  const events = [
    "🌋 Feuertal-Eruption",
    "❄️ Eissturm",
    "👹 Wesen-Event",
    "🌙 Urfuchs-Nacht",
    "🎉 Fuchsdorf-Festival"
  ];

  return (
    `🎉 Aktuelles Fuchs-Event: ` +
    events[
      zufall(
        0,
        events.length - 1
      )
    ] +
    `! Mit !eventmitmachen kannst du teilnehmen.`
  );
}

function eventMitmachen(
  username
) {

  const w =
    spieler(username);

  const coins =
    zufall(20, 80);

  w.muenzen +=
    coins;

  w.ruf += 2;

  return (
    `🎉 @${username} Du bist beim Event dabei! ` +
    `+${coins}🪙 und +2 Ruf.`
  );
}

function eventStatus(
  username
) {

  const w =
    spieler(username);

  return (
    `🎉 @${username} Eventstatus: ` +
    `aktiv • Ruf ${w.ruf} • Energie ${w.energie}`
  );
}


/* =========================================================
   🤝 TEAMS
========================================================= */

const teams =
  new Map();

function teamAnzeigen(
  username
) {

  const u =
    normalisieren(username);

  const meineTeams =
    [...teams.values()]
      .filter(
        t =>
          t.members.includes(u)
      );

  return (
    `🤝 @${username} Fuchs-Teams: ` +
    `${
      meineTeams.length
        ? meineTeams
            .map(t => t.name)
            .join(", ")
        : "Du bist noch in keinem Team."
    }`
  );
}

function teamGruenden(
  username,
  name
) {

  const teamName =
    String(name || "")
      .trim()
      .slice(0, 30);

  if (!teamName) {

    return (
      `🤝 @${username} Nutze ` +
      `!teamgründen [Name].`
    );
  }

  if (
    teams.has(
      normalisieren(teamName)
    )
  ) {

    return (
      `🤝 @${username} Dieses Team gibt es schon.`
    );
  }

  teams.set(
    normalisieren(teamName),
    {
      name: teamName,
      leader:
        normalisieren(username),
      members: [
        normalisieren(username)
      ],
      aufgaben: 0,
      treasury: 0
    }
  );

  spieler(username).teams.push(
    teamName
  );

  return (
    `🤝 Team „${teamName}“ wurde gegründet! ` +
    `@${username} ist Teamleiter.`
  );
}

function teamEinladen(
  username,
  ziel
) {

  const team =
    [...teams.values()]
      .find(
        t =>
          t.members.includes(
            normalisieren(username)
          )
      );

  if (!team) {

    return (
      `🤝 @${username} Du bist in keinem Team.`
    );
  }

  return (
    `🤝 @${username} @${ziel} wurde ` +
    `für Team „${team.name}“ eingeladen.`
  );
}

function teamBeitreten(
  username,
  name
) {

  const team =
    teams.get(
      normalisieren(name)
    );

  if (!team) {

    return (
      `🤝 @${username} Team nicht gefunden.`
    );
  }

  const u =
    normalisieren(username);

  if (
    !team.members.includes(u)
  ) {

    team.members.push(u);
  }

  if (
    !spieler(username).teams.includes(
      team.name
    )
  ) {

    spieler(username).teams.push(
      team.name
    );
  }

  return (
    `🤝 @${username} ist Team „${team.name}“ beigetreten!`
  );
}

function teamVerlassen(
  username
) {

  const team =
    [...teams.values()]
      .find(
        t =>
          t.members.includes(
            normalisieren(username)
          )
      );

  if (!team) {

    return (
      `🤝 @${username} Du bist in keinem Team.`
    );
  }

  team.members =
    team.members.filter(
      x =>
        x !== normalisieren(username)
    );

  return (
    `🤝 @${username} hat Team ` +
    `„${team.name}“ verlassen.`
  );
}

function teamAufgaben(
  username
) {

  const team =
    [...teams.values()]
      .find(
        t =>
          t.members.includes(
            normalisieren(username)
          )
      );

  if (!team) {

    return (
      `🤝 @${username} Du bist in keinem Team.`
    );
  }

  team.aufgaben++;

  return (
    `🤝 Team „${team.name}“: ` +
    `Aufgabe ${team.aufgaben} abgeschlossen.`
  );
}


/* =========================================================
   ⚔️ PVP
========================================================= */

const pvpPending =
  new Map();

let aktuellerPvpKampf =
  null;

async function pvpStart(
  username,
  ziel
) {

  const a =
    normalisieren(username);

  const b =
    normalisieren(ziel);

  if (
    a === b
  ) {

    return (
      `🦊 @${username} Du kannst dich ` +
      `nicht selbst herausfordern.`
    );
  }

  pvpPending.set(
    b,
    {
      von: a,
      typ: "fuchs"
    }
  );

  if (
    b ===
    "fuchsmissvegetalover2_0"
  ) {

    return kampfAnnehmen(
      b
    );
  }

  return (
    `⚔️ @${username} fordert @${ziel} ` +
    `zum Fuchsduell heraus! @${ziel} nutze !annehmen.`
  );
}

async function kampfAnnehmen(
  username
) {

  const u =
    normalisieren(username);

  const pending =
    pvpPending.get(u);

  if (!pending) {

    return (
      `⚔️ @${username} Es wartet keine ` +
      `Herausforderung auf dich.`
    );
  }

  pvpPending.delete(u);

  const angreifer =
    pending.von;

  const verteidiger =
    u;

  const gewinner =
    Math.random() < 0.5
      ? angreifer
      : verteidiger;

  const wa =
    spieler(angreifer);

  const wb =
    spieler(verteidiger);

  await xpHinzufuegen(
    gewinner,
    100
  );

  spieler(gewinner).muenzen += 50;

  spieler(gewinner).ruf += 2;

  aktuellerPvpKampf = {

    typ: "fuchs",

    angreifer,

    verteidiger,

    gewinner,

    angreiferRudel:
      wa.rudel || "",

    verteidigerRudel:
      wb.rudel || "",

    zeit:
      Date.now()
  };

  chronikEintrag(
    wa,
    `Fuchsduell gegen ${verteidiger}`
  );

  chronikEintrag(
    wb,
    `Fuchsduell gegen ${angreifer}`
  );

  return (
    `🏆 Fuchsduell! @${gewinner} gewinnt ` +
    `+100 XP +50🪙!`
  );
}


/* =========================================================
   ⚡ POKÉMON-KAMPF
========================================================= */

async function pokemonKampf(
  username,
  ziel
) {

  const a =
    normalisieren(username);

  const b =
    normalisieren(ziel);

  const pa =
    eigenePokemon[a] ||
    spieler(a).pokemon ||
    pokemonListe[
      zufall(
        0,
        pokemonListe.length - 1
      )
    ];

  const pb =
    eigenePokemon[b] ||
    spieler(b).pokemon ||
    pokemonListe[
      zufall(
        0,
        pokemonListe.length - 1
      )
    ];

  const gewinner =
    Math.random() < 0.5
      ? a
      : b;

  await xpHinzufuegen(
    gewinner,
    100
  );

  spieler(gewinner).muenzen += 50;

  aktuellerPvpKampf = {

    typ: "pokemon",

    angreifer: a,

    verteidiger: b,

    gewinner,

    angreiferPokemon: pa,

    verteidigerPokemon: pb,

    zeit:
      Date.now()
  };

  return (
    `⚡ POKÉMON-KAMPF! ` +
    `@${a} ${pa} ⚔️ @${b} ${pb} → ` +
    `🏆 @${gewinner} gewinnt +100 XP +50🪙!`
  );
}


/* =========================================================
   🐾 POKÉMON WÄHLEN
========================================================= */

function pokemonWahl(
  username,
  name
) {

  const w =
    spieler(username);

  if (!name) {

    return (
      `🐾 @${username} Dein Pokémon ist ` +
      `${eigenePokemon[
        normalisieren(username)
      ] || w.pokemon || "noch nicht gewählt"}.`
    );
  }

  const pokemon =
    pokemonListe.find(
      x =>
        normalisieren(x) ===
        normalisieren(name)
    );

  if (!pokemon) {

    return (
      `🐾 @${username} Pokémon nicht gefunden. ` +
      `Beispiele: ${pokemonListe.slice(0, 6).join(", ")}.`
    );
  }

  w.pokemon =
    pokemon;

  return (
    `🐾 @${username} Dein Pokémon ist jetzt ` +
    `${pokemon}!`
  );
}


/* =========================================================
   🐾 RUDELWAHL
========================================================= */

function rudelWahl(
  username,
  name
) {

  const w =
    spieler(username);

  const such =
    normalisieren(name);

  const schluessel =
    Object.keys(rudel)
      .find(
        x =>
          such.includes(x)
      );

  if (!schluessel) {

    return (
      `🦊 @${username} Wähle: ` +
      `feuer, wasser, wald oder ice.`
    );
  }

  w.rudel =
    rudel[schluessel];

  chronikEintrag(
    w,
    `Rudel gewählt: ${rudel[schluessel]}`
  );

  return (
    `🌟 @${username} Du bist jetzt im ` +
    `${rudel[schluessel]}! ` +
    `Dein Gebiet: ${gebiete[schluessel]}.`
  );
}


/* =========================================================
   🧭 HILFE
========================================================= */

function hilfe() {

  return (
    `🦊 MitsusundWandasWelt: ` +
    `!profil !xp !quest !antwort ` +
    `!dorf !bau !bauen !fish !fuchsname !bauname ` +
    `!markt !kaufen !inventar !inv !bank ` +
    `!schenken !post !tausch ` +
    `!begleiter !begleiterinfo !begleiterwahl ` +
    `!begleiterfüttern !begleiterabenteuer ` +
    `!begleiterfähigkeit !abenteuer !karte ` +
    `!entdeckungen !wesen !geheimnis !fuchsstatur ` +
    `!wetter !tor !erfolge !chronik !archiv ` +
    `!schicksal !rudel !rudelwahl !pokemon ` +
    `!pokekampf !pvp !annehmen ` +
    `!team !teamgründen !teameinladen ` +
    `!teambeitreten !teamverlassen !teamaufgaben ` +
    `!event !eventmitmachen !eventstatus ` +
    `!ruhmeshalle !legenden !fuchskern`
  );
}


/* =========================================================
   💬 CHAT VERARBEITEN
========================================================= */

async function chatVerarbeiten(
  message
) {

  if (
    message.type !== "message"
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
    data?.message?.text ||
    data?.text ||
    "";

  if (
    !text.trim()
  ) {
    return;
  }

  console.log(
    `💬 ${username}: ${text}`
  );

  await aktivitaetSpeichern(
    username
  );

  const w =
    spieler(username);

  w.messageCount++;

  try {

    let match;
    let antwort = null;


    /* !XP */

    if (
      /^!xp$/i.test(text.trim())
    ) {

      const p =
        await profilDB(username);

      const xp =
        Number(p?.xp || 0);

      antwort =
        `🦊 @${username} Du hast ${xp} XP ` +
        `und bist Level ${levelAusXP(xp)}!`;
    }


    /* !QUEST */

    else if (
      /^!quest$/i.test(
        text.trim()
      )
    ) {

      antwort =
        questAnzeigen(username);
    }


    /* !ANTWORT */

    else if (
      /^!antwort\s+/i.test(text)
    ) {

      antwort =
        await questAntwort(
          username,
          text.replace(
            /^!antwort\s+/i,
            ""
          )
        );
    }


    /* !PROFIL */

    else if (
      /^!profil$/i.test(
        text.trim()
      )
    ) {

      antwort =
        await profil(username);
    }


    /* !HILFE */

    else if (
      /^!hilfe$/i.test(
        text.trim()
      ) ||
      /^!allebefehle$/i.test(
        text.trim()
      )
    ) {

      antwort =
        hilfe();
    }


    /* !DORF */

    else if (
      /^!dorf$/i.test(
        text.trim()
      )
    ) {

      antwort =
        dorf(username);
    }


    /* !BAU */

    else if (
      /^!bau(?:\s+(.+))?$/i.test(text)
    ) {

      match =
        text.match(
          /^!bau(?:\s+(.+))?$/i
        );

      const ziel =
        match?.[1];

      antwort =
        bau(
          ziel || username
        );
    }


    /* !FUCHSNAME */

    else if (
      /^!fuchsname\s+(.+)$/i.test(text)
    ) {

      match =
        text.match(
          /^!fuchsname\s+(.+)$/i
        );

      antwort =
        fuchsname(
          username,
          match[1]
        );
    }


    /* !BAUNAME */

    else if (
      /^!bauname\s+(.+)$/i.test(text)
    ) {

      match =
        text.match(
          /^!bauname\s+(.+)$/i
        );

      antwort =
        bauname(
          username,
          match[1]
        );
    }


    /* !MARKT */

    else if (
      /^!markt$/i.test(
        text.trim()
      )
    ) {

      antwort =
        marktAnzeigen();
    }


    /* !KAUFEN */

    else if (
      /^!kaufen\s+(.+)$/i.test(text)
    ) {

      match =
        text.match(
          /^!kaufen\s+(.+)$/i
        );

      antwort =
        await kaufen(
          username,
          match[1]
        );
    }


    /* !INVENTAR / !INV */

    else if (
      /^(?:!inventar|!inv)$/i.test(
        text.trim()
      )
    ) {

      antwort =
        inventar(username);
    }


    /* !BANK */

    else if (
      /^!bank(?:\s+(einzahlen|abheben|zins)\s*(\d+)?)?$/i.test(text)
    ) {

      match =
        text.match(
          /^!bank(?:\s+(einzahlen|abheben|zins)\s*(\d+)?)?$/i
        );

      antwort =
        match?.[1]
          ? bankAktion(
              username,
              match[1].toLowerCase(),
              match[2]
            )
          : bank(username);
    }


    /* !SCHENKEN */

    else if (
      /^!schenken\s+@?\w+\s+\d+$/i.test(text)
    ) {

      match =
        text.match(
          /^!schenken\s+@?([\w]+)\s+(\d+)$/i
        );

      antwort =
        schenken(
          username,
          match[1],
          match[2]
        );
    }


    /* !POST */

    else if (
      /^!post\s+@?\w+(?:\s+.*)?$/i.test(text)
    ) {

      match =
        text.match(
          /^!post\s+@?([\w]+)(?:\s+(.+))?$/i
        );

      antwort =
        post(
          username,
          match[1],
          match[2]
        );
    }


    /* !TAUSCH */

    else if (
      /^!tausch\s+@?\w+$/i.test(text)
    ) {

      match =
        text.match(
          /^!tausch\s+@?([\w]+)$/i
        );

      antwort =
        tausch(
          username,
          match[1]
        );
    }


    /* !BEGLEITER */

    else if (
      /^!begleiter$/i.test(
        text.trim()
      )
    ) {

      antwort =
        begleiterAnzeigen(
          username
        );
    }


    /* !BEGLEITERINFO */

    else if (
      /^!begleiterinfo\s+(.+)$/i.test(text)
    ) {

      match =
        text.match(
          /^!begleiterinfo\s+(.+)$/i
        );

      antwort =
        begleiterInfo(
          username,
          match[1]
        );
    }


    /* !BEGLEITERWAHL */

    else if (
      /^!begleiterwahl(?:\s+(.+))?$/i.test(text.trim())
    ) {

      match =
        text.match(
          /^!begleiterwahl(?:\s+(.+))?$/i
        );

      antwort =
        begleiterWahl(
          username,
          match?.[1] || ""
        );
    }


    /* !BEGLEITERFÜTTERN */

    else if (
      /^!begleiterfüttern$/i.test(
        text.trim()
      )
    ) {

      antwort =
        begleiterFuettern(
          username
        );
    }


    /* !BEGLEITERFÄHIGKEIT */

    else if (
      /^!begleiterfähigkeit$/i.test(
        text.trim()
      )
    ) {

      antwort =
        begleiterFaehigkeit(
          username
        );
    }


    /* !BEGLEITERABENTEUER */

    else if (
      /^!begleiterabenteuer$/i.test(
        text.trim()
      )
    ) {

      if (
        !w.begleiter.length
      ) {

        w.begleiter.push(
          neuerBegleiter()
        );

        chronikEintrag(
          w,
          `Erster Begleiter gefunden: ${w.begleiter[0].name}`
        );

        erfolgFreischalten(
          w,
          "Erster Gefährte"
        );

        titelAktualisieren(w);
      }

      antwort =
        `🐾 @${username} Begleiter-Abenteuer: ` +
        `${w.begleiter[0].name} hat eine neue Spur entdeckt!`;
    }


    /* !FISH */

    else if (
      /^!fish$/i.test(
        text.trim()
      )
    ) {

      antwort =
        fish(username);
    }


    /* !BAUEN */

    else if (
      /^!bauen(?:\s+(.+))?$/i.test(text)
    ) {

      match =
        text.match(
          /^!bauen(?:\s+(.+))?$/i
        );

      antwort =
        bauen(
          username,
          match?.[1] || ""
        );
    }


    /* !ABENTEUER */

    else if (
      /^!abenteuer$/i.test(
        text.trim()
      )
    ) {

      antwort =
        await abenteuer(
          username
        );
    }


    /* !KARTE */

    else if (
      /^!karte$/i.test(
        text.trim()
      )
    ) {

      antwort =
        karte();
    }


    /* !ENTDECKUNGEN */

    else if (
      /^!entdeckungen$/i.test(
        text.trim()
      )
    ) {

      antwort =
        entdeckungenAnzeigen(
          username
        );
    }


    /* !WESEN */

    else if (
      /^!wesen$/i.test(
        text.trim()
      )
    ) {

      antwort =
        wesenAnzeigen();
    }


    /* !GEHEIMNIS */

    else if (
      /^!geheimnis$/i.test(
        text.trim()
      )
    ) {

      antwort =
        geheimnis(
          username
        );
    }


    /* !FUCHSSTATUR */

    else if (
      /^!fuchsstatur$/i.test(
        text.trim()
      )
    ) {

      antwort =
        fuchsstatur(
          username
        );
    }


    /* !WETTER */

    else if (
      /^!wetter$/i.test(
        text.trim()
      )
    ) {

      antwort =
        wetterAnzeigen();
    }


    /* !TOR */

    else if (
      /^!tor$/i.test(
        text.trim()
      )
    ) {

      antwort =
        torDerFuenfKraefte(
          username
        );
    }


    /* !ERFOLGE */

    else if (
      /^!erfolge$/i.test(
        text.trim()
      )
    ) {

      antwort =
        erfolgeAnzeigen(
          username
        );
    }


    /* !CHRONIK */

    else if (
      /^!chronik$/i.test(
        text.trim()
      )
    ) {

      antwort =
        chronikAnzeigen(
          username
        );
    }


    /* !ARCHIV */

    else if (
      /^!archiv$/i.test(
        text.trim()
      )
    ) {

      antwort =
        archivAnzeigen();
    }


    /* !RUHMESHALLE */

    else if (
      /^!ruhmeshalle$/i.test(
        text.trim()
      )
    ) {

      antwort =
        ruhmeshalle(
          username
        );
    }


    /* !LEGENDEN */

    else if (
      /^!legenden$/i.test(
        text.trim()
      )
    ) {

      antwort =
        legenden(
          username
        );
    }


    /* !FUCHSKERN */

    else if (
      /^!fuchskern$/i.test(
        text.trim()
      )
    ) {

      antwort =
        fuchskern(
          username
        );
    }


    /* !RUF */

    else if (
      /^!ruf$/i.test(
        text.trim()
      )
    ) {

      antwort =
        rufAnzeigen(
          username
        );
    }


    /* !SCHICKSAL */

    else if (
      /^!schicksal(?:\s+(.+))?$/i.test(text)
    ) {

      match =
        text.match(
          /^!schicksal(?:\s+(.+))?$/i
        );

      antwort =
        schicksalAnzeigen(
          username,
          match?.[1]
        );
    }


    /* !RUDEL */

    else if (
      /^!rudel$/i.test(
        text.trim()
      )
    ) {

      antwort =
        `🐾 @${username} ${
          w.rudel ||
          "Noch kein Rudel"
        }`;
    }


    /* !RUDELWAHL */

    else if (
      /^!rudelwahl\s+(.+)$/i.test(text)
    ) {

      match =
        text.match(
          /^!rudelwahl\s+(.+)$/i
        );

      antwort =
        rudelWahl(
          username,
          match[1]
        );
    }


    /* !POKEMON */

    else if (
      /^!pokemon(?:\s+(.+))?$/i.test(text)
    ) {

      match =
        text.match(
          /^!pokemon(?:\s+(.+))?$/i
        );

      antwort =
        pokemonWahl(
          username,
          match?.[1]
        );
    }


    /* !POKEKAMPF */

    else if (
      /^!pokekampf\s+@?\w+$/i.test(text)
    ) {

      match =
        text.match(
          /^!pokekampf\s+@?([\w]+)$/i
        );

      antwort =
        await pokemonKampf(
          username,
          match[1]
        );
    }


    /* !PVP */

    else if (
      /^!pvp\s+@?\w+$/i.test(text)
    ) {

      match =
        text.match(
          /^!pvp\s+@?([\w]+)$/i
        );

      antwort =
        await pvpStart(
          username,
          match[1]
        );
    }


    /* !ANNEHMEN */

    else if (
      /^!annehmen$/i.test(
        text.trim()
      )
    ) {

      antwort =
        await kampfAnnehmen(
          username
        );
    }


    /* !KAMPF */

    else if (
      /^!kampf$/i.test(
        text.trim()
      )
    ) {

      antwort =
        `⚔️ @${username} Starte ein ` +
        `Fuchsduell mit !pvp @Name.`;
    }


    /* !ANGRIFF */

    else if (
      /^!angriff$/i.test(
        text.trim()
      )
    ) {

      antwort =
        `⚔️ @${username} Angriff registriert!`;
    }


    /* !VERTEIDIGEN */

    else if (
      /^!verteidigen$/i.test(
        text.trim()
      )
    ) {

      antwort =
        `🛡️ @${username} Verteidigung registriert!`;
    }


    /* !SPEZIAL */

    else if (
      /^!spezial$/i.test(
        text.trim()
      )
    ) {

      w.energie =
        Math.min(
          100,
          w.energie + 25
        );

      antwort =
        `✨ @${username} Fuchs-Spezial! ` +
        `+25 Energie.`;
    }


    /* !BEGLEITERKAMPF */

    else if (
      /^!begleiterkampf$/i.test(
        text.trim()
      )
    ) {

      antwort =
        `🐾⚔️ @${username} Begleiterkampf bereit! ` +
        `Nutze !begleiterfähigkeit.`;
    }


    /* !TEAM */

    else if (
      /^!team$/i.test(
        text.trim()
      )
    ) {

      antwort =
        teamAnzeigen(
          username
        );
    }


    /* !TEAMGRÜNDEN */

    else if (
      /^!teamgründen\s+(.+)$/i.test(text)
    ) {

      match =
        text.match(
          /^!teamgründen\s+(.+)$/i
        );

      antwort =
        teamGruenden(
          username,
          match[1]
        );
    }


    /* !TEAMEINLADEN */

    else if (
      /^!teameinladen\s+@?\w+$/i.test(text)
    ) {

      match =
        text.match(
          /^!teameinladen\s+@?([\w]+)$/i
        );

      antwort =
        teamEinladen(
          username,
          match[1]
        );
    }


    /* !TEAMBEITRETEN */

    else if (
      /^!teambeitreten\s+(.+)$/i.test(text)
    ) {

      match =
        text.match(
          /^!teambeitreten\s+(.+)$/i
        );

      antwort =
        teamBeitreten(
          username,
          match[1]
        );
    }


    /* !TEAMVERLASSEN */

    else if (
      /^!teamverlassen$/i.test(
        text.trim()
      )
    ) {

      antwort =
        teamVerlassen(
          username
        );
    }


    /* !TEAMAUFGABEN */

    else if (
      /^!teamaufgaben$/i.test(
        text.trim()
      )
    ) {

      antwort =
        teamAufgaben(
          username
        );
    }


    /* !EVENT */

    else if (
      /^!event$/i.test(
        text.trim()
      )
    ) {

      antwort =
        event();
    }


    /* !EVENTMITMACHEN */

    else if (
      /^!eventmitmachen$/i.test(
        text.trim()
      )
    ) {

      antwort =
        eventMitmachen(
          username
        );
    }


    /* !EVENTSTATUS */

    else if (
      /^!eventstatus$/i.test(
        text.trim()
      )
    ) {

      antwort =
        eventStatus(
          username
        );
    }


    else {

      return;
    }


    if (
      antwort
    ) {

      await streamelementsSenden(
        antwort
      );

    }

  } catch (error) {

    console.error(
      "❌ Chat-Fehler:",
      error.message
    );

    await streamelementsSenden(
      `⚠️ @${username} In der Fuchswelt ist gerade ein kleiner Fehler passiert.`
    );
  }
}


/* =========================================================
   🌐 HTTP SERVER
========================================================= */

const server =
  http.createServer(
    async (req, res) => {

      try {

        /* START */

        if (
          req.url === "/"
        ) {

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


        /* PVP DATEN */

        if (
          req.url === "/pvp-data"
        ) {

          res.writeHead(
            200,
            {
              "Content-Type":
                "application/json; charset=utf-8",

              "Cache-Control":
                "no-store"
            }
          );

          res.end(
            JSON.stringify({
              kampf:
                aktuellerPvpKampf
            })
          );

          return;
        }


        /* PVP OVERLAY */

        if (
          req.url === "/pvp"
        ) {

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

<meta
name="viewport"
content="width=device-width,initial-scale=1.0"
>

<title>Fuchswelt PvP</title>

<style>

html,
body{
margin:0;
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
min-width:620px;
max-width:90vw;
padding:25px;
border-radius:25px;
background:rgba(20,20,20,.92);
color:white;
text-align:center;
}

.title{
font-size:34px;
font-weight:900;
}

.fighters{
display:flex;
justify-content:center;
align-items:center;
gap:22px;
margin-top:20px;
}

.fighter{
min-width:220px;
padding:18px;
border-radius:18px;
background:rgba(255,255,255,.08);
}

.name{
font-size:25px;
font-weight:800;
}

.detail{
font-size:20px;
margin-top:8px;
}

.vs{
font-size:35px;
}

.winner{
margin-top:20px;
font-size:25px;
font-weight:900;
}

</style>

</head>

<body>

<div id="app"></div>

<script>

async function laden(){

try{

const data =
await (
await fetch("/pvp-data")
).json();

const app =
document.getElementById("app");

if(
!data ||
!data.kampf
){

app.innerHTML="";

return;
}

const k =
data.kampf;

const pokemon =
k.typ === "pokemon";

app.innerHTML =
\`
<div class="card">

<div class="title">
\${pokemon
? "🐾 POKÉMON-KAMPF"
: "⚔️ FUCHSDUELL"}
</div>

<div class="fighters">

<div class="fighter">

<div class="name">
@\${k.angreifer}
</div>

<div class="detail">
\${pokemon
? k.angreiferPokemon
: k.angreiferRudel || ""}
</div>

</div>

<div class="vs">
⚔️
</div>

<div class="fighter">

<div class="name">
@\${k.verteidiger}
</div>

<div class="detail">
\${pokemon
? k.verteidigerPokemon
: k.verteidigerRudel || ""}
</div>

</div>

</div>

<div class="winner">
🏆 @\${k.gewinner}
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


        /* 404 */

        res.writeHead(
          404,
          {
            "Content-Type":
              "text/plain; charset=utf-8"
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


/* =========================================================
   📡 STREAMELEMENTS ASTRO WEBSOCKET
========================================================= */

let ws =
  null;

let reconnectToken =
  null;

let reconnectTimer =
  null;

let heartbeatTimer =
  null;

let heartbeatTimeout =
  null;

function heartbeatStarten() {

  clearInterval(heartbeatTimer);
  clearTimeout(heartbeatTimeout);

  heartbeatTimer =
    setInterval(() => {

      if (!ws || ws.readyState !== WebSocket.OPEN) {
        return;
      }

      let pongErhalten = false;

      const pongHandler = () => {
        pongErhalten = true;
      };

      ws.once("pong", pongHandler);

      try {
        ws.ping();
      } catch (error) {
        console.error("❌ StreamElements Ping-Fehler:", error.message);
        try {
          ws.terminate();
        } catch {}
        return;
      }

      clearTimeout(heartbeatTimeout);

      heartbeatTimeout =
        setTimeout(() => {

          if (!pongErhalten && ws && ws.readyState === WebSocket.OPEN) {
            console.error(
              "🚨 StreamElements antwortet nicht – Render wird zum automatischen Neustart beendet."
            );

            try {
              ws.terminate();
            } catch {}

            // Render startet den Dienst nach dem Prozessende automatisch neu.
            process.exit(1);
          }

        }, 10000);

    }, 20000);
}

function heartbeatStoppen() {
  clearInterval(heartbeatTimer);
  clearTimeout(heartbeatTimeout);
  heartbeatTimer = null;
  heartbeatTimeout = null;
}

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
    reconnectToken
      ? `wss://astro.streamelements.com/?reconnect_token=${encodeURIComponent(
          reconnectToken
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

      clearTimeout(reconnectTimer);
      reconnectTimer = null;

      heartbeatStarten();

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


        if (
          message.type ===
          "welcome"
        ) {

          ws.send(
            JSON.stringify({
              type:
                "subscribe",

              nonce:
                `fuchs-${Date.now()}`,

              data: {

                topic:
                  "channel.chat.message",

                token:
                  STREAMELEMENTS_JWT,

                token_type:
                  "jwt"
              }
            })
          );

          console.log(
            "📡 channel.chat.message abonniert."
          );

          return;
        }


        if (
          message.type ===
          "reconnect"
        ) {

          reconnectToken =
            message?.data?.reconnect_token ||
            null;

          ws.close();

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

  ws.on(
    "close",
    () => {

      heartbeatStoppen();

      console.log(
        "🔁 StreamElements getrennt – neuer Versuch in 5 Sekunden."
      );

      clearTimeout(
        reconnectTimer
      );

      reconnectTimer =
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
        "❌ StreamElements WebSocket:",
        error.message
      );

      // 🛡️ Bei einem echten Socket-Fehler die Verbindung aktiv beenden.
      // Das löst zuverlässig das vorhandene "close" aus, das nach 5 Sekunden
      // automatisch eine neue StreamElements-Verbindung aufbaut.
      try {
        if (
          ws &&
          (
            ws.readyState === WebSocket.OPEN ||
            ws.readyState === WebSocket.CONNECTING
          )
        ) {
          ws.terminate();
        }
      } catch (closeError) {
        console.error(
          "❌ StreamElements Verbindung schließen:",
          closeError.message
        );
      }

    }
  );
}


/* =========================================================
   🚀 START
========================================================= */

server.listen(
  PORT,
  async () => {

    console.log(
      `🚀 MitsusundWandasWelt Bot läuft auf Port ${PORT}`
    );

    console.log(
      `🌐 PvP: /pvp`
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
