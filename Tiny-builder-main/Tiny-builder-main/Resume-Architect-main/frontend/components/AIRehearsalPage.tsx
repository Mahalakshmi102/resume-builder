import React, { useState, useEffect } from 'react';
import {
  MessageSquareCode,
  Sparkles,
  Target,
  Brain,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Loader2,
  Send,
  HelpCircle,
  ShieldCheck,
  Award,
  ChevronDown,
  ChevronUp,
  Flame,
  Layers,
  BookOpen,
  Mic,
  Copy,
  Check,
  XCircle
} from 'lucide-react';
import { ResumeData, InterviewQuestion, RehearsalSession, InterviewAnswerFeedback } from '../types';
import { generateInterviewQuestions, evaluateCandidateAnswer } from '../services/aiService';
import { isResumeEmpty } from '../services/resumeAnalyzer';

interface AIRehearsalPageProps {
  resumeData: ResumeData;
  onNavigateToBuilder?: () => void;
}

const AIRehearsalPage: React.FC<AIRehearsalPageProps> = ({
  resumeData,
  onNavigateToBuilder,
}) => {
  const [interviewStyle, setInterviewStyle] = useState<'Technical Screener' | 'Hiring Manager' | 'System Architect'>('Technical Screener');
  const [targetRole, setTargetRole] = useState(resumeData.targetRole || 'Software Engineer');
  const [session, setSession] = useState<RehearsalSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'session' | 'all'>('session');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Answer & Evaluation states keyed by question id
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [evaluatingMap, setEvaluatingMap] = useState<Record<string, boolean>>({});
  const [evaluations, setEvaluations] = useState<Record<string, InterviewQuestion['aiFeedback']>>({});
  const [expandedIntent, setExpandedIntent] = useState<Record<string, boolean>>({});
  const [expandedOutline, setExpandedOutline] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isEmpty = isResumeEmpty(resumeData);

  // Generate questions on initial mount or when role changes
  const handleGenerateQuestions = async () => {
    setIsLoading(true);
    try {
      const res = await generateInterviewQuestions(
        resumeData,
        targetRole.trim() || resumeData.targetRole || 'Software Engineer',
        interviewStyle
      );
      setSession(res);
      setActiveQuestionIndex(0);
    } catch (err) {
      console.error('[AIRehearsal] Failed to generate interview questions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!session && !isEmpty) {
      handleGenerateQuestions();
    }
  }, [resumeData]);

  const questions = session?.questions || [];
  const currentQuestion = questions[activeQuestionIndex];

  const handleEvaluateAnswer = async (q: InterviewQuestion) => {
    const answer = userAnswers[q.id];
    if (!answer || answer.trim().length < 5) return;

    setEvaluatingMap((prev) => ({ ...prev, [q.id]: true }));
    try {
      const feedback = await evaluateCandidateAnswer(
        q.question,
        q.interviewerIntent,
        answer,
        q.contextFromResume,
        q.modelAnswerOutline,
        q.category
      );
      setEvaluations((prev) => ({ ...prev, [q.id]: feedback }));
    } catch (err) {
      console.error('[AIRehearsal] Failed to evaluate answer:', err);
    } finally {
      setEvaluatingMap((prev) => ({ ...prev, [q.id]: false }));
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const categoryColor = (cat: string) => {
    switch (cat) {
      case 'Project Deep-Dive':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Technical Skills':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Challenging Scenario':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  const difficultyColor = (diff: string) => {
    switch (diff) {
      case 'Expert':
        return 'bg-rose-100 text-rose-800';
      case 'Challenging':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const evaluatedCount = Object.keys(evaluations).length;
  const avgScore = evaluatedCount > 0
    ? Math.round(Object.values(evaluations).reduce((acc, curr) => acc + (curr?.score || 0), 0) / evaluatedCount)
    : 0;

  if (isEmpty) {
    return (
      <div className="h-full overflow-y-auto bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-500/25">
            <Mic size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">AI Interview Rehearsal</h2>
            <p className="text-sm text-slate-500 mt-2">
              Gemini simulates a real technical interviewer scrutinizing your specific projects, skills, and claims.
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 text-left space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <Sparkles size={14} className="text-blue-600" />
              How it works:
            </div>
            <p>1. Upload or build your resume</p>
            <p>2. Gemini acts as an interviewer and generates custom questions</p>
            <p>3. Type or practice your answers to receive instant evaluation</p>
          </div>
          {onNavigateToBuilder && (
            <button
              onClick={onNavigateToBuilder}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer"
            >
              Open Builder to Add Resume
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Top Control Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-full shadow-xs flex items-center gap-1.5">
                <Sparkles size={12} className="text-yellow-300" /> AI Mock Interviewer
              </span>
              <span className="text-xs text-slate-400 font-semibold">• Powered by Gemini</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              AI Interview Rehearsal Mode
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Practicing with questions targeted specifically at your projects, tech stack, and experience before stepping into the real room.
            </p>
          </div>

          {/* Quick Config & Action */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Interview Style</label>
              <select
                value={interviewStyle}
                onChange={(e) => setInterviewStyle(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Technical Screener">Technical Screener</option>
                <option value="Hiring Manager">Hiring Manager</option>
                <option value="System Architect">System Architect</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Target Role</label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Frontend Engineer"
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 w-36 sm:w-44"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="text-[10px] font-bold uppercase tracking-wider text-transparent mb-1">Action</label>
              <button
                onClick={handleGenerateQuestions}
                disabled={isLoading}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                {isLoading ? 'Analyzing…' : 'Regenerate Questions'}
              </button>
            </div>
          </div>
        </div>

        {/* Rehearsal Metrics & Overall Tips */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <MessageSquareCode size={24} />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{questions.length}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Generated Questions</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{evaluatedCount} / {questions.length}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Practiced & Evaluated</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <Award size={24} />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">
                {avgScore > 0 ? `${avgScore}%` : '—'}
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Rehearsal Score</div>
            </div>
          </div>
        </div>

        {/* Strategic Tips Banner */}
        {session?.overallTips && session.overallTips.length > 0 && (
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-5 shadow-lg space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-200">
              <Lightbulb size={16} className="text-yellow-300" />
              Interviewer Panel Strategy for {session.targetRole}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {session.overallTips.map((tip, idx) => (
                <div key={idx} className="bg-white/10 p-3 rounded-xl backdrop-blur-xs text-xs text-blue-50 leading-relaxed border border-white/10">
                  <span className="font-bold text-blue-300 mr-1.5">0{idx + 1}.</span>
                  {tip}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View Mode Switcher */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('session')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'session'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Interactive Mock Session
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              View All Questions ({questions.length})
            </button>
          </div>

          {viewMode === 'session' && questions.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={activeQuestionIndex === 0}
                className="p-2 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 cursor-pointer"
                title="Previous Question"
              >
                <ArrowLeft size={16} />
              </button>
              <span className="text-xs font-bold text-slate-500">
                {activeQuestionIndex + 1} of {questions.length}
              </span>
              <button
                onClick={() => setActiveQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                disabled={activeQuestionIndex === questions.length - 1}
                className="p-2 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 cursor-pointer"
                title="Next Question"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Interactive Mode: Current Question Practice Card */}
        {viewMode === 'session' && currentQuestion && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            {/* Question Meta Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${categoryColor(currentQuestion.category)}`}>
                  {currentQuestion.category}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${difficultyColor(currentQuestion.difficulty)}`}>
                  {currentQuestion.difficulty}
                </span>
                <span className="text-xs text-slate-500 font-medium bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                  📌 {currentQuestion.contextFromResume}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-400">
                Question {activeQuestionIndex + 1}
              </div>
            </div>

            {/* Spoken Question */}
            <div>
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Mic size={14} /> Interviewer Asks:
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
                "{currentQuestion.question}"
              </h2>
            </div>

            {/* Accordions: Intent & STAR Outline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Interviewer Intent */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <button
                  type="button"
                  onClick={() => setExpandedIntent((p) => ({ ...p, [currentQuestion.id]: !p[currentQuestion.id] }))}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Target size={14} className="text-blue-600" />
                    What is the interviewer looking for?
                  </span>
                  {expandedIntent[currentQuestion.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expandedIntent[currentQuestion.id] && (
                  <p className="mt-2.5 text-xs text-slate-600 leading-relaxed font-medium">
                    {currentQuestion.interviewerIntent}
                  </p>
                )}
              </div>

              {/* STAR Model Answer Outline */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <button
                  type="button"
                  onClick={() => setExpandedOutline((p) => ({ ...p, [currentQuestion.id]: !p[currentQuestion.id] }))}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Lightbulb size={14} className="text-amber-500" />
                    Key talking points to include (STAR format)
                  </span>
                  {expandedOutline[currentQuestion.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expandedOutline[currentQuestion.id] && (
                  <ul className="mt-2.5 space-y-1.5 text-xs text-slate-600">
                    {currentQuestion.modelAnswerOutline.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Candidate Rehearsal Workspace */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Send size={14} className="text-blue-600" /> Your Spoken Answer / Talking Points
                </label>
                <span className="text-[11px] text-slate-400">
                  {(userAnswers[currentQuestion.id] || '').split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <textarea
                rows={4}
                value={userAnswers[currentQuestion.id] || ''}
                onChange={(e) => setUserAnswers((prev) => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                placeholder="Type or outline how you would answer this question in a real interview..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all resize-none leading-relaxed"
              />

              <div className="flex justify-end">
                <button
                  onClick={() => handleEvaluateAnswer(currentQuestion)}
                  disabled={evaluatingMap[currentQuestion.id] || !(userAnswers[currentQuestion.id] || '').trim()}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {evaluatingMap[currentQuestion.id] ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Evaluating with AI…
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} className="text-yellow-300" /> Evaluate My Answer
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* AI Evaluation Result Card */}
            {evaluations[currentQuestion.id] && (
              <div className="mt-6 p-6 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-4 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl text-white flex items-center justify-center font-black text-base shadow-sm ${
                      (evaluations[currentQuestion.id]?.score || 0) >= 80
                        ? 'bg-emerald-600'
                        : (evaluations[currentQuestion.id]?.score || 0) >= 60
                        ? 'bg-blue-600'
                        : 'bg-amber-600'
                    }`}>
                      {evaluations[currentQuestion.id]?.score}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-base text-slate-900">
                          {evaluations[currentQuestion.id]?.verdict}
                        </h4>
                        <span className="text-[11px] font-bold text-slate-400">/ 100</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">Instant AI Interviewer Feedback</p>
                    </div>
                  </div>

                  {/* Question Suitability Badge */}
                  {evaluations[currentQuestion.id]?.suitability && (
                    <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto ${
                      evaluations[currentQuestion.id]?.suitability === 'Direct & Accurate Match'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : evaluations[currentQuestion.id]?.suitability === 'Partially Suitable'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-rose-50 text-rose-800 border-rose-300'
                    }`}>
                      {evaluations[currentQuestion.id]?.suitability === 'Direct & Accurate Match' ? (
                        <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                      ) : evaluations[currentQuestion.id]?.suitability === 'Partially Suitable' ? (
                        <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                      ) : (
                        <XCircle size={15} className="text-rose-600 shrink-0" />
                      )}
                      <span>{evaluations[currentQuestion.id]?.suitability}</span>
                    </div>
                  )}
                </div>

                {/* Question Suitability Analysis */}
                {evaluations[currentQuestion.id]?.suitabilityAnalysis && (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1 shadow-xs">
                    <span className="font-bold flex items-center gap-1.5 uppercase text-[10px] tracking-wider text-slate-500">
                      <Target size={13} className="text-blue-600" /> Question Relevance & Directness:
                    </span>
                    <p className="leading-relaxed font-semibold text-slate-800">
                      {evaluations[currentQuestion.id]?.suitabilityAnalysis}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Strengths */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 uppercase tracking-wide">
                      <CheckCircle2 size={14} /> Strengths for this question
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {evaluations[currentQuestion.id]?.strengths.map((str, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Missing Points */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="text-xs font-bold text-amber-700 flex items-center gap-1.5 uppercase tracking-wide">
                      <AlertTriangle size={14} /> Missing key technical points
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {evaluations[currentQuestion.id]?.missingPoints.map((gap, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Recommended Response */}
                <div className="bg-white p-4 rounded-xl border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5 uppercase tracking-wide">
                      <Award size={14} className="text-blue-600" /> Exact Model Response Tailored to this Question
                    </div>
                    <button
                      onClick={() => handleCopy(evaluations[currentQuestion.id]?.recommendedResponse || '', currentQuestion.id)}
                      className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedId === currentQuestion.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      {copiedId === currentQuestion.id ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-sans font-medium bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {evaluations[currentQuestion.id]?.recommendedResponse}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* All Questions Mode */}
        {viewMode === 'all' && (
          <div className="space-y-4">
            {/* Filter buttons */}
            <div className="flex flex-wrap gap-2">
              {['All', 'Project Deep-Dive', 'Technical Skills', 'Behavioral & Experience', 'Challenging Scenario'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="space-y-4">
              {questions
                .filter((q) => selectedCategory === 'All' || q.category === selectedCategory)
                .map((q, idx) => (
                  <div key={q.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${categoryColor(q.category)}`}>
                          {q.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${difficultyColor(q.difficulty)}`}>
                          {q.difficulty}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          📌 {q.contextFromResume}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          const realIdx = questions.findIndex((item) => item.id === q.id);
                          if (realIdx !== -1) {
                            setActiveQuestionIndex(realIdx);
                            setViewMode('session');
                          }
                        }}
                        className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Practice This Question →
                      </button>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      "{q.question}"
                    </h3>

                    <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <strong>Interviewer Focus:</strong> {q.interviewerIntent}
                    </div>

                    {evaluations[q.id] && (
                      <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 size={14} /> Completed — Score: {evaluations[q.id]?.score}/100 ({evaluations[q.id]?.verdict})
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AIRehearsalPage;
