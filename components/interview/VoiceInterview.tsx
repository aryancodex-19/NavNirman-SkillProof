"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Mic,
  MicOff,
  Square,
  Play,
  ChevronRight,
  Trophy,
  TrendingUp,
  MessageSquare,
  Zap,
  Brain,
  Volume2,
  Loader2,
  RotateCcw,
  Star,
  Target,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Timer,
} from "lucide-react";

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

// ─── Helper: Score bar ────────────────────────────────────────────────────────
function ScoreBar({
  label,
  score,
  color,
  delay = 0,
}: {
  label: string;
  score: number;
  color: string;
  delay?: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground font-medium">{label}</span>
        <span className="font-bold text-foreground">{score}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, delay, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ─── Helper: Typing effect text ───────────────────────────────────────────────
function TypingText({ text, speed = 20 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    if (!text) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {!done && <span className="animate-pulse">▌</span>}
    </span>
  );
}

// ─── Sound wave bars ──────────────────────────────────────────────────────────
function SoundWaves({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-[3px] h-8">
      {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
        <motion.div
          key={i}
          className="w-1.5 rounded-full bg-primary"
          animate={
            active
              ? {
                  scaleY: [1, h * 0.4 + 0.3, 1, h * 0.6 + 0.2, 1],
                  opacity: [0.6, 1, 0.6, 1, 0.6],
                }
              : { scaleY: 0.2, opacity: 0.3 }
          }
          transition={
            active
              ? {
                  duration: 0.8 + i * 0.05,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.07,
                }
              : { duration: 0.3 }
          }
          style={{ height: `${h * 8}px`, originY: 0.5 }}
        />
      ))}
    </div>
  );
}

// ─── Difficulty badge ─────────────────────────────────────────────────────────
function DifficultyBadge({ level }: { level: number }) {
  const configs = [
    { label: "Warm-up", color: "bg-success/15 text-success border-success/30" },
    { label: "Easy", color: "bg-success/10 text-success border-success/20" },
    { label: "Medium", color: "bg-warning/10 text-warning border-warning/20" },
    { label: "Hard", color: "bg-danger/10 text-danger border-danger/20" },
    { label: "Expert", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  ];
  const c = configs[Math.min(level - 1, 4)];
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${c.color}`}>
      {c.label}
    </span>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
interface VoiceInterviewProps {
  targetRole?: string;
  skills?: string;
}

const MAX_QUESTIONS = 6;

export default function VoiceInterview({ targetRole = "Software Engineer", skills = "" }: VoiceInterviewProps) {
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

  const questionNumber = questions.length + 1;
  const isLastQuestion = questionNumber >= MAX_QUESTIONS;

  // ── Timer helpers ──────────────────────────────────────────────────────────
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer(0);
    timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    interviewTimerRef.current = setInterval(() => setInterviewTimer((t) => t + 1), 1000);
    return () => {
      if (interviewTimerRef.current) clearInterval(interviewTimerRef.current);
    };
  }, []);

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

    // Try to use a good voice
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
    async (prevEvaluation?: Evaluation) => {
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
            previousQuestions: questions.map((q) => q.text),
            previousAnswers: answers,
            questionNumber: questions.length + 1,
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

        // AI speaks the question
        const intro =
          questions.length === 0
            ? `Hello! Welcome to your ${targetRole} interview. I'll be your interviewer today. Let's start with our first question: ${q.text}`
            : `Great. Now for question ${questions.length + 1}: ${q.text}`;

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
    [questions, answers, targetRole, skills, speak, textMode, startListening]
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
        `Excellent! You've completed the interview. Your overall score is ${data.finalReport?.overallScore} out of 100. ${data.finalReport?.summary}`
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
        // End interview, generate report
        setPhase("finalizing");
        await saveAndFinalize(newQuestions, newAnswers, newEvaluations);
      } else {
        setPhase("between");
        // Speak feedback briefly then move on
        const feedbackSpeech = `${evaluation.feedback} Your score for this answer was ${evaluation.overallScore} out of 100. Let's move to the next question.`;
        speak(feedbackSpeech, () => {
          setTimeout(() => fetchNextQuestion(evaluation), 1000);
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

    // Check speech recognition availability
    const hasSpeechAPI =
      !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
    if (!hasSpeechAPI) setTextMode(true);

    await fetchNextQuestion();
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

  // Cleanup
  useEffect(() => {
    return () => {
      stopListening();
      stopSpeaking();
      if (timerRef.current) clearInterval(timerRef.current);
      if (interviewTimerRef.current) clearInterval(interviewTimerRef.current);
    };
  }, [stopListening]);

  // ── Render: Idle Screen ────────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Hero card */}
        <div className="relative overflow-hidden bg-card border border-border rounded-2xl p-8 sm:p-10 text-center shadow-xl">
          {/* BG glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/8 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent/8 rounded-full blur-3xl" />

          <div className="relative z-10 space-y-6">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 border border-primary/20 rounded-2xl mx-auto">
              <Mic className="w-10 h-10 text-primary" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-foreground">
                AI Voice Mock Interview
              </h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
                A real interviewer experience powered by Groq AI. It adapts to your answers, asks follow-up questions, and evaluates your performance in real time.
              </p>
            </div>

            {/* Info chips */}
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { icon: Brain, label: "Groq Llama 3.3 70B" },
                { icon: Zap, label: `${MAX_QUESTIONS} Adaptive Questions` },
                { icon: TrendingUp, label: "Real-time Scoring" },
                { icon: Volume2, label: "Voice + Text Mode" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 border border-border rounded-full text-xs text-muted-foreground font-medium"
                >
                  <Icon className="w-3 h-3 text-primary" />
                  {label}
                </div>
              ))}
            </div>

            {/* Target role display */}
            <div className="bg-muted/50 border border-border rounded-xl p-4 text-left space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Interview For</span>
              </div>
              <p className="text-foreground font-bold">{targetRole}</p>
              {skills && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {(typeof skills === "string" ? skills.split(",") : (skills as string[]))
                    .slice(0, 5)
                    .map((s: string) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 text-[10px] bg-primary/10 text-primary rounded-md border border-primary/20 font-medium"
                      >
                        {s.trim()}
                      </span>
                    ))}
                </div>
              )}
            </div>

            {/* Mode toggle */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <button
                onClick={() => setTextMode(false)}
                className={`px-3 py-1.5 rounded-lg border transition-all font-medium ${!textMode ? "bg-primary/10 text-primary border-primary/30" : "border-border hover:border-primary/20"}`}
              >
                🎤 Voice Mode
              </button>
              <button
                onClick={() => setTextMode(true)}
                className={`px-3 py-1.5 rounded-lg border transition-all font-medium ${textMode ? "bg-primary/10 text-primary border-primary/30" : "border-border hover:border-primary/20"}`}
              >
                ⌨️ Text Mode
              </button>
            </div>

            <motion.button
              onClick={startInterview}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 gradient-bg text-white font-bold text-lg rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:shadow-primary/30 transition-all"
            >
              <Play className="w-5 h-5" />
              Start Interview
            </motion.button>

            <p className="text-xs text-muted-foreground">
              {textMode
                ? "Text mode: Type your answers instead of speaking."
                : "Voice mode: Allow microphone access when prompted."}
            </p>
          </div>
        </div>

        {/* Past interviews link */}
        {evaluations.length === 0 && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            Tip: Complete your{" "}
            <a href="/profile" className="text-primary hover:underline">
              profile
            </a>{" "}
            to get role-specific questions.
          </p>
        )}
      </motion.div>
    );
  }

  // ── Render: Final Report ───────────────────────────────────────────────────
  if (phase === "complete" && finalReport) {
    const avgTech = Math.round(evaluations.reduce((s, e) => s + e.technicalScore, 0) / evaluations.length);
    const avgComm = Math.round(evaluations.reduce((s, e) => s + e.communicationScore, 0) / evaluations.length);
    const avgConf = Math.round(evaluations.reduce((s, e) => s + e.confidenceScore, 0) / evaluations.length);

    const gradeColor =
      finalReport.grade.startsWith("A")
        ? "text-success"
        : finalReport.grade.startsWith("B")
        ? "text-primary"
        : finalReport.grade.startsWith("C")
        ? "text-warning"
        : "text-danger";

    const hiringColor =
      finalReport.hiringRecommendation === "Strong Hire" || finalReport.hiringRecommendation === "Hire"
        ? "text-success bg-success/10 border-success/30"
        : finalReport.hiringRecommendation === "Borderline"
        ? "text-warning bg-warning/10 border-warning/30"
        : "text-danger bg-danger/10 border-danger/30";

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 max-w-3xl mx-auto"
      >
        {/* Score hero */}
        <div className="relative overflow-hidden bg-card border border-border rounded-2xl p-8 text-center shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl mx-auto">
              <Trophy className="w-8 h-8 text-primary" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider mb-1">Interview Complete</p>
              <div className="flex items-baseline gap-2 justify-center">
                <span className={`text-6xl font-black ${gradeColor}`}>{finalReport.grade}</span>
                <span className="text-2xl font-bold text-muted-foreground">({finalReport.overallScore}/100)</span>
              </div>
            </div>

            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold ${hiringColor}`}>
              {finalReport.hiringRecommendation === "Strong Hire" || finalReport.hiringRecommendation === "Hire"
                ? <CheckCircle2 className="w-4 h-4" />
                : <AlertCircle className="w-4 h-4" />}
              {finalReport.hiringRecommendation}
            </div>

            <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
              {finalReport.summary}
            </p>

            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Timer className="w-3.5 h-3.5" /> {formatTime(interviewTimer)}</span>
              <span>·</span>
              <span>{questions.length} Questions</span>
            </div>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Technical", score: avgTech, color: "bg-primary", icon: Brain },
            { label: "Communication", score: avgComm, color: "bg-success", icon: MessageSquare },
            { label: "Confidence", score: avgConf, color: "bg-accent", icon: Zap },
          ].map(({ label, score, color, icon: Icon }) => (
            <div key={label} className="bg-card border border-border rounded-2xl p-5 text-center">
              <Icon className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-2xl font-black text-foreground">{score}</p>
              <p className="text-xs text-muted-foreground font-semibold">{label}</p>
              <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Strengths & Improvements */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-success" />
              <h3 className="font-bold text-foreground text-sm">Top Strengths</h3>
            </div>
            <ul className="space-y-2">
              {finalReport.topStrengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-warning" />
              <h3 className="font-bold text-foreground text-sm">Areas to Improve</h3>
            </div>
            <ul className="space-y-2">
              {finalReport.topImprovements.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <ArrowRight className="w-3.5 h-3.5 text-warning mt-0.5 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Study topics */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-foreground text-sm">Recommended Study Topics</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {finalReport.studyTopics.map((t, i) => (
              <span key={i} className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full border border-primary/20 font-medium">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Next steps */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Next Steps</p>
          <p className="text-sm text-foreground leading-relaxed">{finalReport.nextSteps}</p>
        </div>

        {/* Question by question */}
        <div className="space-y-3">
          <h3 className="font-bold text-foreground">Question-by-Question Breakdown</h3>
          {questions.map((q, i) => {
            const ev = evaluations[i];
            if (!ev) return null;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-muted-foreground">Q{i + 1}</span>
                      <DifficultyBadge level={q.difficulty} />
                      <span className="text-[10px] text-muted-foreground capitalize bg-muted px-1.5 py-0.5 rounded">
                        {q.questionType}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-foreground leading-snug">{q.text}</p>
                  </div>
                  <div className="shrink-0 text-center">
                    <p className="text-lg font-black text-foreground">{ev.overallScore}</p>
                    <p className="text-[10px] text-muted-foreground">/100</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground italic">{ev.feedback}</p>
                <div className="grid grid-cols-3 gap-2">
                  <ScoreBar label="Technical" score={ev.technicalScore} color="bg-primary" delay={0.1} />
                  <ScoreBar label="Comms" score={ev.communicationScore} color="bg-success" delay={0.2} />
                  <ScoreBar label="Confidence" score={ev.confidenceScore} color="bg-accent" delay={0.3} />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Restart */}
        <button
          onClick={resetInterview}
          className="w-full py-3 bg-muted border border-border rounded-xl text-sm font-bold text-foreground hover:bg-muted/80 transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Start New Interview
        </button>
      </motion.div>
    );
  }

  // ── Render: Active Interview ───────────────────────────────────────────────
  const progress = (questions.length / MAX_QUESTIONS) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full gradient-bg rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Timer className="w-3.5 h-3.5" />
          <span className="font-mono font-bold">{formatTime(interviewTimer)}</span>
          <span>·</span>
          <span>{questions.length}/{MAX_QUESTIONS}</span>
        </div>
      </div>

      {/* Main interview card */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
        {/* Interviewer area */}
        <div className="relative bg-gradient-to-br from-primary/8 via-card to-accent/8 border-b border-border p-6">
          <div className="flex items-start gap-4">
            {/* AI avatar */}
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center shadow-md">
                <Brain className="w-6 h-6 text-white" />
              </div>
              {aiSpeaking && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-success" />
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-bold text-muted-foreground">AI Interviewer</p>
                {aiSpeaking && (
                  <span className="text-[10px] text-success font-semibold animate-pulse">Speaking...</span>
                )}
                {currentQuestion && (
                  <div className="ml-auto flex items-center gap-1.5">
                    <DifficultyBadge level={currentQuestion.difficulty} />
                    <span className="text-[10px] text-muted-foreground capitalize bg-muted px-1.5 py-0.5 rounded">
                      {currentQuestion.questionType}
                    </span>
                  </div>
                )}
              </div>

              <AnimatePresence mode="wait">
                {phase === "starting" || phase === "questioning" ? (
                  <motion.div
                    key="thinking"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">
                      {phase === "starting" ? "Preparing your interview..." : "Generating question..."}
                    </span>
                  </motion.div>
                ) : currentQuestion ? (
                  <motion.div key={currentQuestion.text} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="text-base font-semibold text-foreground leading-relaxed">
                      <TypingText text={`Q${questions.length + 1}: ${currentQuestion.text}`} speed={18} />
                    </p>
                    {aiSpeaking && (
                      <div className="mt-3 flex items-center gap-2">
                        <SoundWaves active={aiSpeaking} />
                        <button
                          onClick={stopSpeaking}
                          className="text-[10px] text-muted-foreground hover:text-foreground border border-border rounded-lg px-2 py-1 transition-colors"
                        >
                          Skip
                        </button>
                      </div>
                    )}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* User response area */}
        <div className="p-6 space-y-4">
          <AnimatePresence mode="wait">
            {/* Evaluating phase */}
            {(phase === "evaluating" || phase === "between" || phase === "finalizing") && (
              <motion.div
                key="evaluating"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8 space-y-3"
              >
                <div className="relative inline-flex">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Brain className="w-7 h-7 text-primary animate-pulse" />
                  </div>
                </div>
                <p className="font-bold text-foreground">
                  {phase === "finalizing" ? "Generating your final report..." : "Evaluating your answer..."}
                </p>
                <p className="text-xs text-muted-foreground">
                  {phase === "finalizing"
                    ? "AI is analyzing your complete interview performance"
                    : "AI is scoring technical accuracy, communication, and confidence"}
                </p>
                <div className="flex gap-1 justify-center">
                  {[0, 0.2, 0.4].map((delay) => (
                    <motion.div
                      key={delay}
                      className="w-2 h-2 bg-primary rounded-full"
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Live evaluation shown after answer */}
            {phase === "between" && currentEvaluation && (
              <motion.div
                key="eval-result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-muted/50 border border-border rounded-xl p-4 space-y-3"
              >
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quick Feedback</p>
                <p className="text-sm text-foreground leading-relaxed">{currentEvaluation.feedback}</p>
                <div className="space-y-2">
                  <ScoreBar label="Technical" score={currentEvaluation.technicalScore} color="bg-primary" />
                  <ScoreBar label="Communication" score={currentEvaluation.communicationScore} color="bg-success" delay={0.1} />
                  <ScoreBar label="Confidence" score={currentEvaluation.confidenceScore} color="bg-accent" delay={0.2} />
                </div>
              </motion.div>
            )}

            {/* Listening / Text input */}
            {(phase === "listening" || (phase === "questioning" && !aiSpeaking)) && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Transcript / input */}
                {textMode ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Your Answer</p>
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Type your answer here..."
                      rows={5}
                      className="w-full p-4 bg-muted/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none transition-all"
                    />
                    <p className="text-[10px] text-muted-foreground text-right">{textInput.length} chars</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-muted-foreground">Live Transcript</p>
                      {isListening && (
                        <div className="flex items-center gap-1.5 text-[10px] text-danger font-bold">
                          <span className="w-2 h-2 bg-danger rounded-full animate-pulse" />
                          Recording
                        </div>
                      )}
                    </div>
                    <div className="min-h-[100px] max-h-[180px] overflow-y-auto p-4 bg-muted/30 border border-border rounded-xl text-sm text-foreground leading-relaxed">
                      {transcript || (
                        <span className="text-muted-foreground italic">
                          {isListening ? "Listening... speak your answer" : "Press the mic button to start speaking"}
                        </span>
                      )}
                    </div>
                    {timer > 0 && (
                      <p className="text-xs text-muted-foreground text-right font-mono">
                        🎤 {formatTime(timer)}
                      </p>
                    )}
                  </div>
                )}

                {/* Controls */}
                <div className="flex gap-3">
                  {/* Mic button (voice mode) */}
                  {!textMode && (
                    <>
                      {!isListening ? (
                        <motion.button
                          onClick={startListening}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          disabled={aiSpeaking}
                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-danger/10 hover:bg-danger/20 border border-danger/30 text-danger font-bold rounded-xl transition-all disabled:opacity-40"
                        >
                          <Mic className="w-5 h-5" />
                          Start Speaking
                        </motion.button>
                      ) : (
                        <motion.button
                          onClick={stopListening}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-danger text-white font-bold rounded-xl shadow-lg shadow-danger/25"
                          animate={{ boxShadow: ["0 0 0 0 rgba(239,68,68,0)", "0 0 0 8px rgba(239,68,68,0.2)", "0 0 0 0 rgba(239,68,68,0)"] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <Square className="w-5 h-5" />
                          Stop Recording
                        </motion.button>
                      )}
                    </>
                  )}

                  {/* Submit */}
                  <motion.button
                    onClick={submitAnswer}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={
                      (textMode && textInput.trim().length < 5) ||
                      (!textMode && transcript.trim().length < 5) ||
                      isListening
                    }
                    className="flex-1 flex items-center justify-center gap-2 py-3 gradient-bg text-white font-bold rounded-xl shadow-md shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {isLastQuestion ? (
                      <>
                        <Trophy className="w-4 h-4" />
                        Finish Interview
                      </>
                    ) : (
                      <>
                        Submit Answer
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </div>

                {/* Mode switch */}
                <button
                  onClick={() => {
                    stopListening();
                    setTextMode(!textMode);
                  }}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                  Switch to {textMode ? "voice" : "text"} mode
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Per-question mini cards */}
      {evaluations.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Answered Questions
          </p>
          {questions.map((q, i) => {
            const ev = evaluations[i];
            if (!ev) return null;
            const scoreColor =
              ev.overallScore >= 80
                ? "text-success"
                : ev.overallScore >= 60
                ? "text-warning"
                : "text-danger";
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-2.5"
              >
                <span className="text-xs text-muted-foreground font-mono w-5">Q{i + 1}</span>
                <p className="flex-1 text-xs text-muted-foreground truncate">{q.text}</p>
                <span className={`text-sm font-black ${scoreColor}`}>{ev.overallScore}</span>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Exit button */}
      <button
        onClick={resetInterview}
        className="w-full py-2 text-xs text-muted-foreground hover:text-danger border border-border hover:border-danger/30 rounded-xl transition-all"
      >
        Quit Interview
      </button>
    </div>
  );
}
