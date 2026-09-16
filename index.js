import http from "http";
import WebSocket from "ws";

/* =====================================================
   KONFIGURATION
===================================================== */

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  "https://herznunvdqcmzeffblgo.supabase.co";

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const STREAMELEMENTS_JWT =
  process.env.STREAMELEMENTS_JWT;

let streamElementsChannel =
  process.env.STREAMELEMENTS_CHANNEL || null;


/* =====================================================
   HILFSFUNKTIONEN
===================================================== */

function normalisieren(username) {
  return String(username || "")
    .trim()
    .toLowerCase();
}

function zufall(min, max) {
  return Math.floor(
    Math.random() * (max - min + 1)
  ) + min;
}

function headers(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization:
      `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function supabase(path, options = {}) {
  const response = await fetch(
    `${SUPABASE_URL}${path}`,
    {
      ...options,
      headers: headers(
        options.headers || {}
      ),
    }
  );

  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `Supabase ${response.status}: ${text}`
    );
  }

  return text
    ? JSON.parse(text)
    : null;
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

async function xpHinzufuegen(
  username,
  xp
) {
  try {
    await rpc(
      "fuchs_xp_hinzufuegen",
      {
        spieler_name:
          normalisieren(username),
        xp_menge:
          Number(xp) || 0,
      }
    );
  } catch (error) {
    console.error(
      "❌ XP hinzufügen:",
      error.message
    );
  }
}


/* =====================================================
   STREAM ELEMENTS
===================================================== */

async function streamElementsChannelHolen() {
  if (!STREAMELEMENTS_JWT) {
    return null;
  }

  const response = await fetch(
    "https://api.streamelements.com/kappa/v2/channels/me",
    {
      headers: {
        Authorization:
          `Bearer ${STREAMELEMENTS_JWT}`,
        Accept:
          "application/json",
      },
    }
  );

  const text =
    await response.text();

  if (!response.ok) {
    throw new Error(
      `StreamElements Channel-ID ${response.status}: ${text}`
    );
  }

  const data =
    JSON.parse(text);

  streamElementsChannel =
    data?._id ||
    streamElementsChannel;

  return streamElementsChannel;
}

async function streamelementsSenden(text) {
  if (
    !text ||
    !String(text).trim()
  ) {
    return false;
  }

  if (!STREAMELEMENTS_JWT) {
    console.log(
      "⚠️ StreamElements JWT fehlt."
    );
    return false;
  }

  try {
    const channelId =
      await streamElementsChannelHolen();

    if (!channelId) {
      console.error(
        "❌ StreamElements Channel-ID fehlt."
      );
      return false;
    }

    const response =
      await fetch(
        `https://api.streamelements.com/kappa/v2/bot/${encodeURIComponent(
          channelId
        )}/say`,
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${STREAMELEMENTS_JWT}`,
            "Content-Type":
              "application/json",
            Accept:
              "application/json",
          },
          body: JSON.stringify({
            message:
              String(text),
          }),
        }
      );

    const body =
      await response.text();

    console.log(
      `📤 StreamElements ${response.status}: ${body}`
    );

    if (!response.ok) {
      console.error(
        "❌ StreamElements:",
        body
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "❌ StreamElements senden:",
      error.message
    );
    return false;
  }
}


/* =====================================================
   AKTIVITÄT
===================================================== */

async function aktivitaetSpeichern(
  username
) {
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
          spieler:
            normalisieren(username),
          letzte_aktivitaet:
            new Date().toISOString(),
        }),
      }
    );
  } catch (error) {
    console.error(
      "❌ Aktivität:",
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

async function questsAnlegen(
  username
) {
  try {
    await rpc(
      "fuchs_quests_anlegen",
      {
        spieler_name:
          normalisieren(username),
      }
    );
  } catch (error) {
    console.error(
      "❌ Quests anlegen:",
      error.message
    );
  }
}

async function questFortschrittHolen(
  username
) {
  const datum =
    new Date()
      .toISOString()
      .slice(0, 10);

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

async function questFortschrittPruefen(
  username,
  text
) {
  try {
    await rpc(
      "quest_nachricht_verarbeiten",
      {
        spieler_name:
          normalisieren(username),
        nachricht:
          String(text || ""),
      }
    );
  } catch (error) {
    console.error(
      "❌ Quest-Verarbeitung:",
      error.message
    );
  }
}

async function questsPruefen(
  username,
  text
) {
  try {
    await questsAnlegen(
      username
    );

    const vorher =
      await questFortschrittHolen(
        username
      );

    await questFortschrittPruefen(
      username,
      text
    );

    const nachher =
      await questFortschrittHolen(
        username
      );

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

        await xpHinzufuegen(
          username,
          10
        );
      }
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
===================================================== */

const persoenlicheQuestStatus =
  new Map();

const persoenlicheQuestVorlagen = [
  {
    text:
      "Schreibe 5 Nachrichten im Chat.",
    ziel: 5,
    xp: 50,
  },
  {
    text:
      "Schreibe 10 Nachrichten im Chat.",
    ziel: 10,
    xp: 100,
  },
  {
    text:
      "Schreibe 20 Nachrichten im Chat.",
    ziel: 20,
    xp: 200,
  },
];

function persoenlicheQuestStatusHolen(
  username
) {
  username =
    normalisieren(username);

  let status =
    persoenlicheQuestStatus.get(
      username
    );

  if (
    !status ||
    (
      !status.abgeschlossen &&
      Date.now() -
        status.gestartet >
        60000
    )
  ) {
    const vorlage =
      persoenlicheQuestVorlagen[
        zufall(
          0,
          persoenlicheQuestVorlagen.length - 1
        )
      ];

    status = {
      text:
        vorlage.text,
      ziel:
        vorlage.ziel,
      xp:
        vorlage.xp,
      fortschritt:
        0,
      abgeschlossen:
        false,
      gestartet:
        Date.now(),
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

  const quest =
    persoenlicheQuestStatusHolen(
      username
    );

  if (quest.abgeschlossen) {
    await streamelementsSenden(
      `🎯 @${username} deine persönliche Quest ist bereits abgeschlossen!`
    );
    return;
  }

  await streamelementsSenden(
    `🎯 @${username} persönliche Quest: ${quest.text} (${quest.fortschritt}/${quest.ziel}) – Belohnung: ${quest.xp} XP`
  );
}

async function persoenlicheQuestPruefen(
  username,
  text
) {
  username =
    normalisieren(username);

  if (!text) {
    return;
  }

  const quest =
    persoenlicheQuestStatusHolen(
      username
    );

  if (quest.abgeschlossen) {
    return;
  }

  quest.fortschritt++;

  if (
    quest.fortschritt >=
    quest.ziel
  ) {
    quest.fortschritt =
      quest.ziel;

    quest.abgeschlossen =
      true;

    persoenlicheQuestStatus.set(
      username,
      quest
    );

    await xpHinzufuegen(
      username,
      quest.xp
    );

    await streamelementsSenden(
      `🎉 @${username} persönliche Quest abgeschlossen! +${quest.xp} XP 🦊`
    );

    return;
  }

  persoenlicheQuestStatus.set(
    username,
    quest
  );
}


/* =====================================================
   POKÉMON
===================================================== */

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
      pokemon =>
        pokemon.toLowerCase() ===
        gesucht
    );

  if (festesPokemon) {
    return festesPokemon;
  }

  return (
    verfuegbarePokemon.find(
      pokemon =>
        pokemon.toLowerCase() ===
        gesucht
    ) || null
  );
}


/* =====================================================
   PROFILE
===================================================== */

async function spielerProfilHolen(
  username
) {
  try {
    const name =
      normalisieren(username);

    const rows =
      await supabase(
        `/rest/v1/fuchsprofile` +
        `?spieler=eq.${encodeURIComponent(
          name
        )}` +
        `&limit=1`
      );

    return rows?.[0] || null;
  } catch (error) {
    console.error(
      "❌ Profil:",
      error.message
    );

    return null;
  }
}

async function pvpProfil(
  username
) {
  return spielerProfilHolen(
    username
  );
}

async function pokemonHolen(
  username
) {
  const name =
    normalisieren(username);

  const festesPokemon =
    eigenePokemon[name];

  if (festesPokemon) {
    return festesPokemon;
  }

  const profil =
    await spielerProfilHolen(
      name
    );

  return (
    profil?.pokemon ||
    null
  );
}

async function pokemonSicherHolen(
  username
) {
  const pokemon =
    await pokemonHolen(
      username
    );

  return (
    pokemonNameNormalisieren(
      pokemon
    ) ||
    String(pokemon || "")
      .trim() ||
    null
  );
}

function rudelHolen(
  profil
) {
  return (
    profil?.rudel ||
    "🐺 Noch kein Rudel"
  );
}

async function profil(
  username
) {
  try {
    const p =
      await spielerProfilHolen(
        username
      );

    if (!p) {
      return (
        `@${username} 🦊 Dein Profil wurde noch nicht gefunden.`
      );
    }

    const pokemon =
      await pokemonHolen(
        username
      );

    return (
      `@${username} 🦊 Profil | XP: ${
        p.xp || 0
      } | Rudel: ${
        p.rudel ||
        "noch nicht gewählt"
      } | Pokémon: ${
        pokemon ||
        "noch nicht gewählt"
      } | PvP-Siege: ${
        p.pvp_siege || 0
      } | PvP-Niederlagen: ${
        p.pvp_niederlagen || 0
      }`
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


/* =====================================================
   POKÉMON WAHL
===================================================== */

async function pokemonWahl(
  username,
  pokemon
) {
  username =
    normalisieren(username);

  if (!pokemon) {
    const vergeben =
      new Set(
        Object.values(
          eigenePokemon
        ).map(
          p => p.toLowerCase()
        )
      );

    const freie =
      verfuegbarePokemon.filter(
        p =>
          !vergeben.has(
            p.toLowerCase()
          )
      );

    return (
      `@${username} 🐾 Wähle dein Pokémon mit !pokemon NAME | ⚡ Pikachu ist vergeben | 🔥 Glumanda ist vergeben | Frei: ${freie.join(", ")}`
    );
  }

  const gewaehltesPokemon =
    pokemonNameNormalisieren(
      pokemon
    );

  if (!gewaehltesPokemon) {
    return (
      `@${username} ❌ Dieses Pokémon gibt es nicht in der Auswahl. Schreibe !pokemon für die Liste.`
    );
  }

  const festVergebenVon =
    Object.entries(
      eigenePokemon
    ).find(
      ([, p]) =>
        p.toLowerCase() ===
        gewaehltesPokemon.toLowerCase()
    );

  if (
    festVergebenVon &&
    festVergebenVon[0] !== username
  ) {
    return (
      `@${username} ❌ ${gewaehltesPokemon} ist bereits vergeben.`
    );
  }

  try {
    const rows =
      await supabase(
        `/rest/v1/fuchsprofile` +
        `?pokemon=eq.${encodeURIComponent(
          gewaehltesPokemon
        )}` +
        `&select=spieler,pokemon`
      );

    const andererSpieler =
      rows?.find(
        row =>
          row.spieler &&
          normalisieren(
            row.spieler
          ) !== username
      );

    if (andererSpieler) {
      return (
        `@${username} ❌ ${gewaehltesPokemon} ist bereits von @${andererSpieler.spieler} vergeben.`
      );
    }
  } catch (error) {
    console.error(
      "❌ Pokémon-Belegung:",
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
          spieler:
            username,
          pokemon:
            gewaehltesPokemon,
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


/* =====================================================
   RUDEL
===================================================== */

const rudelMap = {
  feuer:
    "🔥 Feuerrudel",

  wasser:
    "🌊 Wasserrudel",

  wald:
    "🌲 Waldrudel",

  ice:
    "🧊 ICErudel",
};

async function rudelwahl(
  username,
  auswahl
) {
  username =
    normalisieren(username);

  if (!auswahl) {
    return (
      `@${username} 🐺 Wähle dein Rudel: Feuer | Wasser | Wald | ICE`
    );
  }

  const key =
    auswahl
      .trim()
      .toLowerCase();

  const rudel =
    rudelMap[key];

  if (!rudel) {
    return (
      `@${username} ❌ Dieses Rudel gibt es nicht.`
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
          spieler:
            username,
          rudel:
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


/* =====================================================
   PVP
===================================================== */

const offeneKaempfe =
  new Map();

let aktuellerPvpKampf =
  null;


/* =====================================================
   RUDEL-PVP START
===================================================== */

async function pvpStart(
  angreifer,
  verteidiger
) {
  angreifer =
    normalisieren(angreifer);

  verteidiger =
    normalisieren(verteidiger);

  if (
    !verteidiger ||
    verteidiger === angreifer
  ) {
    return (
      `@${angreifer} ❌ Du kannst dich nicht selbst herausfordern.`
    );
  }

  const a =
    await pvpProfil(
      angreifer
    );

  const v =
    await pvpProfil(
      verteidiger
    );

  if (!a || !v) {
    return (
      "❌ Ein Profil konnte nicht geladen werden."
    );
  }

  if (!a.rudel) {
    return (
      `❌ @${angreifer} muss zuerst ein Rudel wählen.`
    );
  }

  if (!v.rudel) {
    return (
      `❌ @${verteidiger} hat noch kein Rudel.`
    );
  }

  if (offeneKaempfe.size) {
    return (
      "⚔️ Es läuft bereits eine Kampf-Anfrage."
    );
  }

  offeneKaempfe.set(
    verteidiger,
    {
      angreifer:
        angreifer,

      verteidiger:
        verteidiger,

      typ:
        "rudel",

      erstellt:
        Date.now(),
    }
  );

  if (
    verteidiger ===
    "fuchsmissvegetalover2_0"
  ) {
    return kampfAnnehmen(
      verteidiger
    );
  }

  return (
    `⚔️ @${angreifer} fordert @${verteidiger} zum Rudel-Kampf heraus! @${verteidiger} kann mit !annehmen annehmen.`
  );
}


/* =====================================================
   POKÉMON-KAMPF START
===================================================== */

async function pokemonKampfStart(
  angreifer,
  verteidiger
) {
  angreifer =
    normalisieren(angreifer);

  verteidiger =
    normalisieren(verteidiger);

  if (
    !verteidiger ||
    verteidiger === angreifer
  ) {
    return (
      `@${angreifer} ❌ Du kannst dich nicht selbst herausfordern.`
    );
  }

  const a =
    await pvpProfil(
      angreifer
    );

  const v =
    await pvpProfil(
      verteidiger
    );

  if (!a || !v) {
    return (
      "❌ Ein Profil konnte nicht geladen werden."
    );
  }

  /*
     Pokémon direkt vor dem Kampf holen.
  */

  const pokemonA =
    await pokemonSicherHolen(
      angreifer
    );

  const pokemonV =
    await pokemonSicherHolen(
      verteidiger
    );

  if (!pokemonA) {
    return (
      `❌ @${angreifer} hat noch kein Pokémon.`
    );
  }

  if (!pokemonV) {
    return (
      `❌ @${verteidiger} hat noch kein Pokémon.`
    );
  }

  if (offeneKaempfe.size) {
    return (
      "⚔️ Es läuft bereits eine Kampf-Anfrage."
    );
  }

  /*
     WICHTIG:
     Spieler und Pokémon werden vollständig
     in der Kampf-Anfrage gespeichert.
  */

  const neuerKampf = {
    angreifer:
      angreifer,

    verteidiger:
      verteidiger,

    typ:
      "pokemon",

    angreiferPokemon:
      pokemonA,

    verteidigerPokemon:
      pokemonV,

    erstellt:
      Date.now(),
  };

  offeneKaempfe.set(
    verteidiger,
    neuerKampf
  );

  if (
    verteidiger ===
    "fuchsmissvegetalover2_0"
  ) {
    return kampfAnnehmen(
      verteidiger
    );
  }

  return (
    `🐾⚔️ @${angreifer} fordert @${verteidiger} zum Pokémon-Kampf heraus! @${verteidiger} kann mit !annehmen annehmen.`
  );
}


/* =====================================================
   KAMPF ANNEHMEN
===================================================== */

async function kampfAnnehmen(
  username
) {
  username =
    normalisieren(username);

  const kampf =
    offeneKaempfe.get(
      username
    );

  if (!kampf) {
    return (
      `@${username} ❌ Für dich gibt es keinen offenen Kampf.`
    );
  }

  if (
    Date.now() -
      kampf.erstellt >
    60000
  ) {
    offeneKaempfe.delete(
      username
    );

    return (
      `@${username} ⌛ Die Kampf-Anfrage ist abgelaufen.`
    );
  }

  /*
     Kampf-Anfrage entfernen.
  */

  offeneKaempfe.delete(
    username
  );

  /*
     Die Namen kommen DIREKT aus der
     Kampf-Anfrage.
  */

  const angreiferName =
    normalisieren(
      kampf.angreifer
    );

  const verteidigerName =
    normalisieren(
      kampf.verteidiger
    );

  const a =
    await pvpProfil(
      angreiferName
    );

  const v =
    await pvpProfil(
      verteidigerName
    );

  if (!a || !v) {
    return (
      "❌ Kampf konnte nicht gestartet werden."
    );
  }

  /*
     Pokémon ebenfalls direkt aus der
     Kampf-Anfrage verwenden.

     Falls sie fehlen, zusätzlich aus
     dem Profil holen.
  */

  let angreiferPokemon =
    kampf.angreiferPokemon ||
    null;

  let verteidigerPokemon =
    kampf.verteidigerPokemon ||
    null;

  if (
    kampf.typ ===
    "pokemon"
  ) {
    if (!angreiferPokemon) {
      angreiferPokemon =
        await pokemonSicherHolen(
          angreiferName
        );
    }

    if (!verteidigerPokemon) {
      verteidigerPokemon =
        await pokemonSicherHolen(
          verteidigerName
        );
    }

    if (!angreiferPokemon) {
      return (
        `❌ @${angreiferName} hat kein Pokémon.`
      );
    }

    if (!verteidigerPokemon) {
      return (
        `❌ @${verteidigerName} hat kein Pokémon.`
      );
    }
  }

  /*
     Zufälligen Gewinner bestimmen.
  */

  const gewinnerIstAngreifer =
    Math.random() < 0.5;

  const gewinnerName =
    gewinnerIstAngreifer
      ? angreiferName
      : verteidigerName;

  const verliererName =
    gewinnerIstAngreifer
      ? verteidigerName
      : angreiferName;

  /*
     Aktuellen Kampf speichern.
  */

  aktuellerPvpKampf = {
    angreifer:
      angreiferName,

    verteidiger:
      verteidigerName,

    typ:
      kampf.typ,

    angreiferPokemon:
      angreiferPokemon,

    verteidigerPokemon:
      verteidigerPokemon,

    angreiferRudel:
      a.rudel || "",

    verteidigerRudel:
      v.rudel || "",

    gewinner:
      gewinnerName,

    verlierer:
      verliererName,

    gestartet:
      Date.now(),
  };

  /*
     Gewinner bekommt 100 XP.
  */

  await xpHinzufuegen(
    gewinnerName,
    100
  );

  /*
     PvP Statistik aktualisieren.
  */

  try {
    await supabase(
      `/rest/v1/fuchsprofile?spieler=eq.${encodeURIComponent(
        gewinnerName
      )}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          pvp_siege:
            Number(
              a.spieler ===
                gewinnerName
                ? a.pvp_siege || 0
                : v.pvp_siege || 0
            ) + 1,
        }),
      }
    );

    await supabase(
      `/rest/v1/fuchsprofile?spieler=eq.${encodeURIComponent(
        verliererName
      )}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          pvp_niederlagen:
            Number(
              a.spieler ===
                verliererName
                ? a.pvp_niederlagen || 0
                : v.pvp_niederlagen || 0
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

  /*
     POKÉMON-KAMPF
  */

  if (
    kampf.typ ===
    "pokemon"
  ) {
    return (
      `⚡ POKÉMON-KAMPF! @${angreiferName} ${angreiferPokemon} ⚔️ @${verteidigerName} ${verteidigerPokemon} → 🏆 @${gewinnerName} gewinnt +100 XP!`
    );
  }

  /*
     NORMALES RUDEL-PvP
  */

  return (
    `⚔️ RUDEL-KAMPF! @${angreiferName} [${a.rudel || "kein Rudel"}] ⚔️ @${verteidigerName} [${v.rudel || "kein Rudel"}] → 🏆 @${gewinnerName} gewinnt +100 XP!`
  );
}


/* =====================================================
   BEFEHLE
===================================================== */

async function alleBefehle(
  username
) {
  await streamelementsSenden(
    `@${username} 🦊 Befehle: !profil | !rudelwahl Feuer/Wasser/Wald/ICE | !pokemon | !pokemon Name | !quest | !pvp @Name | !pokekampf @Name | !annehmen | !allebefehle`
  );
}


/* =====================================================
   CHAT
===================================================== */

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
    normalisieren(
      usernameRaw
    );

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

  /*
     !PVP
  */

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

    if (antwort) {
      await streamelementsSenden(
        antwort
      );
    }

    return;
  }

  /*
     !POKEMON
  */

  const pokemonMatch =
    text.match(
      /^!pokemon(?:\s+(.+))?$/i
    );

  if (pokemonMatch) {
    await streamelementsSenden(
      await pokemonWahl(
        username,
        pokemonMatch[1]
      )
    );

    return;
  }

  /*
     !POKEKAMPF
  */

  const pokemonKampfMatch =
    text.match(
      /^!pokekampf\s+@?([a-zA-Z0-9_]+)$/i
    );

  if (pokemonKampfMatch) {
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

    return;
  }

  /*
     !ANNEHMEN
  */

  if (
    /^!annehmen$/i.test(
      text.trim()
    )
  ) {
    const antwort =
      await kampfAnnehmen(
        username
      );

    if (antwort) {
      await streamelementsSenden(
        antwort
      );
    }

    return;
  }

  /*
     !PROFIL
  */

  if (
    /^!profil$/i.test(
      text.trim()
    )
  ) {
    await streamelementsSenden(
      await profil(
        username
      )
    );

    return;
  }

  /*
     !RUDELWAHL
  */

  const rudelMatch =
    text.match(
      /^!rudelwahl\s+(.+)$/i
    );

  if (rudelMatch) {
    await streamelementsSenden(
      await rudelwahl(
        username,
        rudelMatch[1]
      )
    );

    return;
  }

  /*
     !QUEST
  */

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

  /*
     !ALLEBEFEHLE
  */

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

  /*
     NORMALE CHAT-NACHRICHT
  */

  await questsPruefen(
    username,
    text
  );

  await persoenlicheQuestPruefen(
    username,
    text
  );
}


/* =====================================================
   HTTP / PVP OVERLAY
===================================================== */

const server =
  http.createServer(
    async (req, res) => {
      try {

        /*
           STARTSEITE
        */

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


        /*
           PVP-DATEN
        */

        if (req.url === "/pvp-data") {
          res.writeHead(
            200,
            {
              "Content-Type":
                "application/json; charset=utf-8",

              "Cache-Control":
                "no-store",
            }
          );

          if (!aktuellerPvpKampf) {
            res.end(
              JSON.stringify({
                kampf:
                  null,
              })
            );

            return;
          }

          /*
             Die Kampf-Daten werden direkt
             aus aktuellerPvpKampf verwendet.
          */

          res.end(
            JSON.stringify({
              kampf: {
                ...aktuellerPvpKampf,

                angreiferRudel:
                  aktuellerPvpKampf
                    .angreiferRudel ||
                  "",

                verteidigerRudel:
                  aktuellerPvpKampf
                    .verteidigerRudel ||
                  "",

                angreiferPokemon:
                  aktuellerPvpKampf
                    .angreiferPokemon ||
                  "",

                verteidigerPokemon:
                  aktuellerPvpKampf
                    .verteidigerPokemon ||
                  "",
              },
            })
          );

          return;
        }


        /*
           PVP OVERLAY
        */

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

<meta
  name="viewport"
  content="width=device-width,initial-scale=1.0"
>

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

    if(
      !data ||
      !data.kampf
    ){

      app.innerHTML="";

      return;
    }

    const k =
      data.kampf;

    const pokemon =
      k.typ === "pokemon";

    const title =
      pokemon
        ? "🐾 POKÉMON-KAMPF 🐾"
        : "⚔️ RUDEL-KAMPF ⚔️";

    const detail1 =
      pokemon
        ? (
            k.angreiferPokemon ||
            ""
          )
        : (
            k.angreiferRudel ||
            ""
          );

    const detail2 =
      pokemon
        ? (
            k.verteidigerPokemon ||
            ""
          )
        : (
            k.verteidigerRudel ||
            ""
          );

    app.innerHTML =
      \`
      <div class="card">

        <div class="title">
          \${title}
        </div>

        <div class="fighters">

          <div class="fighter">

            <div class="name">
              @\${k.angreifer}
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
              @\${k.verteidiger}
            </div>

            <div class="detail">
              \${detail2}
            </div>

          </div>

        </div>

        <div class="winner">
          🏆 @\${k.gewinner}
        </div>

      </div>
      \`;

  }

  catch(error){

    console.error(
      error
    );

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


        /*
           404
        */

        res.writeHead(
          404,
          {
            "Content-Type":
              "text/plain; charset=utf-8",
          }
        );

        res.end(
          "404"
        );

      } catch (error) {

        console.error(
          "❌ HTTP Fehler:",
          error.message
        );

        res.writeHead(
          500
        );

        res.end(
          "500"
        );
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
    ws.readyState ===
      WebSocket.OPEN
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
        "✅ StreamElements WebSocket verbunden."
      );

      try {

        ws.send(
          JSON.stringify({

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

          })
        );

        console.log(
          "📡 Chat-Topic wird abonniert."
        );

      } catch (error) {

        console.error(
          "❌ Subscribe:",
          error.message
        );

      }

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

        console.log(
          "📩 SE:",
          JSON.stringify(message)
        );

        if (
          message.type ===
            "response" &&
          message.error
        ) {

          console.error(
            "❌ StreamElements Abo-Fehler:",
            message.error
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
    "close",
    () => {

      console.log(
        "🔌 StreamElements WebSocket geschlossen."
      );

      if (
        wsReconnectTimer
      ) {
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
    error => {

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
      `🚀 Fuchs-XP-Bot gestartet auf Port ${PORT}`
    );

    console.log(
      `🌐 PvP-Overlay: /pvp`
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