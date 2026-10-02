"use client";

import React, { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Send, Sparkles, Bot, User, Loader2, RotateCcw, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface UserProfile {
  name?: string;
  targetRole?: string;
  skills?: string;
}

interface MentorChatProps {
  userProfile?: UserProfile;
}

const STARTER_PROMPTS = [
  "Create a 6-month roadmap to become a Senior Full-Stack Engineer",
  "What projects should I build to stand out for $100k+ remote roles?",
  "Review my tech stack and suggest high-leverage skill upgrades",
  "What are the best free resources to master System Design?",
  "How do I prepare for FAANG technical interviews in 90 days?",
];

export default function MentorChat({ userProfile }: MentorChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hello${userProfile?.name ? ` ${userProfile.name}` : ""}! 👋 I'm your AI Career Mentor powered by Groq Llama 3.3 70B.\n\nI can help you with:\n• **Personalized career roadmaps** tailored to your goals\n• **Course & resource recommendations** from top platforms\n• **Project ideas** that impress recruiters\n• **Interview strategies** and preparation tips\n• **Industry insights** and market trends\n\nWhat would you like to work on today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const loadPastChats = async () => {
      try {
        const res = await fetch("/api/mentor/chat");
        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            const parsed = data.messages.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp),
            }));
            setMessages(prev => [prev[0], ...parsed]);
          }
        }
      } catch (err) {
        console.error("Failed to load past chats:", err);
      }
    };
    loadPastChats();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const conversationHistory = messages
        .filter(m => m.id !== "welcome")
        .map(m => ({ role: m.role, content: m.content }));
      conversationHistory.push({ role: "user", content: messageText });

      const res = await fetch("/api/mentor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversationHistory,
          userProfile,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to get response");
      }

      const data = await res.json();

      setMessages(prev => [...prev, {
        id: Date.now().toString() + "_ai",
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      }]);
    } catch (err: any) {
      toast.error("Mentor unavailable", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = async () => {
    try {
      const res = await fetch("/api/mentor/chat", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to clear chat");
      
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: "Chat cleared! How can I help you with your career today?",
        timestamp: new Date(),
      }]);
      toast.success("Conversation history cleared");
    } catch (err: any) {
      toast.error("Failed to clear chat history", { description: err.message });
    }
  };

  // Simple markdown-like formatting
  const formatContent = (text: string) => {
    return text
      .split("\n")
      .map((line, i) => {
        line = line.replace(/\*\*(.*?)\*\*/g, "<strong class='text-white'>$1</strong>");
        line = line.replace(/\*(.*?)\*/g, "<em>$1</em>");
        line = line.replace(/`(.*?)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono text-purple-300">$1</code>');
        if (line.startsWith("• ") || line.startsWith("- ")) {
          return `<div key="${i}" class="flex gap-2 my-1"><span class="text-purple-400 mt-0.5 shrink-0">•</span><span>${line.slice(2)}</span></div>`;
        }
        if (line.startsWith("## ")) return `<h3 class="text-base font-bold text-white mt-4 mb-1.5">${line.slice(3)}</h3>`;
        if (line.startsWith("# ")) return `<h2 class="text-lg font-bold text-white mt-5 mb-2">${line.slice(2)}</h2>`;
        if (!line.trim()) return "<div class='my-1.5'></div>";
        return `<p class="leading-relaxed">${line}</p>`;
      })
      .join("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[600px] bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(139,92,246,0.15)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">AI Career Strategist</h3>
            <p className="text-[11px] text-gray-400">Powered by Groq Llama 3.3 70B</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            <span className="text-[10px] font-bold text-emerald-400">Online</span>
          </div>
          <button
            onClick={clearChat}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            title="Clear chat"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 animate-fade-in ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            {/* Avatar */}
            <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-white border ${
              msg.role === "assistant"
                ? "bg-gradient-to-br from-purple-600 to-indigo-600 border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                : "bg-white/10 border-white/20"
            }`}>
              {msg.role === "assistant" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed border ${
              msg.role === "user"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500/30 rounded-tr-none shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                : "bg-white/5 border-white/10 text-gray-200 rounded-tl-none"
            }`}>
              {msg.role === "assistant" ? (
                <div
                  className="space-y-1 prose-sm max-w-none text-gray-200"
                  dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                />
              ) : (
                <p>{msg.content}</p>
              )}
              <p className={`text-[9px] mt-2 font-mono ${msg.role === "user" ? "text-purple-200/70 text-right" : "text-gray-500"}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center border border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Starter prompts (only show if only welcome message) */}
      {messages.length === 1 && (
        <div className="px-6 pb-3">
          <p className="text-[11px] text-gray-400 mb-2 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-purple-400" />
            Suggested Career Prompts
          </p>
          <div className="flex flex-wrap gap-2">
            {STARTER_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => sendMessage(prompt)}
                className="text-xs px-3.5 py-2 bg-white/5 hover:bg-purple-600/20 hover:text-purple-300 hover:border-purple-500/40 border border-white/10 rounded-xl transition-all duration-200 text-left text-gray-300"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-6 pb-6 pt-3 border-t border-white/10 bg-black/40 backdrop-blur-md">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about career roadmaps, projects, courses, interview tips..."
              rows={1}
              style={{ resize: "none", minHeight: "46px", maxHeight: "140px" }}
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 focus:outline-none text-white text-sm transition-all leading-relaxed placeholder:text-gray-500 shadow-inner"
              disabled={loading}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 140) + "px";
              }}
            />
          </div>
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            variant="gradient"
            className="h-11 w-11 p-0 rounded-xl shrink-0 shadow-[0_0_15px_rgba(139,92,246,0.4)]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-[10px] text-gray-500 mt-2 text-center">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
