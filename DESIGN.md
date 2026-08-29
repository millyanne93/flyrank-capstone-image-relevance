# Design Doc — AI Image Understanding & Content Matching Engine

## 0. One-Line Summary
> A system that automatically matches images to blog posts using vision AI and embeddings, with a safety guard that rejects incorrect matches (e.g., fox vs. wolf) and provides explicit human-readable reasoning.

---

## 0.5. System Flow

```text
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Images    │────▶│   Vision    │────▶│ Embeddings  │────▶│  Matching   │
│  (pending)  │     │    Batch    │     │  (caption)  │     │  + Guard    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                                                   ▼
┌─────────────┐     ┌─────────────┐                         ┌─────────────┐
│    Posts    │────▶│ Embeddings  │────────────────────────▶│ Suggestion  │
│  (content)  │     │ (title+body)│                         │ (accepted/  │
└─────────────┘     └─────────────┘                         │  rejected/  │
                                                            │  no_match)  │
                                                            └─────────────┘
                                                                   │
                                                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                               Review API                                │
│       GET /suggestions  |  POST /suggestions/:id/approve | /reject      │
└─────────────────────────────────────────────────────────────────────────┘
```
## 1. Problem

Given a library of images and a library of blog posts, automatically determine which image belongs with which post — based on what the image actually depicts, not filenames or keywords.

A post about red foxes should surface a red-fox image; a visually similar wolf image must be rejected, not just ranked lower. When no image is a good enough match, the system must say so explicitly rather than guessing.

**The core discipline:** treat the vision model as an unreliable-but-useful component. Every model output is schema-validated before anything downstream trusts it, and a dedicated safety layer (the mismatch guard) makes the final accept/reject call — combining tag agreement, semantic similarity, and the model's own confidence score.

---

## 2. Non-goal

**No multi-image posts.** Each post gets at most one suggested image. No "pick the best 3 of 5" ranking, no image galleries, no multi-image approval flows. This keeps the guard's decision binary and testable — "is there one good enough match, yes or no" — which is exactly what the acceptance probes check.

---

## 3. Corpus: Where to Get Images

### Recommended Sources (Free, No Credit Card)

| Source | License | Notes |
|--------|---------|-------|
| **Unsplash** | Free to use | High quality, easy to search |
| **Pexels** | Free to use | Good variety |
| **Pixabay** | Free to use | Large library |
| **Wikimedia Commons** | Various free licenses | Good for specific species |

### Direct Links to Search Results

| Category | Direct Search Link | Count |
|----------|-------------------|-------|
| Red Fox | [Unsplash: red fox](https://unsplash.com/s/photos/red-fox) | 10 |
| Wolf | [Unsplash: wolf](https://unsplash.com/s/photos/wolf) | 10 |
| Dog | [Unsplash: dog](https://unsplash.com/s/photos/dog) | 10 |
| Bear | [Unsplash: bear](https://unsplash.com/s/photos/bear) | 10 |
| Deer | [Unsplash: deer](https://unsplash.com/s/photos/deer) | 10 |

**Total: ~50 images.**

### How to Download

**Option 1: Manual Download (Simplest, Recommended)**

1. Click the links above to go to Unsplash
2. Search each term
3. Download images (click image → "Download" button)
4. **Important:** Keep images small (300-500px width) to save disk space and speed up processing
5. Save to: `data/images/<category>/`

**Option 2: Quick Start (Unblock Phase 2)**

Begin with just **10 images** (2 per category) to unblock Phase 2 development:
data/
├── images/
│ ├── fox-001.jpg
│ ├── fox-002.jpg
│ ├── wolf-001.jpg
│ ├── wolf-002.jpg
│ ├── dog-001.jpg
│ ├── dog-002.jpg
│ ├── bear-001.jpg
│ ├── bear-002.jpg
│ ├── deer-001.jpg
│ └── deer-002.jpg
├── posts/
│ └── post-001.txt
└── eval-set.json

text

**Expand to the full ~50 before Phase 4** — a small corpus (2 per category) won't produce a meaningful precision number.

---

## 4. Image Metadata Schema

Every vision model response is validated against this shape before being trusted:

```json
{
  "subject": "red fox",
  "category": "animal",
  "attributes": ["orange fur", "wild", "forest"],
  "caption": "A red fox standing in a forest",
  "confidence": 0.94
}
```
Field	Type	Notes
subject	string	The specific thing depicted — used for the guard's tag-match check
category	string	Coarse grouping (animal, in this corpus)
attributes	string[]	Descriptive tags — useful context, not used for hard matching
caption	string	Full sentence — this is what gets embedded, not just the subject
confidence	number, 0–1	The model's own certainty
A response that fails schema validation (missing field, wrong type, confidence outside 0–1) is treated as a failed vision call — retried by the batch job, never passed downstream as-is.

## 5. Data Model
images
Column	Type	Notes
id	uuid, PK	
filename	text, unique	stable human-readable id, also used by the eval set
filepath	text	path to the image file
subject	text, nullable	null until processed
category	text, nullable	
attributes	jsonb, nullable	
caption	text, nullable	
confidence	real, nullable	
processing_status	enum: pending, processing, tagged, flagged, failed	see Section 6 for the state machine
created_at	timestamptz	
updated_at	timestamptz	
Why processing is a required state, not optional: the batch job needs to distinguish "not started yet" from "currently mid-call." Without it, re-running the batch endpoint while a previous run is still in flight risks double-processing the same image — duplicate vision calls, duplicate cost-log entries, and a race on which result wins. See Section 6.

image_embeddings
Column	Type	Notes
image_id	uuid, PK, FK → images	one embedding per image, keyed on caption
embedding	float[]	plain array — pgvector not needed at ~50 rows
created_at	timestamptz	
posts
Column	Type	Notes
id	uuid, PK	
title	text	
body	text	
category	text, nullable	manually assigned for demo — the guard checks this against the image's category
created_at	timestamptz	
How the post's category is assigned: For this demo, posts.category is set manually when creating a post. The guard's category check compares this against the image's category field. In a production system, you could infer this from the post's content, but manual assignment keeps Phase 3 simpler.

post_embeddings
Column	Type	Notes
post_id	uuid, PK, FK → posts	
embedding	float[]	
created_at	timestamptz	
suggestions — the guard's decision
Column	Type	Notes
id	uuid, PK	
post_id	uuid, FK → posts, indexed	
image_id	uuid, FK → images, nullable	null when nothing was seriously considered a match
similarity_score	real, nullable	null in the no_match case
guard_decision	enum: accepted, rejected, no_match	see note below — this is 3 states, not 2
guard_reason	text	human-readable explanation, always populated
review_status	enum: pending, approved, rejected	the human's review outcome, separate from the guard's own decision
created_at	timestamptz	
Why guard_decision needs three states, not two: rejected means a specific candidate was evaluated and explicitly turned down (e.g. wolf offered for a fox post — an informative, nameable failure). no_match means nothing even came close enough to seriously evaluate — a weaker, different kind of outcome. Collapsing these loses information you'll want later, both for the review API's explanations and for interpreting eval results.

cost_log
Column	Type	Notes
id	uuid, PK	
call_type	enum: vision, embedding	
reference_id	uuid	the image or post id this call was for
estimated_cost_usd	numeric	logged even on the free tier, using Gemini's published per-token pricing as an as-if-paid estimate
created_at	timestamptz	
Indexes Worth Calling Out
images(processing_status) — the batch job scans for pending rows

suggestions(post_id) — lookup for the review API

cost_log(call_type, created_at) — range-scannable for "total vision cost this run" type queries, and needed to satisfy the cost-tracking acceptance probe

## 6. The Pipeline
text
1. Ingest
   Images loaded into `images` table, processing_status = 'pending'.

2. Vision batch job (idempotent — only ever claims 'pending' rows)
   For each pending image:
     ├── mark processing_status = 'processing' (claims the row, prevents double-processing
     │    if the job is re-triggered mid-run)
     ├── call Gemini Flash: image + prompt → structured output
     ├── validate response against the schema (Section 4)
     ├── invalid response          → retry (up to 3x, with exponential backoff) →
     │                                  still invalid → processing_status = 'failed'
     ├── valid, confidence ≥ 0.70  → processing_status = 'tagged', tags saved
     ├── valid, confidence < 0.70  → processing_status = 'flagged' — excluded from ranking
     │    entirely (see Section 10) — never reaches the guard at all
     └── log cost to cost_log regardless of outcome

   Rate Limit Handling (Gemini Free Tier):
     - Gemini Flash free tier has RPM limits (~60 requests per minute)
     - For ~50 images, this is fine — but if you hit a 429:
         1. Wait 60 seconds
         2. Retry with exponential backoff (2s → 4s → 8s → 16s)
         3. Log the retry so you know it happened
     - This is a real-world concern that shows you've thought about production constraints

3. Embedding generation (runs after vision, only over 'tagged' images)
   For each tagged image: embed(caption) → image_embeddings
   For each post:          embed(title + body) → post_embeddings
   Log cost to cost_log.

4. Matching + guard   —  GET /posts/:id/images
   ├── compute cosine similarity: post embedding × every 'tagged' image's embedding
   │    ('flagged' images are not candidates — excluded upstream in step 2)
   ├── rank candidates, take the top one
   ├── guard evaluates the top candidate:
   │     - category matches the post's category?  no → reject
   │     - subject doesn't conflict with what the post names? no → reject
   │     - similarity ≥ threshold?                 no → reject
   ├── passes all checks → guard_decision = 'accepted', image + reason returned
   ├── top candidate exists but fails a check → guard_decision = 'rejected', reason returned,
   │    no image returned
   └── no candidate even close enough to seriously evaluate → guard_decision = 'no_match',
        reasons for the closest-but-still-far candidate returned

5. Review API
   GET  /api/suggestions?status=pending
   POST /api/suggestions/:id/approve
   POST /api/suggestions/:id/reject
Note on confidence: confidence is checked exactly once, at ingestion (step 2). A flagged image never becomes a ranking candidate, so the guard (step 4) never needs its own confidence check — by the time something reaches the guard, its confidence has already cleared the bar. This is a deliberate simplification: confidence is a property of the tags themselves, decided once when the tags are produced, not re-litigated at match time.

## 7. The Mismatch Guard — Decision Rules
The guard rejects the top candidate if any of the following hold:

Rule	What it checks	Example
1. Category mismatch	Does the image's category match the post's category?	Post about "red fox" → image category "plant" → REJECT
2. Subject mismatch	Does the image's subject conflict with a subject the post names?	Post mentions "fox" → image subject "wolf" → REJECT
3. Similarity too low	Is cosine similarity below the tuned threshold?	Similarity 0.41 < threshold 0.65 → REJECT
Every rejection returns a human-readable guard_reason, e.g.:

"Category mismatch: expected animal, got plant"

"Subject mismatch: expected fox, detected wolf"

"Similarity 0.41 below threshold 0.65"

If the top candidate is rejected and no other candidate is meaningfully closer, the endpoint returns no_match with the same explanation attached to the closest candidate — so the failure is always explainable, never silent.

## 8. API Surface
Method	Route	Purpose
POST	/api/images/batch-process	Kicks off the vision batch job over pending images — safe to call repeatedly (see Section 6's idempotency note)
GET	/api/images/:id	Inspect one image's tags, status, confidence
GET	/api/images/stats	Get processing statistics and total cost
POST	/api/posts	Create a post (triggers its embedding)
GET	/api/posts	List all posts
GET	/api/posts/:id/images	The core matching endpoint — ranked suggestion, rejection, or no-match
GET	/api/suggestions?status=pending	Review queue
POST	/api/suggestions/:id/approve	Human confirms the guard's suggestion
POST	/api/suggestions/:id/reject	Human overrides the guard's suggestion
GET	/api/costs	Per-call cost log
## 9. Layering
text
routes/          — HTTP only: parse request, call service, map result to status code
services/        — business logic: vision orchestration, embedding orchestration,
                   the mismatch guard, similarity ranking — no SQL here
repositories/     — all SQL lives here
jobs/            — the batch vision/embedding job, retry + backoff logic
The guard lives in its own file (services/mismatchGuard.service.ts) and is unit-tested against hardcoded fox/wolf-style inputs before it's wired into the live matching endpoint — build and prove this module in isolation first, per the brief's own recommended Phase 3 order.

## 10. Threshold Strategy
Threshold	Starting value	How it's finalized
Similarity	0.65	Tuned in Phase 4 against the labeled eval set — the starting value is a placeholder, not a defended number
Confidence (ingestion-time flagging)	0.70	Matches Gemini's typical confidence scale; revisit if Phase 2 shows too many/few images getting flagged
Start with these values to unblock development, but the number that goes in the README must come from the eval set, not from these defaults.

## 11. Eval Set (Phase 4)
json
{
  "eval_set": [
    {
      "post_id": "b1eb923d-94e4-483d-b415-829912bd4558",
      "post_title": "The Behavior of Red Foxes",
      "correct_image_filename": "fox-006.jpg"
    },
    {
      "post_id": "d562485e-7ad1-4692-9098-60cbf57f20b8",
      "post_title": "Wolf Pack Dynamics",
      "correct_image_filename": "wolf-004.jpg"
    },
    {
      "post_id": "682d4492-ee55-4f9b-86d9-868db945c97c",
      "post_title": "Understanding Dog Behavior",
      "correct_image_filename": "dog-002.jpg"
    },
    {
      "post_id": "7834cfe3-f945-4e44-b5de-e96951fc537f",
      "post_title": "The Life of Bears",
      "correct_image_filename": "bear-002.jpg"
    },
    {
      "post_id": "09bbd858-650a-4c63-bb2f-e7ed3dc64972",
      "post_title": "Deer in the Wild",
      "correct_image_filename": "deer-009.jpg"
    }
  ]
}
Uses correct_image_filename, not a raw UUID. images.id is a generated uuid — hand-writing UUIDs into a JSON file before the database exists isn't practical and is a good way to introduce a silent mismatch bug. The eval script resolves filename → id via images.filename (unique, per Section 5) at run time instead.

Start with 5 labeled pairs, expand as time allows — more pairs produce a more defensible precision number, but 5 is enough to unblock Phase 4.

## 12. What Success Looks Like
Test	Expected result
Fox post → fox image available	Fox image ranks #1, guard_decision = accepted
Fox post → only wolf image available	guard_decision = rejected, category/subject reason given
Fox post → only dog image available	Rejected or ranks clearly below any real fox candidate
Post with no plausible image in the corpus	guard_decision = no_match, reasons given
Eval script run	Top-1 precision computed and printed, matches the number in the README
## 13. Open Questions / Decisions Made
Question	Decision
What happens to flagged (low-confidence) images?	Excluded from ranking entirely, at ingestion — never reach the guard (Section 6)
What if all candidates are rejected?	Return no_match with reasons for the closest-but-still-rejected candidate
What if the vision model is confidently wrong?	The guard's category/subject/similarity checks catch it regardless of stated confidence
Can the batch job be safely re-run?	Yes — it only claims pending rows and marks them processing immediately, so a re-trigger mid-run does not reprocess in-flight images (Section 6)
What happens if Gemini's free-tier rate limit is hit mid-batch?	Batch job treats a 429 as a transient failure — retries with backoff (2s → 4s → 8s → 16s), not an immediate failed status (Section 6)
How is the post's category assigned?	Manually set on the posts table for the demo (Section 5)
## 14. Limitations 
Corpus is small (~50 images) — large enough to show behavior, not large enough to generalize.

Single category (animal) — the system is tuned for this domain; results may not transfer to other categories.

Manual eval set — labeled by hand, not statistically significant. Good for demonstration, not for production quality claims.

5 images remain pending — due to Gemini API daily quota limits (20 requests/day).

No real-time ingestion — images must be pre-loaded; the system doesn't handle new images automatically (stretch goal).

Embeddings are stored as plain arrays — fine for 50 images, would need pgvector or a dedicated vector index at scale.

No comparison between vision models — using only Gemini Flash (stretch goal).

Post category is manually assigned — in production, you'd infer this from the post content.

## 15. Next Steps (Phase 1 → Phase 4)
☑ Design doc complete
☑ Gather ~50 images (start with 10, expand before Phase 4)
☑ Set up PostgreSQL (Docker)
☑ Get a Gemini Flash API key (free, Google account, no card)
☑ Build the vision batch job with the state machine from Section 6
☑ Generate embeddings (44 images, 7 posts)
☑ Build matching engine with mismatch guard
☑ Compute precision (80.0%)
☑ Complete documentation

## 16. Quick Links for Phase 2
Gemini API — Image understanding docs

Gemini API — Structured output docs

Gemini Pricing & Free Tier

Zod — Schema validation

Ollama — Local vision models (free, offline alternative)



