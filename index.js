import http from "http";
import WebSocket from "ws";

const PORT = process.env.PORT || 10000;

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  "https://herznunvdqcmzeffblgo.supabase.co";

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STREAMELEMENTS_JWT = process.env.STREAMELEMENTS_JWT;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY fehlt.");
}

if (!STREAMELEMENTS_JWT) {
  console.error("❌ STREAMELEMENTS_JWT fehlt.");
}

const QUEST_ZIELE = {
  1: 10,
  2: 5,
  3: 1,
  4: 3,
  5: 2
};

const QUEST_NAMEN = {
  1: "💬 Nachrichten schreiben",
  2: "😀 Emojis benutzen",
  3: "🥕 Vegeta schreiben",
  4: "🦊 Fuchs 3-mal schreiben",
  5: "🎯 Ich liebe Füchse 2-mal schreiben"
};

let ws = null;
let reconnectTimer = null;
let streamElementsRoomId = null;

async function supabase(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      `Supabase ${response.status}: ${
        typeof data === "string" ? data : JSON.stringify(data)
      }`
    );
  }

  return data;
}

async function rpc(functionName, body) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/rpc/${functionName}`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
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
      `RPC ${functionName} ${response.status}: ${
        typeof data === "string" ? data : JSON.stringify(data)
      }`
    );
  }

  return data;
}

async function streamelementsSenden(text) {
  if (!STREAMELEMENTS_JWT || !streamElementsRoomId) {
    console.error(
      "⚠️ StreamElements kann nicht senden: JWT oder Room-ID fehlt."
    );
    return;
  }

  const response = await fetch(
    `https://api.streamelements.com/kappa/v2/bot/${streamElementsRoomId}/say`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STREAMELEMENTS_JWT}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: text })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `❌ StreamElements Senden fehlgeschlagen (${response.status}): ${errorText}`
    );
    return;
  }

  console.log("📤 StreamElements:", text);
}

async function aktivitaetSpeichern(username) {
  const jetzt = new Date().toISOString();

  try {
    const vorhandene = await supabase(
      `fuchs_aktivitaet?select=spieler&spieler=eq.${encodeURIComponent(
        username
      )}&limit=1`
    );

    if (Array.isArray(vorhandene) && vorhandene.length > 0) {
      await supabase(
        `fuchs_aktivitaet?spieler=eq.${encodeURIComponent(username)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            letzte_aktivitaet: jetzt
          })
        }
      );
    } else {
      await supabase("fuchs_aktivitaet", {
        method: "POST",
        body: JSON.stringify({
          spieler: username,
          letzte_aktivitaet: jetzt,
          letzte_xp: null
        })
      });
    }

    console.log(`💾 Aktivität gespeichert: ${username}`);
  } catch (error) {
    console.error("❌ Aktivität speichern:", error.message);
  }
}

function heute() {
  return new Date().toISOString().slice(0, 10);
}

async function questFortschrittHolen(username) {
  const datum = heute();

  const rows = await supabase(
    `quest_fortschritt?select=quest_nummer,fortschritt&spieler=eq.${encodeURIComponent(
      username
    )}&datum=eq.${datum}&order=quest_nummer.asc`
  );

  const map = {};

  for (const row of rows || []) {
    map[row.quest_nummer] = Number(row.fortschritt || 0);
  }

  return map;
}

async function questsAnlegen(username) {
  try {
    await rpc("fuchs_quests_anlegen", {
      spieler_name: username
    });
  } catch (error) {
    console.error("❌ Quests anlegen:", error.message);
  }
}

async function questsPruefen(username, text) {
  try {
    const nachricht = String(text ?? "").toLowerCase();

    await questsAnlegen(username);

    const vorher = await questFortschrittHolen(username);

    await rpc("quest_nachricht_verarbeiten", {
      spieler_name: username,
      nachricht
    });

    const nachher = await questFortschrittHolen(username);

    for (const nummer of [1, 2, 3, 4, 5]) {
      const ziel = QUEST_ZIELE[nummer];
      const alt = vorher[nummer] || 0;
      const neu = Math.min(nachher[nummer] || 0, ziel);

      if (alt < ziel && neu >= ziel) {
        await streamelementsSenden(
          `@${username} Quest erfolgreich erledigt! +10 FuchsXP 🦊`
        );

        console.log(
          `✅ ${username} hat Quest ${nummer} abgeschlossen: ${QUEST_NAMEN[nummer]}`
        );
      }
    }

    const alleVorher = [1, 2, 3, 4, 5].every(
      (nummer) => (vorher[nummer] || 0) >= QUEST_ZIELE[nummer]
    );

    const alleNachher = [1, 2, 3, 4, 5].every(
      (nummer) => (nachher[nummer] || 0) >= QUEST_ZIELE[nummer]
    );

    if (!alleVorher && alleNachher) {
      await streamelementsSenden(
        `@${username} Du hast heute alle Aufgaben erledigt! Komm morgen wieder – dann warten neue Aufgaben auf dich! 🦊🏆`
      );
    }
  } catch (error) {
    console.error("❌ Quests prüfen:", error.message);
  }
}

async function profilHolen(username) {
  const rows = await supabase(
    `fuchsprofile?select=spieler,xp,rudel,pvp_siege,pvp_niederlagen&spieler=eq.${encodeURIComponent(
      username
    )}&limit=1`
  );

  return rows?.[0] || null;
}

async function profilAnlegen(username) {
  try {
    const profil = await profilHolen(username);

    if (profil) {
      return profil;
    }

    await supabase("fuchsprofile", {
      method: "POST",
      body: JSON.stringify({
        spieler: username,
        xp: 0,
        rudel: null,
        pvp_siege: 0,
        pvp_niederlagen: 0
      })
    });

    return await profilHolen(username);
  } catch (error) {
    console.error("❌ Profil anlegen:", error.message);
    return null;
  }
}

async function xpGeben(username, menge) {
  try {
    const neueXp = await rpc("fuchs_xp_hinzufuegen", {
      spieler_name: username,
      xp_menge: menge
    });

    console.log(`⭐ ${username}: +${menge} XP → ${neueXp}`);

    return Number(neueXp);
  } catch (error) {
    console.error("❌ XP geben:", error.message);
    return null;
  }
}

async function offeneKampfHolen(herausforderer, gegner) {
  const rows = await supabase(
    `offene_kampfe?select=id,herausforderer,gegner,erstellt&herausforderer=eq.${encodeURIComponent(
      herausforderer
    )}&gegner=eq.${encodeURIComponent(gegner)}&order=erstellt.desc&limit=1`
  );

  return rows?.[0] || null;
}

async function pvpStarten(herausforderer, gegner) {
  if (!gegner || herausforderer === gegner) {
    await streamelementsSenden(
      `@${herausforderer} Du kannst dich nicht selbst zum PvP herausfordern.`
    );
    return;
  }

  try {
    await profilAnlegen(herausforderer);
    await profilAnlegen(gegner);

    const bestehend = await offeneKampfHolen(
      herausforderer,
      gegner
    );

    if (bestehend) {
      await streamelementsSenden(
        `⚔️ @${herausforderer} Du hast @${gegner} bereits herausgefordert!`
      );
      return;
    }

    await supabase("offene_kampfe", {
      method: "POST",
      body: JSON.stringify({
        herausforderer,
        gegner,
        erstellt: new Date().toISOString()
      })
    });

    await streamelementsSenden(
      `⚔️ @${herausforderer} fordert @${gegner} zum PvP heraus! @${gegner} hat 60 Sekunden Zeit mit !annehmen zu antworten!`
    );
  } catch (error) {
    console.error("❌ PvP starten:", error.message);
  }
}

async function pvpAnnehmen(gegner) {
  try {
    const rows = await supabase(
      `offene_kampfe?select=id,herausforderer,gegner,erstellt&gegner=eq.${encodeURIComponent(
        gegner
      )}&order=erstellt.asc&limit=1`
    );

    const kampf = rows?.[0];

    if (!kampf) {
      await streamelementsSenden(
        `@${gegner} Es gibt keinen offenen PvP-Kampf für dich.`
      );
      return;
    }

    const erstellt = new Date(kampf.erstellt).getTime();
    const jetzt = Date.now();

    if (jetzt - erstellt > 60_000) {
      await supabase(
        `offene_kampfe?id=eq.${kampf.id}`,
        {
          method: "DELETE",
          prefer: "return=minimal"
        }
      );

      await streamelementsSenden(
        `@${gegner} Die 60 Sekunden sind leider vorbei. Die Herausforderung ist abgelaufen.`
      );

      return;
    }

    await supabase(
      `offene_kampfe?id=eq.${kampf.id}`,
      {
        method: "DELETE",
        prefer: "return=minimal"
      }
    );

    const spieler = [
      kampf.herausforderer,
      kampf.gegner
    ];

    const gewinnerIndex = Math.floor(Math.random() * 2);

    const gewinner = spieler[gewinnerIndex];
    const verlierer = spieler[1 - gewinnerIndex];

    await profilAnlegen(gewinner);
    await profilAnlegen(verlierer);

    const gewinnerProfil = await profilHolen(gewinner);
    const verliererProfil = await profilHolen(verlierer);

    await supabase(
      `fuchsprofile?spieler=eq.${encodeURIComponent(gewinner)}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          pvp_siege:
            Number(gewinnerProfil?.pvp_siege || 0) + 1,
          aktualisiert: new Date().toISOString()
        }),
        prefer: "return=minimal"
      }
    );

    await supabase(
      `fuchsprofile?spieler=eq.${encodeURIComponent(verlierer)}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          pvp_niederlagen:
            Number(verliererProfil?.pvp_niederlagen || 0) + 1,
          aktualisiert: new Date().toISOString()
        }),
        prefer: "return=minimal"
      }
    );

    await xpGeben(gewinner, 100);

    await streamelementsSenden(
      `⚔️ PVP-KAMPF! @${kampf.herausforderer} 🆚 @${kampf.gegner} | 🏆 Gewinner: @${gewinner}! +100 FuchsXP 🦊 | 💀 @${verlierer} verliert den Kampf.`
    );
  } catch (error) {
    console.error("❌ PvP annehmen:", error.message);
  }
}

async function chatVerarbeiten(message) {
  try {
    console.log(
      "📡 StreamElements Nachricht:",
      JSON.stringify(message)
    );

    if (message.type === "response") return;
    if (message.type !== "message") return;
    if (message.topic !== "channel.chat.message") return;

    if (message.room) {
      streamElementsRoomId = message.room;
    }

    const data = message.data;

    const usernameRaw =
      data?.chatter_user_name ||
      data?.chatter_user_login ||
      data?.sender?.user_name ||
      data?.sender?.username ||
      data?.username ||
      data?.user?.name;

    if (!usernameRaw) return;
const username = String(usernameRaw)
  .trim()
  .toLowerCase();

// Eigene StreamElements-Nachrichten ignorieren
if (username === "streamelements") {
  console.log("🤖 Eigene StreamElements-Nachricht ignoriert.");
  return;
}

const text =
  data?.message?.text ||
  data?.text ||
  data?.content ||
  "";

console.log(`💬 Aktivität erkannt: ${username}`);

    await profilAnlegen(username);
    await aktivitaetSpeichern(username);
    await questsPruefen(username, text);

    const nachricht = String(text).trim();

    const pvpMatch = nachricht.match(
      /^!pvp\s+@?([a-zA-Z0-9_]+)$/i
    );

    if (pvpMatch) {
      await pvpStarten(
        username,
        pvpMatch[1].toLowerCase()
      );
      return;
    }

    if (/^!annehmen$/i.test(nachricht)) {
      await pvpAnnehmen(username);
      return;
    }
  } catch (error) {
    console.error(
      "❌ Chat-Verarbeitung:",
      error.message
    );
  }
}

function verbinden() {
  if (!STREAMELEMENTS_JWT) {
    console.error(
      "❌ Keine STREAMELEMENTS_JWT – WebSocket startet nicht."
    );
    return;
  }

  if (ws) {
    try {
      ws.close();
    } catch {}
  }

  console.log("🔌 Verbinde mit StreamElements...");

  ws = new WebSocket(
    "wss://astro.streamelements.com"
  );

  ws.on("open", () => {
    console.log(
      "🟢 StreamElements WebSocket verbunden."
    );
  });

  ws.on("message", async (raw) => {
    try {
      const message = JSON.parse(
        raw.toString()
      );

      console.log(
        "📨 WebSocket:",
        message.type
      );

      if (message.type === "welcome") {
        const subscribeNachricht = {
          type: "subscribe",
          nonce: crypto.randomUUID(),
          data: {
            topic: "channel.chat.message",
            token: STREAMELEMENTS_JWT,
            token_type: "jwt"
          }
        };

        ws.send(
          JSON.stringify(
            subscribeNachricht
          )
        );

        console.log(
          "📡 Chat-Topic abonniert."
        );

        return;
      }

      await chatVerarbeiten(message);
    } catch (error) {
      console.error(
        "❌ WebSocket Nachricht:",
        error.message
      );
    }
  });

  ws.on("error", (error) => {
    console.error(
      "❌ StreamElements WebSocket:",
      error.message
    );
  });

  ws.on("close", () => {
    console.log(
      "⚠️ StreamElements-Verbindung beendet."
    );

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }

    reconnectTimer = setTimeout(() => {
      console.log(
        "🔄 Neuer Verbindungsversuch..."
      );

      verbinden();
    }, 5000);
  });
}

const server = http.createServer(
  (req, res) => {
    res.writeHead(200, {
      "Content-Type":
        "text/plain; charset=utf-8"
    });

    res.end(
      "🦊 Fuchs-XP-Bot läuft!"
    );
  }
);

server.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `🌐 Web-Port geöffnet auf ${PORT}.`
    );
  }
);

verbinden();

console.log(
  "🦊 Fuchs-XP-Bot gestartet!"
);
