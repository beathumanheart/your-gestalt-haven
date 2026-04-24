# Phase 3 — Step 3.1: Create Self-Owned Supabase Project

---

## 1. Sign in

Go to [https://supabase.com](https://supabase.com) → **Sign in** → **Continue with GitHub**.
Use the account linked to `beathumanheart@gmail.com`.

---

## 2. Create the project

From the Supabase dashboard → **New project**:

| Field | Value |
|---|---|
| Organization | Use default personal org or create `beathumanheart` |
| Project name | `humanheart-life` |
| Database password | Run `openssl rand -base64 32` on your Mac → save to password manager → paste here |
| Region | **eu-central-1** (Frankfurt — closest to Brussels) |
| Plan | **Free** |

Click **Create new project**. Wait ~2 minutes for provisioning.

---

## 3. Capture API credentials

Once provisioned, go to **Settings → API**:

| Item | Where | Note |
|---|---|---|
| Project URL | "Project URL" field | Looks like `https://<ref>.supabase.co` |
| anon / public key | "Project API keys → anon public" | Safe to commit to frontend |
| service_role key | "Project API keys → service_role" | **Never commit** — server/admin only |
| Project ref | First segment of Project URL | e.g. `abcdefghijklmnop` |

Save all four values to your password manager now.

---

## 4. Report back to Claude Code

Paste the new **Project ref** into the conversation so subsequent steps
(CLI link command, env var updates, curl smoke test) can use the correct value.

Do NOT paste the service_role key or DB password into the conversation.
