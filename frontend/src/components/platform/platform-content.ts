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
