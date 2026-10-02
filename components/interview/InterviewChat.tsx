"use client";

import React, { useState, useRef } from "react";
import { toast } from "sonner";
import { Mic, MicOff, Loader2, Send, ChevronRight, Award, BarChart2, CheckCircle, AlertCircle, Sparkles, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Question {
  question: string;
  type: string;
  difficulty: string;
  hints: string[];
  expectedKeyPoints: string[];
}

interface Evaluation {
  overallScore: number;
  confidence: number;
  clarity: number;
  relevance: number;
  grammar: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  sampleAnswer: string;
}

interface SessionItem {
  question: Question;
  answer: string;
  evaluation: Evaluation;
}

type Stage = "setup" | "question" | "answering" | "evaluating" | "result" | "session-end";

interface InterviewChatProps {
  defaultRole?: string;
}

const QUESTION_TYPES = ["technical", "behavioral", "system design", "situational"];
const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"];

export default function InterviewChat({ defaultRole }: InterviewChatProps) {
  const [stage, setStage] = useState<Stage>("setup");
  const [role, setRole] = useState(defaultRole || "");
  const [difficulty, setDifficulty] = useState("Medium");
  const [qType, setQType] = useState("technical");
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [sessionItems, setSessionItems] = useState<SessionItem[]>([]);
  const [showHints, setShowHints] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const generateQuestion = async () => {
    if (!role.trim()) { toast.error("Please enter your target role"); return; }
    setLoading(true);
    setStage("question");
    setAnswer("");
    setEvaluation(null);
    setShowHints(false);

    try {
      const res = await fetch("/api/interview/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, difficulty, type: qType }),
      });
      if (!res.ok) throw new Error("Failed to generate question");
      const q = await res.json();
      setCurrentQuestion(q);
      setStage("answering");
    } catch (err: any) {
      toast.error("Failed to generate question", { description: err.message });
      setStage("setup");
    } finally {
      setLoading(false);
    }
  };

  const evaluateAnswer = async () => {
    if (!answer.trim() || !currentQuestion) { toast.error("Please type or speak your answer"); return; }
    setLoading(true);
    setStage("evaluating");

    try {
      const res = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: currentQuestion.question, answer, role }),
      });
      if (!res.ok) throw new Error("Failed to evaluate answer");
      const ev = await res.json();
      setEvaluation(ev);
      setSessionItems(prev => [...prev, { question: currentQuestion, answer, evaluation: ev }]);
      setStage("result");
    } catch (err: any) {
      toast.error("Failed to evaluate", { description: err.message });
      setStage("answering");
    } finally {
      setLoading(false);
    }
  };

  const saveInterviewSession = async () => {
    if (sessionItems.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/interview/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          questions: sessionItems.map(item => item.question.question),
          answers: sessionItems.map(item => item.answer),
          scores: sessionItems.map(item => ({
            score: item.evaluation.overallScore,
            feedback: item.evaluation.feedback,
            confidence: item.evaluation.confidence,
            clarity: item.evaluation.clarity,
            relevance: item.evaluation.relevance,
            grammar: item.evaluation.grammar,
          })),
        }),
      });
      if (!res.ok) throw new Error("Failed to save session");
      toast.success("Interview session saved successfully!");
      setStage("session-end");
    } catch (err: any) {
      toast.error("Failed to save session", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const toggleRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.error("Speech recognition not supported in this browser"); return; }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.onresult = (event: any) => {
        let final = "";
        let interim = "";

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0].transcript;
          if (result.isFinal) {
            final += (final ? " " : "") + text;
          } else {
            interim += text;
          }
        }
        setAnswer(final + (interim ? ` ${interim}` : ""));
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);
      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
      toast.success("Recording started", { description: "Speak your answer clearly" });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-amber-400";
    return "text-rose-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-rose-500";
  };

  const avgScore = sessionItems.length > 0
    ? Math.round(sessionItems.reduce((s, i) => s + i.evaluation.overallScore, 0) / sessionItems.length)
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main Panel */}
      <div className="lg:col-span-3 space-y-4">
        {/* Setup Stage */}
        {stage === "setup" && (
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8 sm:p-10 text-center shadow-[0_8px_32px_rgba(139,92,246,0.12)]">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center mx-auto mb-5 shadow-[0_0_30px_rgba(139,92,246,0.4)]">
              <Award className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-300 mb-2">
              Configure Your Practice Session
            </h2>
            <p className="text-gray-400 text-sm mb-8 max-w-md mx-auto leading-relaxed">
              Practice with tailored AI queries, receive instant scoring across 4 dimensions, and master your delivery.
            </p>

            <div className="max-w-md mx-auto space-y-5 text-left">
              <div>
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 block">
                  Target Role
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  placeholder="e.g. Full Stack Engineer, Product Manager"
                  className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 shadow-[0_0_15px_rgba(139,92,246,0.1)] transition-all placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 block">
                  Question Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {QUESTION_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => setQType(type)}
                      className={`px-3 py-2.5 text-xs font-semibold rounded-xl border capitalize transition-all ${
                        qType === type
                          ? "bg-purple-600/20 text-purple-300 border-purple-500/50 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
                          : "bg-white/5 text-gray-400 border-white/10 hover:border-purple-500/30 hover:text-white"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 block">
                  Difficulty Level
                </label>
                <div className="flex gap-2">
                  {DIFFICULTY_LEVELS.map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => setDifficulty(lvl)}
                      className={`flex-1 py-2.5 text-xs font-bold rounded-xl border transition-all ${
                        difficulty === lvl
                          ? "bg-purple-600/20 text-purple-300 border-purple-500/50 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
                          : "bg-white/5 text-gray-400 border-white/10 hover:border-purple-500/30 hover:text-white"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={generateQuestion}
                disabled={!role.trim() || loading}
                variant="gradient"
                className="w-full py-3.5 text-sm font-bold shadow-[0_0_25px_rgba(139,92,246,0.4)] hover:shadow-[0_0_35px_rgba(139,92,246,0.6)]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
                Start Interview Session
              </Button>
            </div>
          </div>
        )}

        {/* Question + Answer Stage */}
        {(stage === "answering" || stage === "evaluating") && currentQuestion && (
          <div className="space-y-4">
            {/* Question Card */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(139,92,246,0.1)]">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 rounded-lg capitalize">
                  {currentQuestion.type}
                </span>
                <span className={`px-3 py-1 text-xs font-bold rounded-lg border ${
                  currentQuestion.difficulty === "Hard" ? "bg-rose-500/15 text-rose-400 border-rose-500/30" :
                  currentQuestion.difficulty === "Medium" ? "bg-amber-500/15 text-amber-400 border-amber-500/30" :
                  "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                }`}>
                  {currentQuestion.difficulty}
                </span>
                <span className="text-xs text-gray-400 ml-auto font-mono">Question {sessionItems.length + 1}</span>
              </div>
              <h3 className="text-lg font-bold text-white leading-relaxed mb-4">
                {currentQuestion.question}
              </h3>
              <button
                onClick={() => setShowHints(!showHints)}
                className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-semibold transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                {showHints ? "Hide Hints" : "Show Hints & Expected Points"}
              </button>
              {showHints && (
                <div className="mt-3 p-4 bg-white/5 border border-white/10 rounded-xl space-y-1.5">
                  {currentQuestion.hints.map((hint, i) => (
                    <p key={i} className="text-xs text-gray-300 leading-relaxed">• {hint}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Answer Input */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(139,92,246,0.1)]">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-white">Your Answer</label>
                <button
                  onClick={toggleRecording}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    isRecording
                      ? "bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                      : "bg-white/5 text-gray-300 border-white/10 hover:border-purple-500/40 hover:text-white"
                  }`}
                >
                  {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  {isRecording ? "Stop Recording" : "Record Voice Answer"}
                </button>
              </div>
              <textarea
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Type your response clearly or record via microphone above..."
                rows={6}
                className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 shadow-[0_0_15px_rgba(139,92,246,0.1)] transition-all resize-none placeholder:text-gray-500"
                disabled={stage === "evaluating"}
              />
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-gray-400 font-mono">{answer.length} characters</span>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStage("setup")} disabled={loading} className="border-white/10 text-gray-300 hover:text-white hover:bg-white/5">
                    Back
                  </Button>
                  <Button
                    variant="gradient"
                    onClick={evaluateAnswer}
                    disabled={!answer.trim() || loading}
                    className="shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                  >
                    {stage === "evaluating" ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Send className="w-4 h-4 mr-1.5" />}
                    {stage === "evaluating" ? "Evaluating..." : "Submit Answer"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Result Stage */}
        {stage === "result" && evaluation && currentQuestion && (
          <div className="space-y-4">
            {/* Score Overview */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(139,92,246,0.15)]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-white text-lg">Evaluation Breakdown</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Real-time performance metrics on your delivery</p>
                </div>
                <div className={`text-4xl font-extrabold ${getScoreColor(evaluation.overallScore)} drop-shadow-[0_0_15px_rgba(139,92,246,0.4)]`}>
                  {evaluation.overallScore}
                  <span className="text-sm text-gray-400 font-normal">/100</span>
                </div>
              </div>

              {/* Score Bars */}
              <div className="space-y-3.5 mb-6">
                {[
                  { label: "Confidence", value: evaluation.confidence },
                  { label: "Clarity", value: evaluation.clarity },
                  { label: "Relevance", value: evaluation.relevance },
                  { label: "Grammar", value: evaluation.grammar },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-300 font-medium">{label}</span>
                      <span className={`font-bold ${getScoreColor(value)}`}>{value}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div className={`h-full rounded-full transition-all duration-700 ${getScoreBg(value)}`} style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-sm text-gray-300 bg-white/5 border border-white/10 rounded-xl p-4 leading-relaxed">
                {evaluation.feedback}
              </div>
            </div>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-emerald-500/[0.04] border border-emerald-500/20 backdrop-blur-md rounded-2xl p-5 shadow-[0_4px_20px_rgba(16,185,129,0.08)]">
                <h4 className="font-bold text-emerald-400 text-sm mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Strengths
                </h4>
                <ul className="space-y-2">
                  {(evaluation.strengths || []).map((s, i) => (
                    <li key={i} className="text-xs text-gray-300 flex gap-2 leading-relaxed">
                      <span className="text-emerald-400 font-bold">✓</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-amber-500/[0.04] border border-amber-500/20 backdrop-blur-md rounded-2xl p-5 shadow-[0_4px_20px_rgba(245,158,11,0.08)]">
                <h4 className="font-bold text-amber-400 text-sm mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Improvements
                </h4>
                <ul className="space-y-2">
                  {(evaluation.improvements || []).map((s, i) => (
                    <li key={i} className="text-xs text-gray-300 flex gap-2 leading-relaxed">
                      <span className="text-amber-400 font-bold">→</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Sample Answer */}
            {evaluation.sampleAnswer && (
              <div className="bg-purple-500/[0.05] border border-purple-500/20 backdrop-blur-md rounded-2xl p-5 shadow-[0_4px_20px_rgba(139,92,246,0.1)]">
                <h4 className="font-bold text-purple-300 text-sm mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" /> Model Exemplar Answer:
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed">{evaluation.sampleAnswer}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button variant="outline" className="flex-1 border-white/10 text-gray-300 hover:text-white hover:bg-white/5" onClick={() => { setStage("setup"); setAnswer(""); }}>
                Change Role / Settings
              </Button>
              <Button variant="outline" className="flex-1 border-purple-500/40 text-purple-300 hover:bg-purple-500/10" onClick={saveInterviewSession} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                Finish & Save Session
              </Button>
              <Button variant="gradient" className="flex-1 shadow-[0_0_20px_rgba(139,92,246,0.4)]" onClick={generateQuestion}>
                Next Question →
              </Button>
            </div>
          </div>
        )}

        {/* Session End Stage */}
        {stage === "session-end" && (
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8 sm:p-10 text-center space-y-6 shadow-[0_8px_32px_rgba(139,92,246,0.15)]">
            <div className="w-20 h-20 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-300">
                Interview Session Completed!
              </h2>
              <p className="text-gray-400 max-w-md mx-auto text-sm leading-relaxed">
                Great job completing your mock interview for the <span className="text-white font-bold">{role}</span> role. Results have been recorded in your performance history.
              </p>
            </div>
            <div className="max-w-xs mx-auto p-4 bg-white/5 border border-white/10 rounded-xl grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-extrabold text-white">{sessionItems.length}</p>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Questions</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-emerald-400">{avgScore}%</p>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Avg Score</p>
              </div>
            </div>
            <div className="flex gap-3 justify-center max-w-sm mx-auto">
              <Button variant="gradient" className="w-full shadow-[0_0_25px_rgba(139,92,246,0.4)]" onClick={() => { setStage("setup"); setSessionItems([]); setAnswer(""); }}>
                Start New Practice
              </Button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {stage === "question" && (
          <div className="flex flex-col items-center justify-center py-20 bg-white/[0.02] border border-white/10 rounded-2xl">
            <Loader2 className="w-10 h-10 text-purple-400 animate-spin mb-4" />
            <p className="text-gray-300 font-medium text-sm">Crafting adaptive question for {role}...</p>
          </div>
        )}
      </div>

      {/* Session Sidebar */}
      <div className="space-y-4">
        {/* Session Stats */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-[0_8px_32px_rgba(139,92,246,0.1)]">
          <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-purple-400" /> Session Stats
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-xs pb-2 border-b border-white/5">
              <span className="text-gray-400">Questions Done</span>
              <span className="font-bold text-white">{sessionItems.length}</span>
            </div>
            <div className="flex justify-between text-xs pb-2 border-b border-white/5">
              <span className="text-gray-400">Avg Score</span>
              <span className={`font-bold ${getScoreColor(avgScore)}`}>{avgScore ? `${avgScore}%` : "—"}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Role</span>
              <span className="font-bold text-white truncate ml-2">{role || "—"}</span>
            </div>
          </div>
        </div>

        {/* History */}
        {sessionItems.length > 0 && (
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-[0_8px_32px_rgba(139,92,246,0.1)]">
            <h3 className="font-bold text-white text-sm mb-3">Completed Questions</h3>
            <div className="space-y-2">
              {sessionItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 p-2.5 bg-white/5 border border-white/5 rounded-xl">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 ${getScoreBg(item.evaluation.overallScore)}`}>
                    {item.evaluation.overallScore}
                  </div>
                  <p className="text-[11px] text-gray-300 line-clamp-2 flex-1">
                    {item.question.question}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
