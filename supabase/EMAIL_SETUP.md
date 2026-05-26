# Branded transactional email — setup checklist

Concordia sends email from two places:

1. **Our app** — every notification in `lib/notifications.js` → `lib/email.js` →
   `POST /api/email/send` → Resend. Already branded with the wrapper in
   `lib/email-html.js`. Once `RESEND_API_KEY` and `EMAIL_FROM` are set in
   `.env.local`, real email goes out.

2. **Supabase Auth** — the "Confirm your email", password reset, and magic-link
   emails Supabase itself sends in response to `auth.signUp()` /
   `auth.resetPasswordForEmail()`. By default those use Supabase's generic
   template and `noreply@supabase.io`. To make them look like Concordia, do the
   following inside the Supabase dashboard (one-time):

   **a. SMTP — point Supabase Auth at Resend**
   - Project Settings → Auth → SMTP Settings → Enable Custom SMTP.
   - Host: `smtp.resend.com` · Port `465` · User `resend` · Pass `<your RESEND_API_KEY>`.
   - Sender email: `contact@concordiastudyguides.com` (must match a verified
     domain in Resend).
   - Sender name: `Concordia Bible Institute`.

   **b. Template — replace the "Confirm signup" body**
   - Authentication → Email Templates → "Confirm signup".
   - Subject: `Verify your email for Concordia Bible Institute`
   - Body (HTML) — paste:

     ```html
     <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f6efe3;padding:32px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
       <tr><td align="center">
         <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#fff;border-radius:14px;overflow:hidden;border:1px solid rgba(122,28,47,0.10)">
           <tr><td style="background:#7a1c2f;padding:22px 32px" align="left">
             <a href="{{ .SiteURL }}" style="text-decoration:none;color:#fff;font-family:Georgia,serif;font-size:20px;font-weight:700">Concordia Bible Institute</a>
             <div style="color:#c8a24b;font-size:12px;letter-spacing:1.2px;text-transform:uppercase;margin-top:4px;font-weight:600">Christ in Every Word</div>
           </td></tr>
           <tr><td style="padding:32px">
             <h1 style="margin:0 0 18px;color:#2b2622;font-family:Georgia,serif;font-size:24px">Confirm your email</h1>
             <p style="margin:0 0 16px;color:#2b2622;font-size:15px;line-height:1.65">Tap the button below to verify this email address. The link is valid for 24 hours.</p>
             <table cellpadding="0" cellspacing="0" border="0" style="margin:24px 0"><tr><td bgcolor="#7a1c2f" style="border-radius:8px">
               <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 22px;color:#fff;font-weight:600;font-size:15px;text-decoration:none;font-family:Georgia,serif">Verify my email</a>
             </td></tr></table>
             <p style="margin:0;color:#6b6058;font-size:13px;line-height:1.6">If you did not create a Concordia account, you can safely ignore this email.</p>
           </td></tr>
         </table>
       </td></tr>
     </table>
     ```

   **c. Repeat for** "Reset password" and "Magic link" templates — same shell,
   change the heading + the `{{ .ConfirmationURL }}` text to "Reset password" /
   "Sign in to Concordia".

   **d. Site URL** — Authentication → URL Configuration → set to
   `https://concordiastudyguides.com` so the confirm links don't point at
   localhost in production.

Once SMTP is configured, the verification email arrives from
`contact@concordiastudyguides.com` with Concordia branding, and our own
post-signup welcome email arrives from the same address moments later via
`/api/email/send`.
