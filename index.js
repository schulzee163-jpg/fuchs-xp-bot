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
  process.env.STREAMELEMENTS_CHANNEL || null;

function normalisieren(username) {
  return String(username || "").trim().toLowerCase();
}

async function supabase(path, options = {}) {
  const response = await fetch(
    `${SUPABASE_URL}${path}`,
    {
      ...options,
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization:
          `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    }
  );

  const text = await response.text();

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      `Supabase ${response.status}: ${text}`
    );
  }

  return data;
}

async function streamElementsChannelHolen() {
  if (streamElementsChannel) {
    return streamElementsChannel;
  }

  if (!STREAMELEMENTS_JWT) {
    return null;
  }

  try {
    const response = await fetch(
      "https://api.streamelements.com/kappa/v2/channels/me",
      {
        headers: {
          Authorization:
            `Bearer ${STREAMELEMENTS_JWT}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(
        "❌ StreamElements Channel:",
        response.status
      );
      return null;
    }

    const data = await response.json();

    streamElementsChannel =
      data?._id || null;

    return streamElementsChannel;
  } catch (error) {
    console.error(
      "❌ StreamElements Channel:",
      error.message
    );

    return null;
  }
}

function warten(ms) {
  return new Promise(resolve =>
    setTimeout(resolve, ms)
  );
}

async function streamelementsSenden(text) {
  if (!text || !String(text).trim()) {
    return false;
  }

  if (!STREAMELEMENTS_JWT) {
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
      const channelId =
        await streamElementsChannelHolen();

      if (!channelId) {
        return false;
      }

      const response = await fetch(
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
            Accept: "application/json",
          },
          body: JSON.stringify({
            message: String(text),
          }),
        }
      );

      const body =
        await response.text();

      console.log(
        `📤 StreamElements Versuch ${versuch}/3 ${response.status}: ${body}`
      );

      if (response.ok) {
        return true;
      }

      if (versuch < 3) {
        await warten(800);
      }
    } catch (error) {
      console.error(
        `❌ StreamElements Versuch ${versuch}/3:`,
        error.message
      );

      if (versuch < 3) {
        await warten(800);
      }
    }
  }

  return false;
}

const eigenePokemon = {
  fuchsmissvegetalover2_0:
    "Pikachu",
  vegetalover2_0:
    "Glumanda",
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

const rudelMap = {
  feuer: "🔥 Feuerrudel",
  wasser: "🌊 Wasserrudel",
  wald: "🌲 Waldrudel",
  ice: "🧊 ICErudel",
};

const offeneKaempfe = new Map();

const persoenlicheQuests = new Map();

const standardQuests = [
  {
    text:
      "Schreibe 5 Nachrichten im Chat",
    ziel: 5,
    xp: 50,
  },
];

async function spielerProfilHolen(
  username
) {
  username = normalisieren(username);

  const rows = await supabase(
    `/rest/v1/fuchsprofile?spieler=eq.${encodeURIComponent(
      username
    )}&limit=1`,
    {
      method: "GET",
    }
  );

  return rows?.[0] || null;
}

async function spielerAnlegen(
  username
) {
  username = normalisieren(username);

  if (!username) {
    return null;
  }

  const vorhanden =
    await spielerProfilHolen(
      username
    );

  if (vorhanden) {
    return vorhanden;
  }

  const rows = await supabase(
    "/rest/v1/fuchsprofile",
    {
      method: "POST",
      headers: {
        Prefer:
          "return=representation",
      },
      body: JSON.stringify({
        spieler: username,
        xp: 0,
        rudel: null,
        pokemon: null,
        pvp_siege: 0,
        pvp_niederlagen: 0,
      }),
    }
  );

  return rows?.[0] || null;
}

async function xpHinzufuegen(
  username,
  menge
) {
  username = normalisieren(username);

  const profil =
    await spielerAnlegen(username);

  const neuesXp =
    Number(profil?.xp || 0) +
    Number(menge || 0);

  await supabase(
    `/rest/v1/fuchsprofile?spieler=eq.${encodeURIComponent(
      username
    )}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        xp: neuesXp,
      }),
    }
  );

  return neuesXp;
}

async function rudelHolen(profil) {
  return profil?.rudel || null;
}

async function pokemonHolen(username) {
  username = normalisieren(username);

  if (
    Object.prototype.hasOwnProperty.call(
      eigenePokemon,
      username
    )
  ) {
    return eigenePokemon[username];
  }

  const profil =
    await spielerProfilHolen(
      username
    );

  return profil?.pokemon || null;
}

function pokemonNameNormalisieren(
  name
) {
  return String(name || "").trim();
}

async function pokemonWahl(
  username,
  pokemon
) {
  username = normalisieren(username);

  await spielerAnlegen(username);

  if (!pokemon) {
    const aktuell =
      await pokemonHolen(username);

    if (aktuell) {
      return (
        `⚡ @${username} dein Pokémon ist ${aktuell}!`
      );
    }

    return (
      `⚡ @${username} Wähle ein Pokémon: ${pokemonListe.join(
        ", "
      )}`
    );
  }

  const gesucht =
    pokemonNameNormalisieren(
      pokemon
    );

  const gefunden =
    pokemonListe.find(
      p =>
        p.toLowerCase() ===
        gesucht.toLowerCase()
    );

  if (!gefunden) {
    return (
      `@${username} ❌ Dieses Pokémon gibt es nicht.`
    );
  }

  await supabase(
    `/rest/v1/fuchsprofile?spieler=eq.${encodeURIComponent(
      username
    )}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        pokemon: gefunden,
      }),
    }
  );

  return (
    `⚡ @${username} dein Pokémon ist jetzt ${gefunden}!`
  );
}

async function persoenlicheQuestsAnlegen(
  username
) {
  username = normalisieren(username);

  if (
    persoenlicheQuests.has(username)
  ) {
    return;
  }

  const quest =
    standardQuests[
      Math.floor(
        Math.random() *
          standardQuests.length
      )
    ];

  persoenlicheQuests.set(
    username,
    {
      text: quest.text,
      ziel: quest.ziel,
      fortschritt: 0,
      xp: quest.xp,
      abgeschlossen: false,
    }
  );
}

function persoenlicheQuestStatusHolen(
  username
) {
  username = normalisieren(username);

  return (
    persoenlicheQuests.get(username) || {
      text:
        "Schreibe 5 Nachrichten im Chat",
      ziel: 5,
      fortschritt: 0,
      xp: 50,
      abgeschlossen: false,
    }
  );
}

async function persoenlicheQuestsHolen(
  username
) {
  username = normalisieren(username);

  await persoenlicheQuestsAnlegen(
    username
  );

  return [
    persoenlicheQuestStatusHolen(
      username
    ),
  ];
}

async function persoenlicheQuestAnzeigen(
  username
) {
  username = normalisieren(username);

  try {
    const quests =
      await persoenlicheQuestsHolen(
        username
      );

    const quest = quests[0];

    if (!quest) {
      return `🎯 @${username} Es wurde noch keine persönliche Quest erstellt.`;
    }

    if (quest.abgeschlossen) {
      return `🎯 @${username} deine persönliche Quest ist bereits abgeschlossen! +${quest.xp} XP 🦊`;
    }

    return (
      `🎯 @${username} persönliche Quest: ${quest.text} ` +
      `(${quest.fortschritt}/${quest.ziel}) – Belohnung: ${quest.xp} XP`
    );
  } catch (error) {
    console.error(
      "❌ Persönliche Quest anzeigen:",
      error.message
    );

    return `@${username} ❌ Die Quest konnte gerade nicht geladen werden.`;
  }
}

async function persoenlicheQuestPruefen(
  username,
  text
) {
  username = normalisieren(username);

  if (
    !text ||
    !String(text).trim()
  ) {
    return;
  }

  try {
    await persoenlicheQuestsAnlegen(
      username
    );

    const quest =
      persoenlicheQuestStatusHolen(
        username
      );

    if (quest.abgeschlossen) {
      return;
    }

    quest.fortschritt += 1;

    if (
      quest.fortschritt >=
      quest.ziel
    ) {
      quest.fortschritt =
        quest.ziel;

      quest.abgeschlossen = true;

      await xpHinzufuegen(
        username,
        quest.xp
      );

      await streamelementsSenden(
        `🎉 @${username} persönliche Quest abgeschlossen! +${quest.xp} XP 🦊`
      );
    }

    persoenlicheQuests.set(
      username,
      quest
    );
  } catch (error) {
    console.error(
      "❌ Persönliche Quest prüfen:",
      error.message
    );
  }
}

async function aktivitaetSpeichern(
  username
) {
  try {
    await spielerAnlegen(
      username
    );
  } catch (error) {
    console.error(
      "❌ Aktivität speichern:",
      error.message
    );
  }
}

async function rudelwahl(
  username,
  auswahl
) {
  username = normalisieren(username);

  await spielerAnlegen(username);

  const key =
    String(auswahl || "")
      .trim()
      .toLowerCase();

  if (!rudelMap[key]) {
    return (
      `@${username} ❌ Wähle: Feuer, Wasser, Wald oder ICE.`
    );
  }

  await supabase(
    `/rest/v1/fuchsprofile?spieler=eq.${encodeURIComponent(
      username
    )}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        rudel: rudelMap[key],
      }),
    }
  );

  return (
    `🐾 @${username} gehört jetzt zum ${rudelMap[key]}!`
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
      await pokemonHolen(username);

    return (
      `🦊 @${username} | XP: ${
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
        p.pvp_niederlagen || 0
      }`
    );
  } catch (error) {
    console.error(
      "❌ Profil:",
      error.message
    );

    return `@${username} ❌ Profil konnte nicht geladen werden.`;
  }
}

async function questsPruefen(
  username,
  text
) {
  if (!text) {
    return;
  }

  await persoenlicheQuestPruefen(
    username,
    text
  );
}

function kampfGewinnerBestimmen(
  angreifer,
  verteidiger
) {
  const zufall =
    Math.random();

  if (zufall < 0.5) {
    return angreifer;
  }

  return verteidiger;
}

async function pvpStart(
  username,
  gegner
) {
  username = normalisieren(username);
  gegner = normalisieren(gegner);

  if (
    !gegner ||
    gegner === username
  ) {
    return (
      `@${username} Du kannst dich nicht selbst herausfordern.`
    );
  }

  const angreifer =
    await spielerAnlegen(
      username
    );

  const verteidiger =
    await spielerAnlegen(
      gegner
    );

  if (!angreifer) {
    return (
      `@${username} ❌ Dein Profil konnte nicht geladen werden.`
    );
  }

  if (!verteidiger) {
    return (
      `@${username} ❌ Das Profil von @${gegner} konnte nicht geladen werden.`
    );
  }

  if (offeneKaempfe.size) {
    return (
      `@${username} ⚔️ Es läuft bereits eine Kampf-Anfrage.`
    );
  }

  const kampf = {
    typ: "rudel",
    herausforderer: username,
    gegner,
    erstellt: Date.now(),
  };

  offeneKaempfe.set(
    gegner,
    kampf
  );

  if (
    gegner ===
    "fuchsmissvegetalover2_0"
  ) {
    const antwort =
      await kampfAnnehmen(
        gegner
      );

    if (antwort) {
      await streamelementsSenden(
        `@${gegner} 🤝 Kampf automatisch angenommen!`
      );

      await streamelementsSenden(
        antwort
      );

      return null;
    }
  }

  return (
    `⚔️ @${username} fordert @${gegner} zum Rudel-PvP heraus! ` +
    `@${gegner} hat 60 Sekunden Zeit mit !annehmen zu antworten!`
  );
}

async function pokemonKampfStart(
  username,
  gegner
) {
  username = normalisieren(username);
  gegner = normalisieren(gegner);

  if (
    !gegner ||
    gegner === username
  ) {
    return (
      `@${username} Du kannst dich nicht selbst zum Pokémon-Kampf herausfordern.`
    );
  }

  const linksPokemon =
    await pokemonHolen(username);

  const rechtsPokemon =
    await pokemonHolen(gegner);

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

  if (offeneKaempfe.size) {
    return (
      `@${username} ⚔️ Es läuft bereits eine Kampf-Anfrage.`
    );
  }

  const kampf = {
    typ: "pokemon",
    herausforderer: username,
    gegner,
    herausfordererPokemon:
      linksPokemon,
    gegnerPokemon:
      rechtsPokemon,
    erstellt: Date.now(),
  };

  offeneKaempfe.set(
    gegner,
    kampf
  );

  if (
    gegner ===
    "fuchsmissvegetalover2_0"
  ) {
    const antwort =
      await kampfAnnehmen(
        gegner
      );

    if (antwort) {
      await streamelementsSenden(
        `@${gegner} 🤝 Pokémon-Kampf automatisch angenommen!`
      );

      await streamelementsSenden(
        antwort
      );

      return null;
    }
  }

  return (
    `🐾⚔️ @${username} fordert @${gegner} zum Pokémon-Kampf heraus! ` +
    `@${gegner} kann mit !annehmen annehmen.`
  );
}

async function kampfAnnehmen(
  username
) {
  username = normalisieren(username);

  let kampf = null;

  for (
    const [
      ziel,
      anfrage,
    ] of offeneKaempfe.entries()
  ) {
    if (
      ziel === username
    ) {
      kampf = anfrage;
      break;
    }
  }

  if (!kampf) {
    return (
      `@${username} ❌ Es gibt keine offene Kampf-Anfrage für dich.`
    );
  }

  offeneKaempfe.delete(
    username
  );

  const angreiferName =
    kampf.herausforderer;

  const verteidigerName =
    kampf.gegner;

  const angreifer =
    await spielerAnlegen(
      angreiferName
    );

  const verteidiger =
    await spielerAnlegen(
      verteidigerName
    );

  const gewinnerName =
    kampfGewinnerBestimmen(
      angreiferName,
      verteidigerName
    );

  const verliererName =
    gewinnerName ===
    angreiferName
      ? verteidigerName
      : angreiferName;

  await xpHinzufuegen(
    gewinnerName,
    100
  );

  try {
    await supabase(
      `/rest/v1/fuchsprofile?spieler=eq.${encodeURIComponent(
        gewinnerName
      )}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          pvp_siege:
            Number(
              (
                await spielerProfilHolen(
                  gewinnerName
                )
              )?.pvp_siege || 0
            ) + 1,
        }),
      }
    );

    await supabase(
      `/rest/v1/fuchsprofile?spieler=eq.${encodeURIComponent(
        verliererName
      )}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          pvp_niederlagen:
            Number(
              (
                await spielerProfilHolen(
                  verliererName
                )
              )?.pvp_niederlagen || 0
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
    kampf.typ === "pokemon"
  ) {
    return (
      `⚡ POKÉMON-KAMPF! ` +
      `@${kampf.herausforderer} ${kampf.herausfordererPokemon} ⚔️ ` +
      `@${kampf.gegner} ${kampf.gegnerPokemon} ` +
      `→ 🏆 @${gewinnerName} gewinnt +100 XP!`
    );
  }

  return (
    `⚔️ RUDEL-KAMPF! ` +
    `@${kampf.herausforderer} [${
      angreifer?.rudel ||
      "kein Rudel"
    }] ⚔️ ` +
    `@${kampf.gegner} [${
      verteidiger?.rudel ||
      "kein Rudel"
    }] ` +
    `→ 🏆 @${gewinnerName} gewinnt +100 XP!`
  );
}

async function pvpAnnehmen(
  username
) {
  return kampfAnnehmen(
    username
  );
}
async function alleBefehle(
  username
) {
  return (
    `@${username} 🦊 Befehle: ` +
    `!profil | !rudelwahl Feuer/Wasser/Wald/ICE | ` +
    `!pokemon | !pokemon Name | !quest | ` +
    `!pvp @Name | !pokekampf @Name | ` +
    `!annehmen | !allebefehle`
  );
}

async function chatVerarbeiten(
  message
) {
  if (
    message.type === "response"
  ) {
    return;
  }

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

  const data = message.data;

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
    normalisieren(usernameRaw);

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
    try {
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
    } catch (error) {
      console.error(
        "❌ !pvp:",
        error.message
      );

      await streamelementsSenden(
        `@${username} ❌ Der PvP-Kampf konnte gerade nicht gestartet werden.`
      );
    }

    return;
  }

  const pokemonMatch =
    text.match(
      /^!pokemon(?:\s+(.+))?$/i
    );

  if (pokemonMatch) {
    try {
      const antwort =
        await pokemonWahl(
          username,
          pokemonMatch[1]
        );

      if (antwort) {
        await streamelementsSenden(
          antwort
        );
      }
    } catch (error) {
      console.error(
        "❌ !pokemon:",
        error.message
      );

      await streamelementsSenden(
        `@${username} ❌ Pokémon konnte gerade nicht verarbeitet werden.`
      );
    }

    return;
  }

  const pokemonKampfMatch =
    text.match(
      /^!pokekampf\s+@?([a-zA-Z0-9_]+)$/i
    );

  if (pokemonKampfMatch) {
    try {
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
    } catch (error) {
      console.error(
        "❌ !pokekampf:",
        error.message
      );

      await streamelementsSenden(
        `@${username} ❌ Der Pokémon-Kampf konnte gerade nicht gestartet werden.`
      );
    }

    return;
  }

  if (
    /^!annehmen$/i.test(
      text.trim()
    )
  ) {
    try {
      const antwort =
        await pvpAnnehmen(
          username
        );

      if (antwort) {
        await streamelementsSenden(
          antwort
        );
      }
    } catch (error) {
      console.error(
        "❌ !annehmen:",
        error.message
      );

      await streamelementsSenden(
        `@${username} ❌ Der Kampf konnte gerade nicht angenommen werden.`
      );
    }

    return;
  }

  if (
    /^!profil$/i.test(
      text.trim()
    )
  ) {
    try {
      const antwort =
        await profil(username);

      if (antwort) {
        await streamelementsSenden(
          antwort
        );
      }
    } catch (error) {
      console.error(
        "❌ !profil:",
        error.message
      );

      await streamelementsSenden(
        `@${username} ❌ Dein Profil konnte gerade nicht geladen werden.`
      );
    }

    return;
  }

  const rudelMatch =
    text.match(
      /^!rudelwahl\s+(.+)$/i
    );

  if (rudelMatch) {
    try {
      const antwort =
        await rudelwahl(
          username,
          rudelMatch[1]
        );

      if (antwort) {
        await streamelementsSenden(
          antwort
        );
      }
    } catch (error) {
      console.error(
        "❌ !rudelwahl:",
        error.message
      );

      await streamelementsSenden(
        `@${username} ❌ Die Rudelwahl konnte gerade nicht verarbeitet werden.`
      );
    }

    return;
  }

  if (
    /^!quest$/i.test(
      text.trim()
    )
  ) {
    try {
      const antwort =
        await persoenlicheQuestAnzeigen(
          username
        );

      if (antwort) {
        await streamelementsSenden(
          antwort
        );
      }
    } catch (error) {
      console.error(
        "❌ !quest:",
        error.message
      );

      await streamelementsSenden(
        `@${username} ❌ Die Quest konnte gerade nicht geladen werden.`
      );
    }

    return;
  }

  if (
    /^!allebefehle$/i.test(
      text.trim()
    )
  ) {
    try {
      const antwort =
        await alleBefehle(
          username
        );

      if (antwort) {
        await streamelementsSenden(
          antwort
        );
      }
    } catch (error) {
      console.error(
        "❌ !allebefehle:",
        error.message
      );
    }

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

let aktuellerPvpKampf =
  null;

const server =
  http.createServer(
    async (req, res) => {
      try {
        if (
          req.url === "/"
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

        if (
          req.url === "/pvp"
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
  content="width=device-width,initial-scale=1.0"
>

<title>Fuchs PvP</title>

<style>

html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent;
  font-family: Arial, sans-serif;
}

#app {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card {
  min-width: 700px;
  max-width: 90vw;
  padding: 28px;
  border-radius: 24px;
  background: rgba(20,20,20,.92);
  color: white;
  text-align: center;
  box-shadow:
    0 0 30px rgba(0,0,0,.5);
}

.title {
  font-size: 38px;
  font-weight: 900;
  margin-bottom: 25px;
}

.fighters {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 30px;
}

.fighter {
  min-width: 250px;
  padding: 20px;
  border-radius: 18px;
  background: rgba(255,255,255,.08);
}

.name {
  font-size: 27px;
  font-weight: 800;
}

.detail {
  margin-top: 10px;
  font-size: 22px;
}

.vs {
  font-size: 40px;
  font-weight: 900;
}

.winner {
  margin-top: 25px;
  font-size: 28px;
  font-weight: 900;
}

</style>
</head>

<body>

<div id="app"></div>

<script>

async function laden() {

  try {

    const response =
      await fetch("/pvp-data");

    const data =
      await response.json();

    const app =
      document.getElementById(
        "app"
      );

    if (
      !data ||
      !data.kampf
    ) {
      app.innerHTML = "";
      return;
    }

    const k =
      data.kampf;

    const pokemon =
      k.typ === "pokemon";

    const title =
      pokemon
        ? "🐾 POKÉMON-KAMPF 🐾"
        : "⚔️ RUDEL-KAMPF ⚔️";

    const detail1 =
      pokemon
        ? (
            k.angreiferPokemon ||
            ""
          )
        : (
            k.angreiferRudel ||
            ""
          );

    const detail2 =
      pokemon
        ? (
            k.verteidigerPokemon ||
            ""
          )
        : (
            k.verteidigerRudel ||
            ""
          );

    app.innerHTML = \`
      <div class="card">

        <div class="title">
          \${title}
        </div>

        <div class="fighters">

          <div class="fighter">

            <div class="name">
              @\${k.angreifer}
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
              @\${k.verteidiger}
            </div>

            <div class="detail">
              \${detail2}
            </div>

          </div>

        </div>

        <div class="winner">
          🏆 @\${k.gewinner}
        </div>

      </div>
    \`;

  } catch (error) {

    console.error(
      "❌ Overlay:",
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
`);

          return;
        }

        res.writeHead(
          404,
          {
            "Content-Type":
              "text/plain; charset=utf-8",
          }
        );

        res.end("404");

      } catch (error) {

        console.error(
          "❌ HTTP Fehler:",
          error.message
        );

        res.writeHead(500);

        res.end("500");
      }
    }
  );
      } catch (error) {
        console.error(
          "❌ Server Fehler:",
          error.message
        );

        res.writeHead(500, {
          "Content-Type":
            "text/plain; charset=utf-8",
        });

        res.end(
          "Interner Serverfehler"
        );
      }
    }
  );

const PORT =
  process.env.PORT || 10000;

server.listen(
  PORT,
  () => {
    console.log(
      `🦊 Fuchs-XP-Bot gestartet auf Port ${PORT}`
    );

    console.log(
      "PvP-Overlay: /pvp"
    );

    console.log(
      "StreamElements Kanal:",
      streamElementsChannel || "wird geladen"
    );

    streamElementsVerbinden();
  }
);

let wsReconnectTimer = null;

async function streamElementsVerbinden() {
  if (!STREAMELEMENTS_JWT) {
    console.log(
      "⚠️ StreamElements JWT fehlt."
    );

    return;
  }

  try {
    const ws =
      new WebSocket(
        "wss://astro.streamelements.com/"
      );

    ws.on(
      "open",
      async () => {
        console.log(
          "✅ StreamElements WebSocket verbunden."
        );

        try {
          const channelId =
            await streamElementsChannelHolen();

          if (!channelId) {
            console.log(
              "⚠️ StreamElements Channel-ID konnte nicht geladen werden."
            );

            return;
          }

          ws.send(
            JSON.stringify({
              type: "subscribe",
              nonce:
                `fuchs-${Date.now()}`,
              data: {
                topic:
                  "channel.chat.message",
                token:
                  STREAMELEMENTS_JWT,
                condition: {
                  channelId:
                    channelId,
                },
              },
            })
          );

          console.log(
            "📡 StreamElements Chat abonniert."
          );
        } catch (error) {
          console.error(
            "❌ StreamElements Subscribe:",
            error.message
          );
        }
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
          "⚠️ StreamElements WebSocket getrennt."
        );

        if (
          !wsReconnectTimer
        ) {
          wsReconnectTimer =
            setTimeout(
              () => {
                wsReconnectTimer =
                  null;

                streamElementsVerbinden();
              },
              5000
            );
        }
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
  } catch (error) {
    console.error(
      "❌ StreamElements Verbindung:",
      error.message
    );

    if (
      !wsReconnectTimer
    ) {
      wsReconnectTimer =
        setTimeout(
          () => {
            wsReconnectTimer =
              null;

            streamElementsVerbinden();
          },
          5000
        );
    }
  }
}

setInterval(
  () => {
    const jetzt =
      Date.now();

    for (
      const [
        ziel,
        kampf,
      ] of offeneKaempfe.entries()
    ) {
      if (
        jetzt -
          kampf.erstellt >
        60000
      ) {
        offeneKaempfe.delete(
          ziel
        );

        streamelementsSenden(
          `⌛ @${ziel} die Kampf-Anfrage ist abgelaufen.`
        ).catch(
          error =>
            console.error(
              "❌ Ablaufmeldung:",
              error.message
            )
        );
      }
    }
  },
  5000
);
