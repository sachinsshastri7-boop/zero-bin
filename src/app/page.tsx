"use client";

import { useState } from "react";
import {
  Lock,
  Flame,
  Key,
  Paperclip,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Copy,
  Check,
  QrCode,
  Sparkles,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import HowItWorksModal from "@/components/HowItWorksModal";

export default function Home() {
  const [text, setText] = useState("");
  const [ttl, setTtl] = useState("3600");
  const [passphrase, setPassphrase] = useState("");
  const [burnAfterRead, setBurnAfterRead] = useState(false);

  // Attachment state
  const [attachment, setAttachment] = useState<{
    name: string;
    type: string;
    data: string;
  } | null>(null);

  // Decoy state
  const [showDecoy, setShowDecoy] = useState(false);
  const [decoyText, setDecoyText] = useState("");
  const [decoyPassphrase, setDecoyPassphrase] = useState("");

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      alert("File size exceeds 1 MB limit.");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !attachment) return;

    setIsSubmitting(true);

    try {
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

      const cryptoKey = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );
      const exported = await crypto.subtle.exportKey("raw", cryptoKey);
      const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(exported)));

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ivBase64 = btoa(String.fromCharCode(...new Uint8Array(iv)));

      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        cryptoKey,
        enc.encode(payloadString)
      );
      const ciphertextBase64 = btoa(
        String.fromCharCode(...new Uint8Array(encryptedBuffer))
      );

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

      if (!res.ok) throw new Error("Failed to store paste.");

      const { id } = await res.json();
      
      const hasPassword = passphrase.trim() || decoyPassphrase.trim();
      const hashFragment = hasPassword ? `${keyBase64}:pwd` : keyBase64;
      const fullUrl = `${window.location.origin}/v/${id}#${hashFragment}`;

      setCreatedUrl(fullUrl);
    } catch (err) {
      console.error("Encryption submit error:", err);
      alert("Error creating encrypted paste.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyUrl = async () => {
    if (!createdUrl) return;
    await navigator.clipboard.writeText(createdUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="relative min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4 selection:bg-emerald-500/30 selection:text-emerald-300 overflow-x-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-700/5 blur-[100px] rounded-full pointer-events-none" />

      {showHowItWorks && (
        <HowItWorksModal onClose={() => setShowHowItWorks(false)} />
      )}

      <div className="relative z-10 w-full max-w-3xl space-y-6 transition-all duration-300 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 group">
            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400 ring-1 ring-emerald-500/20 group-hover:scale-105 group-hover:ring-emerald-500/40 transition-all duration-300 shadow-lg shadow-emerald-500/5">
              <Lock className="h-6 w-6 transition-transform duration-300 group-hover:-rotate-12" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                Zero<span className="text-emerald-400">Bin</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </h1>
              <p className="text-xs text-zinc-400 font-medium">
                Zero-Knowledge Ephemeral Encrypted Pastebin
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowHowItWorks(true)}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-md px-3.5 py-2 text-xs font-medium text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-400 hover:bg-zinc-800/80 active:scale-95 transition-all duration-200 shadow-sm"
          >
            <HelpCircle className="h-4 w-4" /> How It Works
          </button>
        </div>

        {/* Creation Form */}
        {!createdUrl ? (
          <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-xl shadow-inner">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 font-medium">Expiration</span>
                  <select
                    value={ttl}
                    onChange={(e) => setTtl(e.target.value)}
                    className="rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-1.5 text-xs text-zinc-200 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all duration-200 cursor-pointer"
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
                    type="password"
                    placeholder="Optional Passphrase"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    className="w-44 rounded-xl border border-zinc-800 bg-zinc-950/80 pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all duration-200"
                  />
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
                <span className="group-hover:text-amber-400 transition-colors duration-200">Burn After Reading</span>
              </label>
            </div>

            {/* Main Text Editor */}
            <div className="relative rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-xl p-4 space-y-3 transition-all duration-300 focus-within:border-emerald-500/40 focus-within:ring-2 focus-within:ring-emerald-500/10 shadow-xl">
              <textarea
                rows={10}
                placeholder="Paste your private code, credentials, or secret payload..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full resize-none bg-transparent font-mono text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none scrollbar-thin scrollbar-thumb-zinc-800"
              />

              <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60 text-xs text-zinc-500 font-mono">
                <span>
                  {text.length} chars | {(new Blob([text]).size / 1024).toFixed(2)} KB
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer text-emerald-400 hover:text-emerald-300 active:scale-95 transition-all duration-150 font-sans font-medium">
                  <Paperclip className="h-4 w-4" />
                  {attachment ? attachment.name : "Attach File"}
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Plausible Deniability Accordion */}
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 backdrop-blur-md overflow-hidden transition-all duration-300">
              <button
                type="button"
                onClick={() => setShowDecoy(!showDecoy)}
                className="w-full flex items-center justify-between p-4 text-left text-xs font-semibold text-zinc-300 hover:bg-zinc-800/30 transition-colors duration-200"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-400" />
                  Enable Decoy / Cover Payload (Plausible Deniability)
                </div>
                <div className={`transform transition-transform duration-300 ${showDecoy ? "rotate-180" : "rotate-0"}`}>
                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                </div>
              </button>

              {showDecoy && (
                <div className="p-4 pt-0 space-y-3 animate-in fade-in duration-200">
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Enter innocent cover text below. If forced to reveal your secret, give the decoy passphrase to display this harmless payload instead.
                  </p>
                  
                  <textarea
                    rows={4}
                    placeholder="Innocent cover message (e.g. standard API docs or grocery list)..."
                    value={decoyText}
                    onChange={(e) => setDecoyText(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800/80 bg-zinc-950/80 p-3 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 focus:outline-none resize-none transition-all duration-200"
                  />

                  <div>
                    <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                      Decoy Passphrase (Coercion Trigger)
                    </label>
                    <input
                      type="password"
                      placeholder="Optional Decoy Passphrase..."
                      value={decoyPassphrase}
                      onChange={(e) => setDecoyPassphrase(e.target.value)}
                      className="w-full rounded-xl border border-zinc-800/80 bg-zinc-950/80 px-3 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 focus:outline-none transition-all duration-200"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={isSubmitting || (!text.trim() && !attachment)}
              className="group relative w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs uppercase tracking-wider transition-all duration-200 shadow-lg shadow-emerald-500/15 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <Lock className="h-4 w-4 animate-spin" /> Encrypting Client-Side...
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
          /* Share Link Box */
          <div className="rounded-2xl border border-emerald-500/30 bg-zinc-900/60 backdrop-blur-xl p-6 space-y-6 text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="space-y-2">
              <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30 animate-pulse">
                <Check className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Paste Encrypted & Stored</h2>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                The decryption key is strictly contained within the link URL hash fragment.
              </p>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
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
              Create Another Paste
            </button>
          </div>
        )}
      </div>
    </main>
  );
}