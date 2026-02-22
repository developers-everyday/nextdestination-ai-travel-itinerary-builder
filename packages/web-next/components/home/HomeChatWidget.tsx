"use client";

import React, { useState, useRef, useEffect } from "react";
import { analyzeTravelQuery } from "@nextdestination/shared";
import {
  Loader2,
  Send,
  Sparkles,
  Compass,
  MessageCircle,
  X,
} from "lucide-react";

interface HomeChatWidgetProps {
  onGenerate: (data: any) => void;
  onBrowse: (data: any) => void;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  data?: any;
}

const HomeChatWidget: React.FC<HomeChatWidgetProps> = ({
  onGenerate,
  onBrowse,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi! I'm your AI travel planner. Where do you dream of going next?",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!query.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setIsTyping(true);

    try {
      const result = await analyzeTravelQuery(userMsg.text);

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: result.response,
        data: result,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          text: "I'm having trouble connecting to the travel servers. Please try again!",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 md:bottom-12 md:right-12 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="w-[350px] md:w-[400px] h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col mb-4 animate-scale-in origin-bottom-right">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm">AI Travel Assistant</h3>
                <p className="text-indigo-100 text-[10px] font-medium">
                  Powered by Gemini
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-tr-none shadow-md"
                      : "bg-white text-slate-700 border border-slate-200 rounded-tl-none shadow-sm"
                  }`}
                >
                  {msg.text}

                  {msg.role === "assistant" && msg.data && (
                    <div className="mt-3 flex flex-col gap-2">
                      {msg.data.destination && (
                        <button
                          onClick={() => onGenerate(msg.data)}
                          className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-2 rounded-xl transition-colors text-xs font-bold w-full border border-indigo-100"
                        >
                          <Sparkles className="w-3 h-3" />
                          Plan {msg.data.days}-Day Trip
                        </button>
                      )}
                      {(msg.data.destination ||
                        msg.data.intent === "explore_suggestions") && (
                        <button
                          onClick={() => onBrowse(msg.data)}
                          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl transition-colors text-xs font-bold w-full border border-slate-200"
                        >
                          <Compass className="w-3 h-3" />
                          Browse Ideas
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-slate-100">
            <div className="relative flex items-center gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Where to next?"
                className="w-full bg-slate-100 focus:bg-white border focus:border-indigo-100 text-slate-900 placeholder:text-slate-400 rounded-xl py-3 pl-4 pr-10 outline-none transition-all text-sm font-medium"
                disabled={isTyping}
              />
              <button
                onClick={handleSend}
                disabled={!query.trim() || isTyping}
                className="absolute right-1.5 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm"
              >
                {isTyping ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center ${
          isOpen
            ? "bg-slate-800 text-white rotate-90"
            : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
        }`}
      >
        {isOpen ? (
          <X className="w-8 h-8" />
        ) : (
          <MessageCircle className="w-8 h-8" />
        )}
      </button>
    </div>
  );
};

export default HomeChatWidget;
