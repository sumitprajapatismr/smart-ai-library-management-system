import React, { useEffect, useState } from 'react';
import { 
  Sparkles, Calendar, BookOpen, HelpCircle, 
  Layers, Compass, Award, BarChart3, Plus, Trash2, 
  CheckCircle2, ChevronRight, RefreshCw, X, Brain, FileText, Map
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import { ReadingChallengeTab } from '../components/ReadingChallengeTab';
import { StudyRoomsTab } from '../components/StudyRoomsTab';
import { KnowledgeGraphTab } from '../components/KnowledgeGraphTab';
import { MoodTrackerTab } from '../components/MoodTrackerTab';
import { NotesCitationTab } from '../components/NotesCitationTab';
import { MindMapTab } from '../components/MindMapTab';
import { CodingPracticeTab } from '../components/CodingPracticeTab';
import { LearningTimelineTab } from '../components/LearningTimelineTab';
import { DigitalTwinTab } from '../components/DigitalTwinTab';

export const AISuite: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('planner');
  const [books, setBooks] = useState<any[]>([]);

  // Planner states
  const [plannerLoading, setPlannerLoading] = useState(false);
  const [plannerBook, setPlannerBook] = useState('');
  const [plannerPages, setPlannerPages] = useState(200);
  const [plannerDays, setPlannerDays] = useState(10);
  const [plannerGoal, setPlannerGoal] = useState('deep study');
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);

  // Quiz states
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizBook, setQuizBook] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<any>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Flashcard states
  const [flashcardLoading, setFlashcardLoading] = useState(false);
  const [flashcardTopic, setFlashcardTopic] = useState('');
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [activeCardIdx, setActiveCardIdx] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);

  // Explain states
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainTopic, setExplainTopic] = useState('');
  const [explainLevel, setExplainLevel] = useState('novice');
  const [explanation, setExplanation] = useState('');

  // Compare states
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareBook1, setCompareBook1] = useState('');
  const [compareBook2, setCompareBook2] = useState('');
  const [comparisonText, setComparisonText] = useState('');

  // Career states
  const [careerLoading, setCareerLoading] = useState(false);
  const [careerPath, setCareerPath] = useState('Software Engineer');
  const [careerPathText, setCareerPathText] = useState('');

  // Weekly Report states
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState<any>(null);

  // Load books catalog and saved plans
  const loadInitialData = async () => {
    try {
      const bookRes = await api.get('/books', { params: { limit: 100 } });
      if (bookRes.data.success) {
        setBooks(bookRes.data.books || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSavedPlans = async () => {
    setPlansLoading(true);
    try {
      const res = await api.get('/ai/reading-plan/saved');
      if (res.data.success) {
        setSavedPlans(res.data.plans || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPlansLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
    fetchSavedPlans();
  }, []);

  // AI Reading Planner Handler
  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plannerBook) {
      showToast('Please enter or select a book title', 'error');
      return;
    }
    setPlannerLoading(true);
    try {
      const res = await api.post('/ai/reading-plan', {
        bookTitle: plannerBook,
        totalPages: plannerPages,
        targetDays: plannerDays,
        targetGoal: plannerGoal
      });
      if (res.data.success) {
        setGeneratedPlan(res.data.plan);
        showToast('AI Reading Plan generated successfully!', 'success');
      }
    } catch (err) {
      showToast('Failed to generate reading plan', 'error');
    } finally {
      setPlannerLoading(false);
    }
  };

  const handleSavePlan = async () => {
    if (!generatedPlan) return;
    try {
      const res = await api.post('/ai/reading-plan/save', {
        bookTitle: plannerBook,
        totalPages: plannerPages,
        targetDays: plannerDays,
        dailyGoal: generatedPlan.dailyGoal,
        schedule: generatedPlan.schedule
      });
      if (res.data.success) {
        showToast('Reading plan saved to your timeline!', 'success');
        setGeneratedPlan(null);
        setPlannerBook('');
        fetchSavedPlans();
      }
    } catch (err) {
      showToast('Could not save plan', 'error');
    }
  };

  const handleUpdatePlanProgress = async (planId: string, currentVal: number, step: number) => {
    const newVal = Math.min(100, Math.max(0, currentVal + step));
    try {
      const res = await api.put(`/ai/reading-plan/${planId}/progress`, { progress: newVal });
      if (res.data.success) {
        setSavedPlans(prev => prev.map(p => p._id === planId ? { ...p, progress: newVal } : p));
        showToast('Plan progress updated successfully!', 'success');
      }
    } catch (err) {
      showToast('Could not update progress', 'error');
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!window.confirm('Delete this reading plan permanently?')) return;
    try {
      const res = await api.delete(`/ai/reading-plan/${planId}`);
      if (res.data.success) {
        showToast('Reading plan deleted', 'success');
        fetchSavedPlans();
      }
    } catch (err) {
      showToast('Could not delete plan', 'error');
    }
  };

  // AI Quiz Generator Handler
  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizBook) {
      showToast('Please select a book', 'error');
      return;
    }
    setQuizLoading(true);
    setQuestions([]);
    setQuizAnswers({});
    setQuizSubmitted(false);
    try {
      const res = await api.post('/ai/quiz', { bookTitle: quizBook, numQuestions: 4 });
      if (res.data.success) {
        setQuestions(res.data.quiz || []);
        showToast('Quiz generated. Good luck!', 'success');
      }
    } catch (err) {
      showToast('Failed to generate quiz', 'error');
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSelectQuizOption = (qIdx: number, oIdx: number) => {
    setQuizAnswers((prev: any) => ({ ...prev, [qIdx]: oIdx }));
  };

  const handleSubmitQuiz = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.answerIndex) {
        score++;
      }
    });
    setQuizScore(score);
    setQuizSubmitted(true);
    showToast(`You scored ${score}/${questions.length}!`, score === questions.length ? 'success' : 'info');
  };

  // AI Flashcards Handler
  const handleGenerateFlashcards = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flashcardTopic.trim()) {
      showToast('Please enter a study topic', 'error');
      return;
    }
    setFlashcardLoading(true);
    setFlashcards([]);
    setActiveCardIdx(0);
    setCardFlipped(false);
    try {
      const res = await api.post('/ai/flashcards', { topic: flashcardTopic.trim() });
      if (res.data.success) {
        setFlashcards(res.data.flashcards || []);
        showToast('Flashcards generated successfully!', 'success');
      }
    } catch (err) {
      showToast('Failed to generate flashcards', 'error');
    } finally {
      setFlashcardLoading(false);
    }
  };

  // AI Explain Handler
  const handleGenerateExplanation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!explainTopic.trim()) {
      showToast('Please enter a topic', 'error');
      return;
    }
    setExplainLoading(true);
    setExplanation('');
    try {
      const res = await api.post('/ai/explain', { topic: explainTopic.trim(), level: explainLevel });
      if (res.data.success) {
        setExplanation(res.data.explanation || '');
      }
    } catch (err) {
      showToast('Failed to explain topic', 'error');
    } finally {
      setExplainLoading(false);
    }
  };

  // AI Compare Books Handler
  const handleCompareBooks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compareBook1 || !compareBook2) {
      showToast('Please select both books', 'error');
      return;
    }
    setCompareLoading(true);
    setComparisonText('');
    try {
      const res = await api.post('/ai/compare', { book1Title: compareBook1, book2Title: compareBook2 });
      if (res.data.success) {
        setComparisonText(res.data.comparison || '');
      }
    } catch (err) {
      showToast('Failed to compare books', 'error');
    } finally {
      setCompareLoading(false);
    }
  };

  // AI Career Recommendations Handler
  const handleGetCareerPath = async (e: React.FormEvent) => {
    e.preventDefault();
    setCareerLoading(true);
    setCareerPathText('');
    try {
      const res = await api.post('/ai/career', { careerGoal: careerPath });
      if (res.data.success) {
        setCareerPathText(res.data.recommendations || '');
      }
    } catch (err) {
      showToast('Failed to load career suggestion path', 'error');
    } finally {
      setCareerLoading(false);
    }
  };

  // AI Weekly Report Handler
  const handleGetWeeklyReport = async () => {
    setWeeklyLoading(true);
    setWeeklyReport(null);
    try {
      const res = await api.get('/ai/weekly-report');
      if (res.data.success) {
        setWeeklyReport(res.data.report || null);
        showToast('Weekly reading analysis compiled successfully!', 'success');
      }
    } catch (err) {
      showToast('Failed to load weekly report', 'error');
    } finally {
      setWeeklyLoading(false);
    }
  };

  // Helper to parse simple markdown to clean text layout
  const parseMarkdown = (text: string) => {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/### (.*?)\n/g, '<h4 class="text-sm font-bold text-slate-800 dark:text-slate-200 mt-3 mb-1">$1</h4>')
      .replace(/## (.*?)\n/g, '<h3 class="text-base font-extrabold text-slate-900 dark:text-white mt-4 mb-2">$1</h3>')
      .replace(/- (.*?)\n/g, '<li class="list-disc list-inside ml-2 text-xs text-slate-650 dark:text-slate-400 py-0.5">$1</li>');
  };

  return (
    <div className="space-y-6 page-fade-in">
      {/* Title */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">AI Study Suite & Student Hub</h2>
          <p className="text-xs text-slate-400 mt-1">Leverage ALPHA's intelligence engine to accelerate your reading progress</p>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
        {[
          { id: 'planner', label: 'Reading Planner', icon: Calendar },
          { id: 'quiz', label: 'Quiz Generator', icon: HelpCircle },
          { id: 'flashcards', label: 'Flashcards', icon: Layers },
          { id: 'explain', label: 'Explain Topic', icon: BookOpen },
          { id: 'compare', label: 'Compare Books', icon: RefreshCw },
          { id: 'career', label: 'Career Suggest', icon: Compass },
          { id: 'weekly', label: 'Weekly Coach', icon: BarChart3 },
          { id: 'mood', label: 'Mood Tracker', icon: Sparkles },
          { id: 'rooms', label: 'Study Rooms', icon: Calendar },
          { id: 'challenge', label: 'Challenges', icon: Award },
          { id: 'graph', label: 'Knowledge Graph', icon: Compass },
          { id: 'notes', label: 'Notes & Citations', icon: FileText },
          { id: 'mindmap', label: 'Mind Maps', icon: Sparkles },
          { id: 'practice', label: 'Coding Practice', icon: Brain },
          { id: 'timeline', label: 'Learning Timeline', icon: Layers },
          { id: 'twin', label: 'Digital Twin', icon: Map },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all border ${
                isActive
                  ? 'bg-brand-600 text-white border-brand-650 shadow-md shadow-brand-500/10'
                  : 'bg-white/70 dark:bg-slate-900/50 backdrop-blur-md text-slate-500 border-slate-200/50 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-850/50 hover:text-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {['mood', 'rooms', 'challenge', 'graph', 'notes', 'mindmap', 'practice', 'timeline', 'twin'].includes(activeTab) ? (
        <div className="w-full pb-12">
          {activeTab === 'mood' && <MoodTrackerTab />}
          {activeTab === 'rooms' && <StudyRoomsTab />}
          {activeTab === 'challenge' && <ReadingChallengeTab />}
          {activeTab === 'graph' && <KnowledgeGraphTab />}
          {activeTab === 'notes' && <NotesCitationTab />}
          {activeTab === 'mindmap' && <MindMapTab />}
          {activeTab === 'practice' && <CodingPracticeTab />}
          {activeTab === 'timeline' && <LearningTimelineTab />}
          {activeTab === 'twin' && <DigitalTwinTab />}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main interactive panel */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* TABS 1: Reading Planner */}
            {activeTab === 'planner' && (
              <div className="glass-card p-6 rounded-3xl space-y-6">
                <div className="flex items-center gap-2 text-brand-600">
                  <Calendar className="w-5 h-5" />
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">AI Reading Goal Planner</h3>
                </div>

                <form onSubmit={handleGeneratePlan} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Book Title / Selection</label>
                    <input
                      type="text"
                      list="planner-books"
                      value={plannerBook}
                      onChange={(e) => setPlannerBook(e.target.value)}
                      placeholder="e.g. Effective Java"
                      className="form-input text-xs"
                      required
                    />
                    <datalist id="planner-books">
                      {books.map(b => <option key={b._id} value={b.title} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Number of Pages</label>
                    <input
                      type="number"
                      value={plannerPages}
                      onChange={(e) => setPlannerPages(parseInt(e.target.value))}
                      className="form-input text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Target Days</label>
                    <input
                      type="number"
                      value={plannerDays}
                      onChange={(e) => setPlannerDays(parseInt(e.target.value))}
                      className="form-input text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Planner Mode</label>
                    <select
                      value={plannerGoal}
                      onChange={(e) => setPlannerGoal(e.target.value)}
                      className="form-input text-xs"
                    >
                      <option value="deep study">Deep Study / Retain</option>
                      <option value="exam mode">Exam Mode / Quick Summary</option>
                      <option value="pleasure reading">Pleasure / Casual Reading</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={plannerLoading}
                    className="btn-primary sm:col-span-2 py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {plannerLoading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 animate-pulse" />
                        <span>Assemble Study Plan</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Genuinely Generated Reading Plan Box */}
                {generatedPlan && (
                  <div className="p-5 bg-brand-500/5 border border-brand-550/15 rounded-3xl space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Calculated Reading Target</span>
                      <span className="text-xs font-extrabold text-brand-605">{generatedPlan.dailyGoal}</span>
                    </div>
                    
                    <div className="space-y-3">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Daily Milestones List</span>
                      <div className="space-y-2 max-h-[12rem] overflow-y-auto pr-1">
                        {generatedPlan.schedule?.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-2.5 bg-white dark:bg-slate-900 border border-slate-205/30 rounded-xl text-xs font-semibold">
                            <span>Day {item.day}</span>
                            <span className="text-slate-500 font-normal">{item.chapters} ({item.pages})</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleSavePlan}
                      className="w-full btn-primary py-2 text-xs font-bold rounded-xl"
                    >
                      Lock Plan to My Timeline
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TABS 2: Quiz Generator */}
            {activeTab === 'quiz' && (
              <div className="glass-card p-6 rounded-3xl space-y-6">
                <div className="flex items-center gap-2 text-brand-600">
                  <HelpCircle className="w-5 h-5" />
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">AI Conceptual Quiz Generator</h3>
                </div>

                <form onSubmit={handleGenerateQuiz} className="flex gap-3">
                  <input
                    type="text"
                    list="quiz-books"
                    value={quizBook}
                    onChange={(e) => setQuizBook(e.target.value)}
                    placeholder="Enter Book Title to generate Quiz..."
                    className="form-input text-xs flex-1"
                    required
                  />
                  <datalist id="quiz-books">
                    {books.map(b => <option key={b._id} value={b.title} />)}
                  </datalist>
                  <button
                    type="submit"
                    disabled={quizLoading}
                    className="btn-primary py-2 px-5 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    {quizLoading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        <span>Assemble</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Render questions list */}
                {questions.length > 0 && (
                  <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-850">
                    <div className="space-y-4">
                      {questions.map((q, qIdx) => (
                        <div key={qIdx} className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-normal">{qIdx + 1}. {q.question}</h4>
                          <div className="grid grid-cols-1 gap-2">
                            {(q.choices ?? []).map((choice: string, cIdx: number) => {
                              const isSelected = quizAnswers[qIdx] === cIdx;
                              return (
                                <button
                                  key={cIdx}
                                  type="button"
                                  onClick={() => handleSelectQuizOption(qIdx, cIdx)}
                                  disabled={quizSubmitted}
                                  className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                                    quizSubmitted
                                      ? cIdx === q.correctIndex
                                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600'
                                        : isSelected
                                          ? 'bg-rose-500/10 border-rose-500 text-rose-600'
                                          : 'border-slate-200 dark:border-slate-800'
                                      : isSelected
                                        ? 'border-brand-500 bg-brand-500/5 text-brand-655'
                                        : 'border-slate-205 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900'
                                  }`}
                                >
                                  {choice}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {!quizSubmitted ? (
                      <button
                        onClick={handleSubmitQuiz}
                        className="w-full btn-primary py-2.5 text-xs font-bold rounded-xl"
                      >
                        Submit Quiz Responses
                      </button>
                    ) : (
                      <div className="p-4 bg-brand-500/5 border border-brand-550/15 rounded-2xl flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-450">Assessment Complete</span>
                        <span className="text-xs font-extrabold text-brand-605">Score: {quizScore} / {questions.length}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TABS 3: Flashcards */}
            {activeTab === 'flashcards' && (
              <div className="glass-card p-6 rounded-3xl space-y-6">
                <div className="flex items-center gap-2 text-brand-600">
                  <Layers className="w-5 h-5" />
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">AI Revision Flashcards</h3>
                </div>

                <form onSubmit={handleGenerateFlashcards} className="flex gap-3">
                  <input
                    type="text"
                    value={flashcardTopic}
                    onChange={(e) => setFlashcardTopic(e.target.value)}
                    placeholder="Enter Book Title or Subject..."
                    className="form-input text-xs flex-1"
                    required
                  />
                  <button
                    type="submit"
                    disabled={flashcardLoading}
                    className="btn-primary py-2 px-5 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    {flashcardLoading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        <span>Assemble</span>
                      </>
                    )}
                  </button>
                </form>

                {/* RENDER ACTIVE FLASHCARD */}
                {flashcards.length > 0 && (
                  <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-850 flex flex-col items-center">
                    
                    {/* Cards stack flip view */}
                    <div 
                      onClick={() => setCardFlipped(!cardFlipped)}
                      className="w-full max-w-md h-56 relative perspective cursor-pointer"
                    >
                      <div className={`w-full h-full rounded-3xl border transition-all duration-500 transform-style relative flex items-center justify-center p-6 text-center ${
                        cardFlipped 
                          ? 'rotate-y-180 bg-brand-50 border-brand-200 text-brand-850 dark:bg-slate-900 dark:border-slate-800' 
                          : 'bg-white border-slate-200/60 text-slate-900 dark:bg-slate-900/60 dark:border-slate-850'
                      }`}>
                        {cardFlipped ? (
                          <div className="rotate-y-180">
                            <span className="text-[10px] uppercase font-bold text-brand-500 tracking-widest block mb-2">Back (Definition/Answer)</span>
                            <p className="text-sm font-semibold">{flashcards[activeCardIdx].back}</p>
                          </div>
                        ) : (
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block mb-2">Front (Question/Term)</span>
                            <h4 className="text-base font-extrabold">{flashcards[activeCardIdx].front}</h4>
                            <span className="text-[9px] text-slate-405 mt-6 block">Click to flip card</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Navigation controls */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => {
                          setActiveCardIdx(prev => Math.max(0, prev - 1));
                          setCardFlipped(false);
                        }}
                        disabled={activeCardIdx === 0}
                        className="btn-secondary py-1.5 px-3 disabled:opacity-50"
                      >
                        Prev
                      </button>
                      <span className="text-xs font-bold text-slate-505">Card {activeCardIdx + 1} of {flashcards.length}</span>
                      <button
                        onClick={() => {
                          setActiveCardIdx(prev => Math.min(flashcards.length - 1, prev + 1));
                          setCardFlipped(false);
                        }}
                        disabled={activeCardIdx === flashcards.length - 1}
                        className="btn-secondary py-1.5 px-3 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TABS 4: Explain Topic */}
            {activeTab === 'explain' && (
              <div className="glass-card p-6 rounded-3xl space-y-6">
                <div className="flex items-center gap-2 text-brand-600">
                  <BookOpen className="w-5 h-5" />
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">AI Conceptual Explain Engine</h3>
                </div>

                <form onSubmit={handleGenerateExplanation} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Enter Academic Topic / Query</label>
                      <input
                        type="text"
                        value={explainTopic}
                        onChange={(e) => setExplainTopic(e.target.value)}
                        placeholder="e.g. MapReduce Paradigm, Redux Store vs Context API..."
                        className="form-input text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Explanation Simplicity</label>
                      <select
                        value={explainLevel}
                        onChange={(e) => setExplainLevel(e.target.value)}
                        className="form-input text-xs"
                      >
                        <option value="child">Explain like I am 10 (Analogy Heavy)</option>
                        <option value="novice">College Student (Beginner Friendly)</option>
                        <option value="expert">Senior Software Architect (Technical Deep-Dive)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={explainLoading}
                    className="w-full btn-primary py-2.5 text-xs font-bold rounded-xl"
                  >
                    {explainLoading ? 'Generating Explanation...' : 'Explain Topic'}
                  </button>
                </form>

                {explanation && (
                  <div className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-205/30 rounded-2xl overflow-y-auto max-h-[22rem] scrollbar-thin">
                    <div 
                      className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed space-y-2 font-sans"
                      dangerouslySetInnerHTML={{ __html: parseMarkdown(explanation) }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* TABS 5: Compare Books */}
            {activeTab === 'compare' && (
              <div className="glass-card p-6 rounded-3xl space-y-6">
                <div className="flex items-center gap-2 text-brand-600">
                  <RefreshCw className="w-5 h-5" />
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">AI Book Comparison Ledger</h3>
                </div>

                <form onSubmit={handleCompareBooks} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Book Title A</label>
                      <input
                        type="text"
                        list="compare-books-1"
                        value={compareBook1}
                        onChange={(e) => setCompareBook1(e.target.value)}
                        placeholder="e.g. Effective Java"
                        className="form-input text-xs"
                        required
                      />
                      <datalist id="compare-books-1">
                        {books.map(b => <option key={b._id} value={b.title} />)}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Book Title B</label>
                      <input
                        type="text"
                        list="compare-books-2"
                        value={compareBook2}
                        onChange={(e) => setCompareBook2(e.target.value)}
                        placeholder="e.g. Head First Java"
                        className="form-input text-xs"
                        required
                      />
                      <datalist id="compare-books-2">
                        {books.map(b => <option key={b._id} value={b.title} />)}
                      </datalist>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={compareLoading}
                    className="w-full btn-primary py-2.5 text-xs font-bold rounded-xl"
                  >
                    {compareLoading ? 'Analyzing & Comparing...' : 'Compare Catalog Books'}
                  </button>
                </form>

                {comparisonText && (
                  <div className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-205/30 rounded-2xl overflow-y-auto max-h-[22rem] scrollbar-thin">
                    <div 
                      className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed space-y-2 font-sans"
                      dangerouslySetInnerHTML={{ __html: parseMarkdown(comparisonText) }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* TABS 6: Career Planner */}
            {activeTab === 'career' && (
              <div className="glass-card p-6 rounded-3xl space-y-6">
                <div className="flex items-center gap-2 text-brand-600">
                  <Compass className="w-5 h-5" />
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">AI Placement Career Mentor</h3>
                </div>

                <form onSubmit={handleGetCareerPath} className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Target Professional Role</label>
                    <select
                      value={careerPath}
                      onChange={(e) => setCareerPath(e.target.value)}
                      className="form-input text-xs"
                    >
                      <option value="Software Engineer">General Software Engineer</option>
                      <option value="Java Developer">Java Developer Specialist</option>
                      <option value="MERN Developer">MERN Stack Developer</option>
                      <option value="AI Engineer">Artificial Intelligence Engineer</option>
                      <option value="Cyber Security">Cyber Security Expert</option>
                      <option value="Data Science">Data Scientist</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={careerLoading}
                    className="btn-primary self-end py-3 px-5 text-xs font-semibold rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    {careerLoading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        <span>Chart Path</span>
                      </>
                    )}
                  </button>
                </form>

                {careerPathText && (
                  <div className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-2xl overflow-y-auto max-h-[22rem] scrollbar-thin">
                    <div 
                      className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-2 font-sans"
                      dangerouslySetInnerHTML={{ __html: parseMarkdown(careerPathText) }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* TABS 7: Weekly Coach */}
            {activeTab === 'weekly' && (
              <div className="glass-card p-6 rounded-3xl space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-brand-600">
                    <BarChart3 className="w-5 h-5" />
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">AI Weekly Reading Coach</h3>
                  </div>
                  <button
                    onClick={handleGetWeeklyReport}
                    disabled={weeklyLoading}
                    className="btn-secondary text-[10px] py-1.5 px-3 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${weeklyLoading ? 'animate-spin' : ''}`} />
                    Compile Report
                  </button>
                </div>

                {weeklyReport ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-brand-500/5 border border-brand-550/15 rounded-2xl text-center space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Performance Score</span>
                        <h4 className="text-3xl font-extrabold text-brand-600 dark:text-brand-400">{weeklyReport.score} / 100</h4>
                      </div>
                      <div className="p-4 bg-amber-500/5 border border-amber-550/15 rounded-2xl text-center space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Coach Action Suggestion</span>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-350">{weeklyReport.nextAction}</p>
                      </div>
                    </div>

                    <div className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-2xl overflow-y-auto max-h-[18rem] scrollbar-thin">
                      <div 
                        className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-2 font-sans"
                        dangerouslySetInnerHTML={{ __html: parseMarkdown(weeklyReport.summary) }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl animate-pulse">
                    <BarChart3 className="w-10 h-10 mx-auto opacity-20 mb-3" />
                    <h4 className="font-bold text-sm text-slate-705">No report compiled this week</h4>
                    <p className="text-xs mt-1 max-w-xs mx-auto">Click "Compile Report" above to review reading score metrics.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Saved Plans/Streak Timeline Panel */}
          <div className="space-y-6">
            <div className="glass-card p-5 rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-brand-600" />
                  Active Plans Timeline
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-850 text-slate-550">{savedPlans.length} plans</span>
              </div>

              {plansLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : savedPlans.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No reading goals configured. Use the Reading Planner tab to create one!</p>
              ) : (
                <div className="space-y-4 max-h-[26rem] overflow-y-auto pr-1.5 scrollbar-thin">
                  {savedPlans.map(plan => (
                    <div key={plan._id} className="p-3 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-3 relative group">
                      <button
                        onClick={() => handleDeletePlan(plan._id)}
                        className="absolute top-2 right-2 p-1.5 text-slate-405 hover:text-rose-500 opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div>
                        <h5 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 truncate pr-6">{plan.bookTitle}</h5>
                        <span className="text-[9px] text-slate-450 font-bold block">{plan.dailyGoal}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-bold">
                          <span className="text-slate-450">Progress</span>
                          <span className="text-brand-600 dark:text-brand-400">{plan.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-550 transition-all duration-300" style={{ width: `${plan.progress}%` }} />
                        </div>
                      </div>

                      <div className="flex justify-between items-center gap-1.5">
                        <button
                          onClick={() => handleUpdatePlanProgress(plan._id, plan.progress, -10)}
                          disabled={plan.progress <= 0}
                          className="btn-secondary text-[9px] py-1 px-2.5 disabled:opacity-40"
                        >
                          -10%
                        </button>
                        <button
                          onClick={() => handleUpdatePlanProgress(plan._id, plan.progress, 10)}
                          disabled={plan.progress >= 100}
                          className="btn-primary text-[9px] py-1 px-2.5 disabled:opacity-40"
                        >
                          +10%
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
