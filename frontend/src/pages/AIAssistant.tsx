import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Terminal,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import { ChatMessage, ToolExecution } from '../types';
import { Badge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';

export const AIAssistant: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `👋 Hello ${user?.full_name || user?.username}! I am **WORKNEX AI**, your enterprise operations assistant.\n\nI have real-time access to the Model Context Protocol (MCP) tool registry. You can ask me to inspect inventory, summarize sales orders, identify low stock, or propose replenishment purchase requisitions.\n\n*Notice: Consequential actions (such as purchase requisitions) will be placed in 'pending_approval' and require human managerial verification.*`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const quickPrompts = [
    'Show all low-stock products.',
    'Which warehouse has the lowest inventory?',
    'Summarize open sales orders.',
    'Show pending purchase requisitions.',
    'Create a purchase requisition for MAT-002 with 100 units.',
  ];

  const handleSend = async (messageText: string) => {
    const textToSend = messageText.trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.ai.chat(textToSend, conversationId);
      setConversationId(res.conversation_id);

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: res.response,
        tool_executions: res.tool_executions,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: `❌ **Error:** ${err.response?.data?.detail || 'Failed to communicate with AI Assistant.'}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8.5rem)] flex-col rounded-2xl border border-gray-800 bg-[#111827]/90 shadow-2xl overflow-hidden">
      {/* Assistant Header */}
      <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900/60 px-6 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">WORKNEX AI Assistant</h2>
              <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-400">
                MCP Protocol
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Autonomous read-operations & protected human-in-the-loop write workflows
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Self-Approval Restricted</span>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[82%] rounded-2xl p-4 text-xs leading-relaxed shadow-lg ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-gray-900/90 text-gray-200 border border-gray-800 rounded-bl-none'
              }`}
            >
              {/* Tool Execution Details */}
              {msg.tool_executions && msg.tool_executions.length > 0 && (
                <div className="mb-3 space-y-2">
                  {msg.tool_executions.map((tool, tIdx) => (
                    <div
                      key={tIdx}
                      className="rounded-lg border border-indigo-500/20 bg-indigo-950/30 p-2.5 font-mono text-[11px]"
                    >
                      <div className="flex items-center justify-between text-indigo-300">
                        <div className="flex items-center gap-1.5 font-semibold">
                          <Terminal className="h-3.5 w-3.5" />
                          <span>MCP Tool Invoked:</span>
                          <span className="text-white">{tool.tool_name}</span>
                        </div>
                        <Badge variant={tool.status === 'SUCCESS' ? 'success' : 'danger'}>
                          {tool.status}
                        </Badge>
                      </div>
                      {tool.arguments && Object.keys(tool.arguments).length > 0 && (
                        <div className="mt-1.5 text-[10px] text-gray-400">
                          Args: {JSON.stringify(tool.arguments)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Message Content */}
              <div className="whitespace-pre-wrap">{msg.content}</div>

              <div
                className={`mt-2 text-[10px] ${
                  msg.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                }`}
              >
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-800">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-400" />
            </div>
            <span>Analyzing enterprise telemetry & invoking MCP tools...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="border-t border-gray-800/80 bg-gray-900/40 px-6 py-2.5 overflow-x-auto">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 shrink-0">
            Suggested Prompts:
          </span>
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(p)}
              disabled={loading}
              className="shrink-0 rounded-full border border-gray-800 bg-gray-900/80 px-3 py-1 text-[11px] text-gray-300 hover:border-blue-500/40 hover:bg-gray-800 hover:text-white transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="border-t border-gray-800 bg-gray-900/80 p-4"
      >
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask WORKNEX AI (e.g. 'Show all low-stock products' or 'Replenish MAT-002 with 100 units')..."
            className="flex-1 rounded-xl border border-gray-800 bg-gray-950 px-4 py-3 text-xs text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:bg-blue-500 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

