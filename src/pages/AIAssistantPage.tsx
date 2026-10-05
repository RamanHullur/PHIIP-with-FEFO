import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  User,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { askGeminiAssistant, ChatMessage } from '../services/ai/geminiClient';

export const AIAssistantPage: React.FC = () => {
  const { items, batches, predictions, transfers, procurements, stats } = useInventory();

  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      role: 'assistant',
      content: `Hello! I am your **Hospital Inventory Intelligence Assistant**, powered by server-side Gemini 3.8 Flash.

I have real-time visibility into **${stats.totalSKUs} hospital SKUs**, **${stats.totalBatches} active lots**, **${stats.criticalExpiryItems} critical expiry alerts**, and **₹${stats.potentialSavings.toLocaleString()} in identified transfer savings**.

How can I assist your clinical supply chain today?`,
      timestamp: 'Just now',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Suggested prompt chips specified in proposal
  const promptSuggestions = [
    'Which items are most likely to expire this month?',
    'Why is Ceftriaxone high risk?',
    'Which batches should we consume first under FEFO?',
    'Where do we have excess IV sets?',
    'Should we purchase more gloves?',
    'Which inventory can be transferred to prevent waste?',
    'How much inventory value is at risk?',
    'Show me critical items requiring action.',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage.trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Build compact, structured inventory snapshot for model grounding
      const inventorySnapshot = {
        stats,
        topExpiryRisks: batches
          .map(b => {
            const item = items.find(i => i.id === b.itemId);
            const pred = predictions.get(b.id);
            return {
              itemId: b.itemId,
              itemName: item?.name,
              batchNumber: b.batchNumber,
              currentStock: b.currentStock,
              expiryDate: b.expiryDate,
              daysToExpiry: pred?.daysToExpiry,
              potentialExcess: pred?.potentialExcess,
              riskScore: pred?.riskScore,
              riskLevel: pred?.riskLevel,
              unitCost: item?.unitCost,
              potentialExpiryLoss: pred?.potentialExpiryLoss,
            };
          })
          .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))
          .slice(0, 10),
        activeTransfers: transfers.slice(0, 5),
        procurementDirectives: procurements.slice(0, 5),
      };

      const result = await askGeminiAssistant(query, messages, inventorySnapshot);

      const assistantMsg: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        role: 'assistant',
        content: result.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: result.model || 'gemini-3.8-flash',
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        content: `I encountered an issue communicating with the intelligence service. Deterministic rule-based inventory analysis is still fully active in your dashboards.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto h-[calc(100vh-6rem)] flex flex-col space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900">Inventory Intelligence Assistant</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                Grounded Live Context
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Natural-language supply chain reasoning strictly grounded in deterministic hospital calculations
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                id: 'msg_welcome',
                role: 'assistant',
                content: 'Chat session refreshed. What inventory questions can I answer for you?',
                timestamp: 'Just now',
              },
            ])
          }
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 p-2 rounded-lg hover:bg-slate-50 transition"
          title="Clear chat history"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="shrink-0 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs select-none">
        <span className="font-semibold text-slate-500 shrink-0 text-[11px] mr-1">Suggestions:</span>
        {promptSuggestions.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(prompt)}
            className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-slate-700 text-[11px] whitespace-nowrap transition cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 overflow-y-auto space-y-4">
        {messages.map(msg => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex gap-3 text-xs ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl px-4 py-3 leading-relaxed ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-br-xs'
                    : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-bl-xs'
                }`}
              >
                <div className="prose prose-sm max-w-none text-xs leading-relaxed whitespace-pre-line font-sans">
                  {msg.content}
                </div>

                <div className={`mt-2 flex items-center justify-between text-[10px] ${isUser ? 'text-indigo-200' : 'text-slate-400'}`}>
                  <span>{msg.timestamp}</span>
                  {!isUser && (
                    <div className="flex items-center gap-2">
                      {msg.modelUsed && <span className="font-mono text-[9px]">{msg.modelUsed}</span>}
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="hover:text-indigo-600 transition"
                      >
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 text-xs items-center text-slate-400 py-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
              <span className="ml-2 text-slate-500 font-medium">Analyzing hospital inventory records...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          placeholder="Ask a question about batches, expiry risk, transfer routes, or procurement..."
          value={inputMessage}
          onChange={e => setInputMessage(e.target.value)}
          disabled={isLoading}
          className="flex-1 px-3 py-2 text-xs bg-transparent focus:outline-hidden text-slate-800 placeholder-slate-400"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isLoading}
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition disabled:opacity-40 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
