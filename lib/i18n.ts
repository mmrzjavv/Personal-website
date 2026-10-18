// Small, dependency-free language layer. English is the default; Persian is
// the alternate language and is kept beside every string so the portfolio
// copy remains easy to edit.
export type Lang = "en" | "fa";

export const LANGUAGES: Lang[] = ["en", "fa"];
export const DEFAULT_LANG: Lang = "en";

type Leaf = Record<Lang, string>;
type Node = Leaf | { [key: string]: Node };

function isLeaf(node: Node): node is Leaf {
  return typeof (node as Leaf).fa === "string";
}

export const DICT = {
  picker: {
    season: { fa: "فصل", en: "Season" },
    language: { fa: "زبان", en: "Language" },
  },
  seasons: {
    spring: { fa: "بهار", en: "Spring" },
    summer: { fa: "تابستان", en: "Summer" },
    autumn: { fa: "پاییز", en: "Autumn" },
    winter: { fa: "زمستان", en: "Winter" },
  },
  nav: {
    aria: { fa: "بخش‌ها", en: "Sections" },
    home: { fa: "خانه", en: "Home" },
    stack: { fa: "مهارت‌ها", en: "Stack" },
    experience: { fa: "تجربه", en: "Experience" },
    project: { fa: "پروژه", en: "Project" },
    contact: { fa: "تماس", en: "Contact" },
  },
  header: {
    name: { fa: "محمدرضا جواهری", en: "Mohammadreza Javaheri" },
    availability: {
      fa: "آماده‌ی همکاری",
      en: "Open to opportunities",
    },
  },
  hero: {
    greeting: { fa: "سلام، من محمدرضا هستم", en: "Hi, I am" },
    roleLine: {
      fa: "مهندس نرم‌افزار فول‌استک.",
      en: "Full-stack Software Engineer.",
    },
    tagline: {
      fa: "توسعه‌ی سیستم‌های بک‌اند، محصولات هوش مصنوعی و تجربه‌های دیجیتال قابل اتکا.",
      en: "Backend systems, AI products, and reliable digital workflows.",
    },
    cv: { fa: "دانلود رزومه", en: "Download CV" },
    hire: { fa: "ارتباط با من", en: "Contact me" },
    scroll: { fa: "برای کاوش اسکرول کنید", en: "Scroll to explore" },
    keysHint: { fa: "· روی کلیدها بروید", en: "· hover over the keys" },
  },
  stack: {
    title: { fa: "تک استک", en: "Tech Stack" },
    hint: { fa: "روی یک مهارت یا کلید بروید", en: "Hover a skill or key" },
    hintMobile: { fa: "یک مهارت را انتخاب کنید", en: "Tap a skill" },
    kicker: { fa: "ابزارها", en: "toolkit" },
    activeLabel: { fa: "مهارت فعال", en: "Active skill" },
    categories: {
      backend: { fa: "بک‌اند و داده", en: "Backend & data" },
      architecture: { fa: "معماری", en: "Architecture" },
      frontend: { fa: "فرانت‌اند", en: "Frontend" },
      ai: { fa: "هوش مصنوعی", en: "AI & ML" },
    },
  },
  experience: {
    title: { fa: "تجربه", en: "Experience" },
    subtitle: { fa: "مسیر حرفه‌ای من.", en: "My professional journey." },
  },
  projects: {
    title: { fa: "پروژه‌ها", en: "Projects" },
    subtitle: { fa: "چند محصول ساخته‌شده.", en: "Selected work." },
    scrollHint: { fa: "برای دیدن پروژه‌های بعدی به چپ و راست اسکرول کنید", en: "Scroll sideways to explore the next project" },
    navigation: { fa: "جابجایی بین پروژه‌ها", en: "Project navigation" },
    previous: { fa: "قبلی", en: "Previous" },
    next: { fa: "بعدی", en: "Next" },
    kicker: { fa: "پروژه", en: "project" },
    viewMore: { fa: "مشاهده جزئیات", en: "View details" },
    viewImages: { fa: "مشاهده تصاویر", en: "View images" },
    openProject: { fa: "ورود به پروژه", en: "Open project" },
    showMore: { fa: "نمایش پروژه‌های بیشتر", en: "Show more projects" },
    showLess: { fa: "نمایش کمتر", en: "Show less" },
    showingCount: {
      fa: "{shown} از {total} پروژه",
      en: "{shown} of {total} projects",
    },
    projectLabel: { fa: "لینک پروژه", en: "project link" },
    projectWithoutLink: { fa: "نمونه‌کار", en: "showcase" },
    openProjectHint: { fa: "لینک مستقیم پروژه در یک تب جدید باز می‌شود.", en: "The project link opens directly in a new tab." },
    close: { fa: "بستن", en: "Close" },
    stackLabel: { fa: "فناوری‌ها", en: "Built with" },
    overview: { fa: "خلاصه", en: "Overview" },
    jumpTo: { fa: "رفتن به پروژه", en: "Jump to project" },
  },
  contact: {
    kicker: { fa: "ساخت محصول", en: "build something" },
    title: {
      fa: "برای کسب‌وکارتان اپلیکیشن اختصاصی می‌خواهید؟",
      en: "Need a custom app for your business?",
    },
    body: {
      fa: "درباره‌ی ایده، نیازها و مسیر ساخت محصولتان با من گفتگو کنید تا راهکار مناسب و قابل اتکایی برای آن پیدا کنیم.",
      en: "Tell me about your idea, needs, and product goals — we can find a reliable direction and build the right solution together.",
    },
    copyEmail: { fa: "کپی ایمیل", en: "Copy email" },
    openMail: { fa: "شروع گفتگو", en: "Start a conversation" },
    call: { fa: "تماس با", en: "Call" },
    github: { fa: "گیت‌هاب", en: "GitHub" },
    linkedin: { fa: "لینکدین", en: "LinkedIn" },
    emailToast: { fa: "ایمیل کپی شد", en: "Email copied" },
    footer: {
      fa: "© ۲۰۲۶ محمدرضا جواهری. تمامی حقوق محفوظ است.",
      en: "© 2026 Mohammadreza Javaheri. All rights reserved.",
    },
  },
  keyboard: {
    taglines: {
      javascript: { fa: "شروع مسیر وب؛ هنوز هم قدرتمند.", en: "Where it all started. Still here, still in charge." },
      typescript: { fa: "جاوااسکریپت با کمربند ایمنی.", en: "Same JS, with a seatbelt." },
      html5: { fa: "استخوان‌بندی هر صفحه.", en: "The bones of any page." },
      css: { fa: "جزئیاتی که خوب را از زیبا جدا می‌کند.", en: "What separates good from beautiful." },
      tailwindcss: { fa: "طراحی سریع و دقیق در دل کد.", en: "Utility-first. Design inside the HTML." },
      python: { fa: "خوانا، سریع و مناسب ساختن.", en: "Reads like English, scales like a rocket." },
      react: { fa: "کامپوننت، کامپوننت، کامپوننت.", en: "Components, components, components." },
      nextdotjs: { fa: "ری‌اکت کامل‌تر با routing و SSR.", en: "React all grown up: routing, SSR, edge." },
      vuedotjs: { fa: "فرانت‌اندی آرام و خوش‌ساخت.", en: "The most relaxed frontend." },
      nodedotjs: { fa: "جاوااسکریپت روی سرور.", en: "JavaScript on the server." },
      php: { fa: "بخش بزرگی از وب را می‌چرخاند.", en: "Runs more of the web than you think." },
      odoo: { fa: "ERP بدون دردسر اضافه.", en: "ERP that doesn't make you cry." },
      postgresql: { fa: "پایگاه داده‌ای که همیشه کار می‌کند.", en: "The boring database that always works." },
      docker: { fa: "همان روی سیستم من، همان در production.", en: "Same on my machine, same in production." },
      git: { fa: "تاریخچه و ماشین زمان کد.", en: "History and a time machine for your code." },
      dotnet: { fa: "سرویس‌های قابل اعتماد برای دامنه‌های پیچیده.", en: "Reliable services for complex domains." },
      redis: { fa: "سرعت، درست جایی که مهم است.", en: "Speed where it matters." },
      apachekafka: { fa: "رویدادهایی که سیستم را در حرکت نگه می‌دارند.", en: "Events that keep systems moving." },
      "signalr-websockets": { fa: "ارتباط بلادرنگ برای تجربه‌های زنده.", en: "Real-time communication for live products." },
      cqrs: { fa: "خواندن و نوشتن، هرکدام در جای درست.", en: "Separate reads and writes with intent." },
      "clean-architecture": { fa: "مرزهای روشن برای کدی که دوام می‌آورد.", en: "Clear boundaries for code that lasts." },
      ddd: { fa: "مدل دامنه، قبل از پیچیدگی فنی.", en: "Model the domain before the machinery." },
      "data-access": { fa: "داده‌ی سریع، قابل تست و قابل اتکا.", en: "Fast, testable, dependable data access." },
      langchain: { fa: "ارکستراسیون LLMها با هدف مشخص.", en: "Orchestrating LLMs with intent." },
      "llm-rag": { fa: "هوش مصنوعی متصل به دانش واقعی.", en: "AI grounded in useful knowledge." },
      ai: { fa: "ساخت سیستم‌های هوشمند end-to-end.", en: "Building end-to-end intelligent systems." },
      ml: { fa: "مدل‌سازی، ارزیابی و پیش‌بینی.", en: "Modeling, evaluation, and prediction." },
      dl: { fa: "شبکه‌های عصبی برای مسائل پیچیده.", en: "Neural nets for hard problems." },
      nlp: { fa: "زبان، متن و درک معنا.", en: "Language, text, and meaning." },
      "computer-vision": { fa: "دیدن، تشخیص و فهم تصویر.", en: "Seeing, detecting, and understanding images." },
      yolo: { fa: "تشخیص اشیاء سریع و دقیق.", en: "Fast, accurate object detection." },
      tensorflow: { fa: "آموزش و سرو مدل در مقیاس.", en: "Train and serve models at scale." },
    },
  },
} as const satisfies Record<string, Node>;

export function translate(path: string, lang: Lang): string {
  const parts = path.split(".");
  let ref: Node = DICT as unknown as Node;
  for (const part of parts) {
    if (isLeaf(ref)) return path;
    ref = (ref as { [key: string]: Node })[part];
    if (ref === undefined) return path;
  }
  if (isLeaf(ref)) return ref[lang] ?? ref.fa ?? path;
  return path;
}
