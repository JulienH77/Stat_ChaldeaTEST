const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const root=path.join(__dirname,'..');const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
async function runTool(name,state,fetch){
 let result=null;const stop=Symbol('exit');let source=fs.readFileSync(path.join(root,'tools',name),'utf8').replace("import fs from 'node:fs/promises';",'').replaceAll('import.meta.url',"'file:///mock/tools/tool.mjs'");
 const fakeFs={readFile:async()=>JSON.stringify(state),writeFile:async(_url,data)=>{result=JSON.parse(data)}};
 const process={env:{SUPABASE_URL:'https://mock.test',SUPABASE_SECRET_KEY:'test-only-placeholder'},exit(){throw stop}};
 try{await new AsyncFunction('fs','fetch','process','console',source)(fakeFs,fetch,process,{log(){},warn(){}})}catch(error){if(error!==stop)throw error}return result;
}
const response=value=>({ok:true,json:async()=>value});
test('snapshot reads every stats page, fetches XP once and does not rewrite unchanged data',async()=>{
 const rows=Array.from({length:1254},(_,i)=>({player_key:['julien','yanis','attmann'][Math.floor(i/418)],servant_id:i%418+1,level:90,skills:[1,2,3]}));let xpReads=0;
 const mock=async(url,options)=>{if(url.includes('basic_servant'))return response([{id:100100,collectionNo:2,name:'Altria Pendragon',className:'saber',rarity:5}]);if(url.includes('chaldea_xp')){xpReads++;return response([])}assert.match(url,/order=player_key.asc,servant_id.asc/);const [from,to]=options.headers.Range.split('-').map(Number);return response(rows.slice(from,to+1));};
 const input={roster:[],players:{},meta:{}};const next=await runTool('sync-initial-state.mjs',input,mock);assert.equal(xpReads,1);assert.equal(Object.keys(next.players.attmann.stats).length,418);xpReads=0;assert.equal(await runTool('sync-initial-state.mjs',next,mock),null);assert.equal(xpReads,1);
});
test('snapshot aborts on a failed stats page without writing truncated data',async()=>{
 const input={roster:[],players:{},meta:{}};const mock=async url=>url.includes('basic_servant')?response([{id:100100,collectionNo:2,name:'A',className:'saber',rarity:5}]):({ok:false,status:503,statusText:'Offline'});await assert.rejects(runTool('sync-initial-state.mjs',input,mock),/503/);
});
test('cleared Friend IDs remove stale support images and GUIDs',async()=>{
 const input={players:{julien:{code:'123456789',guid:'old',deckImages:{1:'https://old.test/image.png'}}}};const next=await runTool('sync-support-lists.mjs',input,async()=>response([{player_key:'julien',friend_id:null}]));assert.equal(next.players.julien.code,'');assert.equal(next.players.julien.guid,null);assert.deepEqual(next.players.julien.deckImages,{});
});
test('unchanged support snapshot does not generate timestamp-only commits',async()=>{
 const input={players:{}};const mock=async()=>response([]);const next=await runTool('sync-support-lists.mjs',input,mock);assert.equal(await runTool('sync-support-lists.mjs',next,mock),null);
});
