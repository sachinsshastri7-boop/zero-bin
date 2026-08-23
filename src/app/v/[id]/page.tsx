"use client";

import { useEffect, useState, use } from "react";
import {
  Lock,
  Unlock,
  Copy,
  Check,
  Flame,
  AlertTriangle,
  FileText,
  Clock,
  ExternalLink,
} from "lucide-react";

interface PasteData {
  ciphertext: string;
  iv: string;
  burnAfterRead: boolean;
  createdAt: number;
}

export default function DecryptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decryptedText, setDecryptedText] = useState<string | null>(null);
  const [pasteInfo, setPasteInfo] = useState<PasteData | null>(null);
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    async function fetchAndDecrypt() {
      try {
        const hash = window.location.hash.substring(1);
        if (!hash) {
          setError("Decryption key missing in URL fragment (#).");
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/pastes/${id}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Paste not found or expired.");
        }

        const data: PasteData = await res.json();
        setPasteInfo(data);

        // Decode Key from URL hash
        const rawKey = Uint8Array.from(atob(hash), (c) => c.charCodeAt(0));
        const cryptoKey = await crypto.subtle.importKey(
          "raw",
          rawKey,
          { name: "AES-GCM" },
          false,
          ["decrypt"]
        );

        // Decode IV & Ciphertext
        const iv = Uint8Array.from(atob(data.iv), (c) => c.charCodeAt(0));
        const ciphertext = Uint8Array.from(atob(data.ciphertext), (c) =>
          c.charCodeAt(0)
        );

        // Decrypt
        const decryptedBuffer = await crypto.subtle.decrypt(
          { name: "AES-GCM", iv },
          cryptoKey,
          ciphertext
        );

        const decoded = new TextDecoder().decode(decryptedBuffer);
        setDecryptedText(decoded);
      } catch (err: any) {
        console.error("Decryption error:", err);
        setError(
          err.message || "Failed to decrypt payload. Invalid key or corrupt data."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchAndDecrypt();
  }, [id]);

  const copyToClipboard = async () => {
    if (!decryptedText) return;
    await navigator.clipboard.writeText(decryptedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = decryptedText ? decryptedText.split("\n") : [];

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono">
            <Unlock className="h-3.5 w-3.5" /> Client-Side Decryption
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Encrypted <span className="text-emerald-400">Payload</span>
          </h1>
        </div>

        {loading && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-12 text-center space-y-3">
            <Lock className="h-8 w-8 text-emerald-400 animate-pulse mx-auto" />
            <p className="text-sm text-zinc-400 font-mono">
              Decrypting payload in browser...
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center space-y-3">
            <AlertTriangle className="h-8 w-8 text-red-400 mx-auto" />
            <h3 className="text-base font-semibold text-red-300">
              Unable to Decrypt
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">{error}</p>
            <a
              href="/"
              className="inline-block mt-2 text-xs text-emerald-400 hover:underline"
            >
              Create a new paste &rarr;
            </a>
          </div>
        )}

        {decryptedText && (
          <div className="space-y-4">
            {/* Burn Warning Banner */}
            {pasteInfo?.burnAfterRead && (
              <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-400">
                <Flame className="h-5 w-5 shrink-0" />
                <div className="text-xs">
                  <span className="font-semibold">Burn After Reading Active:</span>{" "}
                  This paste has been deleted from the server and cannot be viewed again.
                </div>
              </div>
            )}

            {/* View Controls & Action Bar */}
            <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRaw(!showRaw)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
                    showRaw
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  {showRaw ? "Formatted View" : "Raw Text"}
                </button>
              </div>

              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-black transition hover:bg-emerald-400 shadow-md shadow-emerald-500/10"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Copied Payload
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy Text
                  </>
                )}
              </button>
            </div>

            {/* Decrypted Text Viewer */}
            <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/80 overflow-hidden">
              {showRaw ? (
                <textarea
                  readOnly
                  rows={12}
                  value={decryptedText}
                  className="w-full resize-none bg-transparent p-4 font-mono text-sm text-zinc-200 focus:outline-none"
                />
              ) : (
                <div className="p-4 font-mono text-sm overflow-x-auto max-h-[500px]">
                  <table className="w-full border-collapse">
                    <tbody>
                      {lines.map((line, idx) => (
                        <tr key={idx} className="hover:bg-zinc-800/30">
                          <td className="w-12 select-none text-right pr-4 text-xs text-zinc-600 border-r border-zinc-800">
                            {idx + 1}
                          </td>
                          <td className="pl-4 whitespace-pre-wrap text-zinc-200">
                            {line || " "}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Status Footer */}
              <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-2.5 text-xs text-zinc-500 font-mono bg-zinc-950/40">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-emerald-400" /> AES-256 Verified
                </span>
                <span>{lines.length} lines</span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-center pt-2">
              <a
                href="/"
                className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-emerald-400 transition"
              >
                Create your own encrypted paste <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}