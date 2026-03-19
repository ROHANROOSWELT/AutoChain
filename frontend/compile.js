const fs = require('fs');
const solc = require('solc');
const path = require('path');

const contractPath = path.resolve(__dirname, '../../contracts/SubscriptionManager.sol');
const source = fs.readFileSync(contractPath, 'utf8');

const input = {
  language: 'Solidity',
  sources: {
    'SubscriptionManager.sol': {
      content: source
    }
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['*']
      }
    }
  }
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  output.errors.forEach(err => {
    console.error(err.formattedMessage);
  });
}

const contract = output.contracts['SubscriptionManager.sol']['SubscriptionManager'];

const artifact = {
  abi: contract.abi,
  bytecode: contract.evm.bytecode.object
};

const outPath = path.resolve(__dirname, './src/contracts/SubscriptionManager.json');
fs.writeFileSync(outPath, JSON.stringify(artifact, null, 2));

console.log('Successfully compiled and generated SubscriptionManager.json!');
