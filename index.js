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

function zufall(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

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

async function xpHinzufuegen(username, xp) {
  try {
    await rpc("fuchs_xp_hinzufuegen", {
      spieler_name: normalisieren(username),
      xp_menge: Number(xp) || 0,
    });
  } catch (error) {
    console.error("❌ XP hinzufügen:", error.message);
  }
}

/* =====================================================
   STREAM ELEMENTS
===================================================== */

async function streamElementsChannelHolen() {
  if (!STREAMELEMENTS_JWT) {
    return streamElementsChannel;
  }

  try {
    const response = await fetch(
      "https://api.streamelements.com/kappa/v2/channels/me",
      {
        headers: {
          Authorization: `Bearer ${STREAMELEMENTS_JWT}`,
          Accept: "application/json",
        },
      }
    );

    const body = await response.text();

    if (!response.ok) {
      throw new Error(
        `StreamElements Channel-ID ${response.status}: ${body}`
      );
    }

    const data = JSON.parse(body);

    streamElementsChannel =
      data?.username ||
      data?.channel?.username ||
      data?.channel?.slug ||
      data?._id ||
      streamElementsChannel;

    return streamElementsChannel;
  } catch (error) {
    console.error(
      "❌ StreamElements Kanal:",
      error.message
    );

    return streamElementsChannel;
  }
}

function warten(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function streamelementsSenden(text) {
  if (!text || !String(text).trim()) {
    return false;
  }

  if (!STREAMELEMENTS_JWT) {
    console.log("⚠️ StreamElements JWT fehlt.");
    return false;
  }

  for (let versuch = 1; versuch <= 3; versuch++) {
    try {
      const channelResponse = await fetch(
        "https://api.streamelements.com/kappa/v2/channels/me",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${STREAMELEMENTS_JWT}`,
            Accept: "application/json",
          },
        }
      );

      const channelBody = await channelResponse.text();

      if (!channelResponse.ok) {
        console.error(
          `❌ StreamElements Channel-ID ${channelResponse.status}: ${channelBody}`
        );

        if (versuch < 3) {
          await warten(800);
        }

        continue;
      }

      const channelData = JSON.parse(channelBody);
      const channelId = channelData?._id;

      if (!channelId) {
        console.error(
          "❌ StreamElements Channel-ID konnte nicht ermittelt werden."
        );

        if (versuch < 3) {
          await warten(800);
        }

        continue;
      }

      const response = await fetch(
        `https://api.streamelements.com/kappa/v2/bot/${encodeURIComponent(
          channelId
        )}/say`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${STREAMELEMENTS_JWT}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            message: String(text),
          }),
        }
      );

      const body = await response.text();

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

/* =====================================================
   AKTIVITÄT
===================================================== */

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
          spieler: normalisieren(username),
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

/* =====================================================
   NORMALE QUESTS
===================================================== */

const normaleZiele = {
  1: 10,
  2: 5,
  3: 1,
  4: 3,
  5: 2,
};

async function questsAnlegen(username) {
  try {
    await rpc("fuchs_quests_anlegen", {
      spieler_name: normalisieren(username),
    });
  } catch (error) {
    console.error(
      "❌ Normale Quests anlegen:",
      error.message
    );
  }
}

async function questFortschrittHolen(username) {
  const datum =
    new Date().toISOString().slice(0, 10);

  try {
    return await supabase(
      `/rest/v1/quest_fortschritt` +
        `?spieler=eq.${encodeURIComponent(
          normalisieren(username)
        )}` +
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

    await rpc("quest_nachricht_verarbeiten", {
      spieler_name: normalisieren(username),
      nachricht: text,
    });

    const nachher =
      await questFortschrittHolen(username);

    const vorherMap = new Map(
      vorher.map((q) => [
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
        await xpHinzufuegen(
          username,
          10
        );

        await streamelementsSenden(
          `@${username} ✅ Quest erfolgreich erledigt! +10 FuchsXP 🦊`
        );
      }
    }

    const alleFertig =
      [1, 2, 3, 4, 5].every((n) => {
        const q =
          nachher.find(
            (x) =>
              Number(x.quest_nummer) === n
          );

        return (
          q &&
          Number(q.fortschritt || 0) >=
            normaleZiele[n]
        );
      });

    const vorherAlleFertig =
      [1, 2, 3, 4, 5].every((n) => {
        const q =
          vorher.find(
            (x) =>
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

/* =====================================================
   PERSÖNLICHE QUESTS
   - täglich eine zufällige Quest
   - Fortschritt zählt normale Chat-Nachrichten
===================================================== */

const persoenlicheQuestVorlagen = [
  {
    text: "Schreibe 5 Nachrichten im Chat.",
    ziel: 5,
    xp: 50,
  },
  {
    text: "Schreibe 10 Nachrichten im Chat.",
    ziel: 10,
    xp: 100,
  },
  {
    text: "Schreibe 20 Nachrichten im Chat.",
    ziel: 20,
    xp: 200,
  },
];

const persoenlicheQuestStatus =
  new Map();

function persoenlicheQuestStatusHolen(
  username
) {
  username =
    normalisieren(username);

  const heute =
    new Date()
      .toISOString()
      .slice(0, 10);

  let status =
    persoenlicheQuestStatus.get(
      username
    );

  if (
    !status ||
    status.datum !== heute
  ) {
    const vorlage =
      persoenlicheQuestVorlagen[
        zufall(
          0,
          persoenlicheQuestVorlagen.length - 1
        )
      ];

    status = {
      datum: heute,
      text: vorlage.text,
      ziel: vorlage.ziel,
      xp: vorlage.xp,
      fortschritt: 0,
      abgeschlossen: false,
    };

    persoenlicheQuestStatus.set(
      username,
      status
    );
  }

  return status;
}

async function persoenlicheQuestsAnlegen(
  username
) {
  persoenlicheQuestStatusHolen(
    username
  );
}

async function persoenlicheQuestsHolen(
  username
) {
  return [
    persoenlicheQuestStatusHolen(
      username
    ),
  ];
}

async function persoenlicheQuestAnzeigen(
  username
) {
  username =
    normalisieren(username);

  try {
    const quests =
      await persoenlicheQuestsHolen(
        username
      );

    const quest =
      quests[0];

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
  username =
    normalisieren(username);

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

      quest.abgeschlossen =
        true;

      await xpHinzufuegen(
        username,
        quest.xp
      );

      await streamelementsSenden(
        `🎉 @${username} persönliche Quest abgeschlossen! +${quest.xp} XP 🦊`
      );
    }

    persoenlicheQuestStatus.set(
      username,
      quest
    );
  } catch (error) {
    console.error(
      "❌ Persönliche Quest:",
      error.message
    );
  }
}

/* =====================================================
   PVP / POKÉMON
===================================================== */

const offeneKaempfe =
  new Map();

let aktuellerPvpKampf =
  null;

const eigenePokemon = {
  fuchsmissvegetalover2_0:
    "Pikachu",

  vegetalover2_0:
    "Glumanda",
};

const verfuegbarePokemon = [
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

function pokemonNameNormalisieren(
  name
) {
  if (!name) {
    return null;
  }

  const gesucht =
    String(name)
      .trim()
      .toLowerCase();

  const festesPokemon =
    Object.values(
      eigenePokemon
    ).find(
      (pokemon) =>
        pokemon.toLowerCase() ===
        gesucht
    );

  if (festesPokemon) {
    return festesPokemon;
  }

  return (
    verfuegbarePokemon.find(
      (pokemon) =>
        pokemon.toLowerCase() ===
        gesucht
    ) || null
  );
}
async function spielerProfilHolen(username) {
  try {
    const rows = await supabase(
      `/rest/v1/fuchsprofile` +
        `?spieler=eq.${encodeURIComponent(
          normalisieren(username)
        )}` +
        `&limit=1`
    );

    return rows?.[0] || null;
  } catch (error) {
    console.error(
      "❌ Profil holen:",
      error.message
    );
    return null;
  }
}

async function pokemonHolen(username) {
  const normalized =
    normalisieren(username);

  const festesPokemon =
    eigenePokemon[normalized];

  if (festesPokemon) {
    return festesPokemon;
  }

  const profil =
    await spielerProfilHolen(username);

  return profil?.pokemon || null;
}

function rudelHolen(profil) {
  return (
    profil?.rudel ||
    "🐺 Noch kein Rudel"
  );
}

async function pokemonWahl(username, pokemon) {
  username = normalisieren(username);

  if (!pokemon) {
    const vergeben = new Set(
      Object.values(eigenePokemon).map(
        (p) => p.toLowerCase()
      )
    );

    const freie =
      verfuegbarePokemon.filter(
        (p) => !vergeben.has(p.toLowerCase())
      );

    return (
      `@${username} 🐾 Wähle dein Pokémon mit !pokemon NAME | ` +
      `⚡ Pikachu ist für Fuchsmissvegetalover2_0 vergeben | ` +
      `🔥 Glumanda ist für vegetalover2_0 vergeben | ` +
      `Frei: ${freie.join(", ")}`
    );
  }

  const gewaehltesPokemon =
    pokemonNameNormalisieren(pokemon);

  if (!gewaehltesPokemon) {
    return (
      `@${username} ❌ Dieses Pokémon gibt es nicht in der Auswahl. Schreibe !pokemon für die Auswahl.`
    );
  }

  const festVergebenVon =
    Object.entries(eigenePokemon).find(
      ([, p]) =>
        p.toLowerCase() ===
        gewaehltesPokemon.toLowerCase()
    );

  if (
    festVergebenVon &&
    festVergebenVon[0].toLowerCase() !==
      username
  ) {
    return (
      `@${username} ❌ ${gewaehltesPokemon} ist bereits vergeben. Bitte wähle ein anderes Pokémon.`
    );
  }

  try {
    const rows = await supabase(
      `/rest/v1/fuchsprofile` +
        `?pokemon=eq.${encodeURIComponent(
          gewaehltesPokemon
        )}` +
        `&select=spieler,pokemon`
    );

    const andererSpieler =
      rows?.find(
        (row) =>
          row.spieler &&
          row.spieler.toLowerCase() !== username
      );

    if (andererSpieler) {
      return (
        `@${username} ❌ ${gewaehltesPokemon} ist bereits von @${andererSpieler.spieler} vergeben. Bitte wähle ein anderes Pokémon.`
      );
    }
  } catch (error) {
    console.error(
      "❌ Pokémon-Belegung prüfen:",
      error.message
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
          pokemon: gewaehltesPokemon,
        }),
      }
    );

    return (
      `@${username} 🐾 Dein Pokémon ist jetzt ${gewaehltesPokemon}!`
    );
  } catch (error) {
    console.error(
      "❌ Pokémon speichern:",
      error.message
    );

    return (
      `@${username} ❌ Dein Pokémon konnte nicht gespeichert werden.`
    );
  }
}

async function pvpStart(username, gegner) {
  username = normalisieren(username);
  gegner = normalisieren(gegner);

  if (!gegner || gegner === username) {
    return (
      `@${username} ❌ Du kannst dich nicht selbst herausfordern.`
    );
  }

  const linksProfil =
    await spielerProfilHolen(username);

  const rechtsProfil =
    await spielerProfilHolen(gegner);

  if (!linksProfil || !rechtsProfil) {
    return (
      `@${username} ❌ Ein Profil konnte nicht geladen werden.`
    );
  }

  if (!linksProfil.rudel) {
    return (
      `@${username} ❌ Du musst zuerst ein Rudel mit !rudelwahl wählen.`
    );
  }

  if (!rechtsProfil.rudel) {
    return (
      `@${username} ❌ @${gegner} hat noch kein Rudel.`
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
    herausfordererRudel:
      rudelHolen(linksProfil),
    gegnerRudel:
      rudelHolen(rechtsProfil),
    erstellt: Date.now(),
  };

  offeneKaempfe.set(gegner, kampf);

  if (
    gegner ===
    "fuchsmissvegetalover2_0"
  ) {
    const annahme =
      await kampfAnnehmen(gegner);

    await streamelementsSenden(
      `@${gegner} 🤝 Kampf automatisch angenommen!`
    );

    return annahme;
  }

  return (
    `⚔️ @${username} fordert @${gegner} zum Rudel-PvP heraus! ` +
    `@${gegner} hat 60 Sekunden Zeit mit !annehmen zu antworten!`
  );
}

async function pokemonKampfStart(username, gegner) {
  username = normalisieren(username);
  gegner = normalisieren(gegner);

  if (!gegner || gegner === username) {
    return (
      `@${username} ❌ Du kannst dich nicht selbst zum Pokémon-Kampf herausfordern.`
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
    const annahme =
      await kampfAnnehmen(gegner);

    await streamelementsSenden(
      `@${gegner} 🤝 Pokémon-Kampf automatisch angenommen!`
    );

    return annahme;
  }

  return (
    `🐾⚔️ @${username} fordert @${gegner} zum Pokémon-Kampf heraus! ` +
    `@${gegner} hat 60 Sekunden Zeit mit !annehmen zu antworten!`
  );
}

async function kampfAnnehmen(username) {
  username = normalisieren(username);

  const kampf =
    offeneKaempfe.get(username);

  if (!kampf) {
    return (
      `@${username} ❌ Für dich gibt es keinen offenen Kampf.`
    );
  }

  if (
    Date.now() - kampf.erstellt >
    60000
  ) {
    offeneKaempfe.delete(username);

    return (
      `@${username} ⌛ Die Kampf-Anfrage ist abgelaufen.`
    );
  }

  const angreifer =
    await spielerProfilHolen(
      kampf.herausforderer
    );

  const verteidiger =
    await spielerProfilHolen(
      kampf.gegner
    );

  if (!angreifer || !verteidiger) {
    offeneKaempfe.delete(username);

    return (
      `@${username} ❌ Kampf konnte nicht gestartet werden.`
    );
  }

  const angreiferPokemon =
    kampf.herausfordererPokemon ||
    angreifer.pokemon ||
    (await pokemonHolen(
      kampf.herausforderer
    ));

  const verteidigerPokemon =
    kampf.gegnerPokemon ||
    verteidiger.pokemon ||
    (await pokemonHolen(
      kampf.gegner
    ));

  if (
    kampf.typ === "pokemon" &&
    (!angreiferPokemon ||
      !verteidigerPokemon)
  ) {
    offeneKaempfe.delete(username);

    return (
      `@${username} ❌ Beide Spieler brauchen ein Pokémon.`
    );
  }

  offeneKaempfe.delete(username);

  const gewinner =
    Math.random() < 0.5
      ? kampf.herausforderer
      : kampf.gegner;

  const verlierer =
    gewinner === kampf.herausforderer
      ? kampf.gegner
      : kampf.herausforderer;

  aktuellerPvpKampf = {
    status: "fight",
    typ: kampf.typ,
    id:
      `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`,
    angreifer:
      kampf.herausforderer,
    verteidiger:
      kampf.gegner,
    angreiferRudel:
      angreifer.rudel ||
      "🐺 Noch kein Rudel",
    verteidigerRudel:
      verteidiger.rudel ||
      "🐺 Noch kein Rudel",
    angreiferPokemon:
      angreiferPokemon || "",
    verteidigerPokemon:
      verteidigerPokemon || "",
    gewinner,
    verlierer,
    gestartet: Date.now(),
  };

  await xpHinzufuegen(
    gewinner,
    100
  );

  try {
    const gewinnerProfil =
      await spielerProfilHolen(
        gewinner
      );

    const verliererProfil =
      await spielerProfilHolen(
        verlierer
      );

    await supabase(
      `/rest/v1/fuchsprofile?spieler=eq.${encodeURIComponent(
        gewinner
      )}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          pvp_siege:
            Number(
              gewinnerProfil?.pvp_siege ||
                0
            ) + 1,
        }),
      }
    );

    await supabase(
      `/rest/v1/fuchsprofile?spieler=eq.${encodeURIComponent(
        verlierer
      )}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          pvp_niederlagen:
            Number(
              verliererProfil?.pvp_niederlagen ||
                0
            ) + 1,
        }),
      }
    );
  } catch (error) {
    console.error(
      "❌ PvP Statistik:",
      error.message
    );
  }

  if (kampf.typ === "pokemon") {
    return (
      `⚡ POKÉMON-KAMPF! ` +
      `@${kampf.herausforderer} ${angreiferPokemon} ⚔️ ` +
      `@${kampf.gegner} ${verteidigerPokemon} ` +
      `→ 🏆 @${gewinner} gewinnt +100 XP!`
    );
  }

  return (
    `⚔️ RUDEL-KAMPF! ` +
    `@${kampf.herausforderer} [${angreifer.rudel}] ⚔️ ` +
    `@${kampf.gegner} [${verteidiger.rudel}] ` +
    `→ 🏆 @${gewinner} gewinnt +100 XP!`
  );
}

async function pvpAnnehmen(username) {
  return kampfAnnehmen(username);
}

async function profil(username) {
  username = normalisieren(username);

  try {
    const p =
      await spielerProfilHolen(username);

    if (!p) {
      return (
        `@${username} 🦊 Dein Profil wurde noch nicht gefunden.`
      );
    }

    const pokemon =
      await pokemonHolen(username);

    return (
      `@${username} 🦊 Profil | XP: ${p.xp || 0} | ` +
      `Rudel: ${p.rudel || "noch nicht gewählt"} | ` +
      `Pokémon: ${pokemon || "noch nicht gewählt"} | ` +
      `PvP-Siege: ${p.pvp_siege || 0} | ` +
      `PvP-Niederlagen: ${p.pvp_niederlagen || 0}`
    );
  } catch (error) {
    console.error(
      "❌ Profil:",
      error.message
    );

    return (
      `@${username} ❌ Dein Profil konnte nicht geladen werden.`
    );
  }
}

const rudelMap = {
  feuer: "🔥 Feuerrudel",
  wasser: "🌊 Wasserrudel",
  wald: "🌲 Waldrudel",
  ice: "🧊 ICErudel",
};

async function rudelwahl(username, auswahl) {
  username = normalisieren(username);

  if (!auswahl) {
    return (
      `@${username} 🐺 Wähle dein Rudel: !rudelwahl Feuer | ` +
      `!rudelwahl Wasser | !rudelwahl Wald | !rudelwahl ICE`
    );
  }

  const key =
    String(auswahl)
      .trim()
      .toLowerCase();

  const rudel =
    rudelMap[key];

  if (!rudel) {
    return (
      `@${username} ❌ Dieses Rudel gibt es nicht. Wähle Feuer, Wasser, Wald oder ICE.`
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
          rudel,
        }),
      }
    );

    return (
      `@${username} 🐺 Du bist jetzt im ${rudel}!`
    );
  } catch (error) {
    console.error(
      "❌ Rudel speichern:",
      error.message
    );

    return (
      `@${username} ❌ Dein Rudel konnte nicht gespeichert werden.`
    );
  }
}

async function alleBefehle(username) {
  await streamelementsSenden(
    `@${normalisieren(username)} 🦊 Befehle: !profil | !rudelwahl Feuer/Wasser/Wald/ICE | !pokemon | !pokemon Name | !quest | !pvp @Name | !pokekampf @Name | !annehmen | !allebefehle`
  );
}
/* =====================================================
   CHAT
===================================================== */

async function chatVerarbeiten(message) {
  if (message.type === "response") {
    return;
  }

  if (message.type !== "message") {
    return;
  }

  if (message.topic !== "channel.chat.message") {
    return;
  }

  const data = message.data;

  const broadcasterChannel =
    data?.broadcaster_user_login ||
    data?.broadcaster_user_name ||
    data?.broadcaster?.username ||
    data?.broadcaster?.channel_slug;

  if (broadcasterChannel) {
    streamElementsChannel =
      normalisieren(broadcasterChannel);
  }

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

  if (username === "streamelements") {
    return;
  }

  const text =
    data?.message?.text ||
    data?.text ||
    "";

  console.log(
    `💬 ${username}: ${text}`
  );

  await aktivitaetSpeichern(username);

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
        `@${username} ❌ Das Pokémon konnte gerade nicht verarbeitet werden.`
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
        await pvpAnnehmen(username);

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
        `@${username} ❌ Der Kampf konnte nicht angenommen werden.`
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
      await alleBefehle(username);
    } catch (error) {
      console.error(
        "❌ !allebefehle:",
        error.message
      );
    }

    return;
  }

  try {
    await questsPruefen(
      username,
      text
    );

    await persoenlicheQuestPruefen(
      username,
      text
    );
  } catch (error) {
    console.error(
      "❌ Quest-Verarbeitung:",
      error.message
    );
  }
}


/* =====================================================
   HTTP SERVER / PVP OVERLAY
===================================================== */

const server =
  http.createServer(
    async (req, res) => {
      try {
        if (req.url === "/") {
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

        if (req.url === "/pvp") {
          res.writeHead(
            200,
            {
              "Content-Type":
                "text/html; charset=utf-8",
            }
          );

          res.end(`<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Fuchs PvP</title>

<style>
html,body{
  margin:0;
  padding:0;
  width:100%;
  height:100%;
  overflow:hidden;
  background:transparent;
  font-family:Arial,sans-serif;
}

#app{
  width:100%;
  height:100%;
  display:flex;
  align-items:center;
  justify-content:center;
}

.card{
  min-width:700px;
  max-width:90vw;
  padding:28px;
  border-radius:24px;
  background:rgba(20,20,20,.92);
  color:white;
  text-align:center;
  box-shadow:0 0 30px rgba(0,0,0,.5);
}

.title{
  font-size:38px;
  font-weight:900;
  margin-bottom:25px;
}

.fighters{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:30px;
}

.fighter{
  min-width:250px;
  padding:20px;
  border-radius:18px;
  background:rgba(255,255,255,.08);
}

.name{
  font-size:27px;
  font-weight:800;
}

.detail{
  margin-top:10px;
  font-size:22px;
}

.vs{
  font-size:40px;
  font-weight:900;
}

.winner{
  margin-top:25px;
  font-size:28px;
  font-weight:900;
}
</style>
</head>

<body>

<div id="app"></div>

<script>
async function laden(){
  try{
    const response =
      await fetch("/pvp-data");

    const data =
      await response.json();

    const app =
      document.getElementById("app");

    if(!data || !data.kampf){
      app.innerHTML="";
      return;
    }

    const kampf =
      data.kampf;

    const pokemon =
      kampf.typ === "pokemon";

    const title =
      pokemon
        ? "🐾 POKÉMON-KAMPF 🐾"
        : "⚔️ RUDEL-KAMPF ⚔️";

    const detail1 =
      pokemon
        ? (kampf.angreiferPokemon || "")
        : (kampf.angreiferRudel || "");

    const detail2 =
      pokemon
        ? (kampf.verteidigerPokemon || "")
        : (kampf.verteidigerRudel || "");

    app.innerHTML = \`
      <div class="card">

        <div class="title">
          \${title}
        </div>

        <div class="fighters">

          <div class="fighter">
            <div class="name">
              @\${kampf.angreifer}
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
              @\${kampf.verteidiger}
            </div>

            <div class="detail">
              \${detail2}
            </div>
          </div>

        </div>

        <div class="winner">
          🏆 @\${kampf.gewinner}
        </div>

      </div>
    \`;
  } catch(error) {
    console.error(error);
  }
}

laden();

setInterval(
  laden,
  1000
);
</script>

</body>
</html>`);

          return;
        }

        if (req.url === "/pvp-data") {
          res.writeHead(
            200,
            {
              "Content-Type":
                "application/json; charset=utf-8",
              "Cache-Control":
                "no-cache, no-store, must-revalidate",
            }
          );

          res.end(
            JSON.stringify(
              aktuellerPvpKampf
                ? {
                    kampf:
                      aktuellerPvpKampf
                  }
                : {
                    kampf: null
                  }
            )
          );

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


/* =====================================================
   STREAM ELEMENTS WEBSOCKET
===================================================== */

let ws = null;

let wsReconnectTimer = null;

function streamelementsVerbinden() {

  if (!STREAMELEMENTS_JWT) {
    console.error(
      "❌ STREAMELEMENTS_JWT fehlt."
    );

    return;
  }

  if (
    ws &&
    ws.readyState === WebSocket.OPEN
  ) {
    return;
  }

  console.log(
    "🔌 Verbinde StreamElements WebSocket..."
  );

  ws =
    new WebSocket(
      "wss://astro.streamelements.com/"
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
    async (raw) => {

      try {

        const message =
          JSON.parse(
            raw.toString()
          );

        if (
          message.type ===
          "welcome"
        ) {

          const subscribeMessage = {

            type:
              "subscribe",

            nonce:
              `fuchs-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}`,

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
              subscribeMessage
            )
          );

          console.log(
            "📡 StreamElements Chat-Topic wird abonniert."
          );

          return;
        }

        if (
          message.type ===
          "response"
        ) {

          if (message.error) {

            console.error(
              "❌ StreamElements Abo-Fehler:",
              message.error
            );

          } else {

            console.log(
              "✅ StreamElements Chat-Topic bestätigt."
            );
          }

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
    "close",
    (code, reason) => {

      console.log(
        `🔌 StreamElements WebSocket getrennt (${code}) ${
          reason?.toString?.() || ""
        }`
      );

      if (wsReconnectTimer) {
        return;
      }

      wsReconnectTimer =
        setTimeout(
          () => {

            wsReconnectTimer =
              null;

            streamelementsVerbinden();

          },
          5000
        );
    }
  );

  ws.on(
    "error",
    (error) => {

      console.error(
        "❌ StreamElements WebSocket:",
        error.message
      );
    }
  );
}


/* =====================================================
   SERVER START
===================================================== */

const PORT =
  process.env.PORT ||
  10000;

server.listen(
  PORT,
  async () => {

    console.log(
      `🚀 Server läuft auf Port ${PORT}`
    );

    try {

      await streamElementsChannelHolen();

      console.log(
        "📺 StreamElements Kanal:",
        streamElementsChannel
      );

    } catch (error) {

      console.error(
        "⚠️ StreamElements Kanal konnte nicht geladen werden:",
        error.message
      );
    }

    streamelementsVerbinden();
  }
);

// Ende der index.js