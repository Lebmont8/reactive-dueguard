import fs from 'node:fs';import {Interface,getAddress} from 'ethers';import {fileURLToPath} from 'node:url';
const hex32=x=>typeof x==='string'&&/^0x[0-9a-fA-F]{64}$/.test(x);
const num=x=>{if(typeof x!=='string'||! /^(?:0x[0-9a-fA-F]+|[0-9]+)$/.test(x)||x.length>66)throw Error('Invalid unsigned integer');return BigInt(x);};
const addr=x=>getAddress(x).toLowerCase();
const events={origin:new Interface(['event Schedule(bytes32 indexed taskId,uint64 revision,uint64 dueAt,bool enabled)']),reactive:new Interface(['event Requested(bytes32 indexed id,uint64 revision,uint8 attempt)']),callback:new Interface(['event Due(bytes32 indexed taskId,uint64 revision,uint64 dueAt,uint256 deliveredAt)'])};
export function audit(bundle){
 if(!bundle||typeof bundle!=='object')throw Error('Expected captured receipt bundle');
 const conf=bundle.contracts;if(!conf)throw Error('Missing actual contract addresses');const addresses={origin:addr(conf.book),reactive:addr(conf.reactive),callback:addr(conf.inbox)};
 if(Object.values(addresses).some(x=>/^0x0{40}$/.test(x)))throw Error('Zero contract address');
 const out={};for(const [stage,chainId]of [['origin',84532n],['reactive',5318007n],['callback',84532n]]){
  const x=bundle[stage];if(!x||num(x.chainId)!==chainId)throw Error('Wrong or missing testnet for '+stage);
  const {transaction:tx,receipt:r,block:b}=x;if(!tx||!r||!b||!hex32(r.transactionHash)||!hex32(r.blockHash))throw Error('Missing primary receipt identities');
  if(tx.hash!==r.transactionHash||tx.blockHash!==r.blockHash||b.hash!==r.blockHash||num(b.number)!==num(r.blockNumber)||num(tx.blockNumber)!==num(r.blockNumber))throw Error('Receipt/transaction/block mismatch');
  if(num(r.blockNumber)<1n||num(r.status)!==1n)throw Error('Uncommitted or failed receipt');
  if(addr(tx.to)!==addresses[stage]||addr(r.to)!==addresses[stage])throw Error('Wrong transaction target');
  if(!Array.isArray(r.logs)||r.logs.length>256)throw Error('Invalid log array');const matches=[];
  for(const l of r.logs){
   if(l.removed!==false||l.transactionHash!==r.transactionHash||l.blockHash!==r.blockHash||num(l.blockNumber)!==num(r.blockNumber))throw Error('Removed or mismatched log');
   if(addr(l.address)!==addresses[stage])continue;
   try{const e=events[stage].parseLog({topics:l.topics,data:l.data});if(e)matches.push(e.args);}catch{}
  }
  if(matches.length!==1)throw Error('Need exactly one matching '+stage+' event');
  out[stage]={hash:r.transactionHash,event:matches[0],timestamp:num(b.timestamp)};
 }
 const o=out.origin.event,re=out.reactive.event,c=out.callback.event;
 if(!o.enabled||o.revision===0n||o.taskId!==re.id||o.taskId!==c.taskId||o.revision!==re.revision||o.revision!==c.revision||o.dueAt!==c.dueAt)throw Error('Origin/request/callback task correlation failed');
 if(re.attempt<1n||re.attempt>3n||c.deliveredAt<o.dueAt||c.deliveredAt!==out.callback.timestamp||out.origin.timestamp>o.dueAt)throw Error('Impossible deadline/delivery relation');
 return {schema:1,mode:bundle.synthetic===true?'synthetic fixture — NOT live chain proof':'imported receipt structure — source not authenticated',structure_consistent:true,cryptographic_verification:false,contest_execution_verified:false,task_id:o.taskId,revision:String(o.revision),due_at:String(o.dueAt),delivered_at:String(c.deliveredAt),callback_lateness_seconds:String(c.deliveredAt-o.dueAt),origin_to_callback_timestamp_delta_seconds:String(out.callback.timestamp-out.origin.timestamp),clock_warning:'Cross-chain block timestamps are not wall-clock end-to-end latency measurements.',hashes:Object.fromEntries(Object.entries(out).map(([k,v])=>[k,v.hash]))};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){try{const f=process.argv[2];if(!f||fs.statSync(f).size>1048576)throw Error('Usage: node audit-loop.mjs bundle.json (<=1MiB)');console.log(JSON.stringify(audit(JSON.parse(fs.readFileSync(f,'utf8'))),null,2));}catch(e){console.error(e.message);process.exitCode=1;}}