"use client";

import {
  X,
  Lock,
  Key,
  ShieldAlert,
  Flame,
  FileText,
  QrCode,
  Sparkles,
  HelpCircle,
  Terminal,
  FileCode,
  ShieldCheck,
  Cpu,
} from "lucide-react";

interface ModalProps {
  onClose: () => void;
}

interface ManualStepProps {
  stepNumber: string;
  title: string;
  description: string;
  icon: React.ElementType;
  accentColor: "emerald" | "amber";
  tips?: string[];
}

// Sub-component for individual manual step cards
function ManualStepCard({
  stepNumber,
  title,
  description,
  icon: IconComponent,
  accentColor,
  tips,
}: ManualStepProps) {
  const isAmber = accentColor === "amber";

  return (
    <div
      className={`relative p-4 rounded-xl border transition-all duration-200 ${
        isAmber
          ? "border-amber-500/20 bg-amber-500/5 hover:border-amber-500/30"
          : "border-zinc-800/80 bg-zinc-950/50 hover:border-zinc-700/80"
      }`}
    >
      <div className="flex items-start gap-3.5">
        <div
          className={`p-2.5 rounded-lg shrink-0 ${
            isAmber
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          }`}
        >
          <IconComponent className="h-4 w-4" />
        </div>

        <div className="space-y-1.5 flex-1">
          <div className="flex items-center justify-between">
            <h3
              className={`font-semibold text-sm ${
                isAmber ? "text-amber-300" : "text-zinc-100"
              }`}
            >
              {stepNumber}. {title}
            </h3>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                isAmber
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "bg-zinc-800/80 text-zinc-400 border border-zinc-700/50"
              }`}
            >
              Step {stepNumber}
            </span>
          </div>

          <p className="text-zinc-400 text-xs leading-relaxed">{description}</p>

          {tips && tips.length > 0 && (
            <ul className="mt-2 space-y-1 pt-2 border-t border-zinc-800/60">
              {tips.map((tip, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono"
                >
                  <span className="h-1 w-1 rounded-full bg-emerald-400 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// Sub-component for security architecture summary
function SecurityHighlights() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
      <div className="p-3 rounded-xl border border-zinc-800/60 bg-zinc-950/30 space-y-1">
        <div className="flex items-center gap-2 text-emerald-400 font-mono text-[11px]">
          <Cpu className="h-3.5 w-3.5" /> Web Crypto API
        </div>
        <p className="text-[11px] text-zinc-400">
          Native Web Crypto primitives execute directly in the client browser.
        </p>
      </div>

      <div className="p-3 rounded-xl border border-zinc-800/60 bg-zinc-950/30 space-y-1">
        <div className="flex items-center gap-2 text-emerald-400 font-mono text-[11px]">
          <ShieldCheck className="h-3.5 w-3.5" /> Zero-Knowledge Server
        </div>
        <p className="text-[11px] text-zinc-400">
          Decryption keys remain strictly inside the link fragment (#).
        </p>
      </div>
    </div>
  );
}

export default function HowItWorksModal({ onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-zinc-100 shadow-2xl [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-zinc-950/50 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-700/80 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-emerald-500 transition-colors">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                ZeroBin User Manual
                <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  v1.0 Guide
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Step-by-step instructions for zero-knowledge paste sharing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white active:scale-95 transition-all duration-150"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Manual Steps Container */}
        <div className="space-y-4 text-xs font-sans">
          
          <ManualStepCard
            stepNumber="1"
            title="Creating Encrypted Payload"
            description="Type or paste your sensitive text, environment keys, or source code into the primary editor. Click 'Attach Encrypted File' to add file attachments up to 1 MB."
            icon={FileText}
            accentColor="emerald"
            tips={[
              "Use Ctrl + Enter (Cmd + Enter) to encrypt instantly",
              "Click Quick Presets to auto-fill common payload templates",
            ]}
          />

          <ManualStepCard
            stepNumber="2"
            title="Setting Key & Expiration Parameters"
            description="Configure expiration duration from 5 minutes to 7 days. Optionally set a custom Primary Passphrase and enable Burn-After-Reading."
            icon={Key}
            accentColor="emerald"
            tips={[
              "Burn-After-Reading permanently deletes the paste after 1 view",
              "Primary Passphrase enables double-layer PBKDF2 payload protection",
            ]}
          />

          <ManualStepCard
            stepNumber="3"
            title="Configuring Plausible Deniability (Decoy Mode)"
            description="Expand the Decoy panel to enter an innocent cover text (e.g. documentation or grocery list) along with a dedicated Decoy Passphrase. Handing over the decoy passphrase unlocks only the harmless payload under duress."
            icon={ShieldAlert}
            accentColor="amber"
            tips={[
              "Server cannot mathematically prove a real payload exists",
              "Ideal for high-security environments requiring coercion defense",
            ]}
          />

          <ManualStepCard
            stepNumber="4"
            title="Sharing & Decrypting"
            description="Click 'Create Encrypted Paste' to generate your share link or QR code. The decryption key is contained strictly within the link URL fragment (#)."
            icon={QrCode}
            accentColor="emerald"
            tips={[
              "URL fragments are processed locally by the browser and never sent over the network",
            ]}
          />

          <SecurityHighlights />

        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-[11px] font-mono text-zinc-500 flex items-center gap-1">
            <HelpCircle className="h-3.5 w-3.5 text-emerald-400" /> End-to-End Client Encrypted
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-semibold text-xs transition-all duration-150 shadow-md shadow-emerald-500/10"
          >
            Got it, thanks!
          </button>
        </div>

      </div>
    </div>
  );
}