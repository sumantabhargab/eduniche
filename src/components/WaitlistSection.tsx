"use client";

import WaitlistForm from "@/components/WaitlistForm";
import Leaderboard from "@/components/Leaderboard";

export default function WaitlistSection() {
  return (
    <div className="grid md:grid-cols-[1fr_1fr] gap-16 md:gap-24">
      <div>
        <div className="font-mono text-xs tracking-widest text-muted uppercase mb-6">
          Early access
        </div>
        <h2 className="font-serif text-3xl md:text-5xl leading-snug mb-6">
          Be here when
          <br />
          the first ones launch.
        </h2>
        <p className="text-lg text-muted leading-relaxed mb-8">
          We&apos;re opening the first learning experiences with a small
          group of early learners. If this resonates with you, join the
          waitlist.
        </p>

        <div className="space-y-4 text-sm text-muted">
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
            <span>
              Get priority access when we open new learning experiences
            </span>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
            <span>
              Share your unique link — verified referrals move you up
            </span>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
            <span>
              Help shape what we build next — early members influence
              priorities
            </span>
          </div>
        </div>

        {/* Referral reward notice */}
        <div className="mt-8 p-4 bg-background-alt border border-border">
          <div className="text-xs font-mono text-muted-light tracking-widest uppercase mb-2">
            Early supporter reward
          </div>
          <p className="text-xs text-muted leading-relaxed">
            The top 5 members with 50+ verified referrals will be eligible
            for a chance to win ₹10,000, subject to the final campaign
            terms.{" "}
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("reward-terms");
                el?.classList.toggle("hidden");
              }}
              className="text-accent hover:underline"
            >
              View terms
            </button>
          </p>
          <div id="reward-terms" className="hidden mt-3 pt-3 border-t border-border">
            <ul className="text-xs text-muted space-y-1">
              <li>
                • A verified referral counts only when a new unique email
                joins through your link.
              </li>
              <li>• Self-referrals and fake emails don&apos;t count.</li>
              <li>
                • The reward depends on the startup reaching required
                funding conditions.
              </li>
              <li>
                • Winners will be selected after the campaign period ends.
              </li>
              <li>
                • This is not a guaranteed payment — it&apos;s an
                opportunity for early supporters.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div>
        <div className="bg-background-alt border border-border p-8 md:p-10">
          <WaitlistForm />

          {/* Post-signup referral panel */}
          <div
            id="referral-panel"
            className="hidden mt-8 pt-8 border-t border-border"
          >
            <div className="text-center mb-6">
              <h3 className="font-serif text-xl text-foreground mb-2">
                Share your link
              </h3>
              <p className="text-sm text-muted">
                Verified referrals move you up the waitlist.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  id="referral-link"
                  type="text"
                  readOnly
                  className="flex-1 px-4 py-3 bg-background border border-border text-muted text-sm font-mono"
                />
                <button
                  onClick={async () => {
                    const input = document.getElementById(
                      "referral-link"
                    ) as HTMLInputElement;
                    await navigator.clipboard.writeText(input.value);
                    const btn = document.activeElement as HTMLButtonElement;
                    const original = btn.textContent;
                    btn.textContent = "Copied";
                    setTimeout(() => {
                      btn.textContent = original;
                    }, 2000);
                  }}
                  className="px-4 py-3 bg-accent hover:bg-accent-hover text-background text-sm font-medium transition-colors duration-200 whitespace-nowrap"
                >
                  Copy
                </button>
              </div>

              <div className="flex gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    "I just joined Eduneuro's early access. Check it out — learn practical skills with AI and neuroscience-informed practice."
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 border border-border hover:border-success hover:text-success text-muted text-sm text-center transition-colors duration-200"
                >
                  WhatsApp
                </a>
                <button
                  onClick={() => {
                    navigator.share?.({
                      title: "Eduneuro — Learn skills by doing",
                      text: "I just joined Eduneuro's early access. Learn practical skills with AI and neuroscience-informed practice.",
                    }).catch(() => {});
                  }}
                  className="flex-1 py-3 border border-border hover:border-accent hover:text-accent text-muted text-sm transition-colors duration-200"
                >
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="mt-8 bg-background-alt border border-border p-8 md:p-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="font-mono text-xs tracking-widest text-muted uppercase mb-1">
                Early community
              </div>
              <div className="text-sm text-muted">Top referrers</div>
            </div>
          </div>
          <Leaderboard />
        </div>
      </div>
    </div>
  );
}
