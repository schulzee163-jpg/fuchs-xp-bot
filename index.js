import http from "http";
import WebSocket from "ws";

const PORT = process.env.PORT || 10000;

const STREAMELEMENTS_JWT = process.env.STREAMELEMENTS_JWT;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!STREAMELEMENTS_JWT) {
  console.error("❌ STREAMELEMENTS_JWT fehlt!");
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Supabase Zugangsdaten fehlen!");
  process.exit(1);
}


// =====================================================
// HTTP-SERVER FÜR RENDER
// =====================================================

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8",
  });

  res.end("🦊 Fuchs-XP-Bot läuft!");
});

server.listen(PORT, () => {
  console.log(`🦊 HTTP-Server läuft auf Port ${PORT}`);
});


// =====================================================
// HILFSFUNKTION: HEUTIGES DATUM
// Deutschland / Berlin
// =====================================================

function heutigesDatum() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Europe/Berlin",
  });
}


// =====================================================
// AKTIVITÄT IN SUPABASE SPEICHERN
// =====================================================

async function aktivitaetSpeichern(username) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/fuchs_aktivitaet?on_conflict=spieler`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify({
          spieler: username,
          letzte_aktivitaet: new Date().toISOString(),
        }),
      }
    );

    if (!response.ok) {
      console.error(
        "❌ Fehler beim Speichern der Aktivität:",
        response.status,
        await response.text()
      );
      return;
    }

    console.log(`💾 Aktivität gespeichert: ${username}`);
  } catch (error) {
    console.error("❌ Supabase-Fehler:", error);
  }
}


// =====================================================
// XP VERGEBEN
// =====================================================

async function xpHinzufuegen(username, menge) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/fuchs_xp_hinzufuegen`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          spieler_name: username,
          xp_menge: menge,
        }),
      }
    );

    if (!response.ok) {
      console.error(
        "❌ XP-Fehler:",
        response.status,
        await response.text()
      );
      return null;
    }

    const neueXP = await response.json();

    console.log(
      `⭐ ${username} bekommt +${menge} FuchsXP. Neue XP: ${neueXP}`
    );

    return neueXP;
  } catch (error) {
    console.error("❌ Fehler bei XP-Vergabe:", error);
    return null;
  }
}


// =====================================================
// QUEST-FORTSCHRITT LADEN
// =====================================================

async function questLaden(username, questNummer, datum) {
  const url =
    `${SUPABASE_URL}/rest/v1/quest_fortschritt` +
    `?spieler=eq.${encodeURIComponent(username)}` +
    `&datum=eq.${datum}` +
    `&quest_nummer=eq.${questNummer}` +
    `&select=id,fortschritt`;

  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });

  if (!response.ok) {
    console.error(
      "❌ Fehler beim Laden der Quest:",
      response.status,
      await response.text()
    );
    return null;
  }

  const data = await response.json();

  if (!data.length) {
    return null;
  }

  return data[0];
}


// =====================================================
// QUEST-FORTSCHRITT SPEICHERN
// =====================================================

  username,
  questNummer,
  fortschritt,
  datum
) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/quest_fortschritt?on_conflict=spieler,datum,quest_nummer`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        spieler: username,
        datum: datum,
        quest_nummer: questNummer,
        fortschritt: fortschritt,
        aktualisiert: new Date().toISOString(),
      }),
    }
  );

  if (!response.ok) {
    console.error(
      "❌ Fehler beim Speichern der Quest:",
      response.status,
      await response.text()
    );

    return false;
  }
  // =====================================================
// =====================================================
// QUEST-FORTSCHRITT SPEICHERN
// =====================================================

async function questSpeichern(
  username,
  questNummer,
  fortschritt,
  datum
) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/quest_fortschritt?on_conflict=spieler,datum,quest_nummer`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify({
          spieler: username,
          datum: datum,
          quest_nummer: questNummer,
          fortschritt: fortschritt,
          aktualisiert: new Date().toISOString(),
        }),
      }
    );

    if (!response.ok) {
      console.error(
        "❌ Fehler beim Speichern der Quest:",
        response.status,
        await response.text()
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "❌ Fehler beim Quest-Speichern:",
      error
    );
    return false;
  }
}
// =====================================================
// QUEST FORTSCHRITT AKTUALISIEREN
// =====================================================

async function questFortschritt(
  username,
  questNummer,
  menge,
  ziel
) {
  const datum = heutigesDatum();

  const aktuelleQuest = await questLaden(
    username,
    questNummer,
    datum
  );

  const alterFortschritt =
    aktuelleQuest?.fortschritt ?? 0;

  if (alterFortschritt >= ziel) {
    return;
  }

  const neuerFortschritt = Math.min(
    alterFortschritt + menge,
    ziel
  );

  const gespeichert = await questSpeichern(
    username,
    questNummer,
    neuerFortschritt,
    datum
  );

  if (!gespeichert) {
    return;
  }

  console.log(
    `📜 ${username} Quest ${questNummer}: ${neuerFortschritt}/${ziel}`
  );

  if (
    alterFortschritt < ziel &&
    neuerFortschritt >= ziel
  ) {
    await xpHinzufuegen(username, 10);

    const questNamen = {
      1: "💬 Nachrichten schreiben",
      2: "😀 Emojis benutzen",
      3: "🥕 Vegeta schreiben",
      4: "🦊 Fuchs schreiben",
      5: "🎯 Ich liebe Füchse"
    };

    const questName =
      questNamen[questNummer] || `Quest ${questNummer}`;

    const chatNachricht =
      `🎉 @${username} hat die Quest "${questName}" erfolgreich abgeschlossen! +10 FuchsXP 🦊`;

    await streamelementsSenden(chatNachricht);

    console.log(
      `🎉 ${username} hat Quest ${questNummer} erfolgreich abgeschlossen! +10 FuchsXP`
    );
  }
}


// =====================================================
// DAILY QUESTS
// =====================================================

async function questsPruefen(username, text) {
  const nachricht = String(text || "").toLowerCase();

  await questFortschritt(
    username,
    1,
    1,
    10
  );

  const emojiTreffer =
    nachricht.match(
      /[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]/gu
    )?.length ?? 0;

  if (emojiTreffer > 0) {
    await questFortschritt(
      username,
      2,
      emojiTreffer,
      5
    );
  }

  if (nachricht.includes("vegeta")) {
    await questFortschritt(
      username,
      3,
      1,
      1
    );
  }

  const fuchsTreffer =
    nachricht.match(/fuchs/g)?.length ?? 0;

  if (fuchsTreffer > 0) {
    await questFortschritt(
      username,
      4,
      fuchsTreffer,
      3
    );
  }

  if (nachricht.includes("ich liebe füchse")) {
    await questFortschritt(
      username,
      5,
      1,
      2
    );
  }
}

// =====================================================
// DAILY QUESTS
// =====================================================

async function questsPruefen(username, text) {
  const nachricht = text.toLowerCase();

  // --------------------------------------------
  // QUEST 1
  // 💬 Nachrichten schreiben
  // Ziel: 10 Nachrichten
  // --------------------------------------------

  await questFortschritt(
    username,
    1,
    1,
    10
  );

  // --------------------------------------------
  // QUEST 2
  // 😀 Emojis benutzen
  // Jedes einzelne Emoji zählt
  // Ziel: 5 Emojis
  // --------------------------------------------

  const emojiTreffer =
    nachricht.match(/[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]/gu)?.length ?? 0;

  if (emojiTreffer > 0) {
    await questFortschritt(
      username,
      2,
      emojiTreffer,
      5
    );
  }

  // --------------------------------------------
  // QUEST 3
  // 🥕 "Vegeta" schreiben
  // Ziel: 1x
  // --------------------------------------------

  if (nachricht.includes("vegeta")) {
    await questFortschritt(
      username,
      3,
      1,
      1
    );
  }

  // --------------------------------------------
  // QUEST 4
  // 🦊 "Fuchs" 3-mal schreiben
  // --------------------------------------------

  const fuchsTreffer =
    nachricht.match(/fuchs/g)?.length ?? 0;

  if (fuchsTreffer > 0) {
    await questFortschritt(
      username,
      4,
      fuchsTreffer,
      3
    );
  }

  // --------------------------------------------
  // QUEST 5
  // 🎯 "Ich liebe Füchse" 2-mal schreiben
  // --------------------------------------------

  if (nachricht.includes("ich liebe füchse")) {
    await questFortschritt(
      username,
      5,
      1,
      2
    );
  }
}

// =====================================================
// PVP-SYSTEM
// =====================================================

async function streamelementsSenden(text) {
  try {
    const channelResponse = await fetch(
      "https://api.streamelements.com/kappa/v2/channels/me",
      {
        headers: {
          Authorization: `Bearer ${STREAMELEMENTS_JWT}`,
          Accept: "application/json",
        },
      }
    );

    if (!channelResponse.ok) {
      console.error(
        "❌ StreamElements Kanal konnte nicht geladen werden:",
        channelResponse.status,
        await channelResponse.text()
      );
      return;
    }

    const channel = await channelResponse.json();
    const channelId = channel._id;

    const response = await fetch(
      `https://api.streamelements.com/kappa/v2/bot/${channelId}/say`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STREAMELEMENTS_JWT}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
        }),
      }
    );

    if (!response.ok) {
      console.error(
        "❌ StreamElements Chat-Fehler:",
        response.status,
        await response.text()
      );
      return;
    }

    console.log("📢 Bot-Nachricht gesendet:", text);
  } catch (error) {
    console.error(
      "❌ Fehler beim Senden der Bot-Nachricht:",
      error
    );
  }
}


async function pvpProfilAktualisieren(
  username,
  siege,
  niederlagen
) {
  const profilResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/fuchsprofile?spieler=eq.${encodeURIComponent(
      username
    )}&select=pvp_siege,pvp_niederlagen`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );

  if (!profilResponse.ok) {
    console.error(
      "❌ PvP-Profil konnte nicht geladen werden:",
      await profilResponse.text()
    );
    return false;
  }

  const profile = await profilResponse.json();

  if (!profile.length) {
    const erstellen = await fetch(
      `${SUPABASE_URL}/rest/v1/fuchsprofile`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          spieler: username,
          pvp_siege: siege,
          pvp_niederlagen: niederlagen,
        }),
      }
    );

    return erstellen.ok;
  }

  const neueSiege =
    (profile[0].pvp_siege || 0) + siege;

  const neueNiederlagen =
    (profile[0].pvp_niederlagen || 0) + niederlagen;

  const update = await fetch(
    `${SUPABASE_URL}/rest/v1/fuchsprofile?spieler=eq.${encodeURIComponent(
      username
    )}`,
    {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        pvp_siege: neueSiege,
        pvp_niederlagen: neueNiederlagen,
        aktualisiert: new Date().toISOString(),
      }),
    }
  );

  if (!update.ok) {
    console.error(
      "❌ PvP-Profil konnte nicht aktualisiert werden:",
      await update.text()
    );
    return false;
  }

  return true;
}


async function pvpVerarbeiten(username, text) {
  const nachricht = text.trim();

  // ---------------------------------------------------
  // !pvp @Name
  // ---------------------------------------------------

  const herausforderung =
    nachricht.match(/^!pvp\s+@?([a-zA-Z0-9_]+)$/i);

  if (herausforderung) {
    const gegner =
      herausforderung[1].toLowerCase();

    if (gegner === username) {
      return "❌ Du kannst dich nicht selbst herausfordern.";
    }

    const vorhandene = await fetch(
      `${SUPABASE_URL}/rest/v1/offene_kampfe?herausforderer=eq.${encodeURIComponent(
        username
      )}&gegner=eq.${encodeURIComponent(
        gegner
      )}&select=id&limit=1`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    if (vorhandene.ok) {
      const daten = await vorhandene.json();

      if (daten.length) {
        return `⚔️ @${gegner} wurde bereits von @${username} herausgefordert.`;
      }
    }

    const anlegen = await fetch(
      `${SUPABASE_URL}/rest/v1/offene_kampfe`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          herausforderer: username,
          gegner: gegner,
          erstellt: new Date().toISOString(),
        }),
      }
    );

    if (!anlegen.ok) {
      console.error(
        "❌ PvP-Herausforderung konnte nicht gespeichert werden:",
        await anlegen.text()
      );

      return "❌ Die PvP-Herausforderung konnte nicht gespeichert werden.";
    }

    return `⚔️ @${username} fordert @${gegner} zum PvP heraus! @${gegner} hat 60 Sekunden Zeit mit !annehmen zu antworten!`;
  }


  // ---------------------------------------------------
  // !annehmen
  // ---------------------------------------------------

  if (nachricht.toLowerCase() === "!annehmen") {
    const seit =
      new Date(
        Date.now() - 60 * 1000
      ).toISOString();

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/offene_kampfe?gegner=eq.${encodeURIComponent(
        username
      )}&erstellt=gte.${encodeURIComponent(
        seit
      )}&select=id,herausforderer,gegner,erstellt&order=erstellt.desc&limit=1`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    if (!response.ok) {
      console.error(
        "❌ PvP-Kampf konnte nicht geladen werden:",
        await response.text()
      );

      return "❌ Der PvP-Kampf konnte nicht geladen werden.";
    }

    const kaempfe = await response.json();

    if (!kaempfe.length) {
      return "❌ Du hast keine gültige PvP-Herausforderung in den letzten 60 Sekunden.";
    }

    const kampf = kaempfe[0];

    // Kampf sofort aus offener Liste löschen
    await fetch(
      `${SUPABASE_URL}/rest/v1/offene_kampfe?id=eq.${kampf.id}`,
      {
        method: "DELETE",
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    const herausforderer =
      kampf.herausforderer;

    const gegner =
      kampf.gegner;

    // Zufälliger Kampfausgang
    const herausfordererGewinnt =
      Math.random() < 0.5;

    const gewinner =
      herausfordererGewinnt
        ? herausforderer
        : gegner;

    const verlierer =
      herausfordererGewinnt
        ? gegner
        : herausforderer;

    await pvpProfilAktualisieren(
      gewinner,
      1,
      0
    );

    await pvpProfilAktualisieren(
      verlierer,
      0,
      1
    );

    await xpHinzufuegen(
      gewinner,
      100
    );

    return `⚔️ PVP-KAMPF! @${herausforderer} 🆚 @${gegner} | 🏆 Gewinner: @${gewinner}! +100 FuchsXP 🦊 | 💀 @${verlierer} verliert den Kampf.`;
  }

  return null;
}
// =====================================================
// CHAT-NACHRICHT VERARBEITEN
// =====================================================

async function chatVerarbeiten(message) {

  console.log(
    "📡 StreamElements Nachricht:",
    JSON.stringify(message)
  );


  // ---------------------------------------------------
  // StreamElements Antwort
  // ---------------------------------------------------

  if (message.type === "response") {

    console.log(
      "📨 StreamElements Antwort:",
      JSON.stringify(message)
    );

    return;
  }


  // ---------------------------------------------------
  // Nur echte Nachrichten
  // ---------------------------------------------------

  if (message.type !== "message") {
    return;
  }


  // ---------------------------------------------------
  // Topic prüfen
  // ---------------------------------------------------

  if (message.topic !== "channel.chat.message") {

    console.log(
      "ℹ️ Nachricht mit anderem Topic:",
      message.topic
    );

    return;
  }


  const data = message.data;


  // ---------------------------------------------------
  // Benutzername finden
  // ---------------------------------------------------

  const usernameRaw =
    data?.chatter_user_name ||
    data?.chatter_user_login ||
    data?.sender?.user_name ||
    data?.sender?.username ||
    data?.username ||
    data?.user?.name;
if (!usernameRaw) return;
if (usernameRaw.toLowerCase() === "streamelements") return;

  if (!usernameRaw) {

    console.log(
      "⚠️ Chat-Nachricht ohne erkannten Benutzer."
    );

    return;
  }


  // ---------------------------------------------------
  // Benutzername vereinheitlichen
  // ---------------------------------------------------

  const username =
    usernameRaw
      .trim()
      .toLowerCase();


  // ---------------------------------------------------
  // Nachrichtentext
  // ---------------------------------------------------

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


  // ---------------------------------------------------
  // Aktivität speichern
  // ---------------------------------------------------
// ---------------------------------------------------
// PVP prüfen
// ---------------------------------------------------

const pvpAntwort = await pvpVerarbeiten(
  username,
  text
);

if (pvpAntwort) {
  await streamelementsSenden(pvpAntwort);
  return;
}
  await aktivitaetSpeichern(username);


  // ---------------------------------------------------
  // DAILY QUESTS prüfen
  // ---------------------------------------------------

  await questsPruefen(
    username,
    text
  );
}


// =====================================================
// STREAMELEMENTS VERBINDUNG
// =====================================================

function verbinden() {

  console.log(
    "🔌 Verbinde mit StreamElements..."
  );


  const ws =
    new WebSocket(
      "wss://astro.streamelements.com/"
    );


  // ---------------------------------------------------
  // Verbindung geöffnet
  // ---------------------------------------------------

  ws.on("open", () => {

    console.log(
      "🦊 Mit StreamElements verbunden."
    );


    const subscribeNachricht = {
      type: "subscribe",

      nonce: crypto.randomUUID(),

      data: {
        topic: "channel.chat.message",

        token: STREAMELEMENTS_JWT,

        token_type: "jwt",
      },
    };


    console.log(
      "📤 Sende StreamElements Subscribe..."
    );


    ws.send(
      JSON.stringify(
        subscribeNachricht
      )
    );
  });


  // ---------------------------------------------------
  // Nachrichten empfangen
  // ---------------------------------------------------

  ws.on("message", (raw) => {

    try {

      const message =
        JSON.parse(
          raw.toString()
        );


      console.log(
        "📥 RAW STREAM ELEMENTS:",
        JSON.stringify(message)
      );


      chatVerarbeiten(message);

    } catch (error) {

      console.error(
        "❌ Fehler beim Verarbeiten:",
        error
      );
    }
  });


  // ---------------------------------------------------
  // Verbindung geschlossen
  // ---------------------------------------------------

  ws.on("close", () => {

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
  });


  // ---------------------------------------------------
  // WebSocket Fehler
  // ---------------------------------------------------

  ws.on("error", (error) => {

    console.error(
      "❌ WebSocket-Fehler:",
      error.message
    );
  });
}
// =============================================
// RENDER WEB PORT
// =============================================

import("node:http").then(({ createServer }) => {
  const server = createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("🦊 Fuchs-XP-Bot läuft!");
  });

  server.listen(
    process.env.PORT || 3000,
    "0.0.0.0",
    () => {
      console.log("🌐 Web-Port geöffnet.");
    }
  );
});

// =====================================================
// BOT STARTEN
// =====================================================

verbinden();

console.log(
  "🦊 Fuchs-XP-Bot gestartet!"
);
