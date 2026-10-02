"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { GitGraph, Eye, EyeOff, Loader2, Unplug } from "lucide-react";

interface GitHubConnectProps {
  defaultUsername: string;
  isConnecting: boolean;
  onConnect: (username: string, token?: string) => void;
  isConnected?: boolean;
  onDisconnect?: () => void;
  connectedUsername?: string;
}

export default function GitHubConnect({
  defaultUsername,
  isConnecting,
  onConnect,
  isConnected,
  onDisconnect,
  connectedUsername,
}: GitHubConnectProps) {
  const [username, setUsername] = useState(defaultUsername);
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    onConnect(username.trim(), token.trim() || undefined);
  };

  if (isConnected && connectedUsername) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-xl p-8"
      >
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <GitGraph className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Connected</h3>
              <p className="text-sm text-gray-400">
                Linked to @{connectedUsername}
              </p>
            </div>
          </div>
          <button
            onClick={onDisconnect}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-xl transition-all cursor-pointer"
          >
            <Unplug className="w-4 h-4" />
            Disconnect
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-xl"
    >
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 p-8 sm:p-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
            <GitGraph className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              Connect Your GitHub
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Enter your GitHub username to start analysis
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              GitHub Username
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                github.com/
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your-username"
                className="w-full pl-[105px] pr-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-gray-600 text-sm font-medium focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                required
              />
            </div>
          </div>

          {/* Advanced: PAT Token */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors cursor-pointer"
            >
              {showAdvanced
                ? "▾ Hide advanced options"
                : "▸ Advanced: Add Personal Access Token"}
            </button>

            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-3 space-y-2"
              >
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Personal Access Token{" "}
                  <span className="text-gray-600 normal-case">(optional)</span>
                </label>
                <div className="relative">
                  <input
                    type={showToken ? "text" : "password"}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="w-full pl-4 pr-12 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-gray-600 text-sm font-mono focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                  >
                    {showToken ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Adding a PAT enables analysis of private repos and increases
                  API rate limits. Create one at{" "}
                  <a
                    href="https://github.com/settings/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300"
                  >
                    github.com/settings/tokens
                  </a>
                </p>
              </motion.div>
            )}
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isConnecting || !username.trim()}
            whileHover={!isConnecting ? { scale: 1.02, y: -1 } : undefined}
            whileTap={!isConnecting ? { scale: 0.98 } : undefined}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 border border-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <GitGraph className="w-4 h-4" />
                Connect & Analyze
              </>
            )}
          </motion.button>
        </form>

        {/* Feature highlights */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { emoji: "📊", label: "Activity Heatmap" },
            { emoji: "🗂️", label: "Language Stats" },
            { emoji: "⭐", label: "Project Quality" },
            { emoji: "📝", label: "Doc Analysis" },
          ].map(({ emoji, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-gray-400 font-medium"
            >
              <span>{emoji}</span>
              {label}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
