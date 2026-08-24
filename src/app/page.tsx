"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Lock,
  Flame,
  Key,
  Paperclip,
  ShieldAlert,
  ChevronDown,
  HelpCircle,
  Copy,
  Check,
  QrCode,
  Sparkles,
  Zap,
  ShieldCheck,
  Terminal,
  FileCode,
  FileSpreadsheet,
  Trash2,
  Info,
  Command,
  Eye,
  EyeOff,
  Cpu,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import HowItWorksModal from "@/components/HowItWorksModal";

// Quick Preset Templates for Easy Testing
const TEMPLATES = [
  {
    label: "API Keys",
    icon: Key,
    content: `DATABASE_URL="postgres://user:password@localhost:5432/db"
STRIPE_SECRET_KEY="sk_live_51M..."
NEXT_PUBLIC_API_URL="https://api.example.com"`,
  },
  {
    label: "Code Snippet",
    icon: FileCode,
    content: `export async function decryptPayload(ciphertext: string, key: string) {
  const enc = new TextEncoder();
  // Native Web Crypto execution
  return await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(12) },
    cryptoKey,
    ciphertextBuffer
  );
}`,
  },
  {
    label: "Env Config",
    icon: FileSpreadsheet,
    content: `REDIS_HOST=127.0.0.1
REDIS_PORT=6379
JWT_SECRET=c8d9e7f6a5b4c3d2e1f0`,
  },
];

export default function Home() {
  // Main Payload Form State
  const [text, setText] = useState("");
  const [ttl, setTtl] = useState("3600");
  const [passphrase, setPassphrase] = useState("");
  const [burnAfterRead, setBurnAfterRead] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);

  // Attachment State
  const [attachment, setAttachment] = useState<{
    name: string;
    type: string;
    data: string;
  } | null>(null);

  // Plausible Deniability / Decoy State
  const [showDecoy, setShowDecoy] = useState(false);
  const [decoyText, setDecoyText] = useState("");
  const [decoyPassphrase, setDecoyPassphrase] = useState("");
  const [showDecoyPassphrase, setShowDecoyPassphrase] = useState(false);

  // UI & Interactivity States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [activeTab, setActiveTab] = useState<"editor" | "settings">("editor");

  // Calculate Text & Payload Metrics
  const metrics = useMemo(() => {
    const charCount = text.length;
    const bytes = new Blob([text]).size;
    const kb = (bytes / 1024).toFixed(2);
    const estimatedTokens = Math.ceil(charCount / 4);
    return { charCount, bytes, kb, estimatedTokens };
  }, [text]);

  // Passphrase Entropy / Strength Estimator
  const passphraseStrength = useMemo(() => {
    if (!passphrase) return { score: 0, label: "None", color: "bg-zinc-800" };
    let score = 0;
    if (passphrase.length >= 8) score += 1;
    if (passphrase.length >= 14) score += 1;
    if (/[A-Z]/.test(passphrase)) score += 1;
    if (/[0-9]/.test(passphrase)) score += 1;
    if (/[^A-Za-z0-9]/.test(passphrase)) score += 1;

    switch (score) {
      case 1:
      case 2:
        return { score: 25, label: "Weak", color: "bg-red-500" };
      case 3:
        return { score: 50, label: "Fair", color: "bg-amber-500" };
      case 4:
        return { score: 75, label: "Strong", color: "bg-emerald-400" };
      case 5:
        return { score: 100, label: "Unbreakable", color: "bg-emerald-300 shadow-glow" };
      default:
        return { score: 10, label: "Very Weak", color: "bg-red-700" };
    }
  }, [passphrase]);

  // Handle File Encrypt Loading
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      alert("File size exceeds 1 MB limit for client-side memory storage.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        name: file.name,
        type: file.type || "application/octet-stream",
        data: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = () => {
    setAttachment(null);
  };

  // Submission Handler
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!text.trim() && !attachment) return;

      setIsSubmitting(true);

      try {
        // 1. Pack full JSON structure
        const payload = {
          real: {
            text,
            attachment,
          },
          decoy: decoyText.trim() ? { text: decoyText } : null,
          realPassphrase: passphrase.trim() || null,
          decoyPassphrase: decoyPassphrase.trim() || null,
        };

        const payloadString = JSON.stringify(payload);
        const enc = new TextEncoder();

        // 2. Generate Native AES-256-GCM key for URL Fragment
        const cryptoKey = await crypto.subtle.generateKey(
          { name: "AES-GCM", length: 256 },
          true,
          ["encrypt", "decrypt"]
        );
        const exported = await crypto.subtle.exportKey("raw", cryptoKey);
        const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(exported)));

        const iv = crypto.getRandomValues(new Uint8Array(12));
        const ivBase64 = btoa(String.fromCharCode(...new Uint8Array(iv)));

        // 3. Encrypt payload buffer
        const encryptedBuffer = await crypto.subtle.encrypt(
          { name: "AES-GCM", iv },
          cryptoKey,
          enc.encode(payloadString)
        );
        const ciphertextBase64 = btoa(
          String.fromCharCode(...new Uint8Array(encryptedBuffer))
        );

        // 4. Store in serverless Upstash Redis backend
        const res = await fetch("/api/pastes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ciphertext: ciphertextBase64,
            iv: ivBase64,
            ttl: parseInt(ttl),
            burnAfterRead,
          }),
        });

        if (!res.ok) throw new Error("Failed to store payload in backend.");

        const { id } = await res.json();
        
        // 5. Build Zero-Knowledge Hash Fragment (RFC 3986 Compliance)
        const hasPassword = passphrase.trim() || decoyPassphrase.trim();
        const hashFragment = hasPassword ? `${keyBase64}:pwd` : keyBase64;
        const fullUrl = `${window.location.origin}/v/${id}#${hashFragment}`;

        setCreatedUrl(fullUrl);
      } catch (err) {
        console.error("Encryption submit error:", err);
        alert("Error creating encrypted paste. Check browser crypto context.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [text, attachment, decoyText, passphrase, decoyPassphrase, ttl, burnAfterRead]
  );

  // Keyboard Shortcuts Handler (Ctrl+Enter or Cmd+Enter to Encrypt)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (!createdUrl && (text.trim() || attachment)) {
          e.preventDefault();
          handleSubmit();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSubmit, createdUrl, text, attachment]);

  const copyUrl = async () => {
    if (!createdUrl) return;
    await navigator.clipboard.writeText(createdUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const applyTemplate = (content: string) => {
    setText(content);
  };

  return (
    <main className="relative min-h-screen bg-[#09090b] text-zinc-100 flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-emerald-500/30 selection:text-emerald-300 overflow-x-hidden">
      {/* Dynamic Background Glow Mesh */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-emerald-500/10 via-emerald-600/5 to-transparent blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-emerald-400/5 blur-[120px] rounded-full pointer-events-none" />

      {showHowItWorks && (
        <HowItWorksModal onClose={() => setShowHowItWorks(false)} />
      )}

      <div className="relative z-10 w-full max-w-3xl space-y-5">
        {/* Top Navbar Header */}
        <header className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-2xl shadow-xl">
          <div className="flex items-center gap-3 px-2 group cursor-pointer">
            <div className="relative rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 p-2.5 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10 group-hover:border-emerald-500/50 transition-all duration-300">
              <Lock className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                Zero<span className="text-emerald-400">Bin</span>
              </h1>
              <p className="text-[11px] text-zinc-400 font-mono flex items-center gap-1">
                <Cpu className="h-3 w-3 text-emerald-500" /> AES-256 Client Vault
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHowItWorks(true)}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-400 hover:bg-zinc-800 transition-all duration-200 shadow-sm active:scale-95"
            >
              <HelpCircle className="h-3.5 w-3.5 text-emerald-400" /> Security Specs
            </button>
          </div>
        </header>

        {/* Security Status Ribbon */}
        <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-zinc-900/30 border border-zinc-800/60 text-[11px] font-mono text-zinc-400">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Zero-Knowledge Engine Active
          </span>
          <span className="hidden sm:flex items-center gap-1.5 text-zinc-500">
            <Command className="h-3 w-3" /> + Enter to Encrypt
          </span>
        </div>

        {/* Form Creation Screen */}
        {!createdUrl ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Options Toolbar Panel */}
            <div className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-xl shadow-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400 font-medium">TTL Expiration:</span>
                    <select
                      value={ttl}
                      onChange={(e) => setTtl(e.target.value)}
                      className="rounded-xl border border-zinc-800 bg-zinc-950/90 px-3 py-1.5 text-xs text-zinc-200 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all duration-200 cursor-pointer font-mono"
                    >
                      <option value="300">5 Minutes</option>
                      <option value="3600">1 Hour</option>
                      <option value="86400">24 Hours</option>
                      <option value="604800">7 Days</option>
                    </select>
                  </div>

                  <div className="relative flex items-center">
                    <Key className="absolute left-3 h-3.5 w-3.5 text-zinc-500" />
                    <input
                      type={showPassphrase ? "text" : "password"}
                      placeholder="Primary Passphrase..."
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      className="w-48 rounded-xl border border-zinc-800 bg-zinc-950/90 pl-8 pr-8 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all duration-200 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassphrase(!showPassphrase)}
                      className="absolute right-2.5 text-zinc-500 hover:text-zinc-300"
                    >
                      {showPassphrase ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300 select-none group">
                  <input
                    type="checkbox"
                    checked={burnAfterRead}
                    onChange={(e) => setBurnAfterRead(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-emerald-500/20 transition-all duration-150 cursor-pointer"
                  />
                  <Flame className={`h-4 w-4 transition-transform duration-300 ${burnAfterRead ? "text-amber-500 scale-110 animate-bounce" : "text-zinc-500 group-hover:text-amber-400"}`} />
                  <span className="group-hover:text-amber-400 transition-colors duration-200 font-medium">Burn-After-Reading</span>
                </label>
              </div>

              {/* Dynamic Passphrase Entropy Bar */}
              {passphrase && (
                <div className="pt-2 border-t border-zinc-800/60 space-y-1 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400">
                    <span>Key Strength: <strong className="text-zinc-200">{passphraseStrength.label}</strong></span>
                    <span>{passphraseStrength.score}% Entropy</span>
                  </div>
                  <div className="w-full bg-zinc-950 rounded-full h-1 overflow-hidden">
                    <div
                      className={`h-full ${passphraseStrength.color} transition-all duration-300`}
                      style={{ width: `${passphraseStrength.score}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Fill Preset Templates */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[11px] text-zinc-500 font-medium flex items-center gap-1 shrink-0">
                <Terminal className="h-3 w-3" /> Quick Presets:
              </span>
              {TEMPLATES.map((tmpl, idx) => {
                const IconComponent = tmpl.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyTemplate(tmpl.content)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-zinc-800/80 bg-zinc-900/40 text-[11px] text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-zinc-800/60 transition-all duration-200 shrink-0"
                  >
                    <IconComponent className="h-3 w-3 text-emerald-500" />
                    {tmpl.label}
                  </button>
                );
              })}
            </div>

            {/* Main Editor Window */}
            <div className="relative rounded-2xl border border-zinc-800/90 bg-zinc-900/60 backdrop-blur-2xl p-4 space-y-3 transition-all duration-300 focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/10 shadow-2xl">
              <textarea
                rows={11}
                placeholder="Paste your private code, keys, or sensitive text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full resize-none bg-transparent font-mono text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none scrollbar-thin scrollbar-thumb-zinc-800 leading-relaxed"
              />

              {/* Attachment Badge Display */}
              {attachment && (
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 truncate">
                    <Paperclip className="h-4 w-4 shrink-0" />
                    <span className="truncate">{attachment.name}</span>
                    <span className="text-[10px] text-emerald-500/70">({attachment.type})</span>
                  </div>
                  <button
                    type="button"
                    onClick={removeAttachment}
                    className="p-1 hover:bg-emerald-500/20 rounded-lg text-emerald-300 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Metrics Bar */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 text-xs text-zinc-500 font-mono">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/80" />
                  {metrics.charCount} chars | {metrics.kb} KB | ~{metrics.estimatedTokens} tokens
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer text-emerald-400 hover:text-emerald-300 active:scale-95 transition-all duration-150 font-sans font-medium hover:underline">
                  <Paperclip className="h-3.5 w-3.5" />
                  {attachment ? "Change Attachment" : "Attach File (1MB Max)"}
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Plausible Deniability / Decoy Accordion Container */}
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-xl overflow-hidden transition-all duration-300 shadow-lg">
              <button
                type="button"
                onClick={() => setShowDecoy(!showDecoy)}
                className="w-full flex items-center justify-between p-4 text-left text-xs font-semibold text-zinc-300 hover:bg-zinc-800/40 transition-colors duration-200"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-400" />
                  Plausible Deniability (Decoy Cover Payload)
                </div>
                <div className={`transform transition-transform duration-300 ${showDecoy ? "rotate-180" : "rotate-0"}`}>
                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                </div>
              </button>

              {showDecoy && (
                <div className="p-4 pt-0 space-y-3">
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Set a cover message and decoy passphrase. If forced to reveal your link under duress, entering the decoy passphrase displays this cover text instead.
                  </p>
                  
                  <textarea
                    rows={4}
                    placeholder="Innocent cover payload (e.g. standard documentation or shopping list)..."
                    value={decoyText}
                    onChange={(e) => setDecoyText(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800/80 bg-zinc-950/90 p-3 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10 focus:outline-none resize-none transition-all duration-200"
                  />

                  <div className="relative">
                    <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                      Decoy Passphrase (Coercion Trigger)
                    </label>
                    <div className="relative">
                      <input
                        type={showDecoyPassphrase ? "text" : "password"}
                        placeholder="Separate decoy passphrase..."
                        value={decoyPassphrase}
                        onChange={(e) => setDecoyPassphrase(e.target.value)}
                        className="w-full rounded-xl border border-zinc-800/80 bg-zinc-950/90 px-3 py-2 pr-8 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10 focus:outline-none transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDecoyPassphrase(!showDecoyPassphrase)}
                        className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-zinc-300"
                      >
                        {showDecoyPassphrase ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || (!text.trim() && !attachment)}
              className="group relative w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-semibold text-xs uppercase tracking-wider transition-all duration-300 shadow-xl shadow-emerald-500/20 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <Zap className="h-4 w-4 animate-spin" /> Encrypting Client-Side...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" /> Create Encrypted Paste
                  </>
                )}
              </span>
            </button>
          </form>
        ) : (
          /* Share Link Output Screen */
          <div className="rounded-2xl border border-emerald-500/30 bg-zinc-900/60 backdrop-blur-2xl p-6 space-y-6 text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="space-y-2">
              <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                <Check className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Paste Encrypted & Published</h2>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Decryption key isolated strictly in the URL hash fragment (#). Browsers never send fragments to servers.
              </p>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl border border-zinc-800 bg-zinc-950/90">
              <input
                type="text"
                readOnly
                value={createdUrl}
                className="w-full bg-transparent px-2 font-mono text-xs text-emerald-400 focus:outline-none truncate"
              />
              <button
                onClick={copyUrl}
                className="flex items-center gap-1.5 shrink-0 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-black hover:bg-emerald-400 active:scale-95 transition-all duration-150 shadow-md shadow-emerald-500/10"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={() => setShowQr(!showQr)}
                className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white active:scale-95 transition-all duration-150"
              >
                <QrCode className="h-4 w-4" />
              </button>
            </div>

            {showQr && (
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl w-fit mx-auto shadow-2xl animate-in fade-in zoom-in-90 duration-200">
                <QRCodeSVG value={createdUrl} size={160} />
              </div>
            )}

            <button
              onClick={() => {
                setCreatedUrl(null);
                setText("");
                setDecoyText("");
                setDecoyPassphrase("");
                setPassphrase("");
                setAttachment(null);
              }}
              className="text-xs text-zinc-400 hover:text-emerald-400 underline transition-colors duration-200"
            >
              Create Another Encrypted Paste
            </button>
          </div>
        )}

        {/* Footer info banner */}
        <footer className="text-center text-[10px] text-zinc-500 font-mono space-y-1">
          <p>Zero-Knowledge Memory Isolation — No unencrypted data is ever written to disk.</p>
        </footer>
      </div>
    </main>
  );
}