import { BRANCHES } from "@/modules/game/branches";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "GATE Arcade — Play Free GATE Practice Game | Eduneuro",
  description:
    "Play GATE Arcade: a free 2D arcade shooter game that makes GATE CSE, ECE, EE preparation addictive. Answer questions, shoot falling targets, beat your score.",
  keywords: [
    "GATE game",
    "GATE arcade",
    "GATE practice game",
    "GATE CSE game",
    "GATE preparation game",
    "free GATE quiz game",
    "GATE shooter game",
    "Eduneuro",
  ],
  openGraph: {
    title: "GATE Arcade — Free GATE Practice Game",
    description:
      "Answer GATE questions in a fast-paced 2D arcade shooter. Choose your branch, aim, shoot the correct answer, and survive increasingly fast rounds.",
    type: "website",
  },
};

export default function BranchSelectPage() {
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
          <a
            key={b.id}
            href={`/game/play?branch=${b.id}`}
            className="group relative px-4 py-3 rounded-lg border border-gray-700 bg-gray-900/50 hover:border-gray-600 transition-all duration-150 text-center"
          >
            <div className="text-xs font-medium text-gray-400 mb-0.5">
              {b.code}
            </div>
            <div className="text-sm font-medium text-gray-300">
              {b.shortName}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
