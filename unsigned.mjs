import fs from 'node:fs';import {Interface,getAddress} from 'ethers';import {fileURLToPath} from 'node:url';
export function unsigned(compiled,operation,args){
 const a=x=>{const v=getAddress(x);if(v==='0x0000000000000000000000000000000000000000')throw Error('Zero address');return v;};
 const artifacts=compiled.contracts;const inter=n=>new Interface(artifacts[n].abi);let chainId,to=null,data;
 const make=(n,values)=>'0x'+artifacts[n].evm.bytecode.object+inter(n).encodeDeploy(values).slice(2);
 if(operation==='book'){if(args.length)throw Error('book takes no arguments');chainId=84532;data=make('DeadlineBook',[]);}
 else if(operation==='reactive'){if(args.length!==1)throw Error('reactive needs actual BOOK address');chainId=5318007;data=make('DueGuard',[a(args[0])]);}
 else if(operation==='inbox'){if(args.length!==2)throw Error('inbox needs actual BOOK REACTIVE addresses');chainId=84532;data=make('DeadlineInbox',[a(args[0]),a(args[1])]);}
 else if(operation==='activate'){if(args.length!==2)throw Error('activate needs actual REACTIVE INBOX addresses');chainId=5318007;to=a(args[0]);data=inter('DueGuard').encodeFunctionData('setInbox',[a(args[1])]);}
 else if(operation==='schedule'){
  if(args.length!==3||!/^0x[0-9a-fA-F]{64}$/.test(args[1])||/^0x0{64}$/.test(args[1]))throw Error('schedule needs actual BOOK TASK_ID ISO_DEADLINE');
  const ms=Date.parse(args[2]);if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(args[2])||!Number.isFinite(ms)||new Date(ms).toISOString().replace('.000Z','Z')!==args[2]||ms<=Date.now()||ms>Date.now()+365*86400000)throw Error('Deadline must be future UTC within one year');
  chainId=84532;to=a(args[0]);data=inter('DeadlineBook').encodeFunctionData('schedule',[args[1],Math.floor(ms/1000)]);
 }else throw Error('Operations: book, reactive BOOK, inbox BOOK REACTIVE, activate REACTIVE INBOX, schedule BOOK TASK_ID ISO_DEADLINE');
 return {chainId,operation,to,data,value:'0x0',signed:false,broadcast:false,warning:'Unsigned preparation only. Owner must verify exact network/addresses and personally approve testnet signing. Service funding and actual gas costs require separate checks; no mainnet or paid resources.'};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){try{const c=JSON.parse(fs.readFileSync((process.env.STATE_DIRECTORY||'build')+'/contracts.json'));const[op,...args]=process.argv.slice(2);console.log(JSON.stringify(unsigned(c,op,args),null,2));}catch(e){console.error(e.message);process.exitCode=1;}}