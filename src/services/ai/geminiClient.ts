/**
 * Client-side communication service for AI features.
 * Calls backend Express endpoints; never exposes API keys or imports GenAI on the client.
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

export async function askGeminiAssistant(
  message: string,
  history: ChatMessage[],
  inventoryContext: any
): Promise<{ reply: string; model?: string }> {
  try {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history: history.map(h => ({
          role: h.role === 'assistant' ? 'model' : 'user',
          content: h.content,
        })),
        inventoryContext,
      }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    return {
      reply: data.reply || 'No response received from inventory assistant.',
      model: data.model,
    };
  } catch (err: any) {
    console.error('Error contacting inventory assistant:', err);
    throw err;
  }
}

export async function getExplainRiskAI(
  item: any,
  batch: any,
  prediction: any,
  action?: any
): Promise<string> {
  try {
    const res = await fetch('/api/gemini/explain-risk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item, batch, prediction, action }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    return data.explanation || 'Detailed reasoning unavailable.';
  } catch (err: any) {
    console.error('Error fetching AI risk explanation:', err);
    return 'Unable to generate dynamic AI explanation at this time.';
  }
}

export async function getDailyIntelligenceBrief(
  stats: any,
  topRisks: any[],
  topTransfers: any[],
  topProcurements: any[]
): Promise<string> {
  try {
    const res = await fetch('/api/gemini/daily-brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stats, topRisks, topTransfers, topProcurements }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    return data.brief || 'Daily brief currently unavailable.';
  } catch (err: any) {
    console.error('Error fetching daily brief:', err);
    return 'Could not retrieve daily brief. Please verify network connectivity.';
  }
}
