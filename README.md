# Greheads

A free daily newsletter for GRE verbal preparation. One curated article per day — with vocabulary in context and MCQ comprehension questions — delivered to your inbox every morning.

---

## What It Does

GRE verbal prep is mostly flashcards and decontextualised word lists. Greheads takes a different approach: readers encounter GRE-tier vocabulary inside real, intellectually serious writing — the same way the actual GRE presents it.

Each day, subscribers receive:
- A 350-450 word excerpt from a curated article (Science, Humanities, Social Science, or Business)
- 3 GRE-tier vocabulary words defined in context
- 2 MCQ comprehension questions (main idea, inference, tone, or structure)
- A link to answer questions and check their score

Sources: Aeon, Quanta Magazine, Nautilus, Smithsonian Magazine, The Conversation, The Atlantic.

---

## Architecture

**Stack:** Next.js 16 (App Router) + Supabase (PostgreSQL) + Resend (email) + Groq (LLM) + Vercel (hosting + cron)

**Pipeline:**

```
RSS Feeds
   ↓
/api/score          — fetches RSS, scrapes full article text via cheerio,
                      scores candidates using groq/compound-mini (3 dimensions:
                      linguistic difficulty, GRE fit, topic suitability),
                      saves passing articles to scored_candidates table

/api/enrich         — picks highest-scoring pending candidate, enriches it
                      using openai/gpt-oss-120b (via Groq) to extract excerpt,
                      vocab, and MCQ questions, saves to articles table

/api/cron/send      — runs at 8am daily, sends enriched article to all active
                      subscribers via Resend, marks article as sent
```

**Why scoring and enrichment are decoupled:** The Groq free tier has an 8000 TPM rate limit on the 120b model. Running both in the same request exhausts the budget before enrichment can complete. Separate endpoints means separate TPM windows.

**Scoring rubric (out of 15, threshold: 9):**
- `linguistic_difficulty` (1-5): sentence complexity, subordinate clauses, GRE-tier vocabulary density
- `gre_fit` (1-5): formal register, hedging language, argumentative structure
- `topic_suitability` (1-5): intellectually serious, non-listicle, substantive content

Topic rotation across 4 categories ensures balanced coverage across the week.

---

## Database Schema

**`articles`** — enriched, ready-to-send articles
- id, title, source, url, excerpt, topic, difficulty, reading_time
- gre_vocab (jsonb): [{word, definition, sentence}]
- questions (jsonb): [{question, options: [A,B,C,D], answer}]
- score, published_at, sent, sent_at, created_at

**`scored_candidates`** — scoring queue, decoupled from enrichment
- id, title, source, url, content, topic_hint, score, topic
- status: pending → enriched | failed

**`subscribers`** — email list
- id, email, confirmation_token, active, subscribed_at

---

## Current State (as of September 2026)

- Landing page live at greverbal-prep.vercel.app
- Ingestion pipeline working end-to-end
- ~18 articles stored across Science, Humanities, Social Science (6 each)
- Email send pipeline built, not yet tested end-to-end
- Article reader page (`/articles/[id]`) exists but not styled
- No Business topic articles yet (no business-focused RSS sources added)

**Known issues:**
- Groq 120b model occasionally returns malformed JSON in enrichment responses (unescaped characters inside string values) — needs more robust parsing
- Session-only crons for bulk ingestion (need to be restarted if session closes)
- Unsubscribe page not built yet
- Email confirmation flow not end-to-end tested

**Immediate next steps:**
1. Fix JSON parsing robustness in enrichment
2. Build article reader page
3. Build unsubscribe page
4. End-to-end test: subscribe → confirm → receive email → click → read + answer questions
5. Manual QA of existing articles before public launch

---

## Local Development

```bash
npm install
cp .env.example .env.local   # add SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, GROQ_API_KEY, NEXT_PUBLIC_BASE_URL, CRON_SECRET
npm run dev
```

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_BASE_URL` | Public URL (e.g. https://greverbal-prep.vercel.app) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `RESEND_API_KEY` | Resend API key for email delivery |
| `GROQ_API_KEY` | Groq API key for LLM scoring and enrichment |
| `CRON_SECRET` | Bearer token to authenticate cron endpoints |
