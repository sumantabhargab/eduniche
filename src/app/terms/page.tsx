import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — EduNeuro",
  description:
    "EduNeuro terms of service — rules and conditions for using the platform.",
};

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 md:py-24">
      <h1 className="font-serif text-3xl md:text-5xl leading-tight mb-4">
        Terms of Service
      </h1>
      <p className="text-sm text-muted mb-12">
        Last updated: August 2026
      </p>

      <div className="space-y-12 text-sm text-foreground leading-relaxed">
        <section>
          <h2 className="font-serif text-xl mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing or using EduNeuro (the &ldquo;Platform&rdquo;), you
            agree to be bound by these Terms of Service. If you do not agree with
            any part of these terms, you may not use the Platform.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl mb-3">
            2. Description of the Platform
          </h2>
          <p>
            EduNeuro is an AI-powered, neuroscience-informed educational platform
            designed to help students prepare for competitive examinations such
            as GATE. The platform provides:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>Organised study libraries with subject-wise resources</li>
            <li>Study session tracking with verified timers and streaks</li>
            <li>Performance analytics and progress tracking</li>
            <li>Community leaderboards</li>
            <li>AI-powered doubt resolution (premium feature)</li>
            <li>Global study chat (premium feature)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl mb-3">3. Account Responsibilities</h2>
          <p>
            You are responsible for maintaining the confidentiality of your
            account and for all activities that occur under your account. You
            agree to:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>Provide accurate and complete information during sign-up</li>
            <li>
              Keep your account credentials secure and not share them with others
            </li>
            <li>
              Notify us immediately of any unauthorised use of your account
            </li>
            <li>
              Accept responsibility for all actions taken through your account
            </li>
          </ul>
          <p className="mt-3">
            You may not create an account using a false identity or impersonate
            another person.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl mb-3">
            4. Free and Premium Content
          </h2>
          <p>
            EduNeuro offers both free and premium (paid) content and features:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>
              <strong>Free features</strong> include access to the organised
              study library, study timer, streaks, goals, and the community
              leaderboard
            </li>
            <li>
              <strong>Premium features</strong> include the AI Doubt Engine,
              global study chat, and premium library resources such as predicted
              mock papers and in-depth notes
            </li>
          </ul>
          <p className="mt-3">
            We reserve the right to modify, add, or remove features from both
            free and premium tiers at any time.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl mb-3">
            5. Subscriptions, Payments, and Refunds
          </h2>
          <p>
            Premium subscriptions are billed through Razorpay. Subscription fees,
            billing cycles, and plan details are displayed before purchase.
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>
              Subscriptions auto-renew unless cancelled before the renewal date
            </li>
            <li>
              Prices are subject to change with reasonable notice
            </li>
            <li>
              Refund requests are handled on a case-by-case basis. Contact{" "}
              <a
                href="mailto:sumantabhargab@gmail.com"
                className="underline"
              >
                sumantabhargab@gmail.com
              </a>{" "}
              with your payment reference ID
            </li>
            <li>
              Failed payments may result in temporary suspension of premium
              features until payment is completed
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl mb-3">6. Acceptable Use</h2>
          <p>
            You agree not to use the Platform for any unlawful purpose or in any
            way that could damage, disable, or impair the Platform. Prohibited
            activities include:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>
              Attempting to gain unauthorised access to any part of the Platform
            </li>
            <li>
              Using automated means (bots, scrapers) to access the Platform
            </li>
            <li>
              Posting abusive, harmful, or offensive content in chat or any
              community feature
            </li>
            <li>
              Sharing account credentials with others
            </li>
            <li>
              Attempting to manipulate leaderboard rankings through fraudulent
              study session activity
            </li>
            <li>
              Reverse-engineering or copying any portion of the Platform
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl mb-3">
            7. Intellectual Property and Content Ownership
          </h2>
          <p>
            All content provided on EduNeuro — including study notes, practice
            questions, mock papers, and platform design — is the property of
            EduNeuro or its content contributors. You may not reproduce,
            distribute, or create derivative works from this content without
            explicit permission.
          </p>
          <p className="mt-3">
            You retain ownership of any content you create or submit through the
            Platform (such as chat messages). By submitting content, you grant
            EduNeuro a non-exclusive licence to display and distribute that
            content as part of the normal operation of the Platform.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl mb-3">
            8. AI-Generated Answers Disclaimer
          </h2>
          <p>
            The AI Doubt Engine provides AI-generated answers based on patterns
            in the study library and general knowledge. These answers:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>
              May contain errors or inaccuracies
            </li>
            <li>
              Should not be treated as definitive or authoritative
            </li>
            <li>
              Are not a substitute for textbooks, faculty guidance, or official
              examination resources
            </li>
          </ul>
          <p className="mt-3">
            Always verify AI-generated answers against authoritative sources.
            EduNeuro is not liable for any academic decisions made based on
            AI-generated content.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl mb-3">9. Service Availability</h2>
          <p>
            We strive to keep the Platform available and functioning reliably.
            However, we do not guarantee uninterrupted access. The Platform may
            be temporarily unavailable due to maintenance, updates, or
            circumstances beyond our control.
          </p>
          <p className="mt-3">
            We are not liable for any loss of data, study progress, or
            subscription time resulting from service interruptions.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl mb-3">
            10. Account Termination
          </h2>
          <p>
            We reserve the right to suspend or terminate your account at our
            discretion if you violate these Terms of Service or engage in
            behaviour that harms the Platform or its community.
          </p>
          <p className="mt-3">
            You may delete your account at any time by contacting{" "}
            <a
              href="mailto:sumantabhargab@gmail.com"
              className="underline"
            >
              sumantabhargab@gmail.com
            </a>
            . Upon deletion, your account data will be removed from our systems
            as described in our Privacy Policy.
          </p>
          <p className="mt-3">
            Terminated accounts forfeit access to any remaining subscription
            period without refund, unless otherwise agreed.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl mb-3">
            11. Limitation of Liability
          </h2>
          <p>
            EduNeuro is provided on an &ldquo;as-is&rdquo; basis without
            warranties of any kind. To the maximum extent permitted by law,
            EduNeuro and its operators shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages arising from
            your use of or inability to use the Platform.
          </p>
          <p className="mt-3">
            Our total liability to you for any claims arising from these terms or
            your use of the Platform shall not exceed the amount you paid us in
            the twelve months preceding the claim (or zero, if you use the free
            tier).
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl mb-3">12. Changes to Terms</h2>
          <p>
            We may update these Terms of Service from time to time. Changes will
            be posted on this page with an updated &ldquo;Last updated&rdquo;
            date. Continued use of the Platform after changes constitutes
            acceptance of the updated terms.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl mb-3">13. Governing Law</h2>
          <p>
            These terms shall be governed by and construed in accordance with the
            laws of India. Any disputes arising from these terms or your use of
            the Platform shall be subject to the jurisdiction of the courts in
            India.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl mb-3">14. Contact</h2>
          <p>
            For any questions about these Terms of Service, please contact us at{" "}
            <a
              href="mailto:sumantabhargab@gmail.com"
              className="underline"
            >
              sumantabhargab@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
