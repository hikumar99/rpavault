"use client";

import React from "react";
import { AlertTriangle, Database, Key, CheckCircle, ExternalLink } from "lucide-react";

interface NotionSetupScreenProps {
  errorMessage?: string;
  onRetry: () => void;
}

export const NotionSetupScreen: React.FC<NotionSetupScreenProps> = ({
  errorMessage,
  onRetry,
}) => {
  return (
    <div className="min-h-screen bg-[#111317] text-white flex items-center justify-center p-6 select-none">
      <div className="max-w-lg w-full bg-[#1a1d24] border border-[#2e3340] rounded-2xl p-8 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-5">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <h2 className="text-xl font-bold tracking-tight text-white mb-2">
          Connect Cloud Database
        </h2>
        <p className="text-xs text-gray-400 leading-relaxed mb-6">
          Could not communicate with the cloud data source. Follow these quick steps to connect your database:
        </p>

        {errorMessage && (
          <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono break-all">
            {errorMessage}
          </div>
        )}

        <div className="space-y-4 mb-8">
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-[#232731] border border-[#343a49] flex items-center justify-center text-xs font-bold text-gray-300 shrink-0">
              1
            </div>
            <div className="text-xs text-gray-300">
              <strong className="text-white block mb-0.5">Share Database Access</strong>
              Open your database ("Team To Do's"), click <span className="px-1.5 py-0.5 bg-[#252a37] rounded border border-gray-700">•••</span> at top right → <strong className="text-white">Connections</strong> → Add your integration.
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-[#232731] border border-[#343a49] flex items-center justify-center text-xs font-bold text-gray-300 shrink-0">
              2
            </div>
            <div className="text-xs text-gray-300">
              <strong className="text-white block mb-0.5">Set Environment Variables</strong>
              Verify <code className="text-[#4772fa]">NOTION_TOKEN</code> and <code className="text-[#4772fa]">NOTION_DATA_SOURCE_ID</code> in <code className="text-gray-300">.env.local</code>.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRetry}
            className="flex-1 py-2.5 px-4 bg-[#4772fa] hover:bg-[#3861ea] text-white rounded-xl text-xs font-medium transition shadow-lg shadow-[#4772fa]/20"
          >
            Retry Connection
          </button>
        </div>
      </div>
    </div>
  );
};
