import test from 'node:test';import assert from 'node:assert/strict';import {audit} from '../audit-loop.mjs';import {unsigned} from '../unsigned.mjs';import {compiled,id,iface} from './evm.mjs';
import {bundle} from './receipt-fixture.mjs';

test('correlated receipt fixture is NOT authenticated/accepted chain execution',()=>{const r=audit(bundle());assert.equal(r.structure_consistent,true);assert.equal(r.contest_execution_verified,false);assert.equal(r.cryptographic_verification,false);assert.match(r.mode,/synthetic/);assert.equal(r.callback_lateness_seconds,'1');});
for(const stage of ['origin','reactive','callback'])test('wrong network '+stage,()=>{const b=bundle();b[stage].chainId='1';assert.throws(()=>audit(b),/testnet/);});
test('failed callback status never qualifies',()=>{const b=bundle();b.callback.receipt.status='0x0';assert.throws(()=>audit(b),/failed/);});
test('receipt hash substitution',()=>{const b=bundle();b.callback.receipt.transactionHash=id('other');assert.throws(()=>audit(b),/mismatch/);});
test('block substitution',()=>{const b=bundle();b.origin.block.hash=id('other');assert.throws(()=>audit(b),/mismatch/);});
test('removed log rejected',()=>{const b=bundle();b.origin.receipt.logs[0].removed=true;assert.throws(()=>audit(b),/Removed/);});
test('missing destination Due event is not success',()=>{const b=bundle();b.callback.receipt.logs=[];assert.throws(()=>audit(b),/matching/);});
test('duplicate Due event not silently chosen',()=>{const b=bundle();b.callback.receipt.logs.push({...b.callback.receipt.logs[0]});assert.throws(()=>audit(b),/exactly one/);});
test('foreign transaction target rejected',()=>{const b=bundle();b.origin.transaction.to=b.contracts.inbox;assert.throws(()=>audit(b),/target/);});
test('different task or revision cannot be correlated',()=>{const b=bundle(),e=iface('DeadlineInbox').encodeEventLog(iface('DeadlineInbox').getEvent('Due'),[id('different'),2,1100,1101]);Object.assign(b.callback.receipt.logs[0],e);assert.throws(()=>audit(b),/correlation/);});
test('forged observed flag cannot authenticate imported receipt',()=>{const b=bundle();delete b.synthetic;b.verified=true;b.originVerified=true;assert.equal(audit(b).contest_execution_verified,false);});
test('unsigned preparation has exact testnet bytecode and never signs',()=>{const r=unsigned(compiled,'book',[]);assert.equal(r.chainId,84532);assert.equal(r.signed,false);assert.equal(r.broadcast,false);assert.equal(r.to,null);assert.ok(r.data.startsWith('0x'+compiled.contracts.DeadlineBook.evm.bytecode.object));});
test('unsigned deployment missing/zero address fails closed',()=>{assert.throws(()=>unsigned(compiled,'reactive',[]));assert.throws(()=>unsigned(compiled,'reactive',['0x'+'0'.repeat(40)]));assert.throws(()=>unsigned(compiled,'inbox',['bad','bad']));});
test('unsigned activation targets actual reactive and encodes actual inbox',()=>{const a='0x1000000000000000000000000000000000000001',b='0x2000000000000000000000000000000000000002',r=unsigned(compiled,'activate',[a,b]);assert.equal(r.chainId,5318007);assert.equal(r.to,a);assert.equal(iface('DueGuard').decodeFunctionData('setInbox',r.data)[0],b);});
test('no arbitrary command/mainnet path in unsigned generator',()=>assert.throws(()=>unsigned(compiled,'mainnet',[]),/Operations/));
test('unsigned schedule rejects invented missing/past deadline',()=>{const a='0x1000000000000000000000000000000000000001';assert.throws(()=>unsigned(compiled,'schedule',[a,id('x'),'2020-01-01T00:00:00Z']),/future/);assert.throws(()=>unsigned(compiled,'schedule',[a,'invalid','2030-01-01T00:00:00Z']));});