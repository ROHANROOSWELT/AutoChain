const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const regex = /let currentContractAddr = contractAddress([\s\S]*?)setExecutionData\(\{/m;

const newLogic = `let currentContractAddr = contractAddress
      let currentNftAddr = localStorage.getItem('nft_receipt_v3') || null
      let currentBillAddr = localStorage.getItem('bill_tracker_v3') || null

      const results = []
      let successfulCount = 0

      const existingTxLog = JSON.parse(localStorage.getItem('autochain_tx_log') || '[]')

      for (const item of (items || [])) {
        if (!item) continue
        const itemName = item.name || 'Unknown'
        const action = item.action || item.decision || 'create_subscription_contract'
        addLog(\`Processing \${itemName} (\${action})...\`, 'info')

        try {
          const isDuplicate = existingTxLog.some(log =>
            log?.name?.toLowerCase() === itemName.toLowerCase() &&
            Math.floor(log?.amount ?? -1) === Math.floor(item.amount ?? 0) &&
            log?.action === action
          )

          if (isDuplicate) {
            addLog(\`Skipping \${itemName}: Protocol already active.\`, 'ai')
            results.push({ item, decision: action, blockchain: { success: true, message: 'Existing protocol detected', network: 'Polkadot Hub Testnet (Real Blockchain)' } })
            successfulCount++
            continue
          }

          let tx;
          let usedAddress = currentContractAddr;

          if (action === 'create_subscription_contract') {
            if (!currentContractAddr) {
              addLog('Deploying SubscriptionManager...', 'ai')
              setTxStatus('pending')
              const factory = new ethers.ContractFactory(SubscriptionManager.abi, SubscriptionManager.bytecode, signer)
              const deployed = await factory.deploy()
              await deployed.waitForDeployment()
              currentContractAddr = await deployed.getAddress()
              setContractAddress(currentContractAddr)
              localStorage.setItem('subscription_manager_v3', currentContractAddr)
              addLog('SubscriptionManager deployed!', 'success')
            }
            usedAddress = currentContractAddr;
            const contract = new ethers.Contract(currentContractAddr, SubscriptionManager.abi, signer)
            setTxStatus('pending')
            tx = await contract.createSubscription(itemName, Math.floor(item.amount ?? 0), Math.floor(item.duration || 30))

          } else if (action === 'mint_nft') {
            if (!currentNftAddr) {
              addLog('Deploying NFTReceipt Contract...', 'ai')
              setTxStatus('pending')
              const factory = new ethers.ContractFactory(NFTReceipt.abi, NFTReceipt.bytecode, signer)
              const deployed = await factory.deploy()
              await deployed.waitForDeployment()
              currentNftAddr = await deployed.getAddress()
              localStorage.setItem('nft_receipt_v3', currentNftAddr)
              addLog('NFTReceipt deployed!', 'success')
            }
            usedAddress = currentNftAddr;
            const contract = new ethers.Contract(currentNftAddr, NFTReceipt.abi, signer)
            setTxStatus('pending')
            tx = await contract.mintReceipt(
              account, itemName, Math.floor(item.amount ?? 0), item.currency || "INR", 12, "https://autochain.io/nft/meta.json"
            )

          } else if (action === 'track_bill') {
            if (!currentBillAddr) {
              addLog('Deploying BillTracker Contract...', 'ai')
              setTxStatus('pending')
              const factory = new ethers.ContractFactory(BillTracker.abi, BillTracker.bytecode, signer)
              const deployed = await factory.deploy()
              await deployed.waitForDeployment()
              currentBillAddr = await deployed.getAddress()
              localStorage.setItem('bill_tracker_v3', currentBillAddr)
              addLog('BillTracker deployed!', 'success')
            }
            usedAddress = currentBillAddr;
            const contract = new ethers.Contract(currentBillAddr, BillTracker.abi, signer)
            setTxStatus('pending')
            const dueTs = Math.floor(Date.now() / 1000) + (30 * 86400) // 30 days default
            tx = await contract.registerBill(itemName, Math.floor(item.amount ?? 0), Math.floor(item.previous_amount || 0), dueTs, 3)
          }

          if (tx) {
            addLog(\`Transaction sent: \${tx.hash.slice(0, 10)}...\`, 'info')
            const receipt = await tx.wait()
            addLog(\`Confirmed in block #\${receipt.blockNumber}\`, 'success')
            setTxStatus('confirmed')
            setTimeout(() => setTxStatus(null), 3000)
            
            existingTxLog.push({ name: itemName, amount: item.amount, action, tx: tx.hash })
            localStorage.setItem('autochain_tx_log', JSON.stringify(existingTxLog))

            results.push({
              item, decision: action,
              blockchain: { success: true, tx_hash: tx.hash, block_number: receipt.blockNumber, contract_address: usedAddress, network: 'Polkadot Hub Testnet (Real Blockchain)' }
            })
            successfulCount++
          }

        } catch (itemErr) {
          console.error(itemErr)
          if (itemErr.code === 'ACTION_REJECTED' || itemErr.code === 4001) {
            addLog(\`MetaMask: User rejected transaction for \${itemName}\`, 'error')
            setTxStatus('rejected')
            setTimeout(() => setTxStatus(null), 3000)
          } else {
            addLog(\`Failed: \${itemName} — \${itemErr.reason || itemErr.message}\`, 'error')
          }
          results.push({ item, decision: action, blockchain: { success: false, error: itemErr.reason || itemErr.message, network: 'Polkadot Hub Testnet (Real Blockchain)' } })
        }
      }

      setExecutionData({`;

if (regex.test(code)) {
  code = code.replace(regex, newLogic);
  fs.writeFileSync('frontend/src/App.jsx', code);
  console.log("App.jsx updated perfectly!");
} else {
  console.log("Regex not matched!");
}
