import fs from 'node:fs';import assert from 'node:assert/strict';import {createVM} from '@ethereumjs/vm';import {Common,Mainnet,Hardfork} from '@ethereumjs/common';import {Account,createAddressFromString,hexToBytes,bytesToHex} from '@ethereumjs/util';import {createBlock} from '@ethereumjs/block';import {Interface,AbiCoder,id,zeroPadValue,toBeHex} from 'ethers';
export const compiled=JSON.parse(fs.readFileSync((process.env.STATE_DIRECTORY||'build')+'/contracts.json'));
export const abi=AbiCoder.defaultAbiCoder();export {id};
export const OWNER='0x1000000000000000000000000000000000000001',OTHER='0x2000000000000000000000000000000000000002',SYSTEM='0x8888888888888888888888888888888888888888',PROXY='0x476F44b11F5C942c58f4c8E3d0300E5710743585',CRON='0x0000000000000000000000000000000000fffFfF';
export async function chain(chainId){
 const common=new Common({chain:{...Mainnet,name:'local-simulation-'+chainId,chainId},hardfork:Hardfork.Shanghai});const vm=await createVM({common});
 await vm.stateManager.putAccount(createAddressFromString(OWNER),new Account(0n,10n**24n));return {vm,common,now:1000n};
}
function block(c){return createBlock({header:{number:100n,timestamp:c.now,gasLimit:30000000n,baseFeePerGas:1n}},{common:c.common,skipConsensusFormatValidation:true});}
export function artifact(name){return compiled.contracts[name];}
export function iface(name){return new Interface(artifact(name).abi);}
export async function deploy(c,name,args=[]){
 const data='0x'+artifact(name).evm.bytecode.object+iface(name).encodeDeploy(args).slice(2);
 const r=await c.vm.evm.runCall({caller:createAddressFromString(OWNER),origin:createAddressFromString(OWNER),data:hexToBytes(data),gasLimit:10000000n,block:block(c)});
 assert.equal(r.execResult.exceptionError,undefined,'deploy '+name+' '+bytesToHex(r.execResult.returnValue));return r.createdAddress.toString();
}
export async function invoke(c,address,name,method,args=[],sender=OWNER,allowFailure=false){
 const r=await c.vm.evm.runCall({caller:createAddressFromString(sender),origin:createAddressFromString(sender),to:createAddressFromString(address),data:hexToBytes(iface(name).encodeFunctionData(method,args)),gasLimit:900000n,block:block(c)});
 if(!allowFailure)assert.equal(r.execResult.exceptionError,undefined,'call '+name+'.'+method+' '+bytesToHex(r.execResult.returnValue));return r;
}
export async function read(c,address,name,method,args=[]){const r=await invoke(c,address,name,method,args);return iface(name).decodeFunctionResult(method,bytesToHex(r.execResult.returnValue));}
export async function setup(){
 const base=await chain(84532),lasna=await chain(5318007);
 await lasna.vm.stateManager.putAccount(createAddressFromString(SYSTEM),new Account());
 await lasna.vm.stateManager.putCode(createAddressFromString(SYSTEM),hexToBytes('0x'+artifact('MockSystem').evm.deployedBytecode.object));
 const book=await deploy(base,'DeadlineBook');const reactive=await deploy(lasna,'DueGuard',[book]);const inbox=await deploy(base,'DeadlineInbox',[book,reactive]);await invoke(lasna,reactive,'DueGuard','setInbox',[inbox]);
 return {base,lasna,book,reactive,inbox};
}
export function scheduled(f,task=id('task'),revision=1n,dueAt=1100n,enabled=true){
 return [84532n,f.book,BigInt(id('Schedule(bytes32,uint64,uint64,bool)')),BigInt(task),0n,0n,abi.encode(['uint256','uint256','uint256'],[revision,dueAt,enabled?1:0]),10n,2n,1n,2n,0n];
}
export function cron(){return [5318007n,CRON,BigInt('0xb49937fb8970e19fd46d48f7e3fb00d659deac0347f79cd7cb542f0fc1503c70'),0n,0n,0n,abi.encode(['uint256'],[100]),100n,1n,1n,2n,0n];}
export async function react(f,log,sender=SYSTEM,fail=false){return invoke(f.lasna,f.reactive,'DueGuard','react',[log],sender,fail);}
export async function tick(f,now=1200n){f.lasna.now=now;return react(f,cron());}
export async function requests(f){return (await read(f.lasna,SYSTEM,'MockSystem','requests'))[0];}
export async function deliver(f,sender=PROXY,reactive=f.reactive,fail=false){
 const raw=(await read(f.lasna,SYSTEM,'MockSystem','lastPayload'))[0];const parsed=iface('DeadlineInbox').decodeFunctionData('notify',raw);
 return invoke(f.base,f.inbox,'DeadlineInbox','notify',[reactive,...parsed.slice(1)],sender,fail);
}
export async function trueSourceEvent(f,method,args){
 const result=await invoke(f.base,f.book,'DeadlineBook',method,args);
 const event=result.execResult.logs.find(x=>bytesToHex(x[1][0])===id('Schedule(bytes32,uint64,uint64,bool)'));
 assert.ok(event,'actual Book bytecode emitted event');const [,topics,data]=event;
 return [84532n,f.book,BigInt(bytesToHex(topics[0])),BigInt(bytesToHex(topics[1])),0n,0n,bytesToHex(data),10n,2n,1n,2n,0n];
}
