"use client";

import { useState } from "react";
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
    <main className="relative min-h-screen bg-[#09090b] text-zinc-100 flex flex-col items-center justify-center p-4 selection:bg-emerald-500/30 selection:text-emerald-300 overflow-x-hidden">
      {/* Background Gradient Mesh */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-emerald-500/10 via-emerald-600/5 to-transparent blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-[300px] h-[300px] bg-emerald-400/5 blur-[100px] rounded-full pointer-events-none" />

      {showHowItWorks && (
        <HowItWorksModal onClose={() => setShowHowItWorks(false)} />
      )}

      <div className="relative z-10 w-full max-w-3xl space-y-6">
        {/* Top Navbar */}
        <header className="flex items-center justify-between p-2 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-2xl shadow-xl">
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
              <p className="text-[11px] text-zinc-400 font-mono">
                AES-256-GCM Ephemeral Vault
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowHowItWorks(true)}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-400 hover:bg-zinc-800 transition-all duration-200 shadow-sm active:scale-95"
          >
            <HelpCircle className="h-3.5 w-3.5 text-emerald-400" /> Security Guide
          </button>
        </header>

        {/* Form Box */}
        {!createdUrl ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Toolbar Panel */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-xl shadow-xl">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 font-medium">TTL:</span>
                  <select
                    value={ttl}
                    onChange={(e) => setTtl(e.target.value)}
                    className="rounded-xl border border-zinc-800 bg-zinc-950/90 px-3 py-1.5 text-xs text-zinc-200 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all duration-200 cursor-pointer"
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
                    placeholder="Primary Passphrase..."
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    className="w-48 rounded-xl border border-zinc-800 bg-zinc-950/90 pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all duration-200 font-mono"
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
                <span className="group-hover:text-amber-400 transition-colors duration-200 font-medium">Burn-After-Reading</span>
              </label>
            </div>

            {/* Main Code Editor */}
            <div className="relative rounded-2xl border border-zinc-800/90 bg-zinc-900/60 backdrop-blur-2xl p-4 space-y-3 transition-all duration-300 focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/10 shadow-2xl">
              <textarea
                rows={11}
                placeholder="Paste your private code, keys, or sensitive text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full resize-none bg-transparent font-mono text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none scrollbar-thin scrollbar-thumb-zinc-800 leading-relaxed"
              />

              <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 text-xs text-zinc-500 font-mono">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/80" />
                  {text.length} chars | {(new Blob([text]).size / 1024).toFixed(2)} KB
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer text-emerald-400 hover:text-emerald-300 active:scale-95 transition-all duration-150 font-sans font-medium hover:underline">
                  <Paperclip className="h-3.5 w-3.5" />
                  {attachment ? attachment.name : "Attach Encrypted File"}
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Plausible Deniability Accordion */}
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

                  <div>
                    <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                      Decoy Passphrase (Coercion Trigger)
                    </label>
                    <input
                      type="password"
                      placeholder="Separate decoy passphrase..."
                      value={decoyPassphrase}
                      onChange={(e) => setDecoyPassphrase(e.target.value)}
                      className="w-full rounded-xl border border-zinc-800/80 bg-zinc-950/90 px-3 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10 focus:outline-none transition-all duration-200"
                    />
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
          /* Share Link Box */
          <div className="rounded-2xl border border-emerald-500/30 bg-zinc-900/60 backdrop-blur-2xl p-6 space-y-6 text-center shadow-2xl">
            <div className="space-y-2">
              <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                <Check className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Paste Encrypted & Published</h2>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Decryption key isolated strictly in the URL hash fragment (#).
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
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl w-fit mx-auto shadow-2xl">
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