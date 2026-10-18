# atha setup guide

Supabase project: `rypfgfruzgjbvzdwvjbo`
Dashboard: https://supabase.com/dashboard/project/rypfgfruzgjbvzdwvjbo
Published app: https://water-squat-22668633.figma.site

> After changing any server code or secret, **redeploy the edge function** from Make settings, then **republish**.

---

## 1. Site URL and redirect URLs (do this first)

Every email link and social login goes back to this address. If it's wrong (for example `localhost:3000`), links "don't work".

1. Supabase → **Authentication → URL Configuration**.
2. **Site URL**: `https://water-squat-22668633.figma.site`
3. **Redirect URLs** → Add:
   - `https://water-squat-22668633.figma.site/**`
   - your custom domain, if you have one, e.g. `https://atha.lk/**`
4. Save.

---

## 2. Email: send a 6-digit code (OTP) instead of a link

Supabase sends a **link** by default because the template uses `{{ .ConfirmationURL }}`. The app asks for a **code**, so it says "invalid token": no code was ever sent.

1. Supabase → **Authentication → Sign In / Providers → Email**:
   - **Enable Email provider**: on
   - **Confirm email**: on
   - **Email OTP Length**: 6 (the app accepts 6–8)
   - **Email OTP Expiration**: e.g. 3600 seconds
2. Supabase → **Authentication → Emails → Templates → "Confirm signup"**. Replace the body with:
   ```html
   <h2>Your atha code</h2>
   <p>Enter this code in the app to verify your email:</p>
   <p style="font-size:32px;font-weight:800;letter-spacing:6px">{{ .Token }}</p>
   <p>It expires in 1 hour. If you didn't sign up, ignore this email.</p>
   ```
   Remove `{{ .ConfirmationURL }}` if you only want the code.
3. Optionally do the same for **"Magic Link"** and **"Change Email Address"** templates.
4. **Production email (strongly recommended)**: Supabase's built-in mailer only sends a few emails per hour.
   **Authentication → Emails → SMTP Settings** → enable custom SMTP (e.g. Resend, SendGrid, Brevo, Amazon SES) with your host, port, username, password and a sender like `no-reply@yourdomain`.

Test it: sign up with a new email, and you should receive a 6-digit code. Old links already sent will still be links; request a new code with "Resend code".

---

## 3. Phone: SMS codes

1. Sign up at **Twilio** (or MessageBird, Vonage, Textlocal).
   In Twilio: buy or verify a number, or create a **Messaging Service**, and note the **Account SID**, **Auth Token** and **Message Service SID**.
2. Supabase → **Authentication → Sign In / Providers → Phone** → enable:
   - SMS provider: Twilio
   - paste the SID, token and Messaging Service SID
   - SMS OTP length: 6
3. Supabase → **Authentication → Sign In / Providers** (or **Settings**): turn on **"Allow phone changes"** / "Secure phone change" off, so verifying a phone after email works.
4. Twilio trial accounts can only text numbers you've verified. Upgrade before launch, and make sure Sri Lanka (+94) is enabled under **Messaging → Geo permissions**.

If SMS isn't configured, the app skips phone verification automatically.

---

## 4. Google sign-in

1. Go to https://console.cloud.google.com → create or select a project.
2. **APIs & Services → OAuth consent screen**:
   - User type: External
   - App name: atha
   - support email, logo (optional)
   - Authorised domain: `supabase.co`, plus your own domain
   - Scopes: `email`, `profile`, `openid`
   - **Publish app** when ready (otherwise only test users can sign in).
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorised JavaScript origins: `https://water-squat-22668633.figma.site`
   - Authorised redirect URI: `https://rypfgfruzgjbvzdwvjbo.supabase.co/auth/v1/callback`
4. Copy the **Client ID** and **Client secret**.
5. Supabase → **Authentication → Sign In / Providers → Google** → enable, paste both, Save.

## 5. Microsoft sign-in (Supabase calls it "Azure")

1. Go to https://portal.azure.com → **Microsoft Entra ID → App registrations → New registration**:
   - Name: atha
   - Supported account types: **"Accounts in any organizational directory and personal Microsoft accounts"**
   - Redirect URI (Web): `https://rypfgfruzgjbvzdwvjbo.supabase.co/auth/v1/callback`
2. Copy the **Application (client) ID** from Overview.
3. **Certificates & secrets → New client secret** → copy the **Value** (not the Secret ID). Note its expiry date.
4. **API permissions**: make sure `email`, `openid` and `profile` (Microsoft Graph, delegated) are present.
5. Supabase → **Authentication → Sign In / Providers → Azure** → enable:
   - paste the client ID and secret
   - **Azure Tenant URL**: `https://login.microsoftonline.com/common`
   - Save.

## 6. Apple sign-in (needs a paid Apple Developer account, $99/yr)

1. https://developer.apple.com/account → **Certificates, IDs & Profiles**.
2. **Identifiers → + → App IDs**: create one (e.g. `lk.atha.app`) with **Sign in with Apple** ticked.
3. **Identifiers → + → Services IDs**:
   - create e.g. `lk.atha.web`; this is your **Client ID**
   - tick **Sign in with Apple → Configure**:
     - Primary App ID: the one above
     - Domains: `rypfgfruzgjbvzdwvjbo.supabase.co`
     - Return URL: `https://rypfgfruzgjbvzdwvjbo.supabase.co/auth/v1/callback`
4. **Keys → +**: enable Sign in with Apple, choose the App ID, and download the `.p8` file. Note the **Key ID** and your **Team ID** (top-right of the account page).
5. Supabase → **Authentication → Sign In / Providers → Apple** → enable:
   - Client IDs: `lk.atha.web`
   - Secret key: generate it with Supabase's built-in generator from the Team ID, Key ID and `.p8` (or follow the link on that page)
   - Save. The secret expires every 6 months, so set a reminder to regenerate it.

### Testing social login

- Use the **published site** in a normal browser tab. Google, Apple and Microsoft block sign-in inside frames like the Make preview; there the app opens a new tab instead.
- The first social sign-in shows **"Finish your profile"** (account type, photo, city, skills).
- If a button says "isn't switched on yet", that provider isn't enabled in Supabase.

---

## 7. Make.com webhook: change the URL or secret

The edge function reads two secrets:

| Secret | What it is |
|---|---|
| `MAKE_WEBHOOK_URL` | The URL of the **Custom webhook** module in your Make scenario |
| `AUTOMATION_SECRET` | Any long random string. Make sends it back in header `x-atha-secret` |

**Change the webhook URL**

1. In Make, open the scenario → click the **Webhooks** module → copy the address (or **Add** a new webhook and copy that).
2. Update the secret, either way:
   - **In Figma Make**: ask the assistant "update MAKE_WEBHOOK_URL", then paste the new URL into the card. Or
   - **In Supabase**: Dashboard → **Edge Functions → Secrets** (Project Settings → Edge Functions) → edit `MAKE_WEBHOOK_URL` → Save.
3. **Redeploy the edge function** from Make settings, so the running function sees the new value.
4. Test: post a job. In Make, the webhook's **History** should show a `job.created` event.
   First time: click **"Redetermine data structure"**, then post a job, so Make learns the fields.

**Change the secret**: update `AUTOMATION_SECRET` the same way, then update the `x-atha-secret` header in **every HTTP module** in your Make scenario, plus the webhook filter if you added one.

**Events sent to Make**: `job.created`, `bid.created`, `dispute.opened`, `message.reported`.
Write-back endpoints and Claude prompts: see `docs/make-claude-automation.md`.

**Troubleshooting**

- Nothing arrives → check the scenario is **ON** (or in "Run once"), the URL has no spaces, and you redeployed.
- Supabase → **Edge Functions → make-server-5628dc9d → Logs**: each event logs `automation <event> <status>`. `410` means the webhook was deleted in Make. `automation skipped` means the secret isn't set.
