# -*- coding: utf-8 -*-
"""
Single source of wording for "The automatic yes" worksheet.
Both the print PDF and the web prototype are generated from this file,
so the two versions cannot drift apart.

Voice: no verdicts about the reader, no generalisations about people,
history and situation before the inner world, "feeling" not "emotion",
British spelling (matches humanheart.life).
"""

TITLE = "The automatic yes"
TITLE_PARTS = ("The", "automatic", "yes")          # middle word set in italic
SUBTITLE = "A worksheet on people-pleasing, through Ferenczi, Winnicott and Gestalt."
AUTHOR = "Genia"
ROLE = "Gestalt Counsellor"
SITE = "humanheart.life"
SLUG = "automatic-yes"
SITE_URL = "https://humanheart.life/en"
YOUTUBE_URL = "https://www.youtube.com/@beathumanheart"
YOUTUBE_NAME = "Genia | Human Heart"

INTRO = {
    "kicker": "Before you begin",
    "title": "A yes that arrives before you do",
    "paras": [
        "Some yeses are chosen: you know what you want, you weigh it, you agree. "
        "Others arrive first — before you have checked with yourself, sometimes before "
        "the other person has finished asking. This worksheet is about the second kind.",
        "It looks at that yes through three lenses from one lineage, then asks you to meet it: "
        "slowly on paper, and once in real life.",
    ],
    "howto": [
        ("Time", "About forty minutes in one sitting, or one part a day."),
        ("You need", "A pen, and one recent yes you would like to look at more closely."),
        ("Answers", "Write what is true today. There is nothing to get right."),
        ("Care", "If something surfaces with more force than you can hold, stop. Feel your feet on "
                 "the floor and name five things you can see. Some of this is better explored with "
                 "a counsellor or therapist than alone."),
    ],
    "inside_title": "Inside",
    "inside": [
        ("3", "Catch one yes", "Now"),
        ("4", "The radar", "Where it began"),
        ("5", "The caretaker", "What it became"),
        ("6", "Chew the rule", "The rule underneath"),
        ("7", "The turn", ""),
        ("8", "A pause at the boundary", "Next time"),
        ("9", "What happened", "Afterwards"),
    ],
    "lenses_title": "Three lenses, one lineage",
    "lenses": [
        ("1932", "Sándor Ferenczi", "Where it begins",
         "Reading another person closely and early, when refusing them is not possible."),
        ("1960", "D. W. Winnicott", "What it becomes",
         "A caretaker self that protects something more alive underneath."),
        ("1951–1970", "Gestalt", "How it lives now",
         "At the boundary between you and another person, where it can be noticed, "
         "chewed over and met."),
    ],
}

# ---------------------------------------------------------------------------
# Block kinds
#   prompt  : numbered question + write-in lines
#   checks  : numbered question + tick options (+ optional blank)
#   figure  : numbered question + lines beside a body outline
#   twocol  : two write-in columns side by side
#   form    : labelled rows (a small form)
#   table   : rows with a moment + a three-way choice
#   sub     : un-numbered sub-question + lines (used inside "chew")
#   example : italic example line
#   moves   : the three numbered moves of the pause
#   box     : a tinted panel holding other blocks
#   note    : small care note
# ---------------------------------------------------------------------------

PARTS = [
    {
        "id": "now",
        "kicker": "Part one · Now",
        "title": "Catch one yes",
        "lead": [
            "Start with something recent and ordinary: a favour, a plan, an extra task, a “sure” "
            "that came out before you had thought about it. Stay with the details. They carry the information."
        ],
        "blocks": [
            {"k": "prompt", "n": 1, "q": "What happened? Where were you, who asked, and what for?", "lines": 3},
            {"k": "prompt", "n": 2, "q": "What did you sense they wanted — including anything they didn’t say?", "lines": 2},
            {"k": "checks", "n": 3, "q": "How long between the asking and your yes?",
             "options": ["before they had finished", "a second or two", "after I had thought it over"], "other": False,
             "single": True},
            {"k": "figure", "n": 4, "q": "Just before the yes, what happened in your body? Mark it on the figure.",
             "hint": "Throat, chest, stomach, jaw, face, breath — whatever you noticed.", "lines": 5},
            {"k": "prompt", "n": 5, "q": "What did you want, if anything?", "hint": "A small preference counts.", "lines": 2},
            {"k": "twocol", "n": 6, "q": "Afterwards, looking at both sides:",
             "cols": [("What the yes cost", 3), ("What the yes kept safe", 3)]},
        ],
    },
    {
        "id": "ferenczi",
        "kicker": "Part two · Where it began",
        "title": "The radar",
        "quote": "…subordinate themselves like automata to the will of the aggressor, to divine each one "
                 "of his desires and to gratify these; completely oblivious of themselves…",
        "attr": "Sándor Ferenczi · Confusion of Tongues between Adults and the Child · 1932",
        "lead": [
            "Ferenczi was describing children overwhelmed by adults they could not refuse. For them, reading "
            "the adult closely was the most intelligent response available: it kept the bond intact, even when "
            "the bond was also where the danger came from. A 2025 paper in the Journal of Trauma & Dissociation "
            "returns to his work and describes this adaptation as what lets an overwhelmed child keep "
            "“a bond of tenderness” with the adult.",
            "Your own history may be much quieter. An adult’s temper, fragility, exhaustion or grief can "
            "call for the same skill.",
        ],
        "blocks": [
            {"k": "prompt", "n": 1, "q": "Whose moods did you learn to read first — and roughly how old were you?", "lines": 2},
            {"k": "prompt", "n": 2, "q": "What were the early signals?",
             "hint": "A tone of voice, footsteps, a silence, the way a door closed.", "lines": 2},
            {"k": "checks", "n": 3, "q": "What did reading them early make possible?",
             "options": ["keeping the peace", "staying close", "protecting someone else", "avoiding punishment", "being wanted"],
             "other": True},
            {"k": "prompt", "n": 4, "q": "Where does the radar switch on now? With whom, in which rooms?", "lines": 3},
            {"k": "checks", "n": 5, "q": "While it is on, what goes quiet in you?",
             "options": ["hunger", "tiredness", "an opinion", "anger", "a wish to leave"], "other": True},
            {"k": "prompt", "n": 6, "q": "It picks up what others miss. Where could you use it by choice, rather than by reflex?", "lines": 3},
        ],
    },
    {
        "id": "winnicott",
        "kicker": "Part three · What it became",
        "title": "The caretaker",
        "quote": "Only the True Self can be creative and only the True Self can feel real.",
        "attr": "D. W. Winnicott · Ego Distortion in Terms of True and False Self · 1960",
        "lead": [
            "When a baby’s spontaneous gestures keep being met with the adult’s own instead, Winnicott "
            "observed, the baby learns to comply — and compliance slowly becomes a self. He called it the "
            "False Self; one of his patients called hers the “Caretaker Self”. Its job, he wrote, is "
            "“to hide and protect the True Self, whatever that may be.” Compliance in itself is not the "
            "problem: “the ability to compromise is an achievement.” The difficulty begins when the "
            "caretaker is the only one who ever answers the door.",
        ],
        "blocks": [
            {"k": "form", "n": 1, "q": "Write its job description.",
             "rows": [("Working hours", "When and where does it clock in?"),
                      ("Core skills", "What is it excellent at?"),
                      ("House rules", "What is it never allowed to do?"),
                      ("A day off", "If it took one, what might happen?")]},
            {"k": "prompt", "n": 2, "q": "What has it been protecting?",
             "hint": "Behind the caretaker: a want, a feeling, a way of being yourself.", "lines": 2},
            {"k": "table", "n": 3,
             "q": "“The spontaneous gesture is the True Self in action.” This week, catch three moments when your body moved first.",
             "hint": "A laugh, a reach, a wish to leave, a “no” in the throat.",
             "cols": ("The moment", "Then I…"), "choices": ["acted on it", "held it", "swallowed it"], "rows": 3},
        ],
    },
    {
        "id": "introjection",
        "kicker": "Part four · The rule underneath",
        "title": "Chew the rule",
        "lead": [
            "Ferenczi gave psychoanalysis the word introjection in 1909. Fritz and Laura Perls carried it into "
            "Gestalt therapy with a bodily image: an introject is something swallowed whole — a rule taken in "
            "before it could be tasted, chewed, and then kept or refused. The automatic yes often rests on one or two of them.",
        ],
        "blocks": [
            {"k": "checks", "n": 1, "q": "Tick any that sound familiar, or add your own.", "cols": 2,
             "options": ["“Don’t make a fuss.”", "“Keep the peace.”",
                         "“Their feelings are your job.”", "“Needing things is a burden.”",
                         "“Be easy to be around.”", "“If someone is upset, fix it.”",
                         "“Good people don’t disappoint.”"], "other": True},
            {"k": "prompt", "n": 2, "q": "Choose one and write it here, word for word.", "lines": 1},
            {"k": "chew", "n": 3, "q": "Now chew it, slowly.",
             "subs": [("Whose voice does it speak in?", 1),
                      ("When did it make sense — in which situation?", 2),
                      ("What did it protect, and whom?", 2),
                      ("What in it is still worth keeping?", 1),
                      ("What in it no longer fits your life?", 1)]},
            {"k": "prompt", "n": 4, "q": "Rewrite it in your own words, as something you would choose.", "lines": 3},
            {"k": "example", "t": "For instance, “Keep the peace” might become: “I care about peace, and I can "
                                  "live through some friction on the way to a real one.”"},
        ],
    },
]

TURN = {
    "quote": "Change occurs when one becomes what he is, not when he tries to become what he is not.",
    "attr": "Arnold Beisser · The Paradoxical Theory of Change · 1970",
    "paras": [
        "So what follows does not ask you to stop saying yes. It asks you to be there when you say it.",
        "A yes you are present for is already a different yes.",
    ],
}

PAUSE = {
    "id": "pause",
    "kicker": "Part five · Next time",
    "title": "A pause at the boundary",
    "lead": [
        "Gestalt has a name for what the yes once was: a creative adjustment — the best response available "
        "in a situation that needed it. The situation has changed; the response stayed. What moves it is contact: "
        "being there with your body and your want, while the other person is there too.",
    ],
    "moves": [
        ("Feel the pull.", "Notice where it lands \u2014 perhaps the place you marked on page 3. Say to yourself: "
                            "there\u2019s the pull.", None, ["Where it lands for me:"]),
        ("Buy a breath.", "Pick a sentence that makes room, or write your own:",
         ["\u201cLet me check and come back to you.\u201d", "\u201cGive me a minute to think.\u201d",
          "\u201cI\u2019m not sure yet.\u201d", "\u201cCan I tell you tomorrow?\u201d", None], []),
        ("Find your part.", "What do I want here, even a little? What am I willing to give \u2014 all of it, some of "
                            "it, none of it? Answer from there:", ["yes", "partly", "not now", "no"],
         ["What I want:", "What I\u2019m willing to give:"]),
    ],
    "experiment": {
        "title": "A small experiment",
        "text": "Choose one low-stakes moment this week, with someone where a little friction is survivable. "
                "The first solution was right for a bond that could not hold a no. The experiment finds out "
                "whether this one can.",
        "where": "Where, and with whom:",
        "try_label": "What I’ll try:",
        "try": ["a pause", "a partial yes", "saying a preference", "a small no"],
    },
    "note": "If a no has ever been met with threats, punishment or harm in a relationship, the old solution may "
            "still be protecting you there. That belongs with support, not with an experiment.",
}

AFTER = {
    "id": "after",
    "kicker": "Afterwards",
    "title": "What happened",
    "lead": ["Fill this in after the experiment, while it is still fresh."],
    "blocks": [
        {"k": "prompt", "n": 1, "q": "What I did:", "lines": 3},
        {"k": "prompt", "n": 2, "q": "What I felt, and where:", "lines": 3},
        {"k": "prompt", "n": 3, "q": "What the other person did:", "lines": 3},
        {"k": "prompt", "n": 4, "q": "What happened between us afterwards — that day, that week:", "lines": 3},
        {"k": "prompt", "n": 5, "q": "What I learned:", "lines": 3},
    ],
    "stays_title": "What stays with you",
    "stays": ["Something I noticed", "A rule I’m chewing", "The next experiment"],
}

CLOSING = {
    "quote": "The True Self comes from the aliveness of the body tissues and the working of body-functions, "
             "including the heart’s action and breathing.",
    "attr": "D. W. Winnicott · 1960",
    "lines": [
        "This worksheet goes with the long-form video on people-pleasing on YouTube — Genia | Human Heart.",
        "Sessions online, in English and Russian.",
        "More free material, and a monthly letter: humanheart.life",
    ],
    "fine": "For reflection and self-study. This worksheet is not counselling and does not replace it.",
}

SOURCES = [
    "Beisser, A. (1970). The paradoxical theory of change. In J. Fagan & I. L. Shepherd (Eds.), "
    "<i>Gestalt Therapy Now</i>. Palo Alto: Science and Behavior Books.",
    "Ferenczi, S. (1909). Introjection and transference. In <i>First Contributions to Psycho-Analysis</i> (1952). "
    "London: Hogarth Press.",
    "Ferenczi, S. (1949). Confusion of tongues between the adults and the child: The language of tenderness and "
    "of passion. <i>International Journal of Psycho-Analysis</i>, 30(4), 225–230. Read at Wiesbaden, 1932.",
    "Frankel, J. (2002). Exploring Ferenczi’s concept of identification with the aggressor: Its role in "
    "trauma, everyday life, and the therapeutic relationship. <i>Psychoanalytic Dialogues</i>, 12(1), 101–139.",
    "Howell, E. F. (2026). The buried, but recently unearthed treasure of Sandor Ferenczi’s work: Its "
    "relevance to current practice and sociocultural life. <i>Journal of Trauma &amp; Dissociation</i>, 27(1), "
    "50–62. Published online November 2025.",
    "Perls, F. S. (1947). <i>Ego, Hunger and Aggression</i>. London: Allen &amp; Unwin.",
    "Perls, F., Hefferline, R., &amp; Goodman, P. (1951). <i>Gestalt Therapy: Excitement and Growth in the "
    "Human Personality</i>. New York: Julian Press.",
    "Winnicott, D. W. (1965). Ego distortion in terms of true and false self (1960). In <i>The Maturational "
    "Processes and the Facilitating Environment</i> (pp. 140–152). London: Hogarth Press.",
]


# ---------------------------------------------------------------------------
# Web page only (humanheart.life/en/take/automatic-yes)
# Describe, don't promise — same rule as the rest of the /take shelf.
# ---------------------------------------------------------------------------
WEB = {
    "slug": "automatic-yes",
    "path": "/en/take/automatic-yes",
    "meta_title": "The automatic yes \u2014 a worksheet on people-pleasing | Human Heart",
    "meta_description": ("A free worksheet on people-pleasing through Ferenczi, Winnicott and Gestalt: "
                         "catch one yes, trace where it began, and try one small experiment."),
    "take_card": {"kind": "Worksheet", "title": "The automatic yes",
                  "description": "Five short parts, for the yes that arrives before you do."},
    "crumb": "Take with you",
    "crumb_here": "Worksheet",
    "hero_kicker": "Worksheet \u00b7 free",
    "hero_meta": "Five short parts. About forty minutes. Go through it on this page, or take the PDF.",
    "confirmed": "Confirmed. The monthly letter will come to this address.",
    "signup_top": {
        "title": "Take the PDF with you",
        "text": "Ten printable pages, sent to your inbox.",
        "label": "Email",
        "placeholder": "you@example.com",
        "consent": ("Also send me the monthly letter: one longer piece a month, on feelings and relationships. "
                    "Leaving takes one click."),
        "button": "Send me the PDF",
        "sending": "Sending\u2026",
        "small": ("Your address is used only for what you choose here. The emails go out through Brevo; "
                  "the address is not passed on to anyone else."),
        "privacy": "Privacy",
        "done": "Sent. It should arrive within a few minutes \u2014 if not, the spam folder is worth a look.",
        "done_with_letter": ("Sent. It should arrive within a few minutes. A second email asks you to confirm "
                             "the monthly letter."),
        "invalid": "That address doesn\u2019t look complete yet.",
        "error": "Something went wrong on the way. Please try again in a minute.",
        "rate_limited": "Too many attempts from here. Please wait a few minutes and try again.",
    },
    "on_page": ("Or go through it here. Nothing you write is sent anywhere \u2014 not to me, not to anyone. "
                "It isn\u2019t saved either, unless you choose to keep it on this device; at the end you can "
                "print it or save it as a PDF."),
    "keep_label": "Keep my answers on this device",
    "keep_help": "Stored in this browser only. Switch off to delete them.",
    "figure_hint": "Tap the figure to mark a spot; tap a mark to remove it.",
    "figure_label": "Body outline. Tap to mark where you felt it.",
    "other_placeholder": "your own",
    "moment_placeholder": "The moment",
    "print": "Print or save as PDF",
    "clear": "Clear my answers",
    "clear_confirm": "Clear everything? Tap again",
    "saved_on": "Kept on this device.",
    "saved_off": "Not saved \u2014 print or save as PDF to keep your answers.",
    "letter": {
        "kicker": "The monthly letter",
        "title": "A longer letter, once a month",
        "text": ("What doesn\u2019t fit into a video: one question about feelings and relationships, "
                 "thought through slowly."),
        "button": "Subscribe",
        "small": "One email a month. Leaving takes one click.",
        "done": "Thank you. Please confirm your address from the email that has just been sent.",
    },
    "book": "Book a Session",
    "watch": "Watch on YouTube",
    "sources_title": "Sources",
}

# ---------------------------------------------------------------------------
# Emails
#   worksheet : transactional, sent by the take-signup Edge Function (built in code,
#               like the booking emails, so a test can assert on the exact bytes)
#   doi       : the Brevo double opt-in template for the monthly letter \u2014 created by
#               hand in Brevo (Templates), because Brevo only sends DOI mail from its own
#               templates. Its button must use the link type "Double opt-in link".
# ---------------------------------------------------------------------------
EMAILS = {
    "worksheet": {
        "subject": "The automatic yes \u2014 your worksheet",
        "heading": "Your worksheet",
        "greeting": "Hello,",
        "body": [
            "Here is the worksheet you asked for \u2014 ten pages, printable, to go through at your own pace.",
        ],
        "button": "Download the PDF",
        "after": [
            "It goes with the long-form video on people-pleasing on YouTube, Genia | Human Heart. "
            "If you would rather fill it in on screen, the same worksheet is on the site.",
            "One line from the first page: if something surfaces with more force than you can hold, stop. "
            "Some of this is better explored with a counsellor or therapist than alone.",
        ],
        "signoff": ["Genia", "Gestalt Counsellor \u00b7 humanheart.life"],
        "footer": ("You received this one email because this address asked for the worksheet on humanheart.life. "
                   "Nothing else follows, unless you confirm the monthly letter."),
    },
    "doi": {
        "subject": "One click to confirm the monthly letter",
        "body": [
            "You asked to receive the monthly letter from Human Heart: one longer piece a month, "
            "on feelings and relationships.",
            "Please confirm that this address is yours:",
        ],
        "button": "Confirm my address",
        "after": [
            "If this wasn\u2019t you, ignore this email and nothing will be sent.",
            "By confirming, you agree to receive the letter by email. Every letter carries a link to leave.",
        ],
        "signoff": ["Genia", "Human Heart \u00b7 humanheart.life"],
    },
}
