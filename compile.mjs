import fs from 'node:fs';import solc from 'solc';import crypto from 'node:crypto';
export function compile(){
 const sources={};for(const dir of ['contracts','test'])for(const f of fs.readdirSync(dir)){if(f.endsWith('.sol'))sources[dir+'/'+f]={content:fs.readFileSync(dir+'/'+f,'utf8')};}
 const input={language:'Solidity',sources,settings:{optimizer:{enabled:true,runs:200},evmVersion:'shanghai',outputSelection:{'*':{'*':['abi','evm.bytecode.object','evm.deployedBytecode.object']}}}};
 const result=JSON.parse(solc.compile(JSON.stringify(input)));const errors=(result.errors||[]).filter(x=>x.severity==='error');if(errors.length)throw Error(errors.map(e=>e.formattedMessage).join('\n'));
 const contracts={};for(const [file,cs]of Object.entries(result.contracts))for(const[name,c]of Object.entries(cs))contracts[name]={file,...c};
 return {compiler:solc.version(),input_sha256:crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex'),contracts,warnings:(result.errors||[]).map(x=>x.formattedMessage)};
}
if(process.argv[1]?.endsWith('/compile.mjs')){const result=compile();const target=process.env.STATE_DIRECTORY||'build';fs.mkdirSync(target,{recursive:true});fs.writeFileSync(target+'/contracts.json',JSON.stringify(result));console.log(JSON.stringify({compiler:result.compiler,source_sha:result.input_sha256,contracts:Object.keys(result.contracts),warnings:result.warnings}));}
