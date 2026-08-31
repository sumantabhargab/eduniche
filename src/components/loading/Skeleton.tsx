/**
 * Skeleton loaders using EduNeuro's design language.
 *
 * Prefer these over inline animate-pulse placeholders for consistent loading UX.
 */

"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`rounded-lg bg-background-alt animate-pulse ${className}`}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 md:p-6">
      <Skeleton className="h-3 w-20 mb-3" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

export function MessageSkeleton({ isOwn = false }: { isOwn?: boolean }) {
  return (
    <div className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
      <Skeleton className="w-8 h-8 rounded-full shrink-0" />
      <div className={`max-w-[70%] space-y-2`}>
        <Skeleton className="h-3 w-20" />
        <Skeleton
          className={`h-10 rounded-xl ${isOwn ? "w-40" : "w-52"}`}
        />
      </div>
    </div>
  );
}

export function ChatSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <MessageSkeleton key={i} isOwn={i % 3 === 2} />
      ))}
    </div>
  );
}

export function ListRowSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}

export default Skeleton;