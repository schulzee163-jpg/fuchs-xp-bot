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

async function questSpeichern(
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

  return true;
}


// =====================================================
// QUEST FORTSCHRITT AKTUALISIEREN
// =====================================================

async function questFortschritt(username, questNummer, menge, ziel) {
  const datum = heutigesDatum();

  const aktuelleQuest = await questLaden(
    username,
    questNummer,
    datum
  );

  const alterFortschritt =
    aktuelleQuest?.fortschritt ?? 0;

  // Bereits abgeschlossen
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

  // Quest gerade abgeschlossen
  if (
    alterFortschritt < ziel &&
    neuerFortschritt >= ziel
  ) {
    await xpHinzufuegen(username, 10);

    console.log(
      `🎉 ${username} hat Quest ${questNummer} abgeschlossen! +10 FuchsXP`
    );
  }
}


// =====================================================
// DAILY QUESTS
// =====================================================

async function questsPruefen(username, text) {
  const nachricht = text.toLowerCase();

  // ---------------------------------------------------
  // QUEST 1
  // 💬 Nachrichten schreiben
  // Ziel: 10 Nachrichten
  // ---------------------------------------------------

  await questFortschritt(
    username,
    1,
    1,
    10
  );


  // ---------------------------------------------------
  // QUEST 2
  // 😀 Emojis benutzen
  // Ziel: 5 Nachrichten mit Emoji
  // ---------------------------------------------------

  const emojiGefunden =
    /[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]/u.test(text);

  if (emojiGefunden) {
    await questFortschritt(
      username,
      2,
      1,
      5
    );
  }


  // ---------------------------------------------------
  // QUEST 3
  // 🥕 "Vegeta" schreiben
  // Ziel: 1x
  // ---------------------------------------------------

  if (nachricht.includes("vegeta")) {
    await questFortschritt(
      username,
      3,
      1,
      1
    );
  }


  // ---------------------------------------------------
  // QUEST 4
  // 🦊 "Fuchs" 3-mal schreiben
  // ---------------------------------------------------

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


  // ---------------------------------------------------
  // QUEST 5
  // 🎯 "Ich liebe Füchse" 2-mal schreiben
  // ---------------------------------------------------

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


// =====================================================
// BOT STARTEN
// =====================================================

verbinden();

console.log(
  "🦊 Fuchs-XP-Bot gestartet!"
);
