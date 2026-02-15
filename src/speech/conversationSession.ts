// Conversation Session Manager
// Maintains an in-memory chat history for multi-turn LLM interactions within
// the Find Target mode.  Includes automatic context compaction so we stay
// within the model's context window.

// ============================================================================
// Types
// ============================================================================

export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ConversationSession {
  /** Full ordered message history (system + user/assistant turns). */
  messages: ConversationMessage[];
  /** Timestamp when the session was created. */
  createdAt: number;
  /** Number of compactions performed so far. */
  compactionCount: number;
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Rough character-per-token ratio.  OpenAI averages ~4 chars/token for English
 * but structured JSON is denser, so we use a slightly lower value to be
 * conservative.
 */
const CHARS_PER_TOKEN = 3.5;

/**
 * Maximum estimated token budget for the *conversation history* (excludes
 * the system prompt, which is always kept).  When we exceed this we trigger
 * compaction.
 */
const MAX_HISTORY_TOKENS = 6_000;

/**
 * Number of most-recent user/assistant message pairs to always preserve
 * verbatim during compaction (so the model still has immediate context).
 */
const PRESERVE_RECENT_PAIRS = 2;

/**
 * The compaction summary is prepended as a system message right after the
 * original system prompt so the model can still reason about prior context.
 */
const COMPACTION_ROLE: ConversationMessage['role'] = 'system';

// ============================================================================
// Public API
// ============================================================================

/** Create a fresh conversation session with the given system prompt. */
export function createSession(systemPrompt: string): ConversationSession {
  return {
    messages: [{ role: 'system', content: systemPrompt }],
    createdAt: Date.now(),
    compactionCount: 0,
  };
}

/** Append a user message to the session. */
export function addUserMessage(session: ConversationSession, content: string): void {
  session.messages.push({ role: 'user', content });
}

/** Append an assistant message to the session. */
export function addAssistantMessage(session: ConversationSession, content: string): void {
  session.messages.push({ role: 'assistant', content });
}

/** Return all messages ready for the API call. */
export function getMessages(session: ConversationSession): ConversationMessage[] {
  return session.messages;
}

/** Estimate the total token count of the session history. */
export function estimateTokens(session: ConversationSession): number {
  let chars = 0;
  for (const msg of session.messages) {
    // +4 per message overhead (role token, separators)
    chars += msg.content.length + 20;
  }
  return Math.ceil(chars / CHARS_PER_TOKEN);
}

/**
 * Check whether the session needs compaction and perform it if so.
 *
 * Compaction works by:
 * 1. Keeping the original system prompt (messages[0]).
 * 2. Keeping the last `PRESERVE_RECENT_PAIRS` user/assistant pairs.
 * 3. Summarising everything in between into a compact system-role recap.
 *
 * This is done *locally* (no extra API call) to avoid latency — we produce a
 * bullet-point summary of the older turns.  If the context is still too large
 * after a local compaction the caller can choose to do an LLM-powered
 * summarisation externally (see `compactWithLLM`).
 *
 * Returns `true` if compaction was performed.
 */
export function compactIfNeeded(session: ConversationSession): boolean {
  const tokens = estimateTokens(session);
  if (tokens <= MAX_HISTORY_TOKENS) return false;

  console.log(
    `🗜️  Session context compaction triggered (≈${tokens} tokens, limit ${MAX_HISTORY_TOKENS})`,
  );

  // Separate system prompt from conversation turns
  const systemPrompt = session.messages[0]; // always keep
  const turns = session.messages.slice(1);

  // Find existing compaction summaries (injected as system messages after the prompt)
  const compactionSummaries: ConversationMessage[] = [];
  const conversationTurns: ConversationMessage[] = [];
  for (const msg of turns) {
    if (msg.role === 'system') {
      compactionSummaries.push(msg);
    } else {
      conversationTurns.push(msg);
    }
  }

  // Figure out which turns to preserve verbatim (last N pairs)
  const preserveCount = PRESERVE_RECENT_PAIRS * 2; // each pair = user + assistant
  const recentTurns = conversationTurns.slice(-preserveCount);
  const olderTurns = conversationTurns.slice(0, -preserveCount);

  if (olderTurns.length === 0) {
    // Nothing to compact — the recent turns alone are too big; just trim
    // the oldest compaction summaries
    if (compactionSummaries.length > 1) {
      session.messages = [systemPrompt, compactionSummaries[compactionSummaries.length - 1], ...recentTurns];
      session.compactionCount++;
      console.log(`  Trimmed old compaction summaries; kept latest summary + ${recentTurns.length} recent turns`);
      return true;
    }
    return false;
  }

  // Build a bullet-point summary of the older turns
  const summaryLines: string[] = [];
  for (let i = 0; i < olderTurns.length; i += 2) {
    const userMsg = olderTurns[i];
    const assistantMsg = olderTurns[i + 1];
    if (userMsg) {
      const userSnippet = truncate(userMsg.content, 100);
      const assistantSnippet = assistantMsg ? extractKeyInfo(assistantMsg.content) : '(no response)';
      summaryLines.push(`• User asked: "${userSnippet}" → ${assistantSnippet}`);
    }
  }

  // Merge with any previous compaction summaries
  const previousSummary = compactionSummaries.map(s => s.content).join('\n');
  const newSummary = [
    '[Conversation history summary]',
    previousSummary ? previousSummary.replace('[Conversation history summary]\n', '') : '',
    ...summaryLines,
  ].filter(Boolean).join('\n');

  const compactionMessage: ConversationMessage = {
    role: COMPACTION_ROLE,
    content: newSummary,
  };

  // Rebuild the session messages
  session.messages = [systemPrompt, compactionMessage, ...recentTurns];
  session.compactionCount++;

  const newTokens = estimateTokens(session);
  console.log(
    `  Compacted: ${olderTurns.length} older turns → summary (${newSummary.length} chars). ` +
    `≈${newTokens} tokens now. Compaction #${session.compactionCount}`,
  );

  return true;
}

/**
 * Reset the session conversation history but keep the system prompt.
 * Useful when the user explicitly starts a "new topic".
 */
export function resetSession(session: ConversationSession): void {
  const systemPrompt = session.messages[0];
  session.messages = [systemPrompt];
  session.compactionCount = 0;
}

/** Get a short diagnostic string describing the session state. */
export function sessionInfo(session: ConversationSession): string {
  const turns = session.messages.filter(m => m.role !== 'system').length;
  const tokens = estimateTokens(session);
  return `turns=${turns} ≈${tokens}tok compactions=${session.compactionCount}`;
}

// ============================================================================
// Internal helpers
// ============================================================================

/** Truncate a string to `max` characters with ellipsis. */
function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}

/**
 * Extract key information from an assistant response for the compaction
 * summary.  If the response is valid JSON we pull out the object name(s);
 * otherwise we just truncate it.
 */
function extractKeyInfo(content: string): string {
  try {
    const cleaned = content.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(cleaned);

    // Single object response
    if (parsed.name) {
      return `Found "${parsed.name}" (${parsed.type ?? '?'}, RA=${parsed.ra}h Dec=${parsed.dec}°)`;
    }

    // Candidates array
    if (Array.isArray(parsed.candidates)) {
      const names = parsed.candidates.slice(0, 4).map((c: { name?: string }) => c.name).filter(Boolean);
      return `Candidates: ${names.join(', ')}${parsed.candidates.length > 4 ? '…' : ''}`;
    }

    // Error sentinel
    if (parsed.error) {
      return `Error: ${parsed.error}`;
    }
  } catch {
    // Not JSON — just truncate
  }

  return truncate(content, 120);
}
