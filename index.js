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
      "â ï¸ StreamElements JWT fehlt."
    );
    return false;
  }

  if (!streamElementsRoomId) {
    console.log(
      "â ï¸ StreamElements Room-ID fehlt."
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
        `â StreamElements ${response.status}: ${body}`
      );
      return false;
    }

    console.log(
      `ð¤ StreamElements: ${text}`
    );

    return true;

  } catch (error) {
    console.error(
      "â StreamElements senden:",
      error.message
    );

    return false;
  }
}


// =====================================================
// AKTIVITÃT
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
      `ð¾ AktivitÃ¤t gespeichert: ${username}`
    );

  } catch (error) {
    console.error(
      "â AktivitÃ¤t speichern:",
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
      "â Normale Quests anlegen:",
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
      "â Quest-Fortschritt holen:",
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


    // PrÃ¼fen, ob eine normale Quest
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
          `@${username} Quest erfolgreich erledigt! +10 FuchsXP ð¦`
        );
      }
    }


    // PrÃ¼fen, ob alle 5 normalen
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
        `@${username} Du hast heute alle Aufgaben erledigt! Komm morgen wieder â dann warten neue Aufgaben auf dich! ð¦ð`
      );
    }

  } catch (error) {

    console.error(
      "â Normale Quests:",
      error.message
    );
  }
}


// =====================================================
// PERSÃNLICHE QUESTS
// =====================================================

// Reihenfolge:
// 6 = Gaming
// 7 = Twitch
// 8 = Rudel
// 9 = Hallo
// 10 = Mega
//
// WICHTIG:
// Immer nur die ERSTE offene persÃ¶nliche Quest zÃ¤hlt.
// Nach Abschluss wird NICHT automatisch die nÃ¤chste Quest angezeigt.
// Der Spieler schreibt danach wieder !quest.

const persoenlicheQuests = {
  6: {
    wort: "gaming",
    ziel: 2,
    text:
      "ð® Deine persÃ¶nliche Aufgabe ist: Schreibe âGamingâ 2-mal innerhalb von 60 Sekunden."
  },

  7: {
    wort: "twitch",
    ziel: 2,
    text:
      "ð Deine persÃ¶nliche Aufgabe ist: Schreibe âTwitchâ 2-mal innerhalb von 60 Sekunden."
  },

  8: {
    wort: "rudel",
    ziel: 2,
    text:
      "ðº Deine persÃ¶nliche Aufgabe ist: Schreibe âRudelâ 2-mal innerhalb von 60 Sekunden."
  },

  9: {
    wort: "hallo",
    ziel: 3,
    text:
      "ð Deine persÃ¶nliche Aufgabe ist: Schreibe âHalloâ 3-mal innerhalb von 60 Sekunden."
  },

  10: {
    wort: "mega",
    ziel: 2,
    text:
      "â­ Deine persÃ¶nliche Aufgabe ist: Schreibe âMegaâ 2-mal innerhalb von 60 Sekunden."
  }
};


async function persoenlicheQuestsAnlegen(username) {
  try {
    await rpc(
      "persoenliche_quest_pruefen",
      {
        spieler_name: username,
        nachricht: ""
      }
    );
  } catch (error) {
    console.error(
      "â PersÃ¶nliche Quests anlegen:",
      error.message
    );
  }
}


async function persoenlicheQuestsHolen(username) {
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
      "â PersÃ¶nliche Quests holen:",
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
    await persoenlicheQuestsAnlegen(username);

    const quests =
      await persoenlicheQuestsHolen(username);

    if (!quests.length) {
      await streamelementsSenden(
        `@${username} ð¯ Deine persÃ¶nlichen Aufgaben konnten noch nicht angelegt werden.`
      );
      return;
    }

    // Nur die erste offene Quest anzeigen.
    const aktive =
      quests.find(
        q => !q.abgeschlossen
      );

    if (!aktive) {
      await streamelementsSenden(
        `@${username} ð Du hast heute alle persÃ¶nlichen Aufgaben geschafft! Komm morgen wieder fÃ¼r neue Aufgaben! ð¦ð`
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

    if (!quest) {
      return;
    }

    const fortschritt =
      Number(
        aktive.fortschritt || 0
      );

    await streamelementsSenden(
      `@${username} ð¯ ${quest.text} â ${fortschritt}/${quest.ziel}`
    );

  } catch (error) {
    console.error(
      "â PersÃ¶nliche Quest anzeigen:",
      error.message
    );
  }
}


// =====================================================
// PERSÃNLICHE QUEST PRÃFEN
// =====================================================

async function persoenlicheQuestPruefen(username, text) {
  try {
    await persoenlicheQuestsAnlegen(username);

    let quests =
      await persoenlicheQuestsHolen(username);

    if (!quests.length) {
      return;
    }

    // Nur die erste offene Quest zÃ¤hlt.
    const aktive =
      quests.find(
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
      persoenlicheQuests[
        nummer
      ];

    if (!quest) {
      return;
    }

    const vorher =
      Number(
        aktive.fortschritt || 0
      );

    // Nachricht an die Datenbank senden.
    await rpc(
      "persoenliche_quest_pruefen",
      {
        spieler_name: username,
        nachricht: text
      }
    );

    quests =
      await persoenlicheQuestsHolen(username);

    const danach =
      quests.find(
        q =>
          Number(q.quest_nummer) === nummer
      );

    if (!danach) {
      return;
    }

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
        `@${username} â Deine persÃ¶nliche Aufgabe ist erfolgreich abgeschlossen! +10 FuchsXP ð¦`
      );

      // WICHTIG:
      // Hier wird KEINE nÃ¤chste Quest automatisch angezeigt.
      // Der Spieler muss dafÃ¼r wieder !quest schreiben.
    }

  } catch (error) {
    console.error(
      "â PersÃ¶nliche Quest:",
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
        `ð¦ ${username} hat noch kein Fuchsprofil.`
      );
    }


    const xp =
      Number(p.xp || 0);


    let level =
      "ð¾ Fuchsbaby";


    if (xp >= 100)
      level = "ð¦ Jungfuchs";

    if (xp >= 250)
      level = "ð WaldlÃ¤ufer";

    if (xp >= 500)
      level = "ð² Rudelfuchs";

    if (xp >= 1000)
      level = "ð¥ FuchsjÃ¤ger";

    if (xp >= 2000)
      level = "ð Alphafuchs";

    if (xp >= 5000)
      level = "â¨ Fuchslegende";

    if (xp >= 10000)
      level = "ð¦ð Fuchsmeister";


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
      `ð¦ ${username}` +
      ` | â­ ${xp} FuchsXP` +
      ` | ð Level ${level}` +
      ` | ðº Rudel: ${p.rudel || "noch nicht gewÃ¤hlt"}` +
      ` | âï¸ Siege: ${p.pvp_siege || 0}` +
      ` | ð Niederlagen: ${p.pvp_niederlagen || 0}` +
      ` | ð Noch ${bis} XP bis zum nÃ¤chsten Level`
    );

  } catch (error) {

    console.error(
      "â Profil:",
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
      "ð¥ Feuerrudel",

    wasser:
      "ð Wasserrudel",

    wald:
      "ð² Waldrudel",

    ice:
      "ð§ ICErudel",

  };


  const gewaehlt =
    map[
      (rudel || "")
        .toLowerCase()
    ];


  if (!gewaehlt) {

    return (
      `@${username} Bitte wÃ¤hle: ` +
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
      `@${username} ðº Du bist jetzt im ${gewaehlt}!`
    );

  } catch (error) {

    console.error(
      "â Rudelwahl:",
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
    `âï¸ @${username} fordert @${gegner} zum PvP heraus! ` +
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
      "â PvP-Sieg:",
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
      "â PvP-Niederlage:",
      error.message
    );
  }


  return (
    `âï¸ PVP-KAMPF! ` +
    `@${kampf.herausforderer} ð @${username} | ` +
    `ð Gewinner: @${gewinner}! +100 FuchsXP ð¦ | ` +
    `ð @${verlierer} verliert den Kampf.`
  );
}


// =====================================================
// CHAT
// =====================================================

async function chatVerarbeiten(
  message
) {

  console.log(
    "ð¡ StreamElements Nachricht:",
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
      `ð  StreamElements Room-ID: ${streamElementsRoomId}`
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
    `ð¬ AktivitÃ¤t erkannt: ${username}`
  );


  console.log(
    `ð Nachricht: ${text}`
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
  // PERSÃNLICHE QUEST
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
        "ð StreamElements WebSocket verbunden."
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


        // StreamElements BegrÃ¼Ãung

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
            "ð¡ StreamElements Chat-Topic abonniert."
          );


          return;
        }


        await chatVerarbeiten(
          message
        );

      } catch (error) {

        console.error(
          "â WebSocket Nachricht:",
          error.message
        );
      }
    }
  );


  ws.on(
    "error",
    error => {

      console.error(
        "â StreamElements WebSocket:",
        error.message
      );
    }
  );


  ws.on(
    "close",
    () => {

      console.log(
        "â ï¸ StreamElements-Verbindung beendet."
      );


      console.log(
        "ð Neuer Verbindungsversuch in 5 Sekunden..."
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
        "ð¦ Fuchs-XP-Bot lÃ¤uft!"
      );
    }
  );


server.listen(
  process.env.PORT || 10000,
  "0.0.0.0",
  () => {

    console.log(
      `ð Web-Port geÃ¶ffnet auf ${
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
  "ð¦ Fuchs-XP-Bot gestartet!"
);
    

