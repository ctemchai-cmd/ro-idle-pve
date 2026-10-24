// Disposable loopback fixture: real API/receipts, in-memory synthetic save; never a product route.
import {createServer} from 'node:http';
import {shopBatchFixture} from '../../tests/game/shop-batch-fixture.ts';
if(process.env.RO_SHOP_UI_TEST!=='1')throw Error('TEST_ONLY');
let fixture=shopBatchFixture();
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url??'/', 'http://127.0.0.1:7495');
  if(url.pathname==='/__test/reset'){fixture=shopBatchFixture(url.searchParams.get('mode')??'funded');res.setHeader('content-type','application/json');res.end('{}');return;}
  if(url.pathname==='/__test/state'){res.setHeader('content-type','application/json');res.end(JSON.stringify({state:fixture.state,revision:fixture.revision,writes:fixture.writes}));return;}
  const chunks:Buffer[]=[];for await(const chunk of req)chunks.push(Buffer.from(chunk));
  const headers=new Headers();for(const[k,v]of Object.entries(req.headers))if(v)headers.set(k,Array.isArray(v)?v.join(','):v);
  const response=await fixture.api.fetch(new Request(url,{method:req.method,headers,...(chunks.length?{body:Buffer.concat(chunks)}:{})}));
  res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch{res.writeHead(500,{'content-type':'application/json'});res.end('{"code":"FIXTURE_ERROR"}');}
});
server.listen(7495,'127.0.0.1',()=>process.stdout.write('shop fixture ready:7495\n'));
