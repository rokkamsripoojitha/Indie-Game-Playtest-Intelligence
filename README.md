# Indie Game Playtest Intelligence
### Full-Stack AI Capstone Project | Project 08

**Indie Game Playtest Intelligence** is a production-oriented, full-stack AI platform designed for independent game studios. It streamlines playtester feedback collection, identifies semantically duplicate bug reports without deleting player observations, answers setup questions using build-specific grounded RAG, and orchestrates an evidence-based 3-tool AI agent to investigate player friction before the next playtest.

---

## 1. Key Architectural Capabilities

- **Strict Multi-Tenant & Resource-Level Authorization**: Server-enforced deny-by-default access control isolating studios, builds, and sessions.
- **Three System Roles**:
  - **Tester**: Public signup baseline; submits feedback, joins cohorts with access codes, asks setup questions with grounded RAG.
  - **Developer**: Manages builds and sessions, reviews semantic duplicates side-by-side, triggers the AI investigation agent, confirms issues, and marks fixes verified.
  - **Studio Admin**: Manages studio memberships and issues single-use invitation tokens.
- **Semantic Duplicate Discovery**: High-dimensional vector embeddings with cosine similarity. Evaluates differently worded reports (e.g. *"The tutorial never tells me how to open the inventory"* vs *"I couldn't figure out the inventory control during the tutorial"*), displaying side-by-side matches without silently deleting original player data.
- **Build-Specific Grounded RAG**: Automatically chunks and indexes official setup guides. Queries for Build B never return obsolete Build A instructions.
- **3-Tool AI Investigation Agent**: Answers the developer question: *"What should we investigate before the next playtest?"* using:
  1. `findFeedback(buildId, topic)`
  2. `readIssueState(reportIds)`
  3. `countAffectedSessions(reportIds)` (Distinct playtest sessions count)
  Followed by structured developer review and approval.
- **Transparent Telemetry**: Dedicated health check distinguishing API uptime, MongoDB connection, LLM inference, embedding dimensions, vector indices, and email services.

---

## 2. Technology Stack

- **Frontend**: React 19, Tailwind CSS 4.x, React Router 7, Lucide React, Vite.
- **Backend**: Node.js, Express.js (ES modules), Mongoose ODM, express-session with connect-mongo, CSRF protection, express-rate-limit.
- **Database**: MongoDB Atlas / local MongoDB with high-dimensional vector schema.
- **AI & RAG Engine**: Ollama inference (`qwen2.5` / `all-minilm` / `EmbeddingGemma`) with transparent, deterministic high-dimensional cosine vector fallback for offline local testing.

---

## 3. Getting Started & Installation

### Prerequisites
- Node.js v18+ (tested on Node v25.9.0)
- MongoDB instance (MongoDB Atlas cluster URI or local MongoDB on `mongodb://127.0.0.1:27017`)
- Optional: [Ollama](https://ollama.com) for local neural inference.

### Step 1: Install Dependencies
```bash
# Install backend packages
cd backend
npm install

# Install frontend packages
cd ../frontend
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` in `backend/` to `.env`:
```bash
cd backend
cp .env.example .env
```
If `.env.example` is missing, check with the project maintainer for the required environment variables. Keep your `.env` file private and never commit real credentials or API keys to Git.
Ensure your `MONGODB_URI` points to your Atlas connection string or local MongoDB instance:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/playtest_intelligence
SESSION_SECRET=dev_secure_session_secret_key_8492049281048291
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
LLM_MODEL=qwen2.5:3b
EMBEDDING_MODEL=all-minilm
EMBEDDING_DIMENSION=384
```

### Step 3: Seed Demonstration Data
Seed reproducible demo accounts, two builds, multiple playtest sessions, 3 differently worded tutorial inventory reports, 1 existing issue, and official build documentation:
```bash
cd backend
npm run seed
```

### Step 4: Run the Application
In terminal 1 (Backend):
```bash
cd backend
npm start
```
*Backend runs at `http://localhost:5000` (Health check at `http://localhost:5000/api/health`).*

In terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```
*Frontend runs at `http://localhost:5173`.*

---

## 4. Demo Accounts & Credentials

Password for all demonstration accounts: **`DemoPassword123!`**

- **Lead Developer**: `dev@lunarforge.demo`
- **Studio Admin**: `admin@lunarforge.demo`
- **Tester A**: `tester.alex@playtest.demo`
- **Tester B**: `tester.blake@playtest.demo`
- **Tester C**: `tester.casey@playtest.demo`
- **Unauthorized Intruder**: `intruder@otherstudio.demo`

---

## 5. Automated Tests

Run backend unit tests for vector math, chunking, security hashing, and semantic duplicate matching:
```bash
cd backend
npm test
```
Tests pass with 100% success using Node's native test runner.

---

## 6. Demonstration Walkthrough & Evaluator Guide

Refer to [`docs/CAPSTONE_DEMO_SCRIPT.md`](docs/CAPSTONE_DEMO_SCRIPT.md) for the exact step-by-step evaluator presentation guide.
Refer to [`docs/VECTOR_INDEX_SETUP.md`](docs/VECTOR_INDEX_SETUP.md) for MongoDB Atlas Vector Search index configuration.
Refer to [`docs/API_COLLECTION.json`](docs/API_COLLECTION.json) for Postman-compatible endpoints.
