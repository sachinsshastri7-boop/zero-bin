"use client";

import { useState } from "react";
import ShareModal from "@/components/ShareModal";
import { Lock, Sparkles, Shield } from "lucide-react";

export default function Home() {
  const [content, setContent] = useState("");
  const [ttl, setTtl] = useState("3600");
  const [burnAfterRead, setBurnAfterRead] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [modalData, setModalData] = useState<{
    shareUrl: string;
    expiresAt: number;
    burnAfterRead: boolean;
  } | null>(null);

  const byteSize = new Blob([content]).size;

  const handleEncryptAndShare = async () => {
    if (!content.trim()) {
      setError("Please enter text to encrypt.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Generate AES-256 Key
      const key = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encodedContent = new TextEncoder().encode(content);

      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encodedContent
      );

      const ciphertext = btoa(
        String.fromCharCode(...new Uint8Array(encryptedBuffer))
      );
      const ivBase64 = btoa(String.fromCharCode(...iv));

      const rawExportedKey = await crypto.subtle.exportKey("raw", key);
      const keyBase64 = btoa(
        String.fromCharCode(...new Uint8Array(rawExportedKey))
      );

      const res = await fetch("/api/pastes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ciphertext,
          iv: ivBase64,
          burnAfterRead,
          ttlSeconds: Number(ttl),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save paste.");
      }

      const shareableUrl = `${window.location.origin}/v/${data.id}#${keyBase64}`;
      setModalData({
        shareUrl: shareableUrl,
        expiresAt: data.expiresAt,
        burnAfterRead,
      });
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono">
            <Shield className="h-3.5 w-3.5" /> Zero-Knowledge Client-Side Encryption
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Zero<span className="text-emerald-400">Bin</span>
          </h1>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">
            Encrypt secrets in your browser using AES-GCM-256. Plaintext is never sent to the server.
          </p>
        </div>

        {/* Control Options */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <label className="text-xs text-zinc-400 font-medium">Expiration:</label>
            <select
              value={ttl}
              onChange={(e) => setTtl(e.target.value)}
              className="bg-zinc-800 text-zinc-200 text-xs rounded-lg px-3 py-1.5 border border-zinc-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="300">5 Minutes</option>
              <option value="3600">1 Hour</option>
              <option value="86400">24 Hours</option>
              <option value="604800">7 Days</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={burnAfterRead}
              onChange={(e) => setBurnAfterRead(e.target.checked)}
              className="rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500/20"
            />
            Burn after reading (single view)
          </label>
        </div>

        {/* Text Area */}
        <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/80 p-2 transition focus-within:border-emerald-500/50">
          <textarea
            rows={10}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste raw text, code, or private credentials here..."
            className="w-full resize-none bg-transparent p-3 font-mono text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none"
          />
          <div className="flex items-center justify-between border-t border-zinc-800/80 px-3 py-2 text-xs text-zinc-500 font-mono">
            <span>{content.length} chars</span>
            <span>{(byteSize / 1024).toFixed(2)} KB / 2.00 MB</span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleEncryptAndShare}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
        >
          {loading ? (
            <Sparkles className="h-4 w-4 animate-spin" />
          ) : (
            <Lock className="h-4 w-4" />
          )}
          {loading ? "Encrypting Payload..." : "Encrypt & Generate Link"}
        </button>
      </div>

      {modalData && (
        <ShareModal
          shareUrl={modalData.shareUrl}
          expiresAt={modalData.expiresAt}
          burnAfterRead={modalData.burnAfterRead}
          onClose={() => {
            setModalData(null);
            setContent("");
          }}
        />
      )}
    </main>
  );
}