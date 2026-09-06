---
name: app-ai
description: >-
  Integrates, optimizes, and secures AI and Large Language Model (LLM) features.
  Use this skill whenever the user requests AI integration, chat features, embeddings,
  RAG pipelines, structured outputs, prompt engineering, or runs /ai or /llm.
---

# App AI & LLM Integration Skill

This skill guides the agent in integrating production-grade AI and LLM features into fullstack applications. It prevents common AI anti-patterns: runaway token costs, unhandled rate limits, non-streaming UI freezes, and unstructured, unreliable model outputs.

---

## AI Engineering Standards

### 1. Recommended SDK & Libraries
- **Vercel AI SDK** (`ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`): Preferred for Next.js, React, and modern TypeScript stacks.
- **Provider SDKs**: Direct official SDKs (`openai`, `@google/genai`, `@anthropic-ai/sdk`) when Vercel AI SDK is not applicable.
- **Structured Outputs**: Always use `generateObject` or `streamObject` with **Zod schemas** to guarantee reliable JSON data shapes.

---

## Workflow Steps

### Step 1: Feature Specification
Determine the AI workflow type:
1. **Streaming Chat / Assistant**: Conversational UI with real-time text streaming.
2. **Structured Data Extraction / Generation**: Extracting typed objects, JSON summaries, classification.
3. **Embeddings & Vector Search (RAG)**: Generating vector representations for semantic search.
4. **Agentic Tool Calling**: Enabling LLMs to trigger internal API tools safely.

---

### Step 2: Prompt Management & Externalization
1. **Never Hardcode System Prompts Inline**:
   - Store prompts in dedicated files: `src/lib/ai/prompts/<feature>.prompt.ts`.
2. **Prompt Architecture**:
   - Identity & Role definition.
   - Strict output constraints & negative constraints ("Do NOT output markdown fences...").
   - Few-shot examples if complex reasoning is needed.
   - Dynamic variable injection via typed parameters.

---

### Step 3: Structured Output Enforcement
When the UI or database expects structured data, enforce it via Zod:

```typescript
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const AnalysisSchema = z.object({
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  confidenceScore: z.number().min(0).max(1),
  keyPoints: z.array(z.string()).max(5),
  actionRequired: z.boolean()
});

const result = await generateObject({
  model: openai('gpt-4o-mini'),
  schema: AnalysisSchema,
  prompt: userText,
});
```

---

### Step 4: Streaming & UX Responsiveness
1. For user-facing generation longer than 1 sentence, **always stream** responses using `streamText()` or Server-Sent Events (SSE).
2. Render immediate loading indicators (skeleton screens / typing indicators).
3. Handle stream interruptions, cancellations, and client disconnections cleanly (`AbortController`).

---

### Step 5: Cost, Rate Limiting & Safety Controls
1. **Model Selection Discipline**:
   - Use cost-efficient models (e.g. `gpt-4o-mini`, `gemini-1.5-flash`, `claude-3-5-haiku`) for routine tasks.
   - Reserve frontier models for complex multi-step reasoning.
2. **Token Limits**: Always set `maxTokens` on generation calls.
3. **Timeout Safeguards**: Always set explicit request timeouts (e.g. 15–30 seconds).
4. **Rate Limiting**: Protect AI routes with rate limiting (e.g. Upstash Redis, in-memory bucket) to prevent cost denial-of-service.
5. **API Key Security**: Ensure `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or `GEMINI_API_KEY` are only ever accessed in server environments (never exposed to browser bundles).

---

### Step 6: Completion Report
```markdown
## 🤖 AI Feature Integration Complete

- **Feature**: [Chat / Structured Extraction / RAG]
- **SDK**: [Vercel AI SDK / Official Provider SDK]
- **Model**: [Model Name, e.g. gpt-4o-mini]
- **Streaming**: [Enabled / Disabled]
- **Structured Schema**: [Zod Schema Name or Freeform]
- **Cost Safeguards**: maxTokens set, timeouts configured, rate limit verified
```

---

## Error Handling & Fallbacks

If AI / LLM requests fail during generation or streaming:
1. **Model Rate Limits (429)**: Implement automated retry with exponential backoff and jitter, or fallback to an alternative model tier.
2. **Schema Parsing Rejections**: When structured output does not match Zod schema, pass the schema error back to the model for one correction pass, or fallback to safe defaults.
3. **Context Length Exceeded**: Implement token truncation or message pruning (e.g. keep system prompt + last N messages).
4. **Escalate**: If API keys lack credits or quota is exhausted, warn developer with provider link to check billing dashboard.

