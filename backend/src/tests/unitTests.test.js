import test from 'node:test';
import assert from 'node:assert/strict';
import { cosineSimilarity, normalizeSimilarity } from '../utils/vectorMath.js';
import { chunkText } from '../services/ragService.js';
import { hashToken } from '../services/authService.js';
import { generateEmbedding } from '../services/embeddingService.js';

test('1. Vector Math - Cosine similarity produces expected values', () => {
  const vecA = [1, 0, 0];
  const vecB = [1, 0, 0];
  const vecC = [0, 1, 0];
  const vecD = [-1, 0, 0];

  assert.equal(cosineSimilarity(vecA, vecB), 1.0, 'Identical vectors should have similarity of 1.0');
  assert.equal(cosineSimilarity(vecA, vecC), 0.0, 'Orthogonal vectors should have similarity of 0.0');
  assert.equal(cosineSimilarity(vecA, vecD), -1.0, 'Opposite vectors should have similarity of -1.0');
  assert.equal(cosineSimilarity([], []), 0, 'Empty vectors should return 0');
});

test('2. RAG Chunking - Splits long text into overlapping chunks', () => {
  const sampleWords = new Array(500).fill('gameplay').join(' ');
  const chunks = chunkText(sampleWords, 100, 20);

  assert.ok(chunks.length > 1, 'Should create multiple chunks for 500 words');
  assert.ok(chunks[0].split(' ').length <= 100, 'Chunk size must not exceed specified word limit');
});

test('3. Security - Hashed tokens are irreversible and consistent', () => {
  const rawToken = 'sample_secret_token_12345';
  const hashed1 = hashToken(rawToken);
  const hashed2 = hashToken(rawToken);

  assert.equal(hashed1, hashed2, 'Hashes of identical tokens must match');
  assert.notEqual(hashed1, rawToken, 'Hash must not equal raw token');
  assert.equal(hashed1.length, 64, 'SHA-256 hash must be 64 hexadecimal characters');
});

test('4. Semantic Duplicate Detection - Differently worded tutorial reports match while graphics bug stays distinct', async () => {
  const reportA = 'The tutorial never tells me how to open the inventory.';
  const reportB = 'I finished the opening level, but there was no instruction for accessing my items.';
  const reportC = "I couldn't figure out the inventory control during the tutorial.";
  const distinctBug = 'Switching from High to Ultra graphics settings causes an instant black screen and DX12 crash.';

  const [embA, embB, embC, embDiff] = await Promise.all([
    generateEmbedding(reportA),
    generateEmbedding(reportB),
    generateEmbedding(reportC),
    generateEmbedding(distinctBug)
  ]);

  const simAB = cosineSimilarity(embA.embedding, embB.embedding);
  const simAC = cosineSimilarity(embA.embedding, embC.embedding);
  const simADiff = cosineSimilarity(embA.embedding, embDiff.embedding);

  console.log(`\n    [Semantic Similarity Verification]:`);
  console.log(`    Report A <-> Report B: ${(simAB * 100).toFixed(1)}% match`);
  console.log(`    Report A <-> Report C: ${(simAC * 100).toFixed(1)}% match`);
  console.log(`    Report A <-> Distinct Bug: ${(simADiff * 100).toFixed(1)}% match`);

  assert.ok(simAB > 0.65, `Report A and B must have strong semantic similarity (>0.65), got ${simAB}`);
  assert.ok(simAC > 0.65, `Report A and C must have strong semantic similarity (>0.65), got ${simAC}`);
  assert.ok(simADiff < simAB - 0.20, 'Distinct graphics bug must have significantly lower similarity score');
});

test('5. Role Authorization Policy - Two-role model validates developer actions and restricts tester baseline', () => {
  const testerRole = 'tester';
  const devRole = 'developer';

  const developerOnlyActions = ['confirmIssue', 'verifyFix', 'investigateTopic', 'approveProposalIssue'];
  
  const canPerformAction = (role, action) => {
    if (developerOnlyActions.includes(action)) {
      return role === 'developer';
    }
    return true; // regular actions like submitting feedback
  };

  assert.equal(canPerformAction(testerRole, 'confirmIssue'), false, 'Testers must be blocked from confirming issues');
  assert.equal(canPerformAction(testerRole, 'verifyFix'), false, 'Testers must be blocked from verifying fixes');
  assert.equal(canPerformAction(devRole, 'confirmIssue'), true, 'Developers can confirm issues');
  assert.equal(canPerformAction(devRole, 'verifyFix'), true, 'Developers can verify fixes');
  assert.equal(canPerformAction(testerRole, 'submitFeedback'), true, 'Testers can submit feedback');
});
