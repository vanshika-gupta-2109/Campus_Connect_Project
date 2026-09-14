import { useEffect, useRef, useState } from 'react';
import { Sparkles, Send, Mic, X, BadgeCheck, GraduationCap, ChevronRight, Volume2, Square } from 'lucide-react';
import type { Announcement } from '@/lib/supabase';
import { searchAnnouncements, generateResponse, SUGGESTED_QUESTIONS } from '@/lib/queryEngine';

type AskMyCampusProps = {
  announcements: Announcement[];
  onResultClick: (announcement: Announcement) => void;
};

type Message = {
  role: 'user' | 'assistant';
  content: string;
  results?: Announcement[];
};

export default function AskMyCampus({ announcements, onResultClick }: AskMyCampusProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      document.body.style.overflow = '';
      stopListening();
      stopSpeaking();
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    utteranceRef.current = null;
  };

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[^\w\s.,!?'-]/g, ' ').slice(0, 500);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    utteranceRef.current = utterance;
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    stopSpeaking();
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      handleSend(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const handleSend = (queryText?: string) => {
    const query = (queryText ?? input).trim();
    if (!query) return;

    stopSpeaking();
    const results = searchAnnouncements(query, announcements);
    const response = generateResponse(query, results);

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: query },
      { role: 'assistant', content: response, results: results.length > 0 ? results : undefined },
    ]);
    setInput('');
  };

  const handleSuggestion = (question: string) => {
    handleSend(question);
  };

  const handleResultClick = (announcement: Announcement) => {
    stopSpeaking();
    onResultClick(announcement);
    setIsOpen(false);
  };

  const toggleSpeak = (text: string) => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(text);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="group fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3.5 text-sm font-semibold text-white rounded-full shadow-xl shadow-purple-500/30 hover:scale-105 transition-all"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 to-purple-600" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity animate-gradient" />
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-violet-400 animate-pulse-ring" />
        )}
        <Sparkles className="relative w-5 h-5 group-hover:rotate-12 transition-transform" />
        <span className="relative hidden sm:inline">Ask My Campus</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div
            className="bg-white dark:bg-slate-900 w-full sm:max-w-lg h-[85vh] sm:h-[600px] sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col animate-slide-up overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-violet-500 to-purple-600 shrink-0 animate-gradient">
              <div className="flex items-center gap-2.5">
                <div className="relative w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white animate-float" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Ask My Campus</h2>
                  <p className="text-xs text-purple-100">Voice & chat assistant</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="group w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/30 transition-all hover:rotate-90"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50 dark:bg-slate-800/50">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 rounded-2xl bg-violet-300 dark:bg-violet-500/30 blur-xl opacity-30" />
                    <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-500/20 dark:to-purple-500/20 flex items-center justify-center animate-float">
                      <Sparkles className="w-8 h-8 text-purple-500 dark:text-purple-400" />
                    </div>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Ask me anything about campus</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
                    I search through all announcements to find answers. Try a question or tap the mic to speak.
                  </p>
                  <div className="w-full space-y-2">
                    <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Try asking</p>
                    {SUGGESTED_QUESTIONS.slice(0, 4).map((q) => (
                      <button
                        key={q}
                        onClick={() => handleSuggestion(q)}
                        className="group w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:border-purple-300 dark:hover:border-purple-500/40 hover:bg-purple-50 dark:hover:bg-purple-500/15 hover:shadow-md hover:shadow-purple-100 transition-all flex items-center gap-2"
                      >
                        <ChevronRight className="w-4 h-4 text-purple-400 dark:text-purple-500 group-hover:translate-x-1 transition-transform shrink-0" />
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 mr-2 mt-0.5 shadow-md shadow-purple-200">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : ''}`}>
                    <div
                      className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-br-md'
                          : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-bl-md'
                      }`}
                    >
                      {msg.content}
                    </div>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mt-1.5 ml-1">
                        <button
                          onClick={() => toggleSpeak(msg.content)}
                          className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 hover:text-purple-500 dark:hover:text-purple-400 transition-colors"
                        >
                          {isSpeaking && utteranceRef.current ? (
                            <>
                              <Square className="w-3.5 h-3.5" />
                              Stop
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              Listen
                            </>
                          )}
                        </button>
                      </div>
                    )}
                    {msg.results && msg.results.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {msg.results.map((r) => (
                          <button
                            key={r.id}
                            onClick={() => handleResultClick(r)}
                            className="w-full text-left p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:border-purple-300 dark:hover:border-purple-500/40 hover:shadow-md hover:shadow-purple-100 transition-all group"
                          >
                            <div className="flex items-start gap-2">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                r.is_official ? 'bg-emerald-50 dark:bg-emerald-500/15' : 'bg-blue-50 dark:bg-blue-500/15'
                              }`}>
                                {r.is_official ? (
                                  <BadgeCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <GraduationCap className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                  {r.title}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1">{r.author_name} ({r.author_role})</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-purple-400 dark:group-hover:text-purple-400 transition-colors shrink-0 mt-1" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="px-4 py-3 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-700 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`group w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-500/15 hover:text-purple-500 dark:hover:text-purple-400 hover:shadow-md hover:shadow-purple-100'
                  }`}
                  title={isListening ? 'Stop listening' : 'Voice input'}
                >
                  <Mic className={`w-5 h-5 transition-transform ${isListening ? '' : 'group-hover:scale-110'}`} />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                  placeholder={isListening ? 'Listening...' : 'Ask about deadlines, events, clubs...'}
                  disabled={isListening}
                  className="flex-1 px-4 py-2.5 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full focus:bg-white dark:focus:bg-slate-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all disabled:opacity-50"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  className="group w-10 h-10 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white flex items-center justify-center shrink-0 hover:scale-105 hover:shadow-lg hover:shadow-purple-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>
              {isListening && (
                <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-1.5">Tap the mic again to stop</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
