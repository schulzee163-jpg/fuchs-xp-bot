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

  const controller =
    new AbortController();

  const timeout =
    setTimeout(() => {
      controller.abort();
    }, 8000);

  try {

    const response =
      await fetch(
        `${SUPABASE_URL}${path}`,
        {
          ...options,

          signal:
            options.signal || controller.signal,

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

  } finally {

    clearTimeout(timeout);

  }
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

  const controller =
    new AbortController();

  const timeout =
    setTimeout(() => {
      controller.abort();
    }, 8000);

  try {

    const response =
      await fetch(
        "https://api.streamelements.com/kappa/v2/channels/me",
        {
          signal:
            controller.signal,

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

  } finally {

    clearTimeout(timeout);

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

    const controller =
      new AbortController();

    const timeout =
      setTimeout(() => {
        controller.abort();
      }, 8000);

    let response;

    try {

      response =
        await fetch(
          `https://api.streamelements.com/kappa/v2/bot/${encodeURIComponent(
            channelId
          )}/say`,
          {
            method: "POST",

            signal:
              controller.signal,

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

    } finally {

      clearTimeout(timeout);

    }

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
   🃏 FUCHSWELT TCG – SAMMELKARTEN
   Booster öffnen • 1 Karte alle 24 Stunden • dauerhaft in Supabase
========================================================= */

const FUCHS_TCG_KARTEN = [
  {id:"FW-001", name:"FuchsmissVegetalover2_0", rarity:"SECRET", emoji:"🦊", hp:120, power:95, type:"Fuchs", ability:"Herz der Fuchswelt"},
  {id:"FW-002", name:"Waldhüter", rarity:"LEGENDÄR", emoji:"🌲", hp:110, power:82, type:"Wesen", ability:"Wächter des Waldes"},
  {id:"FW-003", name:"Flammenwolf", rarity:"ULTRA", emoji:"🔥", hp:105, power:88, type:"Wesen", ability:"Flammensturm"},
  {id:"FW-004", name:"Eisdrache", rarity:"ULTRA", emoji:"❄️", hp:115, power:86, type:"Wesen", ability:"Eisatem"},
  {id:"FW-005", name:"Wassergeist", rarity:"RARE", emoji:"🌊", hp:95, power:74, type:"Wesen", ability:"Tiefenquelle"},
  {id:"FW-006", name:"Schattenfuchs", rarity:"RARE", emoji:"🌑", hp:90, power:79, type:"Wesen", ability:"Schattenlauf"},
  {id:"FW-007", name:"Blitzpfote", rarity:"ULTRA", emoji:"⚡", hp:100, power:91, type:"Begleiter", ability:"Blitzsprung"},
  {id:"FW-008", name:"Wandelfuchs", rarity:"RARE", emoji:"🦊", hp:85, power:70, type:"Begleiter", ability:"Wandelherz"},
  {id:"FW-009", name:"Fuchsbau", rarity:"UNCOMMON", emoji:"🏠", hp:80, power:52, type:"Ort", ability:"Sicherer Rückzug"},
  {id:"FW-010", name:"Großer Fuchsbau", rarity:"RARE", emoji:"🏰", hp:100, power:65, type:"Ort", ability:"Doppelter Schutz"},
  {id:"FW-011", name:"Schatzkammer", rarity:"UNCOMMON", emoji:"💎", hp:70, power:48, type:"Ort", ability:"Schatzfund"},
  {id:"FW-012", name:"Fuchswald", rarity:"COMMON", emoji:"🌳", hp:60, power:40, type:"Ort", ability:"Waldspur"},
  {id:"FW-013", name:"Leuchtkristall", rarity:"RARE", emoji:"💠", hp:75, power:67, type:"Item", ability:"Leuchten"},
  {id:"FW-014", name:"Mysteriöser Schlüssel", rarity:"UNCOMMON", emoji:"🔑", hp:65, power:45, type:"Item", ability:"Öffnet Geheimnisse"},
  {id:"FW-015", name:"Fuchslaterne", rarity:"COMMON", emoji:"🏮", hp:55, power:35, type:"Item", ability:"Licht in der Nacht"},
  {id:"FW-016", name:"Altes Fuchs-Kompass", rarity:"RARE", emoji:"🧭", hp:70, power:58, type:"Item", ability:"Findet Wege"},
  {id:"FW-017", name:"Feuerrudel", rarity:"UNCOMMON", emoji:"🔥", hp:75, power:61, type:"Rudel", ability:"Rudelstärke"},
  {id:"FW-018", name:"Wasserrudel", rarity:"UNCOMMON", emoji:"🌊", hp:75, power:60, type:"Rudel", ability:"Wellenruf"},
  {id:"FW-019", name:"Waldrudel", rarity:"UNCOMMON", emoji:"🌲", hp:78, power:62, type:"Rudel", ability:"Naturkraft"},
  {id:"FW-020", name:"ICErudel", rarity:"UNCOMMON", emoji:"🧊", hp:78, power:64, type:"Rudel", ability:"Eisruhe"},
  {id:"FW-021", name:"Ur-Fuchs", rarity:"LEGENDÄR", emoji:"🌌", hp:140, power:100, type:"Legende", ability:"Erbe des Urfuchses"},
  {id:"FW-022", name:"Das fünfte Fragment", rarity:"SECRET", emoji:"🌙", hp:130, power:110, type:"Geheimnis", ability:"Erwachen"},
  {id:"FW-023", name:"Fuchskern", rarity:"LEGENDÄR", emoji:"💜", hp:125, power:98, type:"Artefakt", ability:"Kern der Welt"},
  {id:"FW-024", name:"Schatten der 03:17", rarity:"SECRET", emoji:"👁️", hp:135, power:108, type:"Geheimnis", ability:"Die Welt ist falsch"}
];



/* 🧩 ZUSÄTZLICHE KARTENSERIEN – reine Sammelkarten, keine Kämpfe */
const FUCHS_TCG_EXTRA_SERIEN = [
  {serie:"Nachtfuchs", code:"NF", cards:[
    ["Mondschein-Fuchs","🌙","COMMON"],["Silberpfote","🦊","UNCOMMON"],["Schattenfuchs","🌑","RARE"],["Mondwald","🌲","UNCOMMON"],["Nachtlaterne","🏮","COMMON"],["Traumhüter","✨","ULTRA"],["Mondkristall","💎","RARE"],["Fuchs der Mitternacht","🌌","SECRET"]]},
  {serie:"Drachenkarten", code:"DR", cards:[
    ["Glutdrache","🐉","COMMON"],["Kristalldrache","💎","UNCOMMON"],["Sturmdrache","⚡","RARE"],["Walddrache","🌲","UNCOMMON"],["Frostdrache","❄️","RARE"],["Sternendrache","🌟","ULTRA"],["Uralter Drache","🔥","LEGENDÄR"],["Drachenthron","👑","SECRET"]]},
  {serie:"Magierkarten", code:"MG", cards:[
    ["Waldmagier","🧙","COMMON"],["Mondmagierin","🌙","UNCOMMON"],["Feuermagier","🔥","RARE"],["Kristallmagier","💎","UNCOMMON"],["Schattenmagier","🌑","RARE"],["Sternenmagier","✨","ULTRA"],["Meister der Runen","📜","LEGENDÄR"],["Der letzte Magier","🪄","SECRET"]]},
  {serie:"Geisterkarten", code:"GE", cards:[
    ["Kleiner Waldgeist","👻","COMMON"],["Flüstergeist","🌫️","UNCOMMON"],["Spiegelgeist","🪞","RARE"],["Geist der alten Tür","🚪","UNCOMMON"],["Nebelgeist","🌫️","RARE"],["Geisterkönig","👑","ULTRA"],["Seelenlicht","🕯️","LEGENDÄR"],["Der Geist um 03:17","👁️","SECRET"]]},
  {serie:"Fantasykarten", code:"FA", cards:[
    ["Zauberwald","🌳","COMMON"],["Kristallblume","🌸","UNCOMMON"],["Himmelsinsel","☁️","RARE"],["Einhornpfad","🦄","UNCOMMON"],["Feuerquelle","🔥","RARE"],["Sternenbrücke","🌉","ULTRA"],["Weltentor","🌀","LEGENDÄR"],["Das verlorene Reich","🏞️","SECRET"]]},
  {serie:"Vampirkarten", code:"VA", cards:[
    ["Nachtvampir","🧛","COMMON"],["Blutmond","🌕","UNCOMMON"],["Schloss der Nacht","🏰","RARE"],["Schattenumhang","🖤","UNCOMMON"],["Vampirjäger","🗡️","RARE"],["Mondgräfin","🌙","ULTRA"],["König der Nacht","👑","LEGENDÄR"],["Der ewige Vampir","🧛‍♂️","SECRET"]]},
  {serie:"Feenkarten", code:"FE", cards:[
    ["Waldfee","🧚","COMMON"],["Blütenfee","🌸","UNCOMMON"],["Mondfee","🌙","RARE"],["Kristallfee","💎","UNCOMMON"],["Sternenfee","✨","RARE"],["Traumfee","💫","ULTRA"],["Königin der Feen","👑","LEGENDÄR"],["Die letzte Fee","🧚‍♀️","SECRET"]]},
  {serie:"Wolfskarten", code:"WO", cards:[
    ["Waldwolf","🐺","COMMON"],["Silberwolf","🌙","UNCOMMON"],["Feuerwolf","🔥","RARE"],["Eiswolf","❄️","UNCOMMON"],["Schattenwolf","🌑","RARE"],["Sternenwolf","🌌","ULTRA"],["Alpha des Waldes","👑","LEGENDÄR"],["Urwolf","🐺","SECRET"]]},
  {serie:"Katzenkarten", code:"KA", cards:[
    ["Waldkatze","🐱","COMMON"],["Mondkatze","🌙","UNCOMMON"],["Kristallkatze","💎","RARE"],["Schattenkatze","🌑","UNCOMMON"],["Sternenkatze","🌟","RARE"],["Zauberkatze","✨","ULTRA"],["Königskatze","👑","LEGENDÄR"],["Die mystische Katze","🐈‍⬛","SECRET"]]},
  {serie:"Weltraumkarten", code:"WS", cards:[
    ["Kleiner Planet","🪐","COMMON"],["Mondstation","🌙","UNCOMMON"],["Nebelfuchs","🌌","RARE"],["Sternenschiff","🚀","UNCOMMON"],["Galaxietor","🌀","RARE"],["Kosmischer Fuchs","🌠","ULTRA"],["Hüter der Sterne","👑","LEGENDÄR"],["Das Ende des Universums","🌌","SECRET"]]},
  {serie:"Mystische Burgen", code:"BU", cards:[
    ["Altes Burgtor","🏰","COMMON"],["Mondburg","🌙","UNCOMMON"],["Kristallburg","💎","RARE"],["Geheimgang","🚪","UNCOMMON"],["Schattenburg","🌑","RARE"],["Himmelsburg","☁️","ULTRA"],["Königsburg","👑","LEGENDÄR"],["Die verlorene Burg","🏰","SECRET"]]},
  {serie:"Unterwasserwelt", code:"UW", cards:[
    ["Kleiner Fisch","🐟","COMMON"],["Korallenriff","🪸","UNCOMMON"],["Tiefseegeist","🌊","RARE"],["Muschelpalast","🐚","UNCOMMON"],["Leuchtqualle","🪼","RARE"],["Meeresdrache","🐉","ULTRA"],["Königin der Tiefe","👑","LEGENDÄR"],["Das versunkene Reich","🌊","SECRET"]]},
  {serie:"Mystischer Wald", code:"MW", cards:[
    ["Moosfuchs","🦊","COMMON"],["Leuchtpilz","🍄","UNCOMMON"],["Waldhüterin","🌲","RARE"],["Geheimpfad","🛤️","UNCOMMON"],["Baumgeist","🌳","RARE"],["Herz des Waldes","💚","ULTRA"],["Uralte Eiche","🌳","LEGENDÄR"],["Der Wald ohne Ende","🌲","SECRET"]]}
];

for (const serie of FUCHS_TCG_EXTRA_SERIEN) {
  serie.cards.forEach((c, i) => {
    const [name, emoji, rarity] = c;
    FUCHS_TCG_KARTEN.push({
      id:`${serie.code}-${String(i+1).padStart(3,"0")}`,
      name, rarity, emoji,
      hp:55 + i*10 + (rarity === "SECRET" ? 45 : rarity === "LEGENDÄR" ? 35 : rarity === "ULTRA" ? 25 : rarity === "RARE" ? 15 : rarity === "UNCOMMON" ? 8 : 0),
      power:30 + i*8 + (rarity === "SECRET" ? 45 : rarity === "LEGENDÄR" ? 35 : rarity === "ULTRA" ? 25 : rarity === "RARE" ? 15 : rarity === "UNCOMMON" ? 8 : 0),
      type:serie.serie,
      serie:serie.serie,
      ability:`${name} – Spezialmotiv`
    });
  });
}

const FUCHS_TCG_SERIEN = [
  {key:"fuchswelt", name:"🦊 Fuchswelt-Karten", filter:"Fuchswelt"},
  {key:"nachtfuchs", name:"🌙 Nachtfuchs-Serie", filter:"Nachtfuchs"},
  {key:"drachen", name:"🐉 Drachenkarten", filter:"Drachenkarten"},
  {key:"magier", name:"🧙 Magierkarten", filter:"Magierkarten"},
  {key:"geister", name:"👻 Geisterkarten", filter:"Geisterkarten"},
  {key:"fantasy", name:"🌸 Fantasykarten", filter:"Fantasykarten"},
  {key:"vampire", name:"🧛 Vampirkarten", filter:"Vampirkarten"},
  {key:"feen", name:"🧚 Feenkarten", filter:"Feenkarten"},
  {key:"woelfe", name:"🐺 Wolfskarten", filter:"Wolfskarten"},
  {key:"katzen", name:"🐱 Katzenkarten", filter:"Katzenkarten"},
  {key:"weltraum", name:"🌌 Weltraumkarten", filter:"Weltraumkarten"},
  {key:"burgen", name:"🏰 Mystische Burgen", filter:"Mystische Burgen"},
  {key:"unterwasser", name:"🌊 Unterwasserwelt", filter:"Unterwasserwelt"},
  {key:"mystischerwald", name:"🌲 Mystischer Wald", filter:"Mystischer Wald"}
];

const FUCHS_TCG_SERIEN_MAP = new Map(FUCHS_TCG_SERIEN.map(x => [x.key, x]));
const FUCHS_TCG_ALIASE = new Map(FUCHS_TCG_SERIEN.map(x => [x.filter, x]));

for (const k of FUCHS_TCG_KARTEN) { if (!k.serie) k.serie = "Fuchswelt"; }

/* 🏆 SERIEN-BONUSKARTEN – werden nur bei vollständigen Serien vergeben */
const FUCHS_TCG_SERIEN_BONUS = {
  fuchswelt: {id:"BONUS-FW", name:"Meister der Fuchswelt", emoji:"👑", rarity:"SECRET", type:"Serienbonus", ability:"Die Fuchswelt ist vollständig gesammelt."},
  nachtfuchs: {id:"BONUS-NF", name:"König des Nachtfuchses", emoji:"🌙", rarity:"SECRET", type:"Serienbonus", ability:"Die Nachtfuchs-Serie ist vollständig gesammelt."},
  drachen: {id:"BONUS-DR", name:"Drachenthron", emoji:"🐉", rarity:"SECRET", type:"Serienbonus", ability:"Die Drachenserie ist vollständig gesammelt."},
  magier: {id:"BONUS-MG", name:"Meister der Magie", emoji:"🧙", rarity:"SECRET", type:"Serienbonus", ability:"Die Magierserie ist vollständig gesammelt."},
  geister: {id:"BONUS-GE", name:"Hüter der Geister", emoji:"👻", rarity:"SECRET", type:"Serienbonus", ability:"Die Geisterserie ist vollständig gesammelt."},
  fantasy: {id:"BONUS-FA", name:"Herz der Fantasiewelt", emoji:"🌸", rarity:"SECRET", type:"Serienbonus", ability:"Die Fantasyserie ist vollständig gesammelt."},
  vampire: {id:"BONUS-VA", name:"Thron der Nacht", emoji:"🧛", rarity:"SECRET", type:"Serienbonus", ability:"Die Vampirserie ist vollständig gesammelt."},
  feen: {id:"BONUS-FE", name:"Feenkönigin", emoji:"🧚", rarity:"SECRET", type:"Serienbonus", ability:"Die Feenserie ist vollständig gesammelt."},
  woelfe: {id:"BONUS-WO", name:"Rudel des Mondes", emoji:"🐺", rarity:"SECRET", type:"Serienbonus", ability:"Die Wolfserie ist vollständig gesammelt."},
  katzen: {id:"BONUS-KA", name:"Mystische Katzenkönigin", emoji:"🐱", rarity:"SECRET", type:"Serienbonus", ability:"Die Katzenserie ist vollständig gesammelt."},
  weltraum: {id:"BONUS-WS", name:"Hüter des Universums", emoji:"🌌", rarity:"SECRET", type:"Serienbonus", ability:"Die Weltraumserie ist vollständig gesammelt."},
  burgen: {id:"BONUS-BU", name:"Herr der mystischen Burgen", emoji:"🏰", rarity:"SECRET", type:"Serienbonus", ability:"Die Burgenserie ist vollständig gesammelt."},
  unterwasser: {id:"BONUS-UW", name:"Königreich der Tiefe", emoji:"🌊", rarity:"SECRET", type:"Serienbonus", ability:"Die Unterwasser-Serie ist vollständig gesammelt."},
  mystischerwald: {id:"BONUS-MW", name:"Herz des mystischen Waldes", emoji:"🌲", rarity:"SECRET", type:"Serienbonus", ability:"Die Waldserie ist vollständig gesammelt."}
};

const FUCHS_TCG_MEISTERKARTE = {
  id:"BONUS-MASTER", name:"Fuchswelt TCG Meisterkarte", emoji:"🦊👑", rarity:"SECRET", type:"Meisterbonus", ability:"Alle 14 Kartenserien wurden vollständig gesammelt."
};

const fuchsTcgSammlungen = new Map();

const FUCHS_TCG_RARITY = {
  COMMON: {label:"⭐", weight:55},
  UNCOMMON: {label:"⭐⭐", weight:28},
  RARE: {label:"💎", weight:12},
  ULTRA: {label:"💜", weight:4},
  LEGENDÄR: {label:"👑", weight:0.8},
  SECRET: {label:"🌟", weight:0.2}
};

function fuchsTcgSammlung(username) {
  const u = normalisieren(username);
  if (!fuchsTcgSammlungen.has(u)) {
    fuchsTcgSammlungen.set(u, {karten:{}, booster:0, geoeffnet:0, letzteOeffnung:0, naechsteOeffnung:0});
  }
  return fuchsTcgSammlungen.get(u);
}

async function fuchsTcgLaden(username) {
  const u = normalisieren(username);
  const lokal = fuchsTcgSammlung(u);
  try {
    const rows = await supabase(
      `/rest/v1/fuchs_tcg_sammlungen?spieler=eq.${encodeURIComponent(u)}&limit=1`
    );
    if (rows?.[0]) {
      lokal.karten = rows[0].karten && typeof rows[0].karten === "object" ? rows[0].karten : {};
      lokal.booster = Number(rows[0].booster || 0);
      lokal.geoeffnet = Number(rows[0].geoeffnet || 0);
      lokal.letzteOeffnung = rows[0].letzte_oeffnung ? new Date(rows[0].letzte_oeffnung).getTime() : 0;
      lokal.naechsteOeffnung = rows[0].naechste_oeffnung ? new Date(rows[0].naechste_oeffnung).getTime() : 0;
    }
  } catch (error) {
    console.error("❌ TCG Supabase laden:", error.message);
  }
  return lokal;
}

async function fuchsTcgSpeichern(username) {
  const u = normalisieren(username);
  const s = fuchsTcgSammlung(u);
  try {
    await supabase(
      `/rest/v1/fuchs_tcg_sammlungen?on_conflict=spieler`,
      {
        method:"POST",
        headers:{Prefer:"resolution=merge-duplicates"},
        body:JSON.stringify({
          spieler:u,
          karten:s.karten,
          booster:Number(s.booster || 0),
          geoeffnet:Number(s.geoeffnet || 0),
          letzte_oeffnung:s.letzteOeffnung ? new Date(s.letzteOeffnung).toISOString() : null,
          naechste_oeffnung:s.naechsteOeffnung ? new Date(s.naechsteOeffnung).toISOString() : null,
          updated_at:new Date().toISOString()
        })
      }
    );
    return true;
  } catch (error) {
    console.error("❌ TCG Supabase speichern:", error.message);
    return false;
  }
}

function fuchsTcgKarte(id) {
  return FUCHS_TCG_KARTEN.find(k => k.id === id) || null;
}

function fuchsTcgZufall(garantierteRaritaet = null, serienfilter = null) {
  let pool = FUCHS_TCG_KARTEN;
  if (serienfilter) pool = pool.filter(k => k.serie === serienfilter || k.type === serienfilter);
  if (garantierteRaritaet) pool = pool.filter(k => k.rarity === garantierteRaritaet);
  if (!pool.length) pool = FUCHS_TCG_KARTEN;
  const roll = Math.random() * 100;
  let rarity = "COMMON";
  if (!garantierteRaritaet) {
    if (roll < 0.2) rarity = "SECRET";
    else if (roll < 1.0) rarity = "LEGENDÄR";
    else if (roll < 5.0) rarity = "ULTRA";
    else if (roll < 17.0) rarity = "RARE";
    else if (roll < 45.0) rarity = "UNCOMMON";
  }
  const rpool = pool.filter(k => k.rarity === rarity);
  const aus = rpool.length ? rpool : pool;
  return aus[Math.floor(Math.random() * aus.length)];
}

function fuchsTcgSammeln(username, karte) {
  const u = normalisieren(username);
  const s = fuchsTcgSammlung(u);
  s.karten[karte.id] = Number(s.karten[karte.id] || 0) + 1;
  return s.karten[karte.id];
}

function fuchsTcgSerienKarten(key) {
  const serie = FUCHS_TCG_SERIEN_MAP.get(key);
  if (!serie) return [];
  return FUCHS_TCG_KARTEN.filter(k => k.serie === serie.filter || k.type === serie.filter);
}

function fuchsTcgSerieVollstaendig(s, key) {
  const karten = fuchsTcgSerienKarten(key);
  return karten.length > 0 && karten.every(k => Number(s.karten[k.id] || 0) > 0);
}

function fuchsTcgVollstaendigeSerien(s) {
  return FUCHS_TCG_SERIEN.filter(serie => fuchsTcgSerieVollstaendig(s, serie.key));
}

function fuchsTcgBonusKarten(s) {
  return Object.values(FUCHS_TCG_SERIEN_BONUS).filter(k => Number(s.karten[k.id] || 0) > 0);
}

async function fuchsTcgPruefeBelohnungen(username) {
  const u = normalisieren(username);
  const s = fuchsTcgSammlung(u);
  const neue = [];
  for (const serie of FUCHS_TCG_SERIEN) {
    const bonus = FUCHS_TCG_SERIEN_BONUS[serie.key];
    if (bonus && fuchsTcgSerieVollstaendig(s, serie.key) && !s.karten[bonus.id]) {
      s.karten[bonus.id] = 1;
      neue.push(`🏆 ${bonus.emoji} ${bonus.name}`);
    }
  }
  const alleVollstaendig = FUCHS_TCG_SERIEN.every(serie => fuchsTcgSerieVollstaendig(s, serie.key));
  if (alleVollstaendig && !s.karten[FUCHS_TCG_MEISTERKARTE.id]) {
    s.karten[FUCHS_TCG_MEISTERKARTE.id] = 1;
    neue.push(`👑 ${FUCHS_TCG_MEISTERKARTE.name}`);
  }
  if (neue.length) await fuchsTcgSpeichern(u);
  return neue;
}

function fuchsTcgNaechsteZeit(nextOpenAt) {
  const datum = new Date(nextOpenAt);
  const datumText = new Intl.DateTimeFormat("de-DE", {
    timeZone:"Europe/Berlin", dateStyle:"short", timeStyle:"medium"
  }).format(datum);
  const restMs = Math.max(0, nextOpenAt - Date.now());
  const stunden = Math.floor(restMs / 3600000);
  const minuten = Math.floor((restMs % 3600000) / 60000);
  const sekunden = Math.floor((restMs % 60000) / 1000);
  return {datumText, restText:`${stunden} Std. ${minuten} Min. ${sekunden} Sek.`};
}

async function fuchsTcgBooster(username, serienfilter = null) {
  const u = normalisieren(username);
  const s = await fuchsTcgLaden(u);
  const jetzt = Date.now();
  const naechsteOeffnung = Number(s.naechsteOeffnung || 0);
  if (naechsteOeffnung > jetzt) {
    const t = fuchsTcgNaechsteZeit(naechsteOeffnung);
    return `⏳ @${u} Du hast bereits eine Karte geöffnet. Die nächste Karte kann am ${t.datumText} geöffnet werden. Noch ${t.restText}.`;
  }

  // Genau EINE Karte pro Öffnung.
  const karte = fuchsTcgZufall(null, serienfilter);
  fuchsTcgSammeln(u, karte);
  s.booster += 1;
  s.geoeffnet += 1;
  s.letzteOeffnung = jetzt;
  s.naechsteOeffnung = jetzt + 24 * 60 * 60 * 1000;
  await fuchsTcgSpeichern(u);
  const belohnungen = await fuchsTcgPruefeBelohnungen(u);
  fuchsTcgLiveSetzen(u, karte);

  const t = fuchsTcgNaechsteZeit(s.naechsteOeffnung);
  const selten = ["ULTRA","LEGENDÄR","SECRET"].includes(karte.rarity);
  const bonusText = belohnungen.length ? ` 🏆 Bonus freigeschaltet: ${belohnungen.join(" • ")}.` : "";
  return `🎁 @${u} hat eine Karte geöffnet! ${karte.serie} • ${FUCHS_TCG_RARITY[karte.rarity].label} ${karte.id} ${karte.emoji} ${karte.name} [${karte.rarity}] • ❤️ ${karte.hp} • ⚔️ ${karte.power} • ✨ ${karte.ability}${selten ? " ✨ SELTENE KARTE!" : ""}${bonusText} ⏳ Nächste Karte: ${t.datumText} (in ${t.restText}).`;
}

function fuchsTcgSerienText() {
  return FUCHS_TCG_SERIEN.map(s => `${s.name} = !${s.key}`).join(" • ");
}

async function fuchsTcgTimer(username) {
  const u = normalisieren(username);
  const s = await fuchsTcgLaden(u);
  const naechsteOeffnung = Number(s.naechsteOeffnung || 0);
  if (!naechsteOeffnung || naechsteOeffnung <= Date.now()) return `🃏 @${u} Du kannst jetzt eine Karte öffnen! Nutze !booster.`;
  const t = fuchsTcgNaechsteZeit(naechsteOeffnung);
  return `⏳ @${u} Deine nächste Fuchswelt-TCG-Karte kann am ${t.datumText} geöffnet werden. Noch ${t.restText}.`;
}

async function fuchsTcgAlbum(username) {
  const u = normalisieren(username);
  const s = await fuchsTcgLaden(u);
  const gesammelt = Object.entries(s.karten).filter(([id]) => FUCHS_TCG_KARTEN.some(k => k.id === id)).reduce((a,[,b])=>a+Number(b||0),0);
  const verschiedene = FUCHS_TCG_KARTEN.filter(k => s.karten[k.id]).length;
  const fehlend = Math.max(0, FUCHS_TCG_KARTEN.length - verschiedene);
  const serien = fuchsTcgVollstaendigeSerien(s).length;
  const bonus = fuchsTcgBonusKarten(s);
  const seltenheiten = ["SECRET","LEGENDÄR","ULTRA","RARE","UNCOMMON","COMMON"].map(r => {
    const anzahl = FUCHS_TCG_KARTEN.filter(k => k.rarity === r && s.karten[k.id]).length;
    return `${FUCHS_TCG_RARITY[r].label} ${r}: ${anzahl}`;
  }).join(" • ");
  return `📖 @${u} TCG-Album: ${verschiedene}/${FUCHS_TCG_KARTEN.length} verschiedene Karten • ${gesammelt} Karten insgesamt • ${fehlend} fehlen noch • 🏆 ${serien}/${FUCHS_TCG_SERIEN.length} Serien komplett • 🎁 ${bonus.length} Bonuskarten. ${seltenheiten}`;
}

async function fuchsTcgStatus(username) {
  const u = normalisieren(username);
  const s = await fuchsTcgLaden(u);
  const zeilen = FUCHS_TCG_SERIEN.map(serie => {
    const karten = fuchsTcgSerienKarten(serie.key);
    const count = karten.filter(k => s.karten[k.id]).length;
    return `${serie.name} ${count}/${karten.length}${count === karten.length ? " 🏆" : ""}`;
  });
  const bonus = fuchsTcgBonusKarten(s);
  const master = s.karten[FUCHS_TCG_MEISTERKARTE.id] ? " 👑 Meisterkarte erhalten!" : "";
  return `📊 @${u} TCG-Fortschritt: ${zeilen.join(" • ")} • Bonuskarten: ${bonus.length}/${FUCHS_TCG_SERIEN.length}.${master}`;
}

async function fuchsTcgSerienListe(username) {
  const u = normalisieren(username);
  const s = await fuchsTcgLaden(u);
  return `🃏 @${u} Serien: ${FUCHS_TCG_SERIEN.map(serie => { const k=fuchsTcgSerienKarten(serie.key); const c=k.filter(x=>s.karten[x.id]).length; return `${serie.name} ${c}/${k.length} = !${serie.key}`; }).join(" • ")}`;
}

async function fuchsTcgKarteInfo(username, such) {
  const u = normalisieren(username);
  const q = String(such || "").trim().toLowerCase();
  if (!q) return `🃏 @${u} Nutze !karte FW-001 oder !karte fuchsmissvegetalover2_0.`;
  const karte = FUCHS_TCG_KARTEN.find(k => k.id.toLowerCase() === q || k.name.toLowerCase().includes(q));
  if (!karte) return `🃏 @${u} Diese Karte gibt es nicht. Nutze !tcg für die Befehle.`;
  const s = await fuchsTcgLaden(u);
  const besitz = Number(s.karten[karte.id] || 0);
  return `${karte.emoji} ${karte.id} ${karte.name} • ${FUCHS_TCG_RARITY[karte.rarity].label} ${karte.rarity} • ${karte.type} • ❤️ ${karte.hp} • ⚔️ ${karte.power} • ✨ ${karte.ability} • Besitz: ${besitz}x`;
}

async function fuchsTcgListe(username) {
  const u = normalisieren(username);
  const s = await fuchsTcgLaden(u);
  const vorhanden = FUCHS_TCG_KARTEN.filter(k => s.karten[k.id]).slice(0,12).map(k => `${k.id} ${k.emoji}${Number(s.karten[k.id]) > 1 ? ` x${s.karten[k.id]}` : ""}`).join(" • ");
  return vorhanden ? `🃏 @${u} Deine Sammlung: ${vorhanden}` : `🃏 @${u} Deine Sammlung ist noch leer. Öffne mit !booster deine erste Karte!`;
}

/* =========================================================
   📺 FUCHSWELT TCG – LIVE-KARTEN-OVERLAY
   Zeigt eine gezogene Karte im Stream für 15 Sekunden.
========================================================= */

let fuchsTcgLive = null;

function fuchsTcgLiveSetzen(username, karte) {
  fuchsTcgLive = {
    username: normalisieren(username),
    karte: {...karte},
    createdAt: Date.now(),
    expiresAt: Date.now() + 15000
  };
}

const FUCHS_TCG_OVERLAY_HTML = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fuchswelt TCG Live Overlay</title><style>
html,body{margin:0;width:100%;height:100%;overflow:hidden;background:transparent;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#fff}
#wrap{width:100%;height:100%;display:flex;align-items:center;justify-content:center;pointer-events:none}
.card{width:min(430px,82vw);padding:18px;border-radius:28px;background:linear-gradient(145deg,rgba(24,28,42,.98),rgba(8,10,16,.98));border:2px solid rgba(255,255,255,.35);box-shadow:0 18px 70px rgba(0,0,0,.55);text-align:center;opacity:0;transform:scale(.82) translateY(20px);transition:opacity .35s ease,transform .35s ease}
.card.show{opacity:1;transform:scale(1) translateY(0)}
.top{font-size:15px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;opacity:.9}
.art{font-size:105px;line-height:1.05;margin:12px 0}
.id{font-size:14px;opacity:.65}
.name{font-size:32px;font-weight:950;margin-top:3px}
.rarity{font-size:19px;font-weight:900;margin-top:6px}
.type{font-size:15px;opacity:.8;margin-top:4px}
.stats{display:flex;justify-content:center;gap:18px;font-size:17px;font-weight:850;margin-top:14px}
.ability{font-size:14px;opacity:.9;margin-top:10px}
.by{font-size:16px;font-weight:900;margin-top:14px}
.secret{font-size:17px;font-weight:950;margin-top:9px}
</style></head><body><div id="wrap"></div><script>
let shownKey="";
async function load(){
 try{
  const d=await (await fetch('/tcg-live',{cache:'no-store'})).json();
  const wrap=document.getElementById('wrap');
  if(!d.live){wrap.innerHTML='';shownKey='';return;}
  const c=d.live.karte;
  const key=d.live.createdAt+'-'+c.id+'-'+d.live.username;
  if(key===shownKey)return;
  shownKey=key;
  const rare=['ULTRA','LEGENDÄR','SECRET'].includes(c.rarity);
  wrap.innerHTML='<div class="card" id="card">'
   +'<div class="top">🎁 FUCHSWELT TCG • NEUE KARTE</div>'
   +'<div class="art">'+c.emoji+'</div>'
   +'<div class="id">'+c.id+' • '+(c.serie||c.type)+'</div>'
   +'<div class="name">'+c.name+'</div>'
   +'<div class="rarity">'+(c.rarity==='SECRET'?'🌟 SECRET':c.rarity==='LEGENDÄR'?'👑 LEGENDÄR':c.rarity==='ULTRA'?'💜 ULTRA':c.rarity==='RARE'?'💎 RARE':c.rarity==='UNCOMMON'?'⭐⭐ UNCOMMON':'⭐ COMMON')+'</div>'
   +'<div class="type">'+c.type+'</div>'
   +'<div class="stats"><span>❤️ '+c.hp+'</span><span>⚔️ '+c.power+'</span></div>'
   +'<div class="ability">✨ '+c.ability+'</div>'
   +'<div class="by">@'+d.live.username+' hat diese Karte gezogen!</div>'
   +(rare?'<div class="secret">✨ SELTENE KARTE! ✨</div>':'')
   +'</div>';
  requestAnimationFrame(()=>document.getElementById('card')?.classList.add('show'));
 }catch(e){}
}
load();setInterval(load,500);
</script></body></html>`;

const FUCHS_TCG_HTML = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fuchswelt TCG</title><style>body{margin:0;background:#08090d;color:#fff;font-family:system-ui,-apple-system,sans-serif}main{max-width:900px;margin:auto;padding:16px}.panel{background:#121621;border:1px solid #303746;border-radius:18px;padding:14px;margin-bottom:14px}input,button{font:inherit;border-radius:12px;padding:12px;border:1px solid #303746}input{background:#090c12;color:#fff;width:100%;box-sizing:border-box}button{background:#1b2230;color:#fff;font-weight:800;width:100%;margin-top:8px}.cards{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.card{padding:14px;border-radius:16px;border:1px solid #42495a;background:linear-gradient(145deg,#191e2a,#0c0f16);min-height:170px}.art{font-size:48px;text-align:center}.id{color:#9aa2b2;font-size:12px}.name{font-size:18px;font-weight:900}.rarity{margin-top:4px}.stats{margin-top:10px;font-size:13px}.timer{font-weight:900;margin-top:10px}@media(min-width:700px){.cards{grid-template-columns:repeat(4,1fr)}}</style></head><body><main><div class="panel"><h1>🃏 Fuchswelt TCG</h1><p>Pro Zuschauer genau <b>1 Karte alle 24 Stunden</b>.</p><input id="p" value="streamer" placeholder="Twitch-Name"><select id="serie"><option value="">🎁 Zufällige Serie</option><option value="fuchswelt">🦊 Fuchswelt</option><option value="nachtfuchs">🌙 Nachtfuchs</option><option value="drachen">🐉 Drachen</option><option value="magier">🧙 Magier</option><option value="geister">👻 Geister</option><option value="fantasy">🌸 Fantasy</option><option value="vampire">🧛 Vampire</option><option value="feen">🧚 Feen</option><option value="woelfe">🐺 Wölfe</option><option value="katzen">🐱 Katzen</option><option value="weltraum">🌌 Weltraum</option><option value="burgen">🏰 Burgen</option><option value="unterwasser">🌊 Unterwasser</option><option value="mystischerwald">🌲 Mystischer Wald</option></select><button onclick="openB()">🎁 Eine Karte öffnen</button><button onclick="load()">🔄 Sammlung aktualisieren</button><div id="msg"></div><div id="timer" class="timer"></div></div><div class="panel"><b id="count">Album</b><div id="cards" class="cards"></div></div></main><script>const p=()=>encodeURIComponent((document.getElementById('p').value||'streamer').trim().toLowerCase());let nextOpen=0;async function openB(){const r=await fetch('/tcg-open',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({player:decodeURIComponent(p()),serie:document.getElementById('serie').value})});const d=await r.json();document.getElementById('msg').textContent=d.message;nextOpen=Number(d.nextOpenAt||0);renderTimer();load()}async function load(){const d=await (await fetch('/tcg-data?player='+p())).json();document.getElementById('count').textContent='📖 Album '+d.collected+'/'+d.total+' verschiedene Karten';document.getElementById('cards').innerHTML=d.cards.map(k=>'<div class="card"><div class="art">'+k.emoji+'</div><div class="id">'+k.id+' • '+k.rarity+'</div><div class="name">'+k.name+'</div><div class="rarity">'+k.type+'</div><div class="stats">❤️ '+k.hp+' • ⚔️ '+k.power+'<br>✨ '+k.ability+'<br>Besitz: '+k.count+'x</div></div>').join('');nextOpen=Number(d.nextOpenAt||0);renderTimer()}function renderTimer(){const el=document.getElementById('timer');if(!nextOpen||nextOpen<=Date.now()){el.textContent='🟢 Jetzt kann eine Karte geöffnet werden!';return}const r=Math.max(0,nextOpen-Date.now()),h=Math.floor(r/3600000),m=Math.floor(r%3600000/60000),s=Math.floor(r%60000/1000),d=new Date(nextOpen);el.textContent='⏳ Nächste Karte: '+d.toLocaleString('de-DE',{dateStyle:'short',timeStyle:'medium'})+' • noch '+h+' Std. '+m+' Min. '+s+' Sek.'}load();setInterval(renderTimer,1000)</script></body></html>`;



/* =========================================================
   👁️ 03:17 – DIE WELT IST FALSCH
   Integriert in die bestehende Fuchswelt.
   Die bestehende Fuchswelt, Supabase und StreamElements
   bleiben erhalten.
========================================================= */

const D0317_PLAYER =
  normalisieren(process.env.D0317_PLAYER || "streamer");

const D0317_ROOMS = [
  "Patientenzimmer",
  "Notaufnahme",
  "Labor",
  "Keller",
  "OP",
  "Archiv",
  "Treppenhaus",
  "Ausgang"
];

const D0317_CHARS = {
  Alex: { hp: 100, sta: 100, ammo: 6 },
  Mika: { hp: 100, sta: 125, ammo: 5 },
  Sam: { hp: 95, sta: 100, ammo: 10 },
  Nora: { hp: 125, sta: 95, ammo: 4 }
};

const d0317Spiele = new Map();

function d0317ZeitText(minuten) {
  const m = ((Number(minuten) || 0) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function d0317NeuesSpiel(player, char = "Alex") {
  const c = D0317_CHARS[D0317_CHARS[char] ? char : "Alex"];

  return {
    player,
    char: D0317_CHARS[char] ? char : "Alex",
    hp: c.hp,
    maxHp: c.hp,
    sta: c.sta,
    maxSta: c.sta,
    bat: 5,
    ammo: c.ammo,
    key: 0,
    med: 1,
    danger: 0,
    time: 197,
    room: 1,
    location: D0317_ROOMS[0],
    hidden: false,
    armed: false,
    enemy: false,
    enemyHP: 80,
    flash: false,
    ended: false,
    visited: {},
    eventCount: 0,
    log: [
      `[03:17] Du wachst um 03:17 Uhr auf. DU WARST SCHON EINMAL HIER.`
    ],
    story:
      `03:17 Uhr. ${char}, du bist wach.<br><br>` +
      `Finde den Schlüssel. Überlebe die Nacht. Finde den Ausgang.`
  };
}

function d0317Spiel(player) {
  const p = normalisieren(player) || D0317_PLAYER;

  if (!d0317Spiele.has(p)) {
    d0317Spiele.set(p, d0317NeuesSpiel(p));
  }

  return d0317Spiele.get(p);
}

function d0317Log(s, text) {
  s.log.unshift(`[${d0317ZeitText(s.time)}] ${text}`);
  s.log = s.log.slice(0, 40);
}

function d0317Zeit(s, minuten = 1) {
  s.time = (s.time + minuten) % 1440;
}

function d0317Gefahr(s, n = 1) {
  s.danger = Math.min(5, Math.max(0, s.danger + n));
}

function d0317Ausdauer(s, n) {
  s.sta = Math.min(s.maxSta, Math.max(0, s.sta + n));
}

function d0317Verletzen(s, n) {
  let schaden = Number(n) || 0;

  if (s.hidden) {
    schaden = Math.ceil(schaden / 2);
  }

  s.hp = Math.max(0, s.hp - schaden);

  if (s.hp <= 0) {
    s.ended = true;
    s.story =
      `💀 <span class="danger">Du bist zusammengebrochen.</span><br><br>` +
      `Die Nacht war stärker als du.`;
    d0317Log(s, "💀 Das Spiel ist vorbei.");
  }
}

function d0317MonsterEvent(s) {
  if (s.ended) {
    return;
  }

  if (
    s.danger >= 3 &&
    Math.random() < 0.55
  ) {
    s.enemy = true;
    s.enemyHP = 80;
    d0317Log(s, "👹 Der Pfleger hat dich gefunden.");
    s.story =
      `👹 <span class="danger">Der Pfleger tritt aus dem Dunkeln.</span><br><br>` +
      `Licht, Flucht oder Verstecken könnten dir helfen.`;
    return;
  }

  if (Math.random() < 0.18) {
    d0317Verletzen(s, 4);
    d0317Log(s, "🩸 Ein Schock lässt dich stolpern.");
  }
}

function d0317Gewinnen(s) {
  s.ended = true;
  s.story =
    `🏆 <span class="good">Du hast den Ausgang erreicht!</span><br><br>` +
    `Aber draußen steht jemand auf der anderen Straßenseite. ` +
    `Er zeigt auf die Uhr: <b>03:17.</b>`;
  d0317Log(s, "🏆 Ende 1: Flucht.");
}

function d0317Aktion(player, action, char = null) {
  const s = d0317Spiel(player);

  if (action === "reset") {
    const neu = d0317NeuesSpiel(
      s.player,
      char && D0317_CHARS[char] ? char : s.char
    );

    d0317Spiele.set(
      s.player,
      neu
    );

    return neu;
  }

  if (s.ended) {
    return s;
  }

  s.hidden = false;
  d0317Zeit(s, 1);

  switch (action) {
    case "light": {
      if (s.bat <= 0) {
        s.story = "🔋 Die Taschenlampe ist leer.";
        break;
      }

      s.bat--;
      s.flash = true;
      d0317Gefahr(s);
      s.story =
        `🔦 Der Lichtkegel schneidet durch die Dunkelheit.<br><br>` +
        `Du erkennst Spuren am Boden.`;
      d0317Log(s, "🔦 Licht eingeschaltet.");
      d0317MonsterEvent(s);
      break;
    }

    case "search": {
      d0317Gefahr(s);
      s.eventCount++;

      const r = Math.random();

      if (
        !s.key &&
        (s.room === 1 || s.room === 2 || r > 0.45)
      ) {
        s.key = 1;
        s.story =
          `🔑 Du findest einen alten Schlüssel. ` +
          `Auf dem Metall steht: <b>03:17</b>.`;
        d0317Log(s, "🔑 Schlüssel gefunden.");
      } else if (r < 0.35) {
        s.bat++;
        s.story = "🔋 Du findest eine Batterie.";
        d0317Log(s, "🔋 Batterie gefunden.");
      } else if (r < 0.58) {
        s.ammo += 2;
        s.story = "🔫 Du findest 2 Patronen.";
        d0317Log(s, "🔫 Munition gefunden.");
      } else if (r < 0.72) {
        s.med++;
        s.story = "🩹 Ein Medikit liegt in einem Schrank.";
        d0317Log(s, "🩹 Medikit gefunden.");
      } else {
        s.story =
          `🔎 Du findest Blutspuren. ` +
          `<span class="danger">Sie sind noch frisch.</span>`;
        d0317Log(s, "🩸 Frische Blutspuren.");
        d0317Gefahr(s);
      }

      d0317MonsterEvent(s);
      break;
    }

    case "run": {
      if (s.sta < 20) {
        s.story = "😮‍💨 Du bist zu erschöpft zum Rennen.";
        d0317Ausdauer(s, -5);
        break;
      }

      d0317Ausdauer(s, -25);
      d0317Gefahr(s, -1);
      s.room = Math.min(8, s.room + 1);
      s.location = D0317_ROOMS[s.room - 1];
      s.flash = false;
      s.story =
        `🏃 Du rennst weiter und erreichst ` +
        `<b>${s.location}</b>.<br><br>` +
        `Hinter dir schlägt etwas gegen eine Tür.`;
      d0317Log(s, `🏃 Weiter zu ${s.location}.`);
      d0317MonsterEvent(s);
      break;
    }

    case "hide": {
      s.hidden = true;
      d0317Gefahr(s, -1);
      d0317Ausdauer(s, 8);
      s.story =
        `🙈 Du versteckst dich. Dein Atem ist laut.<br><br>` +
        `<b>Die Schritte kommen näher …</b>`;
      d0317Log(s, "🙈 Versteckt.");

      if (s.enemy && Math.random() < 0.7) {
        s.enemy = false;
        d0317Log(s, "👹 Der Pfleger zieht weiter.");
      }
      break;
    }

    case "weapon": {
      s.armed = true;
      s.flash = true;

      s.story =
        s.ammo > 0
          ? "🔫 Du ziehst die Waffe. <b>Die Kreatur ist irgendwo hier.</b>"
          : "🔫 Die Waffe ist leer.";

      d0317Log(s, "🔫 Waffe bereit.");

      if (!s.enemy) {
        d0317Gefahr(s);

        if (Math.random() < 0.55) {
          s.enemy = true;
          s.enemyHP = 80;
          d0317Log(s, "👹 Ein Gegner erscheint.");
        }
      }

      break;
    }

    case "shoot": {
      if (!s.armed) {
        s.story =
          "🔫 Du hast die Waffe noch nicht bereit.";
        break;
      }

      if (s.ammo <= 0) {
        s.story =
          "🔫 <span class=\"danger\">Keine Munition!</span>";
        break;
      }

      s.ammo--;

      if (!s.enemy) {
        s.story =
          "💨 Du schießt ins Dunkel. <b>Nur ein Echo antwortet.</b>";
        d0317Gefahr(s);
        break;
      }

      s.enemyHP -= 40;

      if (s.enemyHP <= 0) {
        s.enemy = false;
        d0317Gefahr(s, -2);
        s.story =
          `💥 Treffer! Der Pfleger verschwindet in der Dunkelheit.<br><br>` +
          `<b>Der Weg ist frei.</b>`;
        d0317Log(s, "💥 Gegner besiegt.");
      } else {
        s.story =
          "💥 Treffer! <b>Aber er steht noch.</b>";
        d0317Verletzen(s, 8);
        d0317Log(s, "💥 Gegner getroffen.");
      }

      break;
    }

    case "door": {
      if (s.room < 8) {
        s.story =
          `🚪 Diese Tür führt tiefer ins Gebäude.<br><br>` +
          `<b>Vielleicht ist der Ausgang woanders.</b>`;
        d0317Gefahr(s);
        d0317MonsterEvent(s);
      } else if (s.key && !s.enemy) {
        d0317Gewinnen(s);
      } else if (s.enemy) {
        s.story =
          `🚪 Der Ausgang ist direkt vor dir – ` +
          `aber der Pfleger versperrt den Weg.`;
        d0317Verletzen(s, 7);
      } else {
        s.story =
          "🚪 Verschlossen. <b>Du brauchst den Schlüssel.</b>";
      }

      break;
    }

    case "heal": {
      if (s.med <= 0) {
        s.story = "🩹 Kein Medikit mehr.";
        break;
      }

      if (s.hp >= s.maxHp) {
        s.story =
          "❤️ Du bist bereits bei voller Gesundheit.";
        break;
      }

      s.med--;
      s.hp = Math.min(s.maxHp, s.hp + 35);
      s.story =
        "🩹 Du verbindest deine Wunde. <b>+35 Leben.</b>";
      d0317Log(s, "🩹 Medikit benutzt.");
      break;
    }

    case "chaos": {
      const actions = [
        "light",
        "search",
        "run",
        "hide",
        "weapon"
      ];

      return d0317Aktion(
        s.player,
        actions[zufall(0, actions.length - 1)]
      );
    }

    case "night": {
      d0317Gefahr(s, 2);
      s.story =
        `🌙 <span class="danger">Die Nacht wird dunkler.</span><br><br>` +
        `Etwas bewegt sich im Flur.`;
      d0317Log(s, "🌙 Die Nacht wurde ausgelöst.");
      d0317MonsterEvent(s);
      break;
    }

    case "map": {
      s.story =
        `🗺️ <b>Krankenhaus:</b><br>` +
        D0317_ROOMS
          .map((room, i) => `${i + 1} ${room}`)
          .join(" → ") +
        `<br><br>Du bist bei <b>${s.location}</b>.`;
      break;
    }

    default:
      s.story = "❔ Unbekannte 03:17-Aktion.";
  }

  d0317Ausdauer(s, 3);

  return s;
}

function d0317Antwort(
  username,
  text
) {
  const t = String(text || "").trim().toLowerCase();

  const ziel =
    D0317_PLAYER || normalisieren(username);

  if (/^!(?:0317|317)$/i.test(t)) {
    const s = d0317Spiel(ziel);

    return (
      `👁️ 03:17 ist aktiv für @${ziel}. ` +
      `Ort: ${s.location} • Leben: ${s.hp}/${s.maxHp} • ` +
      `Gefahr: ${s.danger}/5. ` +
      `Befehle: !licht !suchen !rennen !verstecken ` +
      `!waffe !schiessen !heilung !chaos !nacht`
    );
  }

  const befehle = {
    "!licht": "light",
    "!suchen": "search",
    "!rennen": "run",
    "!verstecken": "hide",
    "!waffe": "weapon",
    "!schiessen": "shoot",
    "!schießen": "shoot",
    "!tür": "door",
    "!heilung": "heal",
    "!heilen": "heal",
    "!chaos": "chaos",
    "!nacht": "night",
    "!weiter": "run",
    "!317karte": "map"
  };

  const action = befehle[t];

  if (!action) {
    return null;
  }

  const s = d0317Aktion(ziel, action);

  return (
    `👁️ 03:17 @${username}: ${t} → ` +
    `${s.location} | ❤️ ${s.hp}/${s.maxHp} | ` +
    `⚡ ${s.sta} | 🔋 ${s.bat} | 🔫 ${s.ammo} | ` +
    `Gefahr ${s.danger}/5` +
    (s.enemy ? ` | 👹 DER PFLEGER DA!` : "")
  );
}

function d0317JsonState(player) {
  const s = d0317Spiel(player);

  return {
    player: s.player,
    char: s.char,
    hp: s.hp,
    maxHp: s.maxHp,
    sta: s.sta,
    maxSta: s.maxSta,
    bat: s.bat,
    ammo: s.ammo,
    key: s.key,
    med: s.med,
    danger: s.danger,
    time: d0317ZeitText(s.time),
    room: s.room,
    rooms: D0317_ROOMS,
    location: s.location,
    hidden: s.hidden,
    armed: s.armed,
    enemy: s.enemy,
    enemyHP: s.enemyHP,
    ended: s.ended,
    story: s.story,
    log: s.log,
    streamerTarget: D0317_PLAYER
  };
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
    `!ruhmeshalle !legenden !fuchskern ` +
    `!tcg !booster !album !karten !karte`
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

  // 🛡️ Die Aktivität darf niemals die Chat-Verarbeitung blockieren.
  // Supabase läuft im Hintergrund; !quest, !fish, !inventar usw.
  // werden sofort weiterverarbeitet.
  void aktivitaetSpeichern(
    username
  );

  const w =
    spieler(username);

  w.messageCount++;

  try {

    let match;
    let antwort = null;

    const d0317AntwortText =
      d0317Antwort(username, text);

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


    /* 🃏 FUCHSWELT TCG */

    else if (/^!tcg$/i.test(text.trim())) {
      antwort = `🃏 TCG: !booster = 1 zufällige Karte • 24h Timer pro Zuschauer • !tcgtimer • !album • !karten • !karte FW-001 • !serien zeigt alle Serien.`;
    }

    else if (/^!serien$/i.test(text.trim())) {
      antwort = await fuchsTcgSerienListe(username);
    }

    else if (/^!tcgstatus$/i.test(text.trim())) {
      antwort = await fuchsTcgStatus(username);
    }

    else if (/^!tcgmeister$/i.test(text.trim())) {
      const s = await fuchsTcgLaden(username);
      antwort = s.karten[FUCHS_TCG_MEISTERKARTE.id]
        ? `👑 @${normalisieren(username)} Du besitzt bereits die Fuchswelt TCG Meisterkarte!`
        : `👑 @${normalisieren(username)} Die Meisterkarte bekommst du, wenn du alle ${FUCHS_TCG_SERIEN.length} Serien vollständig sammelst.`;
    }

    else if (/^!booster$/i.test(text.trim())) {
      antwort = await fuchsTcgBooster(username);
    }

    else if (/^!(fuchswelt|nachtfuchs|drachen|magier|geister|fantasy|vampire|feen|woelfe|katzen|weltraum|burgen|unterwasser|mystischerwald)$/i.test(text.trim())) {
      const key = text.trim().slice(1).toLowerCase();
      const serie = FUCHS_TCG_SERIEN_MAP.get(key);
      antwort = serie ? await fuchsTcgBooster(username, serie.filter) : await fuchsTcgBooster(username);
    }

    else if (/^!tcgtimer$/i.test(text.trim())) {
      antwort = await fuchsTcgTimer(username);
    }

    else if (/^!(album|karten)$/i.test(text.trim())) {
      antwort = text.trim().toLowerCase() === "!album" ? await fuchsTcgAlbum(username) : await fuchsTcgListe(username);
    }

    else if (/^!karte(?:\s+.+)?$/i.test(text.trim())) {
      antwort = await fuchsTcgKarteInfo(username, text.trim().replace(/^!karte\s*/i, ""));
    }

    else if (d0317AntwortText) {

      antwort =
        d0317AntwortText;
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

async function d0317Body(req) {
  return await new Promise((resolve, reject) => {
    let body = "";

    req.on("data", chunk => {
      body += chunk.toString();

      if (body.length > 100000) {
        reject(new Error("Request body too large."));
        try {
          req.destroy();
        } catch {}
      }
    });

    req.on("end", () => {
      if (!body.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Ungültiges JSON."));
      }
    });

    req.on("error", reject);
  });
}

const D0317_HTML = "<!doctype html>\n<html lang=\"de\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no\">\n<title>03:17 – DIE WELT IST FALSCH</title>\n<style>\n:root{--bg:#05070a;--panel:#10141d;--panel2:#171c27;--line:#303746;--text:#f1f3f7;--muted:#9aa2b2;--danger:#ff5b62;--good:#69e0a0;--gold:#e6c56b}\n*{box-sizing:border-box}\nhtml,body{margin:0;background:var(--bg);color:var(--text);font-family:system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif}\nbody{min-height:100vh}\n#app{max-width:1100px;margin:auto;min-height:100vh;background:linear-gradient(#080b11,#06080c)}\nheader{position:sticky;top:0;z-index:10;background:rgba(8,10,15,.96);backdrop-filter:blur(10px);padding:14px;border-bottom:1px solid var(--line)}\nh1{font-size:22px;margin:0 0 4px}\n.sub{color:var(--muted);font-size:13px}\nmain{padding:12px}\n.panel{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:12px;margin-bottom:12px}\n.row{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}\n.stat{background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:9px;text-align:center}\n.stat b{display:block;font-size:18px;margin-top:3px}\n.label{font-size:11px;color:var(--muted)}\nbutton,input{font:inherit}\nbutton{color:var(--text);background:var(--panel2);border:1px solid var(--line);border-radius:12px;min-height:48px;padding:9px 11px;font-weight:750}\nbutton:active{transform:scale(.98)}\n.actions{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}\n.actions button{min-height:54px}\nbutton.red{border-color:#71363b}\n.story{font-size:16px;line-height:1.5;min-height:115px}\n.good{color:var(--good)}.danger{color:var(--danger)}.gold{color:var(--gold)}\ninput{width:100%;background:#0b0e14;color:var(--text);border:1px solid var(--line);border-radius:12px;padding:12px}\n.selects{display:grid;grid-template-columns:1fr 1fr;gap:8px}\n.location{font-size:18px;font-weight:800}\n.bar{height:9px;background:#252a35;border-radius:20px;overflow:hidden;margin-top:5px}\n.fill{height:100%;width:0;background:#69e0a0;transition:.2s}\n#dangerFill{background:#ff5b62}\n.log{max-height:260px;overflow:auto;font-size:13px;line-height:1.45}\n.log div{padding:4px 0;border-bottom:1px solid rgba(255,255,255,.05)}\n.badge{display:inline-block;padding:4px 8px;border-radius:999px;background:#1b2230;margin:2px}\n.small{font-size:12px;color:var(--muted)}\n@media(max-width:650px){.row{grid-template-columns:repeat(2,1fr)}.actions{grid-template-columns:repeat(2,1fr)}.selects{grid-template-columns:1fr}}\n</style>\n</head>\n<body>\n<div id=\"app\">\n<header>\n  <h1>👁️ 03:17 – DIE WELT IST FALSCH</h1>\n  <div class=\"sub\">Integriert in MitsusundWandasWelt • Twitch-Chat steuert das Spiel live</div>\n</header>\n<main>\n  <section class=\"panel\">\n    <div class=\"selects\">\n      <div>\n        <div class=\"small\">Twitch-Spieler</div>\n        <input id=\"player\" placeholder=\"Twitch-Name\" value=\"streamer\">\n      </div>\n      <div>\n        <div class=\"small\">Charakter</div>\n        <select id=\"char\" style=\"width:100%;height:48px;background:#0b0e14;color:#fff;border:1px solid #303746;border-radius:12px;padding:0 10px\">\n          <option>Alex</option><option>Mika</option><option>Sam</option><option>Nora</option>\n        </select>\n      </div>\n    </div>\n    <div style=\"display:flex;gap:8px;margin-top:8px\">\n      <button style=\"flex:1\" onclick=\"startGame()\">▶️ Neues Spiel</button>\n      <button style=\"flex:1\" onclick=\"loadState()\">🔄 Aktualisieren</button>\n    </div>\n  </section>\n\n  <section class=\"panel\">\n    <div class=\"location\" id=\"location\">Patientenzimmer</div>\n    <div class=\"small\">Zimmer <span id=\"room\">1</span>/8 • Uhr <b id=\"clock\">03:17</b></div>\n    <div id=\"story\" class=\"story\" style=\"margin-top:10px\">Lade 03:17 …</div>\n  </section>\n\n  <section class=\"panel\">\n    <div class=\"row\">\n      <div class=\"stat\">❤️ Leben<b id=\"hp\">100</b></div>\n      <div class=\"stat\">⚡ Ausdauer<b id=\"sta\">100</b></div>\n      <div class=\"stat\">🔋 Batterie<b id=\"bat\">5</b></div>\n      <div class=\"stat\">🔫 Munition<b id=\"ammo\">6</b></div>\n    </div>\n    <div style=\"margin-top:8px\" class=\"small\">Gefahr: <b id=\"danger\">0/5</b></div>\n    <div class=\"bar\"><div id=\"dangerFill\" class=\"fill\"></div></div>\n    <div style=\"margin-top:8px\">\n      <span class=\"badge\">🔑 Schlüssel: <b id=\"key\">0</b></span>\n      <span class=\"badge\">🩹 Medikit: <b id=\"med\">1</b></span>\n      <span class=\"badge\" id=\"monsterBadge\">👹 Pfleger: nein</span>\n    </div>\n  </section>\n\n  <section class=\"panel actions\">\n    <button onclick=\"act('light')\">🔦 Licht</button>\n    <button onclick=\"act('search')\">🔎 Suchen</button>\n    <button onclick=\"act('run')\">🏃 Rennen</button>\n    <button onclick=\"act('hide')\">🙈 Verstecken</button>\n    <button onclick=\"act('weapon')\">🔫 Waffe</button>\n    <button onclick=\"act('shoot')\">💥 Schießen</button>\n    <button onclick=\"act('heal')\">🩹 Heilung</button>\n    <button onclick=\"act('door')\">🚪 Tür</button>\n    <button onclick=\"act('map')\">🗺️ Karte</button>\n    <button class=\"red\" onclick=\"act('chaos')\">🌀 Chaos</button>\n    <button class=\"red\" onclick=\"act('night')\">🌙 Nacht</button>\n    <button onclick=\"act('reset')\">↻ Neustart</button>\n  </section>\n\n  <section class=\"panel\">\n    <b>💬 Twitch-Steuerung</b>\n    <p class=\"small\">Im Twitch-Chat können Zuschauer das Spiel steuern:</p>\n    <div class=\"small\">\n      !licht • !suchen • !rennen • !verstecken • !waffe • !schiessen •\n      !heilung • !chaos • !nacht • !weiter • !317karte\n    </div>\n  </section>\n\n  <section class=\"panel\">\n    <b>📜 Ereignisse</b>\n    <div id=\"log\" class=\"log\" style=\"margin-top:8px\"></div>\n  </section>\n</main>\n</div>\n<script>\nconst $=id=>document.getElementById(id);\nlet timer=null;\n\nfunction player(){\n  return ($(\"player\").value||\"streamer\").trim().toLowerCase();\n}\n\nasync function api(path, options={}){\n  const r=await fetch(path,{\n    cache:\"no-store\",\n    ...options,\n    headers:{\n      \"Content-Type\":\"application/json\",\n      ...(options.headers||{})\n    }\n  });\n  if(!r.ok) throw new Error(\"HTTP \"+r.status);\n  return await r.json();\n}\n\nfunction render(s){\n  $(\"location\").textContent=s.location;\n  $(\"room\").textContent=s.room;\n  $(\"clock\").textContent=s.time;\n  $(\"hp\").textContent=s.hp+\"/\"+s.maxHp;\n  $(\"sta\").textContent=s.sta+\"/\"+s.maxSta;\n  $(\"bat\").textContent=s.bat;\n  $(\"ammo\").textContent=s.ammo;\n  $(\"danger\").textContent=s.danger+\"/5\";\n  $(\"dangerFill\").style.width=(s.danger*20)+\"%\";\n  $(\"key\").textContent=s.key;\n  $(\"med\").textContent=s.med;\n  $(\"monsterBadge\").textContent=s.enemy?\"👹 Pfleger: DA!\":\"👹 Pfleger: nein\";\n  $(\"story\").innerHTML=s.story;\n  $(\"log\").innerHTML=(s.log||[]).map(x=>\"<div>\"+escapeHtml(x)+\"</div>\").join(\"\");\n}\n\nfunction escapeHtml(x){\n  return String(x).replace(/[&<>\"']/g,m=>({\"&\":\"&amp;\",\"<\":\"&lt;\",\">\":\"&gt;\",'\"':\"&quot;\",\"'\":\"&#39;\"}[m]));\n}\n\nasync function loadState(){\n  try{\n    const s=await api(\"/0317-state?player=\"+encodeURIComponent(player()));\n    $(\"char\").value=s.char;\n    render(s);\n  }catch(e){\n    $(\"story\").textContent=\"⚠️ 03:17 konnte nicht geladen werden.\";\n  }\n}\n\nasync function act(action){\n  try{\n    const s=await api(\"/0317-action\",{\n      method:\"POST\",\n      body:JSON.stringify({player:player(),action})\n    });\n    render(s);\n  }catch(e){\n    $(\"story\").textContent=\"⚠️ Aktion konnte nicht ausgeführt werden.\";\n  }\n}\n\nasync function startGame(){\n  try{\n    const s=await api(\"/0317-action\",{\n      method:\"POST\",\n      body:JSON.stringify({\n        player:player(),\n        action:\"reset\",\n        char:$(\"char\").value\n      })\n    });\n    render(s);\n  }catch(e){\n    $(\"story\").textContent=\"⚠️ Neues Spiel konnte nicht gestartet werden.\";\n  }\n}\n\nloadState();\ntimer=setInterval(loadState,1000);\n</script>\n</body>\n</html>\n";

const server =
  http.createServer(
    async (req, res) => {

      try {

        /* 👁️ 03:17 – API / SPIEL */
        const reqUrl =
          new URL(
            req.url,
            "http://localhost"
          );

        if (reqUrl.pathname === "/tcg-overlay" && req.method === "GET") {
          res.writeHead(200, {"Content-Type":"text/html; charset=utf-8", "Cache-Control":"no-store"});
          res.end(FUCHS_TCG_OVERLAY_HTML);
          return;
        }

        if (reqUrl.pathname === "/tcg-live" && req.method === "GET") {
          const live = fuchsTcgLive && fuchsTcgLive.expiresAt > Date.now() ? fuchsTcgLive : null;
          res.writeHead(200, {"Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store"});
          res.end(JSON.stringify({live}));
          return;
        }

        if (reqUrl.pathname === "/tcg" && req.method === "GET") {
          res.writeHead(200, {"Content-Type":"text/html; charset=utf-8", "Cache-Control":"no-store"});
          res.end(FUCHS_TCG_HTML);
          return;
        }

        if (reqUrl.pathname === "/tcg-data" && req.method === "GET") {
          const player = normalisieren(reqUrl.searchParams.get("player") || "streamer");
          const s = await fuchsTcgLaden(player);
          const cards = FUCHS_TCG_KARTEN.map(k => ({...k, count:Number(s.karten[k.id] || 0)})).filter(k => k.count > 0);
          res.writeHead(200, {"Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store"});
          res.end(JSON.stringify({player, collected:cards.length, total:FUCHS_TCG_KARTEN.length, nextOpenAt:Number(s.naechsteOeffnung || 0), cards}));
          return;
        }

        if (reqUrl.pathname === "/tcg-open" && req.method === "POST") {
          const body = await d0317Body(req);
          const player = normalisieren(body.player || "streamer");
          const message = await fuchsTcgBooster(player, body.serie ? (FUCHS_TCG_SERIEN_MAP.get(String(body.serie).toLowerCase())?.filter || null) : null);
          const s = await fuchsTcgLaden(player);
          const cards = FUCHS_TCG_KARTEN.map(k => ({...k, count:Number(s.karten[k.id] || 0)})).filter(k => k.count > 0);
          res.writeHead(200, {"Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store"});
          res.end(JSON.stringify({message, player, collected:cards.length, total:FUCHS_TCG_KARTEN.length, nextOpenAt:Number(s.naechsteOeffnung || 0), cards}));
          return;
        }

        if (
          reqUrl.pathname === "/0317"
        ) {

          const html = D0317_HTML;

          res.writeHead(
            200,
            {
              "Content-Type":
                "text/html; charset=utf-8",
              "Cache-Control":
                "no-store"
            }
          );

          res.end(html);
          return;
        }

        if (
          reqUrl.pathname === "/0317-state" &&
          req.method === "GET"
        ) {

          const player =
            normalisieren(
              reqUrl.searchParams.get("player") ||
              D0317_PLAYER
            );

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
            JSON.stringify(
              d0317JsonState(player)
            )
          );

          return;
        }

        if (
          reqUrl.pathname === "/0317-action" &&
          req.method === "POST"
        ) {

          const body =
            await d0317Body(req);

          const player =
            normalisieren(
              body.player ||
              D0317_PLAYER
            );

          const action =
            normalisieren(
              body.action ||
              ""
            );

          const s =
            d0317Aktion(
              player,
              action,
              body.char || null
            );

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
            JSON.stringify(
              d0317JsonState(
                s.player
              )
            )
          );

          return;
        }

        /* HEALTH CHECK */

        if (
          req.url === "/health"
        ) {

          res.writeHead(
            200,
            {
              "Content-Type":
                "text/plain; charset=utf-8"
            }
          );

          res.end("ok");

          return;
        }


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
   📡 STREAMELEMENTS ASTRO WEBSOCKET – ROBUST RECONNECT
========================================================= */

let ws = null;
let reconnectToken = null;
let reconnectTimer = null;
let reconnectDelay = 5000;
let heartbeatTimer = null;
let heartbeatTimeout = null;
let wsGeneration = 0;
let usingReconnectToken = false;
let wsLastPongAt = 0;
let wsLastMessageAt = 0;

function reconnectTimerStoppen() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function heartbeatStoppen() {
  clearInterval(heartbeatTimer);
  clearTimeout(heartbeatTimeout);
  heartbeatTimer = null;
  heartbeatTimeout = null;
}

function heartbeatStarten(localWs) {
  heartbeatStoppen();

  wsLastPongAt = Date.now();

  heartbeatTimer = setInterval(() => {
    if (
      !localWs ||
      localWs !== ws ||
      localWs.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    let pongErhalten = false;

    const pongHandler = () => {
      pongErhalten = true;
      wsLastPongAt = Date.now();
    };

    localWs.once("pong", pongHandler);

    try {
      localWs.ping();
    } catch (error) {
      console.error(
        "❌ StreamElements Ping-Fehler:",
        error.message
      );

      try {
        localWs.terminate();
      } catch {}

      return;
    }

    clearTimeout(heartbeatTimeout);

    heartbeatTimeout = setTimeout(() => {
      if (
        !pongErhalten &&
        localWs === ws &&
        localWs.readyState === WebSocket.OPEN
      ) {
        console.error(
          "🚨 StreamElements antwortet nicht – Verbindung wird automatisch neu aufgebaut."
        );

        try {
          localWs.terminate();
        } catch {}
      }
    }, 10000);
  }, 20000);
}

function reconnectPlanen(delay = reconnectDelay) {
  if (reconnectTimer) {
    return;
  }

  const wait = Math.max(1000, delay);

  console.log(
    `🔁 StreamElements: neuer Verbindungsversuch in ${Math.round(wait / 1000)} Sekunden.`
  );

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    streamelementsVerbinden();
  }, wait);

  reconnectDelay = Math.min(reconnectDelay * 2, 60000);
}

function streamelementsVerbinden() {
  if (!STREAMELEMENTS_JWT) {
    console.error(
      "❌ STREAMELEMENTS_JWT fehlt."
    );
    return;
  }

  if (
    ws &&
    (
      ws.readyState === WebSocket.OPEN ||
      ws.readyState === WebSocket.CONNECTING
    )
  ) {
    return;
  }

  const generation = ++wsGeneration;
  const token = reconnectToken;

  // Ein Reconnect-Token wird nur für genau einen Verbindungsversuch benutzt.
  reconnectToken = null;
  usingReconnectToken = Boolean(token);

  const url = token
    ? `wss://astro.streamelements.com/?reconnect_token=${encodeURIComponent(token)}`
    : "wss://astro.streamelements.com/";

  console.log(
    token
      ? "🔌 StreamElements: verbinde mit Reconnect-Token..."
      : "🔌 StreamElements: neue WebSocket-Verbindung..."
  );

  const localWs = new WebSocket(url);
  ws = localWs;
  wsLastMessageAt = Date.now();

  localWs.on("open", () => {
    if (generation !== wsGeneration || localWs !== ws) {
      try {
        localWs.close();
      } catch {}
      return;
    }

    console.log(
      "✅ StreamElements WebSocket verbunden."
    );

    reconnectTimerStoppen();
    reconnectDelay = 5000;
    heartbeatStarten(localWs);
  });

  localWs.on("message", async raw => {
    if (generation !== wsGeneration || localWs !== ws) {
      return;
    }

    wsLastMessageAt = Date.now();

    try {
      const message = JSON.parse(raw.toString());

      if (message.type === "welcome") {
        if (usingReconnectToken) {
          console.log(
            "♻️ StreamElements Reconnect erfolgreich – bestehende Abos wurden wiederhergestellt."
          );

          usingReconnectToken = false;
        } else {
          localWs.send(
            JSON.stringify({
              type: "subscribe",
              nonce: `fuchs-${Date.now()}`,
              data: {
                topic: "channel.chat.message",
                token: STREAMELEMENTS_JWT,
                token_type: "jwt"
              }
            })
          );

          console.log(
            "📡 channel.chat.message abonniert."
          );
        }

        return;
      }

      if (message.type === "reconnect") {
        const tokenNeu =
          message?.data?.reconnect_token || null;

        if (tokenNeu) {
          reconnectToken = tokenNeu;
        }

        usingReconnectToken = Boolean(tokenNeu);

        console.log(
          "♻️ StreamElements fordert einen kontrollierten Reconnect an."
        );

        try {
          localWs.close();
        } catch {
          try {
            localWs.terminate();
          } catch {}
        }

        return;
      }

      // Wichtig: Ein einzelner kaputter/langsamer Chat-Befehl darf die
      // WebSocket-Verarbeitung niemals blockieren.
      if (message.type === "message") {
        void chatVerarbeiten(message).catch(error => {
          console.error(
            "❌ Chat-Verarbeitung:",
            error.message
          );
        });
      }
    } catch (error) {
      console.error(
        "❌ WebSocket Nachricht:",
        error.message
      );
    }
  });

  localWs.on("close", (code, reason) => {
    if (generation !== wsGeneration || localWs !== ws) {
      return;
    }

    heartbeatStoppen();
    ws = null;

    const reasonText = reason?.toString?.() || "";

    console.log(
      `🔁 StreamElements getrennt (Code ${code}${reasonText ? `, ${reasonText}` : ""}).`
    );

    // Wenn ein kontrollierter Reconnect angekündigt wurde, verwenden wir
    // den gespeicherten Token. Bei allen anderen Abbrüchen wird eine frische
    // Verbindung aufgebaut und das Chat-Abo erneut gesetzt.
    reconnectPlanen();
  });

  localWs.on("error", error => {
    if (generation !== wsGeneration || localWs !== ws) {
      return;
    }

    console.error(
      "❌ StreamElements WebSocket:",
      error.message
    );

    // close folgt normalerweise direkt danach und plant den Reconnect.
    try {
      if (
        localWs.readyState === WebSocket.OPEN ||
        localWs.readyState === WebSocket.CONNECTING
      ) {
        localWs.terminate();
      }
    } catch (closeError) {
      console.error(
        "❌ StreamElements Verbindung schließen:",
        closeError.message
      );
    }
  });
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
