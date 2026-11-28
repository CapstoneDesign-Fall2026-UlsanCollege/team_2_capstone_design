export interface FaqItem {
  q: string;
  a: string;
}

export const PLATFORM_FAQS: FaqItem[] = [
  {
    q: "What does it cost?",
    a: "Nothing right now. ShopCraft is in beta and free to use. No card needed.",
  },
  {
    q: "How do shoppers pay?",
    a: "With Khalti, or with cash when the order arrives. For cash orders we check that the number is a valid Nepali mobile number (98 or 97). We don't confirm it by SMS yet.",
  },
  {
    q: "Where does my store live?",
    a: "At shopcraft.me/s/your-store-name. You choose the name when you sign up.",
  },
  {
    q: "Can I change how my store looks?",
    a: "Yes. Pick one of four looks and add your logo. You can switch later.",
  },
];

export const PLATFORM_STEPS = [
  {
    num: "१",
    label: "STEP 1",
    title: "Name your store",
    desc: "Type a name. Your link is ready at shopcraft.me/s/your-name.",
  },
  {
    num: "२",
    label: "STEP 2",
    title: "Pick a look",
    desc: "Choose one of four looks and add your logo.",
  },
  {
    num: "३",
    label: "STEP 3",
    title: "Add your products",
    desc: "Add photos, prices in rupees, sizes and variants. Then share your link.",
  },
] as const;

export interface PlatformDemoStore {
  themeId: "editorial-warm" | "pahadi-sage" | "ktm-bold" | "midnight-obsidian";
  slug: string;
  storeName: string;
  themeName: string;
  category: string;
}

export const PLATFORM_DEMO_STORES: readonly PlatformDemoStore[] = [
  {
    themeId: "editorial-warm",
    slug: "kora-coffee-tea",
    storeName: "Kora Coffee & Tea",
    themeName: "Editorial Warm",
    category: "Coffee & Tea",
  },
  {
    themeId: "pahadi-sage",
    slug: "jadibuti-botanicals",
    storeName: "Jadibuti Botanicals",
    themeName: "Pahadi Sage",
    category: "Botanicals & Spices",
  },
  {
    themeId: "ktm-bold",
    slug: "chauk-streetwear",
    storeName: "Chauk Streetwear",
    themeName: "KTM Bold",
    category: "Streetwear & Apparel",
  },
  {
    themeId: "midnight-obsidian",
    slug: "bhir-honey-harvest",
    storeName: "Bhir Honey & Harvest",
    themeName: "Midnight Obsidian",
    category: "Honey & Harvest",
  },
] as const;

export const PLATFORM_DEMO_STORE_BY_THEME: Record<string, PlatformDemoStore> =
  Object.fromEntries(PLATFORM_DEMO_STORES.map((item) => [item.themeId, item]));
