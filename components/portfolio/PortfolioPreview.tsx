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
    if (previewDevice === "mobile") return "max-w-[375px] h-[720px] rounded-3xl border-4 border-zinc-800 shadow-[0_0_30px_rgba(139,92,246,0.3)] overflow-hidden my-4";
    if (previewDevice === "tablet") return "max-w-[768px] h-[750px] border-x border-white/10";
    return "max-w-full h-[750px] border-x border-white/10";
  };

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(139,92,246,0.15)]">
      {/* Premium Browser Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {/* Traffic light circles */}
          <div className="flex gap-1.5 shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-[11px] font-mono text-purple-300">
            preview://my-portfolio.html
          </div>
        </div>

        {/* Device Switcher */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
          {[
            { id: "desktop", icon: Monitor, label: "Desktop" },
            { id: "tablet", icon: Tablet, label: "Tablet" },
            { id: "mobile", icon: Smartphone, label: "Mobile" },
          ].map((device) => (
            <button
              key={device.id}
              onClick={() => setPreviewDevice(device.id as any)}
              className={`p-1.5 px-2.5 rounded-lg transition-all cursor-pointer ${
                previewDevice === device.id
                  ? "bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                  : "text-gray-400 hover:text-white border border-transparent"
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
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:text-white hover:border-purple-500/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${isLoading ? "animate-spin" : ""}`} />
              <span>Regenerate</span>
            </button>
          )}
          
          <button
            onClick={openInNewTab}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:text-white hover:border-purple-500/30 transition-all cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
            <span>Open Tab</span>
          </button>
          
          <button
            onClick={downloadHtml}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98] shimmer cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download HTML</span>
          </button>
        </div>
      </div>

      {/* iframe Preview Container */}
      <div 
        className="relative flex justify-center items-center bg-black/50 px-4 transition-all duration-300" 
        style={{ minHeight: "750px" }}
      >
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-20">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-3" />
            <p className="text-sm font-bold text-gray-200">Rebuilding your portfolio...</p>
            <p className="text-xs text-gray-400 mt-1">Applying templates and components</p>
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
