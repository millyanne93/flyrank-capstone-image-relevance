# BUILDLOG.md - AI Usage Log

## Phase 1: Design & Setup

### AI Tools Used
- **Tool**: Claude (via web interface)
- **Purpose**: Architecture design, code generation, debugging assistance
- **Frequency**: Heavy usage during initial setup

### Where AI Helped

| File/Component | What AI Provided | My Changes |
|----------------|------------------|------------|
| DESIGN.md | Initial architecture outline, data model suggestions | Refined non-goals, added state machine, clarified guard logic |
| src/config.ts | Environment variable structure | Added Gemini specific config |
| src/db/client.ts | Connection pool setup | Added error handling |
| src/validation/imageTags.schema.ts | Zod schema for Gemini output | Added field-specific validation |
| Migrations | All 6 migration files | Added proper indexes and constraints |

### Where AI Got It Wrong

| Issue | What Happened | How I Fixed It |
|-------|---------------|----------------|
| Alpine PostgreSQL user issue | AI suggested 'postgres' user but I used 'image_user' | Updated connection commands to use 'image_user' |
| Missing dev script in package.json | AI's package.json had scripts I didn't copy | Added "dev": "tsx src/server.ts" to package.json |

### Lessons Learned
1. Always check your .env matches your docker-compose.yml credentials
2. The Alpine PostgreSQL image has user creation quirks
3. `tsx` is the simplest way to run TypeScript without extra config

## Phase 2: Vision Pipeline

### AI Tools Used
- **Tool**: Claude (via web interface)
- **Purpose**: Vision service, batch job, error handling, debugging
- **Frequency**: Heavy usage during Phase 2 implementation

### Where AI Helped

| File/Component | What AI Provided | My Changes |
|----------------|------------------|------------|
| src/services/vision.service.ts | Gemini Flash integration with structured output | Added JSON cleanup, UUID handling, error recovery |
| src/services/cost.service.ts | Cost estimation and logging | Added per-call tracking |
| src/jobs/visionBatch.job.ts | Batch processing with retries | Added quota handling, stale recovery, smarter retry logic |
| src/repositories/images.repository.ts | Database operations | Added recovery functions |
| scripts/testBatch.ts | Test script for small batches | Added 3-image test mode |

### Where AI Got It Wrong

| Issue | What Happened | How I Fixed It |
|-------|---------------|----------------|
| JSON parsing bug | AI parsed `responseText` instead of `cleanResponse` | Changed to parse cleaned response |
| UUID error | AI passed file path to `logCost()` instead of UUID | Changed to pass `image.id` |
| API key invalid | AI didn't check key format | Realized key was Anthropic, not Gemini; created new key |
| Quota handling | AI retried quota errors immediately | Added detection to stop batch on quota exhaustion |
| Variable scope | `quota_exhausted` vs `quotaExhausted` mismatch | Unified variable naming |

### Lessons Learned
1. Always parse `cleanResponse` after removing markdown fences
2. Gemini API keys start with `AIzaSy...` (not `sk-ant-api...`)
3. Daily quota: 20 requests/day for gemini-2.5-flash free tier
4. Process small batches (2-3 images) to stay within quota
5. Stale `processing` jobs need recovery after 10+ minutes
6. Use UUIDs for database references, not file paths

### Phase 2 Status

| Feature | Status | Evidence |
|---------|--------|----------|
| Vision model integration | ✅ Working | bear-001.jpg → polar bear (conf: 0.98) |
| Structured output | ✅ Working | JSON parsed and validated |
| Batch job with retries | ✅ Working | Processes pending images |
| Cost tracking | ✅ Working | $0.00013500 logged per call |
| Low-confidence flagging | ✅ Working | Confidence threshold: 0.70 |
| Stale recovery | ✅ Implemented | Recovers stuck `processing` jobs |

### Quota Status
- **Model**: gemini-3.6-flash
- **Daily Limit**: 20 requests/day
- **Used**: 1 (bear-001.jpg successfully tagged)
- **Remaining**: Wait for daily reset


## Phase 3: Matching Engine & Mismatch Guard

### AI Tools Used
- **Tool**: Claude (via web interface)
- **Purpose**: Matching engine, mismatch guard, review API
- **Frequency**: Moderate usage during Phase 3 implementation

### Where AI Helped

| File/Component | What AI Provided | My Changes |
|----------------|------------------|------------|
| src/services/mismatchGuard.service.ts | Guard logic with category/subject/similarity rules | Added threshold config |
| src/services/matching.service.ts | Cosine similarity + candidate ranking | Added suggestion storage |
| src/repositories/suggestions.repository.ts | Review queue operations | Added join with posts/images |
| strc/routes/posts.routes.ts | Post CRUD + matching endpoint | Added embedding generation |

### Phase 3 Status

| Feature | Status | Evidence |
|---------|--------|----------|
| Mismatch Guard | ✅ Working | Unit tests pass (fox/wolf/dog) |
| Post creation | ✅ Working | API endpoint tested |
| Suggestions table | ✅ Working | Database queries work |
| Review API | ✅ Implemented | Approve/reject endpoints |

