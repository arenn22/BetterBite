import type { IconName } from "@/components/ui/icon";

export type TagKind = "dietary" | "cuisine";

export type TagVisual = {
  icon: IconName;
  /** Icon / accent color for the tag. */
  tint: string;
  /** Soft background used behind the icon. */
  bg: string;
};

const GREEN = { tint: "#5E7A4E", bg: "#E8F0E2" };
const OLIVE = { tint: "#7C8A3A", bg: "#F0F2DE" };
const WHEAT = { tint: "#A27B2C", bg: "#F7EDD8" };
const BLUE = { tint: "#4A7A99", bg: "#E3EEF4" };
const RED = { tint: "#B5503A", bg: "#F8E2DA" };
const TERRA = { tint: "#C4855F", bg: "#FDF0EA" };
const PLUM = { tint: "#8A5A82", bg: "#F2E6F0" };
const GOLD = { tint: "#B8892A", bg: "#F8EED6" };
const SLATE = { tint: "#5F6B73", bg: "#E9ECEE" };

/**
 * Ordered keyword rules: the first rule whose keyword appears in the
 * normalized tag name wins, so more specific keywords come first.
 */
const DIETARY_RULES: [string[], TagVisual][] = [
  [["pescatarian", "pescetarian"], { icon: "fish", ...BLUE }],
  [["vegan", "plantbased"], { icon: "leaf", ...GREEN }],
  [["vegetarian", "veggie"], { icon: "carrot", ...OLIVE }],
  [["glutenfree", "gluten", "celiac", "coeliac", "wheat", "grain"], { icon: "wheat", ...WHEAT }],
  [["dairyfree", "lactose", "dairy", "milk"], { icon: "milk", ...BLUE }],
  [["eggfree", "egg"], { icon: "egg", ...GOLD }],
  [["peanut", "nut", "treenut"], { icon: "nut", ...TERRA }],
  [["shellfish", "seafood", "fishfree", "fish"], { icon: "fish", ...BLUE }],
  [["soy"], { icon: "allergens", ...OLIVE }],
  [["sesame", "allerg"], { icon: "allergens", ...TERRA }],
  [["keto", "lowcarb", "carb", "atkins"], { icon: "meat", ...RED }],
  [["paleo", "carnivore", "primal", "whole30"], { icon: "kebab", ...RED }],
  [["protein"], { icon: "protein", ...PLUM }],
  [["sugar", "diabet"], { icon: "sugar", ...PLUM }],
  [["sodium", "salt"], { icon: "salt", ...SLATE }],
  [["lowfat", "fat", "heart", "cholesterol", "dash"], { icon: "heartHealth", ...RED }],
  [["calorie", "light", "weight"], { icon: "scale", ...SLATE }],
  [["fodmap", "ibs", "gut", "digest"], { icon: "stomach", ...PLUM }],
  [["halal"], { icon: "moon", ...GREEN }],
  [["kosher"], { icon: "starOfDavid", ...BLUE }],
  [["raw"], { icon: "raw", ...GREEN }],
  [["organic", "wholefood", "clean"], { icon: "organic", ...GREEN }],
  [["free", "no"], { icon: "noFood", ...SLATE }],
];

const CUISINE_RULES: [string[], TagVisual][] = [
  [["italian", "tuscan", "sicilian"], { icon: "pasta", ...GREEN }],
  [["pizza"], { icon: "pizza", ...RED }],
  [["mexican", "texmex"], { icon: "taco", ...TERRA }],
  [["thai", "vietnamese", "laotian", "cambodian", "malaysian", "indonesian", "singapore"], { icon: "noodles", ...GOLD }],
  [["indian", "pakistani", "bangladeshi", "srilankan", "nepalese", "curry"], { icon: "curry", ...TERRA }],
  [["japanese", "sushi"], { icon: "bento", ...RED }],
  [["korean"], { icon: "bowl", ...RED }],
  [["chinese", "cantonese", "sichuan", "szechuan", "taiwanese", "dimsum"], { icon: "dumpling", ...RED }],
  [["filipino", "asian"], { icon: "bowl", ...GOLD }],
  [["french", "bakery", "pastry"], { icon: "croissant", ...WHEAT }],
  [["american", "diner", "burger"], { icon: "burger", ...BLUE }],
  [["southern", "cajun", "creole", "soul", "bbq", "barbecue", "texas"], { icon: "grill", ...RED }],
  [["greek", "mediterranean"], { icon: "olive", ...OLIVE }],
  [["middleeastern", "lebanese", "turkish", "persian", "israeli", "arab", "levant", "moroccan", "egyptian"], { icon: "kebab", ...GOLD }],
  [["spanish", "tapas", "portuguese"], { icon: "wine", ...RED }],
  [["caribbean", "jamaican", "cuban", "hawaiian", "polynesian", "island"], { icon: "palm", ...BLUE }],
  [["african", "ethiopian", "nigerian", "ghanaian", "kenyan"], { icon: "sun", ...TERRA }],
  [["brazilian", "peruvian", "argentin", "colombian", "latin", "southamerican"], { icon: "globeAmericas", ...GREEN }],
  [["german", "british", "english", "irish", "scottish", "polish", "russian", "ukrainian", "scandinavian", "nordic", "swedish", "european", "austrian", "hungarian"], { icon: "globeEurope", ...SLATE }],
  [["fusion", "international", "global", "world"], { icon: "globe", ...PLUM }],
  [["dessert", "baking", "sweet"], { icon: "cake", ...PLUM }],
  [["breakfast", "brunch", "cafe", "coffee"], { icon: "coffee", ...WHEAT }],
];

const FALLBACK: Record<TagKind, TagVisual> = {
  dietary: { icon: "leaf", ...GREEN },
  cuisine: { icon: "forkKnife", ...TERRA },
};

export function normalizeTagName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function getTagVisual(name: string, kind: TagKind): TagVisual {
  const normalized = normalizeTagName(name);
  const rules = kind === "dietary" ? DIETARY_RULES : CUISINE_RULES;
  const match = rules.find(([keywords]) => keywords.some((keyword) => normalized.includes(keyword)));
  return match ? match[1] : FALLBACK[kind];
}
