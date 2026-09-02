import { Metadata } from "next";
import GamePlayClient from "./GamePlayClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Play GATE Arcade — Free GATE Practice Game | Eduneuro",
    description:
      "Play GATE Arcade: answer GATE questions in a fast-paced 2D arcade shooter. Choose CSE, ECE, EE, or other branches. Shoot the correct answer, build combos, beat your high score.",
    keywords: [
      "GATE arcade game",
      "GATE practice game",
      "GATE CSE game",
      "GATE shooter",
      "free GATE quiz game",
      "GATE preparation",
      "Eduneuro game",
    ],
    openGraph: {
      title: "GATE Arcade — Free GATE Practice Game",
      description:
        "Answer GATE questions in a 2D arcade shooter. Choose your branch, aim, shoot the correct answer, and survive increasingly fast rounds.",
      type: "website",
    },
  };
}

export default function GamePlayPage() {
  return <GamePlayClient />;
}
