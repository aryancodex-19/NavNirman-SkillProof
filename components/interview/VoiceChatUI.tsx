"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Mic,
  Square,
  Play,
  Trophy,
  TrendingUp,
  MessageSquare,
  Brain,
  Volume2,
  RotateCcw,
  Star,
  Target,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Timer,
  Send,
  User,
  Activity,
  Award
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Question {
  text: string;
  questionType: string;
  difficulty: number;
}

interface Evaluation {
  technicalScore: number;
  communicationScore: number;
  confidenceScore: number;
  overallScore: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  followUpQuestion: string;
  keyInsight: string;
}

interface FinalReport {
  overallScore: number;
  grade: string;
  summary: string;
  topStrengths: string[];
  topImprovements: string[];
  studyTopics: string[];
  readyForInterview: boolean;
  nextSteps: string;
  hiringRecommendation: string;
}

type InterviewPhase =
  | "idle"
  | "starting"
  | "questioning"
  | "listening"
  | "processing"
  | "evaluating"
  | "between"
  | "finalizing"
  | "complete";

interface ChatMessage {
  id: string;
  sender: "ai" | "user";
  text: string;
  timestamp: string;
}

const MAX_QUESTIONS = 6;

// ─── Custom Circular Progress Component ──────────────────────────────────────
function CircularProgress({
  score,
  label,
  colorClass,
}: {
  score: number;
  label: string;
  colorClass: string;
}) {
  const radius = 36;
  const stroke = 5;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center w-20 h-20">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            className="text-muted/20"
            strokeWidth={stroke}
            stroke="currentColor"
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <motion.circle
            className={colorClass}
            strokeWidth={stroke}
            strokeDasharray={circumference + " " + circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <span className="absolute text-sm font-black text-foreground">{score}%</span>
      </div>
      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

// ─── Animated Sound Wave Visualizer ──────────────────────────────────────────
function MicVisualizer({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-[4px] justify-center h-10 px-2">
      {[1.2, 2.5, 3.8, 4.2, 3.0, 2.2, 3.5, 4.5, 2.8, 1.5].map((h, i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full bg-primary"
          animate={
            active
              ? {
                  scaleY: [1, h * 0.4 + 0.3, 1, h * 0.6 + 0.2, 1],
                  opacity: [0.6, 1, 0.6, 1, 0.6],
                }
              : { scaleY: 0.15, opacity: 0.25 }
          }
          transition={
            active
              ? {
                  duration: 0.6 + i * 0.04,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.05,
                }
              : { duration: 0.3 }
          }
          style={{ height: `${24}px`, originY: 0.5 }}
        />
      ))}
    </div>
  );
}

// ─── Difficulty Badge Config ──────────────────────────────────────────────────
function DifficultyBadge({ level }: { level: number }) {
  const configs = [
    { label: "Warm-up", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
    { label: "Easy", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
    { label: "Medium", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
    { label: "Hard", color: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
    { label: "Expert", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  ];
  const c = configs[Math.min(level - 1, 4)];
  return (
    <Badge variant="outline" className={`text-[10px] font-bold py-0.5 px-2 rounded-full ${c.color}`}>
      {c.label}
    </Badge>
  );
}

// ─── Typing/Thinking Indicator ───────────────────────────────────────────────
function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/40 rounded-2xl w-fit">
      {[0, 0.2, 0.4].map((delay) => (
        <motion.div
          key={delay}
          className="w-2 h-2 bg-primary rounded-full"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay }}
        />
      ))}
    </div>
  );
}

export default function VoiceChatUI({
  targetRole = "Software Engineer",
  skills = "",
}: {
  targetRole?: string;
  skills?: string;
}) {
  // State
  const [phase, setPhase] = useState<InterviewPhase>("idle");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentEvaluation, setCurrentEvaluation] = useState<Evaluation | null>(null);
  const [transcript, setTranscript] = useState("");
  const [finalReport, setFinalReport] = useState<FinalReport | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [timer, setTimer] = useState(0);
  const [interviewTimer, setInterviewTimer] = useState(0);
  const [textMode, setTextMode] = useState(false);
  const [textInput, setTextInput] = useState("");

  // Refs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const interviewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptAccRef = useRef("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const questionNumber = questions.length + 1;
  const isLastQuestion = questionNumber >= MAX_QUESTIONS;

  // Timestamps helper
  const getFormattedTime = () => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Compile Unified Chat Messages
  const messages: ChatMessage[] = [];
  questions.forEach((q, idx) => {
    messages.push({
      id: `q-${idx}`,
      sender: "ai",
      text: q.text,
      timestamp: getFormattedTime(),
    });
    if (answers[idx]) {
      messages.push({
        id: `a-${idx}`,
        sender: "user",
        text: answers[idx],
        timestamp: getFormattedTime(),
      });
    }
  });

  if (currentQuestion && phase !== "starting") {
    const isAlreadyListed = questions.some((q) => q.text === currentQuestion.text);
    if (!isAlreadyListed) {
      messages.push({
        id: "q-current",
        sender: "ai",
        text: currentQuestion.text,
        timestamp: getFormattedTime(),
      });
    }
  }

  // Auto Scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, transcript, phase]);

  // Timer helpers
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer(0);
    timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (phase !== "idle" && phase !== "complete") {
      if (!interviewTimerRef.current) {
        interviewTimerRef.current = setInterval(() => setInterviewTimer((t) => t + 1), 1000);
      }
    } else {
      if (interviewTimerRef.current) {
        clearInterval(interviewTimerRef.current);
        interviewTimerRef.current = null;
      }
    }
    return () => {
      if (interviewTimerRef.current) {
        clearInterval(interviewTimerRef.current);
        interviewTimerRef.current = null;
      }
    };
  }, [phase]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ── Speech synthesis (AI speaks) ──────────────────────────────────────────
  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!window.speechSynthesis) {
      onEnd?.();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    utterance.volume = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) =>
        v.name.includes("Google UK English Male") ||
        v.name.includes("Daniel") ||
        v.name.includes("Alex") ||
        (v.lang === "en-US" && !v.name.includes("Microsoft"))
    );
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setAiSpeaking(true);
    utterance.onend = () => {
      setAiSpeaking(false);
      onEnd?.();
    };
    utterance.onerror = () => {
      setAiSpeaking(false);
      onEnd?.();
    };
    synthRef.current = window.speechSynthesis;
    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setAiSpeaking(false);
  };

  // ── Speech recognition (user speaks) ──────────────────────────────────────
  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported", {
        description: "Please use Chrome or Edge. You can also type your answer.",
      });
      setTextMode(true);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    transcriptAccRef.current = "";

    recognition.onresult = (event: any) => {
      let final = "";
      let interim = "";

      for (let i = 0; i < event.results.length; ++i) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          final += (final ? " " : "") + text;
        } else {
          interim += text;
        }
      }
      setTranscript(final + (interim ? ` ${interim}` : ""));
    };

    recognition.onerror = (event: any) => {
      const error = event.error;

      if (error === "aborted") {
        setIsListening(false);
        return;
      }

      if (error === "no-speech") {
        toast.info("No speech detected", {
          description: "We couldn't hear anything. Please speak clearly or type your answer.",
        });
        setIsListening(false);
        return;
      }

      if (error === "network") {
        toast.warning("Speech recognition unavailable", {
          description: "Google's speech recognition servers are unreachable on this network. Switching to text mode.",
          duration: 5000,
        });
        setTextMode(true);
        setIsListening(false);
        return;
      }

      if (error === "not-allowed" || error === "permission-denied") {
        toast.error("Microphone access denied", {
          description: "Please enable microphone permission in your browser settings, or use text mode.",
        });
        setTextMode(true);
        setIsListening(false);
        return;
      }

      if (error === "audio-capture") {
        toast.error("No microphone found", {
          description: "Please check your microphone connection, or use text mode.",
        });
        setTextMode(true);
        setIsListening(false);
        return;
      }

      console.error("Speech recognition error:", error);
      toast.error("Speech recognition error", {
        description: "An unexpected error occurred. Switching to text mode.",
      });
      setTextMode(true);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    startTimer();
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    stopTimer();
  }, []);

  // ── Core interview flow ────────────────────────────────────────────────────
  const fetchNextQuestion = useCallback(
    async (currQuestions: Question[], currAnswers: string[], prevEvaluation?: Evaluation) => {
      setPhase("questioning");
      setCurrentQuestion(null);
      setTranscript("");
      transcriptAccRef.current = "";

      try {
        const res = await fetch("/api/interview-voice/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetRole,
            skills,
            previousQuestions: currQuestions.map((q) => q.text),
            previousAnswers: currAnswers,
            questionNumber: currQuestions.length + 1,
            lastEvaluation: prevEvaluation,
          }),
        });

        if (!res.ok) throw new Error("Failed to generate question");
        const data = await res.json();

        const q: Question = {
          text: data.question,
          questionType: data.questionType,
          difficulty: data.difficulty,
        };

        setCurrentQuestion(q);

        const intro =
          currQuestions.length === 0
            ? `Hello! Welcome to your ${targetRole} interview. Let's start with our first question: ${q.text}`
            : `Great. Now for the next question: ${q.text}`;

        setPhase("questioning");
        speak(intro, () => {
          setPhase("listening");
          if (!textMode) startListening();
        });
      } catch (err: any) {
        toast.error("Failed to get question", { description: err.message });
        setPhase("idle");
      }
    },
    [targetRole, skills, speak, textMode, startListening]
  );

  const saveAndFinalize = useCallback(async (
    qs: Question[],
    as: string[],
    evs: Evaluation[]
  ) => {
    try {
      const res = await fetch("/api/interview-voice/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole,
          skills,
          questions: qs,
          answers: as,
          evaluations: evs,
          durationSecs: interviewTimer,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      setFinalReport(data.finalReport);
      setPhase("complete");

      speak(
        `Excellent! You've completed the interview. Your overall score is ${data.finalReport?.overallScore} out of 100.`
      );
    } catch (err: any) {
      toast.error("Failed to save interview", { description: err.message });
      setPhase("complete");
    }
  }, [targetRole, skills, interviewTimer, speak]);

  const submitAnswer = useCallback(async () => {
    const answerText = textMode ? textInput.trim() : transcript.trim();
    if (!answerText || answerText.length < 5) {
      toast.error("Please provide an answer before submitting");
      return;
    }
    if (!currentQuestion) return;

    stopListening();
    stopSpeaking();
    setPhase("evaluating");

    try {
      const res = await fetch("/api/interview-voice/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQuestion.text,
          answer: answerText,
          questionNumber: questions.length + 1,
          targetRole,
          skills,
          questionType: currentQuestion.questionType,
          difficulty: currentQuestion.difficulty,
          isLastQuestion,
        }),
      });

      if (!res.ok) throw new Error("Failed to evaluate");
      const evaluation: Evaluation = await res.json();

      const newQuestions = [...questions, currentQuestion];
      const newAnswers = [...answers, answerText];
      const newEvaluations = [...evaluations, evaluation];

      setQuestions(newQuestions);
      setAnswers(newAnswers);
      setEvaluations(newEvaluations);
      setCurrentEvaluation(evaluation);
      setTextInput("");

      if (isLastQuestion || newQuestions.length >= MAX_QUESTIONS) {
        setPhase("finalizing");
        await saveAndFinalize(newQuestions, newAnswers, newEvaluations);
      } else {
        setPhase("between");
        const feedbackSpeech = `${evaluation.feedback} Let's move to the next question.`;
        speak(feedbackSpeech, () => {
          setTimeout(() => fetchNextQuestion(newQuestions, newAnswers, evaluation), 1000);
        });
      }
    } catch (err: any) {
      toast.error("Evaluation failed", { description: err.message });
      setPhase("listening");
    }
  }, [
    textMode,
    textInput,
    transcript,
    currentQuestion,
    questions,
    answers,
    evaluations,
    isLastQuestion,
    targetRole,
    skills,
    speak,
    stopListening,
    fetchNextQuestion,
    saveAndFinalize,
  ]);

  const startInterview = async () => {
    setPhase("starting");
    setQuestions([]);
    setAnswers([]);
    setEvaluations([]);
    setCurrentQuestion(null);
    setCurrentEvaluation(null);
    setFinalReport(null);
    setTranscript("");
    setInterviewTimer(0);
    transcriptAccRef.current = "";

    const hasSpeechAPI =
      !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
    if (!hasSpeechAPI) setTextMode(true);

    await fetchNextQuestion([], []);
  };

  const resetInterview = () => {
    stopListening();
    stopSpeaking();
    setPhase("idle");
    setQuestions([]);
    setAnswers([]);
    setEvaluations([]);
    setCurrentQuestion(null);
    setCurrentEvaluation(null);
    setFinalReport(null);
    setTranscript("");
    setTimer(0);
    setInterviewTimer(0);
    transcriptAccRef.current = "";
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
      stopSpeaking();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stopListening]);

  // Color Coding for circular score
  const getCircleColorClass = (score: number) => {
    if (score >= 75) return "text-emerald-500";
    if (score >= 50) return "text-amber-500";
    return "text-rose-500";
  };

  // ── Render: Idle screen ────────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-2xl mx-auto"
      >
        <Card className="relative overflow-hidden bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-8 sm:p-10 text-center shadow-xl">
          {/* Decorative Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 border border-primary/20 rounded-2xl mx-auto shadow-inner">
              <Mic className="w-10 h-10 text-primary animate-pulse" />
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
                AI Voice Mock Interview
              </h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
                Step into a real interview simulation powered by Groq Llama 3.3. Practice answering adaptive, AI-generated questions either with your voice or via text, and receive expert analysis of your performance.
              </p>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto text-left">
              {[
                { icon: Brain, title: "Llama 3.3 70B", desc: "Adaptive & smart" },
                { icon: Activity, title: "Real-time Metrics", desc: "Instantly assessed" },
                { icon: Volume2, title: "Dual Inputs", desc: "Voice or text-based" },
                { icon: Award, title: "Comprehensive", desc: "Full reports & grading" },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="flex gap-2.5 p-3 rounded-xl bg-muted/40 border border-border/30 hover:border-primary/20 transition-all"
                >
                  <Icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{title}</h4>
                    <p className="text-[10px] text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Profile context summary */}
            <div className="bg-muted/40 border border-border/30 rounded-xl p-4 text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                  Target Role
                </span>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                  Adaptive
                </span>
              </div>
              <p className="text-sm font-bold text-foreground">{targetRole}</p>
              {skills && (
                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/20">
                  {skills.split(",").slice(0, 4).map((s) => (
                    <Badge
                      key={s}
                      variant="secondary"
                      className="text-[10px] bg-primary/5 border border-primary/10 text-primary py-0 px-2 font-semibold"
                    >
                      {s.trim()}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Mode selection buttons */}
            <div className="flex items-center justify-center gap-4 bg-muted/20 border border-border/20 p-1 rounded-xl max-w-xs mx-auto">
              <button
                onClick={() => setTextMode(false)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  !textMode
                    ? "bg-background shadow text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🎤 Voice Mode
              </button>
              <button
                onClick={() => setTextMode(true)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  textMode
                    ? "bg-background shadow text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                ⌨️ Text Mode
              </button>
            </div>

            <Button
              onClick={startInterview}
              className="w-full py-6 gradient-bg hover:opacity-95 text-white font-bold text-md rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:shadow-primary/30 transition-all"
            >
              <Play className="w-5 h-5 fill-white" />
              Start Mock Interview
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  // ── Render: Final Complete Screen ──────────────────────────────────────────
  if (phase === "complete" && finalReport) {
    const avgTech = Math.round(evaluations.reduce((s, e) => s + e.technicalScore, 0) / evaluations.length);
    const avgComm = Math.round(evaluations.reduce((s, e) => s + e.communicationScore, 0) / evaluations.length);
    const avgConf = Math.round(evaluations.reduce((s, e) => s + e.confidenceScore, 0) / evaluations.length);

    const gradeColor = finalReport.grade.startsWith("A")
      ? "text-emerald-500"
      : finalReport.grade.startsWith("B")
      ? "text-primary"
      : finalReport.grade.startsWith("C")
      ? "text-amber-500"
      : "text-rose-500";

    const recommendationColor =
      finalReport.hiringRecommendation.includes("Hire")
        ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
        : finalReport.hiringRecommendation === "Borderline"
        ? "text-amber-500 bg-amber-500/10 border-amber-500/20"
        : "text-rose-500 bg-rose-500/10 border-rose-500/20";

    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        <Card className="relative overflow-hidden bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-xs font-bold rounded-full">
                <Trophy className="w-3.5 h-3.5" />
                Performance Report
              </div>
              <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
                Interview Completed!
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
                {finalReport.summary}
              </p>
              <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
                <span className="flex items-center gap-1.5"><Timer className="w-3.5 h-3.5" /> {formatTime(interviewTimer)}</span>
                <span>•</span>
                <span>{questions.length} questions completed</span>
              </div>
            </div>

            {/* Score Showcase */}
            <div className="flex flex-col items-center justify-center p-6 bg-muted/40 border border-border/50 rounded-2xl shrink-0 text-center w-full md:w-56 space-y-3">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Overall Grade</p>
              <span className={`text-6xl font-black ${gradeColor} tracking-tight`}>{finalReport.grade}</span>
              <span className="text-xs font-bold text-foreground">Score: {finalReport.overallScore}/100</span>
              <Badge variant="outline" className={`font-bold mt-1.5 ${recommendationColor}`}>
                {finalReport.hiringRecommendation}
              </Badge>
            </div>
          </div>
        </Card>

        {/* 3 Circular Averages */}
        <Card className="bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-6">
          <h3 className="font-extrabold text-foreground text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Core Attributes Assessment
          </h3>
          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
            <CircularProgress score={avgTech} label="Technical" colorClass={getCircleColorClass(avgTech)} />
            <CircularProgress score={avgComm} label="Communication" colorClass={getCircleColorClass(avgComm)} />
            <CircularProgress score={avgConf} label="Confidence" colorClass={getCircleColorClass(avgConf)} />
          </div>
        </Card>

        {/* Strengths & Improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-emerald-500">
              <Star className="w-4 h-4" />
              <h3 className="font-extrabold text-foreground text-sm">Key Strengths</h3>
            </div>
            <ul className="space-y-2.5">
              {finalReport.topStrengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-amber-500">
              <Target className="w-4 h-4" />
              <h3 className="font-extrabold text-foreground text-sm">Areas for Growth</h3>
            </div>
            <ul className="space-y-2.5">
              {finalReport.topImprovements.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                  <ArrowRight className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Study Topics & Next Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <BookOpen className="w-4 h-4" />
              <h3 className="font-extrabold text-foreground text-sm">Recommended Study Topics</h3>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {finalReport.studyTopics.map((topic, i) => (
                <Badge key={i} variant="secondary" className="px-2.5 py-1 text-[11px] font-semibold bg-primary/5 border border-primary/10 text-primary rounded-full">
                  {topic}
                </Badge>
              ))}
            </div>
          </Card>

          <Card className="bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-5 space-y-2.5">
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Next Steps</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{finalReport.nextSteps}</p>
          </Card>
        </div>

        <Button
          onClick={resetInterview}
          className="w-full py-3 bg-muted border border-border text-foreground hover:bg-muted/80 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Start a New Session
        </Button>
      </motion.div>
    );
  }

  // ── Render: Active Interview (WhatsApp/ChatGPT split layout) ───────────────
  const progress = (questions.length / MAX_QUESTIONS) * 100;

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Active Top Header */}
      <div className="flex items-center justify-between bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl px-5 py-3.5 shadow-md">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-foreground">Interview for {targetRole}</h3>
              {currentQuestion && <DifficultyBadge level={currentQuestion.difficulty} />}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-semibold mt-0.5">
              <span>Question {Math.min(questions.length + 1, MAX_QUESTIONS)} of {MAX_QUESTIONS}</span>
              <span>•</span>
              <span className="font-mono flex items-center gap-1">
                <Timer className="w-3 h-3" /> {formatTime(interviewTimer)}
              </span>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={resetInterview}
          className="h-8 py-0 px-3 text-xs font-bold border-rose-500/20 hover:border-rose-500/40 hover:bg-rose-500/5 text-rose-500 hover:text-rose-500 transition-colors rounded-lg"
        >
          End Session
        </Button>
      </div>

      {/* Progress Line */}
      <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full gradient-bg"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Main Grid: Left Chat, Right Real-time Evaluation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Chat Feed Column */}
        <Card className="lg:col-span-8 flex flex-col h-[520px] bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl overflow-hidden shadow-xl">
          {/* Scrollable messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const isAI = msg.sender === "ai";
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`flex items-start gap-2.5 max-w-[85%] ${
                      isAI ? "mr-auto" : "ml-auto flex-row-reverse"
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border font-bold text-xs ${
                        isAI
                          ? "bg-primary/10 border-primary/20 text-primary"
                          : "bg-muted border-border text-foreground"
                      }`}
                    >
                      {isAI ? <Brain className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>

                    {/* Message Bubble */}
                    <div className="space-y-1">
                      <div
                        className={`p-3.5 rounded-2xl text-sm leading-relaxed border ${
                          isAI
                            ? "bg-muted/40 border-border/30 rounded-tl-none text-foreground"
                            : "bg-primary text-primary-foreground border-primary/10 rounded-tr-none"
                        }`}
                      >
                        {msg.text}
                      </div>
                      <p
                        className={`text-[9px] text-muted-foreground/60 font-semibold px-1 ${
                          isAI ? "text-left" : "text-right"
                        }`}
                      >
                        {msg.timestamp}
                      </p>
                    </div>
                  </motion.div>
                );
              })}

              {/* Live transcript or typing indicator */}
              {(phase === "evaluating" || phase === "processing" || phase === "finalizing") && (
                <motion.div
                  key="thinking"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2.5 mr-auto"
                >
                  <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center bg-primary/10 border border-primary/20 text-primary font-bold text-xs">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <ThinkingIndicator />
                    <p className="text-[9px] text-muted-foreground/60 font-semibold italic">
                      {phase === "finalizing" ? "Finalizing report..." : "Analyzing answer..."}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Listening Live Transcript inline draft */}
              {!textMode && isListening && transcript.trim().length > 0 && (
                <motion.div
                  key="live-transcript"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-start gap-2.5 ml-auto flex-row-reverse max-w-[80%]"
                >
                  <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center bg-muted border border-border text-foreground font-bold text-xs">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="p-3.5 rounded-2xl rounded-tr-none text-sm leading-relaxed bg-primary/5 border border-primary/20 text-primary italic">
                      {transcript}
                    </div>
                    <p className="text-[9px] text-primary/60 font-semibold text-right animate-pulse">
                      Transcribing live...
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>

          {/* Interactive controls and inputs */}
          <div className="p-4 bg-muted/20 border-t border-border/50 space-y-3">
            <div className="flex gap-2">
              {/* Mic Icon indicator / Button */}
              {!textMode && (
                <div className="relative shrink-0">
                  <motion.button
                    onClick={isListening ? stopListening : startListening}
                    disabled={aiSpeaking || phase === "evaluating" || phase === "finalizing" || phase === "starting" || phase === "questioning"}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${
                      isListening
                        ? "bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-500/25"
                        : "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/30 disabled:opacity-40"
                    }`}
                  >
                    {isListening ? (
                      <Square className="w-5 h-5 fill-white" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </motion.button>
                  {isListening && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
                    </span>
                  )}
                </div>
              )}

              {/* Text input area */}
              <div className="flex-1 relative flex items-center">
                <textarea
                  value={textMode ? textInput : transcript}
                  onChange={(e) => {
                    if (textMode) setTextInput(e.target.value);
                  }}
                  disabled={
                    !textMode ||
                    aiSpeaking ||
                    phase === "evaluating" ||
                    phase === "finalizing" ||
                    phase === "starting" ||
                    phase === "questioning"
                  }
                  placeholder={
                    textMode
                      ? "Type your answer here..."
                      : isListening
                      ? "Speaking... voice transcribes here"
                      : "Click 'Start Speaking' or switch to text mode..."
                  }
                  rows={1}
                  className="w-full py-3 pl-4 pr-12 bg-background border border-border/80 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 resize-none transition-all outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submitAnswer();
                    }
                  }}
                />
                
                {/* Visual indicator of recording duration */}
                {!textMode && timer > 0 && isListening && (
                  <span className="absolute right-3 text-[10px] text-rose-500 font-mono font-bold bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20 animate-pulse">
                    {formatTime(timer)}
                  </span>
                )}
              </div>

              {/* Send Button */}
              <Button
                onClick={submitAnswer}
                disabled={
                  (textMode && textInput.trim().length < 5) ||
                  (!textMode && transcript.trim().length < 5) ||
                  isListening ||
                  aiSpeaking ||
                  phase === "evaluating" ||
                  phase === "finalizing"
                }
                className="w-12 h-12 p-0 gradient-bg text-white rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-primary/10 disabled:opacity-40"
              >
                <Send className="w-4.5 h-4.5 fill-white" />
              </Button>
            </div>

            {/* Bottom Row status and Switch mode link */}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
              <div>
                {aiSpeaking ? (
                  <div className="flex items-center gap-1 text-primary font-bold">
                    <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                    <span>AI Interviewer is speaking...</span>
                  </div>
                ) : isListening ? (
                  <div className="flex items-center gap-2 text-rose-500 font-bold">
                    <MicVisualizer active={isListening} />
                    <span>Listening...</span>
                  </div>
                ) : (
                  <span>Ready to receive answer</span>
                )}
              </div>

              <button
                onClick={() => {
                  stopListening();
                  setTextMode(!textMode);
                }}
                className="hover:text-primary font-bold transition-colors"
              >
                Switch to {textMode ? "🎤 Voice" : "⌨️ Text"} Mode
              </button>
            </div>
          </div>
        </Card>

        {/* Real-time Evaluation Column */}
        <Card className="lg:col-span-4 bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-5 shadow-xl flex flex-col h-[520px] overflow-y-auto space-y-4">
          <div className="flex items-center gap-2 border-b border-border/20 pb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="font-extrabold text-foreground text-sm uppercase tracking-wider">
              Real-time Metrics
            </h3>
          </div>

          <AnimatePresence mode="wait">
            {currentEvaluation ? (
              <motion.div
                key="evaluation-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4 flex-1 flex flex-col"
              >
                {/* 3 attribute circular indicators */}
                <div className="grid grid-cols-3 gap-2 py-2 border-b border-border/10">
                  <CircularProgress
                    score={currentEvaluation.technicalScore}
                    label="Tech"
                    colorClass={getCircleColorClass(currentEvaluation.technicalScore)}
                  />
                  <CircularProgress
                    score={currentEvaluation.communicationScore}
                    label="Comms"
                    colorClass={getCircleColorClass(currentEvaluation.communicationScore)}
                  />
                  <CircularProgress
                    score={currentEvaluation.confidenceScore}
                    label="Confidence"
                    colorClass={getCircleColorClass(currentEvaluation.confidenceScore)}
                  />
                </div>

                {/* Score Banner */}
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-3.5 text-center space-y-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    Answer Score
                  </span>
                  <div className="text-3xl font-black text-primary">
                    {currentEvaluation.overallScore}
                    <span className="text-xs text-muted-foreground font-semibold">/100</span>
                  </div>
                </div>

                {/* Feedback Text */}
                <div className="space-y-1.5">
                  <h4 className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Live Analysis
                  </h4>
                  <p className="text-xs text-foreground leading-relaxed italic bg-muted/40 p-3 rounded-xl border border-border/30">
                    &quot;{currentEvaluation.feedback}&quot;
                  </p>
                </div>

                {/* Strengths tags */}
                <div className="space-y-1.5">
                  <h4 className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                    Strengths
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {currentEvaluation.strengths.slice(0, 3).map((s, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-[9px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 py-0.5 px-2 rounded"
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Improvements tags */}
                <div className="space-y-1.5">
                  <h4 className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                    Areas to Improve
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {currentEvaluation.improvements.slice(0, 3).map((s, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-[9px] font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-500 py-0.5 px-2 rounded"
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="evaluation-placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-muted/40 border border-border/50 flex items-center justify-center shadow-inner">
                  <Activity className="w-7 h-7 text-muted-foreground/50 animate-pulse" />
                </div>
                <div className="space-y-1 max-w-[200px]">
                  <p className="text-xs font-bold text-foreground">Awaiting Assessment</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Once you submit your first response, AI metrics will populate here in real-time.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
}
