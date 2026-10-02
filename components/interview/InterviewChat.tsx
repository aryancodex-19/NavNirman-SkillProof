"use client";

import React, { useState, useRef } from "react";
import { toast } from "sonner";
import { Mic, MicOff, Loader2, Send, ChevronRight, Award, BarChart2, CheckCircle, AlertCircle } from "lucide-react";
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
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-danger";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-success";
    if (score >= 60) return "bg-warning";
    return "bg-danger";
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
          <div className="bg-card border border-border rounded-2xl p-8 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-5">
              <Award className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">AI Interview Coach</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Practice with AI-generated questions, get real-time feedback, and improve with every answer.
            </p>

            <div className="max-w-md mx-auto space-y-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block text-left">Target Role</label>
                <input
                  type="text"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  placeholder="e.g. Software Engineer, Product Manager"
                  className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block text-left">Question Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {QUESTION_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => setQType(type)}
                      className={`px-3 py-2 text-xs font-semibold rounded-xl border capitalize transition-all ${
                        qType === type ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:border-primary/30"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block text-left">Difficulty</label>
                <div className="flex gap-2">
                  {DIFFICULTY_LEVELS.map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => setDifficulty(lvl)}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                        difficulty === lvl ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:border-primary/30"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={generateQuestion}
                disabled={!role.trim()}
                variant="gradient"
                className="w-full py-3 text-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
                Start Interview
              </Button>
            </div>
          </div>
        )}

        {/* Question + Answer Stage */}
        {(stage === "answering" || stage === "evaluating") && currentQuestion && (
          <div className="space-y-4 animate-fade-in">
            {/* Question Card */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2.5 py-1 text-xs font-bold bg-primary/10 text-primary border border-primary/20 rounded-lg capitalize">
                  {currentQuestion.type}
                </span>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                  currentQuestion.difficulty === "Hard" ? "bg-danger/10 text-danger border-danger/20" :
                  currentQuestion.difficulty === "Medium" ? "bg-warning/10 text-warning border-warning/20" :
                  "bg-success/10 text-success border-success/20"
                }`}>
                  {currentQuestion.difficulty}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">Q{sessionItems.length + 1}</span>
              </div>
              <h3 className="text-lg font-bold text-foreground leading-relaxed mb-4">
                {currentQuestion.question}
              </h3>
              <button
                onClick={() => setShowHints(!showHints)}
                className="text-xs text-primary hover:underline font-semibold"
              >
                {showHints ? "Hide Hints" : "💡 Show Hints"}
              </button>
              {showHints && (
                <div className="mt-3 p-3 bg-muted rounded-xl space-y-1">
                  {currentQuestion.hints.map((hint, i) => (
                    <p key={i} className="text-xs text-muted-foreground">• {hint}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Answer Input */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-foreground">Your Answer</label>
                <button
                  onClick={toggleRecording}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    isRecording
                      ? "bg-danger/10 text-danger border-danger/30 animate-pulse"
                      : "bg-muted text-muted-foreground border-border hover:border-primary/30"
                  }`}
                >
                  {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  {isRecording ? "Stop Recording" : "Voice Answer"}
                </button>
              </div>
              <textarea
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Type your answer here or use voice recording above..."
                rows={6}
                className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                disabled={stage === "evaluating"}
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-muted-foreground">{answer.length} characters</span>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStage("setup")} disabled={loading}>
                    Back
                  </Button>
                  <Button
                    variant="gradient"
                    onClick={evaluateAnswer}
                    disabled={!answer.trim() || loading}
                  >
                    {stage === "evaluating" ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
                    {stage === "evaluating" ? "Evaluating..." : "Submit Answer"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Result Stage */}
        {stage === "result" && evaluation && currentQuestion && (
          <div className="space-y-4 animate-fade-in">
            {/* Score Overview */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-foreground text-lg">Evaluation Results</h3>
                <div className={`text-3xl font-extrabold ${getScoreColor(evaluation.overallScore)}`}>
                  {evaluation.overallScore}/100
                </div>
              </div>

              {/* Score Bars */}
              <div className="space-y-3 mb-6">
                {[
                  { label: "Confidence", value: evaluation.confidence },
                  { label: "Clarity", value: evaluation.clarity },
                  { label: "Relevance", value: evaluation.relevance },
                  { label: "Grammar", value: evaluation.grammar },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground font-medium">{label}</span>
                      <span className={`font-bold ${getScoreColor(value)}`}>{value}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${getScoreBg(value)}`} style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-sm text-muted-foreground bg-muted rounded-xl p-4 leading-relaxed">
                {evaluation.feedback}
              </p>
            </div>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-success/5 border border-success/20 rounded-2xl p-5">
                <h4 className="font-bold text-success text-sm mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Strengths
                </h4>
                <ul className="space-y-2">
                  {(evaluation.strengths || []).map((s, i) => (
                    <li key={i} className="text-xs text-foreground flex gap-2">
                      <span className="text-success mt-0.5">✓</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-warning/5 border border-warning/20 rounded-2xl p-5">
                <h4 className="font-bold text-warning text-sm mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Improvements
                </h4>
                <ul className="space-y-2">
                  {(evaluation.improvements || []).map((s, i) => (
                    <li key={i} className="text-xs text-foreground flex gap-2">
                      <span className="text-warning mt-0.5">→</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Sample Answer */}
            {evaluation.sampleAnswer && (
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
                <h4 className="font-bold text-primary text-sm mb-3">💡 Strong Answer Would Include:</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{evaluation.sampleAnswer}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setStage("setup"); setAnswer(""); }}>
                Change Settings
              </Button>
              <Button variant="outline" className="flex-1 border-primary text-primary hover:bg-primary/10" onClick={saveInterviewSession} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Finish & Save Session
              </Button>
              <Button variant="gradient" className="flex-1" onClick={generateQuestion}>
                Next Question →
              </Button>
            </div>
          </div>
        )}

        {/* Session End Stage */}
        {stage === "session-end" && (
          <div className="bg-card border border-border rounded-2xl p-8 text-center animate-fade-in space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-success/10 text-success flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Interview Session Completed!</h2>
              <p className="text-muted-foreground max-w-md mx-auto text-sm">
                Congratulations on completing your mock interview for the <span className="text-foreground font-bold">{role}</span> position. Your results have been saved to your profile history.
              </p>
            </div>
            <div className="max-w-xs mx-auto p-4 bg-muted rounded-xl grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-extrabold text-foreground">{sessionItems.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Questions</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-success">{avgScore}%</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Avg Score</p>
              </div>
            </div>
            <div className="flex gap-3 justify-center max-w-sm mx-auto">
              <Button variant="outline" className="flex-1" onClick={() => { setStage("setup"); setSessionItems([]); setAnswer(""); }}>
                Start New Practice
              </Button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {stage === "question" && (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground font-medium">Generating your question...</p>
          </div>
        )}
      </div>

      {/* Session Sidebar */}
      <div className="space-y-4">
        {/* Session Stats */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold text-foreground text-sm mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" /> Session Stats
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Questions Done</span>
              <span className="font-bold text-foreground">{sessionItems.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Avg Score</span>
              <span className={`font-bold ${getScoreColor(avgScore)}`}>{avgScore || "—"}{avgScore ? "%" : ""}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Role</span>
              <span className="font-bold text-foreground truncate ml-2">{role || "—"}</span>
            </div>
          </div>
        </div>

        {/* History */}
        {sessionItems.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-bold text-foreground text-sm mb-3">History</h3>
            <div className="space-y-2">
              {sessionItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded-xl">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 ${getScoreBg(item.evaluation.overallScore)}`}>
                    {item.evaluation.overallScore}
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-2 flex-1">
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
