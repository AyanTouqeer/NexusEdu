/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  RefreshCw, 
  Gamepad2, 
  Zap, 
  CheckCircle2, 
  Wifi, 
  WifiOff, 
  Trophy,
  Play,
  ArrowRight,
  MessageSquare,
  Send
} from 'lucide-react';
import { EdgeEducator } from './agents/EdgeEducator';
import { SyncManager } from './agents/SyncManager';
import { ContextTranslator } from './agents/ContextTranslator';
import { storage } from './core/storage';
import { UserState, StudySession, StudentQuery } from './types';

const educator = new EdgeEducator();

export default function App() {
  const [state, setState] = useState<UserState>(storage.getState());
  const [isOnline, setIsOnline] = useState(SyncManager.isOnline());
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'study' | 'achievements'>('study');
  
  const [sessionInput, setSessionInput] = useState({ subject: '', topic: '' });
  const [activeSession, setActiveSession] = useState<StudySession | null>(null);
  const [studentQuery, setStudentQuery] = useState('');
  const [conversation, setConversation] = useState<{role: 'student' | 'tutor', text: string}[]>([]);
  const [gamifiedContent, setGamifiedContent] = useState<string | null>(null);
  const [showGamifyPrompt, setShowGamifyPrompt] = useState(false);

  useEffect(() => {
    const handleStatusChange = () => {
      const online = SyncManager.isOnline();
      setIsOnline(online);
      if (online) {
        SyncManager.syncOfflineQueries();
      }
    };
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    
    // Initial sync
    if (navigator.onLine) SyncManager.syncOfflineQueries();

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  useEffect(() => {
    storage.saveState(state);
  }, [state]);

  const handleStartSession = () => {
    if (!sessionInput.subject || !sessionInput.topic) return;
    
    const session: StudySession = {
      id: crypto.randomUUID(),
      subject: sessionInput.subject,
      topic: sessionInput.topic,
      content: 'Session initialized. Ask me anything to begin our Socratic journey.',
      timestamp: Date.now()
    };

    setActiveSession(session);
    setConversation([{ role: 'tutor', text: `Hello! I see you're interested in ${sessionInput.topic}. What's the first thing you've noticed or wondered about this subject?` }]);
    setShowGamifyPrompt(true);
  };

  const handleGamify = async () => {
    if (!activeSession) return;
    setLoading(true);
    setShowGamifyPrompt(false);
    try {
      const response = await fetch('/api/gamify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: activeSession.topic })
      });
      const data = await response.json();
      if (data.success) {
        setGamifiedContent(data.game);
        setConversation(prev => [...prev, { role: 'tutor', text: `🎮 Gamification Activated! Here's your mission:\n\n${data.game}` }]);
      }
    } catch (error) {
      console.error("Gamification error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAskTutor = async () => {
    if (!studentQuery.trim() || !activeSession || loading) return;
    
    const currentQuery = studentQuery;
    setStudentQuery('');
    setConversation(prev => [...prev, { role: 'student', text: currentQuery }]);
    setLoading(true);

    try {
      // Call the new modular backend endpoint
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: 'test_student_123',
          question: currentQuery,
          subject: activeSession.subject,
          topic: activeSession.topic,
          requires_deep_research: currentQuery.length > 200 // Example logic: long queries are "deep"
        })
      });
      
      const data = await response.json();
      const answer = data.answer || data.message;
      
      setConversation(prev => [...prev, { role: 'tutor', text: answer }]);
      
      setState(prev => ({
        ...prev,
        points: prev.points + (data.status === 'success' ? 10 : 5)
      }));

    } catch (error) {
      setConversation(prev => [...prev, { role: 'tutor', text: "The network seems faint, but I've saved your thought for later!" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = () => {
    if (!activeSession) return;
    
    // Extract a snippet of the conversation (last tutor message)
    const tutorMessages = conversation.filter(m => m.role === 'tutor');
    const snippet = tutorMessages.length > 0 
      ? tutorMessages[tutorMessages.length - 1].text.substring(0, 150) + '...'
      : 'Completed session.';

    const completedSession: StudySession = {
      ...activeSession,
      content: snippet,
      timestamp: Date.now()
    };

    setState(prev => ({
      ...prev,
      sessions: [completedSession, ...prev.sessions]
    }));

    setActiveSession(null);
    setConversation([]);
    setSessionInput({ subject: '', topic: '' });
    setGamifiedContent(null);
    setShowGamifyPrompt(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans selection:bg-orange-200 pb-20">
      {/* Header */}
      <header className="border-b border-[#141414]/10 bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#141414] rounded-lg flex items-center justify-center text-white">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">NEXUS EDU</h1>
              <p className="text-[10px] uppercase tracking-widest opacity-50 font-semibold italic">Edge Learning Multi-Agent Network</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 px-4 py-2 bg-white rounded-full border border-[#141414]/5">
              <div className="flex flex-col items-center">
                <span className="text-[9px] uppercase font-bold opacity-40">Points</span>
                <span className="font-mono font-bold leading-none">{state.points}</span>
              </div>
              <div className="w-[1px] h-6 bg-[#141414]/10" />
              <div className="flex flex-col items-center">
                <span className="text-[9px] uppercase font-bold opacity-40">Level</span>
                <span className="font-mono font-bold leading-none">{state.level}</span>
              </div>
            </div>
            
            <div className={`p-2 rounded-full ${isOnline ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              {isOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Navigation Tabs */}
        <div className="flex gap-8 mb-12 border-b border-[#141414]/5">
          <button 
            onClick={() => setActiveTab('study')}
            className={`pb-4 px-2 text-sm font-bold uppercase tracking-widest transition-all relative ${activeTab === 'study' ? 'text-[#141414]' : 'text-zinc-400'}`}
          >
            Study Lab
            {activeTab === 'study' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#141414]" />}
          </button>
          <button 
            onClick={() => setActiveTab('achievements')}
            className={`pb-4 px-2 text-sm font-bold uppercase tracking-widest transition-all relative ${activeTab === 'achievements' ? 'text-[#141414]' : 'text-zinc-400'}`}
          >
            Achievements
            {activeTab === 'achievements' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#141414]" />}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'study' ? (
            <motion.div 
              key="study"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Left Column: New Session & Sidebar History */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-8 rounded-3xl border border-[#141414]/5 shadow-sm">
                  <h2 className="text-2xl font-bold mb-6 italic serif">New Learning Session</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold opacity-40 mb-2 block">Subject</label>
                      <input 
                        type="text" 
                        value={sessionInput.subject}
                        onChange={(e) => setSessionInput(s => ({ ...s, subject: e.target.value }))}
                        placeholder="e.g. Quantum Physics"
                        className="w-full bg-[#F5F5F0] px-4 py-3 rounded-xl border-none outline-none focus:ring-2 ring-[#141414]/5 transition-all text-sm"
                        disabled={!!activeSession}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold opacity-40 mb-2 block">Topic</label>
                      <input 
                        type="text" 
                        value={sessionInput.topic}
                        onChange={(e) => setSessionInput(s => ({ ...s, topic: e.target.value }))}
                        placeholder="e.g. Wave-Particle Duality"
                        className="w-full bg-[#F5F5F0] px-4 py-3 rounded-xl border-none outline-none focus:ring-2 ring-[#141414]/5 transition-all text-sm"
                        disabled={!!activeSession}
                      />
                    </div>
                    {!activeSession ? (
                      <button 
                        onClick={handleStartSession}
                        disabled={loading || !sessionInput.subject || !sessionInput.topic}
                        className="w-full bg-[#141414] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#252525] transition-all disabled:opacity-50"
                      >
                        <Play className="w-5 h-5" />
                        Initialize Tutor Agent
                      </button>
                    ) : (
                      <button 
                        onClick={handleEndSession}
                        className="w-full bg-red-50 text-red-600 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-all border border-red-200"
                      >
                        <Zap className="w-5 h-5" />
                        End Active Session
                      </button>
                    )}
                  </div>
                </div>

                {/* Sidebar Recent History */}
                <div className="bg-white p-6 rounded-3xl border border-[#141414]/5">
                  <h3 className="text-xs font-black uppercase tracking-widest opacity-40 mb-6 flex items-center gap-2">
                    <BookOpen size={14} /> Previous Discoveries
                  </h3>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {state.sessions.length === 0 ? (
                      <p className="text-[10px] uppercase font-bold opacity-30 text-center py-4">No history yet</p>
                    ) : (
                      state.sessions.map((session) => (
                        <div key={session.id} className="p-4 bg-[#F5F5F0] rounded-2xl hover:bg-orange-50 transition-colors border border-[#141414]/5 group">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[8px] uppercase font-bold text-orange-600">{session.subject}</span>
                            <span className="text-[8px] font-mono opacity-30">{new Date(session.timestamp).toLocaleDateString()}</span>
                          </div>
                          <h4 className="font-bold text-sm block mb-1 group-hover:text-orange-700 transition-colors">{session.topic}</h4>
                          <p className="text-[10px] opacity-40 line-clamp-2 leading-tight">{session.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-[#141414] p-8 rounded-3xl text-white overflow-hidden relative group">
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold mb-2">Edge Educator</h3>
                    <p className="text-sm opacity-60">AI agents deployed at your workspace to provide real-time Socratic guidance.</p>
                  </div>
                  <BookOpen className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform duration-700" />
                </div>
              </div>

              {/* Middle & Right: Active Session or History */}
              <div className="lg:col-span-2">
                <AnimatePresence mode="wait">
                  {activeSession ? (
                    <motion.div 
                      key="active"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      className="bg-white p-6 md:p-10 rounded-[40px] border border-[#141414]/5 shadow-xl min-h-[600px] flex flex-col"
                    >
                      <div className="flex justify-between items-start mb-8">
                        <div>
                          <span className="text-[10px] uppercase font-black px-2 py-1 bg-orange-100 text-orange-600 rounded">Active Lab</span>
                          <h2 className="text-4xl font-black mt-4">{activeSession.topic}</h2>
                          <div className="flex items-center gap-2 mt-2 font-mono text-sm opacity-50 uppercase tracking-widest">
                            <ArrowRight size={14} /> {activeSession.subject}
                          </div>
                        </div>
                      </div>

                      <div className="flex-grow flex flex-col gap-4 mb-8 overflow-y-auto max-h-[400px] p-2 custom-scrollbar">
                        {showGamifyPrompt && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-orange-50 border border-orange-200 p-6 rounded-3xl mb-4 text-center"
                          >
                            <h3 className="font-bold text-orange-800 mb-2">Enhance with Gamification?</h3>
                            <p className="text-sm text-orange-700 mb-4">Would you like the Context Translator to turn this topic into a persistent game world?</p>
                            <div className="flex gap-2 justify-center">
                              <button 
                                onClick={handleGamify}
                                className="bg-orange-500 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-orange-600 transition-all flex items-center gap-2"
                              >
                                <Gamepad2 size={16} /> Yes, Gamify!
                              </button>
                              <button 
                                onClick={() => setShowGamifyPrompt(false)}
                                className="bg-white text-zinc-500 px-6 py-2 rounded-xl font-bold text-sm border border-zinc-200 hover:bg-zinc-50"
                              >
                                No thanks
                              </button>
                            </div>
                          </motion.div>
                        )}
                        {conversation.map((msg, i) => (
                          <motion.div 
                            key={i}
                            initial={{ opacity: 0, x: msg.role === 'student' ? 20 : -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`flex ${msg.role === 'student' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                              msg.role === 'student' 
                                ? 'bg-[#141414] text-white rounded-br-none' 
                                : 'bg-[#F5F5F0] text-[#141414] border border-[#141414]/5 rounded-bl-none'
                            }`}>
                              <div className="text-[10px] uppercase font-black opacity-30 mb-1">
                                {msg.role === 'student' ? 'Student' : 'Edge Educator'}
                              </div>
                              {msg.text}
                            </div>
                          </motion.div>
                        ))}
                        {loading && (
                          <div className="flex justify-start">
                            <div className="bg-[#F5F5F0] p-4 rounded-2xl rounded-bl-none border border-[#141414]/5 flex gap-1">
                              <span className="w-1.5 h-1.5 bg-[#141414]/20 rounded-full animate-bounce" />
                              <span className="w-1.5 h-1.5 bg-[#141414]/20 rounded-full animate-bounce [animation-delay:0.2s]" />
                              <span className="w-1.5 h-1.5 bg-[#141414]/20 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="relative mt-auto">
                        <textarea 
                          value={studentQuery}
                          onChange={(e) => setStudentQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAskTutor())}
                          placeholder="Reflect on the tutor's question..."
                          className="w-full bg-[#F5F5F0] p-6 pr-16 rounded-3xl border-none outline-none focus:ring-2 ring-[#141414]/5 transition-all text-sm resize-none h-32"
                        />
                        <button 
                          onClick={handleAskTutor}
                          disabled={loading || !studentQuery.trim()}
                          className="absolute right-4 bottom-4 w-10 h-10 bg-[#141414] text-white rounded-2xl flex items-center justify-center hover:bg-orange-500 transition-all disabled:opacity-50"
                        >
                          <Send size={20} />
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="space-y-6">
                      <h2 className="text-xl font-bold uppercase tracking-widest opacity-40">Previous Discoveries</h2>
                      {state.sessions.length === 0 ? (
                        <div className="bg-[#141414]/5 rounded-3xl p-12 text-center border border-dashed border-[#141414]/10">
                          <BookOpen className="w-12 h-12 mx-auto opacity-20 mb-4" />
                          <p className="font-bold opacity-30 uppercase text-sm tracking-widest">No sessions recorded yet.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {state.sessions.map((session, i) => (
                            <motion.div 
                              key={session.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="bg-white p-6 rounded-2xl border border-[#141414]/5 hover:border-orange-200 transition-colors group cursor-pointer"
                            >
                              <div className="flex justify-between items-start mb-4">
                                <span className="text-[9px] uppercase font-bold px-2 py-1 bg-zinc-100 rounded text-zinc-500">{session.subject}</span>
                                <time className="text-[9px] font-mono opacity-40">{new Date(session.timestamp).toLocaleDateString()}</time>
                              </div>
                              <h3 className="font-bold text-lg mb-2 group-hover:text-orange-600 transition-colors capitalize">{session.topic}</h3>
                              <p className="text-xs opacity-50 line-clamp-2 leading-relaxed">{session.content}</p>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="achievements"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {state.achievements.map((achievement) => (
                <div 
                  key={achievement.id}
                  className={`p-8 rounded-[32px] border transition-all ${
                    state.points >= 50 ? 'bg-white border-[#141414]/5' : 'bg-[#141414]/5 border-transparent opacity-50 grayscale'
                  }`}
                >
                  <div className="w-12 h-12 bg-[#F5F5F0] rounded-2xl flex items-center justify-center mb-6">
                    <Trophy className="w-6 h-6 text-[#141414]" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 uppercase tracking-tight">{achievement.title}</h3>
                  <p className="text-sm opacity-50 leading-relaxed font-medium">{achievement.description}</p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer / Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-[#141414]/5 p-3 flex justify-center z-50">
        <div className="flex items-center gap-10 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            System Synchronized
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#141414]" />
            Agent Core 3.1-PRO
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#141414]" />
            v1.0.4 {new Date().getFullYear()}
          </div>
        </div>
      </footer>
    </div>
  );
}
