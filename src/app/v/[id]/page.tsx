"use client";

import { useEffect, useState, use } from "react";
import { decryptText } from "@/lib/crypto";
import PasteViewer from "@/components/PasteViewer";

export default function ViewPastePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [decryptedText, setDecryptedText] = useState<string | null>(null);
  const [isBurned, setIsBurned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAndDecrypt() {
      try {
        // 1. Extract secret key from window.location.hash
        const keyFromHash = window.location.hash.replace("#", "");

        if (!keyFromHash) {
          throw new Error("Missing decryption key in URL hash fragment.");
        }

        // 2. Fetch ciphertext from backend API
        const res = await fetch(`/api/pastes/${id}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Paste not found, expired, or burned.");
        }

        // 3. Client-side decryption
        const plaintext = await decryptText(data.ciphertext, data.iv, keyFromHash);
        setDecryptedText(plaintext);
        setIsBurned(data.burnAfterRead);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to decrypt paste.");
      } finally {
        setLoading(false);
      }
    }

    loadAndDecrypt();
  }, [id]);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-12 max-w-4xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-zinc-100">Encrypted Paste</h1>
        <p className="text-xs text-zinc-500 font-mono">ID: {id}</p>
      </header>

      {loading && (
        <div className="p-8 text-center text-zinc-400 font-mono text-sm animate-pulse">
          Fetching payload & decrypting locally...
        </div>
      )}

      {error && (
        <div className="p-6 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-sm space-y-2">
          <p className="font-bold">Decryption Failed</p>
          <p className="text-xs font-mono">{error}</p>
        </div>
      )}

      {decryptedText && (
        <PasteViewer decryptedText={decryptedText} isBurned={isBurned} />
      )}
    </main>
  );
}