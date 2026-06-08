# Email setup — Concordia Bible Institute

Two things send email, configured in two different places:

| Email | Sent by | Set up in |
|-------|---------|-----------|
| **Password reset / forgot password** | **Supabase Auth** (built-in) | Supabase dashboard (Part A) |
| **"New sale" notification to the owner** | **Our app → Resend** | `.env.local` + Resend (Part B) |

Neither needs DNS changes on `concordiabible.org` (whose DNS is run by CUW IT).

---

## Part A — Password reset (Supabase, no third party)

The code is already correct: `AuthContext.requestPasswordReset()` →
`sb.auth.resetPasswordForEmail()`, then `/auth/callback` swaps the link's code
for a session and forwards to `/reset-password`. It just needs dashboard config:

1. **Authentication → URL Configuration**
   - **Site URL**: `http://localhost:3000` while testing (your live URL later).
   - **Redirect URLs** — add:
     ```
     http://localhost:3000/auth/callback
     ```
     (add the production `https://.../auth/callback` when you deploy)
   - If the callback isn't allowlisted, the email sends but the link dead-ends.
     This is the most common reason "reset does nothing."

2. **Authentication → Providers → Email** — make sure Email is enabled.

3. **Delivery** — Supabase's **built-in email** sends resets out of the box,
   no SMTP/third party. It's **rate-limited** (a few per hour) and meant for
   low volume — fine for testing and a solo admin. If a test seems to do
   nothing: check spam, and wait a few minutes if you've requested several in a
   row (you may have hit the hourly limit).

**Test:** go to `/forgot-password`, enter a real existing user's email → the
reset email should arrive and its link should land you on `/reset-password`.

---

## Part B — Checkout notification to the owner (Resend, no domain needed)

On checkout, `notifyPurchase()` (`lib/notifications.js`) sends **one** email —
to you — via Resend. Because it only goes to *your own* inbox, Resend needs no
domain verification: it sends from `onboarding@resend.dev`.

1. **Create a Resend account** at resend.com **using the email you want the
   notifications at** (e.g. your Gmail). Unverified Resend only delivers to
   that exact address.
2. **API Keys → Create** → copy the `re_...` key.
3. **`.env.local`:**
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxx
   EMAIL_FROM=Concordia Bible Institute <onboarding@resend.dev>
   NEXT_PUBLIC_ADMIN_EMAIL=the-same-email-you-signed-up-to-resend@example.com
   ```
4. **Restart `npm run dev`.**

**Test:** add a guide to the cart and check out → a "New sale" email lands in
your inbox. (If `RESEND_API_KEY` is blank, the send is just logged to the
console + Admin·Email page — no error, site unaffected.)

---

## Later, if you want to email *customers* too

That's the only thing that needs the domain. Verify `concordiabible.org` in
Resend (it generates SPF/DKIM records that **CUW IT** must add to DNS), then set
`EMAIL_FROM` to `noreply@concordiabible.org` and re-enable the customer-facing
sends in `notifyPurchase`. Until then, customer emails stay off by design.
