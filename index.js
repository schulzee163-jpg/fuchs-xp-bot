import http from "http";
import WebSocket from "ws";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://herznunvdqcmzeffblgo.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STREAMELEMENTS_JWT = process.env.STREAMELEMENTS_JWT;
let streamElementsRoomId = null;

function headers(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function supabase(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: headers(options.headers || {}),
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Supabase ${response.status}: ${text}`);
  }

  return text ? JSON.parse(text) : null;
}

async function rpc(name, body = {}) {
  return supabase(`/rest/v1/rpc/${name}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}


// =====================================================
// STREAM ELEMENTS
// =====================================================

async function streamelementsSenden(text) {
  if (!STREAMELEMENTS_JWT || !streamElementsRoomId) {
    console.log("⚠️ StreamElements JWT oder Room-ID fehlt.");
    return false;
  }

  try {
    const response = await fetch(
      `https://api.streamelements.com/kappa/v2/bot/${encodeURIComponent(streamElementsRoomId)}/say`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STREAMELEMENTS_JWT}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
        }),
      }
    );

    const body = await response.text();

    if (!response.ok) {
      console.error(
        `❌ StreamElements ${response.status}: ${body}`
      );
      return false;
    }

    console.log(`📤 StreamElements: ${text}`);
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

async function aktivitaetSpeichern(username) {
  try {
    await supabase(
      "/rest/v1/fuchs_aktivitaet?on_conflict=spieler",
      {
        method: "POST",
        headers: {
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify({
          spieler: username,
          letzte_aktivitaet: new Date().toISOString(),
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

async function questsAnlegen(username) {
  try {
    await rpc(
      "fuchs_quests_anlegen",
      {
        spieler_name: username,
      }
    );

  } catch (error) {
    console.error(
      "❌ Normale Quests anlegen:",
      error.message
    );
  }
}

async function questFortschrittHolen(username) {
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

async function questsPruefen(username, text) {
  try {
    await questsAnlegen(username);

    const vorher =
      await questFortschrittHolen(username);

    await rpc(
      "quest_nachricht_verarbeiten",
      {
        spieler_name: username,
        nachricht: text,
      }
    );

    const nachher =
      await questFortschrittHolen(username);

    const vorherMap =
      new Map(
        vorher.map(q => [
          Number(q.quest_nummer),
          Number(q.fortschritt || 0),
        ])
      );

    for (const q of nachher) {
      const nummer =
        Number(q.quest_nummer);

      const alt =
        vorherMap.get(nummer) || 0;

      const neu =
        Number(q.fortschritt || 0);

      if (
        normaleZiele[nummer] &&
        neu >= normaleZiele[nummer] &&
        alt < normaleZiele[nummer]
      ) {
        await streamelementsSenden(
          `@${username} Quest erfolgreich erledigt! +10 FuchsXP 🦊`
        );
      }
    }

    const alleFertig =
      [1, 2, 3, 4, 5].every(n => {
        const q =
          nachher.find(
            x => Number(x.quest_nummer) === n
          );

        return (
          q &&
          Number(q.fortschritt || 0)
            >= normaleZiele[n]
        );
      });

    const vorherAlleFertig =
      [1, 2, 3, 4, 5].every(n => {
        const q =
          vorher.find(
            x => Number(x.quest_nummer) === n
          );

        return (
          q &&
          Number(q.fortschritt || 0)
            >= normaleZiele[n]
        );
      });

    if (
      alleFertig &&
      !vorherAlleFertig
    ) {
      await streamelementsSenden(
        `@${username} Du hast heute alle 5 normalen Aufgaben erledigt! 🦊🏆`
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
    wort: "gaming",
    ziel: 2,
    text:
      "🎮 Deine persönliche Aufgabe ist: Schreibe „Gaming“ 2-mal innerhalb von 60 Sekunden.",
  },

  7: {
    wort: "twitch",
    ziel: 2,
    text:
      "💜 Deine persönliche Aufgabe ist: Schreibe „Twitch“ 2-mal innerhalb von 60 Sekunden.",
  },

  8: {
    wort: "rudel",
    ziel: 2,
    text:
      "🐺 Deine persönliche Aufgabe ist: Schreibe „Rudel“ 2-mal innerhalb von 60 Sekunden.",
  },

  9: {
    wort: "hallo",
    ziel: 3,
    text:
      "👋 Deine persönliche Aufgabe ist: Schreibe „Hallo“ 3-mal innerhalb von 60 Sekunden.",
  },

  10: {
    wort: "mega",
    ziel: 2,
    text:
      "🌟 Deine persönliche Aufgabe ist: Schreibe „Mega“ 2-mal innerhalb von 60 Sekunden.",
  },
};


async function persoenlicheQuestsAnlegen(username) {
  try {
    await rpc(
      "persoenliche_quest_pruefen",
      {
        spieler_name: username,
        nachricht: "",
      }
    );

  } catch (error) {
    console.error(
      "❌ Persönliche Quests anlegen:",
      error.message
    );
  }
}


async function persoenlicheQuestsHolen(username) {
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


// =====================================================
// !QUEST
// =====================================================

async function persoenlicheQuestAnzeigen(username) {
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
        q => !q.abgeschlossen
      );

    if (!aktive) {

      await streamelementsSenden(
        `@${username} 🎉 Du hast heute alle persönlichen Aufgaben geschafft! Komm morgen wieder für neue Aufgaben! 🦊🏆`
      );

      return;
    }

    const quest =
      persoenlicheQuests[
        Number(aktive.quest_nummer)
      ];

    if (!quest) {
      return;
    }

    await streamelementsSenden(
      `@${username} ${quest.text} → ${Number(aktive.fortschritt || 0)}/${quest.ziel}`
    );

  } catch (error) {

    console.error(
      "❌ Persönliche Quest anzeigen:",
      error.message
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

    const aktive =
      vorher.find(
        q => !q.abgeschlossen
      );

    if (!aktive) {
      return;
    }

    const nummer =
      Number(
        aktive.quest_nummer
      );

    const quest =
      persoenlicheQuests[nummer];

    if (!quest) {
      return;
    }

    const alt =
      Number(
        aktive.fortschritt || 0
      );

    await rpc(
      "persoenliche_quest_pruefen",
      {
        spieler_name: username,
        nachricht: text,
      }
    );

    const nachher =
      await persoenlicheQuestsHolen(
        username
      );

    const aktuell =
      nachher.find(
        q =>
          Number(q.quest_nummer) ===
          nummer
      );

    if (!aktuell) {
      return;
    }

    const neu =
      Number(
        aktuell.fortschritt || 0
      );

    if (
      neu >= quest.ziel &&
      alt < quest.ziel
    ) {

      await streamelementsSenden(
        `@${username} ✅ Deine persönliche Aufgabe ist erfolgreich abgeschlossen! +10 FuchsXP 🦊`
      );

      // WICHTIG:
      // Keine nächste Quest automatisch anzeigen.
      // Spieler muss wieder !quest schreiben.
    }

  } catch (error) {

    console.error(
      "❌ Persönliche Quest:",
      error.message
    );
  }
}


// =====================================================
// PROFIL
// =====================================================

async function profil(username) {

  try {

    const rows =
      await supabase(
        `/rest/v1/fuchsprofile` +
        `?spieler=eq.${encodeURIComponent(username)}` +
        `&limit=1`
      );

    const p =
      rows?.[0];

    if (!p) {
      return (
        `🦊 ${username} hat noch kein Fuchsprofil.`
      );
    }

    const xp =
      Number(p.xp || 0);

    let level =
      "🐾 Fuchsbaby";

    if (xp >= 100)
      level = "🦊 Jungfuchs";

    if (xp >= 250)
      level = "🍂 Waldläufer";

    if (xp >= 500)
      level = "🌲 Rudelfuchs";

    if (xp >= 1000)
      level = "🔥 Fuchsjäger";

    if (xp >= 2000)
      level = "👑 Alphafuchs";

    if (xp >= 5000)
      level = "✨ Fuchslegende";

    if (xp >= 10000)
      level = "🦊🏆 Fuchsmeister";

    const grenzen = [
      100,
      250,
      500,
      1000,
      2000,
      5000,
      10000,
    ];

    const naechstes =
      grenzen.find(
        wert => xp < wert
      );

    const bis =
      naechstes
        ? naechstes - xp
        : 0;

    return (
      `🦊 ${username}` +
      ` | ⭐ ${xp} FuchsXP` +
      ` | 🏆 ${level}` +
      ` | 🐺 Rudel: ${p.rudel || "noch nicht gewählt"}` +
      ` | ⚔️ Siege: ${p.pvp_siege || 0}` +
      ` | 💀 Niederlagen: ${p.pvp_niederlagen || 0}` +
      ` | 📈 Noch ${bis} XP bis zum nächsten Level`
    );

  } catch (error) {

    console.error(
      "❌ Profil:",
      error.message
    );

    return (
      `@${username} Profil konnte nicht geladen werden.`
    );
  }
}


// =====================================================
// RUDELWAHL
// =====================================================

async function rudelwahl(
  username,
  rudel
) {

  const map = {

    feuer:
      "🔥 Feuerrudel",

    wasser:
      "🌊 Wasserrudel",

    wald:
      "🌲 Waldrudel",

    ice:
      "🧊 ICErudel",
  };

  const gewaehlt =
    map[
      (rudel || "")
        .toLowerCase()
    ];

  if (!gewaehlt) {

    return (
      `@${username} Bitte wähle: Feuer, Wasser, Wald oder ICE.`
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

        body: JSON.stringify({
          spieler: username,
          rudel: gewaehlt,
        }),
      }
    );

    return (
      `@${username} 🐺 Du bist jetzt im ${gewaehlt}!`
    );

  } catch (error) {

    console.error(
      "❌ Rudelwahl:",
      error.message
    );

    return (
      `@${username} Die Rudelwahl konnte nicht gespeichert werden.`
    );
  }
}


// =====================================================
// PVP
// =====================================================

const offeneKaempfe =
  new Map();


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

  offeneKaempfe.set(
    gegner.toLowerCase(),
    {
      herausforderer:
        username,

      gegner:
        gegner,

      erstellt:
        Date.now(),
    }
  );

  return (
    `⚔️ @${username} fordert @${gegner} zum PvP heraus! ` +
    `@${gegner} hat 60 Sekunden Zeit mit !annehmen zu antworten!`
  );
}


async function pvpAnnehmen(
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

    return (
      `@${username} Die PvP-Herausforderung ist abgelaufen.`
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
        `?spieler=eq.${encodeURIComponent(gewinner)}` +
        `&select=pvp_siege&limit=1`
      );

    await supabase(
      `/rest/v1/fuchsprofile` +
      `?spieler=eq.${encodeURIComponent(gewinner)}`,
      {
        method: "PATCH",

        body: JSON.stringify({
          pvp_siege:
            Number(
              sieg?.[0]?.pvp_siege || 0
            ) + 1,
        }),
      }
    );

    const niederlage =
      await supabase(
        `/rest/v1/fuchsprofile` +
        `?spieler=eq.${encodeURIComponent(verlierer)}` +
        `&select=pvp_niederlagen&limit=1`
      );

    await supabase(
      `/rest/v1/fuchsprofile` +
      `?spieler=eq.${encodeURIComponent(verlierer)}`,
      {
        method: "PATCH",

        body: JSON.stringify({
          pvp_niederlagen:
            Number(
              niederlage?.[0]?.pvp_niederlagen || 0
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

  return (
    `⚔️ PVP-KAMPF! ` +
    `@${kampf.herausforderer} 🆚 @${username} | ` +
    `🏆 Gewinner: @${gewinner}! +100 FuchsXP 🦊 | ` +
    `💀 @${verlierer} verliert den Kampf.`
  );
}


// =====================================================
// ALLE BEFEHLE
// =====================================================

async function alleBefehle(username) {

  await streamelementsSenden(
    `@${username} 🦊 Befehle: !profil | !rudelwahl Feuer/Wasser/Wald/ICE | !quest | !pvp @Name | !annehmen | !allebefehle`
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

  // Bot-Nachrichten nicht erneut verarbeiten.
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


  // =================================================
  // !PVP
  // =================================================

  const pvpMatch =
    text.match(
      /^!pvp\s+@?([a-zA-Z0-9_]+)$/i
    );

  if (pvpMatch) {

    await streamelementsSenden(
      await pvpStart(
        username,
        pvpMatch[1]
      )
    );

    return;
  }


  // =================================================
  // !ANNEHMEN
  // =================================================

  if (
    /^!annehmen$/i.test(
      text.trim()
    )
  ) {

    const antwort =
      await pvpAnnehmen(
        username
      );

    if (antwort) {
      await streamelementsSenden(
        antwort
      );
    }

    return;
  }


  // =================================================
  // !PROFIL
  // =================================================

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


  // =================================================
  // !RUDELWAHL
  // =================================================

  if (
    /^!rudelwahl\s+/i.test(
      text.trim()
    )
  ) {

    const teile =
      text
        .trim()
        .split(/\s+/);

    await streamelementsSenden(
      await rudelwahl(
        username,
        teile[1]
      )
    );

    return;
  }


  // =================================================
  // !QUEST
  // =================================================

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


  // =================================================
  // !ALLEBEFEHLE
  // =================================================

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


  // =================================================
  // NORMALE QUESTS
  // =================================================

  await questsPruefen(
    username,
    text
  );


  // =================================================
  // PERSÖNLICHE QUEST
  // =================================================

  await persoenlicheQuestPruefen(
    username,
    text
  );
}


// =====================================================
// WEBSOCKET
// =====================================================

let ws;


function verbinden() {

  ws =
    new WebSocket(
      "wss://astro.streamelements.com"
    );


  ws.on(
    "open",
    () => {

      console.log(
        "🔌 StreamElements WebSocket verbunden."
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

        if (
          message.type ===
          "welcome"
        ) {

          ws.send(
            JSON.stringify({
              type:
                "subscribe",

              nonce:
                crypto.randomUUID(),

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
            "📡 StreamElements Chat-Topic abonniert."
          );

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
    "error",
    error => {

      console.error(
        "❌ StreamElements WebSocket:",
        error.message
      );
    }
  );


  ws.on(
    "close",
    () => {

      console.log(
        "⚠️ StreamElements-Verbindung beendet."
      );

      console.log(
        "🔄 Neuer Versuch in 5 Sekunden..."
      );

      setTimeout(
        verbinden,
        5000
      );
    }
  );
}


// =====================================================
// RENDER
// =====================================================

const server =
  http.createServer(
    (req, res) => {

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
    }
  );


server.listen(
  process.env.PORT || 10000,
  "0.0.0.0",
  () => {

    console.log(
      `🌐 Web-Port geöffnet auf ${
        process.env.PORT || 10000
      }.`
    );
  }
);


// =====================================================
// BOT STARTEN
// =====================================================

verbinden();

console.log(
  "🦊 Fuchs-XP-Bot gestartet!"
);
