# Seeing worksheet PDF requests in PostHog

The site now sends two events from the worksheet's sign-up forms. This page is
the part that cannot be done in code: building the charts in PostHog.

## The events

| Event | When | Properties |
|---|---|---|
| `worksheet_pdf_requested` | The form was submitted asking for the PDF. Sent **before** the request goes out. | `source`, `with_letter` |
| `worksheet_pdf_result` | The server said what happened. | `source`, `with_letter`, `outcome` (`sent` \| `failed`) |

`source` is which form it came from — only `automatic-yes` can ask for a PDF
today. `with_letter` is whether the monthly letter was ticked in the same
submission.

Two events rather than one because the **gap between them is the number worth
watching**. Requested-but-never-sent is Brevo failing, and a count of
deliveries alone would show an outage as a worksheet nobody wanted.

**No property identifies a person.** Not the address, not an id. These fire
from `/take/*`, where PostHog runs with `persistence: "memory"` and
`person_profiles: "never"`, so they are anonymous counts — and
`src/content/privacy.ts` says so to the reader.
`src/__tests__/worksheetAnalytics.test.tsx` holds every property to an
allow-list, so a property added later fails the build until it has been
thought about and the privacy notice updated with it.

## What to build in PostHog

Three things, in the order they are worth having. All of them are in
**Product analytics → New insight**.

### 1. How many people ask for it — a trend

- Insight type **Trends**
- Series: `worksheet_pdf_requested`, measured by **Total count**
- Add a second series: `worksheet_pdf_result` with property `outcome = sent`
- Chart type **Line**, interval **Week**

Two lines that should sit on top of each other. When the lower one drops away
from the upper one, delivery is broken — that is the whole reason for two
events.

### 2. How many of them are failing — a ratio

- Insight type **Trends**
- Series: `worksheet_pdf_result`, **Total count**, broken down by `outcome`
- Chart type **Area**, with **Show as → Percentage of total** (stacked)

Reads at a glance: the `failed` band should be a sliver. If it thickens,
check the Brevo key and the function's logs — the `requestId` in the
function's log line is how to find one request.

### 3. Do they take the letter at the same time — a breakdown

- Insight type **Trends**
- Series: `worksheet_pdf_requested`, broken down by `with_letter`

This answers a question about the copy rather than about a fault: whether the
consent line beside the PDF is read at all.

### Put them on a dashboard

**Dashboards → New dashboard**, name it "Worksheet", add all three. Saved
insights can be added from their own **⋯ → Add to dashboard**.

## Two things that will look wrong and are not

**The numbers are small and lumpy.** This is one practice's free worksheet, not
a product funnel. A week with three requests is a normal week; do not read a
trend into two data points.

**Requested is sometimes higher than sent, briefly.** The request event fires
before the server answers, so the last few minutes of the current day can show
a gap that closes. Compare whole weeks.

## If the events do not appear at all

PostHog blocks what it thinks is a bot, and that includes a headless browser.
Checking this by driving the page with automation will show zero events however
correct the code is — this cost several wrong conclusions while the worksheet
was being built. Test it by hand, in a real browser, and give it a minute:
`/take/*` batches like anywhere else.
