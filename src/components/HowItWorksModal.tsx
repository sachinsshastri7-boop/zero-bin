"use client";

import { X, Lock, Key, ShieldAlert, Flame, FileText, QrCode } from "lucide-react";

interface ModalProps {
  onClose: () => void;
}

export default function HowItWorksModal({ onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-zinc-100 shadow-2xl [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-zinc-950/50 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-700/80 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-emerald-500 transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">ZeroBin User Manual</h2>
              <p className="text-xs text-zinc-400">Step-by-step guide to secure & plausible paste sharing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Manual Sections */}
        <div className="space-y-6 text-xs leading-relaxed text-zinc-300 font-sans">
          
          {/* Step 1 */}
          <div className="flex gap-4 p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-950/50">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 h-fit shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-zinc-100 text-sm">1. Creating a Standard Encrypted Paste</h3>
              <p className="text-zinc-400">
                Type or paste your sensitive code, credentials, or notes into the main text area. You can also click <strong>Attach Encrypted File</strong> to encrypt files (up to 1 MB) directly alongside your text.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4 p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-950/50">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 h-fit shrink-0">
              <Key className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-zinc-100 text-sm">2. Optional Passphrase & Expiration</h3>
              <p className="text-zinc-400">
                Select an automatic expiration time (5 min to 7 days). Optionally enter a <strong>Primary Passphrase</strong> for double-layer protection. Check <strong>Burn After Reading</strong> if you want the paste destroyed immediately after its first view.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4 p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 h-fit shrink-0">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-amber-300 text-sm">3. Plausible Deniability (Decoy Mode)</h3>
              <p className="text-zinc-400">
                Expand the Decoy section to add an innocent cover message (e.g. standard documentation or a grocery list) and set a <strong>Decoy Passphrase</strong>. If forced to hand over a password under duress, entering the decoy passphrase reveals only the harmless cover message while keeping your secret hidden.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4 p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-950/50">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 h-fit shrink-0">
              <QrCode className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-zinc-100 text-sm">4. Sharing & Decrypting</h3>
              <p className="text-zinc-400">
                Click <strong>Create Encrypted Paste</strong> to generate your link. Copy the URL or share via QR code. The decryption key is embedded in the link fragment (<code className="text-emerald-400">#</code>), meaning the server never sees your unencrypted data.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition"
          >
            Got it, thanks!
          </button>
        </div>

      </div>
    </div>
  );
}