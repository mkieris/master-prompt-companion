/**
 * Unified AI Client for Edge Functions.
 * Routes Claude models directly to Anthropic API,
 * and Gemini models through Lovable Gateway.
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

function isAnthropicModel(model: string): boolean {
  return model.startsWith('anthropic/') || model.startsWith('claude-');
}

function toAnthropicModelId(model: string): string {
  return model.replace('anthropic/', '');
}

async function callAnthropic(options: AIRequestOptions): Promise<AIResponse> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY nicht konfiguriert.');
  }

  const systemMessage = options.messages.find(m => m.role === 'system');
  const nonSystemMessages = options.messages.filter(m => m.role !== 'system');

  const body: Record<string, unknown> = {
    model: toAnthropicModelId(options.model),
    messages: nonSystemMessages.map(m => ({ role: m.role, content: m.content })),
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
    throw new AIError(`Anthropic API Fehler: ${response.status} - ${errorText}`, response.status);
  }

  const data = await response.json();
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
      messages: options.messages.map(m => ({ role: m.role, content: m.content })),
      temperature: options.temperature,
      max_tokens: options.max_tokens,
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[LovableGateway] API error:', response.status, errorText);
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

export class AIError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = 'AIError';
  }
}

export async function callAI(options: AIRequestOptions): Promise<AIResponse> {
  if (isAnthropicModel(options.model)) {
    console.log(`[AI] Routing ${options.model} → Anthropic API`);
    return callAnthropic(options);
  }
  console.log(`[AI] Routing ${options.model} → Lovable Gateway`);
  return callLovableGateway(options);
}
