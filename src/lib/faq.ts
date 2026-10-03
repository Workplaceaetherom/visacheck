// VisaCheck FAQ — common questions about visa rules and the VisaCheck tool.
// Pure data module — no I/O, no React, no storage.

export interface FAQItem {
  id: string;
  question: { en: string; ur: string; bn: string };
  answer: { en: string; ur: string; bn: string };
  category: 'general' | 'skilled_worker' | 'student' | 'visitor' | 'privacy';
}

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'what-is-visacheck',
    question: {
      en: 'What is VisaCheck?',
      ur: 'VisaCheck کیا ہے؟',
      bn: 'VisaCheck কী?',
    },
    answer: {
      en: 'VisaCheck is a free, privacy-first tool that compares your answers against published visa rules for 6 countries (UK, US, Canada, Australia, Germany, UAE). It shows you which rules apply and links to the official authority for each one. Nothing you type is stored.',
      ur: 'VisaCheck ایک مفت، نجی نوعیت کا ٹول ہے جو آپ کے جوابات کو 6 ممالک (برطانیہ، امریکہ، کینیڈا، آسٹریلیا، جرمنی، متحدہ عرب امارات) کے شائع شدہ ویزا قواعد سے موازنہ کرتا ہے۔ یہ آپ کو بتاتا ہے کہ کون سے قواعد لاگو ہوتے ہیں اور ہر ایک کے لیے سرکاری اتھارٹی کا لنک دیتا ہے۔ آپ جو کچھ ٹائپ کرتے ہیں وہ محفوظ نہیں ہوتا۔',
      bn: 'VisaCheck একটি বিনামূল্যে, গোপনীয়তা-প্রথম টুল যা আপনার উত্তরগুলিকে ৬টি দেশের (যুক্তরাজ্য, যুক্তরাষ্ট্র, কানাডা, অস্ট্রেলিয়া, জার্মানি, সংযুক্ত আরব আমিরাত) প্রকাশিত ভিসা নিয়মের সাথে তুলনা করে। এটি আপনাকে দেখায় কোন নিয়মগুলি প্রযোজ্য এবং প্রতিটির জন্য সরকারি কর্তৃপক্ষের লিঙ্ক দেয়। আপনি যা টাইপ করেন তা সংরক্ষিত হয় না।',
    },
    category: 'general',
  },
  {
    id: 'is-it-immigration-advice',
    question: {
      en: 'Is VisaCheck immigration advice?',
      ur: 'کیا VisaCheck امیگریشن مشورہ ہے؟',
      bn: 'VisaCheck কি অভিবাসন পরামর্শ?',
    },
    answer: {
      en: 'No. VisaCheck is engineering information, not legal advice. Every rule ships with a PENDING_HUMAN_CLICK marker — until a human verifies it on the official authority website, every check shows the safe "being verified" state. For your situation, talk to a regulated immigration adviser.',
      ur: 'نہیں۔ VisaCheck انجینئرنگ معلومات ہے، قانونی مشورہ نہیں۔ ہر قاعدے میں PENDING_HUMAN_CLICK مارکر ہے — جب تک کوئی انسان اسے سرکاری اتھارٹی کی ویب سائٹ پر توثیق نہیں کرتا، ہر چیک محفوظ ”توثیق زیر التواء“ حالت میں رہتا ہے۔ اپنی صورتحال کے لیے کسی ریگولیٹڈ امیگریشن مشیر سے بات کریں۔',
      bn: 'না। VisaCheck প্রকৌশলগত তথ্য, আইনি পরামর্শ নয়। প্রতিটি নিয়মে PENDING_HUMAN_CLICK মার্কার রয়েছে — একজন মানুষ এটি সরকারি কর্তৃপক্ষের ওয়েবসাইটে যাচাই না করা পর্যন্ত, প্রতিটি পরীক্ষা নিরাপদ "যাচাই চলছে" অবস্থায় থাকে। আপনার পরিস্থিতির জন্য একজন নিয়ন্ত্রিত অভিবাসন উপদেষ্টার সাথে কথা বলুন।',
    },
    category: 'general',
  },
  {
    id: 'what-data-stored',
    question: {
      en: 'What data does VisaCheck store about me?',
      ur: 'VisaCheck میرے بارے میں کیا ڈیٹا محفوظ کرتا ہے؟',
      bn: 'VisaCheck আমার সম্পর্কে কী ডেটা সংরক্ষণ করে?',
    },
    answer: {
      en: 'Nothing. Your answers are sent only to the rules engine, evaluated in-memory, and returned. Nothing is written to disk, no logs include your answers, no analytics run. The only on-device storage is three localStorage keys: your language (vcLang), your theme (vcTheme), and a flag set after your first "Start the check" click (vcUsedOnce).',
      ur: 'کچھ نہیں۔ آپ کے جوابات صرف قواعد انجن کو بھیجے جاتے ہیں، میموری میں جانچے جاتے ہیں، اور واپس آتے ہیں۔ کچھ ڈسک پر نہیں لکھا جاتا، کوئی لاگ آپ کے جوابات شامل نہیں، کوئی اینالیٹکس نہیں چلتی۔ صرف آن-ڈیوائس اسٹوریج تین localStorage کلیدز ہیں: آپ کی زبان (vcLang)، آپ کا تھیم (vcTheme)، اور پہلے ”چیک شروع کریں“ کلک کے بعد ایک فلیگ (vcUsedOnce)۔',
      bn: 'কিছুই না। আপনার উত্তরগুলি শুধুমাত্র নিয়ম ইঞ্জিনে পাঠানো হয়, মেমরিতে মূল্যায়ন করা হয়, এবং ফেরত দেওয়া হয়। কিছুই ডিস্কে লেখা হয় না, কোনো লগে আপনার উত্তর অন্তর্ভুক্ত নেই, কোনো অ্যানালিটিক্স চলে না। একমাত্র অন-ডিভাইস স্টোরেজ তিনটি localStorage কী: আপনার ভাষা (vcLang), আপনার থিম (vcTheme), এবং প্রথম "চেক শুরু করুন" ক্লিকের পরে একটি ফ্ল্যাগ (vcUsedOnce)।',
    },
    category: 'privacy',
  },
  {
    id: 'how-often-rules-updated',
    question: {
      en: 'How often are the rules updated?',
      ur: 'قواعد کتنی بار اپڈیٹ ہوتے ہیں؟',
      bn: 'নিয়মগুলি কতবার আপডেট হয়?',
    },
    answer: {
      en: 'The announcements feed auto-refreshes every 5 minutes, so you see pending rule changes (consultations, proposed rules, announced changes) as soon as they are published. Each rule also shows its lastUpdated date and effectiveFrom date so you can verify currency.',
      ur: 'اعلانات فیڈ ہر 5 منٹ میں خود بخود ریفریش ہوتا ہے، تاکہ آپ زیر التواء قواعد کی تبدیلیاں (مشاورتیں، تجویز کردہ قواعد، اعلان کردہ تبدیلیاں) اشاعت کے فوراً بعد دیکھ سکیں۔ ہر قاعدہ اپنی آخری اپڈیٹ کی تاریخ اور نافذ از تاریخ بھی دکھاتا ہے تاکہ آپ اس کی تازگی کی تصدیق کر سکیں۔',
      bn: 'ঘোষণা ফিড প্রতি ৫ মিনিটে স্বয়ংক্রিয়ভাবে রিফ্রেশ হয়, তাই আপনি বিচারাধীন নিয়ম পরিবর্তন (পরামর্শ, প্রস্তাবিত নিয়ম, ঘোষিত পরিবর্তন) প্রকাশিত হওয়ার সাথে সাথে দেখতে পান। প্রতিটি নিয়ম তার সর্বশেষ আপডেটের তারিখ এবং কার্যকর তারিখও দেখায় যাতে আপনি সতেজতা যাচাই করতে পারেন।',
    },
    category: 'general',
  },
  {
    id: 'which-countries-covered',
    question: {
      en: 'Which countries does VisaCheck cover?',
      ur: 'VisaCheck کون سے ممالک کو ڈھانچہ ہے؟',
      bn: 'VisaCheck কোন দেশগুলিকে কভার করে?',
    },
    answer: {
      en: 'Currently 6 destination countries: United Kingdom (UKVI), United States (USCIS), Canada (IRCC), Australia (Home Affairs), Germany (BAMF), and United Arab Emirates (ICP). Each has 6 visa categories: skilled worker, student, visitor, family, business, and investor. More countries are being added.',
      ur: 'فی الحال 6 منزل کے ممالک: برطانیہ (UKVI)، امریکہ (USCIS)، کینیڈا (IRCC)، آسٹریلیا (Home Affairs)، جرمنی (BAMF)، اور متحدہ عرب امارات (ICP)۔ ہر ایک میں 6 ویزا کیٹیگریاں ہیں: ہنر مند کارکن، طالب علم، زائر، خاندان، کاروبار، اور سرمایہ کار۔ مزید ممالک شامل کیے جا رہے ہیں۔',
      bn: 'বর্তমানে ৬টি গন্তব্য দেশ: যুক্তরাজ্য (UKVI), যুক্তরাষ্ট্র (USCIS), কানাডা (IRCC), অস্ট্রেলিয়া (Home Affairs), জার্মানি (BAMF), এবং সংযুক্ত আরব আমিরাত (ICP)। প্রতিটিতে ৬টি ভিসা বিভাগ রয়েছে: দক্ষ কর্মী, ছাত্র, ভিজিটর, পরিবার, ব্যবসা, এবং বিনিয়োগকারী। আরও দেশ যোগ করা হচ্ছে।',
    },
    category: 'general',
  },
  {
    id: 'what-is-pending-human-click',
    question: {
      en: 'Why does every rule show "being verified"?',
      ur: 'ہر قاعدہ ”توثیق زیر التواء“ کیوں دکھاتا ہے؟',
      bn: 'কেন প্রতিটি নিয়ম "যাচাই চলছে" দেখায়?',
    },
    answer: {
      en: 'Every rule ships with a PENDING_HUMAN_CLICK marker. Until a human clicks through the official authority website and verifies the rule wording, every check shows the safe "being verified" state. This is the gate working — it is a feature, not a bug. It prevents VisaCheck from presenting unverified data as fact.',
      ur: 'ہر قاعدے میں PENDING_HUMAN_CLICK مارکر ہے۔ جب تک کوئی انسان سرکاری اتھارٹی کی ویب سائٹ پر کلک نہیں کرتا اور قاعدے کے الفاظ کی توثیق نہیں کرتا، ہر چیک محفوظ ”توثیق زیر التواء“ حالت میں رہتا ہے۔ یہ دروازے کا کام کرنا ہے — یہ ایک فیچر ہے، بگ نہیں۔ یہ VisaCheck کو غیر تصدیق شدہ ڈیٹا کو حقیقت کے طور پر پیش کرنے سے روکتا ہے۔',
      bn: 'প্রতিটি নিয়মে PENDING_HUMAN_CLICK মার্কার রয়েছে। একজন মানুষ সরকারি কর্তৃপক্ষের ওয়েবসাইটে ক্লিক করে এবং নিয়মের শব্দ যাচাই না করা পর্যন্ত, প্রতিটি পরীক্ষা নিরাপদ "যাচাই চলছে" অবস্থায় থাকে। এটি গেট কাজ করছে — এটি একটি বৈশিষ্ট্য, বাগ নয়। এটি VisaCheck কে অযাচাইকৃত ডেটাকে সত্য হিসাবে উপস্থাপন করতে বাধা দেয়।',
    },
    category: 'general',
  },
  {
    id: 'can-i-trust-the-salary-thresholds',
    question: {
      en: 'Can I trust the salary thresholds shown?',
      ur: 'کیا دکھائی گئی تنخواہ کی حدود پر بھروسہ کیا جا سکتا ہے؟',
      bn: 'দেখানো বেতন সীমাগুলিতে কি আমি বিশ্বাস করতে পারি?',
    },
    answer: {
      en: 'The thresholds are published figures from official sources, but every rule is in the PENDING_HUMAN_CLICK state until verified. Always check the source link (shown on each rule card) to confirm the current figure on the official authority website before making decisions.',
      ur: 'یہ حدود سرکاری ذرائع سے شائع کردہ اعداد و شمار ہیں، لیکن ہر قاعدہ توثیق تک PENDING_HUMAN_CLICK حالت میں ہے۔ فيصلے کرنے سے پہلے موجودہ رقم کی تصدیق کے لیے ہمیشہ سرکاری اتھارٹی کی ویب سائٹ پر ماخذ لنک (ہر قاعدہ کارڈ پر دکھایا گیا) دیکھیں۔',
      bn: 'সীমাগুলি সরকারি উৎস থেকে প্রকাশিত পরিসংখ্যান, কিন্তু প্রতিটি নিয়ম যাচাই না হওয়া পর্যন্ত PENDING_HUMAN_CLICK অবস্থায় রয়েছে। সিদ্ধান্ত নেওয়ার আগে সর্বদা সরকারি কর্তৃপক্ষের ওয়েবসাইটে বর্তমান পরিসংখ্যান নিশ্চিত করতে উৎস লিঙ্ক (প্রতিটি নিয়ম কার্ডে দেখানো) পরীক্ষা করুন।',
    },
    category: 'skilled_worker',
  },
  {
    id: 'does-visacheck-cover-student-visas',
    question: {
      en: 'Does VisaCheck cover student visas?',
      ur: 'کیا VisaCheck اسٹوڈنٹ ویزا کو ڈھانچہ ہے؟',
      bn: 'VisaCheck কি ছাত্র ভিসা কভার করে?',
    },
    answer: {
      en: 'Yes. Each country has a Student visa category. The wizard adapts its questions per category — for Student visas, you will be asked about admission offers and study funds rather than job title and salary. Quick Check profiles (e.g. Nigeria → US Student) let you see results instantly.',
      ur: 'ہاں۔ ہر ملک میں اسٹوڈنٹ ویزا کیٹیگری ہے۔ ویزارد ہر کیٹیگری کے مطابق اپنے سوالات ڈھالتا ہے — اسٹوڈنٹ ویزا کے لیے، آپ سے نوکری کے عنوان اور تنخواہ کے بجائے داخلہ کی پیشکش اور تعلیمی فنڈز کے بارے میں پوچھا جائے گا۔ کوئیک چیک پروفائلز (مثلاً نائجیریا → امریکی اسٹوڈنٹ) آپ کو فوراً نتائج دیکھنے دیتے ہیں۔',
      bn: 'হ্যাঁ। প্রতিটি দেশে একটি স্টুডেন্ট ভিসা বিভাগ রয়েছে। উইজার্ড প্রতিটি বিভাগ অনুযায়ী তার প্রশ্নগুলি মানিয়ে নেয় — স্টুডেন্ট ভিসার জন্য, আপনাকে চাকরির শিরোনাম এবং বেতনের পরিবর্তে ভর্তির প্রস্তাব এবং অধ্যয়ন তহবিল সম্পর্কে জিজ্ঞাসা করা হবে। কুইক চেক প্রোফাইল (যেমন নাইজেরিয়া → মার্কিন স্টুডেন্ট) আপনাকে তাৎক্ষণিকভাবে ফলাফল দেখতে দেয়।',
    },
    category: 'student',
  },
  {
    id: 'what-documents-do-i-need',
    question: {
      en: 'What documents will I need for my application?',
      ur: 'اپنی درخواست کے لیے مجھے کون سے دستاویزات درکار ہوں گے؟',
      bn: 'আমার আবেদনের জন্য কী কী নথিপত্র লাগবে?',
    },
    answer: {
      en: 'It varies by country and visa type, but common documents include: a valid passport, a Certificate of Sponsorship (for work visas) or admission letter (for student visas), proof of funds, English language test certificate, tuberculosis test result (for some countries), and a criminal record certificate. Each rule card links to the official authority where you can find the exact document checklist.',
      ur: 'یہ ملک اور ویزا کی قسم کے لحاظ سے مختلف ہوتا ہے، لیکن عام دستاویزات میں شامل ہیں: درست پاسپورٹ، اسپانسرشپ کا سرٹیفکیٹ (ورک ویزا کے لیے) یا داخلہ کا خط (اسٹوڈنٹ ویزا کے لیے)، فنڈز کا ثبوت، انگریزی زبان کے ٹیسٹ کا سرٹیفکیٹ، ٹی بی ٹیسٹ کا نتیجہ (کچھ ممالک کے لیے)، اور کرائمنل ریکارڈ سرٹیفکیٹ۔ ہر قاعدہ کارڈ سرکاری اتھارٹی سے جڑتا ہے جہاں آپ کو دقیق دستاویز چیک لسٹ مل سکتی ہے۔',
      bn: 'এটি দেশ এবং ভিসার ধরন অনুসারে পরিবর্তিত হয়, কিন্তু সাধারণ নথিপত্রগুলির মধ্যে রয়েছে: একটি বৈধ পাসপোর্ট, স্পন্সরশিপ সার্টিফিকেট (ওয়ার্ক ভিসার জন্য) বা ভর্তির চিঠি (স্টুডেন্ট ভিসার জন্য), তহবিলের প্রমাণ, ইংরেজি ভাষা পরীক্ষার সার্টিফিকেট, টিবি পরীক্ষার ফলাফল (কিছু দেশের জন্য), এবং ক্রিমিনাল রেকর্ড সার্টিফিকেট। প্রতিটি নিয়ম কার্ড সরকারি কর্তৃপক্ষের সাথে সংযুক্ত করে যেখানে আপনি সঠিক নথিপত্র চেকলিস্ট খুঁজে পেতে পারেন।',
    },
    category: 'general',
  },
  {
    id: 'how-long-does-processing-take',
    question: {
      en: 'How long does visa processing take?',
      ur: 'ویزا کی پروسیسنگ میں کتنا وقت لگتا ہے؟',
      bn: 'ভিসা প্রসেসিং কতটা সময় নেয়?',
    },
    answer: {
      en: 'Processing times vary significantly by country, visa type, and time of year. Standard processing can take 3 weeks to 3 months. Priority services are often available for an additional fee (typically 5 working days). Always check the official authority website for current processing times before planning your application.',
      ur: 'پروسیسنگ کا وقت ملک، ویزا کی قسم، اور سال کے وقت کے لحاظ سے نمایاں طور پر مختلف ہوتا ہے۔ معیاری پروسیسنگ میں 3 ہفتے سے 3 ماہ لگ سکتے ہیں۔ اضافی فیس کے لیے اکثر ترجیحی سروسز دستیاب ہیں (عام طور پر 5 کام کرنے والے دن)۔ اپنی درخواست کی منصوبہ بندی سے پہلے موجودہ پروسیسنگ کے اوقات کے لیے ہمیشہ سرکاری اتھارٹی کی ویب سائٹ دیکھیں۔',
      bn: 'প্রসেসিং সময় দেশ, ভিসার ধরন এবং বছরের সময় অনুসারে উল্লেখযোগ্যভাবে পরিবর্তিত হয়। স্ট্যান্ডার্ড প্রসেসিংয়ে ৩ সপ্তাহ থেকে ৩ মাস সময় লাগতে পারে। অতিরিক্ত ফির জন্য অগ্রাধিকার পরিষেবা প্রায়শই উপলব্ধ (সাধারণত ৫ কর্মদিবস)। আপনার আবেদন পরিকল্পনার আগে সর্বদা বর্তমান প্রসেসিং সময়ের জন্য সরকারি কর্তৃপক্ষের ওয়েবসাইট পরীক্ষা করুন।',
    },
    category: 'general',
  },
  {
    id: 'what-if-my-visa-is-refused',
    question: {
      en: 'What if my visa application is refused?',
      ur: 'اگر میری ویزا کی درخواست مسترد ہو جائے تو؟',
      bn: 'যদি আমার ভিসা আবেদন প্রত্যাখ্যান করা হয় তবে কী?',
    },
    answer: {
      en: 'Most countries offer an appeal or administrative review process. The refusal letter will explain your options and deadlines. You may also be able to re-apply with additional evidence. VisaCheck is not a substitute for regulated legal advice — if your application is refused, consult a regulated immigration adviser for your specific situation.',
      ur: 'زیادہ تر ممالک اپیل یا انتظامی جائزہ کے عمل کی پیشکش کرتے ہیں۔ مستردگی کا خط آپ کے اختیارات اور آخری تاریخوں کی وضاحت کرے گا۔ آپ اضافی ثبوت کے ساتھ دوبارہ درخواست دے سکتے ہیں۔ VisaCheck ریگولیٹڈ قانونی مشورے کا متبادل نہیں ہے — اگر آپ کی درخواست مسترد ہو جائے، تو اپنی مخصوص صورتحال کے لیے کسی ریگولیٹڈ امیگریشن مشیر سے مشورہ کریں।',
      bn: 'বেশিরভাগ দেশ একটি আপিল বা প্রশাসনিক পর্যালোচনা প্রক্রিয়া অফার করে। প্রত্যাখ্যান চিঠি আপনার বিকল্প এবং সময়সীমা ব্যাখ্যা করবে। আপনি অতিরিক্ত প্রমাণ সহ পুনরায় আবেদন করতে পারেন। VisaCheck নিয়ন্ত্রিত আইনি পরামর্শের বিকল্প নয় — যদি আপনার আবেদন প্রত্যাখ্যাত হয়, তাহলে আপনার নির্দিষ্ট পরিস্থিতির জন্য একজন নিয়ন্ত্রিত অভিবাসন উপদেষ্টার সাথে পরামর্শ করুন।',
    },
    category: 'general',
  },
  {
    id: 'do-i-need-an-interview',
    question: {
      en: 'Will I need to attend a visa interview?',
      ur: 'کیا مجھے ویزا انٹرویو میں شرکت کرنی ہوگی؟',
      bn: 'আমাকে কি ভিসা ইন্টারভিউতে অংশ নিতে হবে?',
    },
    answer: {
      en: 'Some visa categories and nationalities require an in-person interview at a visa application center or embassy. For example, US student and work visas typically require an interview, while UK Skilled Worker visas often do not. The official authority website will tell you if an interview is required for your specific route.',
      ur: 'کچھ ویزا کیٹیگریاں اور قومیتوں کے لیے ویزا درخواست مرکز یا سفارت خانے پر ذاتی انٹرویو کی ضرورت ہوتی ہے۔ مثال کے طور پر، امریکی اسٹوڈنٹ اور ورک ویزا کے لیے عام طور پر انٹرویو درکار ہوتا ہے، جبکہ برطانوی ہنر مند کارکن ویزا کے لیے اکثر نہیں ہوتا۔ سرکاری اتھارٹی کی ویب سائٹ آپ کو بتائے گی کہ آپ کے مخصوص راستے کے لیے انٹرویو درکار ہے یا نہیں।',
      bn: 'কিছু ভিসা বিভাগ এবং জাতীয়তার জন্য ভিসা আবেদন কেন্দ্র বা দূতাবাসে সাক্ষাৎকারের প্রয়োজন। উদাহরণস্বরূপ, মার্কিন ছাত্র এবং ওয়ার্ক ভিসার জন্য সাধারণত সাক্ষাৎকার প্রয়োজন, অন্যদিকে যুক্তরাজ্যের স্কিলড ওয়ার্কার ভিসার জন্য প্রায়শই নয়। সরকারি কর্তৃপক্ষের ওয়েবসাইট আপনাকে বলবে আপনার নির্দিষ্ট রুটের জন্য সাক্ষাৎকার প্রয়োজন কিনা।',
    },
    category: 'general',
  },
];

export const FAQ_CATEGORIES: { id: FAQItem['category']; label: { en: string; ur: string; bn: string } }[] = [
  { id: 'general', label: { en: 'General', ur: 'عمومی', bn: 'সাধারণ' } },
  { id: 'skilled_worker', label: { en: 'Skilled Worker', ur: 'ہنر مند کارکن', bn: 'দক্ষ কর্মী' } },
  { id: 'student', label: { en: 'Student', ur: 'طالب علم', bn: 'ছাত্র' } },
  { id: 'visitor', label: { en: 'Visitor', ur: 'زائر', bn: 'ভিজিটর' } },
  { id: 'privacy', label: { en: 'Privacy', ur: 'رازداری', bn: 'গোপনীয়তা' } },
];
