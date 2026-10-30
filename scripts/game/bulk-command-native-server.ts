/** Disposable loopback-only API fixture for the phone pending-command regression. */
import { createServer } from 'node:http';
import { bulkCommandFixture } from '../../tests/game/bulk-command-fixtures.ts';
const port=Number(process.env.RO_BULK_NATIVE_PORT);
if(process.env.RO_BULK_NATIVE!=='1'||!Number.isInteger(port)||port<7500||port>7599)throw new Error('ISOLATED_BULK_FIXTURE_REQUIRED');
const fixture=bulkCommandFixture();let oldLimit=true;const sent:string[]=[];
createServer(async(incoming,outgoing)=>{
 try{
  const path=incoming.url??'/';
  if(path==='/fixture'){outgoing.setHeader('content-type','application/json');outgoing.end(JSON.stringify({checkpoint:fixture.checkpoint(),command:fixture.command,owner:fixture.owner,id:fixture.id,slot:fixture.slot}));return;}
  if(path==='/upgrade'){oldLimit=false;outgoing.end('ok');return;}
  if(path==='/summary'){outgoing.setHeader('content-type','application/json');outgoing.end(JSON.stringify({writes:fixture.writes,items:fixture.state.inventory.length,revision:fixture.context.save!.revision,sent,oldLimit}));return;}
  if(!path.startsWith('/api/')){outgoing.writeHead(404);outgoing.end();return;}
  const chunks:Buffer[]=[];for await(const chunk of incoming)chunks.push(Buffer.from(chunk));const body=Buffer.concat(chunks),text=body.toString();
  if(incoming.method==='POST'){
   sent.push(JSON.parse(text).request_id);
   if(oldLimit&&text.length>16384){outgoing.writeHead(413,{'content-type':'application/json'});outgoing.end('{"code":"COMMAND_TOO_LARGE"}');return;}
  }
  const headers=new Headers();for(const [k,v]of Object.entries(incoming.headers))if(v)headers.set(k,Array.isArray(v)?v.join(','):v);
  const response=await fixture.api.fetch(new Request('http://127.0.0.1:'+port+path,{method:incoming.method,headers,...(['GET','HEAD'].includes(incoming.method??'GET')?{}:{body})}));
  outgoing.writeHead(response.status,Object.fromEntries(response.headers));outgoing.end(Buffer.from(await response.arrayBuffer()));
 }catch{outgoing.writeHead(500,{'content-type':'application/json'});outgoing.end('{"code":"FIXTURE_FAILURE"}');}
}).listen(port,'127.0.0.1',()=>console.log('isolated bulk fixture listening on '+port));
