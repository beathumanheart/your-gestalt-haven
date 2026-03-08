/**
 * ============================================================
 * CONTACT SECTION CONTENT
 * ============================================================
 * Edit this file to update all text on the Contact section.
 * Both EN and RU translations are side by side for easy editing.
 * ============================================================
 */

export interface ContactContent {
  label: string;
  title1: string;
  title2: string;
  subtitle: string;
  confidential: string;
  telegramLabel: string;
  telegramUrl: string;
  signalLabel: string;
  signalUrl: string;
  sessionLabel: string;
  sessionId: string;
  orText: string;
  /** Calendly embed URL. */
  calendlyUrl: string;
}

export const contactEN: ContactContent = {
  label: "Book a Session",
  title1: "Ready to",
  title2: "Begin?",
  subtitle:
    "The first step is often the hardest. I'm here to make it as easy as possible.",
  confidential:
    "If you prefer, just reach out directly on ",
  telegramLabel: "Telegram",
  telegramUrl: "https://t.me/humanheartbeat",
  signalLabel: "Signal",
  signalUrl: "https://signal.me/#eu/54EL7BMiWPJCsLFzC0PY4J6uP4Ds7eu4cL243diq7MXIk1-L8oJGyIcY05eV_gCN",
  sessionLabel: "Session",
  sessionId: "05e95070d5641f3eaefb760ff151e043e5cc27df1bed974b575d98c32e1cc56c2e",
  orText: ", ",
  calendlyUrl: "https://calendly.com/beathumanheart/30min",
};

export const contactRU: ContactContent = {
  label: "Запись",
  title1: "Готовы",
  title2: "начать?",
  subtitle:
    "Первый шаг — часто самый сложный. Я сделаю всё, чтобы это было проще.",
  confidential:
    "Если хотите — просто напишите в ",
  telegramLabel: "Telegram",
  telegramUrl: "https://t.me/humanheartbeat",
  signalLabel: "Signal",
  signalUrl: "https://signal.me/#eu/54EL7BMiWPJCsLFzC0PY4J6uP4Ds7eu4cL243diq7MXIk1-L8oJGyIcY05eV_gCN",
  sessionLabel: "Session",
  sessionId: "05e95070d5641f3eaefb760ff151e043e5cc27df1bed974b575d98c32e1cc56c2e",
  orText: ", ",
  calendlyUrl: "https://calendly.com/beathumanheart/30min",
};
