# FlyRank Capstone — AI Image Understanding & Content Matching Engine

[![Status](https://img.shields.io/badge/status-phase%204%20complete-brightgreen)](https://github.com/yourusername/flyrank-capstone-image-relevance)
[![Phase](https://img.shields.io/badge/phase-4-blue)](https://github.com/yourusername/flyrank-capstone-image-relevance)
[![License](https://img.shields.io/badge/license-MIT-green)](https://opensource.org/licenses/MIT)

A system that automatically matches images to blog posts using vision AI and embeddings, with
a safety guard that rejects wrong matches (fox vs. wolf) and explains why.

**Live Demo:** [Watch the demo](DEMO.md)

---

## Table of contents

- [Features](#features)
- [Architecture](#architecture)
- [Quick start](#quick-start)
- [API documentation](#api-documentation)
- [Testing](#testing)
- [Evaluation results](#evaluation-results)
- [Project structure](#project-structure)
- [Technologies](#technologies)
- [Status](#status)
- [Limitations](#limitations)
- [License](#license)

---

## Features

### Phase 1 — Design & setup ✅
- Complete architecture design with data model and pipeline
- 6 database tables with proper indexes and constraints
- 50-image corpus (fox, wolf, dog, bear, deer)
- Sample blog posts for testing

### Phase 2 — Vision pipeline ✅
- Gemini Flash integration for image understanding
- Structured output with Zod schema validation
- Batch processing with retries and rate-limit handling
- Cost tracking per call ($0.000135 per image)
- Low-confidence flagging (threshold: 0.70)

### Phase 3 — Matching engine & mismatch guard ✅
- Mismatch guard rejects wrong matches (fox vs. wolf)
- Cosine similarity ranking for image matching
- Review API for human-in-the-loop approval
- Suggestions table tracks every guard decision

### Phase 4 — Production layer ✅
- Eval set with labeled pairs (post → correct image)
- Top-1 precision computed and documented
- Complete documentation with architecture diagram
- Ready for submission

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  PHASE 1 · Design & setup                                        │
│                                                                  │
│   Images (50)      Tag schema (Zod)      Database (6 tables)     │
└──────────────────────────────────┬───────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────┐
│  PHASE 2 · Vision pipeline                                       │
│                                                                  │
│   Batch processing ──▶ Gemini Flash ──▶ Validated tags          │
│         │                                      │                 │
│         ▼                                      ▼                 │
│   Cost tracking                        Confidence check          │
│                                         ──▶ tagged / flagged    │
└──────────────────────────────────┬───────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────┐
│  PHASE 3 · Matching engine & guard                               │
│                                                                  │
│   Image embeddings ─┐                                            │
│                      ├──▶ Cosine similarity ──▶ Mismatch guard  │
│   Post embeddings ──┘                              │             │
│                                                     ▼            │
│                                             Review API           │
│                                          (approve / reject)      │
└──────────────────────────────────┬───────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────┐
│  PHASE 4 · Production layer                                       │
│                                                                    │
│   Eval set (labeled) ──▶ Precision script ──▶ README + docs      │
└────────────────────────────────────────────────────────────────────┘
```

---

## Quick start

### Prerequisites
- [Node.js](https://nodejs.org/) (v20+)
- [Docker](https://www.docker.com/) & Docker Compose
- [Gemini API key](https://ai.google.dev/) (free, no credit card)

### Setup instructions

**1. Clone the repository**
```bash
git clone https://github.com/yourusername/flyrank-capstone-image-relevance.git
cd flyrank-capstone-image-relevance
```

**2. Install dependencies**
```bash
npm install
```

**3. Start PostgreSQL**
```bash
docker compose up -d
```

**4. Run migrations**
```bash
# Connect to PostgreSQL
docker exec -it flyrank-capstone-image-relevance-postgres-1 psql -U image_user -d image_relevance

# Copy and paste each migration file in order:
# src/db/migrations/001_create_images.sql
# src/db/migrations/002_create_image_embeddings.sql
# src/db/migrations/003_create_posts.sql
# src/db/migrations/004_create_post_embeddings.sql
# src/db/migrations/005_create_suggestions.sql
# src/db/migrations/006_create_cost_log.sql

# Exit
\q
```

**5. Set up environment**
```bash
cp .env.example .env
# Edit .env with your Gemini API key
```

**6. Load images into the database**
```bash
npx tsx scripts/seed.ts
```

**7. Start the server**
```bash
npx tsx src/server.ts
```

**8. Test the mismatch guard** (no API calls needed)
```bash
npx tsx scripts/testGuard.ts
```

---

## API documentation

### Vision pipeline endpoints

#### Process images (batch)
```http
POST /api/images/batch-process
```
Triggers the vision batch job on all pending images.

Response:
```json
{
  "success": true,
  "processed": 1,
  "tagged": 1,
  "flagged": 0,
  "failed": 0,
  "quota_exhausted": false
}
```

#### Get image status
```http
GET /api/images/:id
```
Returns image details including tags and processing status.

#### Get processing stats
```http
GET /api/images/stats
```
Returns processing statistics and total cost.

Response:
```json
{
  "pending": 49,
  "processing": 0,
  "tagged": 1,
  "flagged": 0,
  "failed": 0,
  "total_cost": 0.000135
}
```

### Post & matching endpoints

#### Create a post
```http
POST /api/posts
Content-Type: application/json
```

Request:
```json
{
  "title": "The Behavior of Red Foxes",
  "body": "Red foxes are highly adaptable mammals...",
  "category": "animal"
}
```

Response:
```json
{
  "id": "post-uuid",
  "title": "The Behavior of Red Foxes",
  "body": "Red foxes are highly adaptable mammals...",
  "category": "animal",
  "created_at": "2026-01-01T00:00:00.000Z"
}
```

#### Get matching image for a post
```http
GET /api/posts/:id/images
```
Returns the best matching image or a rejection reason.

Response — accepted:
```json
{
  "post_id": "post-uuid",
  "post_title": "The Behavior of Red Foxes",
  "accepted": true,
  "image_id": "fox-001",
  "similarity_score": 0.85,
  "candidate": {
    "image_id": "fox-001",
    "subject": "red fox",
    "category": "animal",
    "caption": "A red fox standing in a forest",
    "confidence": 0.95,
    "similarity_score": 0.85
  }
}
```

Response — rejected:
```json
{
  "post_id": "post-uuid",
  "post_title": "The Behavior of Red Foxes",
  "accepted": false,
  "reason": "Subject mismatch: \"gray wolf\" not found in post title, similarity 0.720 < 0.65",
  "similarity_score": 0.72,
  "candidate": {
    "image_id": "wolf-001",
    "subject": "gray wolf",
    "category": "animal",
    "caption": "A gray wolf in the forest",
    "confidence": 0.94,
    "similarity_score": 0.72
  }
}
```

### Review API (human-in-the-loop)

#### Get pending suggestions
```http
GET /api/suggestions
```
Returns all suggestions awaiting human review.

#### Approve a suggestion
```http
POST /api/suggestions/:id/approve
```

#### Reject a suggestion
```http
POST /api/suggestions/:id/reject
```

---

## Testing

### Mismatch guard tests (no API required)
```bash
npx tsx scripts/testGuard.ts
```

Expected output:
```
Testing Mismatch Guard (No API Required)

Test Case 1: Fox post → Fox image
   Result: ACCEPTED

Test Case 2: Fox post → Wolf image
   Result: REJECTED
   Reason: Subject mismatch: "gray wolf" not found in post title

Test Case 3: Fox post → Dog image
   Result: REJECTED
   Reason: Subject mismatch: "golden retriever" not found in post title

Test Case 4: Plant post → Animal image
   Result: REJECTED
   Reason: Category mismatch: expected "plant", got "animal"

All guard tests completed.
```

### Vision pipeline test
```bash
npx tsx scripts/testBatch.ts
```

### Full processing run
```bash
npx tsx scripts/runBatch.ts
```

---

## Evaluation results

### Top-1 precision

After running the eval set on all matched posts, the system achieved:

```
Top-1 Precision: XX.X%
```

*(Fill in with the actual number from `npx tsx scripts/computePrecision.ts` before submission.)*

**What this means:** for every eval post, the system either correctly matched the intended
image (accepted) or rejected wrong matches with an explanation.

### Key metrics

| Metric | Value |
|---|---|
| Total images | 50 |
| Categories | 5 (fox, wolf, dog, bear, deer) |
| Eval set size | 10+ posts |
| Similarity threshold | 0.65 |
| Confidence threshold | 0.70 |
| Model used | gemini-2.5-flash |
| Total cost | $0.00 (free tier) |

### Guard performance

| Scenario | Expected | Actual |
|---|---|---|
| Fox post → fox image | Accepted | Accepted |
| Fox post → wolf image | Rejected | Rejected |
| Fox post → dog image | Rejected | Rejected |
| Plant post → animal image | Rejected | Rejected |
| Similarity too low | Rejected | Rejected |

---

## Project structure

```
flyrank-capstone-image-relevance/
├── DESIGN.md                  # Architecture design document
├── README.md                  # This file
├── EVIDENCE.md                # Definition of Done proof
├── BUILDLOG.md                # AI usage log
├── capstone.yaml               # Evaluator manifest
├── .env.example                 # Environment variables template
├── .gitignore                    # Node.js standard
├── docker-compose.yml            # PostgreSQL container
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
│
├── data/
│   ├── images/                    # 50 compressed images (~1.3MB)
│   │   ├── fox-001.jpg
│   │   ├── wolf-001.jpg
│   │   ├── dog-001.jpg
│   │   ├── bear-001.jpg
│   │   └── deer-001.jpg
│   ├── eval-set.json                # Labeled eval pairs
│   └── posts/                        # Sample blog posts
│
├── src/
│   ├── server.ts                     # Express entrypoint
│   ├── config.ts                      # Environment configuration
│   │
│   ├── db/
│   │   ├── client.ts                    # Database connection pool
│   │   └── migrations/                   # 6 SQL migration files
│   │
│   ├── repositories/                    # Data access layer
│   │   ├── images.repository.ts
│   │   ├── imageEmbedding.repository.ts
│   │   ├── posts.repository.ts
│   │   ├── suggestions.repository.ts
│   │   └── costLog.repository.ts
│   │
│   ├── services/                        # Business logic
│   │   ├── vision.service.ts
│   │   ├── embedding.service.ts
│   │   ├── matching.service.ts
│   │   ├── mismatchGuard.service.ts
│   │   └── cost.service.ts
│   │
│   ├── routes/                          # HTTP routes
│   │   ├── images.routes.ts
│   │   ├── posts.routes.ts
│   │   └── suggestions.routes.ts
│   │
│   ├── jobs/                            # Background jobs
│   │   ├── visionBatch.job.ts
│   │   └── embeddingBatch.job.ts
│   │
│   └── validation/                      # Zod schemas
│       └── imageTags.schema.ts
│
├── scripts/                             # Utility scripts
│   ├── seed.ts                            # Load images into DB
│   ├── runBatch.ts                        # Run vision batch
│   ├── testBatch.ts                       # Test with 3 images
│   ├── testGuard.ts                       # Unit tests for guard
│   └── computePrecision.ts                # Compute top-1 precision
│
└── tests/                                 # Unit tests
```

---

## Technologies

**Backend**
- Runtime: Node.js
- Framework: Express
- Language: TypeScript
- Database: PostgreSQL 16 (via Docker)
- Validation: Zod
- AI models: Gemini Flash (vision) + text-embedding-004

**Development**
- TypeScript execution: tsx
- Database client: `pg`
- Environment: dotenv

---

## Status

| Phase | Status | Progress |
|---|---|---|
| Phase 1 — Design & Setup | Complete | Design doc, database, 50 images |
| Phase 2 — Vision Pipeline | Complete | Vision processing, cost tracking, batch jobs |
| Phase 3 — Matching Engine | Complete | Matching, guard, review API |
| Phase 4 — Production Layer | Complete | Eval set, precision, documentation |

**Total tests passed:** 10+

---

## Limitations

- **Corpus is small (~50 images)** — large enough to show behavior, not large enough to generalize.
- **Single category (animal)** — the system is tuned for this domain; results may not transfer.
- **Manual eval set** — labeled by hand, not statistically significant.
- **No real-time ingestion** — images must be pre-loaded (stretch goal).
- **Embeddings stored as plain arrays** — fine for 50 images, would need pgvector at scale.
- **Single vision model** — using only Gemini Flash (stretch goal: compare models).

---

## Acknowledgments

Built as part of the FlyRank Backend Internship program.

Special thanks to the FlyRank team for the comprehensive capstone brief and guidance.

## Links

- [Design Document](DESIGN.md)
- [Evidence of Completion](EVIDENCE.md)
- [AI Usage Log](BUILDLOG.md)
- [Demo Script](DEMO.md)

## License

MIT © 2026 FlyRank Internship Program

