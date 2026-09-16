import http from "http";
import WebSocket from "ws";

const SUPABASE_URL=process.env.SUPABASE_URL||"https://herznunvdqcmzeffblgo.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
const STREAMELEMENTS_JWT=process.env.STREAMELEMENTS_JWT;
let streamElementsChannel=process.env.STREAMELEMENTS_CHANNEL||null;

function normalisieren(username){return String(username||"").trim().toLowerCase();}
function zufall(min,max){return Math.floor(Math.random()*(max-min+1))+min;}
function warten(ms){return new Promise(resolve=>setTimeout(resolve,ms));}

function headers(extra={}){return{apikey:SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,"Content-Type":"application/json",...extra};}

async function supabase(path,options={}){
 const response=await fetch(`${SUPABASE_URL}${path}`,{...options,headers:headers(options.headers||{})});
 const text=await response.text();
 if(!response.ok)throw new Error(`Supabase ${response.status}: ${text}`);
 return text?JSON.parse(text):null;
}

async function rpc(name,body={}){return supabase(`/rest/v1/rpc/${name}`,{method:"POST",body:JSON.stringify(body)});}

async function xpHinzufuegen(username,xp){
 try{await rpc("fuchs_xp_hinzufuegen",{spieler_name:normalisieren(username),xp_menge:Number(xp)||0});}
 catch(error){console.error("❌ XP hinzufügen:",error.message);}
}

async function streamElementsChannelHolen(){
 if(!STREAMELEMENTS_JWT)return null;
 const response=await fetch("https://api.streamelements.com/kappa/v2/channels/me",{headers:{Authorization:`Bearer ${STREAMELEMENTS_JWT}`,Accept:"application/json"}});
 const text=await response.text();
 if(!response.ok)throw new Error(`StreamElements Channel-ID ${response.status}: ${text}`);
 const data=JSON.parse(text);
 streamElementsChannel=data?._id||streamElementsChannel;
 return streamElementsChannel;
}

async function streamelementsSenden(text){
 if(!text||!String(text).trim())return false;
 if(!STREAMELEMENTS_JWT){console.log("⚠️ StreamElements JWT fehlt.");return false;}
 for(let versuch=1;versuch<=3;versuch++){
  try{
   const channelId=await streamElementsChannelHolen();
   if(!channelId)return false;
   const response=await fetch(`https://api.streamelements.com/kappa/v2/bot/${encodeURIComponent(channelId)}/say`,{
    method:"POST",
    headers:{Authorization:`Bearer ${STREAMELEMENTS_JWT}`,"Content-Type":"application/json",Accept:"application/json"},
    body:JSON.stringify({message:String(text)})
   });
   const body=await response.text();
   console.log(`📤 StreamElements Versuch ${versuch}/3 ${response.status}: ${body}`);
   if(response.ok)return true;
   if(versuch<3)await warten(800);
  }catch(error){
   console.error(`❌ StreamElements Versuch ${versuch}/3:`,error.message);
   if(versuch<3)await warten(800);
  }
 }
 return false;
}

async function aktivitaetSpeichern(username){
 try{
  await supabase("/rest/v1/fuchs_aktivitaet?on_conflict=spieler",{
   method:"POST",
   headers:{Prefer:"resolution=merge-duplicates"},
   body:JSON.stringify({spieler:normalisieren(username),letzte_aktivitaet:new Date().toISOString()})
  });
 }catch(error){console.error("❌ Aktivität:",error.message);}
}

const normaleZiele={1:10,2:5,3:1,4:3,5:2};

async function questsAnlegen(username){
 try{await rpc("fuchs_quests_anlegen",{spieler_name:normalisieren(username)});}
 catch(error){console.error("❌ Quests anlegen:",error.message);}
}

async function questFortschrittHolen(username){
 const datum=new Date().toISOString().slice(0,10);
 try{
  return await supabase(`/rest/v1/quest_fortschritt?spieler=eq.${encodeURIComponent(normalisieren(username))}&datum=eq.${datum}&order=quest_nummer.asc`);
 }catch(error){console.error("❌ Quest-Fortschritt:",error.message);return[];}
}

async function questFortschrittPruefen(username,text){
 try{await rpc("quest_nachricht_verarbeiten",{spieler_name:normalisieren(username),nachricht:String(text||"")});}
 catch(error){console.error("❌ Quest-Verarbeitung:",error.message);}
}

async function questsPruefen(username,text){
 try{
  await questsAnlegen(username);
  const vorher=await questFortschrittHolen(username);
  await questFortschrittPruefen(username,text);
  const nachher=await questFortschrittHolen(username);
  const vorherMap=new Map(vorher.map(q=>[Number(q.quest_nummer),Number(q.fortschritt||0)]));
  for(const q of nachher){
   const nummer=Number(q.quest_nummer);
   const alt=vorherMap.get(nummer)||0;
   const neu=Number(q.fortschritt||0);
   if(normaleZiele[nummer]&&neu>=normaleZiele[nummer]&&alt<normaleZiele[nummer]){
    await streamelementsSenden(`@${username} ✅ Quest erfolgreich erledigt! +10 FuchsXP 🦊`);
    await xpHinzufuegen(username,10);
   }
  }
 }catch(error){console.error("❌ Normale Quests:",error.message);}
}

const persoenlicheQuestStatus=new Map();

const persoenlicheQuestVorlagen=[
 {text:"Schreibe 5 Nachrichten im Chat.",ziel:5,xp:50},
 {text:"Schreibe 10 Nachrichten im Chat.",ziel:10,xp:100},
 {text:"Schreibe 20 Nachrichten im Chat.",ziel:20,xp:200}
];

function persoenlicheQuestStatusHolen(username){
 username=normalisieren(username);
 let status=persoenlicheQuestStatus.get(username);
 if(!status||(!status.abgeschlossen&&Date.now()-status.gestartet>60000)){
  const vorlage=persoenlicheQuestVorlagen[zufall(0,persoenlicheQuestVorlagen.length-1)];
  status={text:vorlage.text,ziel:vorlage.ziel,xp:vorlage.xp,fortschritt:0,abgeschlossen:false,gestartet:Date.now()};
  persoenlicheQuestStatus.set(username,status);
 }
 return status;
}

async function persoenlicheQuestsAnlegen(username){persoenlicheQuestStatusHolen(username);}
async function persoenlicheQuestsHolen(username){return[persoenlicheQuestStatusHolen(username)];}

async function persoenlicheQuestAnzeigen(username){
 username=normalisieren(username);
 const quest=persoenlicheQuestStatusHolen(username);
 if(quest.abgeschlossen)return`🎯 @${username} deine persönliche Quest ist bereits abgeschlossen!`;
 return`🎯 @${username} persönliche Quest: ${quest.text} (${quest.fortschritt}/${quest.ziel}) – Belohnung: ${quest.xp} XP`;
}

async function persoenlicheQuestPruefen(username,text){
 username=normalisieren(username);
 if(!text)return;
 const quest=persoenlicheQuestStatusHolen(username);
 if(quest.abgeschlossen)return;
 quest.fortschritt++;
 if(quest.fortschritt>=quest.ziel){
  quest.fortschritt=quest.ziel;
  quest.abgeschlossen=true;
  persoenlicheQuestStatus.set(username,quest);
  await xpHinzufuegen(username,quest.xp);
  await streamelementsSenden(`🎉 @${username} persönliche Quest abgeschlossen! +${quest.xp} XP 🦊`);
  return;
 }
 persoenlicheQuestStatus.set(username,quest);
}

const eigenePokemon={
 fuchsmissvegetalover2_0:"Pikachu",
 vegetalover2_0:"Glumanda"
};

const verfuegbarePokemon=[
 "Schiggy","Bisasam","Evoli","Relaxo","Mauzi","Enton","Pummeluff","Vulpix","Fukano","Abra",
 "Knofensa","Ponita","Lapras","Dratini","Riolu","Lucario","Gengar","Absol","Raupy","Sterndu"
];

function pokemonNameNormalisieren(name){
 if(!name)return null;
 const gesucht=String(name).trim().toLowerCase();
 const festesPokemon=Object.values(eigenePokemon).find(pokemon=>pokemon.toLowerCase()===gesucht);
 if(festesPokemon)return festesPokemon;
 return verfuegbarePokemon.find(pokemon=>pokemon.toLowerCase()===gesucht)||null;
}

async function spielerProfilHolen(username){
 try{
  const name=normalisieren(username);
  const rows=await supabase(`/rest/v1/fuchsprofile?spieler=eq.${encodeURIComponent(name)}&limit=1`);
  return rows?.[0]||null;
 }catch(error){console.error("❌ Profil:",error.message);return null;}
}

async function pvpProfil(username){return spielerProfilHolen(username);}

async function pokemonHolen(username){
 const name=normalisieren(username);
 const festesPokemon=eigenePokemon[name];
 if(festesPokemon)return festesPokemon;
 const profil=await spielerProfilHolen(name);
 return profil?.pokemon||null;
}

async function pokemonSicherHolen(username){
 const pokemon=await pokemonHolen(username);
 return pokemonNameNormalisieren(pokemon)||String(pokemon||"").trim()||null;
}

function rudelHolen(profil){return profil?.rudel||"🐺 Noch kein Rudel";}

async function profil(username){try{const p=await spielerProfilHolen(username);
if(!p){return`@${username} 🦊 Dein Profil wurde noch nicht gefunden.`;}
return`🦊 @${username} | XP: ${p.xp||0} | Rudel: ${p.rudel||"noch nicht gewählt"} | Pokémon: ${p.pokemon||"noch nicht gewählt"} | PvP-Siege: ${p.pvp_siege||0} | PvP-Niederlagen: ${p.pvp_niederlagen||0}`;
}catch(error){console.error("❌ Profil anzeigen:",error.message);return`@${username} ❌ Profil konnte gerade nicht geladen werden.`;}}

const offeneKaempfe=new Map();

function kampfStarten(angreifer,verteidiger,typ){
 return{
  angreifer:normalisieren(angreifer),
  verteidiger:normalisieren(verteidiger),
  typ,
  erstellt:Date.now()
 };
}

async function pvpKampfAuswerten(kampf){
 const angreiferName=normalisieren(kampf.angreifer);
 const verteidigerName=normalisieren(kampf.verteidiger);
 const angreiferProfil=await pvpProfil(angreiferName);
 const verteidigerProfil=await pvpProfil(verteidigerName);

 if(!angreiferProfil||!verteidigerProfil)throw new Error("Spielerprofil fehlt.");

 let angreiferPokemon=null;
 let verteidigerPokemon=null;

 if(kampf.typ==="pokemon"){
  angreiferPokemon=await pokemonSicherHolen(angreiferName);
  verteidigerPokemon=await pokemonSicherHolen(verteidigerName);
  if(!angreiferPokemon)angreiferPokemon="Unbekannt";
  if(!verteidigerPokemon)verteidigerPokemon="Unbekannt";
 }

 const angreiferWurf=zufall(1,100);
 const verteidigerWurf=zufall(1,100);
 const gewinnerName=angreiferWurf>=verteidigerWurf?angreiferName:verteidigerName;
 const verliererName=gewinnerName===angreiferName?verteidigerName:angreiferName;

 try{
  await supabase(`/rest/v1/fuchsprofile?spieler=eq.${encodeURIComponent(gewinnerName)}`,{
   method:"PATCH",
   headers:{Prefer:"return=minimal"},
   body:JSON.stringify({xp:(Number((await spielerProfilHolen(gewinnerName))?.xp)||0)+100,pvp_siege:Number((await spielerProfilHolen(gewinnerName))?.pvp_siege)||0+1})
  });
 }catch(error){console.error("❌ PvP Gewinner:",error.message);}

 try{
  const verliererProfil=await spielerProfilHolen(verliererName);
  await supabase(`/rest/v1/fuchsprofile?spieler=eq.${encodeURIComponent(verliererName)}`,{
   method:"PATCH",
   headers:{Prefer:"return=minimal"},
   body:JSON.stringify({pvp_niederlagen:(Number(verliererProfil?.pvp_niederlagen)||0)+1})
  });
 }catch(error){console.error("❌ PvP Verlierer:",error.message);}

 if(kampf.typ==="pokemon"){
  return`⚡ POKÉMON-KAMPF! @${angreiferName} ${angreiferPokemon} ⚔️ @${verteidigerName} ${verteidigerPokemon} → 🏆 @${gewinnerName} gewinnt +100 XP!`;
 }

 return`⚔️ RUDEL-KAMPF! @${angreiferName} [${rudelHolen(angreiferProfil)}] ⚔️ @${verteidigerName} [${rudelHolen(verteidigerProfil)}] → 🏆 @${gewinnerName} gewinnt +100 XP!`;
}

async function kampfAnnehmen(ziel){
 ziel=normalisieren(ziel);
 const kampf=offeneKaempfe.get(ziel);
 if(!kampf)return null;
 offeneKaempfe.delete(ziel);
 return await pvpKampfAuswerten(kampf);
}

async function questAntwort(username){
 const name=normalisieren(username);
 const quest=persoenlicheQuestStatusHolen(name);
 return persoenlicheQuestAnzeigen(name);
}

async function chatVerarbeiten(message){
 try{
  const data=message?.data||message;
  const username=normalisieren(
   data?.username||
   data?.user?.username||
   data?.sender?.username||
   data?.sender?.displayName||
   ""
  );

  const text=String(
   data?.text||
   data?.message||
   data?.content||
   ""
  ).trim();

  if(!username||!text)return;

  console.log(`💬 ${username}: ${text}`);

  await aktivitaetSpeichern(username);
  await questsPruefen(username,text);
  await persoenlicheQuestPruefen(username,text);

  const teile=text.split(/\s+/);
  const befehl=(teile[0]||"").toLowerCase();

  if(befehl==="!xp"){
   const p=await spielerProfilHolen(username);
   await streamelementsSenden(
    `🦊 @${username} du hast ${p?.xp||0} XP!`
   );
   return;
  }

  if(befehl==="!profil"){
   const antwort=await profil(username);
   await streamelementsSenden(antwort);
   return;
  }

  if(befehl==="!quest"){
   try{
    const antwort=await persoenlicheQuestAnzeigen(username);
    if(antwort)await streamelementsSenden(antwort);
   }catch(error){
    console.error("❌ !quest:",error.message);
    await streamelementsSenden(
     `@${username} ❌ Die Quest konnte gerade nicht geladen werden.`
    );
   }
   return;
  }

  if(befehl==="!pokemon"){
   const pokemon=await pokemonSicherHolen(username);
   if(pokemon){
    await streamelementsSenden(
     `⚡ @${username} dein Pokémon ist ${pokemon}!`
    );
   }else{
    await streamelementsSenden(
     `@${username} ❌ Du hast noch kein Pokémon.`
    );
   }
   return;
  }

  if(befehl==="!pvp"||befehl==="!pokekampf"){
   try{
    const zielText=teile[1]||"";
    const ziel=normalisieren(
     zielText.replace(/^@/,"")
    );

    if(!ziel){
     await streamelementsSenden(
      `@${username} ❌ Benutze z.B. !${befehl==="!pvp"?"pvp":"pokekampf"} @Name`
     );
     return;
    }

    if(ziel===username){
     await streamelementsSenden(
      `@${username} ❌ Du kannst dich nicht selbst herausfordern.`
     );
     return;
    }

    const typ=befehl==="!pokekampf"?"pokemon":"rudel";

    offeneKaempfe.set(
     ziel,
     kampfStarten(username,ziel,typ)
    );

    const automatisch=
     ziel==="fuchsmissvegetalover2_0";

    if(automatisch){
     const angenommen=await kampfAnnehmen(ziel);

     await streamelementsSenden(
      typ==="pokemon"
       ?`@${ziel} 🤝 Pokémon-Kampf automatisch angenommen!`
       :`@${ziel} 🤝 Kampf automatisch angenommen!`
     );

     if(angenommen){
      await streamelementsSenden(angenommen);
     }
     return;
    }

    await streamelementsSenden(
     typ==="pokemon"
      ?`🐾⚔️ @${username} fordert @${ziel} zum Pokémon-Kampf heraus! @${ziel} kann mit !annehmen annehmen.`
      :`🐾⚔️ @${username} fordert @${ziel} zum Rudel-Kampf heraus! @${ziel} kann mit !annehmen annehmen.`
    );
   }catch(error){
    console.error("❌ PvP:",error.message);
    await streamelementsSenden(
     `@${username} ❌ Der Kampf konnte gerade nicht gestartet werden.`
    );
   }
   return;
  }

  if(befehl==="!annehmen"){
   const antwort=await kampfAnnehmen(username);
   if(antwort){
    await streamelementsSenden(antwort);
   }else{
    await streamelementsSenden(
     `@${username} ❌ Es liegt keine offene Kampf-Anfrage für dich vor.`
    );
   }
   return;
  }

  if(befehl==="!allebefehle"){
   await streamelementsSenden(
    `🦊 @${username} Befehle: !xp | !quest | !profil | !pokemon | !pvp @Name | !pokekampf @Name | !annehmen`
   );
   return;
  }

 }catch(error){
  console.error("❌ Chat Verarbeitung:",error.message);
 }
}

function htmlOverlay(){
 return`<!DOCTYPE html>
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
 background:transparent;
 color:white;
 font-family:Arial,sans-serif;
 overflow:hidden;
}
#kampf{
 width:100%;
 min-height:100%;
 display:flex;
 flex-direction:column;
 justify-content:center;
 align-items:center;
}
.card{
 width:90%;
 max-width:900px;
 padding:20px;
 border-radius:20px;
 background:rgba(0,0,0,.75);
 text-align:center;
}
.title{
 font-size:32px;
 font-weight:bold;
 margin-bottom:15px;
}
.fighter{
 font-size:24px;
 margin:10px;
}
.vs{
 font-size:30px;
 margin:10px;
}
.winner{
 font-size:26px;
 margin-top:15px;
}
</style>
</head>
<body>
<div id="kampf"></div>
<script>
async function laden(){
 try{
  const response=await fetch('/pvp-data?'+Date.now());
  if(!response.ok)return;
  const data=await response.json();
  const k=data.kampf;
  const box=document.getElementById('kampf');

  if(!k){
   box.innerHTML='';
   return;
  }

  const detail1=k.typ==='pokemon'
   ?(k.angreiferPokemon||'Pokémon')
   :(k.angreiferRudel||'Rudel');

  const detail2=k.typ==='pokemon'
   ?(k.verteidigerPokemon||'Pokémon')
   :(k.verteidigerRudel||'Rudel');

  box.innerHTML=
   '<div class="card">'+
   '<div class="title">⚔️ FUCHS-KAMPF ⚔️</div>'+
   '<div class="fighter">'+
   '@'+k.angreifer+
   '<br>'+
   detail1+
   '</div>'+
   '<div class="vs">⚔️</div>'+
   '<div class="fighter">'+
   '@'+k.verteidiger+
   '<br>'+
   detail2+
   '</div>'+
   '<div class="winner">🏆 @'+k.gewinner+'</div>'+
   '</div>';
 }catch(error){
  console.error(error);
 }
}
laden();
setInterval(laden,1000);
</script>
</body>
</html>`;
}

async function pvpData(){
 try{
  const rows=await supabase(
   "/rest/v1/pvp_kampf?order=created_at.desc&limit=1"
  );
  return rows?.[0]||null;
 }catch(error){
  return null;
 }
}

const server=http.createServer(
 async(req,res)=>{
  try{
   const url=new URL(
    req.url,
    `http://${req.headers.host}`
   );

   if(url.pathname==="/pvp"){
    res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});
    res.end(htmlOverlay());
    return;
   }

   if(url.pathname==="/pvp-data"){
    const kampf=await pvpData();
    res.writeHead(200,{
     "Content-Type":"application/json; charset=utf-8",
     "Cache-Control":"no-store"
    });
    res.end(JSON.stringify({kampf}));
    return;
   }

   if(url.pathname==="/"){
    res.writeHead(200,{"Content-Type":"text/plain; charset=utf-8"});
    res.end("🦊 Fuchs-XP-Bot läuft.");
    return;
   }

   res.writeHead(404,{"Content-Type":"text/plain; charset=utf-8"});
   res.end("Nicht gefunden");
  }catch(error){
   console.error("❌ Server:",error.message);
   res.writeHead(500,{"Content-Type":"text/plain; charset=utf-8"});
   res.end("Interner Serverfehler");
  }
 );
server.listen(PORT,()=>{
 console.log(`🦊 Fuchs-XP-Bot gestartet auf Port ${PORT}`);
 console.log("PvP-Overlay: /pvp");
 console.log("StreamElements Kanal:",streamElementsChannel||"wird geladen");
 streamElementsVerbinden();
});

let wsReconnectTimer=null;

async function streamElementsVerbinden(){
 if(!STREAMELEMENTS_JWT){
  console.log("⚠️ StreamElements JWT fehlt.");
  return;
 }

 try{
  const ws=new WebSocket("wss://astro.streamelements.com/");

  ws.on("open",async()=>{
   console.log("✅ StreamElements WebSocket verbunden.");

   try{
    const channelId=await streamElementsChannelHolen();

    if(!channelId){
     console.log("⚠️ StreamElements Channel-ID konnte nicht geladen werden.");
     return;
    }

    ws.send(JSON.stringify({
     type:"subscribe",
     nonce:`fuchs-${Date.now()}`,
     data:{
      topic:"channel.chat.message",
      token:STREAMELEMENTS_JWT,
      condition:{
       channelId:channelId
      }
     }
    }));

    console.log("📡 StreamElements Chat abonniert.");
   }catch(error){
    console.error("❌ StreamElements Subscribe:",error.message);
   }
  });

  ws.on("message",async raw=>{
   try{
    const message=JSON.parse(raw.toString());
    await chatVerarbeiten(message);
   }catch(error){
    console.error("❌ WebSocket Nachricht:",error.message);
   }
  });

  ws.on("close",()=>{
   console.log("⚠️ StreamElements WebSocket getrennt.");

   if(!wsReconnectTimer){
    wsReconnectTimer=setTimeout(()=>{
     wsReconnectTimer=null;
     streamElementsVerbinden();
    },5000);
   }
  });

  ws.on("error",error=>{
   console.error("❌ StreamElements WebSocket:",error.message);
  });

 }catch(error){
  console.error("❌ StreamElements Verbindung:",error.message);

  if(!wsReconnectTimer){
   wsReconnectTimer=setTimeout(()=>{
    wsReconnectTimer=null;
    streamElementsVerbinden();
   },5000);
  }
 }
}

setInterval(()=>{
 const jetzt=Date.now();

 for(const[ziel,kampf]of offeneKaempfe.entries()){
  if(jetzt-kampf.erstellt>60000){
   offeneKaempfe.delete(ziel);

   streamelementsSenden(
    `⌛ @${ziel} die Kampf-Anfrage ist abgelaufen.`
   ).catch(error=>{
    console.error("❌ Ablaufmeldung:",error.message);
   });
  }
 }
},5000);
