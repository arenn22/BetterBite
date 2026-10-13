import { SymbolView, type SymbolViewProps } from "expo-symbols";
import type { ColorValue, StyleProp, ViewStyle } from "react-native";

import { colors } from "@/app/(tabs)/theme";

type SymbolNames = Exclude<SymbolViewProps["name"], string>;
type SFName = NonNullable<SymbolNames["ios"]>;
type MaterialName = NonNullable<SymbolNames["android"]>;

/**
 * Every icon in the app, keyed by meaning. `ios` is an SF Symbol, `md` is a
 * Material Symbol (used on Android and web), so each icon looks native everywhere.
 */
export const ICONS = {
  // Navigation
  home: { ios: "house.fill", md: "home" },
  explore: { ios: "safari.fill", md: "explore" },
  create: { ios: "plus.circle.fill", md: "add_circle" },
  social: { ios: "person.2.fill", md: "group" },
  profile: { ios: "person.crop.circle.fill", md: "account_circle" },
  settings: { ios: "gearshape.fill", md: "settings" },
  back: { ios: "chevron.left", md: "arrow_back" },
  forward: { ios: "arrow.right", md: "arrow_forward" },
  chevronRight: { ios: "chevron.right", md: "chevron_right" },
  chevronDown: { ios: "chevron.down", md: "expand_more" },

  // Actions
  search: { ios: "magnifyingglass", md: "search" },
  filter: { ios: "line.3.horizontal.decrease", md: "tune" },
  close: { ios: "xmark", md: "close" },
  check: { ios: "checkmark", md: "check" },
  checkCircle: { ios: "checkmark.circle.fill", md: "check_circle" },
  circle: { ios: "circle", md: "radio_button_unchecked" },
  add: { ios: "plus", md: "add" },
  edit: { ios: "pencil", md: "edit" },
  camera: { ios: "camera.fill", md: "photo_camera" },
  addPhoto: { ios: "photo.badge.plus", md: "add_a_photo" },
  photo: { ios: "photo.on.rectangle.angled", md: "photo_library" },
  logout: { ios: "rectangle.portrait.and.arrow.right", md: "logout" },
  trash: { ios: "trash", md: "delete" },
  lock: { ios: "lock.fill", md: "lock" },
  bell: { ios: "bell.fill", md: "notifications" },
  mail: { ios: "envelope.fill", md: "mail" },
  personAdd: { ios: "person.badge.plus", md: "person_add" },
  personCheck: { ios: "person.fill.checkmark", md: "how_to_reg" },
  refresh: { ios: "arrow.clockwise", md: "refresh" },

  // Stats & feedback
  heart: { ios: "heart", md: "favorite" },
  heartFill: { ios: "heart.fill", md: "favorite" },
  eye: { ios: "eye.fill", md: "visibility" },
  clock: { ios: "clock.fill", md: "schedule" },
  timer: { ios: "timer", md: "timer" },
  bolt: { ios: "bolt.fill", md: "bolt" },
  flame: { ios: "flame.fill", md: "local_fire_department" },
  trophy: { ios: "trophy.fill", md: "emoji_events" },
  medal: { ios: "medal.fill", md: "military_tech" },
  star: { ios: "star.fill", md: "star" },
  sparkles: { ios: "sparkles", md: "auto_awesome" },
  celebrate: { ios: "party.popper.fill", md: "celebration" },
  chart: { ios: "chart.bar.fill", md: "leaderboard" },
  seal: { ios: "checkmark.seal.fill", md: "verified" },
  wave: { ios: "hand.wave.fill", md: "waving_hand" },
  people: { ios: "person.3.fill", md: "groups" },
  book: { ios: "book.closed.fill", md: "menu_book" },
  list: { ios: "list.bullet", md: "list" },
  numberedList: { ios: "list.number", md: "format_list_numbered" },
  tag: { ios: "tag.fill", md: "sell" },

  // Food
  forkKnife: { ios: "fork.knife", md: "restaurant" },
  pan: { ios: "frying.pan.fill", md: "skillet" },
  leaf: { ios: "leaf.fill", md: "eco" },
  sprout: { ios: "leaf.circle.fill", md: "psychiatry" },
  carrot: { ios: "carrot.fill", md: "nutrition" },
  fish: { ios: "fish.fill", md: "set_meal" },
  egg: { ios: "oval.portrait.fill", md: "egg" },
  milk: { ios: "waterbottle.fill", md: "water_full" },
  wheat: { ios: "laurel.leading", md: "grain" },
  meat: { ios: "flame.circle.fill", md: "kebab_dining" },
  nut: { ios: "allergens.fill", md: "allergies" },
  allergens: { ios: "allergens.fill", md: "allergies" },
  noFood: { ios: "nosign", md: "no_food" },
  sugar: { ios: "cube.fill", md: "cookie" },
  salt: { ios: "drop.fill", md: "water_drop" },
  protein: { ios: "dumbbell.fill", md: "fitness_center" },
  heartHealth: { ios: "heart.text.square.fill", md: "monitor_heart" },
  scale: { ios: "scalemass.fill", md: "scale" },
  shield: { ios: "checkmark.shield.fill", md: "health_and_safety" },
  moon: { ios: "moon.stars.fill", md: "mosque" },
  starOfDavid: { ios: "star.circle.fill", md: "synagogue" },
  stomach: { ios: "cross.case.fill", md: "gastroenterology" },
  raw: { ios: "carrot.fill", md: "grocery" },
  organic: { ios: "leaf.arrow.triangle.circlepath", md: "compost" },
  bowl: { ios: "takeoutbag.and.cup.and.straw.fill", md: "rice_bowl" },
  pasta: { ios: "fork.knife.circle.fill", md: "dinner_dining" },
  taco: { ios: "flame.fill", md: "tapas" },
  noodles: { ios: "takeoutbag.and.cup.and.straw.fill", md: "ramen_dining" },
  curry: { ios: "cup.and.heat.waves.fill", md: "soup_kitchen" },
  bento: { ios: "square.grid.2x2.fill", md: "bento" },
  croissant: { ios: "birthday.cake.fill", md: "bakery_dining" },
  burger: { ios: "takeoutbag.and.cup.and.straw.fill", md: "lunch_dining" },
  olive: { ios: "leaf.fill", md: "spa" },
  dumpling: { ios: "takeoutbag.and.cup.and.straw.fill", md: "takeout_dining" },
  kebab: { ios: "flame.fill", md: "kebab_dining" },
  pizza: { ios: "triangle.fill", md: "local_pizza" },
  grill: { ios: "flame.fill", md: "outdoor_grill" },
  coffee: { ios: "cup.and.saucer.fill", md: "local_cafe" },
  cake: { ios: "birthday.cake.fill", md: "cake" },
  wine: { ios: "wineglass.fill", md: "wine_bar" },
  sun: { ios: "sun.max.fill", md: "wb_sunny" },
  palm: { ios: "beach.umbrella.fill", md: "beach_access" },
  mountain: { ios: "mountain.2.fill", md: "landscape" },
  globe: { ios: "globe", md: "public" },
  globeAmericas: { ios: "globe.americas.fill", md: "public" },
  globeEurope: { ios: "globe.europe.africa.fill", md: "public" },
  globeAsia: { ios: "globe.asia.australia.fill", md: "public" },
  columns: { ios: "building.columns.fill", md: "account_balance" },
} as const satisfies Record<string, { ios: SFName; md: MaterialName }>;

export type IconName = keyof typeof ICONS;

export type AppIconProps = {
  name: IconName;
  size?: number;
  color?: ColorValue;
  weight?: "regular" | "medium" | "semibold" | "bold";
  style?: StyleProp<ViewStyle>;
};

export function AppIcon({ name, size = 20, color = colors.ink, weight = "medium", style }: AppIconProps) {
  const icon = ICONS[name];
  return (
    <SymbolView
      name={{ ios: icon.ios, android: icon.md, web: icon.md }}
      size={size}
      tintColor={color}
      weight={weight}
      resizeMode="scaleAspectFit"
      style={style}
      accessible={false}
      importantForAccessibility="no"
    />
  );
}
