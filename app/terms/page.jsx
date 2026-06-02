import LegalLayout from "@/components/LegalLayout";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      updated="May 19, 2026"
      intro="By creating an account or purchasing access to Concordia Bible Institute, you agree to these terms."
      sections={[
        {
          heading: "Your account",
          body: "You are responsible for keeping your login credentials secure and for all activity under your account. Provide accurate information when registering.",
        },
        {
          heading: "Use of study guides",
          body: "Study guides and episodes are licensed for your personal use and for groups or classes you lead. You may not resell, redistribute, or publicly post the materials.",
        },
        {
          heading: "Purchases",
          body: "Study guides are sold individually as one-time purchases of $20 per episode. Purchased guides remain available in your library. Prices are shown in US dollars and processed securely by CashNet.",
        },
        {
          heading: "Refunds",
          body: "Every purchase is one-time, so there is nothing to cancel. A study guide is fully refundable within 14 days of purchase, provided it has not been downloaded.",
        },
        {
          heading: "Content and availability",
          body: "We work to keep the platform available and accurate, but do not guarantee uninterrupted access. Content may be updated, added, or revised over time.",
        },
        {
          heading: "Contact",
          body: "Questions about these terms can be sent to contact@concordiastudyguides.com.",
        },
      ]}
    />
  );
}
