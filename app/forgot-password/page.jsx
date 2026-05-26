import { Suspense } from "react";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  );
}
