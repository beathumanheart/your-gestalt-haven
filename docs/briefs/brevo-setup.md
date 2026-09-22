# Brevo setup — the worksheet email and the monthly letter

Your part, done by hand in Brevo. About twenty minutes. It needs to be finished
before Milestone 2 of `automatic-yes.md` goes live. Menu names in Brevo shift
from time to time; if one is not where this says, search for it.

## 1. The list

**Contacts → Lists → Create a list.** Name it *Monthly letter*.
Write down its ID (the number shown with the list). → `BREVO_LETTER_LIST_ID`

Only people who confirm by email end up here.

## 2. Two contact attributes (optional)

**Contacts → Settings → Contact attributes → add:**

- `SOURCE` — Text (which page someone signed up on)
- `LANGUAGE` — Text

If you skip this, tell Claude Code to leave `attributes` out of the request.

## 3. The confirmation email (double opt-in template)

**Templates → New template.**

- Name: *Monthly letter · confirm*
- Subject: *One click to confirm the monthly letter*
- From: *Genia* · `be@humanheart.life`
- Content: the text under "Double opt-in email" in `automatic-yes.md`.
  A plain layout is enough.
- The button *Confirm my address*: in its link settings, choose the link type
  **Double opt-in link**. This is what makes the confirmation work.
- Advanced settings → Tag: `optin`
- No promotion in this email — Brevo's rule; it exists only to confirm.

Save and activate it. Write down its ID. → `BREVO_DOI_TEMPLATE_ID`

## 4. Sender and domain

**Senders, domains & dedicated IPs:** check that `be@humanheart.life` is a
verified sender and that `humanheart.life` is authenticated (DKIM and DMARC).
The booking emails already go out, so this is most likely done — campaigns
need it too.

## 5. Tracking on transactional mail

**Transactional → Settings:** keep open and click tracking off. The booking
emails rely on this, and the worksheet email is sent the same way.

## 6. Give the two IDs to the website's function

In the repository folder, with the Supabase CLI logged in:

```
supabase secrets set BREVO_LETTER_LIST_ID=<list id> BREVO_DOI_TEMPLATE_ID=<template id>
```

`BREVO_API_KEY` is already set for the booking function.

## 7. Sending the letter each month

**Campaigns → Email → Create an email campaign**, recipients: the *Monthly
letter* list. Brevo adds the unsubscribe footer — keep it. The free plan sends
up to 300 emails a day.

## Before sign-up is switched on: the privacy notice

The small print under both forms links to `/en/privacy`, and that page does
not exist yet. Under the GDPR a notice at the point of collection normally
covers: who you are and how to reach you; what is collected (the email
address; for the letter, Brevo also records when and from which IP the
address was confirmed); why (to send the PDF that was asked for; the letter,
only after confirmation); the legal basis (the request itself, and consent for
the letter); who processes it (Brevo, in France); how long it is kept (letter
subscribers until they leave; PDF-only addresses are not added to any list and
stay only in Brevo's sending log); and the reader's rights, including
withdrawing consent and complaining to the Belgian Data Protection Authority.

This is a checklist, not legal advice — the wording is yours to decide.
