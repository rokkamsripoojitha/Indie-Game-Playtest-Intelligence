# Capstone Demonstration Script
## Project: Indie Game Playtest Intelligence

This script provides an exact, step-by-step walkthrough to demonstrate the application to your capstone project evaluator.

---

## 1. Quick Demonstration Credentials

All demo accounts share the password: `DemoPassword123!`

| Role | Account Name | Email | Purpose in Demonstration |
|---|---|---|---|
| **Game Developer** | Marcus Vance | `dev@lunarforge.demo` | Primary QA triage, side-by-side duplicates, AI Agent execution, issue confirmation |
| **Studio Admin** | Sarah Connor | `admin@lunarforge.demo` | Studio management, RBAC member management, issuing single-use invitations |
| **Tester A** | Alex Rivera | `tester.alex@playtest.demo` | Submitted tutorial inventory report #1 in shared cohort |
| **Tester B** | Blake Chen | `tester.blake@playtest.demo` | Submitted tutorial inventory report #2 in private cohort |
| **Tester C** | Casey Morgan | `tester.casey@playtest.demo` | Submitted tutorial inventory report #3 in private cohort |
| **Intruder** | Unauthorized User | `intruder@otherstudio.demo` | Verifying 403 authorization rejections and cross-studio tenant isolation |

---

## 2. Walkthrough Steps

### Step 1: System Telemetry & Readiness Check
1. Start the application (`npm start` in backend, `npm run dev` in frontend).
2. Look at the top **System Telemetry Bar**:
   - Shows **API Server** (running), **Database (MongoDB)** status, **LLM Inference** status, **Embedding Model** (384 dimensions), and **Vector Index**.
   - Explain to the examiner that health checks are transparent and never falsely report AI success when services are disconnected.

### Step 2: Role-Based Sign In
1. Navigate to `/login`.
2. Point out the **Capstone Quick-Fill Accounts** panel:
   - Click **Lead Developer (`dev@lunarforge.demo`)**.
   - Click **Sign In to Dashboard**.
3. Point out the active workspace banner: **Lunar Forge Studios [DEMO]** with role **DEVELOPER**.

### Step 3: Semantic Duplicate Discovery (Side-by-Side Review)
1. Go to **Semantic Duplicates** in the sidebar (`/duplicates`).
2. Select **"Cannot access inventory in tutorial"** as the anchor report.
3. Observe the side-by-side comparison:
   - **Original Report:** *"The tutorial never tells me how to open the inventory."*
   - **Candidate 1:** *"I couldn't figure out the inventory control during the tutorial."* (**92.3% match**)
   - **Candidate 2:** *"I finished the opening level, but there was no instruction for accessing my items."* (**85.1% match**)
   - **Unrelated Bug:** *"GPU crash on graphics quality toggle"* is **NOT** linked (6.2% match).
4. Explain the key safety principle:
   - *"The AI computes semantic similarity using high-dimensional embeddings, but the system NEVER automatically merges or deletes player feedback. Original wording is preserved."*
5. Click **Confirm Link** to record the developer triage decision.

### Step 4: The 3-Tool AI Investigation Agent (The Core Capstone Feature)
1. Navigate to **Pre-Playtest Agent** (`/agent`).
2. Show the prompt: *"What should we investigate before the next playtest?"*
3. Target Build: `v1.0.1-beta`, Topic: `Tutorial Inventory`.
4. Click **Run Investigation**.
5. Observe the **Backend AI Agent Orchestration Trace**:
   - **Step 1: `findFeedback(buildId, topic)`** &rarr; Retrieves 3 clustered player reports.
   - **Step 2: `readIssueState(reportIds)`** &rarr; Discovers 1 existing confirmed issue and 2 unresolved reports.
   - **Step 3: `countAffectedSessions(reportIds)`** &rarr; Evaluates distinct playtest sessions: **2 Distinct Cohorts** affected.
6. Review the synthesized proposal:
   - **Known Facts vs Hypotheses:** Strictly separated.
   - **Missing Reproduction Details:** Analyzes whether testers included steps to reproduce.
   - **Suggested Follow-Up Test:** *"Replay the opening tutorial level with first-time testers in the upcoming session. Explicitly observe whether players can open their inventory without facilitator hints within the first 3 minutes."*
7. Human-in-the-Loop Sign-Off:
   - Click **Approve & Create Confirmed Issue**.
   - Show that developer human approval is strictly required before an issue record is confirmed.

### Step 5: Build-Document Grounded RAG
1. Navigate to **Build QA Assistant (RAG)** (`/chat`).
2. Verify the scoped build is `v1.0.1-beta`.
3. Click the suggested question: *"How do I open my inventory?"*
4. Observe the grounded answer and verifiable citation card:
   - Cites document: *"Official Controls & Keybindings Guide [DEMO]"*.
   - Excerpt: *"Open / Close Inventory: Press the TAB key on keyboard (or 'I' key). On gamepad, press 'Y'..."*
5. Ask: *"What are the known issues in this build?"*
   - Returns known issues specific to Build v1.0.1-beta citing *"Known Issues & Troubleshooting Notes"*.
6. Explain that queries for Build B never return obsolete Build A instructions because vector retrieval applies strict build scoping.

### Step 6: Security & Authorization Boundary Testing
1. Log out (`dev@lunarforge.demo`).
2. Sign in as **Intruder (`intruder@otherstudio.demo`)**.
3. Attempt to navigate to `/duplicates` or `/agent`:
   - Server immediately rejects with **403 Access Denied**.
   - Demonstrates that client-side route tampering is blocked by server-enforced RBAC and tenant isolation.
