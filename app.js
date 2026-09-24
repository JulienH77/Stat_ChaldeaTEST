import initialState from './data/initial-state.json?v=101' with { type: 'json' };
import welfareData from './data/welfare-ids.json?v=101' with { type: 'json' };
import supportData from './data/support-lists.json?v=101' with { type: 'json' };
const CONFIG=window.CHALDEA_CONFIG||{};
let supportSnapshot=supportData||{players:{}};
const SUPABASE_KEY=CONFIG.supabasePublishableKey||CONFIG.supabaseAnonKey||CONFIG.supabaseKey||'';
const PLAYERS=['julien','yanis','attmann'];
const PLAYER_LABELS={julien:'Julien',yanis:'Yanis',attmann:'Attmann'};
const CLASS_ORDER=['Saber','Archer','Lancer','Rider','Caster','Assassin','Berserker','Ruler','Avenger','Alter Ego','Moon Cancer','Foreigner','Pretender','Shielder','Beast'];
const MASH_IDS=new Set([1]);
const MASH_NAMES=new Set(['mash kyrielight','mash']);
const NON_VISIBLE_CLASSES=new Set(['Extra']);
const NA_BLOCKED_IDS=new Set([83,149,152,151,168,240,333,411,412,436,443,460]);
const NA_BLOCKED_NAMES=new Set(['solomon']);
const isBlockedRecord=r=>{const ids=[Number(r?.id),Number(r?.collectionNo),Number(r?.atlasId)];if(ids.includes(417))return false;return ids.some(v=>NA_BLOCKED_IDS.has(v))||NA_BLOCKED_NAMES.has(norm(r?.name));};
const NA_FORCE_INCLUDE=[{id:417,name:'Ereshkigal',class:'Beast',rarity:'SSR',attribute:'Beast',cardType:'Buster',atlasId:3300200}];
const FUTURE_NAMES=new Set(['Phantasmoon','Louhi','Van Gogh (Miner)','Tutankhamun','Kazuradrop']);
const SUPPORT_GUID_FALLBACKS={julien:'381d9bb7-fc83-49d2-862d-3990b4c1379c',yanis:'',attmann:''};
const sanitizeRoster=roster=>{const seen=new Set();const out=[];for(const r of Array.isArray(roster)?roster:[]){const id=Number(r?.id);if(!id||seen.has(id)||isBlockedRecord(r)||FUTURE_NAMES.has(norm(r?.name)))continue;seen.add(id);out.push(r);}if(!seen.has(417))out.push({...NA_FORCE_INCLUDE[0]});return out;};
const IMG={
 Saber:'saber.webp',Archer:'archer.webp',Lancer:'lancer.webp',Rider:'rider.webp',Caster:'caster.webp',Assassin:'assassin.webp',Berserker:'berserker.webp',Ruler:'ruler.webp',Avenger:'avenger.webp','Alter Ego':'alter_ego.webp','Moon Cancer':'moon_cancer.webp',Foreigner:'foreigner.webp',Pretender:'pretender.webp',Shielder:'shielder.webp',Beast:'beast.webp',
 grail:'graal.webp', np:'np.webp', Q:'quick.webp', A:'arts.webp', B:'buster.webp'
};
const IMG_BASE='./IMG/';
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const state=structuredClone(initialState);
// Hide future Excel placeholders immediately; authoritative NA sync runs afterwards.
state.roster=sanitizeRoster(state.roster);
let currentPlayer='julien',currentView='overview',rosterMode='cards',sortDir='desc',compareFocusId=284,skillScope='gold',showMissing=true,xpTargetClass='',supportMode='normal',showNpOverlay=false;
let cloud=null,session=null,currentAuth=null,cloudEnabled=false,cloudAuthError='',atlasById=new Map(),atlasFull=new Map(),atlasVariantsByName=new Map(),variantDetailCache=new Map(),renderToken=0,showdownRenderedId=null,showdownRenderToken=0,supportPlayer='julien';
const selectedClasses=new Set(),selectedRarities=new Set(['5','4','welfare']),selectedNpTypes=new Set();
const NP_EFFECT_ORDER=['Support','ST','AOE'];
const NP_EFFECT_LABELS={Support:'Support',ST:'ST',AOE:'AOE'};
const NP_FILTERS=[['Q:Support','Support'],['Q:ST','ST'],['Q:AOE','AOE'],['A:Support','Support'],['A:ST','ST'],['A:AOE','AOE'],['B:Support','Support'],['B:ST','ST'],['B:AOE','AOE']];
const npTypeCache=new Map();
let npTypeIndexPromise=null;
const npOverlayTimers=new Map();
const supportLocal={julien:{friendId:supportSnapshot.players?.julien?.code||'939739133'},yanis:{friendId:supportSnapshot.players?.yanis?.code||''},attmann:{friendId:supportSnapshot.players?.attmann?.code||'921819502'}};
const XP_CLASSES=['Saber','Archer','Lancer','Rider','Caster','Assassin','Berserker','Autre'];
const XP_CARD_VALUE={5:81000,4:27000,3:9000};
const XP_CARD_CLASS_VALUE={5:97200,4:32400,3:10800};
const XP_TO_LEVEL=[0, 0, 100, 400, 1000, 2000, 3500, 5600, 8400, 12000, 16500, 22000, 28600, 36400, 45500, 56000, 68000, 81600, 96900, 114000, 133000, 154000, 177100, 202400, 230000, 260000, 292500, 327600, 365400, 406000, 449500, 496000, 545600, 598400, 654500, 714000, 777000, 843600, 913900, 988000, 1066000, 1148000, 1234100, 1324400, 1419000, 1518000, 1621500, 1729600, 1842400, 1960000, 2082500, 2210000, 2342600, 2480400, 2623500, 2772000, 2926000, 3085600, 3250900, 3422000, 3599000, 3782000, 3971100, 4166400, 4368000, 4576000, 4790500, 5011600, 5239400, 5474000, 5715500, 5964000, 6219600, 6482400, 6752500, 7030000, 7315000, 7607600, 7907900, 8216000, 8532000, 8856000, 9188100, 9528400, 9877000, 10234000, 10599500, 10973600, 11356400, 11748000, 12148500, 12567000, 13021900, 13532000, 14116500, 14795000, 15587500, 16514400, 17596500, 18855000, 20311500, 40623000, 60934500, 81246000, 101557500, 121869000, 142180500, 162492000, 182803500, 203115000, 223426500, 243738000, 264049500, 284361000, 304672500, 324984000, 345295500, 365607000, 385918500, 406230000, 426541500];
const XP_DEFAULT=()=>Object.fromEntries(XP_CLASSES.map(c=>[c,{5:0,4:0,3:0}]));
PLAYERS.forEach(p=>{state.players[p]??={displayName:PLAYER_LABELS[p],stats:{}};state.players[p].xp??=XP_DEFAULT()});
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const num=v=>{if(v===null||v===undefined||v==='')return null;const n=Number(v);return Number.isFinite(n)?n:null};
const fmtNum=v=>{const n=Number(v);return Number.isFinite(n)?n.toLocaleString('fr-FR'): '—'};
const fmtInputNumber=v=>{const n=Number(v);return Number.isFinite(n)?String(Math.trunc(n)):''};
const toast=m=>{const e=$('#toast');e.textContent=m;e.classList.add('show');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('show'),2000)};
const WELFARE_IDS=new Set((welfareData.ids||[]).map(Number));
const localKey='chaldea-v23-cloud-authoritative';
function rarityNum(r){return r==='SSR'?5:r==='SR'?4:r==='R'?3:r==='UC'?2:1}
function classKey(c){const s=String(c||'').replace(/\n/g,' ').trim();return s==='Moon'?'Moon Cancer':s}
function localAsset(name){return IMG_BASE+encodeURIComponent(name)}
function classImg(c){const k=classKey(c);const f=IMG[k]||IMG.Saber;return `<img class="class-icon-img" src="${localAsset(f)}" alt="${k}" loading="eager">`}
function cardImg(t){const f=IMG[t];return f?`<img class="command-icon-img" src="${localAsset(f)}" alt="${t}" loading="eager">`:''}
function grailImg(){return `<img class="grail-thumb" src="${localAsset(IMG.grail)}" alt="Graal" loading="eager">`}
function isWelfare(r){return WELFARE_IDS.has(Number(r.id))||r.isWelfare===true}
function isMash(r){return MASH_IDS.has(Number(r.id))||MASH_NAMES.has(norm(r.name))}
function isCounted(r){return !isMash(r)&&!r.nonCounted&&!NON_VISIBLE_CLASSES.has(classKey(r.class))}
function isVisible(r){return !isBlockedRecord(r)&&!NON_VISIBLE_CLASSES.has(classKey(r.class))&&!FUTURE_NAMES.has(norm(r.name))}
function stats(p,id){return state.players[p]?.stats?.[String(id)]||{level:null,np:null,bond:null,grail:null,fouHp:null,fouAtk:null,servantCoins:null,skills:[null,null,null],appendSkills:[null,null,null,null,null]}}
function defaultMaxLevel(r){const rr=rarityNum(r.rarity);return rr===5?90:rr===4?80:rr===3?70:rr===2?65:60}
function displayLevel(p,r,s){const n=Number(s.level);if(Number.isFinite(n)&&n>0)return n;return (p==='yanis'||p==='attmann')&&isOwned(p,r)?defaultMaxLevel(r):'—'}
function ensureStats(p,id){state.players[p]??={displayName:PLAYER_LABELS[p],stats:{}};state.players[p].stats??={};state.players[p].stats[String(id)]??={level:null,np:null,bond:null,grail:null,fouHp:null,fouAtk:null,servantCoins:null,skills:[null,null,null],appendSkills:[null,null,null,null,null]};return state.players[p].stats[String(id)]}
function isOwned(p,r){if(!isCounted(r))return true;const s=stats(p,r.id);return ['level','np','bond','grail','fouHp','fouAtk','servantCoins'].some(k=>s[k]!=null)||[...(s.skills||[]),...(s.appendSkills||[])].some(v=>v!=null)}
function validSkill(v){return Number.isFinite(v)&&v>=1&&v<=10}
function skillInScope(r){if(skillScope==='all')return true;return isWelfare(r)||rarityNum(r.rarity)>=4}
function values(p,idx=null){const a=[];for(const r of state.roster){if(!isCounted(r)||!skillInScope(r))continue;const st=stats(p,r.id);const vals=idx===null?(st.skills||[]):[st.skills?.[idx]];for(const v of vals)if(validSkill(v))a.push(Number(v))}return a}
function average(p,idx=null){const a=values(p,idx);return a.length?a.reduce((x,y)=>x+y,0)/a.length:0}
function skillDist(p){const d=Array(11).fill(0);values(p).forEach(v=>d[v]++);return d}
function countOwned(p,pred=()=>true){return state.roster.filter(r=>isVisible(r)&&pred(r)&&isOwned(p,r)).length}
function countLevel(p,level){return countOwned(p,r=>Number(stats(p,r.id).level)===level)}
function bond10(p){return countOwned(p,r=>Number(stats(p,r.id).bond)>=10)}
function fourFiveUniverse(){return state.roster.filter(r=>isCounted(r)&&(rarityNum(r.rarity)>=4))}
function fourFiveOwned(p){return fourFiveUniverse().filter(r=>isOwned(p,r)).length}
function collectionPct(p){const den=fourFiveUniverse().length;return den?fourFiveOwned(p)/den*100:0}
function goldUniverse(){return state.roster.filter(r=>isCounted(r)&&(rarityNum(r.rarity)>=4||isWelfare(r)));}
function goldOwned(p){return goldUniverse().filter(r=>isOwned(p,r)).length}
function np5Count(p){return goldUniverse().filter(r=>isOwned(p,r)&&Number(stats(p,r.id).np)>=5).length}
function np5Pct(p){const den=goldUniverse().length;return den?np5Count(p)/den*100:0}
function coinEstimate(r,s){if(rarityNum(r.rarity)<4||!isOwned(currentPlayer,r))return null;if(s.servantCoins!=null)return{value:s.servantCoins,estimated:false};let n=Math.max(1,Number(s.np)||1),base=rarityNum(r.rarity)===5?90:50;let copy=Math.max(0,n-1)*base;let bond=Math.max(0,Number(s.bond)||0);let bondCoins=[0,0,0,0,0,30,45,60,75,90,105][Math.min(10,bond)]||0;let app=(s.appendSkills||[]).filter(validSkill).length*20;return{value:copy+base+bondCoins+app,estimated:true}}
function clampNP(s){return s.np==null?'—':Math.min(5,Math.max(0,Number(s.np)))}
function npDisplay(v,small=true){const n=num(v);if(n==null)return '—';const c=Math.max(0,Math.min(5,n));return n>5?`NP ${c}${small?` <small>(${n})</small>`:` (${n})`}`:`NP ${c}`}
function npCardDisplay(v){const n=num(v);if(n==null)return '—';return `NP ${Math.min(5,Math.max(0,n))}`}
function xpInventory(p){state.players[p].xp??=XP_DEFAULT();for(const c of XP_CLASSES)state.players[p].xp[c]??={5:0,4:0,3:0};return state.players[p].xp}
function updateSync(text,error=false){$('#syncText').textContent=text;$('#syncDot').parentElement.classList.toggle('error',error)}
function isApiAuthError(error){return !!error&&(String(error.code)==='401'||String(error.status)==='401'||/jwt|apikey|api key|unauthoriz|invalid/i.test(String(error.message||'')))}
function currentCanEdit(){return !!currentAuth?.canEdit&&currentAuth.playerKey===currentPlayer}
function renderMasterSwitch(){
 $('#masterSwitch').innerHTML=PLAYERS.map(p=>`<button class="master-tab ${p===currentPlayer?'active':''}" data-player="${p}">${state.players[p]?.displayName||PLAYER_LABELS[p]}</button>`).join('');
 $$('.master-tab').forEach(b=>b.onclick=()=>{currentPlayer=b.dataset.player;supportPlayer=currentPlayer;renderAll()});
 $('#heroMaster').textContent=state.players[currentPlayer]?.displayName||PLAYER_LABELS[currentPlayer];
 $('#accountText').textContent=session?(currentAuth?.canEdit?`Connecté · ${PLAYER_LABELS[currentAuth.playerKey]}`:'Connecté · lecteur'):'Connexion';
}
function categoryTotals(){
  const visible=state.roster.filter(isCounted);
  return {
    five: visible.filter(r=>rarityNum(r.rarity)===5&&!isWelfare(r)).length,
    four: visible.filter(r=>rarityNum(r.rarity)===4&&!isWelfare(r)).length,
    welfare: visible.filter(r=>isWelfare(r)).length
  };
}
function renderOverview(){
 const p=currentPlayer, ownedAll=countOwned(p), ownedGold=goldOwned(p), owned=skillScope==='gold'?ownedGold:ownedAll;
 const five=countOwned(p,r=>rarityNum(r.rarity)===5&&!isWelfare(r)),four=countOwned(p,r=>rarityNum(r.rarity)===4&&!isWelfare(r)),wf=countOwned(p,r=>isWelfare(r));
 $('#introOwned').textContent=owned;
 $('#introOwned').title=skillScope==='gold'?'Servants Gold possédés':'Servants possédés';
 $('#rarityDisplay').innerHTML=`<div class="rarity-card"><span class="label">5 STAR</span><span class="stars">★★★★★</span><span class="value">${five}</span></div><div class="rarity-card"><span class="label">4 STAR</span><span class="stars">★★★★</span><span class="value">${four}</span></div><div class="rarity-card welfare"><span class="label">WELFARE</span><span class="stars">FREE</span><span class="value">${wf}</span></div>`;
 $$('[data-skill-scope]').forEach(b=>b.classList.toggle('active',b.dataset.skillScope===skillScope));
 const dist=skillDist(p),mx=Math.max(...dist.slice(1),1);$('#skillsAverage').textContent=average(p).toFixed(1);$('#skillBars').innerHTML=Array.from({length:10},(_,i)=>10-i).map(l=>`<div class="skill-row"><span class="skill-level">${l}</span><div class="skill-track"><div class="skill-fill" style="width:${dist[l]/mx*100}%"></div></div><b>${dist[l]}</b></div>`).join('');
 const scopeLabel=skillScope==='gold'?'GOLD':'ALL';
 const markers=[['MOYENNE SKILL 1',average(p,0).toFixed(1),scopeLabel],['MOYENNE SKILL 2',average(p,1).toFixed(1),scopeLabel],['MOYENNE SKILL 3',average(p,2).toFixed(1),scopeLabel],['BOND 10+',bond10(p),''],['NIVEAU 120',countLevel(p,120),''],['% NP 5',np5Pct(p).toFixed(1)+'%','']];
 $('#detailStats').innerHTML=markers.map(([l,v,c])=>`<div class="marker"><small>${l}</small><strong>${v}</strong>${c?`<span class="scope-caption">${c}</span>`:''}</div>`).join('');
 const pct=collectionPct(p),pctStr=pct.toFixed(1).replace('.0','');$('#collectionPct').textContent=pctStr+'%';$('#collectionRing').style.background=`conic-gradient(#5f89bc 0 ${pct}%,#edf1f5 ${pct}% 100%)`;
 const totals=categoryTotals(),bars=[['5★',five,totals.five],['4★',four,totals.four],['Welfare',wf,totals.welfare]];$('#miniBars').innerHTML=bars.map(([l,v,t])=>{const pct=t?Math.min(100,v/t*100):0;return `<div class="mini-bar"><span>${l}</span><div class="mini-track"><div class="mini-fill" style="width:${pct}%"></div></div><b>${v} / ${t}</b></div>`}).join('');
}
function fillFilters(){
 const classes=[...new Set(state.roster.filter(isVisible).map(r=>classKey(r.class)).filter(Boolean))].sort((a,b)=>CLASS_ORDER.indexOf(a)-CLASS_ORDER.indexOf(b));
 $('#classPop').innerHTML=classes.map(c=>`<label class="check-item"><input type="checkbox" data-class="${c}" ${selectedClasses.has(c)?'checked':''}>${classImg(c)}<span>${c}</span></label>`).join('');
 const rs=[['5','5★'],['4','4★'],['welfare','Welfare'],['3','3★'],['2','2★'],['1','1★']];$('#rarityPop').innerHTML=rs.map(([v,l])=>`<label class="check-item"><input type="checkbox" data-rarity="${v}" ${selectedRarities.has(v)?'checked':''}><span>${l}</span></label>`).join('');
 $('#npPop').innerHTML=NP_FILTERS.map(([v,l])=>{const [c,t]=v.split(':');return `<label class="check-item np-filter-item"><input type="checkbox" data-nptype="${v}" ${selectedNpTypes.has(v)?'checked':''}><span class="np-filter-swatch">${cardImg(c)}</span><span>${l}</span></label>`}).join('');
 $$('#classPop input').forEach(i=>i.onchange=()=>{i.checked?selectedClasses.add(i.dataset.class):selectedClasses.delete(i.dataset.class);updateFilterLabels();renderRoster()});
 $$('#rarityPop input').forEach(i=>i.onchange=()=>{i.checked?selectedRarities.add(i.dataset.rarity):selectedRarities.delete(i.dataset.rarity);updateFilterLabels();renderRoster()});
 $$('#npPop input').forEach(i=>i.onchange=async()=>{i.checked?selectedNpTypes.add(i.dataset.nptype):selectedNpTypes.delete(i.dataset.nptype);if(selectedNpTypes.size)await ensureNpTypeIndex();updateFilterLabels();renderRoster()});
 updateFilterLabels();
}
function updateFilterLabels(){$('#classFilterCount').textContent=selectedClasses.size?`(${selectedClasses.size})`:'';$('#rarityFilterCount').textContent=selectedRarities.size?`(${selectedRarities.size})`:'';$('#npFilterCount').textContent=selectedNpTypes.size?`(${selectedNpTypes.size})`:'';const b=$('#hideMissing');if(b){b.classList.toggle('active',showMissing);b.textContent='Non possédé';b.setAttribute('aria-pressed',showMissing?'true':'false');b.title=showMissing?'Non possédé : affichés':'Non possédé : masqués'}const n=$('#toggleNpOverlay');if(n){n.classList.toggle('active',showNpOverlay);n.textContent='NP card'}}
function atlasCacheValue(r,kind){const d=atlasById.get(Number(r.atlasId||r.id));if(d){const s=stats(currentPlayer,r.id);if(s.level==null)return 0;const cs=currentStats(d,r,s);const v=kind==='atk'?cs.atk:cs.hp;if(Number.isFinite(Number(v)))return Number(v)}return 0}
function sortRows(rows){const mode=$('#sortFilter').value,sg=sortDir==='asc'?1:-1;rows.sort((a,b)=>{let x,y;if(mode==='bond'){x=Number(a.s.bond)||-1;y=Number(b.s.bond)||-1}else if(mode==='np'){x=Number(a.s.np)||-1;y=Number(b.s.np)||-1}else if(mode==='level'){x=Number.isFinite(Number(a.s.level))?Number(a.s.level):defaultMaxLevel(a.r);y=Number.isFinite(Number(b.s.level))?Number(b.s.level):defaultMaxLevel(b.r)}else if(mode==='atk'||mode==='hp'){x=atlasCacheValue(a.r,mode)??-1;y=atlasCacheValue(b.r,mode)??-1}else{x=Number(a.r.releaseNo??a.r.id);y=Number(b.r.releaseNo??b.r.id)}return x===y?String(a.r.name).localeCompare(String(b.r.name))*sg:(x-y)*sg})}
function focusValue(r,s){const mode=$('#sortFilter').value;if(mode==='bond')return `<div class="sort-focus">Bond ${s.bond??'—'}</div>`;if(mode==='np'){const n=num(s.np);return `<div class="sort-focus">NP ${n??'—'}</div>`;}if(mode==='level')return `<div class="sort-focus">Lv ${displayLevel(currentPlayer,r,s)}</div>`;if(mode==='atk')return `<div class="sort-focus">ATK ${fmtNum(atlasCacheValue(r,'atk'))}</div>`;if(mode==='hp')return `<div class="sort-focus">HP ${fmtNum(atlasCacheValue(r,'hp'))}</div>`;return''}
function renderRoster(){
 const token=++renderToken,q=norm($('#searchInput').value);let rows=state.roster.filter(isVisible).map(r=>({r,s:stats(currentPlayer,r.id)})).filter(o=>{const c=classKey(o.r.class),rr=isWelfare(o.r)?'welfare':String(rarityNum(o.r.rarity));return(showMissing||isOwned(currentPlayer,o.r))&&(!q||norm(o.r.name).includes(q))&&(!selectedClasses.size||selectedClasses.has(c))&&(!selectedRarities.size||selectedRarities.has(rr))&&matchesNpFilters(o.r)});
 sortRows(rows);$('#rosterCount').textContent=rows.length;const totalVisible=state.roster.filter(isVisible).length,ownedTotal=countOwned(currentPlayer);$('#rosterSummary').textContent=showMissing?`${ownedTotal} possédés · ${Math.max(0,totalVisible-ownedTotal)} manquants`:`${ownedTotal} possédés affichés`;
 $('#rosterCards').innerHTML=rows.map(({r,s})=>{const own=isOwned(currentPlayer,r);return `<article class="servant-card ${own?'owned':'missing'}" data-servant-id="${r.id}">${own?'':'<span class="missing-ribbon">NON POSSÉDÉ</span>'}<div class="card-art" data-servant-id="${r.id}"><div class="loader">ATLAS</div></div><div class="card-content"><div class="card-topline"><span class="rarity-short">${rarityNum(r.rarity)}★${isWelfare(r)?' · W':''}</span>${classImg(r.class)}</div><div class="card-name">${r.name}</div><div class="card-line"><div class="level-wrap"><span class="level-major">Lv ${displayLevel(currentPlayer,r,s)}</span>${Number(s.grail)>0?`<span class="grail-count">${grailImg()}<b>${Number(s.grail)}</b></span>`:''}</div><span class="np-chip"><span class="np-mini-icon">${npIcon()}</span>${npCardDisplay(s.np)}</span></div>${$('#sortFilter').value==='release'?`<div class="release-skill-row">${[0,1,2].map(i=>`<span><b>${s.skills?.[i]??'—'}</b></span>`).join('')}</div>`:''}${focusValue(r,s)}</div></article>`}).join('');
 loadCardImages(rows,token);
 $$('.servant-card').forEach(el=>el.onclick=()=>openServant(Number(el.dataset.servantId)));
}
async function loadCardImages(rows,token){
  clearNpOverlayTimers();
  let i=0;
  const hadMissing=rows.some(({r})=>!atlasById.has(Number(r.atlasId||r.id)));
  const workers=Array.from({length:6},async()=>{
    while(i<rows.length){
      const row=rows[i++];
      if(token!==renderToken)return;
      const holder=$(`.card-art[data-servant-id="${row.r.id}"]`);
      if(!holder)continue;
      const d=await atlasDetail(row.r);
      const url=imageList(d)[0]||guessImage(row.r.atlasId);
      if(showNpOverlay){
        const profiles=await npProfilesForServant(row.r,d);
        const cards=npCardsFromProfiles(profiles);
        if(token===renderToken)setNpOverlayCards(holder,cards.length?cards:(npCardCode(row.r,d)?[npCardCode(row.r,d)]:[]));
      }
      if(url){
        const img=new Image();
        img.decoding='async';
        img.onload=()=>{
          if(token!==renderToken)return;
          const overlay=holder.querySelector('.np-type-overlay');
          holder.innerHTML='';
          holder.appendChild(img);
          if(overlay)holder.appendChild(overlay);
          const chip=holder.closest('.servant-card')?.querySelector('.np-mini-icon');
          const ni=npIcon();
          if(chip&&ni)chip.innerHTML=ni;
        };
        img.onerror=()=>holder.innerHTML='<div class="image-fallback">ART<br><small>indisponible</small></div>';
        img.src=url;
      }else holder.innerHTML='<div class="image-fallback">ART<br><small>indisponible</small></div>';
    }
  });
  await Promise.all(workers);
  const mode=$('#sortFilter')?.value;
  if(hadMissing&&(mode==='atk'||mode==='hp')&&token===renderToken)renderRoster();
}
function guessImage(atlasId){if(!atlasId)return'';const id=String(atlasId);return `https://static.atlasacademy.io/NA/CharaGraph/${id}/${id}a@1.png`}
async function fetchAtlasList(){
  try{
    const urls=[
      'https://api.atlasacademy.io/export/NA/basic_servant.json?v=32',
      'https://api.atlasacademy.io/export/NA/basic_servant.json'
    ];
    for(const url of urls){
      try{
        const r=await fetch(url,{cache:'no-store'});
        if(!r.ok)continue;
        const raw=await r.json();
        const candidates=[raw,raw?.Entries,raw?.entries,raw?.data];
        for(const candidate of candidates){
          const arr=Array.isArray(candidate)?candidate:(candidate&&typeof candidate==='object'?Object.values(candidate):[]);
          const useful=arr.filter(x=>x&&typeof x==='object'&&Number(x.id));
          if(useful.length)return useful;
        }
      }catch(e){/* try next endpoint */}
    }
  }catch(e){console.warn('Atlas NA static export indisponible',e)}
  return [];
}


async function syncRosterNA(){
  const arr=await fetchAtlasList();
  if(!arr.length){
    state.roster=sanitizeRoster(state.roster);
    PLAYERS.forEach(p=>state.roster.forEach(r=>ensureStats(p,r.id)));
    $('#atlasStatus').textContent=`ATLAS / NA · ${state.roster.filter(isVisible).length} Servants`;
    fillFilters();renderAll();
    return;
  }
  const keep=[];
  const pushUnique=r=>{
    const id=Number(r?.id);
    if(!id||isBlockedRecord(r)||FUTURE_NAMES.has(norm(r?.name))||keep.some(x=>Number(x.id)===id))return;
    keep.push(r);
  };
  const primaryNames=new Set(arr.filter(a=>Number(a?.collectionNo)>0).map(a=>norm(a?.name)).filter(Boolean));
  atlasVariantsByName.clear();
  for(const a of arr){
    const id=Number(a?.id),collectionNo=Number(a?.collectionNo),name=String(a?.name||'');
    if(!id||isBlockedRecord(a)||FUTURE_NAMES.has(norm(name)))continue;
    if(collectionNo===0){
      const key=norm(name);
      if(key&&primaryNames.has(key)){
        const list=atlasVariantsByName.get(key)||[];
        if(!list.some(v=>Number(v.id)===id))list.push({id,name,collectionNo:0});
        atlasVariantsByName.set(key,list);
      }
      continue;
    }
    const cls=normalizeClass(a.className);
    if(cls==='Extra')continue;
    pushUnique({id:collectionNo,name,class:cls,rarity:atlasRarity(a),attribute:a.attribute||'',cardType:a.cardType||'',atlasId:a.id,nonCounted:isMash(a)});
  }
  const existing=state.roster.find(r=>Number(r.id)===417)||NA_FORCE_INCLUDE[0];
  const e=arr.find(x=>Number(x?.collectionNo)===417);
  if(e){
    keep.push({id:417,name:e.name||existing.name,class:'Beast',rarity:'SSR',attribute:e.attribute||'Beast',cardType:e.cardType||existing.cardType,atlasId:e.id||3300200,nonCounted:false});
  }else{
    keep.push({...existing,...NA_FORCE_INCLUDE[0]});
  }
  const cleaned=sanitizeRoster(keep).filter(r=>Number(r.id)!==83&&Number(r.id)!==152&&norm(r.name)!=='solomon');
  if(!cleaned.some(r=>Number(r.id)===417))cleaned.push({...NA_FORCE_INCLUDE[0]});
  state.roster=cleaned.sort((a,b)=>Number(a.id)-Number(b.id));
  PLAYERS.forEach(p=>state.roster.forEach(r=>ensureStats(p,r.id)));
  fillFilters();renderAll();
  $('#atlasStatus').textContent=`ATLAS / NA · ${state.roster.filter(isVisible).length} Servants`;
}


function normalizeClass(c){const s=String(c||'').toLowerCase().replace(/[^a-z]/g,'');const m={saber:'Saber',archer:'Archer',lancer:'Lancer',rider:'Rider',caster:'Caster',assassin:'Assassin',berserker:'Berserker',ruler:'Ruler',avenger:'Avenger',alterego:'Alter Ego',mooncancer:'Moon Cancer',foreigner:'Foreigner',pretender:'Pretender',shielder:'Shielder',beast:'Beast'};return m[s]||'Extra'}
function atlasRarity(x){return Number(x.rarity)>=5?'SSR':Number(x.rarity)===4?'SR':Number(x.rarity)===3?'R':Number(x.rarity)===2?'UC':'C'}
async function atlasDetail(r){const key=Number(r.atlasId||r.id);if(!key)return null;if(atlasFull.has(key))return atlasFull.get(key);const p=(async()=>{try{const res=await fetch(`https://api.atlasacademy.io/nice/NA/servant/${key}`,{cache:'force-cache'});if(!res.ok)throw Error();const d=await res.json();atlasById.set(Number(key),d);if(d?.collectionNo!=null)atlasById.set(Number(d.collectionNo),d);return d}catch{return null}})();atlasFull.set(key,p);return p}
function imageList(d){
  if(!d?.extraAssets) return [];
  const obj=d.extraAssets?.charaGraph?.ascension || {};
  return Object.entries(obj).sort(([a],[b])=>Number(a)-Number(b)).map(([,v])=>v)
    .filter(v=>typeof v==='string'&&/^https?:\/\//.test(v)).slice(0,4);
}
function commandCards(d,r){
  const arr=Array.isArray(d?.cards)?d.cards:[];
  const code=v=>{
    const raw=String(v??'').trim().toUpperCase();
    if(raw==='1'||raw==='A'||raw==='ARTS')return'A';
    if(raw==='2'||raw==='B'||raw==='BUSTER')return'B';
    if(raw==='3'||raw==='Q'||raw==='QUICK')return'Q';
    return null;
  };
  const deck=arr.map(code).filter(Boolean).slice(0,5);
  if(deck.length!==5)return [];
  const order={Q:0,A:1,B:2};
  return deck.sort((a,b)=>order[a]-order[b]);
}
function npIcon(){return `<img class="np-card-icon" src="${localAsset(IMG.np)}" alt="NP" loading="eager">`}
function npCardCodeFromValue(v){const raw=String(v??'').trim().toUpperCase();if(raw==='1'||raw==='A'||raw==='ARTS')return'A';if(raw==='2'||raw==='B'||raw==='BUSTER')return'B';if(raw==='3'||raw==='Q'||raw==='QUICK')return'Q';return raw.includes('ARTS')?'A':raw.includes('BUSTER')?'B':raw.includes('QUICK')?'Q':''}
function npCardCode(r,d=null){return npCardCodeFromValue(r?.cardType)||npCardCodeFromValue(d?.cardType)||npCardCodeFromValue(d?.noblePhantasms?.[0]?.card)||''}
function collectEffectFlagTokens(value,out=[],insideFlags=false){if(value==null)return out;if(Array.isArray(value)){for(const v of value)collectEffectFlagTokens(v,out,insideFlags);return out;}if(typeof value==='string'){if(insideFlags)out.push(value);return out;}if(typeof value==='object'){for(const [k,v] of Object.entries(value)){if(k==='effectFlags'){collectEffectFlagTokens(v,out,true);continue;}if(insideFlags){if(v===true)out.push(k);else if(typeof v==='string')out.push(k,v);}if(v&&typeof v==='object')collectEffectFlagTokens(v,out,insideFlags);}}return out}
function npEffectTypesFromDetail(d){const tokens=collectEffectFlagTokens(d);const types=new Set();for(const token of tokens){const x=String(token).replace(/[^a-zA-Z]/g,'').toLowerCase();if(x.includes('support'))types.add('Support');if(x.includes('attackenemyoneorall')){types.add('ST');types.add('AOE')}else if(x.includes('attackenemyall'))types.add('AOE');else if(x.includes('attackenemyone'))types.add('ST')}return NP_EFFECT_ORDER.filter(t=>types.has(t))}
function npEntriesFromDetail(d){const raw=d?.noblePhantasms??d?.np??d?.noblePhantasm??[];if(Array.isArray(raw))return raw;if(raw&&typeof raw==='object')return Object.values(raw);return []}
function npProfilesFromDetails(details,r){
 const profiles=[];
 for(const d of details){
  if(!d)continue;
  for(const np of npEntriesFromDetail(d)){
   if(!np||typeof np!=='object')continue;
   const card=npCardCodeFromValue(np.card)||npCardCodeFromValue(np.cardType)||npCardCodeFromValue(np.commandType)||npCardCodeFromValue(d?.cardType)||'';
   const effects=npEffectTypesFromDetail(np);
   if(card&&effects.length)profiles.push({card,types:effects});
   else if(effects.length)profiles.push({card:'',types:effects});
  }
 }
 if(!profiles.length){
  const card=npCardCode(r,details[0]);
  const effects=npEffectTypesFromDetail(details[0]||{});
  if(card&&effects.length)profiles.push({card,types:effects});
  else if(card)profiles.push({card,types:[]});
  else if(effects.length)profiles.push({card:'',types:effects});
 }
 const seen=new Set();
 return profiles.filter(p=>{const key=`${p.card}:${p.types.join(',')}`;if(seen.has(key))return false;seen.add(key);return true});
}
async function fetchVariantDetail(id){const key=Number(id);if(!key)return null;if(variantDetailCache.has(key))return variantDetailCache.get(key);const p=(async()=>{try{const res=await fetch(`https://api.atlasacademy.io/nice/NA/servant/${key}`,{cache:'force-cache'});if(!res.ok)throw Error();return await res.json()}catch{return null}})();variantDetailCache.set(key,p);return p}
function treeContainsId(value,wanted){
  if(value==null)return false;
  if(typeof value==='number')return wanted.has(Number(value));
  if(typeof value==='string'){const n=Number(value);return Number.isFinite(n)&&wanted.has(n)}
  if(Array.isArray(value))return value.some(v=>treeContainsId(v,wanted));
  if(typeof value==='object')return Object.values(value).some(v=>treeContainsId(v,wanted));
  return false;
}
function variantIsLinkedToPrimary(primaryDetail,primary,variantId,variantDetail){
  const primaryId=Number(primary?.atlasId||primary?.id);
  const collectionNo=Number(primary?.id);
  const targetsPrimary=new Set([primaryId,collectionNo].filter(Number.isFinite));
  const targetVariant=new Set([Number(variantId)].filter(Number.isFinite));
  // Atlas exposes hidden/form relationships through svtChange. Prefer these explicit links.
  if(treeContainsId(primaryDetail?.svtChange,targetVariant))return true;
  if(treeContainsId(variantDetail?.svtChange,targetsPrimary))return true;
  return false;
}
async function discoverNameVariants(r,primaryDetail){
 const key=norm(r?.name);
 if(!key)return [];
 const cacheKey=`${Number(r?.id)}:${Number(r?.atlasId||0)}`;
 if(atlasVariantsByName.has(cacheKey))return atlasVariantsByName.get(cacheKey)||[];
 const known=[];
 try{
   const url=`https://api.atlasacademy.io/nice/NA/servant/search?name=${encodeURIComponent(r.name)}&lang=en&excludeCollectionNo=999999999`;
   const res=await fetch(url,{cache:'force-cache'});
   if(res.ok){
     const raw=await res.json();
     const arr=Array.isArray(raw)?raw:(raw&&typeof raw==='object'?Object.values(raw):[]);
     const sameName=arr.filter(x=>norm(x?.name)===key&&Number(x?.id));
     const primaryCount=sameName.filter(x=>Number(x?.collectionNo)>0).length;
     for(const x of sameName){
       const id=Number(x?.id),cn=Number(x?.collectionNo);
       // Only collectionNo=0 can be an in-form/hidden variant. Do not merge another playable
       // Servant with the same display name (e.g. Gilgamesh Archer/Caster or BB 4*/5*).
       if(cn!==0||id===Number(r?.atlasId))continue;
       const vd=await fetchVariantDetail(id);
       // If the name uniquely identifies one playable record, a collectionNo=0 record is
       // its hidden/form variant. When several playable records share the name, require
       // Atlas's explicit svtChange relationship to avoid cross-version NP contamination.
       const explicitlyLinked=variantIsLinkedToPrimary(primaryDetail,r,id,vd);
       if(!explicitlyLinked && primaryCount!==1)continue;
       if(!known.some(v=>Number(v.id)===id))known.push({id,name:x.name,collectionNo:0});
     }
   }
 }catch(e){}
 // Keep only variants from the lightweight export cache that are explicitly linked as well.
 for(const v of (atlasVariantsByName.get(key)||[])){
   if(Number(v?.collectionNo)!==0)continue;
   if(known.some(x=>Number(x.id)===Number(v.id)))continue;
   const vd=await fetchVariantDetail(v.id);
   if(variantIsLinkedToPrimary(primaryDetail,r,Number(v.id),vd))known.push(v);
 }
 atlasVariantsByName.set(cacheKey,known);
 return known;
}
async function npProfilesForServant(r,d){
 const details=[d];
 const variants=await discoverNameVariants(r,d);
 for(const v of variants){if(Number(v.id)===Number(r?.atlasId))continue;const vd=await fetchVariantDetail(v.id);if(vd)details.push(vd)}
 return npProfilesFromDetails(details,r);
}
function npFilterKeysFromProfiles(profiles){return profiles.flatMap(p=>p.types.map(t=>p.card?`${p.card}:${t}`:t))}
function npProfileKeys(d,r){return npFilterKeysFromProfiles(npProfilesFromDetails([d],r))}
function npTypeText(d,r){const profiles=npProfilesFromDetails([d],r);return profiles.length?profiles.map(p=>p.types.length?p.types.join(' · '):'Type non défini').join(' · '):'—'}
function npProfilesHtml(profiles){if(!profiles.length)return '<span class="np-profile-empty">Type NP indisponible</span>';return `<div class="np-profile-list">${profiles.map(p=>`<div class="np-profile"><span class="np-profile-card">${p.card?cardImg(p.card):''}</span><span class="np-profile-types">${p.types.length?p.types.map(t=>`<b>${t}</b>`).join('<span class="np-profile-sep">·</span>'):''}</span></div>`).join('')}</div>`}
function npCardsFromProfiles(profiles){return [...new Set((profiles||[]).map(p=>p?.card).filter(Boolean))]}
function clearNpOverlayTimers(){for(const timer of npOverlayTimers.values())clearInterval(timer);npOverlayTimers.clear()}
function setNpOverlayCards(holder,cards){
 const id=holder?.dataset?.servantId;
 if(id&&npOverlayTimers.has(id)){clearInterval(npOverlayTimers.get(id));npOverlayTimers.delete(id)}
 if(!holder)return;
 let overlay=holder.querySelector('.np-type-overlay');
 if(!showNpOverlay||!cards.length){overlay?.remove();return}
 if(!overlay){overlay=document.createElement('div');overlay.className='np-type-overlay';overlay.dataset.npOverlay=id;holder.appendChild(overlay)}
 let index=0;
 const paint=()=>{if(!overlay.isConnected||!showNpOverlay)return;const next=cardImg(cards[index]);overlay.classList.add('np-overlay-fade-out');setTimeout(()=>{if(!overlay.isConnected||!showNpOverlay)return;overlay.innerHTML=next;overlay.classList.remove('np-overlay-fade-out')},160);index=(index+1)%cards.length};
 overlay.innerHTML=cardImg(cards[0]);
 if(cards.length>1){const timer=setInterval(paint,1800);if(id)npOverlayTimers.set(id,timer)}
}
function npFilterKeys(r){const cached=npTypeCache.get(Number(r.id));if(!cached)return null;return cached.keys||[]}
function matchesNpFilters(r){if(!selectedNpTypes.size)return true;const keys=npFilterKeys(r);return keys==null?true:keys.some(k=>selectedNpTypes.has(k))}
async function ensureNpTypeIndex(){if(npTypeIndexPromise)return npTypeIndexPromise;const rows=state.roster.filter(isVisible).filter(r=>!npTypeCache.has(Number(r.id)));if(!rows.length)return;let cursor=0;npTypeIndexPromise=(async()=>{const workers=Array.from({length:6},async()=>{while(cursor<rows.length){const r=rows[cursor++];const d=await atlasDetail(r);const profiles=await npProfilesForServant(r,d);const keys=npFilterKeysFromProfiles(profiles);npTypeCache.set(Number(r.id),{profiles,keys});}});await Promise.all(workers)})().finally(()=>{npTypeIndexPromise=null});return npTypeIndexPromise}

function levelIndex(detail,level){const growth=detail?.limits?.slice?.().sort((a,b)=>a.lvMax-b.lvMax)||[];let exact=growth.find(x=>Number(x.lvMax)>=level);return exact||growth[growth.length-1]}
function statAt(detail,kind,level){if(!detail)return null;const arr=detail?.[kind+'Growth'];if(Array.isArray(arr)&&arr.length){const i=Math.max(0,Math.min(arr.length-1,level-1));return Number(arr[i])}const base=Number(detail?.[kind+'Base']),max=Number(detail?.[kind+'Max']),lvMax=Number(detail?.lvMax)||100;if(!Number.isFinite(base)||!Number.isFinite(max))return null;const t=Math.max(0,Math.min(1,(level-1)/(lvMax-1)));return Math.round(base+(max-base)*t)}
function currentStats(detail,r,s){const lvl=Math.max(1,Math.min(120,Number(s.level)||Number(detail?.lvMax)||1));const baseAtk=Number(statAt(detail,'atk',lvl)||0),baseHp=Number(statAt(detail,'hp',lvl)||0);const fouAtk=Math.max(0,Math.min(1000,Number(s.fouAtk)||0)),fouHp=Math.max(0,Math.min(1000,Number(s.fouHp)||0));return{atk:baseAtk+1000+fouAtk,hp:baseHp+1000+fouHp,baseAtk,baseHp,fouAtk,fouHp,lvl}}
function inputOrRead(id,value,min,max){return currentCanEdit()?`<input class="editable-input" id="${id}" type="number" value="${value??''}" min="${min}" max="${max}">`:`<span class="detail-value"><strong>${value??'—'}</strong></span>`}
function bondDiamonds(bond,editable=false){
 const n=Math.max(0,Math.min(15,Number(bond)||0));
 const row=(start,count)=>Array.from({length:count},(_,j)=>{const i=start+j+1;const tag=editable?'button':'span';const type=editable?' type="button"':'';return `<${tag}${type} class="bond-diamond ${i<=n?'filled':''}" ${editable?`data-bond="${i}"`:''} aria-label="Bond ${i}"></${tag}>`}).join('');
 return `<div class="bond-diamonds ${editable?'bond-editable':''}" id="bondDiamonds"><div class="bond-row bond-row-1">${row(0,10)}</div><div class="bond-row bond-row-2">${row(10,5)}</div></div><small class="bond-caption" id="bondCaption">Bond ${n||'—'} / 15${editable?' · cliquez sur un losange':''}</small>`;
}
function statBox(label,id,value,sub,editId,editVal,min='',max=''){return `<div class="detail-box"><label>${label}</label>${currentCanEdit()?`<input class="editable-input" id="${id}" type="number" value="${value??''}" ${min!==''?`min="${min}"`:''} ${max!==''?`max="${max}"`:''}>`:`<span class="detail-value"><strong>${value??'—'}</strong></span>`}${sub?`<div class="sub-stat">${sub}</div>`:''}${editId&&currentCanEdit()?`<input class="micro-edit" id="${editId}" type="number" min="0" max="1000" value="${editVal??0}" title="Fou 4★">`:''}</div>`}
function openModalBase(r,d,urls,idx,profiles=[]){
 const s=stats(currentPlayer,r.id),st=currentStats(d,r,s),can=currentCanEdit(),owned=isOwned(currentPlayer,r),cards=commandCards(d,r);
 const art=urls[idx]||guessImage(r.atlasId)||'';
 const npValue=s.np??'';
 const npRead=npDisplay(s.np,true);
 const levelHtml=can?`<input class="editable-input" id="e-level" type="number" value="${s.level??''}" min="1" max="120">`:`<span class="detail-value"><strong>${s.level??'—'}</strong></span>`;
 const npProfileMarkup=npProfilesHtml(profiles);
 const npHtml=can?`<div class="np-edit-wrap"><div class="np-topline">${npIcon()}<div class="np-value-line"><input class="editable-input np-input" id="e-np" type="number" value="${npValue}" min="1" max="999"><span class="np-display-hint">Affiché ${npRead}</span></div></div></div>`:`<div class="np-detail-row"><div class="np-topline">${npIcon()}<b>${npRead}</b></div></div>`;
 const grailCount=Number(s.grail)||0;
 const skillHtml=(s.skills||[null,null,null]).map((v,i)=>can?`<div class="level-cell"><span>SKILL ${i+1}</span><input id="skill-${i}" type="number" min="1" max="10" value="${v??''}"></div>`:`<div class="level-cell"><span>SKILL ${i+1}</span><div class="level-read">${v??'—'}</div></div>`).join('');
 const appendHtml=(s.appendSkills||[null,null,null,null,null]).map((v,i)=>can?`<div class="level-cell"><span>APPEND ${i+1}</span><input id="append-${i}" type="number" min="0" max="10" value="${v??''}"></div>`:`<div class="level-cell"><span>APPEND ${i+1}</span><div class="level-read">${v??'—'}</div></div>`).join('');
 $('#modal').innerHTML=`<div class="detail-layout ${can?'editor':''}"><div class="detail-gallery"><div class="detail-main-art">${art?`<img id="detailMainImg" src="${art}" alt="${r.name}">`:'<div class="image-fallback">ART<br><small>indisponible</small></div>'}</div><div class="art-strip" id="artStrip">${urls.map((u,i)=>`<button class="art-thumb ${i===idx?'active':''}" data-art="${i}"><img src="${u}" alt=""></button>`).join('')}</div><div class="art-controls"><button id="artPrev">←</button><span id="artCounter">${urls.length?`${idx+1} / ${urls.length}`:'0 art'}</span><button id="artNext">→</button></div></div><div class="detail-content">${can&&owned?'<button id="unownServant" class="danger danger-quiet detail-danger-corner" title="Retirer ce Servant de ma collection" aria-label="Retirer ce Servant de ma collection">×</button>':''}<div class="detail-title-row"><div class="detail-class">${classImg(r.class)}</div><div class="detail-title"><h2>${r.name}</h2><div class="detail-rarity">${rarityNum(r.rarity)}★${isWelfare(r)?' · WELFARE':''}</div></div></div><div class="detail-stats detail-stats-v10"><div class="detail-box detail-level-box"><label>NIVEAU</label>${levelHtml}<div class="grail-detail grail-v10">${grailImg()}<strong>${grailCount}</strong>${can?`<input class="micro-edit" id="e-grail" type="number" min="0" max="15" value="${s.grail??0}" title="Nombre de Graals">`:''}</div></div>${statBox('ATK','e-atk',st.atk,`Fou 4★ : +${fmtNum(st.fouAtk)} / +1000`,'e-fouatk',st.fouAtk)}${statBox('HP','e-hp',st.hp,`Fou 4★ : +${fmtNum(st.fouHp)} / +1000`,'e-fouhp',st.fouHp)}<div class="detail-box np-detail-box"><label>NOBLE PHANTASM</label>${npHtml}</div><div class="bond-block"><div class="command-title">BOND</div>${bondDiamonds(s.bond,can)}${can?`<input id="e-bond" type="number" min="0" max="15" value="${s.bond??''}" hidden>`:''}</div><div class="np-types-underbox">${npProfileMarkup}</div></div><div class="command-title">COMMAND CARDS</div><div class="cards-row v10-cards-row">${cards.length?cards.map(c=>`<div class="command-card-item">${cardImg(c)}</div>`).join(''):'<span class="card-data-missing">Données Atlas indisponibles</span>'}</div><div class="levels-title">SKILLS</div><div class="levels-row">${skillHtml}</div><div class="levels-title">APPEND SKILLS</div><div class="levels-row">${appendHtml}</div><div class="modal-footer">${can?`<span class="readonly-note">Édition · ${PLAYER_LABELS[currentPlayer]}</span><div class="modal-footer-actions"><button id="modalCancel">Annuler</button><button class="save" id="saveServant">Enregistrer</button></div>`:`<span class="readonly-note">Lecture seule</span><button id="modalCancel">Fermer</button>`}</div></div></div>`;
 $('#modalCancel').onclick=closeModal;
 let current=idx;function show(i){if(!urls.length)return;current=(i+urls.length)%urls.length;if($('#detailMainImg'))$('#detailMainImg').src=urls[current];$('#artCounter').textContent=`${current+1} / ${urls.length}`;$$('.art-thumb').forEach((b,j)=>b.classList.toggle('active',j===current))}$('#artPrev').onclick=()=>show(current-1);$('#artNext').onclick=()=>show(current+1);$$('.art-thumb').forEach(b=>b.onclick=()=>show(Number(b.dataset.art)));
 if(can){
   const bondInput=$('#e-bond'), bondCaption=$('#bondCaption');
   let bondHoverTimer=null;
   $$('[data-bond]').forEach(btn=>{
   btn.onmouseenter=()=>{clearTimeout(bondHoverTimer);const hover=Number(btn.dataset.bond);$$('[data-bond]').forEach(x=>x.classList.toggle('hovered',Number(x.dataset.bond)<=hover));};
   btn.onmouseleave=()=>{clearTimeout(bondHoverTimer);bondHoverTimer=setTimeout(()=>$$('[data-bond]').forEach(x=>x.classList.remove('hovered')),220);};
   btn.onclick=()=>{const value=Number(btn.dataset.bond);bondInput.value=value;$$('[data-bond]').forEach(x=>x.classList.toggle('filled',Number(x.dataset.bond)<=value));if(bondCaption)bondCaption.textContent=`Bond ${value} / 15 · cliquez sur un losange`;};
 });
$('#saveServant').onclick=()=>saveModal(Number(r.id));if($('#unownServant'))$('#unownServant').onclick=()=>{if(confirm('Retirer ce Servant de ta collection ? Toutes ses statistiques personnelles seront vidées.'))unownServant(Number(r.id));};}
}
function idNormalize(id){return Number(id)}
async function openServant(id){const r=state.roster.find(x=>Number(x.id)===id);if(!r)return;$('#modal').innerHTML='<div class="modal-loading">CHARGEMENT ATLAS…</div>';$('#modalBackdrop').classList.add('open');const d=await atlasDetail(r),urls=imageList(d),profiles=await npProfilesForServant(r,d);openModalBase(r,d,urls,0,profiles);}
async function saveModal(id){
 const s=ensureStats(currentPlayer,id);
 s.level=Math.max(1,Math.min(120,num($('#e-level')?.value)||1));
 s.np=num($('#e-np')?.value);
 s.bond=Math.max(0,Math.min(15,num($('#e-bond')?.value)||0));
 s.grail=Math.max(0,Math.min(15,num($('#e-grail')?.value)||0));
 s.fouHp=Math.max(0,Math.min(1000,num($('#e-fouhp')?.value)||0));
 s.fouAtk=Math.max(0,Math.min(1000,num($('#e-fouatk')?.value)||0));
 s.skills=[0,1,2].map(i=>{const v=num($('#skill-'+i)?.value);return v==null?null:Math.max(1,Math.min(10,v))});
 s.appendSkills=[0,1,2,3,4].map(i=>{const v=num($('#append-'+i)?.value);return v==null?null:Math.max(0,Math.min(10,v))});
 if(cloudEnabled&&session&&currentCanEdit()){
   const ok=await persistStat(id);
   if(!ok)return;
   localCacheSave();
   closeModal();renderAll();toast('Servant enregistré dans Supabase');
 }else{
   localCacheSave();
   closeModal();renderAll();toast('Servant enregistré localement');
 }
}
async function unownServant(id){
 const s=ensureStats(currentPlayer,id);
 s.level=null;s.np=null;s.bond=null;s.grail=null;s.fouHp=null;s.fouAtk=null;s.servantCoins=null;
 s.skills=[null,null,null];s.appendSkills=[null,null,null,null,null];
 if(cloudEnabled&&session&&currentCanEdit()){
   const ok=await persistStat(id);
   if(!ok)return;
   localCacheSave();closeModal();renderAll();toast('Servant retiré de ta collection');
 }else{
   localCacheSave();closeModal();renderAll();toast('Servant retiré localement');
 }
}
function closeModal(){$('#modalBackdrop').classList.remove('open')}
function localCacheSave(){localStorage.setItem(localKey,JSON.stringify(state.players))}
function localCacheLoad(){try{const x=JSON.parse(localStorage.getItem(localKey));if(!x)return;/* Never restore legacy friend snapshots locally: older builds mixed skill columns into level/bond/grail. */if(x.julien)state.players.julien=x.julien;/* XP is kept per profile below; Yanis/Attmann come from the bundled clean snapshot or Supabase. */}catch{}}
function compareAverage(p,idx){const vals=[];for(const r of goldUniverse()){const v=stats(p,r.id).skills?.[idx];if(validSkill(v))vals.push(Number(v))}return vals.length?vals.reduce((x,y)=>x+y,0)/vals.length:0}
function compareCount(p,pred=()=>true){return goldUniverse().filter(r=>pred(r)&&isOwned(p,r)).length}
function compareBond10(p){return compareCount(p,r=>Number(stats(p,r.id).bond)>=10)}
function compareLv120(p){return compareCount(p,r=>Number(stats(p,r.id).level)===120)}
function compareStats(p){return{owned:goldOwned(p),five:compareCount(p,r=>rarityNum(r.rarity)===5&&!isWelfare(r)),four:compareCount(p,r=>rarityNum(r.rarity)===4&&!isWelfare(r)),wf:compareCount(p,r=>isWelfare(r)),a1:compareAverage(p,0),a2:compareAverage(p,1),a3:compareAverage(p,2),lvl120:compareLv120(p),bond:compareBond10(p),np5:np5Count(p),np5Pct:np5Pct(p)}}
function renderCompare(){
 const vals=PLAYERS.map(p=>({p,...compareStats(p)})),tones=['#c6535f','#4f78b7','#579b76'];
 $('#compareTop').innerHTML=vals.map(v=>`<article class="person-card"><div class="person-name">${PLAYER_LABELS[v.p]}</div><div class="person-score">${v.owned}</div><small class="person-label">SERVANTS 4★ / 5★ / WELFARE POSSÉDÉS</small><div class="collection-note"><span>COLLECTION</span><b>${v.owned}</b><small>${v.np5Pct.toFixed(1)}% NP 5</small></div><div class="person-meta"><span><small>5★</small><b>${v.five}</b></span><span><small>4★</small><b>${v.four}</b></span><span><small>WELFARE</small><b>${v.wf}</b></span><span><small>SKILL 1 MOY.</small><b>${v.a1.toFixed(1)}</b></span><span><small>SKILL 2 MOY.</small><b>${v.a2.toFixed(1)}</b></span><span><small>SKILL 3 MOY.</small><b>${v.a3.toFixed(1)}</b></span><span><small>BOND 10+</small><b>${v.bond}</b></span><span><small>LV 120</small><b>${v.lvl120}</b></span><span><small>NP 5</small><b>${v.np5Pct.toFixed(1)}%</b></span></div></article>`).join('');
 initCompareNames();
 renderShowdown(false);
 renderRadar(tones);
}
function initCompareNames(){
 const r=state.roster.filter(isVisible);
 $('#compareNames').innerHTML=r.map(x=>`<option value="${x.name}">${x.name}</option>`).join('');
 const cur=state.roster.find(x=>Number(x.id)===Number(compareFocusId)&&isVisible(x));
 if(!cur){const caster=state.roster.find(x=>norm(x.name)==='artoria caster'&&isVisible(x));compareFocusId=caster?.id??284;}
}
function renderShowdown(force=false){
 const r=state.roster.find(x=>Number(x.id)===Number(compareFocusId)&&isVisible(x))||state.roster.find(x=>norm(x.name)==='artoria caster'&&isVisible(x))||state.roster.find(isVisible);
 if(!r)return;
 if(!force && Number(showdownRenderedId)===Number(r.id) && $('#compareCards')?.children.length) return;
 compareFocusId=r.id;
 showdownRenderedId=r.id;
 const token=++showdownRenderToken;
 const search=$('#compareSearch');
 if(search&&search.value!==r.name)search.value=r.name;
 $('#compareFocusTitle').textContent=r.name;
 $('#compareCards').innerHTML=PLAYERS.map(p=>{const s=stats(p,r.id),own=isOwned(p,r);return `<article class="duel-card ${own?'':'duel-missing'}"><div class="duel-hero" id="duel-${p}">${own?'':'<span class="missing-ribbon">NON POSSÉDÉ</span>'}<div class="loader">ATLAS</div><div class="duel-name">${PLAYER_LABELS[p]}</div></div><div class="duel-body"><div class="duel-row"><span>Niveau</span><strong>${displayLevel(p,r,s)}</strong></div><div class="duel-row"><span>NP</span><strong>${npDisplay(s.np,true)}</strong></div><div class="duel-row"><span>Bond</span><strong>${s.bond??'—'}</strong></div><div class="skill-squares showdown-levels">${(s.skills||[]).slice(0,3).map((v,i)=>`<div class="square"><span>S${i+1}</span><b>${v??'—'}</b></div>`).join('')}</div><div class="append-squares showdown-levels">${(s.appendSkills||[]).slice(0,5).map((v,i)=>`<div class="square"><span>A${i+1}</span><b>${v??'—'}</b></div>`).join('')}</div></div></article>`}).join('');
 const dPromise=atlasDetail(r);
 dPromise.then(d=>{const u=imageList(d)[0]||guessImage(r.atlasId);PLAYERS.forEach(p=>{const e=$(`#duel-${p}`);if(!e||!u)return;const img=new Image();img.referrerPolicy='no-referrer';img.decoding='async';img.onload=()=>{if(token!==showdownRenderToken||!e.isConnected)return;e.innerHTML=`${isOwned(p,r)?'':'<span class="missing-ribbon">NON POSSÉDÉ</span>'}`;e.appendChild(img);const label=document.createElement('div');label.className='duel-name';label.textContent=PLAYER_LABELS[p];e.appendChild(label)};img.onerror=()=>{};img.src=u;});});
}
function radarPolygon(values,cx,cy,rad){
 const n=values.length||1;
 return values.map((v,i)=>{const pct=Math.max(0,Math.min(100,Number(v)||0));const visual=Math.sqrt(pct/100);const a=-Math.PI/2+i*(Math.PI*2/n);return `${cx+Math.cos(a)*rad*visual},${cy+Math.sin(a)*rad*visual}`;}).join(' ');
}
function renderRadar(colors){
 const el=$('#compareRadar');if(!el)return;
 const labels=['Collection 4★/5★/Welfare','Skill 1','Skill 2','Skill 3','NP 5','Bond 10+','Lv 120'];
 const points=labels.length,cx=350,cy=285,rad=205;
 const coords=i=>{const a=-Math.PI/2+i*(Math.PI*2/points);return [cx+Math.cos(a)*rad,cy+Math.sin(a)*rad]};
 const rings=[.25,.5,.75,1].map(v=>`<polygon points="${Array.from({length:points},(_,i)=>{const a=-Math.PI/2+i*(Math.PI*2/points);return [cx+Math.cos(a)*rad*v,cy+Math.sin(a)*rad*v].join(',')}).join(' ')}" fill="none" stroke="#d8e0e8" stroke-width="1.5"/>`).join('');
 const axes=labels.map((l,i)=>{const [x,y]=coords(i),a=-Math.PI/2+i*(Math.PI*2/points),tx=cx+Math.cos(a)*(rad+38),ty=cy+Math.sin(a)*(rad+38);return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#d3dce5" stroke-width="1.5"/><text x="${tx}" y="${ty}" text-anchor="middle" dominant-baseline="middle" class="radar-label">${l}</text>`}).join('');
 const den=Math.max(goldUniverse().length,1);
 const all=PLAYERS.map((p,i)=>{
   const s=compareStats(p);
   const vals=[Math.min(100,s.owned/den*100),s.a1*10,s.a2*10,s.a3*10,Math.min(100,s.np5/den*100),Math.min(100,s.bond/den*100),Math.min(100,s.lvl120/den*100)];
   const pts=radarPolygon(vals,cx,cy,rad);
   const dots=vals.map((v,j)=>{const visual=Math.sqrt(Math.max(0,Math.min(100,v))/100);const a=-Math.PI/2+j*(Math.PI*2/points);return `<circle cx="${cx+Math.cos(a)*rad*visual}" cy="${cy+Math.sin(a)*rad*visual}" r="6" fill="${colors[i]}" class="radar-point"/>`}).join('');
   return{p,pts,dots,color:colors[i],raw:vals};
 });
 $('#radarLegend').innerHTML=all.map(x=>`<span class="legend-item"><i class="legend-dot" style="background:${x.color}"></i><b>${PLAYER_LABELS[x.p]}</b></span>`).join('');
 el.innerHTML=`<div class="radar-shell"><svg class="radar-svg" viewBox="0 0 700 610" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Profil de progression comparé">${rings}${axes}<circle cx="${cx}" cy="${cy}" r="4" fill="#637181"/>${all.map(x=>`<polygon points="${x.pts}" fill="${x.color}" fill-opacity=".12" stroke="${x.color}" stroke-width="3"/>${x.dots}`).join('')}</svg><div class="radar-note">Échelle visuelle renforcée : les faibles pourcentages restent lisibles. Les valeurs réelles sont celles affichées dans les statistiques ci-dessus.</div></div>`;
}
const supportLiveCache=new Map();
const SUPPORT_DECK_BITS=[1,2,4,8,16,32];
const SUPPORT_FALLBACK_PRESENT={julien:[1,2,4],yanis:[],attmann:[]};
const SUPPORT_DECK_LABELS=['Normal 1','Normal 2','Normal 3','Event 1','Event 2','Event 3'];
function deckGenUrl(friendId,guid,stack){
  const fid=String(friendId||'').replace(/\D/g,'');
  if(!fid||!guid)return'';
  return `https://rayshift.io/static/images/deck-gen/na/${fid}/${encodeURIComponent(guid)}/${stack}/9.png`;
}
async function fetchRayshiftSupport(player,fid,force=false){
  const id=String(fid||'').replace(/\D/g,'');
  if(!id)return null;
  const key=`${player}:${id}`;
  const cached=supportLiveCache.get(key);
  if(cached&&!force&&Date.now()-cached.at<5*60*1000)return cached.data;
  try{
    const res=await fetch(`https://rayshift.io/api/v1/support/decks/na/${id}`,{cache:'no-store',headers:{Accept:'application/json'}});
    if(!res.ok)throw new Error(`${res.status} ${res.statusText}`);
    const data=await res.json();
    const r=data?.response||{};
    if(Number(data?.status)!==200||!r.guid)throw new Error(data?.message||'Profil Rayshift incomplet');
    const present=Array.isArray(r.decksPresent)?r.decksPresent.map(Number).filter(Boolean):[];
    const deckImages=Object.fromEntries(SUPPORT_DECK_BITS.map((bit,i)=>[String(bit),present.includes(bit)?deckGenUrl(r.code||id,r.guid,bit):'']));
    const clean={code:String(r.code||id),lastUpdate:r.lastUpdate||null,lastLogin:r.lastLogin||null,guid:String(r.guid),decksPresent:present,decks:r.decks||{},deckImages,message:data?.message||'ok'};
    supportLiveCache.set(key,{at:Date.now(),data:clean});
    supportSnapshot.players[player]=clean;
    return clean;
  }catch(e){console.warn('Rayshift public API indisponible',e);return null}
}
function renderSupports(){
  // The global Master switch controls which support profile is displayed.
  supportPlayer=currentPlayer;
  const fid=supportLocal[supportPlayer]?.friendId||supportSnapshot.players?.[supportPlayer]?.code||'';
  if(fid){
    const playerAtStart=supportPlayer;
    const cleanFid=String(fid).replace(/\D/g,'');
    const key=`${playerAtStart}:${cleanFid}`;
    if(!supportLiveCache.has(key)){
      fetchRayshiftSupport(playerAtStart,cleanFid).then(data=>{if(data&&currentView==='supports'&&supportPlayer===playerAtStart)renderSupports();});
    }
  }
  $$('[data-support-mode]').forEach(b=>b.classList.toggle('active',b.dataset.supportMode===supportMode));
  const modeSwitch=document.querySelector('.support-mode-switch');
  if(modeSwitch)modeSwitch.classList.toggle('event-mode',supportMode==='event');

  const snap=supportSnapshot.players?.[supportPlayer]||{};
  const frame=$('#rayFrameWrap');
  const fidForImage=String(snap.code||fid).replace(/\D/g,'');
  const guid=snap.guid||SUPPORT_GUID_FALLBACKS[supportPlayer]||'';
  const bits=supportMode==='event'?[8,16,32]:[1,2,4];
  const imageUrls=bits.map((bit,i)=>({
    bit,
    src:(snap.deckImages?.[String(bit)]||deckGenUrl(fidForImage,guid,bit)),
    label:`${supportMode==='event'?'Event':'Normal'} ${i+1}`
  }));

  frame.innerHTML = `<div class="support-clean"><span>${snap.lastUpdate ? `Rayshift · dernière mise à jour : ${new Date(Number(snap.lastUpdate)*1000).toLocaleString('fr-FR')}` : 'Rayshift · dernière mise à jour : —'}</span></div>`;
 
  $('#supportLists').innerHTML=imageUrls.map(item=>`<article class="support-list support-list-live"><div class="support-list-head"><h3>${item.label}</h3></div><div class="support-deck-preview">${item.src?`<a href="${item.src}" target="_blank" rel="noopener"><img src="${item.src}" alt="${item.label}" loading="eager"></a>`:'<span class="support-empty-slot">Cette liste n’est pas disponible.</span>'}</div></article>`).join('');
}


function xpFmt(n){return Number(n||0).toLocaleString('fr-FR')}
function xpTotalsFor(p,targetClass=''){const inv=xpInventory(p);let random=0,effective=0;for(const c of XP_CLASSES){for(const star of [5,4,3]){const n=Math.max(0,Number(inv[c][star])||0);const base=n*XP_CARD_VALUE[star];random+=base;effective+=targetClass&&c===targetClass?Math.round(base*1.2):base}}return{random,classBonus:effective,effective}}
function xpNeed(from,to){const a=Math.max(1,Math.min(120,Number(from)||1)),b=Math.max(a,Math.min(120,Number(to)||120));return b<=a?0:(XP_TO_LEVEL[b]||0)-(XP_TO_LEVEL[a]||0)}
function cardsNeeded(xp,value){return xp>0?Math.ceil(xp/value):0}
function xpDerivedState(p){
  const inv=xpInventory(p);
  const targetClass=$('#xpClassSelect')?.value||xpTargetClass||'';
  const totals=xpTotalsFor(p,targetClass);
  const cur=Math.max(1,Math.min(120,Number($('#xpCurrentLevel')?.value)||1));
  const target=Math.max(cur,Math.min(120,Number($('#xpTargetLevel')?.value)||120));
  const need=xpNeed(cur,target);
  return {inv,random:totals.random,classBonus:totals.classBonus,cur,target,need,targetClass};
}
function updateXpComputed(){
  const d=xpDerivedState(currentPlayer);
  $('#xpRandomTotal').textContent=xpFmt(d.random);
  $('#xpClassBonusTotal').textContent=xpFmt(d.classBonus);
  const cards=[
    ['5★ random',cardsNeeded(d.need,XP_CARD_VALUE[5])],
    ['5★ classe',cardsNeeded(d.need,XP_CARD_CLASS_VALUE[5])],
    ['4★ random',cardsNeeded(d.need,XP_CARD_VALUE[4])],
    ['4★ classe',cardsNeeded(d.need,XP_CARD_CLASS_VALUE[4])]
  ];
  const available=Math.max(0,d.classBonus);
  const remaining=Math.max(0,d.need-available);
  const summary=$('#xpTargetSummary');
  if(summary) summary.innerHTML=`<div class="xp-result-primary"><div><span>XP À FOURNIR</span><strong>${xpFmt(d.need)}</strong><small>${d.cur} → ${d.target}</small></div><div class="xp-result-status ${remaining===0?'ready':''}"><b>${remaining===0?'OBJECTIF COUVERT':'IL RESTE'}</b><strong>${remaining===0?'✓':xpFmt(remaining)}</strong><span>${remaining===0?'ton stock suffit':(d.targetClass?`XP à réunir · ${d.targetClass}`:'XP à réunir')}</span></div></div><div class="xp-result-cards">${cards.map(([l,v])=>`<div><b>${fmtNum(v)}</b><span>${l}</span></div>`).join('')}</div>`;
  const hint=$('#xpStockHint');
  if(hint) hint.innerHTML=remaining===0?'<strong>Stock suffisant</strong><span>Ton inventaire couvre cet objectif en XP brute.</span>':`<strong>${xpFmt(remaining)} XP manquants</strong><span>Le calcul te donne le volume d’XP encore nécessaire.</span>`;
  $$('[data-xp-goal]').forEach(b=>b.classList.toggle('active',b.dataset.xpGoal===String(d.target)));
}
function renderXp(){
  const p=currentPlayer,inv=xpInventory(p),can=currentCanEdit(),targetClass=xpTargetClass;
  const totals=xpTotalsFor(p,targetClass);
  $('#xpTableBody').innerHTML=XP_CLASSES.map(c=>{
    const row=inv[c];
    const total=[5,4,3].reduce((z,st)=>z+(Number(row[st])||0)*XP_CARD_VALUE[st],0);
    const bonus=[5,4,3].reduce((z,st)=>z+(Number(row[st])||0)*XP_CARD_CLASS_VALUE[st],0);
    return `<tr><th><div class="xp-class-name">${c==='Autre'?'<span class="xp-class-other"></span>':classImg(c)}<span>${c}</span></div></th>${[5,4,3].map(st=>`<td>${can?`<input class="xp-stock-input beige" data-xp-class="${c}" data-xp-star="${st}" type="number" min="0" step="1" value="${fmtInputNumber(row[st]||0)}" inputmode="numeric">`:`<span class="xp-read">${fmtNum(row[st]||0)}</span>`}</td>`).join('')}<td><b>${xpFmt(total)}</b></td><td><b>${xpFmt(bonus)}</b></td></tr>`;
  }).join('');
  const grand=[5,4,3].map(st=>XP_CLASSES.reduce((z,c)=>z+(Number(inv[c][st])||0),0));
  $('#xpTableFoot').innerHTML=`<tr><th>TOTAL</th>${grand.map(v=>`<th>${fmtNum(v)}</th>`).join('')}<th>${xpFmt(totals.random)}</th><th>${xpFmt(totals.classBonus)}</th></tr>`;
  $('#xpMilestones').innerHTML=[60,70,80,90,100,120].map(l=>`<button class="xp-milestone modern" data-xp-milestone="${l}"><span>1 → ${l}</span><b>${xpFmt(XP_TO_LEVEL[l])}</b><small>${fmtNum(cardsNeeded(XP_TO_LEVEL[l],27000))} × 4★</small></button>`).join('');
  $$('.xp-stock-input').forEach(i=>{i.oninput=()=>{inv[i.dataset.xpClass][i.dataset.xpStar]=Math.max(0,Math.floor(Number(i.value)||0));localCacheSave();clearTimeout(i._cloudTimer);i._cloudTimer=setTimeout(async()=>{const ok=await saveXpCloud();if(ok)updateSync('Cloud · inventaire XP synchronisé');},450);updateXpComputed()};i.onchange=()=>{clearTimeout(i._cloudTimer);i._cloudTimer=setTimeout(async()=>{const ok=await saveXpCloud();if(ok)updateSync('Cloud · inventaire XP synchronisé');},150);};});
  $$('.xp-milestone').forEach(b=>b.onclick=()=>{$('#xpTargetLevel').value=b.dataset.xpMilestone;updateXpComputed()});
  updateXpComputed();
}

function navigate(v){currentView=v;$$('.view').forEach(x=>x.classList.toggle('active',x.id==='view-'+v));$$('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.view===v));$('#pageName').textContent={overview:'Overview',servants:'Servants',compare:'Compare',supports:'Support Lists',xp:'Calcul XP'}[v];$('#sidebar').classList.remove('open');renderAll()}
function renderAll(){renderMasterSwitch();if(currentView==='overview')renderOverview();if(currentView==='servants'){fillFilters();renderRoster()}if(currentView==='compare')renderCompare();if(currentView==='supports')renderSupports();if(currentView==='xp')renderXp()}
async function persistStat(id){
 if(!cloudEnabled||!cloud||!session||!currentCanEdit()){
   toast('Impossible de synchroniser ce Servant : compte non éditeur');
   return false;
 }
 const s=stats(currentPlayer,id);
 const body={
   player_key:currentPlayer,
   servant_id:Number(id),
   level:s.level,
   np:s.np,
   bond:s.bond,
   grail:s.grail,
   fou_hp:s.fouHp,
   fou_atk:s.fouAtk,
   servant_coins:s.servantCoins,
   skills:s.skills||[null,null,null],
   append_skills:s.appendSkills||[null,null,null,null,null],
   updated_at:new Date().toISOString()
 };
 const {data,error}=await cloud
   .from('chaldea_stats')
   .upsert(body,{onConflict:'player_key,servant_id',ignoreDuplicates:false})
   .select('player_key,servant_id,level,np,bond,grail,fou_hp,fou_atk,servant_coins,skills,append_skills')
   .single();
 if(error){
   updateSync('Supabase · erreur sauvegarde',true);
   toast('Erreur Supabase : '+error.message);
   return false;
 }
 if(!data || String(data.player_key)!==String(currentPlayer) || Number(data.servant_id)!==Number(id)){
   updateSync('Supabase · sauvegarde non confirmée',true);
   toast('La sauvegarde du Servant n’a pas pu être confirmée');
   return false;
 }
 updateSync('Cloud · synchronisé');
 return true;
}
async function refreshPublicStats(){if(!cloudEnabled||!cloud)return;const {data,error}=await cloud.from('chaldea_stats').select('*');if(error){updateSync('Supabase · lecture refusée',true);return}let changed=false;for(const x of data||[]){const ss=ensureStats(x.player_key,x.servant_id);const next={level:x.level,np:x.np,bond:x.bond,grail:x.grail,fouHp:x.fou_hp,fouAtk:x.fou_atk,servantCoins:x.servant_coins,skills:x.skills||[null,null,null],appendSkills:x.append_skills||[null,null,null,null,null]};if(JSON.stringify(ss)!==JSON.stringify(next)){Object.assign(ss,next);changed=true}}if(changed){localCacheSave();if(currentView==='overview')renderOverview();else if(currentView==='compare')renderCompare()}}
async function seedCurrentPlayer(){if(!cloudEnabled||!cloud||!session||!currentAuth?.canEdit)return;const ids=Object.entries(state.players[currentPlayer]?.stats||{});for(let i=0;i<ids.length;i+=50){const chunk=ids.slice(i,i+50).map(([id,s])=>({player_key:currentPlayer,servant_id:Number(id),level:s.level,np:s.np,bond:s.bond,grail:s.grail,fou_hp:s.fouHp,fou_atk:s.fouAtk,servant_coins:s.servantCoins,skills:s.skills||[null,null,null],append_skills:s.appendSkills||[null,null,null,null,null]}));const {error}=await cloud.from('chaldea_stats').upsert(chunk,{onConflict:'player_key,servant_id'});if(error){toast('Import impossible : '+error.message);return}}toast('Snapshot importé dans Supabase');await refreshPublicStats()}
async function saveAllToSupabase(){
 if(!cloudEnabled||!cloud||!session||!currentCanEdit()){toast('Connecte-toi avec ton compte éditeur');return false}
 try{
  const now=new Date().toISOString();const rows=Object.entries(state.players[currentPlayer]?.stats||{}).map(([id,st])=>({player_key:currentPlayer,servant_id:Number(id),level:st.level,np:st.np,bond:st.bond,grail:st.grail,fou_hp:st.fouHp,fou_atk:st.fouAtk,servant_coins:st.servantCoins,skills:st.skills||[null,null,null],append_skills:st.appendSkills||[null,null,null,null,null],updated_at:now}));
  for(let i=0;i<rows.length;i+=100){const {error}=await cloud.from('chaldea_stats').upsert(rows.slice(i,i+100),{onConflict:'player_key,servant_id'});if(error)throw error}
  const {error:xe}=await cloud.from('chaldea_xp').upsert({player_key:currentPlayer,inventory:xpInventory(currentPlayer),updated_at:now},{onConflict:'player_key'});if(xe)throw xe;
  const {error:se}=await cloud.from('chaldea_support_profiles').upsert({player_key:currentPlayer,friend_id:supportLocal[currentPlayer]?.friendId||null,updated_at:now},{onConflict:'player_key'});if(se)throw se;
  localCacheSave();updateSync('Cloud · toutes les données synchronisées');toast('Toutes tes données sont enregistrées dans Supabase');await refreshPublicStats();await loadXpCloud();await loadSupportProfiles();return true;
 }catch(error){toast('Erreur Supabase : '+(error?.message||error));return false}
}
async function saveXpCloud(){if(!cloudEnabled||!cloud||!session||!currentCanEdit())return false;const inv=xpInventory(currentPlayer);const {error}=await cloud.from('chaldea_xp').upsert({player_key:currentPlayer,inventory:inv,updated_at:new Date().toISOString()},{onConflict:'player_key'});if(error){console.warn('XP sync',error.message);return false}return true}
async function loadXpCloud(){if(!cloudEnabled||!cloud)return;const {data,error}=await cloud.from('chaldea_xp').select('*');if(error)return;for(const x of data||[]){state.players[x.player_key].xp=x.inventory||XP_DEFAULT()}if(currentView==='xp')renderXp()}
async function loadSupportProfiles(){if(!cloudEnabled||!cloud)return;const {data,error}=await cloud.from('chaldea_support_profiles').select('*');if(error)return;for(const x of data||[])supportLocal[x.player_key]={friendId:x.friend_id||''}}
async function saveSupportProfile(p,fid){if(!cloudEnabled||!cloud||!session||!currentAuth?.canEdit||currentAuth.playerKey!==p){localCacheSave();return}const {error}=await cloud.from('chaldea_support_profiles').upsert({player_key:p,friend_id:fid||null,updated_at:new Date().toISOString()},{onConflict:'player_key'});if(error)toast('Erreur Support : '+error.message);else toast('Friend ID synchronisé')}
async function loadCloud(){if(!cloudEnabled||!cloud)return;await refreshPublicStats();await loadSupportProfiles();await loadXpCloud();const {data}=await cloud.from('chaldea_stats').select('player_key');const counts={};(data||[]).forEach(x=>counts[x.player_key]=(counts[x.player_key]||0)+1);if(session&&currentAuth?.canEdit&&!counts[currentAuth.playerKey])showSeedBanner()}
function showSeedBanner(){if($('#seedBanner'))return;const div=document.createElement('div');div.id='seedBanner';div.className='seed-banner';div.innerHTML=`<span>Ton compte n’a pas encore été initialisé dans la base cloud.</span><button>Importer ton snapshot Excel</button>`;div.querySelector('button').onclick=async()=>{await seedCurrentPlayer();div.remove()};document.body.appendChild(div)}
function updateEditVisibility(){$('#accountText').textContent=session?(currentAuth?.canEdit?`Connecté · ${PLAYER_LABELS[currentAuth.playerKey]}`:'Connecté · lecteur'):'Connexion'}
async function resolveMembership(){if(!cloud||!session)return;const {data,error}=await cloud.from('chaldea_members').select('auth_user_id,player_key,display_name,can_edit').eq('auth_user_id',session.user.id).maybeSingle();if(error){currentAuth=null;cloudAuthError=error.message||'Accès Supabase refusé';updateSync(error.code==='401'?'Supabase · clé/API refusée':'Supabase · lecture refusée',true);return}cloudAuthError='';currentAuth=data?{playerKey:data.player_key,canEdit:!!data.can_edit}:null;/* Keep the user's currently selected Master. Authentication only controls edit rights. */if(data&&state.players[data.player_key])state.players[data.player_key].displayName=data.display_name||PLAYER_LABELS[data.player_key];updateEditVisibility()}
async function claimJulien(){if(!cloud||!session)return;const {data,error}=await cloud.rpc('claim_julien');if(error){toast(error.message);return}await resolveMembership();renderAll();toast('Compte associé à Julien')}
async function setupCloud(){
  if(!CONFIG.supabaseUrl||!SUPABASE_KEY||!window.supabase){updateSync('Cloud non configuré',true);return}
  cloud=window.supabase.createClient(CONFIG.supabaseUrl,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  cloudEnabled=true;
  const got=await cloud.auth.getSession();
  session=got.data.session||null;
  if(session){
    await resolveMembership();
    updateSync(currentAuth?.canEdit?'Cloud · éditeur':cloudAuthError?'Supabase · lecture refusée':currentAuth?'Cloud · lecteur':'Compte connecté · non associé',!!cloudAuthError);
    await loadCloud();
  }else{
    const probe=await cloud.from('chaldea_stats').select('player_key').limit(1);
    if(probe.error){updateSync('Supabase · clé/API refusée',true);console.warn('Supabase REST:',probe.error.message)}
    else updateSync('Cloud · lecture publique');
    await refreshPublicStats();await loadSupportProfiles();await loadXpCloud();
  }
  cloud.auth.onAuthStateChange((_event,ses)=>{setTimeout(async()=>{session=ses;currentAuth=null;cloudAuthError='';if(ses){await resolveMembership();updateSync(currentAuth?.canEdit?'Cloud · éditeur':cloudAuthError?'Supabase · lecture refusée':currentAuth?'Cloud · lecteur':'Compte connecté · non associé',!!cloudAuthError);await loadCloud();renderAll()}else{updateSync('Cloud · lecture publique');await refreshPublicStats();await loadSupportProfiles();await loadXpCloud();renderAll()}},0)});
  // Realtime is optional. If the WebSocket is unavailable, keep the site functional and poll instead.
  if(CONFIG.enableRealtime===true){try{cloud.channel('chaldea-live').on('postgres_changes',{event:'*',schema:'public',table:'chaldea_stats'},()=>refreshPublicStats()).subscribe(()=>{});}catch(e){console.warn('Supabase Realtime disabled',e)}}
  setInterval(async()=>{if(document.visibilityState==='visible'&&cloudEnabled)await refreshPublicStats()},15000);
}
function accountUI(){
 const logged=!!session,can=currentCanEdit(),missing=logged&&!currentAuth&&!cloudAuthError;
 $('#modal').innerHTML=`<div style="padding:26px"><span class="eyebrow">CLOUD ACCESS</span><h2 style="font:700 28px 'Space Grotesk';margin:6px 0 0">${logged?'Compte Supabase':'Connexion'}</h2><p class="account-copy">${logged?`${session.user.email}<br>${can?`Éditeur · ${PLAYER_LABELS[currentAuth.playerKey]}`:cloudAuthError?`Session présente · ${cloudAuthError}`:missing?'Compte authentifié mais pas encore associé à un Master.':'Lecture seule'}`:'Connecte ton compte Supabase. Le site reste consultable sans compte.'}</p>${logged?(missing?`<div class="claim-box"><b>Compte Julien</b><span>Utilise cette action uniquement si ce compte doit devenir le compte Julien.</span><button class="save" id="claimJulien">Associer à Julien</button></div>`:`<div class="modal-footer account-actions"><span class="readonly-note">${cloudAuthError?'L’API Supabase refuse actuellement les requêtes.':'Session active.'}</span><div class="account-action-group">${can?'<button class="save" id="saveAllCloud">Enregistrer toutes mes données</button>':''}<button id="modalCancel">Fermer</button><button id="logout">${cloudAuthError?'Réinitialiser la session':'Se déconnecter'}</button></div></div>`):`<div style="display:grid;gap:10px;margin-top:18px"><input id="loginEmail" class="editable-input" type="email" placeholder="Email"><input id="loginPassword" class="editable-input" type="password" placeholder="Mot de passe"></div><div class="modal-footer"><button id="modalCancel">Annuler</button><button class="save" id="login">Se connecter</button></div>`}</div>`;
 $('#modalBackdrop').classList.add('open');
 $('#modalCancel').onclick=closeModal;
 if(logged&&missing){$('#claimJulien').onclick=claimJulien}else if(logged){if($('#saveAllCloud'))$('#saveAllCloud').onclick=async()=>{const ok=await saveAllToSupabase();if(ok)closeModal()};$('#logout').onclick=async()=>{await cloud.auth.signOut();session=null;currentAuth=null;cloudAuthError='';updateSync('Cloud · lecture publique');renderAll();closeModal()}}
 else{$('#login').onclick=async()=>{const email=$('#loginEmail').value.trim(),password=$('#loginPassword').value;const {data,error}=await cloud.auth.signInWithPassword({email,password});if(error){toast(error.message);return}session=data.session;currentAuth=null;cloudAuthError='';await resolveMembership();await loadCloud();renderAll();closeModal();}}
}
$('#modalBackdrop').onclick=e=>{if(e.target.id==='modalBackdrop')closeModal()};
$$('.nav-item').forEach(b=>b.onclick=()=>navigate(b.dataset.view));$('#mobileMenu').onclick=()=>$('#sidebar').classList.toggle('open');$('#accountBtn').onclick=accountUI;$('#searchInput').oninput=renderRoster;$('#sortFilter').onchange=renderRoster;$('#hideMissing').onclick=()=>{showMissing=!showMissing;updateFilterLabels();renderRoster()};const toggleNp=$('#toggleNpOverlay');if(toggleNp)toggleNp.onclick=()=>{showNpOverlay=!showNpOverlay;updateFilterLabels();renderRoster()};$('#xpCurrentLevel').oninput=updateXpComputed;$('#xpCurrentLevel').onblur=()=>{const e=$('#xpCurrentLevel');e.value=Math.max(1,Math.min(120,Number(e.value)||1));updateXpComputed()};$('#xpTargetLevel').oninput=()=>{updateXpComputed();$$('[data-xp-goal]').forEach(x=>x.classList.toggle('active',x.dataset.xpGoal===$('#xpTargetLevel').value))};$$('[data-skill-scope]').forEach(b=>b.onclick=()=>{skillScope=b.dataset.skillScope;renderOverview()});$$('[data-xp-goal]').forEach(b=>b.onclick=()=>{const e=$('#xpTargetLevel');e.value=b.dataset.xpGoal;updateXpComputed()});$('#sortDir').onclick=()=>{sortDir=sortDir==='desc'?'asc':'desc';$('#sortDir').textContent=sortDir==='asc'?'↑ Ascendant':'↓ Descendant';renderRoster()};const xpClassHidden=$('#xpClassSelect'),xpClassGrid=$('#xpClassGrid');const xpClasses=['Saber','Archer','Lancer','Rider','Caster','Assassin','Berserker'];if(xpClassGrid&&!xpClassGrid.children.length)xpClassGrid.innerHTML=xpClasses.map(c=>`<button type="button" class="xp-class-option" data-xp-class-value="${c}" aria-label="${c}" title="${c}">${classImg(c)}</button>`).join('');if(xpClassHidden){$$('[data-xp-class-value]').forEach(b=>b.onclick=()=>{const c=b.dataset.xpClassValue;xpTargetClass=xpTargetClass===c?'':c;xpClassHidden.value=xpTargetClass;$$('[data-xp-class-value]').forEach(x=>x.classList.toggle('active',x.dataset.xpClassValue===xpTargetClass));const hint=$('#xpClassHint');if(hint)hint.textContent=xpTargetClass?`Bonus de classe · ${xpTargetClass}`:'Aucun bonus · clique sur une classe pour l’activer';updateXpComputed();});}$$('[data-support-mode]').forEach(b=>b.onclick=()=>{supportMode=b.dataset.supportMode;renderSupports();});$$('[data-pop]').forEach(b=>b.onclick=e=>{$$('.filter-pop.open').forEach(x=>x.classList.remove('open'));$('#'+b.dataset.pop).classList.toggle('open');e.stopPropagation()});document.addEventListener('click',e=>{$$('.filter-pop.open').forEach(p=>{if(!p.parentElement.contains(e.target))p.classList.remove('open')})});const chooseCompare=()=>{const q=norm($('#compareSearch').value);const exact=state.roster.find(r=>isVisible(r)&&norm(r.name)===q)||state.roster.find(r=>isVisible(r)&&norm(r.name).startsWith(q));if(exact){compareFocusId=exact.id;renderShowdown(true)}};$('#compareSearch').onchange=chooseCompare;$('#compareSearch').onkeydown=e=>{if(e.key==='Enter')chooseCompare()};
localCacheLoad();state.roster=sanitizeRoster([...state.roster, ...NA_FORCE_INCLUDE]).filter(r=>!NA_BLOCKED_IDS.has(Number(r.id))&&norm(r.name)!=='solomon');if(!state.roster.some(r=>Number(r.id)===417))state.roster.push({...NA_FORCE_INCLUDE[0]});PLAYERS.forEach(p=>{state.players[p]??={displayName:PLAYER_LABELS[p],stats:{}};state.players[p].xp??=XP_DEFAULT()});fillFilters();renderAll();setupCloud();syncRosterNA();
