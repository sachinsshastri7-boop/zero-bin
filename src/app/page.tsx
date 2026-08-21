"use client";

import { useState } from "react";
import { encryptText } from "@/lib/crypto";
import OptionsBar from "@/components/OptionsBar";
import ShareModal from "@/components/ShareModal";

export default function Home() {
  const [text, setText] = useState("");
  const [ttlSeconds, setTtlSeconds] = useState(86400);
  const [burnAfterRead, setBurnAfterRead] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreatePaste = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Client-side encryption
      const { ciphertext, iv, secretKeyHash } = await encryptText(text);

      // 2. Post ciphertext to backend (key is NOT included)
      const res = await fetch("/api/pastes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ciphertext, iv, burnAfterRead, ttlSeconds }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create paste");

      // 3. Form final URL with key in the `#` fragment
      const fullUrl = `${window.location.origin}/v/${data.id}#${secretKeyHash}`;
      setShareUrl(fullUrl);
      setText("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-12 max-w-4xl mx-auto space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
          ZeroBin
        </h1>
        <p className="text-sm text-zinc-400">
          Zero-Knowledge Ephemeral Paste Platform (AES-GCM-256 Client-Side Encryption)
        </p>
      </header>

      <OptionsBar
        ttlSeconds={ttlSeconds}
        setTtlSeconds={setTtlSeconds}
        burnAfterRead={burnAfterRead}
        setBurnAfterRead={setBurnAfterRead}
      />

      <div className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste sensitive text, code, or private information here..."
          className="w-full h-80 bg-zinc-900 border border-zinc-800 rounded-xl p-4 font-mono text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 resize-none"
        />

        {error && <p className="text-red-400 text-sm font-medium">{error}</p>}

        <button
          onClick={handleCreatePaste}
          disabled={loading || !text.trim()}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-black font-bold rounded-xl transition-colors shadow-lg disabled:cursor-not-allowed"
        >
          {loading ? "Encrypting & Saving..." : "Encrypt & Share"}
        </button>
      </div>

      {shareUrl && (
        <ShareModal url={shareUrl} onClose={() => setShareUrl(null)} />
      )}
    </main>
  );
}