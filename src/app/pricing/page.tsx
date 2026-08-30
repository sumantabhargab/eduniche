/**
 * Pricing page at /pricing
 * Shows subscription plans and upgrade flow.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";

export default function PricingPage() {
  const { user } = useAuth();
  const isPremium = user?.isPremium ?? false;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"weekly" | "monthly">("monthly");

  const handleUpgrade = async (plan: "weekly" | "monthly") => {
    if (!user) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/subscriptions/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to start payment.");
        setLoading(false);
        return;
      }

      // Load Razorpay script
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        const rzp = new (window as any).Razorpay({
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          order_id: data.orderId,
          handler: async (response: any) => {
            try {
              const verifyRes = await fetch("/api/subscriptions/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  plan,
                }),
              });

              const verifyData = await verifyRes.json();

              if (verifyRes.ok && verifyData.success) {
                router.push("/success?type=subscription");
              } else {
                setError(verifyData.error || "Payment verification failed.");
                setLoading(false);
              }
            } catch (e) {
              setError("Payment verification failed.");
              setLoading(false);
            }
          },
          prefill: {
            email: user.email || "",
          },
          theme: {
            color: "#000000",
          },
        });

        rzp.open();
        setLoading(false);
      };

      script.onerror = () => {
        setError("Failed to load payment gateway.");
        setLoading(false);
      };
    } catch (e) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <div className="text-center mb-16">
        <h1 className="text-3xl md:text-5xl font-bold mb-4">
          Unlock Your Full Potential
        </h1>
        <p className="text-lg text-muted max-w-2xl mx-auto">
          Get access to premium content, AI-powered doubt solving, live study chat,
          and the global leaderboard.
        </p>
      </div>

      {error && (
        <div className="max-w-md mx-auto mb-8 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {isPremium && (
        <div className="max-w-md mx-auto mb-12 p-6 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-2xl text-center">
          <p className="text-lg font-semibold text-green-700 dark:text-green-400">
            You have Premium access! ✨
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        {/* Weekly Plan */}
        <PricingCard
          name="Weekly"
          price="₹20"
          period="week"
          features={[
            "Access to all premium content",
            "AI Doubt Engine",
            "Live global chat",
            "Global leaderboard",
            "Cosmetic badges",
            "Predicted mock papers",
          ]}
          plan="weekly"
          isSelected={selectedPlan === "weekly"}
          onSelect={() => setSelectedPlan("weekly")}
          onUpgrade={() => handleUpgrade("weekly")}
          loading={loading}
          disabled={isPremium}
          highlighted={false}
        />

        {/* Monthly Plan - Primary */}
        <PricingCard
          name="Monthly"
          price="₹49"
          period="month"
          features={[
            "Everything in Weekly",
            "Better value — save ₹31",
            "Access to all premium content",
            "AI Doubt Engine",
            "Live global chat",
            "Global leaderboard",
            "Cosmetic badges",
            "Predicted mock papers",
          ]}
          plan="monthly"
          isSelected={selectedPlan === "monthly"}
          onSelect={() => setSelectedPlan("monthly")}
          onUpgrade={() => handleUpgrade("monthly")}
          loading={loading}
          disabled={isPremium}
          highlighted={true}
        />
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-8">Free includes</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {["PYQ Analysis", "Study Timer", "Study History", "Daily Goals", "Streaks", "Shareable Images", "Browse Library", "Read Free Content"].map((feature) => (
            <div key={feature} className="bg-card border border-border rounded-xl px-4 py-3 text-sm">
              ✓ {feature}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PricingCard({
  name,
  price,
  period,
  features,
  plan,
  isSelected,
  onSelect,
  onUpgrade,
  loading,
  disabled,
  highlighted,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  plan: "weekly" | "monthly";
  isSelected: boolean;
  onSelect: () => void;
  onUpgrade: () => void;
  loading: boolean;
  disabled: boolean;
  highlighted: boolean;
}) {
  return (
    <div
      role="radio"
      aria-checked={isSelected}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!disabled && !loading) onSelect();
        }
      }}
      onClick={() => {
        if (!disabled && !loading) onSelect();
      }}
      className={`bg-card border rounded-2xl p-8 relative cursor-pointer outline-none transition-all duration-300 ease-out focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        isSelected ? "scale-[1.03] border-foreground shadow-lg shadow-foreground/10" : "border-border hover:border-foreground/40"
      } ${
        disabled ? "opacity-60 cursor-not-allowed" : ""
      }`}
    >
      {isSelected && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)" }}
        />
      )}
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-foreground text-background px-4 py-1 rounded-full text-xs font-semibold">
          POPULAR
        </div>
      )}
      <h3 className="text-xl font-bold mb-2">{name}</h3>
      <div className="mb-1">
        <span className="text-4xl font-bold">{price}</span>
        <span className="text-muted">/{period}</span>
      </div>
      <p className="text-sm text-muted mb-6">
        {name === "Monthly" ? "Best value" : "Flexible plan"}
      </p>
      <ul className="space-y-3 mb-8">
        {features.map((feature) => (
          <li key={feature} className="text-sm flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onUpgrade();
        }}
        disabled={disabled || loading}
        className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 ${
          disabled || loading
            ? "bg-muted text-muted cursor-not-allowed"
            : isSelected
            ? "bg-foreground text-background hover:opacity-90"
            : highlighted
            ? "bg-foreground/80 text-background hover:bg-foreground"
            : "border border-foreground hover:bg-foreground/5"
        }`}
      >
        {loading ? "Processing..." : disabled ? "Already Premium" : `Upgrade to ${name}`}
      </button>
    </div>
  );
}
