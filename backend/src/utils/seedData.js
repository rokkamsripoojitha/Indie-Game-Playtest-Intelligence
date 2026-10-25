import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { config } from '../config/env.js';
import {
  User,
  Studio,
  StudioMembership,
  Build,
  PlaytestSession,
  FeedbackReport,
  Issue,
  ReportLink,
  ConsentRecord,
  BuildDocument
} from '../models/index.js';
import { generateEmbedding } from '../services/embeddingService.js';
import { indexBuildDocument } from '../services/ragService.js';

export const seedDatabase = async () => {
  console.log('[Seed] Starting idempotent test and demo data seed...');
  await connectDB();

  // Clear existing demonstration data
  await Promise.all([
    User.deleteMany({ email: { $regex: /@(lunarforge\.demo|playtest\.demo|otherstudio\.demo)$/ } }),
    Studio.deleteMany({ name: 'Lunar Forge Studios [DEMO]' }),
    Build.deleteMany({ releaseNotes: { $regex: /DEMO/ } }),
    PlaytestSession.deleteMany({ description: { $regex: /DEMO/ } }),
    FeedbackReport.deleteMany({ description: { $regex: /(inventory|Ultra graphics)/i } }),
    Issue.deleteMany({ title: { $regex: /Tutorial Inventory/i } }),
    ReportLink.deleteMany({ decisionReason: { $regex: /DEMO/ } }),
    BuildDocument.deleteMany({ title: { $regex: /DEMO/ } })
  ]);

  console.log('[Seed] Cleaned old demo entries.');

  // 1. Create Users
  const defaultPassword = 'DemoPassword123!';
  const passwordHash = await User.hashPassword(defaultPassword);

  const adminUser = await User.create({
    name: 'Sarah Connor (Admin)',
    email: 'admin@lunarforge.demo',
    passwordHash,
    isVerified: true,
    systemRole: 'tester'
  });

  const devUser = await User.create({
    name: 'Marcus Vance (Lead Dev)',
    email: 'dev@lunarforge.demo',
    passwordHash,
    isVerified: true,
    systemRole: 'tester'
  });

  const testerA = await User.create({
    name: 'Alex Rivera (Tester A)',
    email: 'tester.alex@playtest.demo',
    passwordHash,
    isVerified: true,
    systemRole: 'tester'
  });

  const testerB = await User.create({
    name: 'Blake Chen (Tester B)',
    email: 'tester.blake@playtest.demo',
    passwordHash,
    isVerified: true,
    systemRole: 'tester'
  });

  const testerC = await User.create({
    name: 'Casey Morgan (Tester C)',
    email: 'tester.casey@playtest.demo',
    passwordHash,
    isVerified: true,
    systemRole: 'tester'
  });

  const foreignUser = await User.create({
    name: 'Unauthorized Intruder',
    email: 'intruder@otherstudio.demo',
    passwordHash,
    isVerified: true,
    systemRole: 'tester'
  });

  console.log('[Seed] Seeded demo users.');

  // 2. Create Studio
  const studio = await Studio.create({
    name: 'Lunar Forge Studios [DEMO]',
    description: 'Independent game development studio building Project ChronoShift [DEMO DATA].',
    ownerId: devUser._id
  });

  // 3. Create Studio Memberships (2 Clean Roles: Developer & Tester)
  await StudioMembership.create([
    { userId: devUser._id, studioId: studio._id, role: 'developer', status: 'active' },
    { userId: testerA._id, studioId: studio._id, role: 'tester', status: 'active' },
    { userId: testerB._id, studioId: studio._id, role: 'tester', status: 'active' },
    { userId: testerC._id, studioId: studio._id, role: 'tester', status: 'active' }
  ]);

  console.log('[Seed] Seeded studio and RBAC memberships.');

  // 4. Create Builds
  const buildAlpha = await Build.create({
    studioId: studio._id,
    buildName: 'ChronoShift Alpha',
    version: 'v1.0.0-alpha',
    status: 'archived',
    releaseNotes: '[DEMO] Early internal proof-of-concept build with prototype movement.',
    metadata: { engine: 'Unity 2023 LTS', targetPlatform: 'PC Windows' }
  });

  const buildBeta = await Build.create({
    studioId: studio._id,
    buildName: 'ChronoShift Beta Playtest 2',
    version: 'v1.0.1-beta',
    status: 'active',
    releaseNotes: '[DEMO] Playtest Beta 2 containing introductory tutorial level and dungeon prologue.',
    metadata: { engine: 'Unity 2023 LTS', targetPlatform: 'PC Windows' }
  });

  console.log('[Seed] Seeded builds v1.0.0-alpha and v1.0.1-beta.');

  // 5. Create Playtest Sessions
  const session1 = await PlaytestSession.create({
    studioId: studio._id,
    buildId: buildBeta._id,
    title: 'Alpha Weekend Cohort 1',
    description: '[DEMO] First public playtest cohort testing opening tutorial progression.',
    feedbackSharingPolicy: 'shared',
    accessCode: 'DEMO-SES1',
    permittedTesters: [
      { userId: testerA._id, email: testerA.email, joinedAt: new Date() },
      { userId: testerB._id, email: testerB.email, joinedAt: new Date() }
    ],
    status: 'active'
  });

  const session2 = await PlaytestSession.create({
    studioId: studio._id,
    buildId: buildBeta._id,
    title: 'Beta Tutorial Deep Dive Cohort 2',
    description: '[DEMO] Targeted study evaluating new player onboarding and UX friction.',
    feedbackSharingPolicy: 'private',
    accessCode: 'DEMO-SES2',
    permittedTesters: [
      { userId: testerC._id, email: testerC.email, joinedAt: new Date() }
    ],
    status: 'active'
  });

  console.log('[Seed] Seeded playtest sessions.');

  // 6. Generate Embeddings & Create Feedback Reports
  // 3 differently worded reports for the tutorial inventory issue:
  const rep1Text = 'The tutorial never tells me how to open the inventory.';
  const emb1 = await generateEmbedding(`Cannot access inventory in tutorial\n${rep1Text}`);

  const report1 = await FeedbackReport.create({
    studioId: studio._id,
    buildId: buildBeta._id,
    sessionId: session1._id,
    testerId: testerA._id,
    title: 'Cannot access inventory in tutorial',
    description: rep1Text,
    stepsToReproduce: '1. Start tutorial level.\n2. Pick up the wooden sword from the ground.\n3. Try to open the inventory to equip it, but there is no instruction.',
    expectedBehavior: 'Tutorial pop-up should indicate keybinding to open inventory (e.g. Press TAB).',
    actualBehavior: 'No button prompt appears; tester was stuck searching keyboard keys.',
    embedding: emb1.embedding,
    embeddingModel: emb1.model,
    embeddingDimension: emb1.dimension,
    embeddingStatus: 'completed',
    status: 'linked'
  });

  const rep2Text = 'I finished the opening level, but there was no instruction for accessing my items.';
  const emb2 = await generateEmbedding(`Missing item access instruction\n${rep2Text}`);

  const report2 = await FeedbackReport.create({
    studioId: studio._id,
    buildId: buildBeta._id,
    sessionId: session2._id,
    testerId: testerB._id,
    title: 'Missing item access instruction',
    description: rep2Text,
    stepsToReproduce: '1. Complete prologue room.\n2. Collect health potions from chest.\n3. Try to open bag to drink potion.',
    expectedBehavior: 'Onboarding guide should teach item hotkey.',
    actualBehavior: 'Never informed which key opens the bag.',
    embedding: emb2.embedding,
    embeddingModel: emb2.model,
    embeddingDimension: emb2.dimension,
    embeddingStatus: 'completed',
    status: 'submitted'
  });

  const rep3Text = "I couldn't figure out the inventory control during the tutorial.";
  const emb3 = await generateEmbedding(`Tutorial inventory controls unclear\n${rep3Text}`);

  const report3 = await FeedbackReport.create({
    studioId: studio._id,
    buildId: buildBeta._id,
    sessionId: session2._id,
    testerId: testerC._id,
    title: 'Tutorial inventory controls unclear',
    description: rep3Text,
    stepsToReproduce: '1. Launch game.\n2. Reach the equipment tutorial check.\n3. Attempt pressing keys without success.',
    expectedBehavior: 'Clear on-screen UI prompt displaying inventory control key.',
    actualBehavior: 'No prompt shown on screen.',
    embedding: emb3.embedding,
    embeddingModel: emb3.model,
    embeddingDimension: emb3.dimension,
    embeddingStatus: 'completed',
    status: 'submitted'
  });

  // Separate, genuinely different bug (graphics crash)
  const rep4Text = 'Switching from High to Ultra graphics settings causes an instant black screen and DX12 crash.';
  const emb4 = await generateEmbedding(`GPU crash on graphics quality toggle\n${rep4Text}`);

  const report4 = await FeedbackReport.create({
    studioId: studio._id,
    buildId: buildBeta._id,
    sessionId: session1._id,
    testerId: testerA._id,
    title: 'GPU crash on graphics quality toggle',
    description: rep4Text,
    stepsToReproduce: '1. Go to Settings > Video.\n2. Change preset from High to Ultra.\n3. Click Apply.',
    expectedBehavior: 'Graphics setting applies smoothly or shows GPU warning.',
    actualBehavior: 'Display freezes, fatal DirectX error dialog appears.',
    embedding: emb4.embedding,
    embeddingModel: emb4.model,
    embeddingDimension: emb4.dimension,
    embeddingStatus: 'completed',
    status: 'submitted'
  });

  console.log('[Seed] Seeded 4 feedback reports (3 tutorial inventory variations + 1 graphics crash).');

  // 7. Seed 1 Existing Confirmed Issue tracking Report 1
  const existingIssue = await Issue.create({
    studioId: studio._id,
    buildScope: [buildBeta._id],
    title: 'Tutorial Inventory Instruction Missing',
    description: 'First-time playtesters cannot find how to open their inventory during the opening tutorial sequence.',
    severity: 'high',
    status: 'confirmed',
    evidenceReportIds: [report1._id],
    createdBy: devUser._id
  });

  // Seed ReportLink for Report 1 to Existing Issue
  await ReportLink.create({
    studioId: studio._id,
    sourceReportId: report1._id,
    targetType: 'issue',
    targetId: existingIssue._id,
    relationshipType: 'duplicate',
    similarityScore: 1.0,
    decisionStatus: 'accepted',
    reviewedBy: devUser._id,
    decisionReason: '[DEMO] Developer confirmed report 1 relates to tutorial inventory missing prompt.'
  });

  // 8. Seed Build Documentation (for Build v1.0.1-beta)
  const guideContent = `
# Project ChronoShift - Player Guide & Controls (Build v1.0.1-beta)

## Movement & Traversal
- Movement: W, A, S, D keys
- Sprint: Hold Left Shift
- Jump: Spacebar
- Crouch: Left Ctrl

## Inventory & Items Management
- Open / Close Inventory: Press the TAB key on keyboard (or 'I' key). On gamepad, press 'Y' (Xbox) or 'Triangle' (PlayStation).
- Quick Use Health Potion: Press 'Q' key.
- Quick Slot 1-4: Number keys 1, 2, 3, 4.

## Combat & Interactions
- Basic Attack: Left Mouse Button
- Parry / Block: Right Mouse Button
- Interact / Open Chests: Press 'E' key
`;

  const troubleshootingContent = `
# Troubleshooting & Known Issues (Build v1.0.1-beta)

## Known Issues in Build v1.0.1-beta
1. Tutorial Inventory Prompt: The floating prompt for opening inventory via TAB key currently fails to display if the player runs past the first milestone marker too quickly. Workaround: Press TAB to open inventory.
2. Graphics Driver Warning: Ultra graphics setting currently requires DX12 feature level 12_1. On older drivers, switching to Ultra may hang the render pipeline. Recommended setting: High.
3. Controller Disconnect: If gamepad disconnects during gameplay, reconnect and press Start to resume input polling.
`;

  await indexBuildDocument({
    studioId: studio._id,
    buildId: buildBeta._id,
    title: 'Official Controls & Keybindings Guide [DEMO]',
    sourceType: 'guide',
    content: guideContent,
    originalFilename: 'ChronoShift_Controls_v1.0.1.txt',
    uploadedBy: devUser._id
  });

  await indexBuildDocument({
    studioId: studio._id,
    buildId: buildBeta._id,
    title: 'Known Issues & Troubleshooting Notes [DEMO]',
    sourceType: 'troubleshooting',
    content: troubleshootingContent,
    originalFilename: 'Troubleshooting_v1.0.1.txt',
    uploadedBy: devUser._id
  });

  console.log('[Seed] Seeded build documents with chunking and embeddings.');

  console.log(`
========================================================================
[SEED COMPLETE] Demonstration Data Seeded Successfully!
========================================================================
Demo Accounts (Password for all: DemoPassword123!):
  1. Studio Admin: admin@lunarforge.demo
  2. Developer:    dev@lunarforge.demo
  3. Tester A:     tester.alex@playtest.demo
  4. Tester B:     tester.blake@playtest.demo
  5. Tester C:     tester.casey@playtest.demo
  6. Intruder:     intruder@otherstudio.demo (Unauthorized testing)

Studio: Lunar Forge Studios [DEMO] (ID: ${studio._id})
Build Beta: ChronoShift Beta Playtest 2 (ID: ${buildBeta._id})
Sessions:
  - Alpha Weekend Cohort 1 (Access Code: DEMO-SES1, Policy: shared)
  - Beta Tutorial Deep Dive (Access Code: DEMO-SES2, Policy: private)
========================================================================
`);

  return {
    studioId: studio._id,
    buildId: buildBeta._id,
    adminEmail: adminUser.email,
    devEmail: devUser.email
  };
};

// If run directly from CLI
if (process.argv[1]?.endsWith('seedData.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('[Seed Failed]:', err);
      process.exit(1);
    });
}
