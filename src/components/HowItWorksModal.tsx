"use client";

import {
  Shield,
  Key,
  Database,
  EyeOff,
  Lock,
  Paperclip,
  ShieldAlert,
  X,
} from "lucide-react";

export default function HowItWorksModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-emerald-500/30 bg-zinc-950 p-6 shadow-2xl shadow-emerald-500/10 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-zinc-100">
                How ZeroBin Works
              </h3>
              <p className="text-xs text-zinc-400">
                Zero-Knowledge Client-Side AES-GCM-256 Architecture
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Core Steps */}
        <div className="mt-6 space-y-4">
          <div className="flex gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 font-mono font-bold">
              01
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-400" /> Encryption in Browser
              </h4>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                Text, code, and file attachments are encrypted locally using Web Crypto API (AES-GCM-256). The encryption key is generated strictly inside your browser.
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 font-mono font-bold">
              02
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <Key className="h-4 w-4 text-emerald-400" /> Key Stays in URL Fragment (#)
              </h4>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                The key is appended to the link after a hash (<code className="text-emerald-400">#</code>) symbol. Browsers <strong className="text-zinc-300">never send URL hash fragments to the server</strong> in HTTP requests.
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 font-mono font-bold">
              03
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-emerald-400" /> Zero-Trace Attachments
              </h4>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                Attached files are converted into Base64 memory buffers, encrypted alongside text payloads, and rendered entirely in browser memory on the recipient side.
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 font-mono font-bold">
              04
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-400" /> Plausible Deniability (Decoy Payload)
              </h4>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                Configure a secondary cover payload. If forced to reveal your link under coercion, entering a decoy trigger reveals harmless cover text instead of your true secret.
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 font-mono font-bold">
              05
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <EyeOff className="h-4 w-4 text-emerald-400" /> Ephemeral Destruction
              </h4>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                Pastes automatically expire based on configured TTL timers. Enabling <strong className="text-zinc-300">Burn After Reading</strong> instantly deletes the data on the first read query.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end border-t border-zinc-800 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-emerald-500 px-5 py-2 text-xs font-semibold text-black hover:bg-emerald-400 transition"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}