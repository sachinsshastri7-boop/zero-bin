"use client";

import { useState } from "react";

interface ShareModalProps {
  url: string;
  onClose: () => void;
}

export default function ShareModal({ url, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4">
        <h3 className="text-xl font-bold text-zinc-100">Paste Encrypted & Created!</h3>
        <p className="text-sm text-zinc-400">
          The decryption key is stored <strong className="text-emerald-400">only</strong> in the URL fragment (`#`).
          The server never receives or stores this key.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={url}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none"
          />
          <button
            onClick={handleCopy}
            className="bg-emerald-600 hover:bg-emerald-500 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            {copied ? "Copied!" : "Copy URL"}
          </button>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Create Another Paste
          </button>
        </div>
      </div>
    </div>
  );
}