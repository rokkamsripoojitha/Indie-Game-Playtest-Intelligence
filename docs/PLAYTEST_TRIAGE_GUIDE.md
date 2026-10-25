# Playtest Feedback Triage Guide

This guide describes a consistent, evidence-led way to review playtester feedback in Indie Game Playtest Intelligence. It is a workflow aid, not an automatic substitute for developer judgment.

## 1. Triage goals

A useful triage process should help a studio:

- Identify problems that prevent players from progressing or understanding the game.
- Recognize related reports while preserving every original player observation.
- Separate evidence from interpretation and AI-generated hypotheses.
- Choose a focused follow-up test before spending time on a possible fix.
- Record a human decision and verify the outcome against a specific game build.

## 2. Suggested feedback categories

Use the most specific category supported by the report. A report may have a primary category and optional tags.

| Category | Examples | Useful follow-up evidence |
| --- | --- | --- |
| Crash / stability | Crash, freeze, failure to launch | Platform, logs, reproduction steps, frequency |
| Progression blocker | Door will not open, quest cannot complete | Quest state, save state, exact steps |
| Controls / usability | Player cannot find or use inventory | Input device, control mapping, first-time-player observation |
| Gameplay / balance | Encounter feels unfair, ability appears ineffective | Difficulty, player level, repeated observations |
| Performance | Frame drops, long loading, stutter | Hardware, settings, measured timing |
| Visual / audio | Missing texture, unreadable text, audio drop-out | Screenshot or clip, language, display/audio setup |
| Connectivity / services | Disconnect, matchmaking failure | Region, time, network conditions, request/error identifiers |
| Other / unclear | Report does not fit a category yet | Ask a neutral clarification question |

Do not infer a category or cause with high confidence from vague wording alone. Keep the original report available for review.

## 3. Prioritization rubric

Rate each dimension from 1 to 4. If evidence is missing, record **Unknown** rather than inventing a score.

### Player impact

- **1 — Minor:** Cosmetic inconvenience; the player can continue normally.
- **2 — Noticeable:** Causes confusion or friction, but a reasonable workaround exists.
- **3 — Major:** Blocks an important action or substantially disrupts a session.
- **4 — Critical:** Prevents launch/progression for many affected players, causes repeated crashes, or threatens save/session integrity.

### Frequency / reach

- **1 — Isolated:** One report with no corroborating evidence.
- **2 — Repeated:** More than one report or reproduction in a limited context.
- **3 — Widespread:** Repeated across multiple sessions or testers.
- **4 — Broadly reproduced:** Confirmed across multiple relevant environments or a large share of observed sessions.

### Reproducibility

- **1 — Not reproduced:** Insufficient details or attempts have not reproduced it.
- **2 — Intermittent:** Reproduces inconsistently or only under unclear conditions.
- **3 — Reproducible:** Clear steps reproduce it in a known context.
- **4 — Reliably reproducible:** Repeatedly reproduced with documented steps and expected/actual outcomes.

These ratings are separate evidence dimensions, not a claim that the underlying data is complete. Avoid treating an unknown value as zero or as proof that an issue is unimportant.

### Suggested triage bands

Use these as discussion prompts, not automatic issue decisions:

- **Investigate immediately:** Impact is 4, or impact is 3 and the problem is reproducible or corroborated.
- **Prioritize for the next playtest:** Impact is 3, or multiple independent reports suggest a shared obstacle.
- **Schedule / monitor:** Impact is 1–2 and there is a clear workaround, limited evidence, or low current reach.
- **Needs more evidence:** The report lacks enough information to estimate impact, frequency, or reproduction reliably.

A studio may adapt these bands to its release stage and risk tolerance. Always preserve the reason for the chosen priority.

## 4. Evidence versus interpretation

Every AI-assisted recommendation should keep these sections distinct:

- **Observed facts:** Directly supported by player reports, session records, build metadata, logs, or linked documentation.
- **Patterns:** Similarities across reports, with the number of reports and distinct sessions stated when known.
- **Hypotheses:** Possible explanations that still need testing. Label them explicitly and do not present them as established causes.
- **Unknowns:** Missing details, conflicting reports, or evidence not available to the system.
- **Suggested next test:** A small, specific experiment that can confirm or reject the hypothesis.

For example, three players reporting difficulty opening an inventory supports investigating the tutorial controls. It does not, by itself, prove that a particular input handler is broken.

## 5. Duplicate reports: link, do not erase

1. Keep each player's original wording and report identifier.
2. Show candidate duplicates together with the similarity signal and enough context for review.
3. Check that reports concern the same symptom, build, and relevant circumstances—not merely similar words.
4. Let an authorized developer confirm or reject the relationship.
5. Preserve the decision and the original reports. A similarity score alone must not merge, hide, or delete player feedback.

Reports describing different symptoms can share terminology. Conversely, the same defect may be described in very different language. Similarity is a discovery aid, not proof.

## 6. Build-specific investigation checklist

Before recommending a fix or follow-up test, verify:

- [ ] The affected build/version is identified.
- [ ] The report is scoped to the correct studio and authorized workspace.
- [ ] Steps to reproduce and expected versus actual behavior are recorded when available.
- [ ] Relevant reports are linked without removing their original records.
- [ ] The number of affected reports and distinct sessions is stated accurately, where available.
- [ ] Existing confirmed issues and unresolved reports are distinguished.
- [ ] Build-specific documentation is used for setup/control answers.
- [ ] Facts, hypotheses, and missing evidence are clearly separated.
- [ ] A developer reviews the proposed priority and approves any issue confirmation.
- [ ] A fix is verified against the intended build before it is marked verified.

## 7. Example triage record

**Title:** First-time players cannot find the inventory control during the tutorial

- **Category:** Controls / usability
- **Build:** Record the actual affected build; do not assume a version.
- **Observed evidence:** Summarize the original reports and identify how many distinct sessions corroborate them.
- **Impact:** Provisional rating, with a brief reason and any uncertainty.
- **Frequency:** Use observed report/session counts only.
- **Reproducibility:** Unknown until the steps are tested, unless existing evidence demonstrates otherwise.
- **Hypothesis:** Tutorial instructions may not make the inventory control clear to first-time players.
- **Follow-up test:** Ask first-time testers to complete the opening tutorial without facilitator hints; record whether they open the inventory, time to success, input device, and any assistance required.
- **Decision owner:** Authorized developer who reviewed the evidence.
- **Outcome:** Record the test result and the build in which it was observed.

This is an illustrative template, not a claim that the example has been newly tested.

## 8. Quality and privacy principles

- Collect only playtest information needed to investigate the issue.
- Avoid putting passwords, access tokens, private player information, or unnecessary personal details into reports or AI prompts.
- Do not expose one studio's reports or documents to another studio.
- Do not treat missing telemetry as proof that a problem did not occur.
- Keep a human reviewer responsible for confirming issues and prioritization decisions.
- When an AI recommendation is uncertain, say so and request evidence rather than fabricating details.

## 9. Definition of a useful triage outcome

A triage record is ready for action when it identifies the affected build, summarizes the evidence, states what remains uncertain, proposes a concrete next step, and records who made the decision. It is ready to be marked fixed only after verification evidence is recorded for the relevant build.
