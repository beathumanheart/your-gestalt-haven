/**
 * ============================================================
 * PRIVACY NOTICE
 * ============================================================
 * English only, like the worksheet it is linked from.
 *
 * Written from what the site actually does, checked against the code rather
 * than assumed: the booking function's fields, the analytics configuration in
 * src/config/analytics.ts, and what a browser is observed to store on each
 * kind of page. If any of those change, this changes with them.
 *
 * ⚠️ Anything in double square brackets is a fact only Genia can supply — a
 * legal name, an address, a retention period. src/__tests__/privacyNotice.test.ts
 * fails while any remain, so an unfinished notice cannot be published.
 *
 * This is a plain-language draft, not legal advice.
 * ============================================================
 */

export interface PrivacySection {
  id: string;
  title: string;
  paras?: string[];
  rows?: { term: string; text: string }[];
}

export interface PrivacyContent {
  title: string;
  updated: string;
  intro: string[];
  sections: PrivacySection[];
  closing: string[];
}

export const privacyEN: PrivacyContent = {
  title: "Privacy",
  updated: "Last updated: 23 September 2026",
  intro: [
    "This page explains what happens to the information you give this site, and what it collects while you read. It is a small practice, so the answer is mostly: very little, and not for long.",
    "The practice is run by Human Heart, in Brussels 1000, Belgium. For anything on this page, write to be@humanheart.life.",
  ],
  sections: [
    {
      id: "booking",
      title: "When you book a session",
      paras: [
        "The booking form asks for your name, your email address (twice, to catch a typo), your time zone, and the session and time you choose. There is an optional box for anything you would like me to know beforehand.",
        "That box is yours to leave empty. Whatever you write in it is treated as confidential clinical material: it is never used for anything but preparing for our work, and analytics on this site is configured so that it cannot be recorded or sent anywhere — see below.",
        "This is kept because you asked for a session and I need it to hold one. Where what you write concerns your health, it is kept on the basis of your explicit consent in writing it, and under the confidentiality that applies to counselling.",
        "It is stored in the site's database and kept for two years after our last session, then deleted. You can ask for it sooner than that, and it will be.",
      ],
    },
    {
      id: "email",
      title: "Emails",
      paras: [
        "Booking confirmations, the worksheet PDF if you ask for it, and the monthly letter if you subscribe, are all sent through Brevo, a company in France. Your address is passed to them so they can deliver the message, and to nobody else.",
        "Opening and click tracking are switched off for the emails this site sends, so I do not know whether you opened one.",
      ],
    },
    {
      id: "letter",
      title: "The monthly letter",
      paras: [
        "Subscribing is a separate, unticked choice. If you tick it, Brevo sends one email asking you to confirm the address is yours, and nothing is sent until you do. Brevo records that confirmation, including when it happened and the IP address it came from, which is how consent is evidenced.",
        "The basis is your consent. Every letter carries an unsubscribe link, and you can leave at any time; your address is removed from the list when you do.",
        "If you ask only for the worksheet PDF and do not tick the letter, your address is not added to any list. It stays in Brevo's sending log for that one message.",
      ],
    },
    {
      id: "worksheets",
      title: "Worksheets on this site",
      paras: [
        "The worksheets under “Take with you” run entirely in your browser. What you write in them is never sent anywhere — not to me, not to anyone — and it is not saved unless you switch on “Keep my answers on this device”, which stores them in that browser alone. Switching it off deletes them.",
        "Printing or saving as PDF happens on your own computer.",
      ],
    },
    {
      id: "analytics",
      title: "Counting visits",
      paras: [
        "This site uses PostHog, on its European servers, to count how pages are used. Session recording is switched off in the code, so no replay of your visit exists.",
        "On the main pages it records which pages were opened, clicks on links and buttons, and basic loading speed, and it stores an identifier in your browser — a cookie and a local storage entry — so that repeat visits are not counted as new people.",
        "On the “Take with you” pages, including the worksheets, it counts page opens and nothing else, and stores nothing on your device.",
      ],
    },
    {
      id: "video",
      title: "Sessions themselves",
      paras: [
        "Sessions are held over Jitsi, run by 8x8. The link in your confirmation is the key to the room, so please do not forward it. Sessions are not recorded.",
        "What is said in a session is covered by counselling confidentiality, not by this page.",
      ],
    },
    {
      id: "hosting",
      title: "Reading the site",
      paras: [
        "The pages are served by GitHub Pages, whose servers log the usual request information, including your IP address, to deliver them.",
        "Fonts are loaded from Google Fonts, which means Google can see your IP address when a page loads. Nothing else on the site is loaded from a third party.",
      ],
    },
    {
      id: "rights",
      title: "What you can ask for",
      rows: [
        { term: "A copy", text: "of anything held about you." },
        { term: "A correction", text: "if something is wrong." },
        { term: "Deletion", text: "of your booking details or your address." },
        { term: "To withdraw consent", text: "for the letter, at any time, with one click." },
        { term: "To object", text: "to how something is used, or ask that it be restricted." },
      ],
      paras: [
        "Write to be@humanheart.life and you will have an answer within a month.",
        "If you are not satisfied, you can complain to the Belgian Data Protection Authority (Gegevensbeschermingsautoriteit / Autorité de protection des données), which publishes how to do so at www.dataprotectionauthority.be.",
      ],
    },
  ],
  closing: [
    "If this page changes, the date at the top changes with it.",
  ],
};
