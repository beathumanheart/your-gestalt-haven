// Content for the Feelings Map (/feeling).
//
// Ported from the `feelings-map.html` design reference. The six rings follow
// Leslie Greenberg's emotion-focused sequence: land in the present, find the
// felt sense, name the feeling, tell a reactive feeling from the one under it,
// reach the need, then notice the impulse.
//
// NOTE: the RU words `вина, стыд` and `апатия, безразличие` are split into two
// entries each (unlike EN, which keeps both pairs merged). The RU definition
// lists were written for the split form, so merging them back would shift every
// later definition onto the wrong word.

/** One of the six regions of feeling in ring 3. */
export interface FeelingFamily {
  id: string;
  /** Shown in the hover preview panel under the wheel. */
  short: string;
  /** Full label, e.g. "Anger". */
  t: string;
  /** Shorter label used on the wheel when `t` is too long. */
  wheel?: string;
  l1: string;
  l2: string;
  fs: number;
  words: string[];
  behind: string;
  listLabel?: string;
  list?: string;
}

/** One ring of the map. */
export interface FeelingRing {
  ring: string;
  short: string;
  theory: string;
  q: string;
  body: string;
  words?: string[];
  /** Ring 3 only. */
  families?: FeelingFamily[];
  /** Ring 4 only. */
  pairs?: string;
  /** Ring 5 only — the label inside the centre disc. */
  centre?: string;
}

export interface FeelingsContent {
  title: string; intro: string; intro2: string; suggestive: string;
  wordsMore: string; wordsLess: string;
  defBody: string; defOut: string; defUnder: string; defNot: string;
  clear: string; behindAsk: string; behindCaveat: string;
  tally: string; step: string; deeper: string; out: string;
  previewLabel: string;
  /** Names the six ring-3 segments for screen readers — the wheel itself has
   *  no visible label for them since the ring-name stack was removed. */
  chooseLabel: string;
  /** Mobile bottom sheet. */
  sheetClose: string;
  /** Mobile only — the instruction line that sits directly above the wheel.
   *  Both sentences are lifted verbatim from `intro` / `intro2`, which move
   *  below the wheel (`intro`) or are dropped (`intro2`) at that breakpoint. */
  touchHint: string;
  /** Pinned above the sheet's ring nav so it cannot scroll out of view. */
  writeDown: string;
  /** Support card: the addresses sit behind this disclosure. */
  showAddresses: string; hideAddresses: string;
  s1: FeelingRing; s2: FeelingRing; s3: FeelingRing;
  s4: FeelingRing; s5: FeelingRing; s6: FeelingRing;
  supportKicker: string; supportTitle: string; supportBody: string; donateNote: string;
  missingKicker: string; missingTitle: string; missingBody: string; missingBodyForm: string;
  missingSoon: string; missingOpen: string;
  copyAddr: string; copyAddrAria: string; addrCopied: string; copied: string; copyFail: string;
  foot1: string; foot2: string;
}

export const feelingsEN: FeelingsContent = {
  "title": "What is going on with me",
  "intro": "Six rings, read from the outside in. The middle is the need. Touch any ring to open it, sit there as long as you like, then go a ring deeper. There is no order to keep and no clock running.",
  "intro2": "Keep a notebook beside you. The writing is where the work happens.",
  "suggestive": "Examples, not a list. Your own word, if you have one, is the better word.",
  "wordsMore": "more like these ({n})",
  "wordsLess": "fewer",
  "defBody": "In the body",
  "defOut": "From outside",
  "defUnder": "Under it",
  "defNot": "Not this when",
  "clear": "Clear marks",
  "behindAsk": "What usually sits behind {fam}",
  "behindCaveat": "A common pattern, not a verdict about you. If it does not fit, it does not fit.",
  "tally": "{n} marked",
  "step": "ring {n} of 6",
  "deeper": "Go deeper: {n}",
  "out": "The pull: {n}",
  "s1": {
    "ring": "Here and now",
    "short": "Here and now",
    "theory": "awareness in the present moment",
    "q": "What are you aware of, right now?",
    "body": "Not the story yet. The room, the sounds, the time of day, the thing you were about to do. Landing in the present is what makes the rest of the map readable.",
    "words": [
      "the light in the room",
      "a sound outside",
      "the chair holding me",
      "my breath",
      "the time of day",
      "someone nearby",
      "what I just finished",
      "what I was about to do",
      "how long I have been sitting"
    ]
  },
  "s2": {
    "ring": "In the body",
    "short": "In the body",
    "theory": "the felt sense — where the feeling lives",
    "q": "Where in your body is something happening?",
    "body": "Find the place, the temperature, the weight. Stay with it long enough to describe it out loud. The body usually knows before the words arrive.",
    "words": [
      "chest tight",
      "throat closing",
      "stomach dropping",
      "hot face",
      "heavy shoulders",
      "hollow",
      "jaw clenched",
      "shaky",
      "numb",
      "restless legs",
      "holding my breath",
      "heat in my hands",
      "weight on my ribs"
    ]
  },
  "s3": {
    "ring": "The word",
    "short": "The word",
    "theory": "six places to look, and what sits behind each",
    "q": "Which region is it, and which word inside it?",
    "body": "Choose the region first — that is the easy part. Inside it the words run from the hottest at the start to the quietest at the end; take the one that fits closest, even if it only almost fits.",
    "families": [
      {
        "id": "anger",
        "short": "usually stands in front of hurt, a crossed line, fear of losing something, or shame",
        "t": "Anger",
        "l1": "Anger",
        "l2": "",
        "fs": 20,
        "words": [
          "rage",
          "fury",
          "hatred",
          "hysteria",
          "anger",
          "irritation",
          "contempt",
          "indignation",
          "resentment",
          "jealousy",
          "woundedness",
          "vexation",
          "envy",
          "dislike",
          "outrage",
          "revulsion"
        ],
        "behind": "Anger is the loudest feeling and rarely the first one. It usually stands in front of something softer: hurt, a line that was crossed, fear of losing something, or shame. Its job is to defend a boundary — so the useful question is not how to stop being angry, but what the anger came out to protect."
      },
      {
        "id": "fear",
        "short": "usually about losing safety, control, a person, or a version of yourself",
        "t": "Fear",
        "l1": "Fear",
        "l2": "",
        "fs": 20,
        "words": [
          "terror",
          "despair",
          "fright",
          "numbness",
          "suspicion",
          "anxiety",
          "bewilderment",
          "worry",
          "dread",
          "humiliation",
          "confusion",
          "disorientation",
          "guilt / shame",
          "doubt",
          "shyness",
          "apprehension",
          "embarrassment",
          "stunned"
        ],
        "behind": "Fear is always about something that could be lost — safety, control, a person, or a version of yourself you rely on. Naming what specifically is at stake shrinks it from a fog to a sentence.",
        "listLabel": "The ten it is usually about",
        "list": "being judged · making a mistake · what is new · being alone · being responsible · the dark · heights · being disappointed in myself · the future · my own life"
      },
      {
        "id": "sadness",
        "short": "usually follows a loss — a person, a hope, a future you had started living in",
        "t": "Sadness",
        "l1": "Sadness",
        "l2": "",
        "fs": 19,
        "words": [
          "bitterness",
          "yearning",
          "mourning",
          "sluggishness",
          "pity",
          "detachment",
          "despair",
          "helplessness",
          "heartache",
          "hopelessness",
          "estrangement",
          "disappointment",
          "shock",
          "regret",
          "boredom",
          "no way out",
          "sorrow",
          "cornered"
        ],
        "behind": "Sadness follows a loss: a person, a hope, a version of the future you had already started living in. It asks to be grieved rather than solved, and it is the feeling most often mistaken for something being wrong with you."
      },
      {
        "id": "joy",
        "short": "marks a need that is being met right now",
        "t": "Joy",
        "l1": "Joy",
        "l2": "",
        "fs": 20,
        "words": [
          "happiness",
          "delight",
          "jubilation",
          "buoyancy",
          "liveliness",
          "serenity",
          "absorption",
          "interest",
          "care",
          "anticipation",
          "excitement",
          "looking forward",
          "hope",
          "curiosity",
          "release",
          "taking it in",
          "acceptance",
          "impatience",
          "faith",
          "amazement"
        ],
        "behind": "Joy marks a need that is being met right now. It belongs on the map for the same reason the painful regions do — it points at something true about what you need, and it is the column people skip past fastest."
      },
      {
        "id": "love",
        "short": "about contact and belonging — with another person, or with yourself",
        "t": "Love",
        "l1": "Love",
        "l2": "",
        "fs": 20,
        "words": [
          "tenderness",
          "warmth",
          "compassion",
          "bliss",
          "trust",
          "safety",
          "gratitude",
          "calm",
          "liking",
          "identity",
          "pride",
          "admiration",
          "respect",
          "self-worth",
          "being in love",
          "love for myself",
          "enchantment",
          "humility",
          "sincerity",
          "friendliness",
          "kindness",
          "oneness",
          "mutual help"
        ],
        "behind": "This region is about contact and belonging — with another person, or with yourself. It is often the hardest column to claim out loud, and the one that says most clearly what the need underneath is going to be."
      },
      {
        "id": "states",
        "short": "not feelings, but what the mind does with one. Something unnamed sits under these.",
        "t": "States and thoughts",
        "wheel": "Thoughts",
        "l1": "States and",
        "l2": "thoughts",
        "fs": 16,
        "words": [
          "nervousness",
          "disregard",
          "discontent",
          "spite",
          "chagrin",
          "intolerance",
          "anything goes",
          "remorse",
          "no way out",
          "superiority",
          "arrogance",
          "haughtiness",
          "brokenness",
          "inadequacy",
          "discomfort",
          "awkwardness",
          "apathy / indifference",
          "uncertainty",
          "dead end",
          "tiredness",
          "being forced",
          "loneliness",
          "rejection",
          "low spirits",
          "coldness",
          "not caring",
          "satisfaction",
          "confidence",
          "contentment",
          "elation",
          "solemnity",
          "cheerfulness",
          "relief",
          "encouragement",
          "surprise",
          "empathy",
          "feeling part of something",
          "evenness",
          "naturalness",
          "love of life",
          "inspiration",
          "enthusiasm"
        ],
        "behind": "These are not feelings. They are what the mind does with a feeling — a position, a conclusion, a mood you settle into. If the closest word you can find is in this group, there is almost certainly a feeling underneath it that has not been named yet. Go back to the body and try again."
      }
    ]
  },
  "previewLabel": "Behind this",
  "chooseLabel": "what you're feeling",
  "sheetClose": "Close",
  "touchHint": "Touch any ring. Keep a notebook beside you.",
  "writeDown": "Write this ring down before you go deeper.",
  "showAddresses": "Show addresses",
  "hideAddresses": "Hide addresses",
  "s4": {
    "ring": "Underneath",
    "short": "Beneath",
    "theory": "the first feeling, or the one that came after it",
    "q": "Did something else come before this feeling?",
    "body": "Anger often arrives after hurt. Hopelessness often arrives after anger. And sometimes the first feeling is exactly what it looks like. Nobody can answer this for you, and you do not have to answer it today.",
    "pairs": "Common pairs: anger over hurt · hopelessness over anger · worry over anger · contempt over shame · busyness over grief",
    "words": [
      "this is the first feeling",
      "something came before it",
      "it stands in front of a softer one",
      "it is old and familiar",
      "I feel two at once",
      "not sure yet"
    ]
  },
  "s5": {
    "ring": "The need",
    "short": "The need",
    "centre": "The need",
    "theory": "what the feeling is pointing at",
    "q": "What did you need, and not get?",
    "body": "Every ring above is pointing here. This is the centre of the map and it is worth the most time. Naming a need does not oblige you to go and get it today.",
    "words": [
      "to be seen",
      "to be safe",
      "to matter",
      "to be held",
      "comfort",
      "closeness",
      "space",
      "rest",
      "to be told the truth",
      "to be forgiven",
      "to forgive",
      "to belong",
      "to be allowed to say no",
      "dignity",
      "fairness",
      "to be wanted",
      "to grieve",
      "to be understood"
    ]
  },
  "s6": {
    "ring": "The pull",
    "short": "The pull",
    "theory": "what the feeling moves you to do",
    "q": "What does it want you to do right now?",
    "body": "Write the honest impulse, including the one you would never act on. Naming it is not doing it — and the gap between the two is where the choice lives. Before anything else: am I hungry, angry, lonely, tired?",
    "words": [
      "get away",
      "push back",
      "hide",
      "shut down",
      "explain myself",
      "fix it for them",
      "go quiet",
      "call someone",
      "cry",
      "apologise first",
      "reach for something",
      "stay exactly here"
    ]
  },
  "supportKicker": "Support",
  "supportTitle": "Help it grow",
  "supportBody": "The map stays free. Money goes to hosting and to writing more of it — new words, translations, explanations. Crypto is the one way to give that keeps the anonymity intact: no card, no email, no receipt with a name on it.",
  "donateNote": "Send only on the network named beside the address, and check the first and last characters before you send.",
  "missingKicker": "Feedback",
  "missingTitle": "What is missing?",
  "missingBody": "A word that should be here, a region that sits in the wrong place, a translation that misses.",
  "missingBodyForm": "A word that should be here, a region that sits in the wrong place, a translation that misses. The form opens in a new tab and asks for no name and no email.",
  "missingSoon": "The form is not linked yet.",
  "copyAddr": "Copy",
  "copyAddrAria": "Copy the {c} address",
  "addrCopied": "{c} address copied",
  "missingOpen": "Open the form",
  "copied": "Copied to clipboard",
  "copyFail": "Could not copy — select the text by hand",
  "foot1": "The order of the rings follows the emotion-focused sequence set out by Leslie Greenberg: attend to the body, put the feeling into language, tell a reactive feeling from the one underneath it, and find the need the feeling points at. Each feeling carries a bodily sense, an impulse, and a need.",
  "foot2": "The map describes and asks. It does not interpret, diagnose or conclude anything about you — that work belongs to you and the person you sit with. It is built to sit beside step work, gestalt awareness practice and analytic counselling without standing in for any of them."
};

export const feelingsRU: FeelingsContent = {
  "title": "Что со мной происходит",
  "intro": "Шесть кругов, которые читают снаружи внутрь. В середине — потребность. Коснитесь любого круга, побудьте в нём столько, сколько нужно, потом идите на круг глубже. Порядок соблюдать не обязательно, и никакого таймера здесь нет.",
  "intro2": "Держите блокнот рядом. Работа происходит на бумаге.",
  "suggestive": "Это примеры, а не список. Своё слово, если оно есть, точнее любого здешнего.",
  "wordsMore": "ещё такие же ({n})",
  "wordsLess": "свернуть",
  "defBody": "В теле",
  "defOut": "Со стороны",
  "defUnder": "Под этим",
  "defNot": "Не это, если",
  "clear": "Снять отметки",
  "behindAsk": "Что обычно стоит за этим?",
  "behindCaveat": "Это частая закономерность, а не приговор. Не подходит — значит не подходит.",
  "tally": "отмечено: {n}",
  "step": "круг {n} из 6",
  "deeper": "Глубже: {n}",
  "out": "Наружу: {n}",
  "s1": {
    "ring": "Здесь и сейчас",
    "short": "Здесь и сейчас",
    "theory": "осознавание в настоящем моменте",
    "q": "Что замечается прямо сейчас?",
    "body": "Пока не история. Комната, звуки, время дня, отложенное дело. Возвращение в настоящее — это то, что делает остальную карту читаемой.",
    "words": [
      "свет в комнате",
      "звук за окном",
      "стул подо мной",
      "моё дыхание",
      "время дня",
      "кто-то рядом",
      "что только что закончилось",
      "что было задумано",
      "сколько уже сижу здесь"
    ]
  },
  "s2": {
    "ring": "В теле",
    "short": "В теле",
    "theory": "телесное чувствование — где живёт чувство",
    "q": "Где в теле сейчас что-то происходит?",
    "body": "Место, температура, тяжесть. Побыть с этим достаточно долго, чтобы описать вслух. Тело обычно знает раньше, чем приходят слова.",
    "words": [
      "сжатие в груди",
      "горло перехватывает",
      "провал в животе",
      "горячее лицо",
      "тяжёлые плечи",
      "пустота",
      "сжатая челюсть",
      "дрожь",
      "онемение",
      "ноги не на месте",
      "задерживаю дыхание",
      "жар в руках",
      "давит на рёбра"
    ]
  },
  "s3": {
    "ring": "Слово",
    "short": "Слово",
    "theory": "шесть мест, куда посмотреть, и что стоит за каждым",
    "q": "Какая это область и какое слово внутри неё?",
    "body": "Сначала область — это простая часть. Внутри слова идут от самых горячих в начале к самым тихим в конце; подходит то, что ближе всего, даже если только почти.",
    "families": [
      {
        "id": "anger",
        "short": "обычно стоит перед болью, нарушенной границей, страхом потери или стыдом",
        "t": "Гнев",
        "l1": "Гнев",
        "l2": "",
        "fs": 20,
        "words": [
          "бешенство",
          "ярость",
          "ненависть",
          "истерия",
          "злость",
          "раздражение",
          "презрение",
          "негодование",
          "обида",
          "ревность",
          "уязвлённость",
          "досада",
          "зависть",
          "неприязнь",
          "возмущение",
          "отвращение"
        ],
        "behind": "Гнев — самое громкое чувство и почти никогда не первое. Обычно он стоит перед чем-то более мягким: перед болью, перед нарушенной границей, перед страхом потерять что-то, перед стыдом. Его работа — защищать границу, поэтому полезный вопрос не «как перестать злиться», а «что гнев вышел защищать»."
      },
      {
        "id": "fear",
        "short": "обычно о потере безопасности, контроля, человека или версии себя",
        "t": "Страх",
        "l1": "Страх",
        "l2": "",
        "fs": 20,
        "words": [
          "ужас",
          "отчаяние",
          "испуг",
          "оцепенение",
          "подозрение",
          "тревога",
          "ошарашенность",
          "беспокойство",
          "боязнь",
          "унижение",
          "замешательство",
          "растерянность",
          "вина",
          "стыд",
          "сомнение",
          "застенчивость",
          "опасение",
          "смущение",
          "ошеломлённость"
        ],
        "behind": "Страх всегда о том, что может быть потеряно: о безопасности, о контроле, о человеке, о той версии себя, на которой всё держится. Когда названо, что именно под угрозой, страх перестаёт быть туманом и становится фразой.",
        "listLabel": "Десять, о которых он чаще всего",
        "list": "страх оценки · страх ошибки · страх нового · страх одиночества · страх ответственности · страх темноты · страх высоты · страх разочарования в себе · страх будущего · страх за свою жизнь"
      },
      {
        "id": "sadness",
        "short": "обычно идёт за потерей: человека, надежды, будущего, в котором уже начали жить",
        "t": "Грусть",
        "l1": "Грусть",
        "l2": "",
        "fs": 20,
        "words": [
          "горечь",
          "тоска",
          "скорбь",
          "лень",
          "жалость",
          "отрешённость",
          "отчаяние",
          "беспомощность",
          "душевная боль",
          "безнадёжность",
          "отчуждённость",
          "разочарование",
          "потрясение",
          "сожаление",
          "скука",
          "безысходность",
          "печаль",
          "загнанность"
        ],
        "behind": "Грусть идёт за потерей: человека, надежды, той версии будущего, в которой уже начали жить. Она просит, чтобы её оплакали, а не решили, — и её чаще всего принимают за признак того, что что-то не так."
      },
      {
        "id": "joy",
        "short": "отмечает потребность, которая сейчас удовлетворяется",
        "t": "Радость",
        "l1": "Радость",
        "l2": "",
        "fs": 19,
        "words": [
          "счастье",
          "восторг",
          "ликование",
          "приподнятость",
          "оживление",
          "умиротворение",
          "увлечение",
          "интерес",
          "забота",
          "ожидание",
          "возбуждение",
          "предвкушение",
          "надежда",
          "любопытство",
          "освобождение",
          "приятие",
          "принятие",
          "нетерпение",
          "вера",
          "изумление"
        ],
        "behind": "Радость отмечает потребность, которая прямо сейчас удовлетворяется. Она на карте по той же причине, что и болезненные области: она тоже указывает на правду о потребностях — и её колонку пролистывают быстрее всех."
      },
      {
        "id": "love",
        "short": "о контакте и принадлежности — с другим или с самим собой",
        "t": "Любовь",
        "l1": "Любовь",
        "l2": "",
        "fs": 19,
        "words": [
          "нежность",
          "теплота",
          "сочувствие",
          "блаженство",
          "доверие",
          "безопасность",
          "благодарность",
          "спокойствие",
          "симпатия",
          "идентичность",
          "гордость",
          "восхищение",
          "уважение",
          "самоценность",
          "влюблённость",
          "любовь к себе",
          "очарованность",
          "смирение",
          "искренность",
          "дружелюбие",
          "доброта",
          "единство",
          "взаимовыручка"
        ],
        "behind": "Эта область — о контакте и принадлежности: с другим человеком или с самим собой. Её труднее всего признать вслух, и она яснее всего говорит, какой окажется потребность в центре."
      },
      {
        "id": "states",
        "short": "не чувства, а то, что ум делает с чувством. Под ними есть неназванное.",
        "t": "Мысли и состояния",
        "wheel": "Мысли",
        "l1": "Мысли и",
        "l2": "состояния",
        "fs": 16,
        "words": [
          "нервозность",
          "пренебрежение",
          "недовольство",
          "вредность",
          "огорчение",
          "нетерпимость",
          "вседозволенность",
          "раскаяние",
          "безвыходность",
          "превосходство",
          "высокомерие",
          "надменность",
          "сломленность",
          "неполноценность",
          "неудобство",
          "неловкость",
          "апатия",
          "безразличие",
          "неуверенность",
          "тупик",
          "усталость",
          "принуждение",
          "одиночество",
          "отверженность",
          "подавленность",
          "холодность",
          "равнодушие",
          "удовлетворение",
          "уверенность",
          "довольство",
          "окрылённость",
          "торжественность",
          "жизнерадостность",
          "облегчение",
          "ободрённость",
          "удивление",
          "сопереживание",
          "сопричастность",
          "уравновешенность",
          "естественность",
          "жизнелюбие",
          "вдохновение",
          "воодушевление"
        ],
        "behind": "Это не чувства. Это то, что ум делает с чувством: позиция, вывод, состояние, в которое оседают. Если ближайшее слово, которое удалось найти, из этой группы — почти наверняка под ним есть чувство, которое ещё не названо. Вернуться к телу и попробовать снова."
      }
    ]
  },
  "previewLabel": "Что за этим",
  "chooseLabel": "что вы чувствуете",
  "sheetClose": "Закрыть",
  "touchHint": "Коснитесь любого круга. Держите блокнот рядом.",
  "writeDown": "Запишите этот круг, прежде чем идти глубже.",
  "showAddresses": "Показать адреса",
  "hideAddresses": "Скрыть адреса",
  "s4": {
    "ring": "Глубже",
    "short": "Глубже",
    "theory": "первое чувство или то, что пришло после",
    "q": "Было ли что-то до этого чувства?",
    "body": "Злость часто приходит после боли. Безнадёжность — часто после злости. А иногда первое чувство именно такое, каким кажется. Здесь нет правильного ответа, и отвечать сегодня не обязательно.",
    "pairs": "Частые пары: злость поверх боли · безнадёжность поверх злости · тревога поверх злости · презрение поверх стыда · суета поверх горя",
    "words": [
      "это первое чувство",
      "до него было другое",
      "оно стоит перед более мягким",
      "оно старое и знакомое",
      "их два одновременно",
      "пока не знаю"
    ]
  },
  "s5": {
    "ring": "Потребность",
    "short": "Потребность",
    "centre": "Потребность",
    "theory": "на что указывает чувство",
    "q": "Что было нужно и чего не случилось?",
    "body": "Все круги выше указывают сюда. Это центр карты, и он стоит больше всего времени. Назвать потребность не значит идти за ней сегодня.",
    "words": [
      "чтобы увидели",
      "быть в безопасности",
      "что-то значить",
      "чтобы обняли",
      "утешение",
      "близость",
      "пространство",
      "отдых",
      "чтобы сказали правду",
      "прощение",
      "простить",
      "принадлежать",
      "право сказать нет",
      "достоинство",
      "справедливость",
      "чтобы хотели рядом",
      "горевать",
      "чтобы поняли"
    ]
  },
  "s6": {
    "ring": "Порыв",
    "short": "Порыв",
    "theory": "к чему чувство подталкивает",
    "q": "Что хочется сделать прямо сейчас?",
    "body": "Запишите порыв честно — в том числе тот, который никогда не осуществится. Назвать — не значит сделать; в этом зазоре и живёт выбор. И прежде всего остального: голод, злость, одиночество, усталость?",
    "words": [
      "уйти",
      "ответить резко",
      "спрятаться",
      "замолчать",
      "оправдываться",
      "всё исправить за них",
      "затихнуть",
      "позвонить кому-то",
      "плакать",
      "извиниться первым",
      "потянуться за чем-нибудь",
      "остаться здесь"
    ]
  },
  "supportKicker": "Поддержка",
  "supportTitle": "Чтобы это оставалось бесплатным",
  "supportBody": "Деньги идут на хостинг и на то, чтобы здесь появлялись новые слова, переводы и объяснения. Криптовалюта — единственный способ дать анонимно: без банковской карты, без почты, без квитанции с именем.",
  "donateNote": "Отправляйте только в той сети, что указана рядом с адресом, и сверьте первые и последние символы перед отправкой.",
  "missingKicker": "Обратная связь",
  "missingTitle": "Чего здесь не хватает?",
  "missingBody": "Слово, которое должно быть здесь; область, выбранная неверно; перевод, который не попадает.",
  "missingBodyForm": "Слово, которое должно быть здесь; область, выбранная неверно; перевод, который не попадает. Форма открывается в новом окне и не спрашивает ни имени, ни почты.",
  "missingSoon": "Форма пока не подключена.",
  "copyAddr": "Скопировать",
  "copyAddrAria": "Скопировать адрес {c}",
  "addrCopied": "Адрес {c} скопирован",
  "missingOpen": "Открыть форму",
  "copied": "Скопировано",
  "copyFail": "Не удалось скопировать — выделите текст вручную",
  "foot1": "Порядок кругов следует эмоционально-фокусированной последовательности Лесли Гринберга: обратиться к телу, назвать чувство словами, отличить реактивное чувство от того, что лежит под ним, и найти потребность, на которую чувство указывает. У каждого чувства есть телесное ощущение, импульс и потребность.",
  "foot2": "Карта описывает и спрашивает. Она не интерпретирует, не ставит диагнозов и не делает выводов — эта работа принадлежит тому, кто её делает, и человеку, который сидит рядом. Она сделана так, чтобы стоять рядом с работой по Двенадцати шагам, гештальт-практикой осознавания и аналитическим консультированием, не подменяя ни одно из них."
};

/**
 * Per-word detail cards, indexed to match each family's `words` array.
 * Each entry is [meaning, in the body, from outside, under it, not this when].
 */
export type FeelingDef = [string, string, string, string, string];

export const feelingDefs: Record<"en" | "ru", Record<string, FeelingDef[]>> = {
  "en": {
    "love": [
      [
        "Love with care for something fragile.",
        "Warm chest, soft hands, a throat a little full.",
        "Gentler touch and voice, slowing down.",
        "Attachment, and knowing it can be lost.",
        "it looks down from above — that is pity"
      ],
      [
        "Love at a low steady flame: glad of someone.",
        "An open chest, easy shoulders, an unforced smile.",
        "Leaning in, small kindnesses, comfortable silence.",
        "Trust that has held over time.",
        "it needs proving — look at wanting to be liked"
      ],
      [
        "Love that moves toward someone's pain, level with them.",
        "An ache in the chest, forward lean, steady breath.",
        "Staying, listening without fixing, plain words.",
        "Recognition — you have been there too.",
        "you are above them — that is pity"
      ],
      [
        "Love with nothing missing; the whole system agrees.",
        "Warm and heavy, soft boundaries, slow breath.",
        "Silence, closed eyes, no wish to move.",
        "A deep need met fully, if briefly.",
        "it needs numbing to hold — this is not it"
      ],
      [
        "Love as the absence of guarding.",
        "Shoulders low, breath deep, stomach unclenched.",
        "Telling the truth first, asking plainly, resting near someone.",
        "Repeated evidence over time, not one promise.",
        "you believe against the evidence — that is hope"
      ],
      [
        "Love felt as: no threat here.",
        "Warm hands, quiet chest, the body letting go of watching.",
        "Sleep, honesty, being unimpressive on purpose.",
        "A nervous system that has been given proof.",
        "it depends on staying small — that is not safety"
      ],
      [
        "Love pointed backward, at what was given.",
        "A full throat, warm eyes, an open chest.",
        "Saying it, returning it, remembering out loud.",
        "A need met by someone who did not have to.",
        "debt comes with it — look for obligation"
      ],
      [
        "Love of the ordinary; nothing pressing.",
        "Even breath, loose jaw, settled weight.",
        "Unhurried movement, plain speech, ease with silence.",
        "Safety that lasted long enough to be believed.",
        "you hold still to avoid something — detachment"
      ],
      [
        "The mildest form: this person is easy to be near.",
        "A small lift in the chest, an open face.",
        "Choosing their company, remembering details, easy talk.",
        "Something recognised in them that you value.",
        "it asks for closeness back — closer to being in love"
      ],
      [
        "Love for who you are; the self recognising itself.",
        "A settled weight, level shoulders, an even voice.",
        "Saying no without apology, choosing the harder honest thing.",
        "Time spent being the same person in different rooms.",
        "it needs an audience — closer to pride"
      ],
      [
        "Love for something you or someone did well.",
        "A widening chest, a lifted chin, warmth up the neck.",
        "Telling people, standing straighter, keeping the thing.",
        "Effort that was real and finally visible.",
        "it is above others rather than for something — superiority"
      ],
      [
        "Love that looks up at someone.",
        "A lift under the ribs, a still attention, warm eyes.",
        "Watching closely, quoting them, wanting to learn.",
        "A quality you value being visibly alive in someone.",
        "you erase yourself in it — look at longing"
      ],
      [
        "Love that grants someone their own shape.",
        "A steady chest, an unhurried breath, an open posture.",
        "Listening to the end, keeping your word, no correcting.",
        "Seeing them as real and separate from your needs.",
        "it is earned by usefulness only — closer to approval"
      ],
      [
        "Love for yourself that does not need proof.",
        "Weight evenly held, breath low, hands still.",
        "Plain requests, rest without earning it, fewer apologies.",
        "Enough care received to become internal.",
        "it collapses when criticised — closer to pride"
      ],
      [
        "Love with the whole body leaning toward one person.",
        "Fast heart, light stomach, warm skin, poor sleep.",
        "Rereading messages, rearranging the day, talking about them.",
        "Longing and hope in the same breath.",
        "the pull is fear of losing them — that is anxiety"
      ],
      [
        "Love turned toward yourself as you actually are.",
        "A soft chest, an easy jaw, hands unclenched.",
        "Kinder self-talk, rest, ending what harms you.",
        "Having been loved this way by someone, once.",
        "it requires perfection first — that is not love"
      ],
      [
        "Love at the moment something takes you in.",
        "Held breath, wide eyes, a warm still chest.",
        "Stopping, staring, going quiet mid-sentence.",
        "Openness — the guard was down when it arrived.",
        "the person disappears in it — look at idealising"
      ],
      [
        "Love without the need to be the largest thing.",
        "Low shoulders, slow breath, a light chest.",
        "Listening, asking, letting others be right.",
        "Enough self-worth to stop defending.",
        "it is self-erasing — that is shame in a soft voice"
      ],
      [
        "Love as the choice to be seen accurately.",
        "A vulnerable open chest, warm face, steady voice.",
        "Saying the true thing early, plain language, no hedging.",
        "Trust that the truth will be received.",
        "it is used to wound — that is not sincerity"
      ],
      [
        "Love at a comfortable distance: goodwill.",
        "An easy chest, open hands, a light face.",
        "Greeting, small talk, an offer of help.",
        "Enough safety to be open with a stranger.",
        "it is performed to be liked — look at anxiety"
      ],
      [
        "Love that does something small for someone.",
        "Warmth in the hands and chest, a softer face.",
        "Practical help, no announcement, staying afterwards.",
        "Recognising a need because you know it yourself.",
        "it expects a return — look at obligation"
      ],
      [
        "Love where the separation drops for a moment.",
        "A wide chest, slow breath, blurred edges of self.",
        "Silence, tears without sadness, stillness together.",
        "A deep need for belonging, met.",
        "the self disappears from fear — that is merging"
      ],
      [
        "Love as two people carrying the same weight.",
        "A steady chest, energy in the arms, easy breath.",
        "Showing up, dividing the work, no scorekeeping.",
        "Trust built by having done it before.",
        "one carries it all — look at obligation"
      ]
    ],
    "states": [
      [
        "Not a feeling: the body braced with nowhere to aim.",
        "Light stomach, quick pulse, fidgeting fingers.",
        "Talking fast, joking, checking the time.",
        "Fear of something specific, most often judgement.",
        "you can name what is at stake — use the fear word"
      ],
      [
        "A position, not a feeling: you do not count here.",
        "A cool chest, a turned shoulder, flat attention.",
        "Not answering, talking over, forgetting on purpose.",
        "Usually anger, or fear of what they represent.",
        "it is honest disinterest — that carries no charge"
      ],
      [
        "A settled stance that things are not good enough.",
        "A low grumble under the ribs, a tight mouth.",
        "Criticism, comparing, small complaints.",
        "An unnamed want, or grief about something unchangeable.",
        "it points at one changeable thing — that is anger"
      ],
      [
        "A strategy, not a feeling: hurting to even the score.",
        "A tight satisfaction in the chest, narrow focus.",
        "Withholding, small sabotage, cold politeness.",
        "Humiliation nobody ever answered for.",
        "you want repair — the word underneath is hurt"
      ],
      [
        "A quiet mixture: disappointment plus embarrassment.",
        "Sinking chest, warm face, eyes down.",
        "Apologising, making light of it, changing the subject.",
        "Sadness about the thing, plus shame at being seen in it.",
        "the shame is absent — that is disappointment"
      ],
      [
        "A position that someone should not be as they are.",
        "Hard jaw, held breath, heat behind the eyes.",
        "Correcting, avoiding, speaking in rules.",
        "Fear of what their difference means for you.",
        "a real line was crossed — that is anger; name the line"
      ],
      [
        "A stance of no limits, usually after limits were denied.",
        "Loose, fast, oddly weightless.",
        "Risk, spending, saying yes past the point of care.",
        "Emptiness, or rage at having been controlled.",
        "it is joy with judgement intact — that is liveliness"
      ],
      [
        "Guilt that has turned toward repair.",
        "Heavy chest, hot face, tight throat, steady eyes.",
        "Naming it plainly, making it right, not asking for comfort.",
        "Love for the person harmed, and your own values.",
        "it is about how you look — that is shame"
      ],
      [
        "A conclusion: there is no door.",
        "A stalled chest, shallow breath, a fixed stare.",
        "Repeating that nothing can be done, refusing options.",
        "Fear that has been true too long to argue with.",
        "one option exists — that is helplessness"
      ],
      [
        "A position above other people.",
        "A cool wide chest, a lifted chin, distance.",
        "Advising unasked, faint amusement, keeping score.",
        "Fear of being ordinary, or shame beneath it.",
        "the skill is real and quietly held — that is confidence"
      ],
      [
        "A stance that others matter less.",
        "A stiff neck, held breath, a closed face.",
        "Dismissing, interrupting, not asking anything back.",
        "Shame that is being outrun.",
        "you can be told you are wrong — that is confidence"
      ],
      [
        "Superiority worn openly, as manner.",
        "A raised chin, slow blink, exaggerated ease.",
        "A drawl, a half-smile, corrections.",
        "Fear that without the pose there is nothing.",
        "it is quiet self-respect — that is dignity"
      ],
      [
        "A conclusion about yourself: something is finished.",
        "A caved chest, heavy limbs, a small voice.",
        "Stopping, agreeing to anything, not asking for more.",
        "Grief and fear that were never met by anyone.",
        "one rest changes it — that is exhaustion"
      ],
      [
        "A verdict: I am not enough.",
        "A hollow chest, a hot face, a wish to be smaller.",
        "Overworking, apologising, avoiding being seen.",
        "Shame, usually learned before you could argue with it.",
        "it is about one skill — that is not-yet-able"
      ],
      [
        "A state of low friction; something does not fit.",
        "A shifting body, tight shoulders, restlessness.",
        "Adjusting, checking the exit, going quiet.",
        "Often fear of being wrong in front of someone.",
        "the cause is physical — that is just discomfort"
      ],
      [
        "A state of being briefly out of step.",
        "Warm face, hands unsure, a laugh with no joke.",
        "Filling silence, over-explaining, looking away.",
        "Wanting to be received well right now.",
        "it lasts and settles — closer to shame"
      ],
      [
        "Not calm: feeling switched off to keep going.",
        "Nothing anywhere — the absence is the signal.",
        "Doing the minimum, flat voice, declining everything.",
        "Usually grief, fear or anger that had no room.",
        "rest and interest return quickly — that was tiredness"
      ],
      [
        "A state of not being able to land.",
        "A busy chest, restless hands, a stalling body.",
        "Asking again, delaying, arguing both sides.",
        "Fear of the cost of choosing wrong.",
        "one fact would settle it — that is confusion"
      ],
      [
        "A conclusion that every road is closed.",
        "A held breath, a heavy chest, no forward pull.",
        "Stopping mid-project, silence, refusing help.",
        "Fear of the one move you have not been able to make.",
        "you can name the move — that is fear"
      ],
      [
        "A body-level state: the fuel is gone.",
        "Heavy limbs, sore eyes, slow speech.",
        "Shorter sentences, cancelling, sleeping early.",
        "Sometimes only sleep debt; often grief doing its work.",
        "sleep does not touch it — look under it"
      ],
      [
        "A state of acting against yourself.",
        "A tight chest, held breath, stiff shoulders.",
        "Doing it anyway, resentment afterwards, silence.",
        "Fear of the cost of saying no.",
        "you chose it and dislike it — that is reluctance"
      ],
      [
        "A state of being without contact.",
        "A hollow chest, cold hands, a longer silence.",
        "Reaching for the phone, filling the room with sound.",
        "A need for closeness that is going unmet.",
        "you chose it and it restores you — that is solitude"
      ],
      [
        "A state of having been turned away.",
        "A dropped chest, a hot face, a stalled breath.",
        "Withdrawing first next time, keeping quieter.",
        "Grief and shame arriving together.",
        "nobody actually turned away — look at fear"
      ],
      [
        "A lowered state, quieter than sadness.",
        "Flat energy, slow movement, shallow interest.",
        "Doing less, saying less, declining invitations.",
        "Something unnamed being carried too long.",
        "a clear loss sits under it — that is sadness"
      ],
      [
        "A protective state: contact turned down.",
        "Cool skin, still face, even voice.",
        "Politeness with no warmth, short answers, distance.",
        "Hurt that decided not to risk again.",
        "it is genuine peace — that is calm"
      ],
      [
        "A stance of not letting it matter.",
        "Almost no sensation — that is the tell.",
        "Shrugging, changing the subject, no follow-up questions.",
        "Usually hurt or envy, ruled out of court.",
        "it truly does not matter — then it carries no charge"
      ],
      [
        "A state of a need being met.",
        "A settled chest, even breath, unclenched hands.",
        "Slowing down, fewer words, staying put.",
        "Something wanted that actually arrived.",
        "it needs announcing — look at relief"
      ],
      [
        "A state of trusting your own footing.",
        "Level shoulders, low breath, still hands.",
        "Plain statements, admitting gaps, no hurry.",
        "Experience that held up before.",
        "it needs others to be smaller — that is superiority"
      ],
      [
        "A state of enough.",
        "Warm and even, no pull anywhere.",
        "Staying, unhurried speech, no plans needed.",
        "A long stretch of needs being met.",
        "it is a way of not wanting — closer to resignation"
      ],
      [
        "A lifted state: something worked and you can feel it.",
        "Light chest, quick step, energy in the arms.",
        "Talking fast, making plans, telling people.",
        "Effort that finally showed a result.",
        "it cannot come down — look at agitation"
      ],
      [
        "A gathered state, larger than the moment.",
        "Slow breath, still body, a full chest.",
        "Quiet, formal care, unhurried movement.",
        "Recognising that something matters.",
        "it is performed for others — look at anxiety"
      ],
      [
        "A bright ongoing state, not tied to an event.",
        "Warm face, easy breath, ready laughter.",
        "Quick greetings, humour, easy company.",
        "Enough safety over time to stay open.",
        "it cannot stop — look for what it covers"
      ],
      [
        "A state right after a weight comes off.",
        "A long exhale, dropped shoulders, sudden tiredness.",
        "Sitting down, oddly quiet, then talkative.",
        "How much fear had been carried unnamed.",
        "nothing was at stake — that is happiness"
      ],
      [
        "A state of having been backed by someone.",
        "A warmer chest, straighter back, steadier hands.",
        "Trying again, asking for help sooner, moving.",
        "Being seen accurately by someone who stayed.",
        "it depends on constant praise — look at doubt"
      ],
      [
        "The state before the mind catches up.",
        "Raised brows, held breath, a stopped body.",
        "Stopping mid-sentence, a sharp inhale, pointing.",
        "Nothing yet — this is the pause before the feeling.",
        "it frightens rather than opens — that is shock"
      ],
      [
        "A state of feeling with someone, not for them.",
        "An ache in your chest that matches theirs.",
        "Staying, fewer words, no advice.",
        "Having been in something similar yourself.",
        "you are above them — that is pity"
      ],
      [
        "A state of being inside something with others.",
        "A warm wide chest, easy breath, loose shoulders.",
        "Joining in, staying late, using \"we\".",
        "A need to belong being met right now.",
        "it requires losing yourself — look at merging"
      ],
      [
        "A steady state: nothing pulling in either direction.",
        "Even breath, level weight, quiet hands.",
        "Measured speech, slower reactions, patience.",
        "Enough rest and safety to have room.",
        "it is flatness with nothing in it — closer to apathy"
      ],
      [
        "A state of not performing.",
        "Loose jaw, easy hands, ordinary breath.",
        "Plain speech, no adjusting, being unimpressive.",
        "Safety that has lasted long enough to be believed.",
        "it is a role you learned to play — look at fear"
      ],
      [
        "A state of being on the side of living.",
        "Warmth in the chest and limbs, appetite, energy.",
        "Making plans, saying yes, starting things.",
        "Something in life that is genuinely wanted.",
        "it must keep moving to hold — look at what stops"
      ],
      [
        "A state of being moved to make something.",
        "A rising chest, quick breath, warm hands.",
        "Starting immediately, working late, talking fast.",
        "Something recognised as true and yours.",
        "it burns out in a day — look at agitation"
      ],
      [
        "A state of energy behind a purpose.",
        "A warm forward-leaning body, quick breath.",
        "Recruiting others, working, planning aloud.",
        "Something that matters to you being possible.",
        "it cannot bear a question — look at anxiety"
      ]
    ],
    "anger": [
      [
        "Anger past the point of choosing; the body takes over.",
        "Heat in the face and hands, a roar in the ears.",
        "A raised voice, slammed things, words you cannot take back.",
        "Terror or humiliation arriving in the same second.",
        "you can still weigh what to say — that is fury"
      ],
      [
        "Anger with a target and a direction, still steerable.",
        "Jaw set, shoulders forward, breath short and high.",
        "Clipped sentences, a hard stare, a fast decision.",
        "A line crossed that mattered more than you admitted.",
        "there is no object and no plan — that is rage"
      ],
      [
        "Anger hardened into a settled position about someone.",
        "Cold rather than hot; a steady tightness that does not spike.",
        "Avoidance, contempt in small remarks, keeping score.",
        "An old injury nobody ever answered for.",
        "it flares and passes — that is fury"
      ],
      [
        "Feeling louder than the body can hold, spilling everywhere.",
        "Shaking, high fast breath, laughing and crying together.",
        "A voice that will not settle, movement without purpose.",
        "Fear with nowhere to put itself.",
        "the force has one clear object — see rage or terror"
      ],
      [
        "The plain form: something is wrong and you want it changed.",
        "Warmth in the chest, weight in the arms, a lean forward.",
        "A firmer voice, a straight sentence, standing your ground.",
        "Hurt, or a need ignored once too often.",
        "there is no push toward change — closer to resentment"
      ],
      [
        "Small repeated friction; anger at low volume.",
        "Shallow breath, a twitch in the jaw, restless hands.",
        "Sighs, short answers, things set down sharply.",
        "Tiredness, hunger, or a bigger anger not yet named.",
        "one specific act caused it — closer to indignation"
      ],
      [
        "Anger that places you above the other person.",
        "A cool chest, a lifted chin, an inward turning away.",
        "A half-smile, an eye-roll, mockery kept just polite.",
        "Shame — usually your own, moved onto someone else.",
        "you still want something from them — that is anger"
      ],
      [
        "Anger on behalf of fairness, yours or someone else's.",
        "Chest up and open, quickened breath, heat in the throat.",
        "Arguing the principle, telling people, refusing to drop it.",
        "A rule you live by, broken in front of you.",
        "it is only your own hurt — closer to resentment"
      ],
      [
        "Anger kept inside, pointed at someone who mattered.",
        "A held breath, a tight throat, a heaviness that waits.",
        "Going quiet, distance, bringing it up much later.",
        "Hurt plus the belief that saying it would cost too much.",
        "you can say it out loud today — that is hurt or anger"
      ],
      [
        "Fear of losing someone to somebody else.",
        "Churning stomach, hot chest, a pull to check and know.",
        "Questions, watching, needing reassurance twice.",
        "Fear of being replaceable.",
        "nothing is at risk of being lost — likely envy"
      ],
      [
        "The fresh sting of being hurt by someone close.",
        "A stab under the ribs, wet eyes, a caught breath.",
        "Going still, a changed voice, needing to withdraw.",
        "Attachment — this only hurts where you are held.",
        "it has aged into a position — that is resentment"
      ],
      [
        "Small anger at being thwarted or made to look foolish.",
        "A short hot flush, a click of the tongue, tension in the hands.",
        "A muttered comment, a shrug, moving on stiffly.",
        "Wounded pride, usually smaller than it feels.",
        "the harm was real and lasting — that is hurt"
      ],
      [
        "Wanting what someone else has.",
        "A hollow pull in the chest, eyes that keep returning.",
        "Comparison, faint criticism, changing the subject.",
        "A want of your own that has not been claimed.",
        "you fear losing something you already have — jealousy"
      ],
      [
        "A quiet steady no toward someone.",
        "Slight recoil, closed posture, cooler skin.",
        "Shorter answers, less time, polite distance.",
        "Something specific they did, often never named.",
        "the pull to get away is physical — that is revulsion"
      ],
      [
        "Anger at something plainly wrong, spoken out loud.",
        "A rising chest, a loud clear voice, heat in the face.",
        "Naming it publicly, refusing, telling others.",
        "A value you did not know you held so firmly.",
        "it stays private and cold — closer to contempt"
      ],
      [
        "Anger with the body's rejection in it.",
        "A turn in the stomach, a step back, tightened mouth.",
        "Turning away, refusing contact, a face that shows it.",
        "A boundary at the level of the body, not the argument.",
        "it is cool and superior — that is contempt"
      ]
    ],
    "fear": [
      [
        "Fear at full volume; the body decides before you do.",
        "Cold skin, unreliable legs, tunnel vision, heart everywhere.",
        "Freezing on the spot, running, a sound you did not plan.",
        "A threat to life, or to the person life is built around.",
        "you can still plan — that is fright or dread"
      ],
      [
        "Fear that has stopped seeing a way out.",
        "Heaviness with a panicked edge, chest hollow and fast.",
        "Going still, saying there is no point, refusing options.",
        "Something feared for a long time with no relief.",
        "the future still feels open — closer to hopelessness"
      ],
      [
        "A short sharp fear: arrives and leaves.",
        "A jolt, held breath, a jump in the chest.",
        "A start, a gasp, hands up before thinking.",
        "Surprise, plus a moment of not knowing you were safe.",
        "it stays for hours — that is anxiety"
      ],
      [
        "Fear so large the body goes quiet instead of loud.",
        "Distant limbs, muffled hearing, nothing where feeling should be.",
        "Stillness, a flat voice, doing nothing at all.",
        "A threat that could be neither fought nor escaped.",
        "it feels like calm — sit longer; calm has breath in it"
      ],
      [
        "Fear pointed at a person, looking for the catch.",
        "Alert chest, scanning eyes, shoulders slightly raised.",
        "Testing questions, checking, holding information back.",
        "A trust that was broken and never repaired.",
        "you have evidence — that may be knowing"
      ],
      [
        "Fear without an object, spread across the future.",
        "Fluttering chest, tight stomach, high breath, busy hands.",
        "Rehearsing conversations, checking twice, cannot settle.",
        "Almost always one specific fear that has not been named.",
        "you can name what you fear — use that word"
      ],
      [
        "Fear from ground moving that you thought was solid.",
        "Light head, hollow chest, a pause where thought should be.",
        "Repeating questions, needing it said again, going quiet.",
        "Something happened your map did not allow for.",
        "it settles into fear of what comes next — that is dread"
      ],
      [
        "Low steady fear about something that has not happened.",
        "A small knot below the ribs, tight jaw, shallow sleep.",
        "Bringing it up again, planning for it, checking on people.",
        "Care with no way to act on it.",
        "it takes over the body — it has become anxiety"
      ],
      [
        "Fear of a specific thing that is coming.",
        "A weight in the stomach that grows toward the date.",
        "Postponing, over-preparing, talking around it.",
        "Something you cannot control and cannot avoid.",
        "there is no particular event — that is anxiety"
      ],
      [
        "Fear of being seen as less, in front of someone.",
        "Hot face, a wish to disappear, a chest that caves.",
        "Silence, a laugh that is not one, leaving early.",
        "Being small in the eyes of someone whose view you need.",
        "only you saw it — that is shame or embarrassment"
      ],
      [
        "Fear when nothing makes sense yet.",
        "Flickering attention, held breath, a stalled feeling.",
        "Asking again, long pauses, starting sentences twice.",
        "Information missing that you need to feel safe.",
        "the ground itself moved — that is bewilderment"
      ],
      [
        "Fear that has lost its bearings.",
        "Unsteady legs, blurred edges, an unreliable sense of time.",
        "Rechecking basics, no plan, a shaken voice.",
        "Too much change too fast.",
        "one fact would fix it — that is confusion"
      ],
      [
        "Fear turned on yourself: I did wrong, I am wrong.",
        "Heavy chest, hot face, a tight throat, eyes down.",
        "Apologising, over-explaining, hiding, going quiet.",
        "Care about the person harmed, or a value you broke.",
        "it names a specific act and wants repair — that is remorse"
      ],
      [
        "Fear that you cannot trust your own read.",
        "A held breath, weight in the chest, a stalling body.",
        "Asking others, delaying, arguing both sides.",
        "A high cost for being wrong.",
        "the fear is of the outcome, not your judgement — that is worry"
      ],
      [
        "Fear of being looked at.",
        "Warm face, small voice, hands wanting something to hold.",
        "Short answers, less eye contact, waiting to speak.",
        "Fear of judgement, learned early.",
        "it comes only after a mistake — that is embarrassment"
      ],
      [
        "Fear with the volume low, aimed at what is next.",
        "A tight belly, careful breath, a slight brace.",
        "Asking questions first, taking the safer route, hesitating.",
        "Something valuable that could be lost.",
        "it grows to fill the day — that is anxiety"
      ],
      [
        "Fear of having been seen doing something clumsy.",
        "Hot ears, a laugh, a wish to rewind ten seconds.",
        "Making light of it, changing the subject, leaving.",
        "Wanting to be seen well by the people here.",
        "it is about who you are, not what you did — that is shame"
      ],
      [
        "Fear that has stopped the body mid-motion.",
        "Everything paused, mouth open, thought suspended.",
        "Standing there, saying nothing, a blank face.",
        "Something arriving faster than the mind can take.",
        "it passes into thinking again — that is bewilderment"
      ]
    ],
    "sadness": [
      [
        "Sadness turned sour from being carried alone.",
        "A taste in the mouth, tight throat, weight in the chest.",
        "Sharp remarks about old things, humour with an edge.",
        "Grief nobody heard, and anger about that.",
        "it still wants repair — closer to hurt or resentment"
      ],
      [
        "Sadness pulled toward something absent.",
        "A wide ache in the chest, sighing, restlessness at dusk.",
        "Looking things up, keeping objects, the same song again.",
        "Love with nowhere to land right now.",
        "the person is reachable — that is missing them"
      ],
      [
        "The sadness of a real loss, doing its proper work.",
        "Heavy limbs, wet eyes without warning, tired to the bone.",
        "Slowing down, telling the story, needing company or none.",
        "Love, in the exact shape of what is gone.",
        "nothing sits under this one; it is not a symptom"
      ],
      [
        "Not laziness; the body braking against something.",
        "Limbs like sandbags, fog behind the eyes, no pull anywhere.",
        "Putting things off, screens, starting nothing.",
        "Often grief, fear or exhaustion in a lazy costume.",
        "one day of rest fixes it — that was tiredness"
      ],
      [
        "Sadness for someone, from slightly above them.",
        "A soft ache in the chest, a small pull to reach out.",
        "Gentle voice, doing things for them, speaking softly of them.",
        "Fear that this could be you, and relief that it is not.",
        "you feel it with them, not about them — compassion"
      ],
      [
        "Sadness held far enough away to keep functioning.",
        "Quiet everywhere, sounds slightly distant, no edges.",
        "Calm competence, short answers, present but absent.",
        "Something too big to feel at full size yet.",
        "it is chosen and restful — that is calm"
      ],
      [
        "Sadness that has concluded nothing will change.",
        "Sunken chest, slow breath, weight across the shoulders.",
        "Stopping, staying in, declining what used to matter.",
        "A hope held a long time that finally broke.",
        "you still reach for a way out — that is helplessness"
      ],
      [
        "Sadness at having no move left to make.",
        "Loose arms, tight throat, a sinking under the ribs.",
        "Asking others what to do, going quiet, waiting.",
        "A need that depends on someone else to meet it.",
        "there is a move but no strength — that is exhaustion"
      ],
      [
        "Sadness felt as a physical pain in the chest.",
        "A real ache behind the breastbone, hard to breathe deep.",
        "A hand to the chest, quiet, needing to sit down.",
        "Love and loss in the same place at the same time.",
        "it is dull and long — that is sorrow"
      ],
      [
        "The conclusion that nothing ahead will be better.",
        "Slow everything: breath, speech, movement.",
        "Withdrawing, letting things lapse, flat answers.",
        "Grief that was never allowed to finish.",
        "one thing would change it — that is discouragement"
      ],
      [
        "Sadness at being far from someone you are near.",
        "A cool distance in the chest, a held-back body.",
        "Polite talk, no touching, keeping to your side.",
        "Contact that stopped and was never repaired.",
        "you never had the closeness — that is loneliness"
      ],
      [
        "Sadness that something did not turn out as expected.",
        "A drop in the chest, shoulders down, a long exhale.",
        "Understatement, a shrug, going quieter.",
        "How much you had let yourself want it.",
        "you are angry at someone for it — closer to resentment"
      ],
      [
        "Sadness that has not caught up with the fact.",
        "Cold hands, a loud heart, thought going in circles.",
        "Saying it out loud repeatedly, doing practical things.",
        "A loss the body registered before the mind agreed.",
        "the fact has landed — that is grief"
      ],
      [
        "Sadness pointed at your own choice.",
        "A pull in the stomach, a hot face when you remember.",
        "Going back over it, rehearsing what you would say now.",
        "Values you can only see clearly in hindsight.",
        "you harmed someone — that is remorse"
      ],
      [
        "Sadness disguised as nothing to do.",
        "A restless emptiness, heavy limbs, wandering attention.",
        "Scrolling, opening the fridge, starting and stopping.",
        "Often loneliness or grief, unnamed.",
        "real rest resolves it — that was tiredness"
      ],
      [
        "Sadness that has closed every exit.",
        "A hollow chest, a stalled breath, a fixed stare.",
        "Repeating that there is nothing to do, refusing help.",
        "A fear that has been true for a long time.",
        "you can name one option — that is hopelessness"
      ],
      [
        "The plain, quiet form of sadness.",
        "A soft weight in the chest, slow blinking, low voice.",
        "Needing quiet, moving slowly, a longer silence.",
        "A loss, small or large, being felt at its real size.",
        "it has an edge of anger — closer to bitterness"
      ],
      [
        "Sadness with nowhere left to move.",
        "Tight shoulders, shallow breath, a body ready to run.",
        "Snapping, then going silent, agreeing to anything.",
        "Fear of what happens if you stay.",
        "there is a way out you have not taken — helplessness"
      ]
    ],
    "joy": [
      [
        "The plain steady form: this is good and you know it.",
        "Warm chest, easy breath, shoulders down, a light face.",
        "Smiling without deciding to, generosity, wanting to share.",
        "A need being met right now, often a simple one.",
        "it has to be announced loudly — check for relief"
      ],
      [
        "Joy with a jump in it; something exceeded expectation.",
        "A lift in the chest, quick breath, warmth up the neck.",
        "Exclaiming, grabbing someone's arm, telling it twice.",
        "Surprise plus something you cared about more than you said.",
        "it settles into steady warmth — that is happiness"
      ],
      [
        "Joy that wants witnesses; triumph is part of it.",
        "Chest wide, arms wanting up, energy in the legs.",
        "A loud voice, movement, calling people.",
        "Effort that finally paid off, often after doubt.",
        "there is more relief than pride — name the relief"
      ],
      [
        "A light lifted mood, not attached to one event.",
        "Springy legs, easy breath, an upward pull.",
        "Quicker step, humour, saying yes to things.",
        "Rest, safety, or something quietly resolving.",
        "it is brittle and fast — look for anxiety in bright clothes"
      ],
      [
        "Joy as returning energy; the system coming back on.",
        "Warmth in the limbs, appetite, wanting to move.",
        "Talking more, making plans, starting things.",
        "A long flat stretch that has just ended.",
        "it cannot slow down — it may be agitation"
      ],
      [
        "Joy with the volume off: nothing is needed right now.",
        "Slow breath, soft belly, weight settled evenly.",
        "Stillness, unhurried speech, easy to be around.",
        "A need met long enough for the guard to come down.",
        "it is a way of not feeling something — detachment"
      ],
      [
        "The joy of being fully inside what you are doing.",
        "Forward lean, forgotten body, time gone strange.",
        "Not hearing your name, working past the hour.",
        "Competence plus safety: nothing to defend.",
        "you are hiding in it — notice what you are away from"
      ],
      [
        "The mildest joy: leaning toward something.",
        "Raised eyes, a small lean, breath a little higher.",
        "Questions, reading on, staying longer.",
        "Enough safety to be curious.",
        "it is anxious searching — closer to worry"
      ],
      [
        "Joy that takes the shape of tending something.",
        "A warm chest, attentive hands, a softer face.",
        "Checking in, doing small things, remembering details.",
        "Love, and the wish for someone to be well.",
        "it is heavy and watchful — closer to worry"
      ],
      [
        "Joy leaning into something that has not arrived.",
        "A light stomach, quick pulse, a forward tilt.",
        "Counting days, planning, telling people.",
        "Trust that the good thing will actually come.",
        "the pulse is dread — that is apprehension"
      ],
      [
        "Joy at high energy, hard to sit still inside.",
        "Fast breath, warm skin, restless hands and feet.",
        "Talking fast, laughing, moving between things.",
        "Something wanted arriving faster than expected.",
        "the body is braced not open — that is anxiety"
      ],
      [
        "Joy borrowed from the future, enjoyed now.",
        "A pleasant tightening in the chest, a private smile.",
        "Preparing, imagining out loud, arranging details.",
        "Trust plus time; the good thing is close.",
        "you fear it will not happen — that is worry"
      ],
      [
        "Joy that keeps a door open in the dark.",
        "A steady small warmth low in the chest.",
        "Continuing, asking again, keeping a plan alive.",
        "Something that mattered enough not to give up on.",
        "it argues against the evidence — look at denial"
      ],
      [
        "Joy in not knowing yet.",
        "Light head, raised brows, a lean toward.",
        "Questions, tangents, following a thread.",
        "Safety enough to be wrong in front of someone.",
        "the searching is frightened — that is anxiety"
      ],
      [
        "Joy when a weight comes off.",
        "A long exhale, dropped shoulders, sudden tiredness.",
        "Sitting down, laughing oddly, saying it is over.",
        "How much fear had been carried without naming it.",
        "nothing was at stake — that is happiness"
      ],
      [
        "Joy as receiving; letting the good thing land.",
        "An open chest, slow breath, quiet hands.",
        "Stillness, silence, looking rather than speaking.",
        "Permission to have what is here.",
        "you are keeping it at arm's length — detachment"
      ],
      [
        "Joy that stops arguing with what is.",
        "Soft shoulders, even breath, an unclenched jaw.",
        "Simple speech, fewer conditions, an easier body.",
        "Grief that has been allowed to finish.",
        "it is resignation, heavy and flat — closer to hopelessness"
      ],
      [
        "Joy with too much hurry in it.",
        "A tight chest, tapping, breath high in the throat.",
        "Checking the time, interrupting, cutting corners.",
        "Wanting something good and fearing the delay.",
        "the hurry is fear-driven — that is anxiety"
      ],
      [
        "Joy in trusting what you cannot prove.",
        "A settled chest, deep breath, still hands.",
        "Steadiness under pressure, fewer words, waiting well.",
        "Experience that held before.",
        "it needs everyone to agree — look at what is feared"
      ],
      [
        "Joy at something larger than expected.",
        "Wide eyes, an open mouth, a held breath.",
        "Stopping mid-step, going quiet, pointing.",
        "Enough openness to be moved.",
        "it frightens rather than opens — that is shock"
      ]
    ]
  },
  "ru": {
    "love": [
      [
        "Любовь с заботой о хрупком.",
        "Тёплая грудь, мягкие руки, полное горло.",
        "Мягче прикосновение и голос, замедление.",
        "Привязанность и знание, что её можно потерять.",
        "смотрит сверху — это жалость"
      ],
      [
        "Любовь на малом ровном огне: рад человеку.",
        "Открытая грудь, свободные плечи, невынужденная улыбка.",
        "Наклон к, мелкие добрые дела, удобная тишина.",
        "Доверие, которое держалось со временем.",
        "её нужно доказывать — посмотри на желание нравиться"
      ],
      [
        "Любовь, которая идёт к чужой боли на равных.",
        "Ноющая грудь, наклон вперёд, ровное дыхание.",
        "Остаться, слушать без починки, простые слова.",
        "Узнавание: там же был и ты.",
        "смотришь сверху — это жалость"
      ],
      [
        "Любовь, в которой ничего не недостаёт.",
        "Тепло и тяжесть, размытые границы, медленное дыхание.",
        "Тишина, закрытые глаза, нежелание двигаться.",
        "Глубокая потребность, закрытая полностью, пусть коротко.",
        "её нужно чем-то приглушать — это не она"
      ],
      [
        "Любовь как отсутствие охраны.",
        "Низкие плечи, глубокое дыхание, расслабленный живот.",
        "Сначала правда, прямые просьбы, отдых рядом.",
        "Повторяющиеся доказательства во времени, а не одно обещание.",
        "веришь вопреки фактам — это надежда"
      ],
      [
        "Любовь как отсутствие угрозы здесь.",
        "Тёплые руки, тихая грудь, тело перестаёт следить.",
        "Сон, честность, право быть невпечатляющим.",
        "Нервная система, которой дали доказательства.",
        "держится на том, чтобы быть маленьким — это не безопасность"
      ],
      [
        "Любовь, обращённая назад — к тому, что дали.",
        "Полное горло, тёплые глаза, открытая грудь.",
        "Сказать, вернуть, вспомнить вслух.",
        "Потребность, закрытая тем, кто не был обязан.",
        "рядом долг — посмотри на обязанность"
      ],
      [
        "Любовь к обычному: ничего не давит.",
        "Ровное дыхание, свободная челюсть, осевший вес.",
        "Неспешность, простая речь, лёгкость в тишине.",
        "Безопасность, которая длилась достаточно, чтобы в неё поверили.",
        "замер, чтобы чего-то не касаться — это отрешённость"
      ],
      [
        "Самая тихая форма: рядом с этим человеком легко.",
        "Небольшой подъём в груди, открытое лицо.",
        "Выбирать его компанию, помнить детали, легкий разговор.",
        "Узнанное в нём то, что ценишь.",
        "просит близости в ответ — ближе к влюблённости"
      ],
      [
        "Любовь к тому, кто ты есть: себя узнают.",
        "Осевший вес, ровные плечи, спокойный голос.",
        "Сказать «нет» без извинений, выбрать честное и трудное.",
        "Время, проведённое одним и тем же человеком в разных комнатах.",
        "нужны зрители — ближе к гордости"
      ],
      [
        "Любовь к тому, что сделано хорошо — своё или чужое.",
        "Расширяющаяся грудь, поднятый подбородок, тепло по шее.",
        "Рассказать, выпрямиться, сохранить сделанное.",
        "Настоящее усилие, которое наконец видно.",
        "это выше других, а не за дело — это превосходство"
      ],
      [
        "Любовь, которая смотрит на человека вверх.",
        "Подъём под рёбрами, тихое внимание, тёплые глаза.",
        "Смотреть внимательно, цитировать, хотеть учиться.",
        "Качество, которое ценишь, живое в другом.",
        "стираешь себя в этом — посмотри на тоску"
      ],
      [
        "Любовь, оставляющая другому его форму.",
        "Ровная грудь, неспешное дыхание, открытая поза.",
        "Слушать до конца, держать слово, не поправлять.",
        "Видеть его настоящим и отдельным от своих нужд.",
        "заслуживается только полезностью — ближе к одобрению"
      ],
      [
        "Любовь к себе, которой не нужны доказательства.",
        "Ровно распределённый вес, низкое дыхание, спокойные руки.",
        "Прямые просьбы, отдых без заслуг, меньше извинений.",
        "Достаточно полученной заботы, чтобы она стала внутренней.",
        "рушится от критики — ближе к гордости"
      ],
      [
        "Любовь, в которой всё тело наклонено к одному человеку.",
        "Быстрое сердце, лёгкий живот, тёплая кожа, плохой сон.",
        "Перечитывать сообщения, менять планы, говорить о нём.",
        "Тоска и надежда в одном вдохе.",
        "тянет от страха потерять — это тревога"
      ],
      [
        "Любовь к себе такому, какой есть.",
        "Мягкая грудь, свободная челюсть, разжатые руки.",
        "Мягче внутренняя речь, отдых, конец того, что вредит.",
        "То, что однажды так любили тебя.",
        "требует сначала безупречности — это не любовь"
      ],
      [
        "Любовь в момент, когда что-то забирает целиком.",
        "Задержанное дыхание, широкие глаза, тёплая тихая грудь.",
        "Остановиться, смотреть, замолчать на полуслове.",
        "Открытость: охрана была снята.",
        "человек в этом исчезает — посмотри на идеализацию"
      ],
      [
        "Любовь без нужды быть самым большим в комнате.",
        "Низкие плечи, медленное дыхание, лёгкая грудь.",
        "Слушать, спрашивать, позволять другим быть правыми.",
        "Достаточно самоценности, чтобы перестать защищаться.",
        "это стирание себя — это стыд тихим голосом"
      ],
      [
        "Любовь как выбор быть увиденным точно.",
        "Открытая уязвимая грудь, тёплое лицо, ровный голос.",
        "Сказать правду рано, простыми словами, без оговорок.",
        "Доверие, что правду примут.",
        "ею ранят — это не искренность"
      ],
      [
        "Любовь на удобной дистанции: доброе расположение.",
        "Свободная грудь, открытые руки, лёгкое лицо.",
        "Поздороваться, обычный разговор, предложить помощь.",
        "Достаточно безопасности, чтобы быть открытым с незнакомым.",
        "это исполняется, чтобы понравиться — посмотри на тревогу"
      ],
      [
        "Любовь, которая делает для другого небольшое дело.",
        "Тепло в руках и груди, лицо мягче.",
        "Практическая помощь без объявления, остаться после.",
        "Узнавание нужды, потому что знаешь её сам.",
        "ждёт возврата — посмотри на обязанность"
      ],
      [
        "Любовь, в которой на мгновение исчезает разделение.",
        "Широкая грудь, медленное дыхание, размытые границы себя.",
        "Тишина, слёзы без грусти, неподвижность вместе.",
        "Глубокая потребность принадлежать, закрытая.",
        "себя не стало от страха — это слияние"
      ],
      [
        "Любовь как двое, несущие один вес.",
        "Ровная грудь, энергия в руках, свободное дыхание.",
        "Прийти, разделить работу, не вести счёт.",
        "Доверие, построенное тем, что уже делали это вместе.",
        "несёт один — посмотри на обязанность"
      ]
    ],
    "states": [
      [
        "Не чувство: тело в готовности, которой некуда деться.",
        "Лёгкий живот, частый пульс, суетливые пальцы.",
        "Быстрая речь, шутки, взгляд на часы.",
        "Страх чего-то конкретного, чаще всего оценки.",
        "можно назвать, что на кону — возьми слово из страха"
      ],
      [
        "Позиция, не чувство: ты здесь не считаешься.",
        "Прохладная грудь, отвёрнутое плечо, плоское внимание.",
        "Не отвечать, говорить поверх, забыть намеренно.",
        "Обычно злость или страх того, что человек значит.",
        "это честное неинтересно — в нём нет заряда"
      ],
      [
        "Устоявшаяся позиция: всё недостаточно хорошо.",
        "Низкий гул под рёбрами, сжатый рот.",
        "Критика, сравнения, мелкие жалобы.",
        "Неназванное желание или горе о неизменимом.",
        "указывает на одно изменимое — это злость"
      ],
      [
        "Стратегия, не чувство: сделать больно, чтобы сравнять.",
        "Тугое удовлетворение в груди, узкий фокус.",
        "Не дать, мелкий саботаж, холодная вежливость.",
        "Унижение, за которое никто не ответил.",
        "хочется починить — под этим боль"
      ],
      [
        "Тихая смесь: разочарование плюс неловкость.",
        "Провал в груди, тёплое лицо, глаза вниз.",
        "Извинения, «да ничего», смена темы.",
        "Грусть о самом деле плюс стыд быть увиденным в нём.",
        "стыда нет — это разочарование"
      ],
      [
        "Позиция, что другой не должен быть таким, какой он есть.",
        "Жёсткая челюсть, задержанное дыхание, жар за глазами.",
        "Поправлять, избегать, говорить правилами.",
        "Страх того, что чужое отличие значит для тебя.",
        "границу правда нарушили — это злость; назови границу"
      ],
      [
        "Позиция «никаких границ», обычно после того, как границ не дали.",
        "Расслабленно, быстро, странно невесомо.",
        "Риск, траты, «да» за пределом заботы о себе.",
        "Пустота или ярость от того, что тобой управляли.",
        "это радость при сохранной оценке — это оживление"
      ],
      [
        "Вина, повернувшаяся к возмещению.",
        "Тяжёлая грудь, горячее лицо, стянутое горло, ровный взгляд.",
        "Назвать прямо, исправить, не просить утешения.",
        "Любовь к тому, кому навредил, и свои же ценности.",
        "дело в том, как ты выглядишь — это стыд"
      ],
      [
        "Вывод: двери нет.",
        "Заглохшая грудь, поверхностное дыхание, застывший взгляд.",
        "Повторять, что ничего нельзя, отказываться от вариантов.",
        "Страх, который слишком долго был правдой.",
        "один вариант есть — это беспомощность"
      ],
      [
        "Позиция выше других людей.",
        "Прохладная широкая грудь, поднятый подбородок, дистанция.",
        "Советы без спроса, лёгкая усмешка, счёт.",
        "Страх быть обычным или стыд под ним.",
        "умение настоящее и тихое — это уверенность"
      ],
      [
        "Позиция, что другие значат меньше.",
        "Жёсткая шея, задержанное дыхание, закрытое лицо.",
        "Отмахиваться, перебивать, не спрашивать в ответ.",
        "Стыд, от которого убегают.",
        "можно сказать, что ты неправ — это уверенность"
      ],
      [
        "Превосходство, надетое как манера.",
        "Поднятый подбородок, медленное моргание, показная лёгкость.",
        "Протяжный тон, полуулыбка, поправки.",
        "Страх, что без позы ничего нет.",
        "это тихое самоуважение — это достоинство"
      ],
      [
        "Вывод о себе: что-то кончено.",
        "Провалившаяся грудь, тяжёлые руки, тихий голос.",
        "Остановиться, согласиться на что угодно, не просить большего.",
        "Горе и страх, которых никто не встретил.",
        "один отдых меняет это — это истощение"
      ],
      [
        "Приговор: меня недостаточно.",
        "Пустая грудь, горячее лицо, желание стать меньше.",
        "Переработки, извинения, избегание быть увиденным.",
        "Стыд, выученный раньше, чем можно было спорить.",
        "дело в одном навыке — это «пока не умею»"
      ],
      [
        "Состояние малого трения: что-то не подходит.",
        "Переминающееся тело, стянутые плечи, беспокойство.",
        "Поправлять, искать выход, притихнуть.",
        "Часто страх быть неправым при других.",
        "причина физическая — это просто неудобство"
      ],
      [
        "Состояние короткого выпадения из ритма.",
        "Тёплое лицо, неуверенные руки, смех без шутки.",
        "Заполнять тишину, объяснять лишнее, отводить взгляд.",
        "Желание быть хорошо принятым сейчас.",
        "длится и оседает — ближе к стыду"
      ],
      [
        "Не покой: чувство выключено, чтобы можно было идти.",
        "Ничего и нигде — само отсутствие и есть сигнал.",
        "Минимум действий, ровный голос, отказ от всего.",
        "Обычно горе, страх или злость, которым не дали места.",
        "отдых и интерес быстро вернулись — это была усталость"
      ],
      [
        "Позиция, а не чувство: пусть это меня не касается.",
        "Ровно, прохладно, ничего не отзывается.",
        "Не спросить, не запомнить, не вернуться к теме.",
        "Обычно боль или злость, отставленные подальше.",
        "это правда не задевает — тогда нет и заряда"
      ],
      [
        "Состояние, в котором нельзя приземлиться.",
        "Занятая грудь, беспокойные руки, заглохшее тело.",
        "Спрашивать снова, тянуть, спорить за обе стороны.",
        "Страх цены неверного выбора.",
        "один факт всё бы решил — это замешательство"
      ],
      [
        "Вывод, что все дороги закрыты.",
        "Задержанное дыхание, тяжёлая грудь, никакой тяги вперёд.",
        "Остановить дело, тишина, отказ от помощи.",
        "Страх того единственного хода, который не удаётся сделать.",
        "ход можно назвать — это страх"
      ],
      [
        "Состояние на уровне тела: топливо кончилось.",
        "Тяжёлые руки, больные глаза, медленная речь.",
        "Короче фразы, отмены, ранний сон.",
        "Иногда только недосып; часто горе, делающее свою работу.",
        "сон не помогает — посмотри, что под этим"
      ],
      [
        "Состояние действия против себя.",
        "Стянутая грудь, задержанное дыхание, жёсткие плечи.",
        "Делать всё равно, обида после, молчание.",
        "Страх цены отказа.",
        "выбрал сам и не в радость — это неохота"
      ],
      [
        "Состояние без контакта.",
        "Пустая грудь, холодные руки, длинная тишина.",
        "Тянуться к телефону, заполнять комнату звуком.",
        "Потребность в близости, которая не закрывается.",
        "выбрано и восстанавливает — это уединение"
      ],
      [
        "Состояние того, от кого отвернулись.",
        "Опустившаяся грудь, горячее лицо, заглохшее дыхание.",
        "В следующий раз уйти первым, стать тише.",
        "Горе и стыд, пришедшие вместе.",
        "никто не отворачивался — посмотри на страх"
      ],
      [
        "Опущенное состояние, тише грусти.",
        "Плоская энергия, медленные движения, слабый интерес.",
        "Меньше делать, меньше говорить, отказываться от встреч.",
        "Что-то неназванное, что несут слишком долго.",
        "под этим ясная потеря — это грусть"
      ],
      [
        "Защитное состояние: контакт убавлен.",
        "Прохладная кожа, неподвижное лицо, ровный голос.",
        "Вежливость без тепла, короткие ответы, дистанция.",
        "Боль, решившая больше не рисковать.",
        "это настоящий покой — это спокойствие"
      ],
      [
        "Позиция «пусть не имеет значения».",
        "Почти никаких ощущений — это и есть подсказка.",
        "Пожать плечами, сменить тему, не задать вопрос.",
        "Обычно боль или зависть, выведенные из дела.",
        "правда не имеет значения — тогда в словах нет заряда"
      ],
      [
        "Состояние закрытой потребности.",
        "Осевшая грудь, ровное дыхание, разжатые руки.",
        "Замедлиться, меньше слов, остаться на месте.",
        "Желаемое, которое действительно пришло.",
        "нужно объявить — посмотри на облегчение"
      ],
      [
        "Состояние доверия своей опоре.",
        "Ровные плечи, низкое дыхание, спокойные руки.",
        "Прямые фразы, признание незнания, без спешки.",
        "Опыт, который держал раньше.",
        "нужно, чтобы другие были меньше — это превосходство"
      ],
      [
        "Состояние «достаточно».",
        "Тепло и ровно, никуда не тянет.",
        "Остаться, неспешная речь, планы не нужны.",
        "Долгая полоса закрытых потребностей.",
        "это способ не хотеть — ближе к смирению"
      ],
      [
        "Поднятое состояние: получилось, и это чувствуется.",
        "Лёгкая грудь, быстрый шаг, энергия в руках.",
        "Быстрая речь, планы, рассказать всем.",
        "Усилие, которое наконец дало результат.",
        "не получается спуститься — посмотри на возбуждение"
      ],
      [
        "Собранное состояние, больше самого момента.",
        "Медленное дыхание, неподвижное тело, полная грудь.",
        "Тишина, сдержанная забота, неспешность.",
        "Признание, что что-то важно.",
        "исполняется для других — посмотри на тревогу"
      ],
      [
        "Светлое длящееся состояние, не привязанное к событию.",
        "Тёплое лицо, свободное дыхание, готовый смех.",
        "Быстрые приветствия, юмор, лёгкость рядом.",
        "Достаточно безопасности во времени, чтобы остаться открытым.",
        "не может остановиться — поищи, что оно прикрывает"
      ],
      [
        "Состояние сразу после того, как снялся груз.",
        "Долгий выдох, опустившиеся плечи, внезапная усталость.",
        "Сесть, странная тишина, потом говорливость.",
        "Сколько страха несли, не называя.",
        "на кону ничего не было — это счастье"
      ],
      [
        "Состояние того, за кем встали.",
        "Грудь теплее, спина прямее, руки спокойнее.",
        "Попробовать снова, раньше просить помощи, двигаться.",
        "Быть точно увиденным тем, кто остался.",
        "держится только на похвале — посмотри на сомнение"
      ],
      [
        "Состояние до того, как ум догонит.",
        "Поднятые брови, задержанное дыхание, остановившееся тело.",
        "Замолчать на полуслове, резкий вдох, показать рукой.",
        "Пока ничего: это пауза перед чувством.",
        "скорее пугает, чем раскрывает — это потрясение"
      ],
      [
        "Состояние чувствовать с человеком, а не о нём.",
        "Ломота в своей груди, совпадающая с его.",
        "Остаться, меньше слов, без советов.",
        "Свой опыт чего-то похожего.",
        "смотришь сверху — это жалость"
      ],
      [
        "Состояние быть внутри общего дела.",
        "Тёплая широкая грудь, свободное дыхание, мягкие плечи.",
        "Включиться, остаться дольше, говорить «мы».",
        "Потребность принадлежать, закрытая сейчас.",
        "требует потерять себя — посмотри на слияние"
      ],
      [
        "Ровное состояние: ни в одну сторону не тянет.",
        "Ровное дыхание, распределённый вес, спокойные руки.",
        "Размеренная речь, медленнее реакции, терпение.",
        "Достаточно отдыха и безопасности, чтобы был запас.",
        "это плоскость, в которой ничего нет — ближе к апатии"
      ],
      [
        "Состояние без исполнения роли.",
        "Свободная челюсть, свободные руки, обычное дыхание.",
        "Простая речь, ничего не подправлять, быть невпечатляющим.",
        "Безопасность, которая длилась достаточно, чтобы в неё поверить.",
        "это выученная роль — посмотри на страх"
      ],
      [
        "Состояние на стороне жизни.",
        "Тепло в груди и конечностях, аппетит, силы.",
        "Планы, «да», начатые дела.",
        "То в жизни, чего действительно хочется.",
        "должно двигаться, чтобы держаться — посмотри, что при остановке"
      ],
      [
        "Состояние, в котором тянет что-то сделать.",
        "Поднимающаяся грудь, быстрое дыхание, тёплые руки.",
        "Начать сразу, работать поздно, быстрая речь.",
        "Узнанное как своё и настоящее.",
        "выгорает за день — посмотри на возбуждение"
      ],
      [
        "Состояние энергии за замыслом.",
        "Тёплое, наклонённое вперёд тело, быстрое дыхание.",
        "Звать других, работать, планировать вслух.",
        "То, что важно и оказалось возможным.",
        "не выносит вопроса — посмотри на тревогу"
      ]
    ],
    "anger": [
      [
        "Гнев за пределом выбора: тело действует само.",
        "Жар в лице и руках, гул в ушах, грудь вперёд.",
        "Крик, хлопнувшая дверь, слова, которые не вернуть.",
        "Ужас или унижение, пришедшие в ту же секунду.",
        "ещё можно взвесить слова — это ярость"
      ],
      [
        "Гнев с целью и направлением, ещё управляемый.",
        "Сжатая челюсть, плечи вперёд, короткое высокое дыхание.",
        "Рубленые фразы, твёрдый взгляд, быстрое решение.",
        "Нарушенная граница, которая значила больше, чем признавалось.",
        "нет ни цели, ни плана — это бешенство"
      ],
      [
        "Гнев, застывший в позицию о человеке.",
        "Скорее холод, чем жар: ровная тяжесть без вспышек.",
        "Избегание, колкости, счёт обид.",
        "Старая обида, за которую никто не ответил.",
        "вспыхивает и проходит — это ярость"
      ],
      [
        "Чувство громче, чем тело способно удержать.",
        "Дрожь, частое верхнее дыхание, смех и слёзы вместе.",
        "Голос, который не выравнивается; движение без цели.",
        "Страх, которому некуда деться.",
        "у силы есть одна ясная цель — смотри бешенство или ужас"
      ],
      [
        "Простая форма: что-то не так, и хочется это изменить.",
        "Тепло в груди, тяжесть в руках, наклон вперёд.",
        "Твёрже голос, прямая фраза, отстоять своё.",
        "Боль или потребность, которую игнорировали не первый раз.",
        "нет тяги что-то менять — возможно, это обида"
      ],
      [
        "Мелкое повторяющееся трение: гнев на низкой громкости.",
        "Поверхностное дыхание, дрожь в челюсти, беспокойные руки.",
        "Вздохи, короткие ответы, резко поставленные вещи.",
        "Усталость, голод или большой гнев, который не назван.",
        "причина — один поступок: это ближе к негодованию"
      ],
      [
        "Гнев, который ставит выше другого.",
        "Холодная грудь, поднятый подбородок, внутренний отворот.",
        "Полуулыбка, закатившиеся глаза, вежливая насмешка.",
        "Стыд — чаще всего свой, перенесённый на другого.",
        "от человека всё ещё что-то нужно — это злость"
      ],
      [
        "Гнев за справедливость: свою или чужую.",
        "Грудь раскрыта, дыхание чаще, жар в горле.",
        "Спор о принципе, рассказ другим, отказ отпустить.",
        "Правило, по которому живёшь, нарушили на глазах.",
        "дело только в своей боли — это ближе к обиде"
      ],
      [
        "Гнев, оставленный внутри и направленный на близкого.",
        "Задержанное дыхание, стянутое горло, ждущая тяжесть.",
        "Молчание, дистанция, разговор об этом много позже.",
        "Боль плюс уверенность, что сказать — слишком дорого.",
        "это можно сказать вслух сегодня — это боль или злость"
      ],
      [
        "Страх потерять человека из-за кого-то другого.",
        "Крутит живот, горячая грудь, тяга проверить и знать.",
        "Вопросы, наблюдение, повторные заверения.",
        "Страх быть заменимым.",
        "терять нечего — скорее зависть"
      ],
      [
        "Свежая резь от того, что ранил близкий.",
        "Укол под рёбрами, влажные глаза, перехваченный вдох.",
        "Замирание, изменившийся голос, желание уйти.",
        "Привязанность: болит только там, где держат.",
        "это состарилось в позицию — это обида"
      ],
      [
        "Малый гнев от помехи или от того, что выставили глупым.",
        "Короткая горячая волна, цоканье, напряжение в руках.",
        "Реплика под нос, пожатие плечами, скованный шаг дальше.",
        "Задетая гордость, обычно меньше, чем кажется.",
        "вред был настоящий и длительный — это боль"
      ],
      [
        "Желание того, что есть у другого.",
        "Пустая тяга в груди, глаза, которые возвращаются.",
        "Сравнение, лёгкая критика, смена темы.",
        "Своё желание, которое не признано своим.",
        "боишься потерять то, что уже есть — это ревность"
      ],
      [
        "Тихое ровное «нет» к человеку.",
        "Лёгкий отклон, закрытая поза, прохладная кожа.",
        "Короче ответы, меньше времени, вежливая дистанция.",
        "Что-то конкретное, что он сделал и что не названо.",
        "тянет уйти телесно — это отвращение"
      ],
      [
        "Гнев на явно неправильное, сказанный вслух.",
        "Поднимающаяся грудь, громкий ясный голос, жар в лице.",
        "Назвать публично, отказаться, рассказать другим.",
        "Ценность, о твёрдости которой не знал.",
        "остаётся тихим и холодным — ближе к презрению"
      ],
      [
        "Гнев, в котором есть телесное отвержение.",
        "Поворот в животе, шаг назад, сжатый рот.",
        "Отвернуться, отказаться от контакта, лицо всё говорит.",
        "Граница на уровне тела, а не спора.",
        "это холодно и сверху — это презрение"
      ]
    ],
    "fear": [
      [
        "Страх на полной громкости: тело решает раньше человека.",
        "Холодная кожа, ненадёжные ноги, туннельное зрение.",
        "Оцепенеть, бежать, незапланированный звук.",
        "Угроза жизни или тому, вокруг кого жизнь построена.",
        "ещё можно планировать — это испуг или боязнь"
      ],
      [
        "Страх, который перестал видеть выход.",
        "Тяжесть с паническим краем, грудь пустая и быстрая.",
        "Замирание, «нет смысла», отказ от вариантов.",
        "То, чего боялись долго и без передышки.",
        "будущее ещё открыто — это скорее безнадёжность"
      ],
      [
        "Короткий резкий страх: пришёл и ушёл.",
        "Толчок, задержанное дыхание, прыжок в груди.",
        "Вздрог, вдох, руки вверх раньше мысли.",
        "Неожиданность плюс мгновение незнания, что безопасно.",
        "держится часами — это тревога"
      ],
      [
        "Страх настолько большой, что тело замолкает вместо крика.",
        "Далёкие конечности, глухой слух, пустота на месте чувства.",
        "Неподвижность, ровный голос, полное бездействие.",
        "Угроза, с которой нельзя было ни справиться, ни убежать.",
        "похоже на покой — задержись: в покое есть дыхание"
      ],
      [
        "Страх, направленный на человека: ищет подвох.",
        "Настороженная грудь, бегающий взгляд, приподнятые плечи.",
        "Проверочные вопросы, слежка, недосказанность.",
        "Доверие, которое сломали и не восстановили.",
        "есть доказательства — это скорее знание"
      ],
      [
        "Страх без объекта, размазанный по будущему.",
        "Трепет в груди, стянутый живот, занятые руки.",
        "Репетиции разговоров, двойные проверки, не сесть на месте.",
        "Почти всегда один конкретный страх, который не назван.",
        "можно назвать, чего боишься — возьми то слово"
      ],
      [
        "Страх от того, что сдвинулась опора.",
        "Лёгкая голова, пустая грудь, пауза вместо мысли.",
        "Повторяющиеся вопросы, просьба сказать ещё раз, молчание.",
        "Случилось то, чего карта не допускала.",
        "переходит в страх перед тем, что будет — это боязнь"
      ],
      [
        "Тихий ровный страх о том, что ещё не случилось.",
        "Узелок под рёбрами, сжатая челюсть, поверхностный сон.",
        "Возвращение к теме, планы на случай, звонки проверить.",
        "Забота, которой некуда деться.",
        "захватывает всё тело — это стало тревогой"
      ],
      [
        "Страх конкретного, что приближается.",
        "Тяжесть в животе, растущая к дате.",
        "Отложить, переготовиться, говорить вокруг.",
        "То, что нельзя ни контролировать, ни обойти.",
        "конкретного события нет — это тревога"
      ],
      [
        "Страх быть увиденным меньшим, чем ты есть.",
        "Горячее лицо, желание исчезнуть, провалившаяся грудь.",
        "Молчание, смех, который не смех, уйти раньше.",
        "Стать маленьким в глазах того, чей взгляд нужен.",
        "видел только ты — это стыд или смущение"
      ],
      [
        "Страх там, где ещё ничего не складывается.",
        "Мигающее внимание, задержанное дыхание, заглохшее чувство.",
        "Спросить снова, долгие паузы, фразы с двух попыток.",
        "Не хватает информации, без которой нет безопасности.",
        "сдвинулась сама опора — это ошарашенность"
      ],
      [
        "Страх, потерявший ориентиры.",
        "Неустойчивые ноги, размытые края, ненадёжное время.",
        "Перепроверка простого, никакого плана, дрогнувший голос.",
        "Слишком много перемен слишком быстро.",
        "один факт всё бы решил — это замешательство"
      ],
      [
        "Страх, обращённый на себя: я сделал плохо.",
        "Тяжёлая грудь, горячее лицо, стянутое горло, глаза вниз.",
        "Извинения, длинные объяснения, спрятаться, замолчать.",
        "Забота о том, кому навредил, или своя нарушенная ценность.",
        "назван конкретный поступок и хочется возместить — раскаяние"
      ],
      [
        "Страх быть плохим, а не сделавшим плохое.",
        "Жар по лицу и шее, желание провалиться, сжатые плечи.",
        "Спрятаться, оправдаться, отвернуть лицо.",
        "Ранняя убеждённость, что таким тебя не примут.",
        "речь о поступке, а не о себе целиком — это вина"
      ],
      [
        "Страх, что своему прочтению нельзя верить.",
        "Задержанное дыхание, тяжесть в груди, заглохшее тело.",
        "Спрашивать других, тянуть, спорить за обе стороны.",
        "Высокая цена ошибки.",
        "страшен исход, а не своё суждение — это беспокойство"
      ],
      [
        "Страх быть рассматриваемым.",
        "Тёплое лицо, тихий голос, руки ищут, за что взяться.",
        "Короткие ответы, меньше взгляда, ждать своей очереди.",
        "Страх оценки, выученный рано.",
        "приходит только после ошибки — это смущение"
      ],
      [
        "Страх на низкой громкости, о том, что впереди.",
        "Стянутый живот, осторожное дыхание, лёгкая собранность.",
        "Сначала вопросы, путь понадёжнее, заминка.",
        "Что-то ценное, что может быть потеряно.",
        "разрастается на весь день — это тревога"
      ],
      [
        "Страх быть увиденным в неловком.",
        "Горячие уши, смех, желание отмотать десять секунд.",
        "Обратить в шутку, сменить тему, уйти.",
        "Желание хорошо выглядеть в глазах присутствующих.",
        "дело в том, кто ты, а не что сделал — это стыд"
      ],
      [
        "Страх, остановивший тело на полуслове.",
        "Всё замерло, открытый рот, мысль на паузе.",
        "Стоять, ничего не говорить, пустое лицо.",
        "То, что пришло быстрее, чем ум успевает принять.",
        "снова начинает думаться — это ошарашенность"
      ]
    ],
    "sadness": [
      [
        "Грусть, скисшая от того, что её несли одну.",
        "Вкус во рту, стянутое горло, тяжесть в груди.",
        "Колкости о старом, юмор с лезвием.",
        "Горе, которое никто не услышал, и злость об этом.",
        "ещё хочется, чтобы починили — это боль или обида"
      ],
      [
        "Грусть, притянутая к тому, чего нет.",
        "Широкая ноющая грудь, вздохи, беспокойство к вечеру.",
        "Поиски в сети, сохранённые вещи, одна и та же песня.",
        "Любовь, которой сейчас некуда лечь.",
        "до человека можно дойти — это «скучаю»"
      ],
      [
        "Грусть настоящей потери, делающая свою работу.",
        "Тяжёлые руки, слёзы без предупреждения, усталость до костей.",
        "Замедление, рассказ по кругу, нужда в людях или в тишине.",
        "Любовь — точной формы того, что ушло.",
        "под этим ничего нет: это не симптом"
      ],
      [
        "Не лень: тело тормозит обо что-то.",
        "Руки как мешки с песком, туман за глазами, ни к чему не тянет.",
        "Отложить, экран, ничего не начать.",
        "Часто горе, страх или истощение в костюме лени.",
        "день отдыха всё решает — это была усталость"
      ],
      [
        "Грусть о другом, с лёгким взглядом сверху.",
        "Мягкая ноющая грудь, порыв протянуть руку.",
        "Тихий голос, дела за него, разговоры о нём вполголоса.",
        "Страх, что это мог быть ты, и облегчение, что нет.",
        "чувствуется вместе с ним, а не о нём — сочувствие"
      ],
      [
        "Грусть, отставленная достаточно далеко, чтобы функционировать.",
        "Тихо везде, звуки чуть дальше, никаких краёв.",
        "Спокойная собранность, короткие ответы, присутствие без присутствия.",
        "То, что пока слишком велико, чтобы чувствовать в полный размер.",
        "это выбрано и даёт отдых — это покой"
      ],
      [
        "Грусть, сделавшая вывод: не изменится.",
        "Провалившаяся грудь, медленное дыхание, груз в плечах.",
        "Остановка, дом, отказ от того, что было важно.",
        "Надежда, которую держали долго и которая сломалась.",
        "ещё тянешься к выходу — это беспомощность"
      ],
      [
        "Грусть от того, что не осталось хода.",
        "Обмякшие руки, стянутое горло, провал под рёбрами.",
        "Спрашивать других, что делать; замолчать; ждать.",
        "Потребность, закрыть которую может только другой.",
        "ход есть, но нет сил — это истощение"
      ],
      [
        "Грусть, которая чувствуется как боль в груди.",
        "Настоящая ломота за грудиной, трудно вдохнуть глубоко.",
        "Рука к груди, тишина, нужно сесть.",
        "Любовь и потеря в одном месте в одно время.",
        "это тупо и долго — это печаль"
      ],
      [
        "Вывод, что впереди лучше не будет.",
        "Замедлено всё: дыхание, речь, движение.",
        "Уход, брошенные дела, ровные пустые ответы.",
        "Горе, которому не дали закончиться.",
        "одно изменение всё бы поправило — это уныние"
      ],
      [
        "Грусть быть далеко от того, кто рядом.",
        "Прохладная дистанция в груди, придержанное тело.",
        "Вежливый разговор, без касаний, каждый на своей стороне.",
        "Контакт, который прервался и не восстановлен.",
        "близости и не было — это одиночество"
      ],
      [
        "Грусть от того, что вышло не так, как ждали.",
        "Провал в груди, опущенные плечи, долгий выдох.",
        "Сказать мягче, чем есть, пожать плечами, притихнуть.",
        "То, насколько сильно позволил себе хотеть.",
        "злишься на кого-то за это — ближе к обиде"
      ],
      [
        "Грусть, которая ещё не догнала факт.",
        "Холодные руки, громкое сердце, мысль по кругу.",
        "Повторять вслух, делать практическое.",
        "Потеря, которую тело отметило раньше, чем ум согласился.",
        "факт приземлился — это скорбь"
      ],
      [
        "Грусть, направленная на свой же выбор.",
        "Тяга в животе, горячее лицо при воспоминании.",
        "Возвращаться к этому, репетировать, что сказал бы теперь.",
        "Ценности, которые видны только назад.",
        "навредил другому — это раскаяние"
      ],
      [
        "Грусть, переодетая в «нечего делать».",
        "Беспокойная пустота, тяжёлые руки, блуждающее внимание.",
        "Листать, открывать холодильник, начинать и бросать.",
        "Часто одиночество или горе, не названные.",
        "настоящий отдых снимает — это была усталость"
      ],
      [
        "Грусть, закрывшая все выходы.",
        "Пустая грудь, заглохшее дыхание, застывший взгляд.",
        "Повторять, что делать нечего, отказываться от помощи.",
        "Страх, который слишком долго был правдой.",
        "можешь назвать хотя бы один вариант — это безнадёжность"
      ],
      [
        "Простая тихая форма грусти.",
        "Мягкая тяжесть в груди, редкое моргание, низкий голос.",
        "Нужна тишина, медленные движения, долгая пауза.",
        "Потеря, малая или большая, ощущаемая в свой настоящий размер.",
        "есть край злости — ближе к горечи"
      ],
      [
        "Грусть, которой некуда двинуться.",
        "Стянутые плечи, поверхностное дыхание, тело готово бежать.",
        "Резкость, потом молчание, согласие на что угодно.",
        "Страх того, что будет, если остаться.",
        "есть выход, которым не воспользовался — беспомощность"
      ]
    ],
    "joy": [
      [
        "Простая ровная форма: хорошо, и это понятно.",
        "Тёплая грудь, свободное дыхание, опущенные плечи.",
        "Улыбка без решения улыбнуться, щедрость, желание поделиться.",
        "Потребность, которая закрывается прямо сейчас.",
        "хочется объявить громко — проверь, не облегчение ли это"
      ],
      [
        "Радость с прыжком: превзошло ожидание.",
        "Подъём в груди, быстрое дыхание, тепло по шее.",
        "Восклицания, рука на чужом плече, рассказ дважды.",
        "Неожиданность плюс то, что было важнее, чем говорилось.",
        "оседает в ровное тепло — это счастье"
      ],
      [
        "Радость, которой нужны свидетели; в ней есть торжество.",
        "Широкая грудь, руки хотят вверх, энергия в ногах.",
        "Громкий голос, движение, звонки всем.",
        "Усилие, которое наконец оплатилось, часто после сомнений.",
        "внизу больше облегчения, чем гордости — назови облегчение"
      ],
      [
        "Лёгкое поднятое настроение, не привязанное к событию.",
        "Пружина в ногах, свободное дыхание, тяга вверх.",
        "Быстрый шаг, юмор, «да» на предложения.",
        "Отдых, безопасность или тихо разрешившееся дело.",
        "хрупко и быстро — поищи тревогу в светлой одежде"
      ],
      [
        "Радость как возвращение сил: система включилась.",
        "Тепло в конечностях, аппетит, желание двигаться.",
        "Больше слов, планы, начатые дела.",
        "Долгая плоская полоса, которая только что кончилась.",
        "не получается сбавить — возможно, это возбуждение"
      ],
      [
        "Радость с выключенным звуком: сейчас ничего не нужно.",
        "Медленное дыхание, мягкий живот, ровно распределённый вес.",
        "Неподвижность, неспешная речь, лёгкость рядом.",
        "Потребность закрыта достаточно долго, чтобы охрана ушла.",
        "это способ не чувствовать — это отрешённость"
      ],
      [
        "Радость быть целиком внутри дела.",
        "Наклон вперёд, забытое тело, странное время.",
        "Не слышать своего имени, работать за полночь.",
        "Умение плюс безопасность: нечего защищать.",
        "это укрытие — заметь, от чего именно"
      ],
      [
        "Самая тихая радость: наклон к чему-то.",
        "Поднятые глаза, лёгкий наклон, дыхание чуть выше.",
        "Вопросы, чтение дальше, задержаться.",
        "Достаточно безопасности, чтобы быть любопытным.",
        "это тревожный поиск — ближе к беспокойству"
      ],
      [
        "Радость в форме ухода за кем-то.",
        "Тёплая грудь, внимательные руки, лицо мягче.",
        "Спросить, как дела, мелкие дела, помнить детали.",
        "Любовь и желание, чтобы человеку было хорошо.",
        "тяжело и настороженно — ближе к беспокойству"
      ],
      [
        "Радость, наклонённая к тому, что ещё не пришло.",
        "Лёгкий живот, частый пульс, наклон вперёд.",
        "Считать дни, планировать, рассказывать.",
        "Доверие, что хорошее действительно придёт.",
        "пульс от страха — это опасение"
      ],
      [
        "Радость на высокой энергии, трудно усидеть.",
        "Быстрое дыхание, тёплая кожа, беспокойные руки и ноги.",
        "Быстрая речь, смех, перескоки между делами.",
        "Желанное, пришедшее быстрее, чем ждали.",
        "тело собрано, а не раскрыто — это тревога"
      ],
      [
        "Радость, взятая из будущего и съеденная сейчас.",
        "Приятное стягивание в груди, улыбка про себя.",
        "Готовиться, представлять вслух, продумывать детали.",
        "Доверие плюс время: хорошее близко.",
        "боишься, что не случится — это беспокойство"
      ],
      [
        "Радость, держащая дверь открытой в темноте.",
        "Ровное малое тепло низко в груди.",
        "Продолжать, спрашивать снова, держать план живым.",
        "То, что было достаточно важным, чтобы не бросить.",
        "спорит с фактами — посмотри на отрицание"
      ],
      [
        "Радость в том, чтобы ещё не знать.",
        "Лёгкая голова, поднятые брови, наклон к.",
        "Вопросы, отступления, тянуть за нить.",
        "Достаточно безопасности, чтобы ошибиться при других.",
        "поиск испуганный — это тревога"
      ],
      [
        "Радость, когда снимается груз.",
        "Долгий выдох, опустившиеся плечи, внезапная усталость.",
        "Сесть, странно рассмеяться, сказать, что всё.",
        "Сколько страха несли, не называя.",
        "на кону ничего не было — это счастье"
      ],
      [
        "Радость как приятие: дать хорошему приземлиться.",
        "Открытая грудь, медленное дыхание, тихие руки.",
        "Неподвижность, тишина, смотреть, а не говорить.",
        "Разрешение иметь то, что есть.",
        "держишь на расстоянии вытянутой руки — отрешённость"
      ],
      [
        "Радость, которая перестала спорить с тем, что есть.",
        "Мягкие плечи, ровное дыхание, свободная челюсть.",
        "Простая речь, меньше условий, тело легче.",
        "Горе, которому дали закончиться.",
        "это смирение, тяжёлое и плоское — ближе к безнадёжности"
      ],
      [
        "Радость, в которой слишком много спешки.",
        "Стянутая грудь, постукивание, дыхание высоко в горле.",
        "Смотреть на часы, перебивать, срезать углы.",
        "Желание хорошего и страх задержки.",
        "спешка от страха — это тревога"
      ],
      [
        "Радость доверять тому, что нельзя доказать.",
        "Осевшая грудь, глубокое дыхание, спокойные руки.",
        "Устойчивость под давлением, меньше слов, умение ждать.",
        "Опыт, который держал раньше.",
        "нужно, чтобы все согласились — посмотри, чего боишься"
      ],
      [
        "Радость перед тем, что больше ожидаемого.",
        "Широкие глаза, открытый рот, задержанное дыхание.",
        "Остановиться на полушаге, замолчать, показать рукой.",
        "Достаточно открытости, чтобы быть тронутым.",
        "скорее пугает, чем раскрывает — это потрясение"
      ]
    ]
  }
};

/** Glow zones on the ring-2 body silhouette. */
export const bodyZones = [
  {
    "k": "chest",
    "x": "50%",
    "y": "31%",
    "w": "92%",
    "c": "rgba(192,86,58,.34)",
    "dur": "7.5s",
    "delay": "0s"
  },
  {
    "k": "throat",
    "x": "50%",
    "y": "17%",
    "w": "52%",
    "c": "rgba(192,86,58,.32)",
    "dur": "6.5s",
    "delay": ".4s"
  },
  {
    "k": "belly",
    "x": "50%",
    "y": "56%",
    "w": "78%",
    "c": "rgba(192,151,63,.32)",
    "dur": "9s",
    "delay": ".9s"
  },
  {
    "k": "head",
    "x": "50%",
    "y": "7%",
    "w": "62%",
    "c": "rgba(180,116,109,.3)",
    "dur": "8s",
    "delay": "1.3s"
  },
  {
    "k": "shoulders",
    "x": "50%",
    "y": "23%",
    "w": "108%",
    "c": "rgba(146,133,105,.3)",
    "dur": "10s",
    "delay": ".2s"
  },
  {
    "k": "hands",
    "x": "50%",
    "y": "48%",
    "w": "118%",
    "c": "rgba(192,86,58,.26)",
    "dur": "8.5s",
    "delay": "1.7s"
  },
  {
    "k": "legs",
    "x": "50%",
    "y": "84%",
    "w": "80%",
    "c": "rgba(146,133,105,.28)",
    "dur": "11s",
    "delay": "2.2s"
  },
  {
    "k": "whole",
    "x": "50%",
    "y": "50%",
    "w": "150%",
    "c": "rgba(180,116,109,.2)",
    "dur": "13s",
    "delay": "0s"
  }
] as const;

/** Maps each ring-2 word (by index) to the body zone it lights up. */
export const bodyZoneForWord: string[] = [
  "chest",
  "throat",
  "belly",
  "head",
  "shoulders",
  "chest",
  "head",
  "whole",
  "whole",
  "legs",
  "chest",
  "hands",
  "chest"
];

/** One earth tone per family, tinted when the family is not the one in hand. */
export const famColor = [
  "#C0563A",
  "#93794F",
  "#6B7F86",
  "#C0973F",
  "#B4746D",
  "#8A8075"
] as const;
export const famTint = [
  "rgba(192,86,58,.16)",
  "rgba(147,121,79,.16)",
  "rgba(107,127,134,.16)",
  "rgba(192,151,63,.16)",
  "rgba(180,116,109,.16)",
  "rgba(138,128,117,.14)"
] as const;
export const famTintHover = [
  "rgba(192,86,58,.3)",
  "rgba(147,121,79,.3)",
  "rgba(107,127,134,.3)",
  "rgba(192,151,63,.3)",
  "rgba(180,116,109,.3)",
  "rgba(138,128,117,.26)"
] as const;
