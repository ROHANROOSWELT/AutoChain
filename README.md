<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/link.svg" width="80" alt="AutoChain Logo" />
  <h1>AutoChain: Autonomous Web2 to Web3 Financial Agent</h1>
  <p><strong>Transform everyday financial text into autonomous, self-executing Web3 smart contracts.</strong></p>
</div>

---

## 🚀 Overview

**AutoChain** is an intelligent, autonomous financial agent bridging the gap between Web2 financial data and Web3 blockchain assets. Built for the modern decentralized ecosystem, AutoChain reads unstructured financial text, uses advanced AI to understand intent, and automatically converts these events into fully self-managed blockchain assets on the **Polkadot Hub EVM Testnet**.

Gone are the days of manually tracking subscriptions or losing paper receipts. AutoChain provides immutable ownership, automated bill auditing, and intelligent alerts in a completely decentralized environment.

## ✨ Key Features

### 🧠 AI Extraction Engine
Powered by advanced LLMs (OpenAI GPT-4o-mini), AutoChain flawlessly parses natural language inputs into structured blockchain actions. Try entering:  
*"Bought an iPhone for ₹80,000 and subscribed to Netflix for ₹499/month."*

### ⚙️ Autonomous Smart Contract Execution
AutoChain categorizes and governs assets natively via smart contracts:
- **🔄 Subscriptions (SubscriptionManager)**: Converts recurring payments into smart contracts. Features built-in auto-renewal alerts, cycle tracking, and active governance.
- **📊 Utility Bills (BillTracker)**: Deploys on-chain tracking for utilities. Includes intelligent spike detection, historical delta analysis, and budget overrun warnings.
- **🛍️ Purchases (NFTReceipt)**: Mints ERC-721 NFT Receipts offering immutable proof of ownership, complete with on-chain metadata and active warranty tracking (e.g., "12-month warranty").

### 📧 Intelligent Email Notifications & Receipts
AutoChain acts as your personal financial assistant. Through direct SMTP routing, the agent proactively sends:
- **Transaction Receipts**: Immediate email confirmations whenever a transaction is successfully written to the blockchain.
- **Action Required Alerts**: Notifications for abnormal bill spikes, warranty expirations, and subscription renewals (e.g., "Pay or Cancel").

### ⏳ Time Simulation
Built-in developer tools allow you to fast-forward time instantly (`+30 Days`), enabling seamless testing of long-term contract lifecycles, warranty expiries, and automated renewal triggers.

---

## 🛠️ Architecture & Tech Stack

- **Agent & AI Backend**: Python, FastAPI, OpenAI, Python `email` (SMTP)
- **Frontend App**: React, Vite, Tailwind CSS, Lucide Icons
- **Web3 Integration**: Ethers.js, MetaMask Wallet
- **Smart Contracts**: Solidity (Custom Trackers, ERC-721)
- **Blockchain Network**: Polkadot Hub EVM Testnet (`Chain ID: 420420417`)

---

## 📦 Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) & npm
- [Python 3.9+](https://www.python.org/)
- [MetaMask](https://metamask.io/) Extension
- OpenAI API Key (Set in `backend/.env`)
- SMTP Credentials (Set in `backend/.env` for email routing)

### 1. Backend Setup (FastAPI)
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup (React/Vite)
```bash
cd frontend
npm install
npm run dev
```

The decentralized app will be available at `http://localhost:5173`. Make sure to connect your MetaMask wallet to the **Polkadot Hub Testnet**.

---

## 📝 Usage Example

1. **Input**: Enter *"Paid ₹2000 for electricity this month, previously it was ₹1500."*
2. **AI Action**: AutoChain identifies a **Bill** with an **Abnormal Spike**.
3. **Execution**: A transaction is broadcasted via MetaMask to the Polkadot Hub. 
4. **Registry**: The `BillTracker` contract emits an `AbnormalIncreaseAlert`.
5. **Notification**: AutoChain emails you a receipt of the transaction alongside an alert regarding the 33% usage spike.

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.
