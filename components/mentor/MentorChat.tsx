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
  "Create a 6-month roadmap to become a frontend developer",
  "What projects should I build to land my first dev job?",
  "Review my career path and suggest improvements",
  "What are the best free courses to learn system design?",
  "How do I prepare for FAANG interviews in 3 months?",
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
        line = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        line = line.replace(/\*(.*?)\*/g, "<em>$1</em>");
        line = line.replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs font-mono">$1</code>');
        if (line.startsWith("• ") || line.startsWith("- ")) {
          return `<div key="${i}" class="flex gap-2 my-0.5"><span class="text-primary mt-1 shrink-0">•</span><span>${line.slice(2)}</span></div>`;
        }
        if (line.startsWith("## ")) return `<h3 class="text-base font-bold text-foreground mt-3 mb-1">${line.slice(3)}</h3>`;
        if (line.startsWith("# ")) return `<h2 class="text-lg font-bold text-foreground mt-4 mb-2">${line.slice(2)}</h2>`;
        if (!line.trim()) return "<div class='my-1'></div>";
        return `<p>${line}</p>`;
      })
      .join("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[600px] bg-card rounded-2xl border border-border shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl text-primary">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm">AI Career Mentor</h3>
            <p className="text-xs text-muted-foreground">Powered by Groq Llama 3.3 70B</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-success/10 rounded-full border border-success/20">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] font-semibold text-success">Online</span>
          </div>
          <button
            onClick={clearChat}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
            title="Clear chat"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 animate-fade-in ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            {/* Avatar */}
            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white ${
              msg.role === "assistant" ? "bg-gradient-to-br from-primary to-purple-600" : "bg-gradient-to-br from-success to-emerald-600"
            }`}>
              {msg.role === "assistant" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-tr-sm"
                : "bg-muted text-foreground rounded-tl-sm"
            }`}>
              {msg.role === "assistant" ? (
                <div
                  className="space-y-1 prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                />
              ) : (
                <p>{msg.content}</p>
              )}
              <p className={`text-[10px] mt-2 ${msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Starter prompts (only show if only welcome message) */}
      {messages.length === 1 && (
        <div className="px-6 pb-3">
          <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">Quick Start</p>
          <div className="flex flex-wrap gap-2">
            {STARTER_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => sendMessage(prompt)}
                className="text-xs px-3 py-1.5 bg-muted hover:bg-primary/10 hover:text-primary border border-border rounded-full transition-all duration-200 text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-6 pb-6 pt-2 border-t border-border bg-muted/20">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about career roadmaps, projects, courses, interview tips..."
              rows={1}
              style={{ resize: "none", minHeight: "44px", maxHeight: "140px" }}
              className="w-full px-4 py-3 rounded-xl border border-border bg-card focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-foreground text-sm transition-all leading-relaxed"
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
            className="h-11 w-11 p-0 rounded-xl shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
