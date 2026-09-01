"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BRANCHES } from "@/modules/game/branches";

export default function BranchSelectPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const startGame = () => {
    if (!selected) return;
    router.push(`/game/play?branch=${selected}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0e17] flex flex-col items-center justify-center p-6">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white tracking-tight mb-1">
          GATE
        </h1>
        <p className="text-lg text-cyan-400 font-medium tracking-widest">
          ARCADE
        </p>
        <p className="text-sm text-gray-500 mt-3">
          Select your branch to begin
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-3xl w-full mb-8">
        {BRANCHES.map((b) => (
          <button
            key={b.id}
            onClick={() => setSelected(b.id)}
            className={`group relative px-4 py-3 rounded-lg border transition-all duration-150 ${
              selected === b.id
                ? "border-cyan-400 bg-cyan-400/10 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                : "border-gray-700 bg-gray-900/50 hover:border-gray-600"
            }`}
          >
            <div className="text-xs font-medium text-gray-400 mb-0.5">
              {b.code}
            </div>
            <div
              className={`text-sm font-medium ${
                selected === b.id ? "text-cyan-300" : "text-gray-300"
              }`}
            >
              {b.shortName}
            </div>
            {selected === b.id && (
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400" />
            )}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={startGame}
          disabled={!selected}
          className="px-8 py-3 bg-cyan-500 text-gray-900 font-bold rounded-lg hover:bg-cyan-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          START GAME
        </button>
        <Link
          href="/"
          className="px-6 py-3 border border-gray-700 text-gray-400 rounded-lg hover:text-gray-200 hover:border-gray-600 transition-colors"
        >
          Back
        </Link>
      </div>
    </div>
  );
}
