/**
 * Celebration — milestone animation overlay.
 * Shows a brief celebration for: streak milestones, goal completion, total doubt milestones.
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface CelebrationProps {
  show: boolean;
  title: string;
  subtitle?: string;
  icon?: string;
  onDone: () => void;
}

export function Celebration({ show, title, subtitle, icon = "🎉", onDone }: CelebrationProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onDone();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ type: "spring", damping: 15, stiffness: 200 }}
          className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Card */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="relative bg-card border border-border rounded-3xl p-8 text-center shadow-2xl max-w-sm mx-4"
          >
            <div className="text-6xl mb-4">{icon}</div>
            <h2 className="text-2xl font-bold mb-1">{title}</h2>
            {subtitle && <p className="text-sm text-muted">{subtitle}</p>}

            {/* Confetti dots */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    left: `${20 + Math.random() * 60}%`,
                    top: `${20 + Math.random() * 60}%`,
                    background: ["#f97316", "#22c55e", "#3b82f6", "#eab308", "#ec4899"][i % 5],
                  }}
                  animate={{
                    y: [0, -30, 0],
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                  }}
                  transition={{
                    duration: 1.5 + Math.random() * 1,
                    repeat: Infinity,
                    delay: Math.random() * 0.5,
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
