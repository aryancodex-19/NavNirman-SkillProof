"use client";

import React, { useRef, useState } from "react";
import { Download, ExternalLink, RefreshCw, Monitor, Smartphone, Tablet, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PortfolioPreviewProps {
  html: string;
  onRegenerate?: () => void;
  isLoading?: boolean;
}

export default function PortfolioPreview({ html, onRegenerate, isLoading }: PortfolioPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  const downloadHtml = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-portfolio.html";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Portfolio downloaded successfully!", { description: "You can host this HTML file anywhere." });
  };

  const openInNewTab = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  // Dynamic width helper for the iframe container
  const getDeviceWidth = () => {
    if (previewDevice === "mobile") return "max-w-[375px] h-[720px] rounded-3xl border-4 border-zinc-800 shadow-xl overflow-hidden my-4";
    if (previewDevice === "tablet") return "max-w-[768px] h-[750px] border-x border-white/5";
    return "max-w-full h-[750px] border-x border-white/5";
  };

  return (
    <div className="glass-card border border-white/5 rounded-2xl overflow-hidden shadow-2xl bg-zinc-950/40">
      {/* Premium Browser Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-b border-white/5 bg-zinc-950/50">
        <div className="flex items-center gap-3">
          {/* Traffic light circles */}
          <div className="flex gap-1.5 shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          
          <div className="bg-zinc-900 border border-white/5 rounded-lg px-3 py-1 text-[11px] font-semibold text-gray-400">
            my-portfolio.html
          </div>
        </div>

        {/* Device Switcher */}
        <div className="flex bg-zinc-900/80 p-0.5 rounded-lg border border-white/5 shrink-0">
          {[
            { id: "desktop", icon: Monitor, label: "Desktop" },
            { id: "tablet", icon: Tablet, label: "Tablet" },
            { id: "mobile", icon: Smartphone, label: "Mobile" },
          ].map((device) => (
            <button
              key={device.id}
              onClick={() => setPreviewDevice(device.id as any)}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                previewDevice === device.id
                  ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20"
                  : "text-muted-foreground hover:text-foreground border border-transparent"
              }`}
              title={device.label}
              type="button"
            >
              <device.icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2 shrink-0">
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-zinc-900 border border-white/5 rounded-xl text-gray-300 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isLoading ? "animate-spin" : ""}`} />
              <span>Regenerate</span>
            </button>
          )}
          
          <button
            onClick={openInNewTab}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-zinc-900 border border-white/5 rounded-xl text-gray-300 hover:text-white transition-all cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
            <span>Open Tab</span>
          </button>
          
          <button
            onClick={downloadHtml}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-gradient-to-r from-indigo-500 to-violet-600 hover:opacity-95 text-white rounded-xl shadow-md transition-all hover:scale-[1.01] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download HTML</span>
          </button>
        </div>
      </div>

      {/* iframe Preview Container */}
      <div 
        className="relative flex justify-center items-center bg-zinc-950/20 px-4 transition-all duration-300" 
        style={{ minHeight: "750px" }}
      >
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/60 backdrop-blur-sm z-20">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
            <p className="text-sm font-bold text-gray-200">Rebuilding your portfolio...</p>
            <p className="text-xs text-muted-foreground mt-1">Applying templates and components</p>
          </div>
        ) : (
          <div className={`w-full transition-all duration-300 flex justify-center ${previewDevice === "mobile" ? "" : "h-[750px]"}`}>
            <div className={`w-full h-full transition-all duration-300 bg-[#030712] ${getDeviceWidth()}`}>
              <iframe
                ref={iframeRef}
                srcDoc={html}
                className="w-full h-full border-0 bg-transparent"
                title="Portfolio Preview"
                sandbox="allow-same-origin allow-scripts"
                scrolling="yes"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
