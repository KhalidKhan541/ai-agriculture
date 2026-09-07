// ============================================================================
// AI Agriculture Platform - Multi-Provider AI Service
// Supports OpenAI, Anthropic Claude, and Google Gemini
// ============================================================================

import type {
  ProviderName,
  AIProviderConfig,
  AIRequestOptions,
  AIResponse,
  AIStreamingChunk,
} from '../../types';

// ---------------------------------------------------------------------------
// Provider Configuration Store
// ---------------------------------------------------------------------------

interface ProviderInstance {
  name: ProviderName;
  config: AIProviderConfig;
  lastUsed: Date;
  requestCount: number;
  totalTokens: number;
  errorCount: number;
  avgLatencyMs: number;
  latencySamples: number[];
}

const providerInstances = new Map<ProviderName, ProviderInstance>();

// ---------------------------------------------------------------------------
// Error Classes
// ---------------------------------------------------------------------------

export class AIProviderError extends Error {
  constructor(
    public provider: ProviderName,
    public statusCode: number,
    message: string,
    public retryable: boolean = false
  ) {
    super(`[${provider}] ${message}`);
    this.name = 'AIProviderError';
  }
}

export class RateLimitError extends AIProviderError {
  public retryAfterMs: number;

  constructor(provider: ProviderName, retryAfterMs: number) {
    super(provider, 429, `Rate limit exceeded. Retry after ${retryAfterMs}ms`, true);
    this.name = 'RateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

export class ProviderNotConfiguredError extends Error {
  constructor(provider: ProviderName) {
    super(`Provider '${provider}' is not configured. Add it via configureProvider().`);
    this.name = 'ProviderNotConfiguredError';
  }
}

// ---------------------------------------------------------------------------
// Prompt Template System
// ---------------------------------------------------------------------------

export interface PromptTemplate {
  id: string;
  name: string;
  systemPrompt: string;
  userPromptTemplate: string;
  variables: string[];
  provider?: ProviderName;
  options?: AIRequestOptions;
}

const promptTemplates = new Map<string, PromptTemplate>();

export function registerPromptTemplate(template: PromptTemplate): void {
  promptTemplates.set(template.id, template);
}

export function getPromptTemplate(id: string): PromptTemplate | undefined {
  return promptTemplates.get(id);
}

export function buildPrompt(
  templateId: string,
  variables: Record<string, string>
): { systemPrompt: string; userPrompt: string } {
  const template = promptTemplates.get(templateId);
  if (!template) throw new Error(`Prompt template '${templateId}' not found`);

  let systemPrompt = template.systemPrompt;
  let userPrompt = template.userPromptTemplate;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    systemPrompt = systemPrompt.replaceAll(placeholder, value);
    userPrompt = userPrompt.replaceAll(placeholder, value);
  }

  const unresolvedSystem = systemPrompt.match(/\{\{(\w+)\}\}/g);
  const unresolvedUser = userPrompt.match(/\{\{(\w+)\}\}/g);
  if (unresolvedSystem || unresolvedUser) {
    const missing = new Set([
      ...(unresolvedSystem ?? []),
      ...(unresolvedUser ?? []),
    ]);
    throw new Error(`Unresolved template variables: ${[...missing].join(', ')}`);
  }

  return { systemPrompt, userPrompt };
}

// ---------------------------------------------------------------------------
// Provider Registry
// ---------------------------------------------------------------------------

export function configureProvider(config: AIProviderConfig): void {
  const instance: ProviderInstance = {
    name: config.name,
    config,
    lastUsed: new Date(),
    requestCount: 0,
    totalTokens: 0,
    errorCount: 0,
    avgLatencyMs: 0,
    latencySamples: [],
  };
  providerInstances.set(config.name, instance);
}

export function getProviderConfig(name: ProviderName): AIProviderConfig {
  const instance = providerInstances.get(name);
  if (!instance) throw new ProviderNotConfiguredError(name);
  return instance.config;
}

export function removeProvider(name: ProviderName): boolean {
  return providerInstances.delete(name);
}

export function listProviders(): ProviderName[] {
  return [...providerInstances.keys()];
}

export function getProviderStats(name: ProviderName): ProviderInstance | undefined {
  return providerInstances.get(name);
}

// ---------------------------------------------------------------------------
// Retry Logic with Exponential Backoff
// ---------------------------------------------------------------------------

async function withRetry<T>(
  fn: () => Promise<T>,
  provider: ProviderName,
  maxAttempts: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      const instance = providerInstances.get(provider);
      if (instance) instance.errorCount++;

      if (err instanceof RateLimitError) {
        const delay = err.retryAfterMs || baseDelayMs * Math.pow(2, attempt);
        console.warn(`[AI] Rate limited by ${provider}, retrying in ${delay}ms (attempt ${attempt}/${maxAttempts})`);
        await sleep(delay);
        continue;
      }

      if (err instanceof AIProviderError && err.retryable && attempt < maxAttempts) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        console.warn(`[AI] ${provider} error (attempt ${attempt}/${maxAttempts}), retrying in ${delay}ms`);
        await sleep(delay);
        continue;
      }

      if (err instanceof AIProviderError && !err.retryable) {
        throw err;
      }
    }
  }
  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// OpenAI Provider Implementation
// ---------------------------------------------------------------------------

async function callOpenAI(
  config: AIProviderConfig,
  messages: { role: string; content: string }[],
  options: AIRequestOptions
): Promise<AIResponse> {
  const startTime = Date.now();
  const url = `${config.baseUrl || 'https://api.openai.com/v1'}/chat/completions`;

  const body = {
    model: config.model,
    messages,
    max_tokens: options.maxTokens || config.maxTokens || 4096,
    temperature: options.temperature ?? config.temperature ?? 0.7,
    top_p: options.topP,
    frequency_penalty: options.frequencyPenalty,
    presence_penalty: options.presencePenalty,
    stop: options.stopSequences,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
      'X-Request-Id': crypto.randomUUID(),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(config.timeout || 60000),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => 'unknown');
    const retryable = response.status === 429 || response.status >= 500;
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('retry-after') || '5', 10);
      throw new RateLimitError('openai', retryAfter * 1000);
    }
    throw new AIProviderError('openai', response.status, `API error: ${errBody}`, retryable);
  }

  const data = await response.json() as any;
  const latencyMs = Date.now() - startTime;

  const choice = data.choices?.[0];
  if (!choice) throw new AIProviderError('openai', 500, 'No choices returned');

  const result: AIResponse = {
    content: choice.message?.content || '',
    provider: 'openai',
    model: config.model,
    usage: {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    },
    latencyMs,
    metadata: {
      finishReason: choice.finish_reason,
      logprobs: choice.logprobs,
    },
  };

  updateProviderStats('openai', result);
  return result;
}

async function* streamOpenAI(
  config: AIProviderConfig,
  messages: { role: string; content: string }[],
  options: AIRequestOptions
): AsyncGenerator<AIStreamingChunk> {
  const url = `${config.baseUrl || 'https://api.openai.com/v1'}/chat/completions`;

  const body = {
    model: config.model,
    messages,
    max_tokens: options.maxTokens || config.maxTokens || 4096,
    temperature: options.temperature ?? config.temperature ?? 0.7,
    stream: true,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(config.timeout || 120000),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => 'unknown');
    throw new AIProviderError('openai', response.status, `Stream error: ${errBody}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new AIProviderError('openai', 500, 'No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data) as any;
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            yield {
              delta,
              finishReason: parsed.choices?.[0]?.finish_reason || undefined,
              usage: parsed.usage
                ? {
                    promptTokens: parsed.usage.prompt_tokens,
                    completionTokens: parsed.usage.completion_tokens,
                    totalTokens: parsed.usage.total_tokens,
                  }
                : undefined,
            };
          }
        } catch {
          // skip malformed chunks
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ---------------------------------------------------------------------------
// Anthropic Claude Provider Implementation
// ---------------------------------------------------------------------------

async function callAnthropic(
  config: AIProviderConfig,
  messages: { role: string; content: string }[],
  options: AIRequestOptions
): Promise<AIResponse> {
  const startTime = Date.now();
  const url = `${config.baseUrl || 'https://api.anthropic.com/v1'}/messages`;

  const systemMessage = messages.find((m) => m.role === 'system')?.content || '';
  const userMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  const body: Record<string, unknown> = {
    model: config.model,
    max_tokens: options.maxTokens || config.maxTokens || 4096,
    messages: userMessages,
    temperature: options.temperature ?? config.temperature ?? 0.7,
    top_p: options.topP,
    stop_sequences: options.stopSequences,
  };

  if (systemMessage || options.systemPrompt) {
    body.system = options.systemPrompt || systemMessage;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'x-request-id': crypto.randomUUID(),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(config.timeout || 60000),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => 'unknown');
    const retryable = response.status === 429 || response.status >= 500;
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('retry-after') || '5', 10);
      throw new RateLimitError('anthropic', retryAfter * 1000);
    }
    throw new AIProviderError('anthropic', response.status, `API error: ${errBody}`, retryable);
  }

  const data = await response.json() as any;
  const latencyMs = Date.now() - startTime;

  const contentBlock = data.content?.find((b: any) => b.type === 'text');
  if (!contentBlock) throw new AIProviderError('anthropic', 500, 'No text content returned');

  const result: AIResponse = {
    content: contentBlock.text || '',
    provider: 'anthropic',
    model: config.model,
    usage: {
      promptTokens: data.usage?.input_tokens || 0,
      completionTokens: data.usage?.output_tokens || 0,
      totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
    },
    latencyMs,
    metadata: {
      stopReason: data.stop_reason,
      id: data.id,
    },
  };

  updateProviderStats('anthropic', result);
  return result;
}

async function* streamAnthropic(
  config: AIProviderConfig,
  messages: { role: string; content: string }[],
  options: AIRequestOptions
): AsyncGenerator<AIStreamingChunk> {
  const url = `${config.baseUrl || 'https://api.anthropic.com/v1'}/messages`;

  const systemMessage = messages.find((m) => m.role === 'system')?.content || '';
  const userMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  const body: Record<string, unknown> = {
    model: config.model,
    max_tokens: options.maxTokens || config.maxTokens || 4096,
    messages: userMessages,
    temperature: options.temperature ?? config.temperature ?? 0.7,
    stream: true,
  };

  if (systemMessage || options.systemPrompt) {
    body.system = options.systemPrompt || systemMessage;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(config.timeout || 120000),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => 'unknown');
    throw new AIProviderError('anthropic', response.status, `Stream error: ${errBody}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new AIProviderError('anthropic', 500, 'No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);

        try {
          const parsed = JSON.parse(data) as any;
          if (parsed.type === 'content_block_delta') {
            yield { delta: parsed.delta?.text || '' };
          } else if (parsed.type === 'message_stop') {
            return;
          } else if (parsed.type === 'message_delta' && parsed.usage) {
            yield {
              delta: '',
              finishReason: parsed.delta?.stop_reason,
              usage: {
                promptTokens: 0,
                completionTokens: parsed.usage.output_tokens,
                totalTokens: parsed.usage.output_tokens,
              },
            };
          }
        } catch {
          // skip malformed chunks
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ---------------------------------------------------------------------------
// Google Gemini Provider Implementation
// ---------------------------------------------------------------------------

async function callGemini(
  config: AIProviderConfig,
  messages: { role: string; content: string }[],
  options: AIRequestOptions
): Promise<AIResponse> {
  const startTime = Date.now();
  const model = config.model || 'gemini-2.0-flash';
  const url = `${config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta'}/models/${model}:generateContent?key=${config.apiKey}`;

  const systemInstruction = messages.find((m) => m.role === 'system')?.content || '';
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      maxOutputTokens: options.maxTokens || config.maxTokens || 4096,
      temperature: options.temperature ?? config.temperature ?? 0.7,
      topP: options.topP,
      stopSequences: options.stopSequences,
    },
  };

  if (systemInstruction || options.systemPrompt) {
    body.systemInstruction = {
      parts: [{ text: options.systemPrompt || systemInstruction }],
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(config.timeout || 60000),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => 'unknown');
    const retryable = response.status === 429 || response.status >= 500;
    if (response.status === 429) {
      throw new RateLimitError('gemini', 5000);
    }
    throw new AIProviderError('gemini', response.status, `API error: ${errBody}`, retryable);
  }

  const data = await response.json() as any;
  const latencyMs = Date.now() - startTime;

  const candidate = data.candidates?.[0];
  if (!candidate?.content?.parts?.length) {
    throw new AIProviderError('gemini', 500, 'No content returned');
  }

  const textParts = candidate.content.parts.filter((p: any) => p.text);
  const content = textParts.map((p: any) => p.text).join('');

  const result: AIResponse = {
    content,
    provider: 'gemini',
    model,
    usage: {
      promptTokens: data.usageMetadata?.promptTokenCount || 0,
      completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
      totalTokens: data.usageMetadata?.totalTokenCount || 0,
    },
    latencyMs,
    metadata: {
      finishReason: candidate.finishReason,
      safetyRatings: candidate.safetyRatings,
    },
  };

  updateProviderStats('gemini', result);
  return result;
}

async function* streamGemini(
  config: AIProviderConfig,
  messages: { role: string; content: string }[],
  options: AIRequestOptions
): AsyncGenerator<AIStreamingChunk> {
  const model = config.model || 'gemini-2.0-flash';
  const url = `${config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta'}/models/${model}:streamGenerateContent?alt=sse&key=${config.apiKey}`;

  const systemInstruction = messages.find((m) => m.role === 'system')?.content || '';
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      maxOutputTokens: options.maxTokens || config.maxTokens || 4096,
      temperature: options.temperature ?? config.temperature ?? 0.7,
    },
  };

  if (systemInstruction || options.systemPrompt) {
    body.systemInstruction = {
      parts: [{ text: options.systemPrompt || systemInstruction }],
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(config.timeout || 120000),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => 'unknown');
    throw new AIProviderError('gemini', response.status, `Stream error: ${errBody}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new AIProviderError('gemini', 500, 'No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);

        try {
          const parsed = JSON.parse(data) as any;
          const candidate = parsed.candidates?.[0];
          if (candidate?.content?.parts) {
            for (const part of candidate.content.parts) {
              if (part.text) {
                yield {
                  delta: part.text,
                  finishReason: candidate.finishReason,
                };
              }
            }
          }
        } catch {
          // skip malformed chunks
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ---------------------------------------------------------------------------
// Stats Update Helper
// ---------------------------------------------------------------------------

function updateProviderStats(provider: ProviderName, result: AIResponse): void {
  const instance = providerInstances.get(provider);
  if (!instance) return;
  instance.lastUsed = new Date();
  instance.requestCount++;
  instance.totalTokens += result.usage.totalTokens;
  instance.latencySamples.push(result.latencyMs);
  if (instance.latencySamples.length > 100) instance.latencySamples.shift();
  instance.avgLatencyMs =
    instance.latencySamples.reduce((a, b) => a + b, 0) / instance.latencySamples.length;
}

// ---------------------------------------------------------------------------
// Unified API
// ---------------------------------------------------------------------------

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const providerCallers = {
  openai: callOpenAI,
  anthropic: callAnthropic,
  gemini: callGemini,
} as const;

const providerStreamers = {
  openai: streamOpenAI,
  anthropic: streamAnthropic,
  gemini: streamGemini,
} as const;

export async function generateText(
  provider: ProviderName,
  messages: ChatMessage[],
  options: AIRequestOptions = {}
): Promise<AIResponse> {
  const config = getProviderConfig(provider);
  const caller = providerCallers[provider];
  const configWithDefaults = { ...config, maxTokens: options.maxTokens || config.maxTokens };
  return withRetry(
    () => caller(configWithDefaults, messages, options),
    provider,
    config.retryAttempts ?? 3,
    config.retryDelay ?? 1000
  );
}

export async function generateTextWithTemplate(
  templateId: string,
  variables: Record<string, string>,
  providerOverride?: ProviderName
): Promise<AIResponse> {
  const template = getPromptTemplate(templateId);
  if (!template) throw new Error(`Template '${templateId}' not found`);
  const { systemPrompt, userPrompt } = buildPrompt(templateId, variables);
  const provider = providerOverride || template.provider || listProviders()[0];
  if (!provider) throw new Error('No provider configured');
  return generateText(
    provider,
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    template.options
  );
}

export async function* streamText(
  provider: ProviderName,
  messages: ChatMessage[],
  options: AIRequestOptions = {}
): AsyncGenerator<AIStreamingChunk> {
  const config = getProviderConfig(provider);
  const streamer = providerStreamers[provider];
  yield* streamer(config, messages, options);
}

// ---------------------------------------------------------------------------
// Provider Selection & Load Balancing
// ---------------------------------------------------------------------------

export interface ProviderStrategy {
  select: (providers: ProviderName[]) => ProviderName;
}

export const roundRobinStrategy: ProviderStrategy = {
  select: (() => {
    let index = 0;
    return (providers: ProviderName[]) => {
      const provider = providers[index % providers.length];
      index++;
      return provider;
    };
  })(),
};

export const lowestLatencyStrategy: ProviderStrategy = {
  select: (providers: ProviderName[]) => {
    return providers.reduce((best, current) => {
      const bestStats = getProviderStats(best);
      const currentStats = getProviderStats(current);
      const bestLatency = bestStats?.avgLatencyMs || Infinity;
      const currentLatency = currentStats?.avgLatencyMs || Infinity;
      return currentLatency < bestLatency ? current : best;
    });
  },
};

export const lowestErrorRateStrategy: ProviderStrategy = {
  select: (providers: ProviderName[]) => {
    return providers.reduce((best, current) => {
      const bestStats = getProviderStats(best);
      const currentStats = getProviderStats(current);
      const bestRate = bestStats
        ? bestStats.errorCount / (bestStats.requestCount || 1)
        : Infinity;
      const currentRate = currentStats
        ? currentStats.errorCount / (currentStats.requestCount || 1)
        : Infinity;
      return currentRate < bestRate ? current : best;
    });
  },
};

export async function generateTextWithFallback(
  messages: ChatMessage[],
  options: AIRequestOptions = {},
  providers?: ProviderName[],
  strategy: ProviderStrategy = roundRobinStrategy
): Promise<AIResponse> {
  const available = providers || listProviders();
  if (available.length === 0) throw new Error('No AI providers configured');

  let lastError: Error | undefined;
  const tried = new Set<ProviderName>();

  for (let i = 0; i < available.length; i++) {
    const candidate = strategy.select(available.filter((p) => !tried.has(p)));
    tried.add(candidate);
    try {
      return await generateText(candidate, messages, options);
    } catch (err) {
      lastError = err as Error;
      console.warn(`[AI] Provider ${candidate} failed, trying next...`);
    }
  }

  throw lastError || new Error('All providers failed');
}

// ---------------------------------------------------------------------------
// Utility: JSON Extraction from AI Responses
// ---------------------------------------------------------------------------

export function extractJSON<T = unknown>(response: AIResponse): T {
  const content = response.content.trim();

  const jsonBlockMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (jsonBlockMatch) {
    return JSON.parse(jsonBlockMatch[1]) as T;
  }

  const firstBrace = content.indexOf('{');
  const firstBracket = content.indexOf('[');

  if (firstBrace === -1 && firstBracket === -1) {
    throw new Error('No JSON found in AI response');
  }

  const start =
    firstBrace === -1
      ? firstBracket
      : firstBracket === -1
        ? firstBrace
        : Math.min(firstBrace, firstBracket);

  let depth = 0;
  let inString = false;
  let escape = false;
  const openChar = content[start];

  for (let i = start; i < content.length; i++) {
    const ch = content[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\') {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === openChar || (openChar === '{' && ch === '[') || (openChar === '[' && ch === '{')) {
      depth++;
    } else if (
      ch === (openChar === '{' ? '}' : ']') ||
      (openChar === '{' && ch === ']') ||
      (openChar === '[' && ch === '}')
    ) {
      depth--;
    }
    if (depth === 0) {
      return JSON.parse(content.slice(start, i + 1)) as T;
    }
  }

  return JSON.parse(content.slice(start)) as T;
}

// ---------------------------------------------------------------------------
// Batch Processing
// ---------------------------------------------------------------------------

export interface BatchRequest<T = string> {
  id: string;
  messages: ChatMessage[];
  options?: AIRequestOptions;
  metadata?: T;
}

export interface BatchResult<T = string> {
  id: string;
  response?: AIResponse;
  error?: string;
  metadata?: T;
}

export async function processBatch<T = string>(
  requests: BatchRequest<T>[],
  concurrency: number = 3,
  provider?: ProviderName
): Promise<BatchResult<T>[]> {
  const results: BatchResult<T>[] = [];
  const queue = [...requests];

  async function processNext(): Promise<void> {
    while (queue.length > 0) {
      const request = queue.shift()!;
      try {
        const response = provider
          ? await generateText(provider, request.messages, request.options)
          : await generateTextWithFallback(request.messages, request.options);
        results.push({ id: request.id, response, metadata: request.metadata });
      } catch (err) {
        results.push({
          id: request.id,
          error: (err as Error).message,
          metadata: request.metadata,
        });
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, requests.length) }, () =>
    processNext()
  );
  await Promise.all(workers);

  return results.sort(
    (a, b) => requests.findIndex((r) => r.id === a.id) - requests.findIndex((r) => r.id === b.id)
  );
}

// ---------------------------------------------------------------------------
// Health Check
// ---------------------------------------------------------------------------

export async function healthCheck(
  provider?: ProviderName
): Promise<{ provider: ProviderName; healthy: boolean; latencyMs: number; error?: string }[]> {
  const providers = provider ? [provider] : listProviders();
  const results = await Promise.allSettled(
    providers.map(async (p) => {
      const start = Date.now();
      try {
        await generateText(p, [{ role: 'user', content: 'Respond with exactly: ok' }], {
          maxTokens: 10,
          temperature: 0,
        });
        return { provider: p, healthy: true, latencyMs: Date.now() - start };
      } catch (err) {
        return {
          provider: p,
          healthy: false,
          latencyMs: Date.now() - start,
          error: (err as Error).message,
        };
      }
    })
  );

  return results.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : { provider: providers[i], healthy: false, latencyMs: 0, error: r.reason?.message }
  );
}
