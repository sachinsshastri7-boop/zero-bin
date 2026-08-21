"use client";

interface OptionsBarProps {
  ttlSeconds: number;
  setTtlSeconds: (val: number) => void;
  burnAfterRead: boolean;
  setBurnAfterRead: (val: boolean) => void;
}

export default function OptionsBar({
  ttlSeconds,
  setTtlSeconds,
  burnAfterRead,
  setBurnAfterRead,
}: OptionsBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-zinc-900 rounded-lg border border-zinc-800 text-sm">
      <div className="flex items-center gap-2">
        <label htmlFor="ttl" className="text-zinc-400 font-medium">
          Expiration (TTL):
        </label>
        <select
          id="ttl"
          value={ttlSeconds}
          onChange={(e) => setTtlSeconds(Number(e.target.value))}
          className="bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-emerald-500"
        >
          <option value={300}>5 Minutes</option>
          <option value={3600}>1 Hour</option>
          <option value={86400}>24 Hours</option>
          <option value={604800}>7 Days</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="burn"
          checked={burnAfterRead}
          onChange={(e) => setBurnAfterRead(e.target.checked)}
          className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-emerald-500 focus:ring-emerald-500 accent-emerald-500"
        />
        <label htmlFor="burn" className="text-zinc-300 font-medium cursor-pointer">
          Burn After Reading (Single View)
        </label>
      </div>
    </div>
  );
}