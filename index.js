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
  const response = await fetch(
    `${SUPABASE_URL}${path}`,
    {
      ...options,
      headers: headers(options.headers || {}),
    }
  );

  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `Supabase ${response.status}: ${text}`
    );
  }

  return text ? JSON.parse(text) : null;
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


// =====================================================
// STREAMELEMENTS
// =====================================================

async function streamelementsSenden(text) {
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
      "/rest/v1/fuchs_aktivitaet?on_conflict=spieler",
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
          `@${username} ✅ Quest erfolgreich erledigt! +10 FuchsXP 🦊`
        );
      }
    }

    const alleFertig =
      [1, 2, 3, 4, 5].every(n => {
        const q =
          nachher.find(
            x =>
              Number(x.quest_nummer) === n
          );

        return (
          q &&
          Number(q.fortschritt || 0) >=
            normaleZiele[n]
        );
      });

    const vorherAlleFertig =
      [1, 2, 3, 4, 5].every(n => {
        const q =
          vorher.find(
            x =>
              Number(x.quest_nummer) === n
          );

        return (
          q &&
          Number(q.fortschritt || 0) >=
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
    await persoenlicheQuestsAnlegen(username);

    const quests =
      await persoenlicheQuestsHolen(username);

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

    const nummer =
      Number(aktive.quest_nummer);

    const quest =
      persoenlicheQuests[nummer];

    if (!quest) return;

    await streamelementsSenden(
      `@${username} ${quest.text} → ${Number(
        aktive.fortschritt || 0
      )}/${quest.ziel}`
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
    await persoenlicheQuestsAnlegen(username);

    const vorher =
      await persoenlicheQuestsHolen(username);

    const aktive =
      vorher.find(
        q => !q.abgeschlossen
      );

    if (!aktive) return;

    const nummer =
      Number(aktive.quest_nummer);

    const quest =
      persoenlicheQuests[nummer];

    if (!quest) return;

    const alt =
      Number(aktive.fortschritt || 0);

    await rpc(
      "persoenliche_quest_pruefen",
      {
        spieler_name: username,
        nachricht: text,
      }
    );

    const nachher =
      await persoenlicheQuestsHolen(username);

    const aktuell =
      nachher.find(
        q =>
          Number(q.quest_nummer) ===
          nummer
      );

    if (!aktuell) return;

    const neu =
      Number(aktuell.fortschritt || 0);

    if (
      neu >= quest.ziel &&
      alt < quest.ziel
    ) {
      await streamelementsSenden(
        `@${username} ✅ Deine persönliche Aufgabe ist erfolgreich abgeschlossen! +10 FuchsXP 🦊`
      );

      // Keine nächste Aufgabe automatisch anzeigen.
      // Der Spieler muss erneut !quest schreiben.
    }

  } catch (error) {
    console.error(
      "❌ Persönliche Quest prüfen:",
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

    const p = rows?.[0];

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
    feuer: "🔥 Feuerrudel",
    wasser: "🌊 Wasserrudel",
    wald: "🌲 Waldrudel",
    ice: "🧊 ICErudel",
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


// Aktueller Kampf für das OBS-Overlay.
let aktuellerPvpKampf =
  null;


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
if (gegner.toLowerCase() === "fuchsmissvegetalover2_0") {
  const antwort = await pvpAnnehmen(gegner);

  if (antwort) {
    await streamelementsSenden(antwort);
  }
return;
}
  

  // Overlay zeigt, dass auf die Annahme gewartet wird.
  aktuellerPvpKampf = {
    status: "waiting",
    herausforderer:
      username,
    gegner:
      gegner,
    gestartet:
      Date.now(),
  };

  return (
    `⚔️ @${username} fordert @${gegner} zum PvP heraus! @${gegner} hat 60 Sekunden Zeit mit !annehmen zu antworten!`
  );
}


async function pvpAnnehmen(username) {
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


  // ===================================================
  // OVERLAY-KAMPF STARTEN
  // ===================================================

  aktuellerPvpKampf = {
    status: "fight",

    id:
      `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`,

    herausforderer:
      kampf.herausforderer,

    gegner:
      username,

    gewinner:
      gewinner,

    verlierer:
      verlierer,

    gestartet:
      Date.now(),
  };


  // ===================================================
  // +100 XP
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
  // PVP STATISTIK
  // ===================================================

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


  return (
    `⚔️ PVP-KAMPF! @${kampf.herausforderer} 🆚 @${username} | 🏆 Gewinner: @${gewinner}! +100 FuchsXP 🦊 | 💀 @${verlierer} verliert den Kampf.`
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
// CHAT VERARBEITEN
// =====================================================

async function chatVerarbeiten(message) {

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

  // StreamElements eigene Nachrichten ignorieren.
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
    await streamelementsSenden(
      await pvpStart(
        username,
        pvpMatch[1]
      )
    );

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


  // ===================================================
  // !PROFIL
  // ===================================================

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


  // ===================================================
  // !RUDELWAHL
  // ===================================================

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
  // NORMALE QUESTS
  // ===================================================

  await questsPruefen(
    username,
    text
  );


  // ===================================================
  // PERSÖNLICHE QUEST
  // ===================================================

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
// PVP OVERLAY FÜR OBS
// =====================================================

const OVERLAY_HTML = `<!DOCTYPE html>

<html lang="de">

<head>

<meta charset="utf-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1"
>

<title>Fuchs PvP Overlay</title>


<style>

* {
  box-sizing: border-box;
}


html,
body {

  margin: 0;

  width: 100%;
  height: 100%;

  overflow: hidden;

  background: transparent;

  font-family:
    Arial,
    Helvetica,
    sans-serif;
}


#arena {

  position: relative;

  width: 100%;
  height: 100%;

  display: flex;

  align-items: center;
  justify-content: center;

  opacity: 0;

  transform:
    scale(.96);

  transition:
    opacity .45s ease,
    transform .45s ease;
}


#arena.visible {

  opacity: 1;

  transform:
    scale(1);
}


.panel {

  width:
    min(1100px, 92vw);

  padding:
    32px 38px 30px;

  border-radius:
    28px;

  background:
    rgba(10, 10, 18, .86);

  border:
    2px solid
    rgba(255,255,255,.18);

  box-shadow:
    0 18px 70px
    rgba(0,0,0,.55);

  color:
    white;

  text-align:
    center;
}


.title {

  font-size:
    clamp(28px, 4vw, 54px);

  font-weight:
    900;

  letter-spacing:
    .04em;

  margin-bottom:
    24px;

  text-shadow:
    0 4px 18px
    rgba(0,0,0,.65);
}


.fighters {

  display:
    grid;

  grid-template-columns:
    1fr auto 1fr;

  gap:
    24px;

  align-items:
    center;
}


.fighter {

  min-width:
    0;
}


.name {

  font-size:
    clamp(24px, 3vw, 42px);

  font-weight:
    800;

  margin-bottom:
    12px;

  white-space:
    nowrap;

  overflow:
    hidden;

  text-overflow:
    ellipsis;
}


.emoji {

  font-size:
    clamp(60px, 9vw, 120px);

  line-height:
    1;

  margin:
    4px 0 14px;

  filter:
    drop-shadow(
      0 8px 15px
      rgba(0,0,0,.55)
    );
}


.bar {

  height:
    24px;

  width:
    100%;

  border-radius:
    999px;

  background:
    rgba(255,255,255,.14);

  overflow:
    hidden;

  border:
    1px solid
    rgba(255,255,255,.25);
}


.hp {

  width:
    100%;

  height:
    100%;

  background:
    linear-gradient(
      90deg,
      #3ddc84,
      #a7f36b
    );

  transform-origin:
    left center;

  transition:
    width .22s linear;
}


.vs {

  font-size:
    clamp(26px, 4vw, 58px);

  font-weight:
    1000;

  white-space:
    nowrap;

  text-shadow:
    0 5px 20px
    rgba(0,0,0,.7);
}


#message {

  min-height:
    62px;

  margin-top:
    26px;

  font-size:
    clamp(24px, 3vw, 40px);

  font-weight:
    900;
}


#result {

  display:
    none;

  margin-top:
    18px;

  font-size:
    clamp(30px, 4vw, 56px);

  font-weight:
    1000;
}


#xp {

  display:
    none;

  margin-top:
    8px;

  font-size:
    clamp(20px, 2.5vw, 32px);

  font-weight:
    800;
}


.attack {

  animation:
    attack .32s ease;
}


.hit {

  animation:
    hit .32s ease;
}


.winner {

  animation:
    winner 1s ease-in-out
    infinite alternate;
}


@keyframes attack {

  0% {
    transform:
      translateX(0)
      scale(1);
  }

  45% {
    transform:
      translateX(18px)
      scale(1.06);
  }

  100% {
    transform:
      translateX(0)
      scale(1);
  }
}


@keyframes hit {

  0%,
  100% {
    transform:
      translateX(0);
  }

  20% {
    transform:
      translateX(-14px);
  }

  40% {
    transform:
      translateX(14px);
  }

  60% {
    transform:
      translateX(-9px);
  }

  80% {
    transform:
      translateX(7px);
  }
}


@keyframes winner {

  from {
    transform:
      scale(1);
  }

  to {
    transform:
      scale(1.08);
  }
}


@media (max-width: 700px) {

  .panel {
    padding:
      22px 18px;
  }

  .fighters {
    gap:
      10px;
  }

}

</style>

</head>


<body>


<div id="arena">

  <div class="panel">


    <div
      id="title"
      class="title"
    >
      ⚔️ POKÉMON-KAMPF ⚔️
    </div>


    <div class="fighters">


      <div
        id="left"
        class="fighter"
      >

        <div
          id="leftName"
          class="name"
        >
          —
        </div>

        <div
          id="leftEmoji"
          class="emoji"
        >
          🦊
        </div>

        <div class="bar">

          <div
            id="leftHp"
            class="hp"
          ></div>

        </div>

      </div>


      <div class="vs">

        ⚔️ VS ⚔️

      </div>


      <div
        id="right"
        class="fighter"
      >

        <div
          id="rightName"
          class="name"
        >
          —
        </div>

        <div
          id="rightEmoji"
          class="emoji"
        >
          🐺
        </div>

        <div class="bar">

          <div
            id="rightHp"
            class="hp"
          ></div>

        </div>

      </div>


    </div>


    <div id="message">

      Warte auf einen Kampf …

    </div>


    <div id="result"></div>


    <div id="xp"></div>


  </div>

</div>


<script>

let lastFightId =
  null;

let running =
  false;


const arena =
  document.getElementById(
    "arena"
  );


const title =
  document.getElementById(
    "title"
  );


const message =
  document.getElementById(
    "message"
  );


const result =
  document.getElementById(
    "result"
  );


const xp =
  document.getElementById(
    "xp"
  );


const left =
  document.getElementById(
    "left"
  );


const right =
  document.getElementById(
    "right"
  );


const leftName =
  document.getElementById(
    "leftName"
  );


const rightName =
  document.getElementById(
    "rightName"
  );


const leftHp =
  document.getElementById(
    "leftHp"
  );


const rightHp =
  document.getElementById(
    "rightHp"
  );


function show() {

  arena.classList.add(
    "visible"
  );

}


function hide() {

  arena.classList.remove(
    "visible"
  );

}


function resetHp() {

  leftHp.style.width =
    "100%";

  rightHp.style.width =
    "100%";

}


function flash(
  el,
  cls
) {

  el.classList.remove(
    cls
  );

  void el.offsetWidth;

  el.classList.add(
    cls
  );

  setTimeout(
    () => {
      el.classList.remove(
        cls
      );
    },
    500
  );

}


function sleep(ms) {

  return new Promise(
    resolve => {
      setTimeout(
        resolve,
        ms
      );
    }
  );

}


async function runFight(f) {

  if (running)
    return;

  running =
    true;


  const leftIsWinner =
    f.gewinner ===
    f.herausforderer;


  leftName.textContent =
    "🦊 " +
    f.herausforderer;


  rightName.textContent =
    "🐺 " +
    f.gegner;


  leftHp.style.width =
    "100%";

  rightHp.style.width =
    "100%";


  result.style.display =
    "none";

  xp.style.display =
    "none";


  title.textContent =
    "⚔️ KAMPF START! ⚔️";


  message.textContent =
    "🥊 Beide Kämpfer stehen bereit!";


  show();


  await sleep(
    1200
  );


  title.textContent =
    "🔥 LOS GEHT'S! 🔥";


  message.textContent =
    leftIsWinner
      ? "🦊 " +
        f.herausforderer +
        " greift an!"
      : "🐺 " +
        f.gegner +
        " greift an!";


  flash(
    leftIsWinner
      ? left
      : right,
    "attack"
  );


  await sleep(
    850
  );


  message.textContent =
    leftIsWinner
      ? "💥 Treffer! " +
        f.gegner +
        " verliert Lebenspunkte!"
      : "💥 Treffer! " +
        f.herausforderer +
        " verliert Lebenspunkte!";


  flash(
    leftIsWinner
      ? right
      : left,
    "hit"
  );


  if (leftIsWinner) {

    rightHp.style.width =
      "55%";

  } else {

    leftHp.style.width =
      "55%";

  }


  await sleep(
    900
  );


  title.textContent =
    "⚡ FINALER ANGRIFF! ⚡";


  message.textContent =
    leftIsWinner
      ? "🦊 " +
        f.herausforderer +
        " setzt zum letzten Angriff an!"
      : "🐺 " +
        f.gegner +
        " setzt zum letzten Angriff an!";


  flash(
    leftIsWinner
      ? left
      : right,
    "attack"
  );


  await sleep(
    800
  );


  message.textContent =
    "💥 Volltreffer!";


  flash(
    leftIsWinner
      ? right
      : left,
    "hit"
  );


  if (leftIsWinner) {

    rightHp.style.width =
      "0%";

  } else {

    leftHp.style.width =
      "0%";

  }


  await sleep(
    900
  );


  title.textContent =
    "🏆 SIEGER! 🏆";


  message.textContent =
    "🎉 Der Kampf ist entschieden!";


  result.textContent =
    "👑 " +
    f.gewinner +
    " gewinnt!";


  result.style.display =
    "block";


  xp.textContent =
    "⭐ +100 FuchsXP";


  xp.style.display =
    "block";


  const winnerElement =
    leftIsWinner
      ? left
      : right;


  winnerElement.classList.add(
    "winner"
  );


  await sleep(
    5000
  );


  winnerElement.classList.remove(
    "winner"
  );


  hide();


  await sleep(
    600
  );


  resetHp();


  running =
    false;

}


async function poll() {

  try {

    const response =
      await fetch(
        "/pvp-data",
        {
          cache:
            "no-store",
        }
      );


    if (!response.ok) {

      throw new Error(
        "HTTP " +
        response.status
      );

    }


    const f =
      await response.json();


    if (
      f &&
      f.status ===
        "fight" &&
      f.id &&
      f.id !==
        lastFightId
    ) {

      lastFightId =
        f.id;

      runFight(f);

    }

  } catch (error) {

    console.log(
      "Overlay-Verbindung:",
      error.message
    );

  }

}


setInterval(
  poll,
  500
);


poll();

</script>


</body>

</html>`;


// =====================================================
// RENDER HTTP SERVER
// =====================================================

const server =
  http.createServer(
    (req, res) => {


      // =================================================
      // OBS BROWSER SOURCE
      // =================================================

      if (
        req.url ===
        "/pvp"
      ) {

        res.writeHead(
          200,
          {
            "Content-Type":
              "text/html; charset=utf-8",

            "Cache-Control":
              "no-store",
          }
        );

        res.end(
          OVERLAY_HTML
        );

        return;
      }


      // =================================================
      // PVP DATEN FÜR DAS OVERLAY
      // =================================================

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

            "Access-Control-Allow-Origin":
              "*",
          }
        );

        res.end(
          JSON.stringify(
            aktuellerPvpKampf ||
            {
              status:
                "idle",
            }
          )
        );

        return;
      }


      // =================================================
      // NORMALER RENDER TEST
      // =================================================

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


// =====================================================
// RENDER PORT
// =====================================================

server.listen(
  process.env.PORT ||
    10000,

  "0.0.0.0",

  () => {

    console.log(
      `🌐 Web-Port geöffnet auf ${
        process.env.PORT ||
        10000
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
