"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";

const FileUpload = dynamic(() => import("@/components/ui/FileUpload"), {
  loading: () => <LoadingSkeleton variant="card" />,
  ssr: false,
});
const ResumeEditor = dynamic(() => import("@/components/resume/ResumeEditor"), {
  loading: () => <LoadingSkeleton variant="form" />,
  ssr: false,
});
import { Loader2, Sparkles, Plus, FileText } from "lucide-react";
import PageTransition from "@/components/ui/PageTransition";
import GlassCard from "@/components/ui/GlassCard";
import AnimatedButton from "@/components/ui/AnimatedButton";

export default function ResumePage() {
  const [resume, setResume] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch latest resume on mount
  useEffect(() => {
    const loadLatestResume = async () => {
      try {
        const res = await fetch("/api/resume/latest");
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setResume(data);
          }
        }
      } catch (err) {
        console.error("Failed to load resume:", err);
        toast.error("Failed to fetch saved resume.");
      } finally {
        setLoading(false);
      }
    };
    loadLatestResume();
  }, []);

  // Handle PDF upload and parsing
  const handleFileSelect = async (file: File) => {
    setUploading(true);
    setUploadProgress(10);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => (prev < 90 ? prev + 12 : prev));
    }, 450);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/resume/parse", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to parse PDF resume");
      }

      const parsedData = await res.json();
      toast.success("Resume saved successfully!");

      setResume(parsedData);
    } catch (error: any) {
      clearInterval(progressInterval);
      toast.error(error.message || "An error occurred during resume parsing.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleStartBlank = async () => {
    setLoading(true);
    try {
      const blankData = {
        title: "My Resume",
        fullName: "",
        email: "",
        phone: "",
        summary: "",
        skills: [],
        experience: [],
        education: [],
        targetRole: "",
      };

      const res = await fetch("/api/resume/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(blankData),
      });

      if (res.ok) {
        const saved = await res.json();
        setResume({
          ...saved,
          skills: [],
          experience: [],
          education: [],
        });
        toast.success("Started a new resume draft!");
      } else {
        throw new Error("Failed to start blank resume");
      }
    } catch (err: any) {
      toast.error(err.message || "Could not create blank resume.");
    } finally {
      setLoading(false);
    }
  };

  // If loading, show loading skeleton
  if (loading) {
    return (
      <PageTransition>
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8 animate-pulse">
          <div className="space-y-3">
            <div className="h-8 w-1/4 bg-white/5 rounded-lg" />
            <div className="h-4 w-1/2 bg-white/5 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-6 space-y-6">
              <div className="h-10 bg-white/5 rounded-lg" />
              <div className="h-[400px] bg-white/5 rounded-2xl" />
            </div>
            <div className="lg:col-span-6">
              <div className="h-[450px] bg-white/5 rounded-2xl" />
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  // If user has a resume, load the editor workspace
  if (resume) {
    return (
      <PageTransition>
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <ResumeEditor
            initialData={resume}
            onDelete={() => setResume(null)}
          />
        </div>
      </PageTransition>
    );
  }

  // Otherwise show file upload option
  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col gap-2.5 text-center md:text-left">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
            AI Resume Builder
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            Upload your resume PDF to let Gemini auto-parse and format it instantly, or start a new draft from scratch.
          </p>
        </div>

        <GlassCard hoverEffect={false} className="p-6 md:p-8 space-y-6 bg-zinc-950/40">
          <FileUpload
            onFileSelect={handleFileSelect}
            loading={uploading}
            progress={uploadProgress}
          />

          <div className="flex items-center justify-center gap-4">
            <div className="h-[1px] bg-white/5 flex-1" />
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">or</span>
            <div className="h-[1px] bg-white/5 flex-1" />
          </div>

          <div className="flex justify-center">
            <AnimatedButton
              onClick={handleStartBlank}
              variant="glass"
              icon={<Plus className="w-5 h-5 text-indigo-400" />}
            >
              Create from Scratch
            </AnimatedButton>
          </div>
        </GlassCard>
      </div>
    </PageTransition>
  );
}
