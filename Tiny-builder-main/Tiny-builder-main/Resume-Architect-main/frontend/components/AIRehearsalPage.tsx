import React, { useState, useEffect } from 'react';
import {
  Bot, Sparkles, MessageSquareQuote, CheckCircle2, AlertCircle, HelpCircle,
  ChevronDown, ChevronUp, Send, Loader2, Award, Target, RefreshCw, ThumbsUp,
  ShieldCheck, Terminal, UserCheck, Play, ArrowRight, Eye, EyeOff
} from 'lucide-react';
import { ResumeData, InterviewQuestion, AnswerFeedback } from '../types';
import { fetchMockInterviewQuestions, submitPracticeAnswer } from '../services/aiService';
import { isResumeEmpty } from '../services/resumeAnalyzer';

interface AIRehearsalPageProps {
  resumeData: ResumeData;
  onNavigateToBuilder?: () => void;
}

const AIRehearsalPage: React.FC<AIRehearsalPageProps> = ({
  resumeData,
  onNavigateToBuilder,
}) => {
  const [targetRole, setTargetRole] = useState(resumeData.targetRole || 'Software Engineer');
  const [difficulty, setDifficulty] = useState<'entry' | 'mid' | 'senior'>('mid');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  const [feedbacks, setFeedbacks] = useState<Record<string, AnswerFeedback>>({});
  const [expandedAnswerBox, setExpandedAnswerBox] = useState<Record<string, boolean>>({});
  const [revealedModelAnswers, setRevealedModelAnswers] = useState<Record<string, boolean>>({});

  const isEmpty = isResumeEmpty(resumeData);

  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      const qList = await fetchMockInterviewQuestions(
        resumeData,
        targetRole,
        'mixed',
        difficulty
      );
      setQuestions(qList);
      // Auto-open first question's answer box
      if (qList.length > 0) {
        setExpandedAnswerBox({ [qList[0].id]: true });
      }
    } catch (err) {
      console.error('[AIRehearsal] Failed to load questions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [resumeData.fullName, resumeData.targetRole, difficulty]);

  const handleEvaluate = async (question: InterviewQuestion) => {
    const answer = userAnswers[question.id];
    if (!answer || !answer.trim()) return;

    setEvaluatingId(question.id);
    try {
      const fb = await submitPracticeAnswer(
        question.question,
        answer.trim(),
        question.context,
        targetRole
      );
      setFeedbacks((prev) => ({ ...prev, [question.id]: fb }));
    } catch (err) {
      console.error('[AIRehearsal] Evaluation failed:', err);
    } finally {
      setEvaluatingId(null);
    }
  };

  const filteredQuestions = activeCategory === 'all'
    ? questions
    : questions.filter((q) => q.category === activeCategory);

  const categoryBadgeColor = (cat: string) => {
    switch (cat) {
      case 'Project Deep Dive':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Technical Verification':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Behavioral (STAR)':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Resume Probe':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const verdictBadge = (verdict: AnswerFeedback['verdict']) => {
    if (verdict === 'Strong Hire') return 'bg-emerald-500 text-white';
    if (verdict === 'Hire') return 'bg-blue-500 text-white';
    if (verdict === 'Needs Practice') return 'bg-amber-500 text-white';
    return 'bg-rose-500 text-white';
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Hero Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-xs font-bold uppercase tracking-wider">
                <Bot size={14} className="text-blue-400" />
                AI Interview Rehearsal
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Mock Interview Simulation
              </h1>
              <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
                Gemini acts as an expert engineering hiring manager, probing the real projects, claims, and skills on your resume. Practice answering and receive instant hiring feedback.
              </p>
            </div>

            {/* Candidate Summary Card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl shrink-0 min-w-[240px] space-y-2">
              <div className="text-xs font-semibold text-blue-200 uppercase tracking-wider">Candidate Profile</div>
              <div className="font-bold text-base text-white truncate">
                {resumeData.fullName || 'Draft Candidate'}
              </div>
              <div className="text-xs text-slate-300 flex items-center gap-1.5">
                <Target size={13} className="text-blue-400" />
                <span>{targetRole}</span>
              </div>
              <div className="pt-2 border-t border-white/10 flex justify-between text-[11px] text-slate-300">
                <span>{(resumeData.skills || []).length} Skills Loaded</span>
                <span>{(resumeData.projects || []).length} Projects</span>
              </div>
            </div>
          </div>
        </div>

        {/* Empty Resume Notice */}
        {isEmpty && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-800">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-600 shrink-0" />
              <span>
                Your resume is currently empty. Baseline role questions are displayed. Upload or generate a resume for questions targeted to your specific projects and skills.
              </span>
            </div>
            {onNavigateToBuilder && (
              <button
                onClick={onNavigateToBuilder}
                className="px-3 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg font-bold transition-colors shrink-0 cursor-pointer"
              >
                Go to Builder
              </button>
            )}
          </div>
        )}

        {/* Controls Toolbar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            
            {/* Target Role Input */}
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                Interview Role:
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
              />
            </div>

            {/* Difficulty Toggle */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-1">Difficulty:</span>
              {(['entry', 'mid', 'senior'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setDifficulty(lvl)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                    difficulty === lvl
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* Regenerate Button */}
            <button
              onClick={loadQuestions}
              disabled={isLoading}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              {isLoading ? 'Generating Questions…' : 'Generate New Questions'}
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
            {[
              { id: 'all', label: 'All Questions' },
              { id: 'Project Deep Dive', label: '🚀 Project Deep Dives' },
              { id: 'Technical Verification', label: '⚡ Technical Verification' },
              { id: 'Behavioral (STAR)', label: '🤝 Behavioral (STAR)' },
              { id: 'Resume Probe', label: '🔍 Resume Probes' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Questions List */}
        {isLoading ? (
          <div className="p-12 text-center space-y-4 bg-white rounded-3xl border border-slate-200 shadow-xs">
            <Loader2 size={36} className="animate-spin text-blue-600 mx-auto" />
            <h3 className="font-bold text-base text-slate-800">Gemini is analyzing your resume…</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Drafting high-probability interview questions that test your specific projects, claimed technologies, and architectural decisions.
            </p>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
            <Bot size={32} className="text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No questions found in this category.</p>
            <button
              onClick={() => setActiveCategory('all')}
              className="mt-3 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Show All Questions
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredQuestions.map((q, idx) => {
              const isAnswerBoxOpen = !!expandedAnswerBox[q.id];
              const fb = feedbacks[q.id];
              const isEvaluating = evaluatingId === q.id;
              const isModelAnswerShown = !!revealedModelAnswers[q.id];

              return (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-slate-300"
                >
                  {/* Question Header */}
                  <div className="p-5 sm:p-6 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                          {idx + 1}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${categoryBadgeColor(q.category)}`}>
                          {q.category}
                        </span>
                        {q.difficulty && (
                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                            {q.difficulty}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 italic">
                        {q.context}
                      </span>
                    </div>

                    {/* Question Headline */}
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
                      "{q.question}"
                    </h3>

                    {/* Interviewer Intent Box */}
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-600 flex items-start gap-2">
                      <HelpCircle size={15} className="text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-800">Why they ask this:</strong> {q.interviewerIntent}
                      </div>
                    </div>

                    {/* Suggested Talking Points */}
                    {q.suggestedTalkingPoints && q.suggestedTalkingPoints.length > 0 && (
                      <div className="pt-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                          Key points you should cover:
                        </span>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {q.suggestedTalkingPoints.map((point, pIdx) => (
                            <li key={pIdx} className="text-xs text-slate-700 flex items-start gap-1.5">
                              <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Interactive Practice Accordion */}
                  <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedAnswerBox((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
                        }
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                      >
                        {isAnswerBoxOpen ? (
                          <>
                            <ChevronUp size={14} /> Hide Answer Practice
                          </>
                        ) : (
                          <>
                            <ChevronDown size={14} /> Practice Answering This Question
                          </>
                        )}
                      </button>

                      {q.sampleGoodAnswer && (
                        <button
                          type="button"
                          onClick={() =>
                            setRevealedModelAnswers((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
                          }
                          className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                        >
                          {isModelAnswerShown ? (
                            <>
                              <EyeOff size={13} /> Hide Model Answer
                            </>
                          ) : (
                            <>
                              <Eye size={13} /> View Model Answer
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Model Answer Preview */}
                    {isModelAnswerShown && q.sampleGoodAnswer && (
                      <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1.5 text-xs text-slate-800 animate-in fade-in duration-200">
                        <div className="font-bold text-emerald-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                          <Award size={14} className="text-emerald-600" /> Model Benchmark Answer
                        </div>
                        <p className="leading-relaxed text-slate-700 italic">
                          "{q.sampleGoodAnswer}"
                        </p>
                      </div>
                    )}

                    {/* Answer Input Drawer */}
                    {isAnswerBoxOpen && (
                      <div className="space-y-3 pt-2">
                        <textarea
                          rows={4}
                          value={userAnswers[q.id] || ''}
                          onChange={(e) =>
                            setUserAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                          }
                          placeholder="Type how you would respond to the interviewer (use STAR: Situation, Task, Action, Result)..."
                          className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all leading-relaxed"
                        />

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleEvaluate(q)}
                            disabled={isEvaluating || !(userAnswers[q.id] || '').trim()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            {isEvaluating ? (
                              <>
                                <Loader2 size={13} className="animate-spin" /> Evaluating Answer…
                              </>
                            ) : (
                              <>
                                <Send size={13} /> Get AI Feedback
                              </>
                            )}
                          </button>
                        </div>

                        {/* AI Feedback Display */}
                        {fb && (
                          <div className="mt-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4 animate-in fade-in duration-300">
                            {/* Score & Verdict */}
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                              <div className="flex items-center gap-3">
                                <div className="text-2xl font-extrabold text-slate-900">
                                  {fb.score}<span className="text-sm font-semibold text-slate-400">/100</span>
                                </div>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider ${verdictBadge(fb.verdict)}`}>
                                  {fb.verdict}
                                </span>
                              </div>
                              <span className="text-xs font-semibold text-slate-500">Gemini Interview Evaluation</span>
                            </div>

                            {/* Strengths & Improvements Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                              <div className="space-y-1.5 bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100">
                                <h4 className="font-bold text-emerald-900 uppercase tracking-wide text-[10px] flex items-center gap-1">
                                  <ThumbsUp size={12} /> Key Strengths
                                </h4>
                                <ul className="space-y-1 text-slate-700">
                                  {fb.strengths.map((s, sIdx) => (
                                    <li key={sIdx} className="flex items-start gap-1.5">
                                      <CheckCircle2 size={12} className="text-emerald-600 shrink-0 mt-0.5" />
                                      <span>{s}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div className="space-y-1.5 bg-amber-50/60 p-3.5 rounded-xl border border-amber-100">
                                <h4 className="font-bold text-amber-900 uppercase tracking-wide text-[10px] flex items-center gap-1">
                                  <AlertCircle size={12} /> How to Improve
                                </h4>
                                <ul className="space-y-1 text-slate-700">
                                  {fb.improvements.map((imp, iIdx) => (
                                    <li key={iIdx} className="flex items-start gap-1.5">
                                      <ArrowRight size={12} className="text-amber-600 shrink-0 mt-0.5" />
                                      <span>{imp}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {/* Ideal Model Answer */}
                            {fb.modelAnswer && (
                              <div className="pt-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                  Exemplary Answer Structure:
                                </span>
                                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100 italic">
                                  "{fb.modelAnswer}"
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIRehearsalPage;
