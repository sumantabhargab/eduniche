"use client";

import { useState, useEffect, useCallback } from "react";

export default function WaitlistForm({
  referralCode = "",
  onSuccess,
}: {
  referralCode?: string;
  onSuccess?: (data: { name: string; referralCode: string; position: number; count: number }) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState("");
  const [desiredCreator, setDesiredCreator] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ref, setRef] = useState(referralCode);
  const [showReferralPanel, setShowReferralPanel] = useState(false);
  const [myReferralCode, setMyReferralCode] = useState("");

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError("");
      setAlreadyJoined(false);

      try {
        const res = await fetch("/api/waitlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            interest: interest.trim() || undefined,
            desired_creator: desiredCreator.trim() || undefined,
            ref,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (data.alreadyJoined) {
            setAlreadyJoined(true);
            return;
          }
          throw new Error(data.error || "Something went wrong.");
        }

        setSuccess(true);
        setShowReferralPanel(true);
        // Store the new user's own referral code
        if (data.user?.referralCode) {
          setMyReferralCode(data.user.referralCode);
          // Set cookie so the referral link works across sessions
          document.cookie = `eduniche_ref=${data.user.referralCode};path=/;max-age=${60*60*24*30};SameSite=Lax`;
        }
        onSuccess?.(data.user);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [name, email, interest, desiredCreator, ref, onSuccess]
  );

  const referralUrl = typeof window !== "undefined" && myReferralCode
    ? `${window.location.origin}${window.location.pathname}?ref=${myReferralCode}`
    : "";

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
    } catch (e) {
      // Fallback
      const input = document.getElementById(
        "referral-link-input"
      ) as HTMLInputElement;
      if (input) {
        input.select();
        document.execCommand("copy");
      }
    }
  };

  if (success) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-success/10 border border-success/30 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="font-serif text-2xl text-foreground mb-3">You&apos;re in.</h3>
          <p className="text-muted text-base max-w-sm mx-auto">
            We&apos;ll reach out when the first learning experiences are ready.
          </p>
        </div>

        <div className="border-t border-border pt-6">
          <h4 className="font-serif text-lg text-foreground mb-1">
            Want to get closer to the front?
          </h4>
          <p className="text-sm text-muted mb-5">
            Verified referrals move you up the waitlist. Share your unique link.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                id="referral-link-input"
                type="text"
                readOnly
                value={referralUrl}
                className="flex-1 px-4 py-3 bg-background border border-border text-muted text-xs font-mono"
              />
              <button
                type="button"
                onClick={copyReferralLink}
                className="px-5 py-3 bg-accent hover:bg-accent-hover text-background text-sm font-medium transition-colors duration-200 whitespace-nowrap"
              >
                Copy
              </button>
            </div>

            <div className="flex gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  "I just joined Eduneuro's early access waitlist. It's a new way to learn skills — you practice with AI and neuroscience-informed feedback. Join here: " + referralUrl
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 border border-border hover:border-[#25D366] hover:text-[#25D366] text-muted text-sm text-center transition-colors duration-200"
              >
                WhatsApp
              </a>
              <button
                type="button"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: "Eduneuro — Learn skills by doing",
                      text: "I just joined Eduneuro's early access. Learn practical skills with AI and neuroscience-informed practice.",
                      url: referralUrl,
                    }).catch(() => {});
                  } else {
                    copyReferralLink();
                  }
                }}
                className="flex-1 py-3 border border-border hover:border-accent hover:text-accent text-muted text-sm transition-colors duration-200"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-xs font-mono tracking-widest uppercase text-muted mb-2">
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          placeholder="Your name"
          className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder:text-muted-light text-base focus:border-accent focus:outline-none transition-colors duration-200"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-xs font-mono tracking-widest uppercase text-muted mb-2">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
          className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder:text-muted-light text-base focus:border-accent focus:outline-none transition-colors duration-200"
        />
      </div>

      {alreadyJoined && (
        <div className="p-4 bg-accent-subtle border border-accent/20 rounded-sm">
          <p className="text-sm text-accent">
            You&apos;re already on the waitlist. We&apos;ll be in touch soon.
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-error/5 border border-error/20 rounded-sm">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-accent hover:bg-accent-hover disabled:bg-muted/40 disabled:cursor-not-allowed text-background font-medium text-base transition-all duration-200 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Joining…</span>
          </>
        ) : (
          <span>Join early access</span>
        )}
      </button>

      <p className="text-xs text-muted text-center">
        No spam. Early access only.
      </p>
    </form>
  );
}
