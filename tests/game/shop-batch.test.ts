import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{gunzipSync}from'node:zlib';import{randomUUID}from'node:crypto';
import{shopCatalog,shopOffer,shopMaxQuantity,shopQuote,applyShopPurchase}from'../../src/domain/progression/shop.ts';import{migrateAccountState}from'../../src/domain/account/migrate.ts';import{validateContent}from'../../src/content/loader.ts';import raw from'../../src/generated/content.json';import{content}from'./combat-fixtures.ts';import{shopBatchFixture}from'./shop-batch-fixture.ts';
const before=JSON.parse(gunzipSync(readFileSync(new URL('../../plan/evidence/task-139/economy-before.json.gz',import.meta.url))).toString());
test('D167 shop scope is exact: grants and non-gold prices unchanged; only requested gold prices, limits and batch maximum change',()=>{
 const current=JSON.parse(readFileSync(new URL('../../plan/data/economy.json',import.meta.url),'utf8'));delete current.shop;const old=structuredClone(before);delete old.shop;assert.deepEqual(current,old);
 for(const offer of shopCatalog(content).offers){const prior=before.shop.offers.find((o:{id:string})=>o.id===offer.id);assert.deepEqual(offer.grant,prior.grant);assert.deepEqual(offer.consumable_grant,prior.consumable_grant);if(prior.price.gold)assert.ok(offer.price.gold!>prior.price.gold);else assert.deepEqual(offer.price,prior.price);assert.equal(offer.daily_limit,offer.id==='crystal_exchange'?20:offer.id.endsWith('_scroll')?99:10);}
 assert.equal(shopOffer('crystal_exchange',content).price.gold,25000);assert.equal(shopOffer('crystal_exchange',content).grant.crystal,10);assert.equal(shopCatalog(content).max_quantity_per_command,99);
});
test('D167 quote/max are pure and choose only affordable remaining quantities; purchased1 today leaves19, tomorrow20',()=>{
 const f=shopBatchFixture('partial'),s=f.state,b=structuredClone(s);assert.equal(shopMaxQuantity(s,'crystal_exchange',f.day,content),19);assert.deepEqual(shopQuote(s,'crystal_exchange',19,f.day,content).cost,{gold:475000});assert.equal(shopMaxQuantity(s,'crystal_exchange','2099-01-01',content),20);assert.deepEqual(s,b);
 const p=shopBatchFixture('poor');assert.equal(shopMaxQuantity(p.state,'crystal_exchange',p.day,content),2);assert.equal(shopMaxQuantity(shopBatchFixture('soldout').state,'crystal_exchange',f.day,content),0);
 const migrated=migrateAccountState(s,content).state;assert.deepEqual(migrated.shop,s.shop);assert.deepEqual(migrated.wallet,s.wallet);
});
test('D167 batches20/99 grant exact resources and stock once; insufficient/limit/invalid/overflow do not partially spend',()=>{
 const f=shopBatchFixture(),s=f.state;applyShopPurchase(s,'crystal_exchange',20,f.day,content);assert.equal(s.wallet.gold,1500000);assert.equal(s.wallet.crystal,300);assert.equal(s.shop.purchases.crystal_exchange,20);applyShopPurchase(s,'fire_scroll',99,f.day,content);assert.equal(s.battle_supplies!.stock.fire_scroll,99);assert.equal(s.wallet.gold,906000);
 for(const[id,n,code]of[['crystal_exchange',1,'SHOP_LIMIT_REACHED'],['exp_pack',0,'INVALID_SHOP_QUANTITY'],['fire_scroll',100,'INVALID_SHOP_QUANTITY'],['no_such_offer',1,'SHOP_OFFER_UNKNOWN']]as const){const before=structuredClone(s);assert.throws(()=>applyShopPurchase(s,id,n,f.day,content),new RegExp(code));assert.deepEqual(s,before);}
 const p=shopBatchFixture('poor'),poor=p.state,b=structuredClone(poor);assert.throws(()=>applyShopPurchase(poor,'crystal_exchange',3,p.day,content),/INSUFFICIENT_RESOURCES/);assert.deepEqual(poor,b);
 const overflow=shopBatchFixture('overflow'),o=overflow.state;assert.equal(shopMaxQuantity(o,'fire_scroll',overflow.day,content),2);assert.equal(shopMaxQuantity(o,'crystal_exchange',overflow.day,content),0);const old=structuredClone(o);assert.throws(()=>applyShopPurchase(o,'fire_scroll',3,overflow.day,content),/RESOURCE_OVERFLOW/);assert.deepEqual(o,old);
});
test('D167 real API command path returns one signed checkpoint/revision per batch and same UUID replay never buys again',async()=>{
 const f=shopBatchFixture(),command={type:'shop.buy',params:{offer_id:'crystal_exchange',quantity:20},request_id:randomUUID(),expected_revision:1,schema_version:1,...f.rules.versions};
 const call=(c:unknown)=>f.api.fetch(new Request('http://localhost/api/commands',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(c)}));
 const one=await call(command),body=await one.json();assert.equal(one.status,200);assert.equal(body.receipt.outcome,'committed');assert.equal(f.writes,1);assert.equal(f.revision,2);const state=f.state;
 const replay=await call(command);assert.equal(replay.status,200);assert.deepEqual((await replay.json()).receipt,body.receipt);assert.equal(f.writes,1);assert.deepEqual(f.state,state);
 const denied=await call({...command,request_id:randomUUID(),expected_revision:2});assert.equal((await denied.json()).receipt.result.code,'SHOP_LIMIT_REACHED');assert.equal(f.writes,1);assert.deepEqual(f.state,state);
 const over=await call({...command,request_id:randomUUID(),expected_revision:2,params:{offer_id:'fire_scroll',quantity:100}});assert.equal(over.status,400);assert.equal(f.writes,1);
});
test('D167 loader rejects malformed shop prices, duplicate ids and a batch beyond the command schema',()=>{
 for(const mutate of[(x:any)=>x.documents['economy.json'].shop.offers[0].price.gold=-1,(x:any)=>x.documents['economy.json'].shop.offers[0].daily_limit=0,(x:any)=>x.documents['economy.json'].shop.max_quantity_per_command=100,(x:any)=>x.documents['economy.json'].shop.offers.push(x.documents['economy.json'].shop.offers[0])]){const x=structuredClone(raw);mutate(x);assert.equal(validateContent(x).ok,false);}
});
