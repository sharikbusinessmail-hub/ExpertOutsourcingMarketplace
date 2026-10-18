# atha × Make.com × Claude automation

The edge function (`supabase/functions/server/index.tsx`) is already wired:

* **Outbound** – every event is `POST`ed to `MAKE_WEBHOOK_URL` with header `x-atha-secret: <AUTOMATION_SECRET>`:
  ```json
  { "event": "job.created" | "bid.created" | "dispute.opened", "at": "ISO date", "data": { ... } }
  ```
* **Inbound** – Make writes Claude's output back (same `x-atha-secret` header, JSON body).
  Base URL: `https://<project-id>.supabase.co/functions/v1/make-server-5628dc9d`

| Event | Write-back endpoint | Body |
|---|---|---|
| `job.created` (`data.job`) | `POST /automation/jobs/{job.id}/scope` | `{ summary, deliverables[], skills[], estimate }` |
| `bid.created` (`data.bid`, `data.expert`) | `POST /automation/bids/{job.id}/{bid.id}/summary` | `{ fit, score (0-100), flags[] }` |
| `dispute.opened` (`data.dispute`, `data.job`, `data.messages`) | `POST /automation/disputes/{dispute.id}/summary` | `{ summary, clientView, expertView, recommendation }` |

The app shows the SoW on the job, the fit summary on each bid, and stores dispute summaries for admins (KV key `dispute:<id>`).

## Make scenario (one scenario, a Router with 3 routes)

1. **Webhooks → Custom webhook**. Copy its URL into the `MAKE_WEBHOOK_URL` secret.
   Add a filter: `x-atha-secret` header = your `AUTOMATION_SECRET`.
2. **Router** on `event`.
3. Each route: **Anthropic Claude → Create a Prompt** (model `claude-sonnet-4-5` or newer), then **JSON → Parse JSON**, then
   **HTTP → Make a request** (`POST`, URL above, headers `Content-Type: application/json`, `x-atha-secret`, body = parsed JSON).

### Prompts (ask Claude to reply with JSON only)

**Smart job scoping**
> You scope gig jobs for a Sri Lankan marketplace. Given the title `{{data.job.title}}`, details `{{data.job.desc}}`, category `{{data.job.cat}}`, and salary Rs `{{data.job.price}}`, return JSON
> `{"summary": "2-3 sentence statement of work", "deliverables": ["..."], "skills": ["React","Supabase"], "estimate": "e.g. 2-3 days"}`. Don't invent requirements the client didn't imply.

**Bid evaluation**
> Evaluate this bidder for the job. Job: `{{data.job.title}}`: `{{data.job.desc}}` (min `{{data.job.minYears}}` yrs). Bidder: `{{data.expert}}` (CV, skills, years, bio), bid `{{data.bid}}`.
> Return JSON `{"fit": "2 sentences on why they fit or don't", "score": 0-100, "flags": ["risks, e.g. price far below market"]}`. Be neutral.

**Dispute triage**
> You are a neutral triage assistant. A human admin decides the outcome. Job brief: `{{data.job}}`. Complaint: `{{data.dispute.reason}}`. Chat log: `{{data.messages}}`.
> Return JSON `{"summary": "...", "clientView": "...", "expertView": "...", "recommendation": "suggested next step for the admin"}`.

To keep job publishing fast, scoping runs after the job goes live, and the SoW appears a few seconds later.
To *hold* jobs until they're scoped, set `status: "pending"` in `POST /jobs` and flip it to `open` in the scope endpoint.
