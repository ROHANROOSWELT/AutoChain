# AutoChain: Autonomous Web2 to Web3 Financial AI Agent

AutoChain is an intelligent financial agent that bridges the gap between Web2 financial data and Web3 blockchain assets. It uses AI to extract structured data from natural language, applies autonomous decision-making for risk assessment, and executes blockchain actions on the Polkadot Hub EVM (Simulated).

## 🚀 Overview

AutoChain reads raw financial text (such as "Bought iPhone ₹80000" or "Netflix 499/month"), understands the intent using AI, and converts these events into self-managed blockchain assets:
- **Subscriptions** are converted into smart contracts with auto-cancel and renewal alerts.
- **Utility Bills** are tracked with historical spike detection and budget warnings.
- **Purchases** are minted as **ERC-721 NFT Receipts** with immutable proof of ownership and active warranty tracking.

## ✨ Key Features

- **AI Extraction Engine**: Powered by OpenAI (GPT-4o-mini). Parses natural language into structured financial items.
- **Autonomous Decision Engine**: Assesses financial risk (Low/Medium/High) and recommends specific blockchain actions.
- **Automation Automaton**: Simulates time-based logic like warranty expiry, renewal alerts, and abnormal bill spikes.
- **Blockchain Integration**:
  - **NFT Receipts**: ERC-721 tokens representing physical or digital purchases.
  - **Subscription Manager**: Smart contracts for managing recurring payments.
  - **Bill Tracker**: On-chain tracking for utility and service bills.
- **Polkadot Hub EVM Simulation**: High-fidelity simulation of blockchain state, transactions, and events.

## 🛠️ Tech Stack

- **Backend**: FastAPI (Python), OpenAI, Pydantic
- **Frontend**: React, Vite, Tailwind CSS, Lucide React
- **Blockchain**: Solidity (ERC-721, custom trackers), Polkadot Hub EVM (Simulated)

## 📦 Installation & Setup

### Prerequisites
- Python 3.9+ 
- Node.js & npm
- OpenAI API Key (optional, defaults to mock mode)

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:5173`.

## 📂 Project Structure

- `backend/`: FastAPI server, AI agent logic, automation rules, and blockchain simulator.
- `contracts/`: Solidity smart contracts for NFT Receipts, Bill Tracking, and Subscriptions.
- `frontend/`: React application with interactive dashboards for AI analysis and execution.

## 📝 Example Usage

1. **Enter Text**: "Bought a MacBook for ₹1,20,000 and Netflix ₹499/month"
2. **AI Analysis**: The agent extracts a **Purchase** (MacBook) and a **Subscription** (Netflix).
3. **Execution**:
   - The MacBook becomes an **NFT Receipt** with a 12-month warranty.
   - Netflix is deployed as a **Subscription Manager** contract.
4. **Registry**: View your newly created assets in the **Managed Assets** dashboard.

## 📜 License
MIT License
