import fs from 'node:fs/promises';

const ROOT = new URL('../', import.meta.url);
const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, '');
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const OUT = new URL('./data/support-lists.json', ROOT);
const PLAYERS = ['julien', 'yanis', 'attmann'];
const SUPPORT_DECK_BITS = [1, 2, 4, 8, 16, 32];

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  throw new Error('SUPABASE_URL et SUPABASE_SECRET_KEY doivent être définis dans les secrets GitHub.');
}

async function getJson(url) {
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
      Accept: 'application/json'
    }
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} · ${url}`);
  return res.json();
}

async function rayshiftDecks(friendId) {
  const id = String(friendId || '').replace(/\D/g, '');
  if (!id) return null;
  const url = `https://rayshift.io/api/v1/support/decks/na/${id}`;
  const data = await fetch(`https://rayshift.io/api/v1/support/decks/na/${id}`, {
    headers: { 'User-Agent': 'Chaldea-Command Support Snapshot/1.0', Accept: 'application/json' }
  }).then(async res => {
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} · ${url}`);
    return res.json();
  });
  if (Number(data?.status) !== 200 || !data?.response) return { code: id, name: '', lastUpdate: null, lastLogin: null, guid: null, decksPresent: [], decks: {}, message: data?.message || 'not found' };
  const r = data.response;
  const code = String(r.code || id);
  const guid = r.guid ? String(r.guid) : '';
  const decks = {};
  for (const [flag, path] of Object.entries(r.decks || {})) {
    decks[String(flag)] = String(path).startsWith('http') ? path : `https://rayshift.io${path}`;
  }
  const decksPresent = Array.isArray(r.decksPresent) ? r.decksPresent.map(Number).filter(Boolean) : Object.keys(decks).map(Number);
  const deckImages = Object.fromEntries(SUPPORT_DECK_BITS.map(bit => [String(bit), decksPresent.includes(bit) && guid ? `https://rayshift.io/static/images/deck-gen/na/${code}/${encodeURIComponent(guid)}/${bit}/9.png` : '']));
  return {
    code,
    name: r.name || '',
    lastUpdate: r.lastUpdate || null,
    lastLogin: r.lastLogin || null,
    guid: guid || null,
    decksPresent,
    decks,
    deckImages,
    message: data.message || 'ok'
  };
}

const current = JSON.parse(await fs.readFile(OUT, 'utf8').catch(() => '{"version":2,"source":"Rayshift public API","region":"NA","players":{}}'));
const profiles = await getJson(`${SUPABASE_URL}/rest/v1/chaldea_support_profiles?select=player_key,friend_id`);
const byPlayer = new Map((profiles || []).map(x => [String(x.player_key), String(x.friend_id || '')]));
const next = { ...current, version: 2, source: 'Rayshift public API', region: 'NA', updatedAt: new Date().toISOString(), players: { ...(current.players || {}) } };

for (const p of PLAYERS) {
  const friendId = byPlayer.get(p) || current.players?.[p]?.code || '';
  try {
    const data = await rayshiftDecks(friendId);
    if (data) next.players[p] = { ...data };
    else next.players[p] = { ...(next.players[p] || {}), code: friendId, decksPresent: [], decks: {} };
  } catch (error) {
    console.warn(`Rayshift ${p} indisponible : ${error.message}`);
  }
}

await fs.writeFile(OUT, JSON.stringify(next, null, 2) + '\n', 'utf8');
console.log(`Support snapshot mis à jour : ${PLAYERS.map(p => `${p}=${next.players[p]?.decksPresent?.length || 0}`).join(', ')}`);
