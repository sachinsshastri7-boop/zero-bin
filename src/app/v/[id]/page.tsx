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
  Download,
  Paperclip,
  KeyRound,
  ShieldAlert,
} from "lucide-react";

interface PasteData {
  ciphertext: string;
  iv: string;
  burnAfterRead: boolean;
  createdAt: number;
}

interface DecryptedPayload {
  real: {
    text: string;
    attachment?: {
      name: string;
      type: string;
      data: string;
    } | null;
  };
  decoy?: {
    text: string;
  } | null;
  realPassphrase?: string | null;
  decoyPassphrase?: string | null;
}

export default function DecryptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pasteInfo, setPasteInfo] = useState<PasteData | null>(null);
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  // Passphrase state
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [inputPassword, setInputPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  // Decrypted outputs
  const [displayText, setDisplayText] = useState<string>("");
  const [attachment, setAttachment] = useState<DecryptedPayload["real"]["attachment"]>(null);
  const [isDecoyView, setIsDecoyView] = useState(false);

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

        if (hash.includes(":pwd")) {
          setRequiresPassword(true);
          setLoading(false);
          return;
        }

        await decryptWithRawKey(hash, data);
      } catch (err: any) {
        console.error("Decryption error:", err);
        setError(
          err.message || "Failed to decrypt payload. Invalid key or corrupt data."
        );
        setLoading(false);
      }
    }

    fetchAndDecrypt();
  }, [id]);

  const decryptWithRawKey = async (rawKeyBase64: string, data: PasteData) => {
    const rawKey = Uint8Array.from(atob(rawKeyBase64), (c) => c.charCodeAt(0));
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      rawKey,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    const iv = Uint8Array.from(atob(data.iv), (c) => c.charCodeAt(0));
    const ciphertext = Uint8Array.from(atob(data.ciphertext), (c) =>
      c.charCodeAt(0)
    );

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      cryptoKey,
      ciphertext
    );

    const decoded = new TextDecoder().decode(decryptedBuffer);
    
    try {
      const parsed: DecryptedPayload = JSON.parse(decoded);
      setDisplayText(parsed.real?.text || "");
      setAttachment(parsed.real?.attachment || null);
    } catch {
      setDisplayText(decoded);
    }
    
    setLoading(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPassword.trim() || !pasteInfo) return;

    setLoading(true);
    setPasswordError(false);

    try {
      const hash = window.location.hash.substring(1).split(":")[0];
      const rawKey = Uint8Array.from(atob(hash), (c) => c.charCodeAt(0));
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        rawKey,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
      );

      const iv = Uint8Array.from(atob(pasteInfo.iv), (c) => c.charCodeAt(0));
      const ciphertext = Uint8Array.from(atob(pasteInfo.ciphertext), (c) =>
        c.charCodeAt(0)
      );

      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        cryptoKey,
        ciphertext
      );

      const decoded = new TextDecoder().decode(decryptedBuffer);
      const parsed: DecryptedPayload = JSON.parse(decoded);

      if (parsed.decoyPassphrase && inputPassword === parsed.decoyPassphrase) {
        setDisplayText(parsed.decoy?.text || "No cover text set.");
        setIsDecoyView(true);
        setAttachment(null);
      } else if (parsed.realPassphrase && inputPassword === parsed.realPassphrase) {
        setDisplayText(parsed.real.text);
        setAttachment(parsed.real.attachment || null);
        setIsDecoyView(false);
      } else {
        throw new Error("Incorrect passphrase");
      }
      
      setRequiresPassword(false);
    } catch (err) {
      console.error(err);
      setPasswordError(true);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!displayText) return;
    await navigator.clipboard.writeText(displayText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = displayText ? displayText.split("\n") : [];

  return (
    <main className="relative min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4 selection:bg-emerald-500/30 selection:text-emerald-300 overflow-x-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-3xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono shadow-inner">
            <Unlock className="h-3.5 w-3.5 animate-pulse" /> Client-Side Decryption
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Encrypted <span className="text-emerald-400">Payload</span>
          </h1>
        </div>

        {loading && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-xl p-12 text-center space-y-3 shadow-2xl animate-pulse">
            <Lock className="h-8 w-8 text-emerald-400 animate-spin mx-auto" />
            <p className="text-sm text-zinc-400 font-mono">
              Decrypting payload in browser...
            </p>
          </div>
        )}

        {/* Passphrase Prompt */}
        {!loading && requiresPassword && (
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-xl p-8 max-w-md mx-auto space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3.5 rounded-full bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-500/5">
                <KeyRound className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-100">
                Passphrase Required
              </h3>
              <p className="text-xs text-zinc-400">
                Enter primary passphrase or decoy passphrase.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <div>
                <input
                  type="password"
                  placeholder="Enter secret passphrase..."
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700/80 bg-zinc-800/80 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all duration-200"
                />
              </div>

              {passwordError && (
                <p className="text-xs text-red-400 text-center font-mono animate-shake">
                  Incorrect passphrase. Decryption failed.
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-all duration-200 shadow-lg shadow-emerald-500/15 active:scale-95"
              >
                Decrypt Paste
              </button>
            </form>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 backdrop-blur-xl p-8 text-center space-y-3 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
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

        {/* Decrypted Output */}
        {!loading && !requiresPassword && !error && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* Decoy Warning Banner */}
            {isDecoyView && (
              <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-400 backdrop-blur-md">
                <ShieldAlert className="h-5 w-5 shrink-0 animate-bounce" />
                <div className="text-xs">
                  <span className="font-semibold">Decoy Payload Active:</span>{" "}
                  Displaying cover payload revealed by decoy passphrase.
                </div>
              </div>
            )}

            {/* Burn Warning Banner */}
            {pasteInfo?.burnAfterRead && (
              <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-400 backdrop-blur-md">
                <Flame className="h-5 w-5 shrink-0 animate-pulse" />
                <div className="text-xs">
                  <span className="font-semibold">Burn After Reading Active:</span>{" "}
                  This paste has been purged from the database and cannot be reloaded.
                </div>
              </div>
            )}

            {/* View Action Bar */}
            <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRaw(!showRaw)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 active:scale-95 ${
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
                className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-black transition-all duration-150 hover:bg-emerald-400 active:scale-95 shadow-md shadow-emerald-500/10"
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

            {/* Attachment Section */}
            {attachment && !isDecoyView && (
              <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-400 backdrop-blur-md">
                <div className="flex items-center gap-3 truncate">
                  <Paperclip className="h-5 w-5 shrink-0" />
                  <div className="truncate">
                    <p className="text-xs font-semibold font-mono truncate">
                      {attachment.name}
                    </p>
                    <p className="text-[10px] text-emerald-500/80">
                      Decrypted File Attachment ({attachment.type})
                    </p>
                  </div>
                </div>
                <a
                  href={attachment.data}
                  download={attachment.name}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-black transition-all duration-150 hover:bg-emerald-400 active:scale-95 shrink-0"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
              </div>
            )}

            {/* Text Viewer */}
            <div className="relative rounded-2xl border border-zinc-800/80 bg-zinc-900/70 backdrop-blur-xl overflow-hidden shadow-2xl">
              {showRaw ? (
                <textarea
                  readOnly
                  rows={12}
                  value={displayText}
                  className="w-full resize-none bg-transparent p-4 font-mono text-sm text-zinc-200 focus:outline-none"
                />
              ) : (
                <div className="p-4 font-mono text-sm overflow-x-auto max-h-[500px]">
                  <table className="w-full border-collapse">
                    <tbody>
                      {lines.map((line, idx) => (
                        <tr key={idx} className="hover:bg-zinc-800/40 transition-colors duration-100">
                          <td className="w-12 select-none text-right pr-4 text-xs text-zinc-600 border-r border-zinc-800/80">
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
              <div className="flex items-center justify-between border-t border-zinc-800/80 px-4 py-2.5 text-xs text-zinc-500 font-mono bg-zinc-950/50 backdrop-blur-md">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-emerald-400" /> AES-256 Verified
                </span>
                <span>{lines.length} lines</span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-center pt-2">
              <a
                href="/"
                className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-emerald-400 transition-colors duration-200"
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