import {id,iface} from './evm.mjs';
export function bundle(){
 const contracts={book:'0x1000000000000000000000000000000000000001',reactive:'0x2000000000000000000000000000000000000002',inbox:'0x3000000000000000000000000000000000000003'},b={synthetic:true,contracts};
 const task=id('task');for(const[stage,n,name,event,args,chain,timestamp]of [['origin',1,'DeadlineBook','Schedule',[task,1,1100,true],84532,1000],['reactive',2,'DueGuard','Requested',[task,1,1],5318007,1100],['callback',3,'DeadlineInbox','Due',[task,1,1100,1101],84532,1101]]){
  const to=contracts[{origin:'book',reactive:'reactive',callback:'inbox'}[stage]],hash=id(stage),bh=id('block'+stage),eventLog=iface(name).encodeEventLog(iface(name).getEvent(event),args),number='0x'+n.toString(16);
  b[stage]={chainId:String(chain),transaction:{hash,to,blockHash:bh,blockNumber:number},block:{hash:bh,number,timestamp:String(timestamp)},receipt:{transactionHash:hash,to,blockHash:bh,blockNumber:number,status:'0x1',logs:[{address:to,transactionHash:hash,blockHash:bh,blockNumber:number,removed:false,...eventLog}]}};
 }return b;
}