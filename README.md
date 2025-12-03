# Intelligence Cubed – x402 

A decentralized Modelverse where AI models are discoverable, comparable, composable—and payable via x402 payments end-to-end on Pharos Testnet.


**Submission:** Pharos x402 Hackathon – **Best x402 Agent Application**  
**Status:** Fully working prototype with on-chain payments, model marketplace, benchmarks, workflows, and Canvas editor.

---

## 🔗 Hackathon Resources


* **Demo Video (≤ 3 min):** <https://www.youtube.com/watch?v=aUPYiAM4obg>

---

## 📚 Table of Contents
1. [Hackathon Resources](#hackathon-resources)
2. [Overview](#1-overview)
3. [What the Product *Is*](#2-what-the-product-is)
4. [Problem & Solution](#3-problem--solution)
5. [Core Concepts](#4-core-concepts)
6. [Key Features](#key-features)
   - [Multi-Page AI Hub](#multi-page-ai-hub)
   - [x402 & On-chain Payments](#x402--on-chain-payments)
7. [How x402 & Pharos Payments Work](#how-x402--pharos-payments-work)
   - [A) Single-Model Chat Flow](#a-single-model-chat-flow)
   - [B) Modelverse / Benchmark "Try" Flow](#b-modelverse--benchmark-try-flow)
   - [C) Workflow & Canvas Flow](#c-workflow--canvas-flow)
8. [Architecture & Tech Stack](#architecture--tech-stack)
   - [Frontend](#frontend)
   - [Backend](#backend)
   - [Payments & On-chain](#payments--on-chain)
9. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Clone & Install](#clone--install)
   - [Environment Variables](#environment-variables)
10. [Local Development](#local-development)
    - [Frontend (Vite dev server)](#frontend-vite-dev-server)
    - [Backend / MCP server](#backend--mcp-server)
    - [Production Build](#production-build)
11. [Roadmap](#roadmap)
12. [License](#license)

---
# Intelligence Cubed (i³)

> A decentralized **Modelverse** — think **Hugging Face × Uniswap** — where models are both **Model-as-a-Service (MaaS)** and **liquid, revenue-sharing assets**. Discover, compare, and compose models in a visual Canvas; pay per call with transparent PHRS pricing; and get verifiable on-chain receipts via **x402**.

---

## 1) Overview

**Intelligence Cubed (i³)** is a decentralized modelverse that lets users:

- Discover curated AI models with transparent **PHRS** pricing  
- Benchmark and compare models with community-driven **Proof of Intelligence**  
- Build and run multi-step workflows in a **Canvas** editor  
- Chat with any model or workflow via a unified **Chats** interface

Every paid action (single model call or workflow run) is **gated by x402 invoices** and settled in **PHRS on Pharos Testnet** via **MetaMask**. Only **after** on-chain payment confirmation does the app invoke the underlying model(s) and stream back the answer.

---

## 2) What the Product *Is*

i³ is four layers that work together:

1. **Model-as-a-Service (MaaS)**  
   Call models directly via chat/API, chain them into workflows, and enable fine-tuning and secondary creation.

2. **Model as a Liquid Asset**  
   Tokenize models through **IMO (Initial Model Offering)** so ownership and usage revenues are shared transparently.

3. **Co-Creation (Canvas)**  
   Drag-and-drop to compose multi-step pipelines; derivative models automatically return royalties to ancestors.

4. **Democratic Benchmark (Proof of Intelligence)**  
   Usage-driven rankings and indices so the best models rise on merit, not just lab tests.

> **Open-source threshold:** when **>51%** of a model's ownership is publicly held, the model transitions to open source to accelerate adoption and remixing.

---

## 3) Problem & Solution

### Problems
- **Model discovery gap:** Lists are long, quality varies, pricing is opaque, and router logic is often a black box.  
- **Payment gap:** Most AI apps are centralized, credit- or subscription-based. There's no standard way for third-party agents to **programmatically** pay per call and obtain **verifiable on-chain receipts**.

### Our Solution
- **Modelverse + Benchmark + Workflows + Canvas** for one-stop **discover → compare → compose**.  
- **Tokenized ownership & royalties** (IMO + derivative revenue share) for sustainable creator incentives.  
- **Unified x402 payment layer**: each call is invoiced, paid, verified on-chain, then executed.

---

## 4) Core Concepts

- **IMO (Initial Model Offering):** Creators mint model ownership, fund development, and share future usage revenues.  
- **Royalties Accumulation:** Derivative models automatically pay upstream royalties across the lineage.  
- **Proof of Intelligence:** Continuous, usage-driven scoring and vertical indices (quality, usage, momentum).  
- **Democratic Pricing:** Stablecoin-anchored pricing that reflects demand and capacity, not arbitrary fees.

---


## 3️⃣ Key Features

### Multi-Page AI Hub

* **Chats (`index.html`)**  
  Single-model or Auto Router chat interface with a central input box:

  * "Ask AI anything…" prompt
  * **Auto Router** toggle: when enabled, the system scores hundreds of models and picks the best suited one for the user's query.

* **Modelverse (`modelverse.html`)**  
  Model marketplace with:

  * Name, category, industry
  * **Price / API call (PHRS)**
  * Usage, compatibility, total score
  * Actions: **Try** (jump into Chats) & **Add to Cart**

* **Benchmark (`benchmark.html`)**  
  Model benchmark leaderboard showing:

  * Performance scores
  * Usage metrics
  * Price & market stats
  * One-click "Try" into Chats.

* **Workflows (`workflow.html`)**  
  Workflow leaderboard:

  * Each card shows **Compute Cost**, **Estimated Gas**, and **Total (x402)** in PHRS.
  * Actions: **Details**, **Pay with x402**.

* **Canvas (`canvas.html`)**  
  Visual workflow editor:

  * Drag-and-drop nodes (models)
  * Connect them into multi-step pipelines
  * Click **Run** to execute the pipeline, paying node-by-node through x402.

### x402 & On-chain Payments

* **402 Payment Progress widget** in the bottom-right shows:

  * Invoice status (Pending → Paid / Cancelled)
  * Amount, memo, and Pharos tx link.
* **MetaMask (Pharos Testnet)** integration:

  * Users log in and confirm each payment.
  * Every payment is visible on **Pharos Explorer (SocialScan)**.

---

## 4️⃣ How x402 & Pharos Payments Work

### A. Single-Model Chat Flow

1. User opens **Chats** (`index.html`), selects a model (or enables Auto Router), and sends a question, e.g. `"What does this do?"`.
2. The frontend sends the request to the MCP server; the server:

   * Calculates the model price in PHRS.
   * Creates a **x402 payment** describing the required payment.
3. The UI shows a **x402 Payment Progress** card and prompts the user to **connect MetaMask (Pharos Testnet)**.
4. MetaMask pops up:

   * User approves the PHRS transfer (plus small gas fee).
5. Once the transaction is confirmed:

   * The 402 card shows **Paid – Payment settled on Pharos**, including:

     * Amount (PHRS)
     * Memo (invoice ID)
     * `Tx` link to **Pharos Explorer**.
6. Only then does the MCP server forward the prompt to the selected model and stream the answer back into the chat.

### B. Modelverse / Benchmark "Try" Flow

1. User visits **Modelverse** or **Benchmark** and clicks **Try** next to a model.
2. They are redirected to **Chats** with that model pre-selected.
3. They ask a question; the **same x402 flow** (invoice → MetaMask → Explorer → answer) runs automatically.

### C. Workflow & Canvas Flow

1. User opens **Workflows** and chooses a workflow card (e.g. "AI Safety & Watermarking Pipeline"), then clicks **Pay with x402**.
2. The app opens **Canvas**, pre-loading the workflow graph.
3. User optionally edits the graph and clicks **Run**.
4. Backend:

   * Calculates the required price for the first node and returns a 402.
   * After payment, verifies the Pharos transfer and executes that node.
   * Repeats the 402/payment cycle for each remaining node until the workflow completes.
5. Final results surface back through the **Chats** interface.

---

## 5️⃣ Architecture & Tech Stack

### Frontend

* **Vite multi-page app** (`index.html`, `modelverse.html`, `benchmark.html`, `workflow.html`, `canvas.html`)
* Modern layout with light purple accent (`#8B7CF6`), responsive design
* Custom components for:

  * Chats input + Auto Router toggle
  * Model tables & workflow cards
  * 402 Payment Progress widget

### Backend

* **Express.js** server (`serve.js`)

  * Serves static assets for all pages
  * Provides REST APIs: `/api/health`, `/api/models`, etc.
  * Hosts **MCP routes** under `/mcp/*` to:

    * Create x402-style invoices
    * Poll invoice/payment status
    * Proxy model calls after successful payment

### Payments & On-chain

* x402-compatible payment flow for invoice creation & validation
* **Pharos Testnet**:

  * **PHRS** as payment token (ERC-20 compatible)
  * **Merchant/agent recipient address** for all usage fees
  * User payments via **MetaMask** wallet
* **Billing logs**:

  * `data/billing-entries.json` stores local logs of each paid run for debugging and reconciliation (JSON shape: `{ "entries": [...] }`).

---

## 6️⃣ Getting Started

### Prerequisites

* **Node.js** ≥ 18
* **npm** ≥ 8 (or `yarn`)
* **MetaMask** wallet installed in your browser, configured with **Pharos Testnet**
* Optional but recommended: some testnet ETH (for gas) & PHRS in MetaMask for testing.

### Pharos Testnet Configuration

Add Pharos Testnet to MetaMask with the following settings:

| Field | Value |
|-------|-------|
| Network Name | Pharos Testnet |
| RPC URL | `https://testnet.dplabs-internal.com` |
| Chain ID | `688688` |
| Currency Symbol | ETH |
| Block Explorer | `https://pharos-testnet.socialscan.io` |

### Clone & Install

```bash
git clone <TODO: repository-url>
cd Pharos_i3_app
npm install
# or
yarn install
```

### Environment Variables

You can export these in your shell or use a `.env` file (with `dotenv` wired into `serve.js`):

* **Server basics**

  * `PORT` – default `3000` (often mapped to `8080` in production)
  * `HOST` – default `127.0.0.1` (use `0.0.0.0` to listen on all interfaces)
  * `NODE_ENV` – `development` or `production`

* **Model proxy**

  * `I3_PROXY_BASE` – base URL of the proxy (e.g. `http://localhost:8000`)

* **x402 / Pharos settings** (can also live in `server/mcp/config.js`)

  * `X402_NETWORK` – e.g. `pharos-testnet`
  * `X402_TOKEN_ADDRESS` – PHRS token contract address on Pharos Testnet
  * `X402_RECIPIENT` – your merchant/agent wallet address
  * `X402_PAYMENT_URL` – optional x402 facilitator endpoint
  * `X402_EXPLORER_URL` – Pharos Explorer base URL (`https://pharos-testnet.socialscan.io`)
  * `X402_RPC_URL` – Pharos Testnet RPC endpoint
  * `X402_DECIMALS` – token decimals (usually `18` for PHRS)
  * `X402_EXPIRES_SECONDS` – invoice expiry duration in seconds

Ensure that `data/billing-entries.json` exists, is writable, and follows `{ "entries": [] }`. The repo ships with a sample file; replace it with an empty structure if you need a clean slate.

---

## 7️⃣ Local Development

### Frontend (Vite dev server)

```bash
npm run dev
# or
yarn dev
```

* Default: `http://localhost:3000`
* Hot reload enabled.
* `vite.config.js` is configured with `host: '0.0.0.0'` so you can access it from other devices on your LAN.

### Backend / MCP server

In a separate terminal:

```bash
npm start
# or
yarn start
```

This launches `serve.js`, which:

* Serves static files (for production build)
* Exposes `/api/*` and `/mcp/*` routes
* Handles 402 invoice creation, polling, and post-payment model calls

### Production Build

```bash
npm run build
npm run preview     # optional local preview of the built assets
```

In production, you typically:

1. `npm run build`
2. `npm start` (or `node serve.js`) behind a reverse proxy.

---

### Roadmap

* **Mainnet deployment** with production-grade RPC and observability.
* **Model provider onboarding**:

  * Let external developers list models/workflows with their own x402 pricing and recipient addresses.
* **More wallets & platforms**:

  * Support additional EVM-compatible wallets (WalletConnect, Coinbase Wallet, etc.) and mobile-first flows.
* **Agent API**:

  * Document and expose MCP endpoints so external AI agents can programmatically:

    * Discover models
    * Quote prices
    * Pay with x402
    * Invoke models and workflows

---

## 🧾 License

This project is licensed under the **MIT License** – see the [`LICENSE`](./LICENSE) file for details.
