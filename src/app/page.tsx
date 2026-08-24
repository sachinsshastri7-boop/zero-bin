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
  X,
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
        decoyPassphrase: decoyPassphrase.trim() || null,
        realPassphrase: passphrase.trim() || null,
      };

      const payloadString = JSON.stringify(payload);
      const enc = new TextEncoder();

      const activePassphrase = passphrase.trim() || decoyPassphrase.trim();

      let keyBase64 = "";
      let cryptoKey: CryptoKey;

      if (activePassphrase) {
        const keyMaterial = await crypto.subtle.importKey(
          "raw",
          enc.encode(activePassphrase),
          "PBKDF2",
          false,
          ["deriveKey"]
        );

        const salt = enc.encode("zero-bin-salt-2026");
        cryptoKey = await crypto.subtle.deriveKey(
          {
            name: "PBKDF2",
            salt,
            iterations: 100000,
            hash: "SHA-256",
          },
          keyMaterial,
          { name: "AES-GCM", length: 256 },
          true,
          ["encrypt", "decrypt"]
        );
      } else {
        cryptoKey = await crypto.subtle.generateKey(
          { name: "AES-GCM", length: 256 },
          true,
          ["encrypt", "decrypt"]
        );
        const exported = await crypto.subtle.exportKey("raw", cryptoKey);
        keyBase64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
      }

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
      const hashFragment = activePassphrase ? `${keyBase64}:pwd` : keyBase64;
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
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4">
      {showHowItWorks && (
        <HowItWorksModal onClose={() => setShowHowItWorks(false)} />
      )}

      <div className="w-full max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Zero<span className="text-emerald-400">Bin</span>
              </h1>
              <p className="text-xs text-zinc-400">
                Zero-Knowledge Encrypted Pastebin
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowHowItWorks(true)}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-emerald-500/30 hover:text-emerald-400 transition"
          >
            <HelpCircle className="h-4 w-4" /> How It Works
          </button>
        </div>

        {!createdUrl ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-zinc-800 bg-zinc-900/60">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-zinc-400">Expiration</span>
                  <select
                    value={ttl}
                    onChange={(e) => setTtl(e.target.value)}
                    className="rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-emerald-500/50 focus:outline-none"
                  >
                    <option value="300">5 Minutes</option>
                    <option value="3600">1 Hour</option>
                    <option value="86400">24 Hours</option>
                    <option value="604800">7 Days</option>
                  </select>
                </div>

                <div className="relative flex items-center">
                  <Key className="absolute left-2.5 h-3.5 w-3.5 text-zinc-500" />
                  <input
                    type="password"
                    placeholder="Optional Passphrase"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    className="w-44 rounded-lg border border-zinc-800 bg-zinc-950 pl-8 pr-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300 select-none">
                <input
                  type="checkbox"
                  checked={burnAfterRead}
                  onChange={(e) => setBurnAfterRead(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-emerald-500/20"
                />
                <Flame className="h-4 w-4 text-amber-500" /> Burn After Reading
              </label>
            </div>

            <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
              <textarea
                rows={10}
                placeholder="Paste your private code, credentials, or secret payload..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full resize-none bg-transparent font-mono text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none"
              />

              <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 text-xs text-zinc-500">
                <span>
                  {text.length} chars | {(new Blob([text]).size / 1024).toFixed(2)} KB
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer text-emerald-400 hover:text-emerald-300 transition font-medium">
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

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowDecoy(!showDecoy)}
                className="w-full flex items-center justify-between p-4 text-left text-xs font-semibold text-zinc-300 hover:bg-zinc-800/40 transition"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-400" />
                  Enable Decoy / Cover Payload (Plausible Deniability)
                </div>
                {showDecoy ? (
                  <ChevronUp className="h-4 w-4 text-zinc-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                )}
              </button>

              {showDecoy && (
                <div className="p-4 pt-0 space-y-3">
                  <p className="text-[11px] text-zinc-400">
                    Enter innocent cover text below. If someone asks for your secret, you can show this harmless cover payload instead.
                  </p>
                  
                  <textarea
                    rows={4}
                    placeholder="Innocent cover message (e.g. standard API docs or grocery list)..."
                    value={decoyText}
                    onChange={(e) => setDecoyText(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:border-amber-500/50 focus:outline-none resize-none"
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
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:border-amber-500/50 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || (!text.trim() && !attachment)}
              className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Encrypting Client-Side..." : "Create Encrypted Paste"}
            </button>
          </form>
        ) : (
          <div className="rounded-2xl border border-emerald-500/30 bg-zinc-900/60 p-6 space-y-6 text-center">
            <div className="space-y-2">
              <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-400">
                <Check className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Paste Encrypted & Stored</h2>
              <p className="text-xs text-zinc-400">
                The decryption key is strictly contained within the link URL hash fragment.
              </p>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl border border-zinc-800 bg-zinc-950">
              <input
                type="text"
                readOnly
                value={createdUrl}
                className="w-full bg-transparent px-2 font-mono text-xs text-emerald-400 focus:outline-none truncate"
              />
              <button
                onClick={copyUrl}
                className="flex items-center gap-1 shrink-0 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-emerald-400 transition"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={() => setShowQr(!showQr)}
                className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
              >
                <QrCode className="h-4 w-4" />
              </button>
            </div>

            {showQr && (
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl w-fit mx-auto">
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
              className="text-xs text-zinc-400 hover:text-white underline"
            >
              Create Another Paste
            </button>
          </div>
        )}
      </div>
    </main>
  );
}