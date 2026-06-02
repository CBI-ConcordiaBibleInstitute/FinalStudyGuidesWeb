import LegalLayout from "@/components/LegalLayout";

export const metadata = { title: "Privacy & Refund Policy" };

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy & Refund Policy"
      updated="May 19, 2026"
      intro="This policy explains what we collect, how we use it, and how refunds work."
      sections={[
        {
          heading: "Information we collect",
          body: "We collect your name and email when you create an account, and a record of the study guides you access. Payment details are handled entirely by CashNet — we never store card numbers.",
        },
        {
          heading: "How we use your information",
          body: "Your information is used to provide access to the platform, maintain your library, send transactional and (optional) marketing emails, and improve our content.",
        },
        {
          heading: "Email communication",
          body: "Transactional emails — welcome, purchase receipts, and password resets — are required for the service. Marketing emails such as new-episode alerts are optional and can be turned off in your dashboard.",
        },
        {
          heading: "Data security",
          body: "Data is transmitted over HTTPS and stored with industry-standard safeguards. You may request deletion of your account and associated data at any time.",
        },
        {
          heading: "Refund policy",
          body: "Study guide purchases are fully refundable within 14 days of purchase, provided the guide has not been downloaded.",
        },
        {
          heading: "Contact",
          body: "For privacy questions or refund requests, email contact@concordiastudyguides.com.",
        },
      ]}
    />
  );
}
