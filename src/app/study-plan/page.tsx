/**
 * Study Planner — /study-plan
 *
 * Personalized GATE study plan generator based on target exam date and branch.
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Target,
  Clock,
  BookOpen,
  CheckCircle,
  ChevronRight,
  Sparkles,
  Lock,
  BarChart3,
  Flame,
} from "@/components/pyq/PYQIcons";

type StudyPlan = {
  id: string;
  branchCode: string;
  branchName: string;
  targetDate: string;
  weeksRemaining: number;
  dailyTargetMinutes: number;
  phases: Array<{
    name: string;
    weeks: number;
    subjects: string[];
    focus: string;
    tasks: string[];
  }>;
  weeklySchedule: Array<{
    day: string;
    subjects: string[];
    tasks: string[];
    durationMinutes: number;
  }>;
  milestones: Array<{
    date: string;
    title: string;
    description: string;
  }>;
};

export default function StudyPlanPage() {
  const router = useRouter();
  const { isPremium, user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [branch, setBranch] = useState("CS");
  const [targetDate, setTargetDate] = useState("");
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Default to exam date (Feb 2027)
    const defaultDate = new Date("2027-02-01");
    setTargetDate(defaultDate.toISOString().split("T")[0]);
  }, []);

  const generatePlan = async () => {
    setGenerating(true);
    setLoading(true);

    try {
      const res = await fetch("/api/study/plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchCode: branch, targetDate }),
      });
      const data = await res.json();
      if (data.plan) setPlan(data.plan);
    } catch {
      // Generate local plan
      const examDate = new Date(targetDate);
      const today = new Date();
      const totalDays = Math.max(1, Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
      const totalWeeks = Math.ceil(totalDays / 7);

      const branchNames: Record<string, string> = {
        CS: "Computer Science & IT",
        EC: "Electronics & Communication",
        EE: "Electrical Engineering",
        ME: "Mechanical Engineering",
        CE: "Civil Engineering",
      };

      const subjectsByBranch: Record<string, string[]> = {
        CS: ["Engineering Mathematics", "Digital Logic", "Computer Organization", "Programming & DS", "Algorithms", "TOC", "Compiler Design", "OS", "Databases", "Computer Networks", "General Aptitude"],
        EC: ["Engineering Mathematics", "Networks", "Electronic Devices", "Analog Circuits", "Digital Circuits", "Signals & Systems", "Control Systems", "Communications", "EMFT", "General Aptitude"],
        EE: ["Engineering Mathematics", "Electric Circuits", "Electromagnetic Fields", "Signals & Systems", "Electrical Machines", "Power Systems", "Control Systems", "Measurements", "General Aptitude"],
        ME: ["Engineering Mathematics", "Applied Mechanics", "Thermodynamics", "Manufacturing", "Industrial Engineering", "Fluid Mechanics", "Heat Transfer", "Theory of Machines", "General Aptitude"],
        CE: ["Engineering Mathematics", "Structural Engineering", "Geotechnical Engineering", "Water Resources", "Environmental Engineering", "Transportation", "Geomatics", "General Aptitude"],
      };

      const subjects = subjectsByBranch[branch] || subjectsByBranch.CS;
      const coreSubjects = subjects.slice(0, -1);
      const aptitude = subjects[subjects.length - 1];

      const phases = [
        {
          name: "Foundation Phase",
          weeks: Math.max(1, Math.floor(totalWeeks * 0.3)),
          subjects: coreSubjects.slice(0, 4),
          focus: "Build strong fundamentals in core subjects",
          tasks: [
            "Complete NCERT/standard textbook for each subject",
            "Make concise notes for formulas and concepts",
            "Solve basic problems to reinforce understanding",
            "Watch video lectures for difficult topics",
          ],
        },
        {
          name: "Intensive Phase",
          weeks: Math.max(1, Math.floor(totalWeeks * 0.35)),
          subjects: coreSubjects.slice(2),
          focus: "Deep dive into remaining subjects + PYQ practice",
          tasks: [
            "Solve subject-wise PYQs (last 10 years)",
            "Focus on weak areas identified during foundation",
            "Create topic-wise formula sheets",
            "Practice full-length subject tests",
          ],
        },
        {
          name: "Revision Phase",
          weeks: Math.max(1, Math.floor(totalWeeks * 0.25)),
          subjects: [...coreSubjects, aptitude],
          focus: "Full revision + mock tests + weak topic focus",
          tasks: [
            "Revise all formula sheets",
            "Take full-length mock tests weekly",
            "Analyze mock test performance",
            "Focus on high-frequency topics",
          ],
        },
        {
          name: "Final Sprint",
          weeks: Math.max(1, totalWeeks - Math.floor(totalWeeks * 0.3) - Math.floor(totalWeeks * 0.35) - Math.floor(totalWeeks * 0.25)),
          subjects: [...coreSubjects.slice(0, 3), aptitude],
          focus: "Quick revision + mock tests + formula review",
          tasks: [
            "Revise only formula sheets and short notes",
            "Take one mock test daily",
            "Review PYQs of last 2 years",
            "Focus on time management",
          ],
        },
      ];

      // Generate weekly schedule
      const weeklySchedule = [];
      const studyDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      for (let w = 0; w < Math.min(totalWeeks, 12); w++) {
        for (let d = 0; d < studyDays.length; d++) {
          weeklySchedule.push({
            day: `Week ${w + 1} - ${studyDays[d]}`,
            subjects: [coreSubjects[(w * 2 + d) % coreSubjects.length]],
            tasks: ["Study concepts", "Solve 20 problems", "Make notes"],
            durationMinutes: d < 5 ? 120 : 180,
          });
        }
      }

      // Milestones
      const milestones = [];
      for (let w = 2; w <= totalWeeks; w += Math.max(2, Math.floor(totalWeeks / 6))) {
        const milestoneDate = new Date(today);
        milestoneDate.setDate(milestoneDate.getDate() + w * 7);
        milestones.push({
          date: milestoneDate.toISOString().split("T")[0],
          title: `Week ${w} Checkpoint`,
          description: w <= totalWeeks * 0.3 ? "Complete foundation phase subjects" : w <= totalWeeks * 0.65 ? "Complete PYQ practice for core subjects" : "Complete full revision",
        });
      }

      const generated: StudyPlan = {
        id: `plan-${branch}-${Date.now()}`,
        branchCode: branch,
        branchName: branchNames[branch] || branch,
        targetDate,
        weeksRemaining: totalWeeks,
        dailyTargetMinutes: isPremium ? 360 : 180,
        phases: phases.filter((p) => p.weeks > 0),
        weeklySchedule: weeklySchedule.slice(0, 42),
        milestones,
      };

      setPlan(generated);
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <main className="min-h-screen bg-background">
        <Nav />
        <div className="pt-24 flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Nav />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-xs font-medium tracking-wider uppercase">
              <Target className="w-4 h-4" />
              Study Planner
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl sm:text-5xl leading-[1.08] tracking-tight mb-6"
          >
            Plan Your Path.<br />
            <span className="text-accent">Crack GATE.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted max-w-xl mx-auto mb-10 text-sm md:text-base"
          >
            Generate a personalized study plan based on your branch, target exam date, and daily study hours.
          </motion.p>
        </div>
      </section>

      {/* Plan Generator */}
      {!plan ? (
        <section className="px-6 pb-16">
          <div className="max-w-xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card border border-border rounded-2xl p-8"
            >
              <h2 className="font-semibold text-sm mb-6">Configure Your Plan</h2>

              <div className="space-y-5">
                <div>
                  <label className="text-sm text-muted mb-2 block">Branch</label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-4 py-3 bg-foreground/5 border border-border rounded-xl text-sm focus:outline-none focus:border-accent/50"
                  >
                    <option value="CS">CSE — Computer Science & IT</option>
                    <option value="EC">ECE — Electronics & Communication</option>
                    <option value="EE">EE — Electrical Engineering</option>
                    <option value="ME">ME — Mechanical Engineering</option>
                    <option value="CE">CE — Civil Engineering</option>
                    <option value="IN">IN — Instrumentation</option>
                    <option value="PI">PI — Production & Industrial</option>
                    <option value="CH">CH — Chemical Engineering</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-muted mb-2 block">Target Exam Date</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-4 py-3 bg-foreground/5 border border-border rounded-xl text-sm focus:outline-none focus:border-accent/50"
                  />
                </div>

                <button
                  onClick={generatePlan}
                  disabled={generating || !targetDate}
                  className="w-full py-3.5 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                      Generating Plan…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Study Plan
                    </>
                  )}
                </button>

                {!isPremium && (
                  <p className="text-xs text-muted text-center">
                    Premium users get detailed weekly schedules and milestones.
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      ) : (
        /* Plan Display */
        <section className="px-6 pb-16">
          <div className="max-w-5xl mx-auto">
            {/* Plan header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mb-8"
            >
              <div>
                <h2 className="font-serif text-2xl mb-1">Your Study Plan</h2>
                <p className="text-sm text-muted">
                  {plan.branchName} · {plan.weeksRemaining} weeks · Target: {new Date(plan.targetDate).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setPlan(null)}
                className="px-4 py-2 text-xs text-muted border border-border rounded-xl hover:text-foreground transition-colors"
              >
                New Plan
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
            >
              {[
                { label: "Weeks", value: plan.weeksRemaining.toString(), icon: Calendar },
                { label: "Daily Target", value: `${plan.dailyTargetMinutes} min`, icon: Clock },
                { label: "Phases", value: plan.phases.length.toString(), icon: BookOpen },
                { label: "Milestones", value: plan.milestones.length.toString(), icon: Target },
              ].map((stat) => (
                <div key={stat.label} className="bg-card border border-border rounded-2xl p-4 text-center">
                  <stat.icon className="w-5 h-5 text-muted mx-auto mb-2" />
                  <div className="text-lg font-bold font-mono">{stat.value}</div>
                  <div className="text-xs text-muted">{stat.label}</div>
                </div>
              ))}
            </motion.div>

            {/* Phases */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6 mb-10"
            >
              <h3 className="font-semibold text-sm">Study Phases</h3>
              {plan.phases.map((phase, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium text-sm">{phase.name}</h4>
                      <p className="text-xs text-muted">{phase.weeks} weeks · {phase.focus}</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 bg-foreground/5 rounded-full text-muted">
                      {phase.weeks}w
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {phase.subjects.map((s) => (
                      <span key={s} className="text-[10px] px-2 py-1 bg-accent/10 text-accent rounded-md">
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-2">
                    {phase.tasks.map((task, j) => (
                      <div key={j} className="flex items-start gap-2 text-xs text-muted">
                        <div className="w-4 h-4 rounded-full border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-muted" />
                        </div>
                        {task}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Milestones */}
            {isPremium && plan.milestones.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card border border-border rounded-2xl p-6 mb-10"
              >
                <h3 className="font-semibold text-sm mb-4">Milestones</h3>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                  <div className="space-y-4">
                    {plan.milestones.map((m, i) => (
                      <div key={i} className="relative pl-10">
                        <div className="absolute left-2.5 w-3 h-3 rounded-full bg-accent border-2 border-background" />
                        <div className="text-xs font-mono text-muted mb-1">
                          {new Date(m.date).toLocaleDateString()}
                        </div>
                        <div className="text-sm font-medium">{m.title}</div>
                        <div className="text-xs text-muted">{m.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {!isPremium && (
              <div className="bg-gradient-to-r from-accent/10 to-amber-500/5 border border-accent/20 rounded-2xl p-6 text-center">
                <Sparkles className="w-6 h-6 text-accent mx-auto mb-3" />
                <h3 className="font-semibold text-sm mb-1">Unlock Premium Features</h3>
                <p className="text-xs text-muted mb-4">Get weekly schedules, milestone tracking, and personalized adjustments.</p>
                <button
                  onClick={() => router.push("/pricing")}
                  className="px-6 py-2.5 bg-foreground text-background rounded-xl text-xs font-medium hover:opacity-90 transition-opacity"
                >
                  Upgrade to Premium
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}
