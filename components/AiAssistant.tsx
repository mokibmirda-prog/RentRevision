'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { getGeminiResponse } from '@/lib/gemini';

export default function AiAssistant({ user }: { user: any }) {
  const [messages, setMessages] = useState<{ role: string, text: string }[]>([
    { role: 'assistant', text: `Greetings, ${user.name.split(' ')[0]}. I am JARVIS. How can I assist you with Al Khaleej Building today?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

      const context = `User Name: ${user.name}, Unit: ${user.unit || 'Unknown'}, Role: ${user.role}.`;
      
      const response = await getGeminiResponse(userMessage, history, context);
      setMessages(prev => [...prev, { role: 'assistant', text: response || "I'm sorry, I couldn't process that request." }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Systems offline. Please check your connection." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col h-[calc(100vh-250px)] md:h-[600px] bg-slate-900/50 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Bot className="text-slate-950 w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white">JARVIS</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Systems Online</span>
            </div>
          </div>
        </div>
        <Sparkles className="text-cyan-400 w-5 h-5 opacity-50" />
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
      >
        {messages.map((msg, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-blue-500/20 text-blue-400' : 'bg-cyan-500/20 text-cyan-400'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-blue-500 text-white rounded-tr-none shadow-lg shadow-blue-500/10' 
                  : 'bg-slate-800/80 text-slate-200 rounded-tl-none border border-white/5'
              }`}>
                {msg.text}
              </div>
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-800/80 p-4 rounded-2xl rounded-tl-none border border-white/5">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-cyan-400/50 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-cyan-400/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-cyan-400/50 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-6 bg-white/[0.02] border-t border-white/5">
        <div className="relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask JARVIS anything..."
            className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
          />
          <button 
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-cyan-500 text-slate-950 rounded-xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-600"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[10px] text-slate-500 text-center mt-3 uppercase tracking-widest font-bold">
          Powered by Gemini 3.1 Pro • Encrypted Connection
        </p>
      </form>
    </motion.div>
  );
}
