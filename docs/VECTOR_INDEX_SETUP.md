# MongoDB Atlas Vector Search Index Configuration

## Overview
Indie Game Playtest Intelligence uses high-dimensional vector embeddings to power:
1. **Semantic Duplicate Discovery** across feedback reports.
2. **Build-Document RAG Retrieval** for build-isolated player setup answers.

When deployed on MongoDB Atlas (M10+ or Atlas Vector Search free tier preview), you configure an Atlas Search Vector Index. In local development or testing environments where an Atlas index is not yet built, the application automatically activates its **Exact Cosine In-Memory Vector Search Fallback**, which computes cosine distances across high-dimensional vectors with 100% transparency.

---

## 1. Index Definition for `feedbackreports` Collection

Create an Atlas Vector Search index named `playtest_vector_index` on the `feedbackreports` collection.

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 384,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "studioId"
    },
    {
      "type": "filter",
      "path": "buildId"
    }
  ]
}
```

### Explanation of Fields:
- **`path: "embedding"`**: Field in `FeedbackReport` holding the vector array.
- **`numDimensions: 384`**: Corresponds to `EMBEDDING_DIMENSION=384` (e.g. `all-minilm` / `EmbeddingGemma` / Qwen embedding).
- **`similarity: "cosine"`**: Cosine distance metric for normalized embedding comparison.
- **`path: "studioId"`**: Filter field enforcing tenant isolation so vector queries never cross studios.
- **`path: "buildId"`**: Filter field enforcing build isolation.

---

## 2. Atlas Setup Procedure via Atlas UI

1. Log into your [MongoDB Atlas Console](https://cloud.mongodb.com).
2. Navigate to your cluster &rarr; **Atlas Search**.
3. Click **Create Search Index**.
4. Choose **Atlas Vector Search (JSON Editor)**.
5. Select your database: `playtest_intelligence` and collection: `feedbackreports`.
6. Set Index Name to: `playtest_vector_index`.
7. Paste the JSON definition above and click **Next** &rarr; **Create Search Index**.
8. Atlas will take 1–3 minutes to build the index.

---

## 3. Honest Development Fallback Mode

If your MongoDB cluster is a local standalone instance (e.g. `mongodb://localhost:27017`) or Atlas index is pending, the application backend:
- Honestly reports `sourceEngine: "development_cosine_vector_engine"` in API responses.
- Executes real cosine similarity math across the vectors in memory.
- Does NOT label basic string search as semantic search.
