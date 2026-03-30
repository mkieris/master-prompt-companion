/**
 * Unified AI Client for Edge Functions.
 * Routes Claude models directly to Anthropic API,
 * and Gemini models through Lovable Gateway.
 *
 * Both return the same response shape for easy integration.
 */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequestOptions {
  model: string;
  messages: AIMessage[];
  temperature?: number;
  max_tokens?: number;
  signal?: AbortSignal;
}

export interface AIResponse {
  content: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
}

/**
 * Determines if a model should be routed to Anthropic directly.
 */
function isAnthropicModel(model: string): boolean {
  return model.startsWith('anthropic/') || model.startsWith('claude-');
}

/**
 * Normalizes the model name for the Anthropic API.
 * Strips 'anthropic/' prefix if present.
 */
function toAnthropicModelId(model: string): string {
  return model.replace('anthropic/', '');
}

/**
 * Calls the Anthropic Messages API directly.
 * https://docs.anthropic.com/en/api/messages
 */
async function callAnthropic(options: AIRequestOptions): Promise<AIResponse> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY nicht konfiguriert. Bitte in Supabase Secrets hinterlegen.');
  }

  // Anthropic API separates system from messages
  const systemMessage = options.messages.find(m => m.role === 'system');
  const nonSystemMessages = options.messages.filter(m => m.role !== 'system');

  const body: Record<string, unknown> = {
    model: toAnthropicModelId(options.model),
    messages: nonSystemMessages.map(m => ({
      role: m.role,
      content: m.content,
    })),
    max_tokens: options.max_tokens || 4096,
    temperature: options.temperature ?? 0.6,
  };

  if (systemMessage) {
    body.system = systemMessage.content;
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: options.signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Anthropic] API error:', response.status, errorText);

    if (response.status === 429) {
      throw new AIError('Rate limit erreicht. Bitte versuche es in 1 Minute erneut.', 429);
    }
    if (response.status === 401) {
      throw new AIError('Anthropic API-Key ungültig. Bitte in Supabase Secrets prüfen.', 401);
    }
    if (response.status === 400) {
      throw new AIError(`Anthropic Request-Fehler: ${errorText}`, 400);
    }
    throw new AIError(`Anthropic API Fehler: ${response.status}`, response.status);
  }

  const data = await response.json();

  // Anthropic Messages API response format
  const content = data.content
    ?.filter((block: any) => block.type === 'text')
    ?.map((block: any) => block.text)
    ?.join('') || '';

  return {
    content,
    model: data.model || options.model,
    inputTokens: data.usage?.input_tokens,
    outputTokens: data.usage?.output_tokens,
  };
}

/**
 * Calls the Lovable Gateway (OpenAI-compatible).
 */
async function callLovableGateway(options: AIRequestOptions): Promise<AIResponse> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) {
    throw new Error('LOVABLE_API_KEY nicht konfiguriert.');
  }

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options.temperature,
      max_tokens: options.max_tokens,
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[LovableGateway] API error:', response.status, errorText);

    if (response.status === 429) {
      throw new AIError('Rate limit erreicht. Bitte versuche es in 1 Minute erneut.', 429);
    }
    if (response.status === 402) {
      throw new AIError('AI-Credits aufgebraucht. Bitte Lovable-Guthaben prüfen.', 402);
    }
    if (response.status === 401) {
      throw new AIError('API-Authentifizierung fehlgeschlagen.', 401);
    }
    throw new AIError(`AI Gateway Fehler: ${response.status}`, response.status);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  return {
    content,
    model: data.model || options.model,
    inputTokens: data.usage?.prompt_tokens,
    outputTokens: data.usage?.completion_tokens,
  };
}

/**
 * Custom error class with HTTP status code.
 */
export class AIError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = 'AIError';
  }
}

/**
 * Unified AI call that routes to the correct provider.
 * - Claude models → Anthropic API directly
 * - Gemini models → Lovable Gateway
 */
export async function callAI(options: AIRequestOptions): Promise<AIResponse> {
  if (isAnthropicModel(options.model)) {
    console.log(`[AI] Routing ${options.model} → Anthropic API`);
    return callAnthropic(options);
  }

  console.log(`[AI] Routing ${options.model} → Lovable Gateway`);
  return callLovableGateway(options);
}
