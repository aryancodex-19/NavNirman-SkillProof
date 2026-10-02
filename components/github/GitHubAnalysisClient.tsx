"use client";

import React, { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import GitHubConnect from "@/components/github/GitHubConnect";
import CommitActivity from "@/components/github/CommitActivity";
import LanguageStats from "@/components/github/LanguageStats";
import ProjectComplexity from "@/components/github/ProjectComplexity";
import DocQuality from "@/components/github/DocQuality";
import GitHubScore from "@/components/github/GitHubScore";

interface GitHubAnalysisClientProps {
  existingAnalysis: {
    username: string;
    overallScore: number;
    analyzedAt: string | null;
    hasToken: boolean;
    data: any;
  } | null;
  defaultUsername: string;
}

export default function GitHubAnalysisClient({
  existingAnalysis,
  defaultUsername,
}: GitHubAnalysisClientProps) {
  const [isConnected, setIsConnected] = useState(!!existingAnalysis);
  const [username, setUsername] = useState(
    existingAnalysis?.username || defaultUsername
  );
  const [analysisData, setAnalysisData] = useState<any>(
    existingAnalysis?.data || null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Auto-trigger analysis if connected but no data
  useEffect(() => {
    if (isConnected && !analysisData && !isAnalyzing) {
      handleAnalyze();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = useCallback(
    async (enteredUsername: string, token?: string) => {
      setIsConnecting(true);
      try {
        const res = await fetch("/api/github/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: enteredUsername, token }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Failed to connect");
          return;
        }

        setUsername(data.username);
        setIsConnected(true);
        toast.success(`Connected to GitHub as ${data.username}`);

        // Auto-trigger analysis
        await runAnalysis();
      } catch (err: any) {
        toast.error(err.message || "Connection failed");
      } finally {
        setIsConnecting(false);
      }
    },
    []
  );

  const handleDisconnect = useCallback(async () => {
    try {
      const res = await fetch("/api/github/connect", { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to disconnect");
        return;
      }
      setIsConnected(false);
      setAnalysisData(null);
      setUsername("");
      toast.success("GitHub disconnected");
    } catch (err: any) {
      toast.error(err.message || "Disconnect failed");
    }
  }, []);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/github/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Analysis failed");
        return;
      }

      setAnalysisData(data);
      toast.success("GitHub analysis complete!");
    } catch (err: any) {
      toast.error(err.message || "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyze = useCallback(async () => {
    await runAnalysis();
  }, []);

  // ── Not Connected State ──
  if (!isConnected) {
    return (
      <GitHubConnect
        defaultUsername={defaultUsername}
        isConnecting={isConnecting}
        onConnect={handleConnect}
      />
    );
  }

  // ── Loading / Analyzing State ──
  if (isAnalyzing && !analysisData) {
    return <AnalyzingLoader username={username} />;
  }

  // ── Connected but no data yet (edge case) ──
  if (!analysisData) {
    return (
      <div className="space-y-6">
        <GitHubConnect
          defaultUsername={username}
          isConnecting={isConnecting}
          onConnect={handleConnect}
          isConnected
          onDisconnect={handleDisconnect}
          connectedUsername={username}
        />
      </div>
    );
  }

  // ── Full Analysis Dashboard ──
  return (
    <div className="space-y-6">
      {/* Connection status bar */}
      <div className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm text-gray-300 font-medium">
            Connected as{" "}
            <a
              href={`https://github.com/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 transition-colors font-semibold"
            >
              @{username}
            </a>
          </span>
          {analysisData.profile?.avatarUrl && (
            <img
              src={analysisData.profile.avatarUrl}
              alt={username}
              className="h-6 w-6 rounded-full border border-white/10"
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            {isAnalyzing ? "Analyzing..." : "Re-analyze"}
          </button>
          <span className="text-white/10">|</span>
          <button
            onClick={handleDisconnect}
            className="text-xs text-red-400 hover:text-red-300 font-semibold transition-colors cursor-pointer"
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* Overall Score */}
      <GitHubScore
        overallScore={analysisData.overallScore}
        activityScore={analysisData.activity?.score || 0}
        languageScore={analysisData.languages?.score || 0}
        projectScore={analysisData.projects?.score || 0}
        docScore={analysisData.documentation?.score || 0}
        level={analysisData.level}
        recommendations={analysisData.recommendations || []}
      />

      {/* Activity & Languages Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CommitActivity data={analysisData.activity} />
        <LanguageStats data={analysisData.languages} />
      </div>

      {/* Projects & Docs Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProjectComplexity data={analysisData.projects} />
        <DocQuality data={analysisData.documentation} />
      </div>
    </div>
  );
}

// ── Analyzing Loader ──

function AnalyzingLoader({ username }: { username: string }) {
  const steps = [
    "Fetching GitHub profile...",
    "Scanning repositories...",
    "Analyzing commit patterns...",
    "Evaluating language diversity...",
    "Checking documentation quality...",
    "Computing scores...",
  ];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-8">
      {/* Animated spinner */}
      <div className="relative">
        <div className="h-20 w-20 rounded-full border-4 border-white/5" />
        <div className="absolute inset-0 h-20 w-20 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
        <div className="absolute inset-2 h-16 w-16 rounded-full border-4 border-transparent border-t-violet-500 animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
      </div>

      <div className="text-center space-y-3">
        <h3 className="text-lg font-bold text-white">
          Analyzing @{username}
        </h3>
        <div className="space-y-2">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`text-sm transition-all duration-500 ${
                i < step
                  ? "text-emerald-400"
                  : i === step
                  ? "text-indigo-400 animate-pulse"
                  : "text-gray-600"
              }`}
            >
              {i < step ? "✓" : i === step ? "●" : "○"} {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
