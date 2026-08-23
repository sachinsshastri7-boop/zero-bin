"use client";

import { useState } from "react";
import { Copy, Check, ShieldCheck, Flame, Clock, ExternalLink } from "lucide-react";

interface ShareModalProps {
  shareUrl: string;
  expiresAt: number;
  burnAfterRead: boolean;
  onClose: () => void;
}

export default function ShareModal({
  shareUrl,
  expiresAt,
  burnAfterRead,
  onClose,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedExpiry = new Date(expiresAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-emerald-500/30 bg-zinc-950 p-6 shadow-2xl shadow-emerald-500/10">
        <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
          <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-zinc-100">
              Encrypted Paste Ready
            </h3>
            <p className="text-xs text-zinc-400">
              Decryption key embedded in URL hash fragment `#`
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {/* Share Link Input Box */}
          <div>
            <label className="text-xs font-medium text-zinc-400">
              Shareable Link
            </label>
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 p-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full bg-transparent px-2 text-sm font-mono text-emerald-400 focus:outline-none"
              />
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-emerald-400"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/50 px-2.5 py-1 text-xs text-zinc-300">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              Expires at {formattedExpiry}
            </div>

            {burnAfterRead && (
              <div className="flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-400">
                <Flame className="h-3.5 w-3.5" /> Burn After Reading
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-zinc-800 pt-4">
          <a
            href={shareUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-zinc-200"
          >
            Open in new tab <ExternalLink className="h-3 w-3" />
          </a>
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-zinc-700"
          >
            Create Another
          </button>
        </div>
      </div>
    </div>
  );
}