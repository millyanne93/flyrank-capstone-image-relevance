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

---
