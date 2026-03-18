import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import solc from 'solc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const contractPath = path.resolve(__dirname, 'SubscriptionManager.sol')
const source = fs.readFileSync(contractPath, 'utf8')

const input = {
  language: 'Solidity',
  sources: { 'SubscriptionManager.sol': { content: source } },
  settings: { outputSelection: { '*': { '*': ['*'] } } }
}

const output = JSON.parse(solc.compile(JSON.stringify(input)))

if (output.errors) {
  output.errors.forEach(err => console.error(err.formattedMessage))
}

const compiled = output.contracts['SubscriptionManager.sol']['SubscriptionManager']

if (compiled) {
  fs.writeFileSync(path.resolve(__dirname, 'SubscriptionManager.json'), JSON.stringify({
    abi: compiled.abi,
    bytecode: compiled.evm.bytecode.object
  }, null, 2))
  console.log('Contract compiled successfully to SubscriptionManager.json')
} else {
  console.error("Failed to compile contract.")
}
