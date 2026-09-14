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
    throw new Error(
      `Supabase ${response.status}: ${text}`
    );
  }

  return text ? JSON.parse(text) : null;
}


async function rpc(functionName, body = {}) {
  return supabase(
    `/rest/v1/rpc/${functionName}`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}


// =====================================================
// STREAM ELEMENTS
// =====================================================

async function streamelementsSenden(text) {
  if (!STREAMELEMENTS_JWT) {
    console.log(
      "⚠️ StreamElements JWT fehlt."
    );
    return false;
  }

  if (!streamElementsRoomId) {
    console.log(
      "⚠️ StreamElements Room-ID fehlt."
    );
    return false;
  }

  try {
    const response = await fetch(
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

async function aktivitaetSpeichern(username) {
  try {
    await supabase(
      `/rest/v1/fuchs_aktivitaet?on_conflict=spieler`,
      {
        method: "POST",
        headers: {
          Prefer:
            "resolution=merge-duplicates",
        },
        body: JSON.stringify({
          spieler: username,
          letzte_aktivitaet:
            new Date().toISOString(),
        }),
      }
    );

    console.log(
      `💾 Aktivität gespeichert: ${username}`
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
  try {
    const datum =
      new Date()
        .toISOString()
        .slice(0, 10);

    return await supabase(
      `/rest/v1/quest_fortschritt` +
      `?spieler=eq.${encodeURIComponent(username)}` +
      `&datum=eq.${datum}` +
      `&order=quest_nummer.asc`
    );

  } catch (error) {
    console.error(
      "❌ Quest-Fortschritt holen:",
      error.message
    );

    return [];
  }
}


async function questsPruefen(username, text) {
  try {

    await questsAnlegen(username);

    const vorher =
      await questFortschrittHolen(
        username
      );

    await rpc(
      "quest_nachricht_verarbeiten",
      {
        spieler_name: username,
        nachricht: text,
      }
    );

    const nachher =
      await questFortschrittHolen(
        username
      );

    const vorherMap =
      new Map(
        vorher.map(
          q => [
            q.quest_nummer,
            Number(q.fortschritt || 0)
          ]
        )
      );

    const ziele = {
      1: 10,
      2: 5,
      3: 1,
      4: 3,
      5: 2,
    };


    // Prüfen, ob eine normale Quest
    // gerade abgeschlossen wurde

    for (const quest of nachher) {

      const nummer =
        Number(quest.quest_nummer);

      const alt =
        vorherMap.get(nummer) || 0;

      const neu =
        Number(quest.fortschritt || 0);

      const ziel =
        ziele[nummer];

      if (
        ziel &&
        neu >= ziel &&
        alt < ziel
      ) {

        await streamelementsSenden(
          `@${username} Quest erfolgreich erledigt! +10 FuchsXP 🦊`
        );
      }
    }


    // Prüfen, ob alle 5 normalen
    // Quests fertig sind

    const alleFertig =
      nachher.length >= 5 &&
      nachher.every(q => {
        const ziel =
          ziele[
            Number(q.quest_nummer)
          ];

        return (
          ziel &&
          Number(q.fortschritt || 0)
            >= ziel
        );
      });


    const vorherAlleFertig =
      vorher.length >= 5 &&
      vorher.every(q => {
        const ziel =
          ziele[
            Number(q.quest_nummer)
          ];

        return (
          ziel &&
          Number(q.fortschritt || 0)
            >= ziel
        );
      });


    if (
      alleFertig &&
      !vorherAlleFertig
    ) {

      await streamelementsSenden(
        `@${username} Du hast heute alle Aufgaben erledigt! Komm morgen wieder – dann warten neue Aufgaben auf dich! 🦊🏆`
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

// Reihenfolge:
//
// 6 = Gaming
// 7 = Twitch
// 8 = Rudel
// 9 = Hallo
// 10 = Mega
//
// Immer nur die ERSTE offene Quest
// ist für den Spieler aktiv.

const persoenlicheQuests = {

  6: {
    wort: "gaming",
    ziel: 2,
    text:
      "🎮 Deine persönliche Aufgabe: Schreibe „Gaming“ 2-mal innerhalb von 60 Sekunden!"
  },

  7: {
    wort: "twitch",
    ziel: 2,
    text:
      "💜 Deine persönliche Aufgabe: Schreibe „Twitch“ 2-mal innerhalb von 60 Sekunden!"
  },

  8: {
    wort: "rudel",
    ziel: 2,
    text:
      "🐺 Deine persönliche Aufgabe: Schreibe „Rudel“ 2-mal innerhalb von 60 Sekunden!"
  },

  9: {
    wort: "hallo",
    ziel: 3,
    text:
      "👋 Deine persönliche Aufgabe: Schreibe „Hallo“ 3-mal innerhalb von 60 Sekunden!"
  },

  10: {
    wort: "mega",
    ziel: 2,
    text:
      "⭐ Deine persönliche Aufgabe: Schreibe „Mega“ 2-mal innerhalb von 60 Sekunden!"
  },

};


async function persoenlicheQuestsAnlegen(
  username
) {

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


async function persoenlicheQuestsHolen(
  username
) {

  try {

    const datum =
      new Date()
        .toISOString()
        .slice(0, 10);

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

    if (!quests.length) {

      await streamelementsSenden(
        `@${username} 🎯 Deine persönlichen Aufgaben konnten noch nicht angelegt werden.`
      );

      return;
    }


    // Nur die erste offene Aufgabe anzeigen

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


    const questNummer =
      Number(
        aktive.quest_nummer
      );

    const quest =
      persoenlicheQuests[
        questNummer
      ];


    if (!quest) return;


    const fortschritt =
      Number(
        aktive.fortschritt || 0
      );


    await streamelementsSenden(
      `@${username} 🎯 Deine persönliche Aufgabe ist: ${quest.text} Fortschritt: ${fortschritt}/${quest.ziel}`
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


    let quests =
      await persoenlicheQuestsHolen(
        username
      );


    if (!quests.length) return;


    // Nur die erste offene Quest zählt

    const aktive =
      quests.find(
        q => !q.abgeschlossen
      );


    if (!aktive) return;


    const nummer =
      Number(
        aktive.quest_nummer
      );


    const quest =
      persoenlicheQuests[
        nummer
      ];


    if (!quest) return;


    const vorher =
      Number(
        aktive.fortschritt || 0
      );


    // Nachricht an Datenbank senden

    await rpc(
      "persoenliche_quest_pruefen",
      {
        spieler_name: username,
        nachricht: text,
      }
    );


    quests =
      await persoenlicheQuestsHolen(
        username
      );


    const danach =
      quests.find(
        q =>
          Number(q.quest_nummer)
          === nummer
      );


    if (!danach) return;


    const neu =
      Number(
        danach.fortschritt || 0
      );


    // Quest gerade abgeschlossen?

    if (
      neu >= quest.ziel &&
      vorher < quest.ziel
    ) {

      await streamelementsSenden(
        `@${username} ✅ Deine persönliche Aufgabe ist erfolgreich abgeschlossen! +10 FuchsXP 🦊`
      );


      // Nächste persönliche Quest

      const naechste =
        quests.find(
          q =>
            !q.abgeschlossen &&
            Number(q.quest_nummer)
              > nummer
        );


      if (naechste) {

        const naechsteNummer =
          Number(
            naechste.quest_nummer
          );

        const naechsteQuest =
          persoenlicheQuests[
            naechsteNummer
          ];


        if (naechsteQuest) {

          await streamelementsSenden(
            `@${username} 🎯 Deine nächste persönliche Aufgabe ist: ${naechsteQuest.text}`
          );
        }


      } else {

        await streamelementsSenden(
          `@${username} 🎉 Du hast heute alle persönlichen Aufgaben geschafft! Komm morgen wieder für neue Aufgaben! 🦊🏆`
        );
      }
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
      10000
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
      ` | 🏆 Level ${level}` +
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

    return `@${username} Profil konnte nicht geladen werden.`;
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
      `@${username} Bitte wähle: ` +
      `Feuer, Wasser, Wald oder ICE.`
    );
  }


  try {

    await supabase(
      `/rest/v1/fuchsprofile?on_conflict=spieler`,
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
    gegner.toLowerCase()
      === username.toLowerCase()
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

  const key =
    username.toLowerCase();


  const kampf =
    offeneKaempfe.get(key);


  if (!kampf) {
    return null;
  }


  if (
    Date.now() -
    kampf.erstellt
    > 60_000
  ) {

    offeneKaempfe.delete(key);

    return (
      `@${username} Die PvP-Herausforderung ist abgelaufen.`
    );
  }


  offeneKaempfe.delete(key);


  const herausfordererGewinnt =
    Math.random() < 0.5;


  const gewinner =
    herausfordererGewinnt
      ? kampf.herausforderer
      : username;


  const verlierer =
    herausfordererGewinnt
      ? username
      : kampf.herausforderer;


  // +100 XP

  await rpc(
    "fuchs_xp_hinzufuegen",
    {
      spieler_name:
        gewinner,

      xp_menge:
        100,
    }
  );


  // Sieg speichern

  try {

    const rows =
      await supabase(
        `/rest/v1/fuchsprofile` +
        `?spieler=eq.${encodeURIComponent(gewinner)}` +
        `&select=pvp_siege` +
        `&limit=1`
      );


    const alt =
      Number(
        rows?.[0]?.pvp_siege || 0
      );


    await supabase(
      `/rest/v1/fuchsprofile` +
      `?spieler=eq.${encodeURIComponent(gewinner)}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          pvp_siege:
            alt + 1,
        }),
      }
    );

  } catch (error) {

    console.error(
      "❌ PvP-Sieg:",
      error.message
    );
  }


  // Niederlage speichern

  try {

    const rows =
      await supabase(
        `/rest/v1/fuchsprofile` +
        `?spieler=eq.${encodeURIComponent(verlierer)}` +
        `&select=pvp_niederlagen` +
        `&limit=1`
      );


    const alt =
      Number(
        rows?.[0]?.pvp_niederlagen || 0
      );


    await supabase(
      `/rest/v1/fuchsprofile` +
      `?spieler=eq.${encodeURIComponent(verlierer)}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          pvp_niederlagen:
            alt + 1,
        }),
      }
    );

  } catch (error) {

    console.error(
      "❌ PvP-Niederlage:",
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
// CHAT
// =====================================================

async function chatVerarbeiten(
  message
) {

  console.log(
    "📡 StreamElements Nachricht:",
    JSON.stringify(message)
  );


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


  // Room-ID aus Chatnachricht

  if (message.room) {

    streamElementsRoomId =
      message.room;

    console.log(
      `🏠 StreamElements Room-ID: ${streamElementsRoomId}`
    );
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


  const text =
    data?.message?.text ||
    data?.text ||
    "";


  console.log(
    `💬 Aktivität erkannt: ${username}`
  );


  console.log(
    `📝 Nachricht: ${text}`
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

    const antwort =
      await pvpStart(
        username,
        pvpMatch[1]
      );


    await streamelementsSenden(
      antwort
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

    const antwort =
      await profil(
        username
      );


    await streamelementsSenden(
      antwort
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


    const antwort =
      await rudelwahl(
        username,
        teile[1]
      );


    await streamelementsSenden(
      antwort
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


        // StreamElements Begrüßung

        if (
          message.type ===
          "welcome"
        ) {

          const subscribeNachricht = {

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

          };


          ws.send(
            JSON.stringify(
              subscribeNachricht
            )
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
        "🔄 Neuer Verbindungsversuch in 5 Sekunden..."
      );


      setTimeout(
        verbinden,
        5000
      );
    }
  );
}


// =====================================================
// RENDER WEB SERVER
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
    
