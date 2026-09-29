import fs from 'node:fs';
import path from 'node:path';
import solc from 'solc';

const source = fs.readFileSync('contracts/BakedBeans.sol', 'utf8');
if (solc.version() !== '0.8.9+commit.e5eed63a.Emscripten.clang') {
  throw new Error(`Wrong compiler: ${solc.version()}`);
}
const input = {
  language: 'Solidity',
  sources: { 'BakedBeans.sol': { content: source } },
  settings: {
    optimizer: { enabled: false, runs: 200 },
    outputSelection: { '*': { '*': ['abi','evm.bytecode.object','evm.deployedBytecode.object','metadata'] } }
  }
};
const output = JSON.parse(solc.compile(JSON.stringify(input)));
for (const e of output.errors ?? []) console[e.severity === 'error' ? 'error' : 'warn'](e.formattedMessage);
if ((output.errors ?? []).some(e => e.severity === 'error')) process.exit(1);
const c = output.contracts['BakedBeans.sol']['BakedBeans'];
if (!c.evm.bytecode.object) throw new Error('Empty deployment bytecode');
const artifact = { contractName:'BakedBeans', compiler:solc.version(), optimizer:{enabled:false,runs:200}, abi:c.abi, bytecode:`0x${c.evm.bytecode.object}`, deployedBytecode:`0x${c.evm.deployedBytecode.object}` };
fs.mkdirSync('web/src/generated', { recursive:true });
fs.writeFileSync('web/src/generated/BakedBeans.json', JSON.stringify(artifact,null,2));
console.log(`Compiled BakedBeans with ${artifact.compiler}; bytecode ${artifact.bytecode.length/2-1} bytes`);
