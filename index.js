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

// HTTP-Server für Render
const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8",
  });

  res.end("🦊 Fuchs-XP-Bot läuft!");
});

server.listen(PORT, () => {
  console.log(`🦊 HTTP-Server läuft auf Port ${PORT}`);
});

async function aktivitaetSpeichern(username) {
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
      "Fehler beim Speichern:",
      response.status,
      await response.text()
    );
  }
}

function chatVerarbeiten(message) {
  if (
    message.type !== "message" ||
    message.topic !== "channel.chat.message"
  ) {
    return;
  }

  const data = message.data;

  const username =
    data?.sender?.user_name ||
    data?.sender?.username ||
    data?.username ||
    data?.user?.name;

  if (username) {
    console.log(`💬 Aktivität: ${username}`);
    aktivitaetSpeichern(username);
  }
}

function verbinden() {
  const ws = new WebSocket("wss://astro.streamelements.com/");

  ws.on("open", () => {
    console.log("🦊 Mit StreamElements verbunden.");
  });

  ws.on("message", (raw) => {
    try {
      const message = JSON.parse(raw.toString());

      if (message.type === "welcome") {
        ws.send(
          JSON.stringify({
            type: "subscribe",
            nonce: crypto.randomUUID(),
            data: {
              topic: "channel.chat.message",
              token: STREAMELEMENTS_JWT,
              token_type: "jwt",
            },
          })
        );

        console.log("🦊 Chat-Überwachung aktiviert.");
      }

      chatVerarbeiten(message);
    } catch (error) {
      console.error("Fehler:", error);
    }
  });

  ws.on("close", () => {
    console.log("⚠️ StreamElements-Verbindung beendet.");
    setTimeout(verbinden, 5000);
  });

  ws.on("error", (error) => {
    console.error("WebSocket-Fehler:", error.message);
  });
}

verbinden();

console.log("🦊 Fuchs-XP-Bot gestartet.");
