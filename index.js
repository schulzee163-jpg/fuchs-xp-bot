import http from "http";
import WebSocket from "ws";

const PORT = process.env.PORT || 10000;

const STREAMELEMENTS_JWT = process.env.STREAMELEMENTS_JWT;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!STREAMELEMENTS_JWT) {
  console.error("STREAMELEMENTS_JWT fehlt!");
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Supabase Zugangsdaten fehlen!");
  process.exit(1);
}


// ================================
// HTTP-SERVER FÜR RENDER
// ================================

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8",
  });

  res.end("🦊 Fuchs-XP-Bot läuft!");
});

server.listen(PORT, () => {
  console.log(`🦊 HTTP-Server läuft auf Port ${PORT}`);
});


// ================================
// AKTIVITÄT IN SUPABASE SPEICHERN
// ================================

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
        "❌ Supabase-Fehler:",
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


// ================================
// STREAM-ELEMENTS CHAT-NACHRICHT
// ================================

function chatVerarbeiten(message) {

  // Alle Nachrichten zur Kontrolle ausgeben
  console.log(
    "📡 StreamElements Nachricht:",
    JSON.stringify(message)
  );


  // Antworten von StreamElements
  if (message.type === "response") {

    console.log(
      "📨 StreamElements Antwort:",
      JSON.stringify(message)
    );

    return;
  }


  // Nur echte Nachrichten weiterverarbeiten
  if (message.type !== "message") {
    return;
  }


  // Nur Twitch-Chat-Nachrichten
  if (message.topic !== "channel.chat.message") {
    return;
  }


  const data = message.data;


  // ================================
  // NEU: CHAT-TEXT AUSLESEN
  // ================================

  console.log(
    "💬 Nachrichtentext:",
    data?.message
  );


  // ================================
  // BENUTZERNAMEN ERKENNEN
  // ================================

  const usernameRaw =
    data?.chatter_user_name ||
    data?.chatter_user_login ||
    data?.sender?.user_name ||
    data?.sender?.username ||
    data?.username ||
    data?.user?.name;


  if (usernameRaw) {

    // Alle Namen einheitlich klein schreiben
    const username = usernameRaw.trim().toLowerCase();


    console.log(
      `💬 Aktivität: ${username}`
    );


    // Aktivität speichern
    aktivitaetSpeichern(username);


  } else {

    console.log(
      "⚠️ Chat-Nachricht ohne erkannten Benutzernamen."
    );

  }
}


// ================================
// MIT STREAM-ELEMENTS VERBINDEN
// ================================

function verbinden() {

  const ws = new WebSocket(
    "wss://astro.streamelements.com/"
  );


  // Verbindung hergestellt
  ws.on("open", () => {

    console.log(
      "🦊 Mit StreamElements verbunden."
    );

  });


  // Nachrichten von StreamElements
  ws.on("message", (raw) => {

    try {

      const message =
        JSON.parse(raw.toString());


      chatVerarbeiten(message);


    } catch (error) {

      console.error(
        "❌ Fehler beim Verarbeiten:",
        error
      );

    }

  });


  // Verbindung beendet
  ws.on("close", () => {

    console.log(
      "⚠️ StreamElements-Verbindung beendet."
    );


    // Nach 5 Sekunden erneut verbinden
    setTimeout(
      verbinden,
      5000
    );

  });


  // WebSocket-Fehler
  ws.on("error", (error) => {

    console.error(
      "❌ WebSocket-Fehler:",
      error.message
    );

  });

}


// ================================
// BOT STARTEN
// ================================

verbinden();

console.log(
  "🦊 Fuchs-XP-Bot gestartet."
);
