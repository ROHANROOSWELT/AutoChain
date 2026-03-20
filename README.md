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
*"Bought an iPhone for ₹80,000 with a 12-month warranty and subscribed to Netflix for ₹499/month."*

### ⚙️ Autonomous Smart Contract Execution
AutoChain categorizes and governs assets natively via smart contracts, deploying unique contract addresses for each registered asset:
- **🔄 Subscriptions (SubscriptionManager)**: Converts recurring payments into smart contracts. Features built-in auto-renewal tracking, 30-day precise cycle triggers, and active governance mapping.
- **📊 Utility Bills (BillTracker)**: Deploys on-chain tracking for utilities. Includes intelligent spike/delta detection and budget overrun warnings compared to historical logs.
- **🛍️ Purchases (NFTReceipt)**: Mints ERC-721 NFT Receipts offering immutable proof of ownership, complete with on-chain metadata and active warranty tracking.

### 📧 Intelligent Email Notifications & Receipts
AutoChain acts as your personal financial assistant. Through direct SMTP routing, the agent proactively sends:
- **Blockchain Transaction Receipts**: Immediate email confirmations whenever a transaction is successfully written and confirmed on the blockchain with transaction hashes.
- **Action Required Alerts**: Notifications for abnormal bill spikes, warranty expirations, and subscription renewals with integrated **Cancel or Pay** verification flows.
- **Renewal Confirmations**: Automated acknowledgement once a subscription is successfully renewed via email actions.

### ⏳ Advanced Time Simulation
Built-in developer tools allow you to seamlessly test long-term contract lifecycles, warranty expiries, and automated renewal triggers through a simulated timeline:
- **Fast Forward**: `GET /simulate/forward?days=30` instantly jumps ahead in time, processing any pending alerts and renewals.
- **Trigger Actions**: Complete renewal tests directly via `GET /simulate/pay?key=netflix`.
- **Time Reset**: Revert back to real-time sync with `/simulate/reset`.

---

## 🛠️ Architecture & Tech Stack

- **Agent & AI Backend**: Python, FastAPI, OpenAI, Python `smtplib` (Email Routing)
- **Frontend App**: React, Vite, Tailwind CSS, Lucide Icons
- **Web3 Integration**: Ethers.js, MetaMask Wallet
- **Smart Contracts**: Solidity (Custom Asset Trackers, ERC-721 NFT Metadata)
- **Blockchain Network**: Polkadot Hub EVM Testnet (`Chain ID: 420420417`)

### Complete Workflow
1. **NLP Input**: You speak/type unstructured financial intent on the React frontend.
2. **AI Analysis**: FastAPI backend routes the text to OpenAI, extracting structured parameters (asset bounds, duration, price).
3. **Approvals**: The frontend previews the intent, asking you to sign with MetaMask.
4. **Execution**: The transaction is verified and executed on-chain; AutoChain maps a unique contract address per event.
5. **Real-time Comms**: Once the block confirms, backend SMTP triggers an immediate transaction receipt to your inbox.
6. **Background Audits**: Over simulated time, the background rule engine continuously governs dates, prices, and cycles, securely messaging you when interventions are required (e.g. "Pay or Cancel" or "Abnormal Spike Detected!").

---

## 📦 Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) & npm
- [Python 3.9+](https://www.python.org/)
- [MetaMask](https://metamask.io/) Extension
- OpenAI API Key
- SMTP Credentials (for email routing)

### 1. Backend Setup (FastAPI)
First, configure your `.env` inside the `backend/` folder:
```env
# backend/.env
OPENAI_API_KEY="sk-..."
SMTP_SERVER="smtp.gmail.com"
SMTP_PORT=587
SENDER_EMAIL="your_email@gmail.com"
SENDER_PASSWORD="your_app_password"
TO_EMAIL="your_receiving_email@gmail.com"
```

Then, run the backend:
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup (React/Vite)
Configure the `.env` inside the `frontend/` folder:
```env
# frontend/.env
VITE_BACKEND_URL="http://localhost:8000"
```

Launch the frontend:
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
4. **Receipt**: You receive an email confirming the transaction hash and a unique contract address.
5. **Registry**: The `BillTracker` contract emits an `AbnormalIncreaseAlert`.
6. **Notification**: AutoChain emails you an alert regarding the 33% usage spike for your review.

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.
