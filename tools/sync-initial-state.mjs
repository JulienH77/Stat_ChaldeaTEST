import fs from 'node:fs/promises';

const ROOT = new URL('../', import.meta.url);
const INITIAL_PATH = new URL('./data/initial-state.json', ROOT);

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, '');
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const ATLAS_URL = 'https://api.atlasacademy.io/export/NA/basic_servant.json';
const PLAYERS = ['julien', 'yanis', 'attmann'];
const FUTURE_NAMES = new Set(['Phantasmoon','Louhi','Van Gogh (Miner)','Tutankhamun','Kazuradrop']);
const NA_BLOCKED_IDS = new Set([83,149,151,168,240,333,411,412,436,443,460]);
const FORCE_INCLUDE = [{id:417,name:'Ereshkigal',class:'Beast',rarity:'SSR',atlasId:3300200,nonCounted:false}];
const PLAYER_LABELS = {julien:'Julien', yanis:'Yanis', attmann:'Attmann'};
const EMPTY = () => ({level:null,bond:null,grail:null,fouHp:null,fouAtk:null,np:null,skills:[null,null,null],appendSkills:[null,null,null,null,null],servantCoins:null});

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  throw new Error('SUPABASE_URL et SUPABASE_SECRET_KEY doivent être définis dans les secrets GitHub.');
}

async function getJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} · ${url}`);
  return res.json();
}

async function fetchAllStats() {
  const out = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const rows = await getJson(`${SUPABASE_URL}/rest/v1/chaldea_stats?select=*`, {
      headers: {
        apikey: SUPABASE_SECRET_KEY,
        Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
        Range: `${from}-${from + pageSize - 1}`,
        Prefer: 'count=exact'
      }
    });
    out.push(...(Array.isArray(rows) ? rows : []));
    if (!Array.isArray(rows) || rows.length < pageSize) break;
  }
  return out;
}

async function fetchXp() {
  try {
    return await getJson(`${SUPABASE_URL}/rest/v1/chaldea_xp?select=*`, {
      headers: {apikey: SUPABASE_SECRET_KEY, Authorization: `Bearer ${SUPABASE_SECRET_KEY}`}
    });
  } catch (error) {
    console.warn(`XP snapshot indisponible : ${error.message}`);
    return [];
  }
}

function classKey(name) {
  const s = String(name || '').toLowerCase().replace(/[^a-z]/g,'');
  const map={saber:'Saber',archer:'Archer',lancer:'Lancer',rider:'Rider',caster:'Caster',assassin:'Assassin',berserker:'Berserker',ruler:'Ruler',avenger:'Avenger',alterego:'Alter Ego',mooncancer:'Moon Cancer',foreigner:'Foreigner',pretender:'Pretender',shielder:'Shielder',beast:'Beast'};
  return map[s] || 'Extra';
}
function rarityCode(n) {
  const r = Number(n);
  return r >= 5 ? 'SSR' : r === 4 ? 'SR' : r === 3 ? 'R' : r === 2 ? 'UC' : 'C';
}
function isMash(x) { return Number(x.collectionNo) === 1 || String(x.name||'').toLowerCase() === 'mash kyrielight'; }

const state = JSON.parse(await fs.readFile(INITIAL_PATH, 'utf8'));
const atlas = await getJson(ATLAS_URL, {headers:{'User-Agent':'Chaldea-Command snapshot bot'}});
const atlasList = Array.isArray(atlas) ? atlas : (Array.isArray(atlas?.data) ? atlas.data : []);
if (!atlasList.length) throw new Error('Atlas NA n’a renvoyé aucun Servant. Snapshot interrompu.');

const byCollection = new Map(atlasList.map(x => [Number(x.collectionNo), x]));
const roster = [];
const seen = new Set();

for (const r of state.roster || []) {
  const a = byCollection.get(Number(r.id));
  if (!a) continue;
  if (NA_BLOCKED_IDS.has(Number(r.id))) continue;
  if (classKey(a.className) === 'Extra') continue;
  if (FUTURE_NAMES.has(String(a.name || ''))) continue;
  roster.push({
    ...r,
    id: Number(a.collectionNo),
    name: a.name,
    class: classKey(a.className),
    rarity: rarityCode(a.rarity),
    atlasId: Number(a.id),
    nonCounted: isMash(a)
  });
  seen.add(Number(a.collectionNo));
}

for (const a of atlasList) {
  const id = Number(a.collectionNo);
  if (!id || seen.has(id) || NA_BLOCKED_IDS.has(id)) continue;
  if (classKey(a.className) === 'Extra') continue;
  if (FUTURE_NAMES.has(String(a.name || ''))) continue;
  roster.push({
    id,
    name: a.name,
    class: classKey(a.className),
    rarity: rarityCode(a.rarity),
    attribute: a.attribute || '',
    cardType: a.cardType || '',
    atlasId: Number(a.id),
    nonCounted: isMash(a)
  });
  seen.add(id);
}
roster.sort((a,b)=>a.id-b.id);
for (const forced of FORCE_INCLUDE) {
  if (!seen.has(Number(forced.id)) && !NA_BLOCKED_IDS.has(Number(forced.id))) roster.push({...forced});
}
roster.sort((a,b)=>a.id-b.id);

const freshStats = Object.fromEntries(PLAYERS.map(p => [p, {displayName:PLAYER_LABELS[p], stats:{}}]));
for (const row of await fetchAllStats()) {
  const p = String(row.player_key);
  if (!freshStats[p]) continue;
  const id = Number(row.servant_id);
  if (!id) continue;
  freshStats[p].stats[String(id)] = {
    level: row.level ?? null,
    bond: row.bond ?? null,
    grail: row.grail ?? null,
    fouHp: row.fou_hp ?? null,
    fouAtk: row.fou_atk ?? null,
    np: row.np ?? null,
    skills: Array.isArray(row.skills) ? row.skills.slice(0,3) : [null,null,null],
    appendSkills: Array.isArray(row.append_skills) ? row.append_skills.slice(0,5) : [null,null,null,null,null],
    servantCoins: row.servant_coins ?? null
  };
}
for (const p of PLAYERS) {
  const xp = (await fetchXp()).find(x => String(x.player_key) === p);
  freshStats[p].xp = xp?.inventory || state.players?.[p]?.xp || {};
}

state.version = '25.0-snapshot';
state.source = 'Supabase cloud snapshot + Atlas Academy NA catalogue';
state.region = 'NA';
state.roster = roster;
state.players = freshStats;
state.meta = {...(state.meta || {}), cloudSnapshotAt: new Date().toISOString()};

await fs.writeFile(INITIAL_PATH, JSON.stringify(state, null, 2) + '\n', 'utf8');
console.log(`Snapshot écrit : ${roster.length} Servants · ${PLAYERS.map(p => `${p}=${Object.keys(freshStats[p].stats).length}`).join(', ')}`);
