"use client";

import { useState } from "react";

interface PasteViewerProps {
  decryptedText: string;
  isBurned: boolean;
}

export default function PasteViewer({ decryptedText, isBurned }: PasteViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(decryptedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {isBurned && (
        <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-300 text-sm flex items-center justify-between">
          <span>🔥 <strong>Burn-After-Reading triggered:</strong> This paste has been deleted from the database forever.</span>
        </div>
      )}

      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 bg-zinc-800 hover:bg-zinc-700 text-xs px-3 py-1.5 rounded-md transition-colors"
        >
          {copied ? "Copied!" : "Copy Content"}
        </button>

        <pre className="font-mono text-sm text-zinc-200 whitespace-pre-wrap break-words overflow-x-auto pt-8">
          {decryptedText}
        </pre>
      </div>
    </div>
  );
}