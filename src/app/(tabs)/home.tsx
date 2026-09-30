import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { colors, fonts, shadowSm } from "./theme";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const LOGGED_DAYS = [true, true, true, true, true, false, false];

const RECIPES = {
  recommended: [
    { id: 1, title: "Golden Garlic Pasta", difficulty: "Easy", time: "20 min", img: "https://images.unsplash.com/photo-1617474020181-e1d42f2245ea?w=400&h=300&fit=crop&auto=format" },
    { id: 2, title: "Herb Roast Chicken", difficulty: "Medium", time: "55 min", img: "https://images.unsplash.com/photo-1737625854730-56e11fcaff17?w=400&h=300&fit=crop&auto=format" },
    { id: 3, title: "Tomato Shakshuka", difficulty: "Easy", time: "25 min", img: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&h=300&fit=crop&auto=format" },
    { id: 4, title: "Smoky Lentil Bowl", difficulty: "Easy", time: "30 min", img: "https://images.unsplash.com/photo-1667473775795-41f69ae72c44?w=400&h=300&fit=crop&auto=format" },
  ],
  easyWins: [
    { id: 5, title: "Fried Egg Toast", difficulty: "Beginner", time: "8 min", img: "https://images.unsplash.com/photo-1465014925804-7b9ede58d0d7?w=400&h=300&fit=crop&auto=format" },
    { id: 6, title: "Avocado Rice Bowl", difficulty: "Beginner", time: "12 min", img: "https://images.unsplash.com/photo-1617474019977-0e105d1b430e?w=400&h=300&fit=crop&auto=format" },
    { id: 7, title: "Quick Veggie Stir-fry", difficulty: "Easy", time: "15 min", img: "https://images.unsplash.com/photo-1605522283494-4901a98d458e?w=400&h=300&fit=crop&auto=format" },
    { id: 8, title: "Tomato Basil Pasta", difficulty: "Easy", time: "18 min", img: "https://images.unsplash.com/photo-1617474019991-689674c2d1ae?w=400&h=300&fit=crop&auto=format" },
  ],
  challenge: [
    { id: 9, title: "Braised Short Ribs", difficulty: "Advanced", time: "3 hrs", img: "https://images.unsplash.com/photo-1714683237282-4a4623333058?w=400&h=300&fit=crop&auto=format" },
    { id: 10, title: "Steamed Whole Fish", difficulty: "Hard", time: "45 min", img: "https://images.unsplash.com/photo-1528712518629-67d42968a45e?w=400&h=300&fit=crop&auto=format" },
    { id: 11, title: "Cassoulet", difficulty: "Advanced", time: "4 hrs", img: "https://images.unsplash.com/photo-1767514579388-278d63566fd7?w=400&h=300&fit=crop&auto=format" },
    { id: 12, title: "Rosemary Focaccia", difficulty: "Hard", time: "2.5 hrs", img: "https://images.unsplash.com/photo-1518737003272-dac7c4760d5e?w=400&h=300&fit=crop&auto=format" },
  ],
  friends: [
    { id: 13, title: "Miso Ramen", difficulty: "Medium", time: "40 min", img: "https://images.unsplash.com/photo-1699251775859-ef6a2f69ef5b?w=400&h=300&fit=crop&auto=format", friend: "Maya K." },
    { id: 14, title: "Chicken Burrito Bowl", difficulty: "Easy", time: "30 min", img: "https://images.unsplash.com/photo-1788227356559-7e9a7a2846cb?w=400&h=300&fit=crop&auto=format", friend: "Tomás R." },
    { id: 15, title: "Veggie Noodle Stir-fry", difficulty: "Easy", time: "20 min", img: "https://images.unsplash.com/photo-1591459034470-d1e05d7b05d4?w=400&h=300&fit=crop&auto=format", friend: "Priya N." },
    { id: 16, title: "Pan-Seared Salmon", difficulty: "Medium", time: "25 min", img: "https://images.unsplash.com/photo-1614955177711-2540ad25432b?w=400&h=300&fit=crop&auto=format", friend: "Lena W." },
  ],
};

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  Beginner: { bg: "#E8EDE5", text: "#687B5D" },
  Easy: { bg: "#E8EDE5", text: "#687B5D" },
  Medium: { bg: "#FDF0EA", text: "#C4855F" },
  Hard: { bg: "#FDEAE0", text: "#C4855F" },
  Advanced: { bg: "#FCE4D6", text: "#B5603A" },
};

interface Recipe {
  id: number;
  title: string;
  difficulty: string;
  time: string;
  img: string;
  friend?: string;
}

function RecipeCard({ recipe, onOpen }: { recipe: Recipe; onOpen: (id: number) => void }) {
  const diff = DIFFICULTY_COLORS[recipe.difficulty] ?? DIFFICULTY_COLORS.Easy;
  return (
    <Pressable
      onPress={() => onOpen(recipe.id)}
      style={({ pressed }) => [styles.recipeCard, shadowSm, pressed && { opacity: 0.92 }]}
    >
      <View style={styles.recipeImgWrap}>
        <Image source={{ uri: recipe.img }} style={styles.fill} resizeMode="cover" />
        {recipe.friend && (
          <View style={styles.friendTag}>
            <Text style={styles.friendTagText}>{recipe.friend}</Text>
          </View>
        )}
      </View>
      <View style={{ padding: 10 }}>
        <Text numberOfLines={2} style={styles.recipeTitle}>{recipe.title}</Text>
        <View style={styles.rowBetween}>
          <View style={[styles.pill, { backgroundColor: diff.bg }]}>
            <Text style={[styles.pillText, { color: diff.text }]}>{recipe.difficulty}</Text>
          </View>
          <Text style={styles.recipeTime}>{recipe.time}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function RecipeSection({
  icon, title, subtitle, recipes, onOpen,
}: { icon: string; title: string; subtitle: string; recipes: Recipe[]; onOpen: (id: number) => void }) {
  return (
    <View style={{ marginBottom: 24 }}>
      <View style={styles.sectionHead}>
        <Text style={{ fontSize: 20, marginTop: 2 }}>{icon}</Text>
        <View>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSub}>{subtitle}</Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4, gap: 12 }}
      >
        {recipes.map((r) => (
          <RecipeCard key={r.id} recipe={r} onOpen={onOpen} />
        ))}
      </ScrollView>
    </View>
  );
}

function HomeScreen({ onOpen }: { onOpen: (id: number) => void }) {
  const [loggedToday, setLoggedToday] = useState(false);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* HEADER */}
      <View style={styles.homeHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Good morning</Text>
          <Text style={styles.h1}>Hey, Sofía.</Text>
          <Text style={styles.subtitle}>A little progress tastes good.</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 12 }}>
          <View>
            <View style={styles.avatar}>
              <Image
                source={{ uri: "https://images.unsplash.com/photo-1556910636-c508da52e01c?w=96&h=96&fit=crop&auto=format" }}
                style={styles.fill}
              />
            </View>
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarBadgeText}>Home Cook</Text>
            </View>
          </View>
          <Pressable style={[styles.iconBtn, shadowSm]}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Circle cx={12} cy={12} r={3} />
              <Path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
              <Path d="M12 2v2m0 18v-2M2 12h2m18 0h-2" />
            </Svg>
          </Pressable>
        </View>
      </View>

      {/* STREAK CARD */}
      <View style={[styles.streakCard, shadowSm]}>
        <View style={[styles.rowBetween, { marginBottom: 12 }]}>
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={{ fontSize: 20 }}>🔥</Text>
              <Text style={styles.streakTitle}>5 day streak</Text>
            </View>
            <Text style={[styles.sectionSub, { marginTop: 2 }]}>Keep your cooking rhythm going.</Text>
          </View>
          <Pressable
            onPress={() => setLoggedToday(!loggedToday)}
            style={({ pressed }) => [
              styles.logBtn,
              { backgroundColor: loggedToday ? colors.sageLight : colors.sage },
              pressed && { transform: [{ scale: 0.95 }] },
            ]}
          >
            <Text style={[styles.logBtnText, { color: loggedToday ? colors.sage : "#fff" }]}>
              {loggedToday ? "Logged ✓" : "Log today"}
            </Text>
          </Pressable>
        </View>
        <View style={styles.rowBetween}>
          {DAYS.map((day, i) => {
            const active = LOGGED_DAYS[i] || (i === 5 && loggedToday);
            return (
              <View key={i} style={{ alignItems: "center", gap: 4 }}>
                <View style={[styles.dayDot, { backgroundColor: active ? colors.terracotta : colors.divider }]}>
                  {active ? (
                    <Text style={{ fontSize: 14 }}>🔥</Text>
                  ) : (
                    <Text style={{ fontSize: 12, fontWeight: "600", color: colors.ghost }}>{day}</Text>
                  )}
                </View>
                <Text style={styles.dayLabel}>{day}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* WEEKLY CHALLENGE */}
      <View style={styles.challenge}>
        <View style={styles.blobTR} />
        <View style={styles.blobBL} />
        <View style={styles.rowBetween}>
          <Text style={styles.challengeEyebrow}>This week's challenge</Text>
          <Text style={{ fontSize: 20 }}>🏆</Text>
        </View>
        <Text style={styles.challengeTitle}>One-Pan Dinners</Text>
        <Text style={styles.challengeBody}>
          Cook any meal using just one pan, pot, or skillet. Simple wins.
        </Text>
        <View style={styles.rowBetween}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ flexDirection: "row" }}>
              {["🧑", "👩", "🧑‍🍳"].map((emoji, i) => (
                <View key={i} style={[styles.miniAvatar, i > 0 && { marginLeft: -6 }]}>
                  <Text style={{ fontSize: 12 }}>{emoji}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.challengeFriends}>3 friends completed this</Text>
          </View>
          <Pressable style={({ pressed }) => [styles.joinBtn, pressed && { transform: [{ scale: 0.95 }] }]}>
            <Text style={styles.joinBtnText}>Join →</Text>
          </Pressable>
        </View>
      </View>

      {/* RECIPE SECTIONS */}
      <RecipeSection icon="🔥" title="Recommended for you" subtitle="Hand-picked matches for your level" recipes={RECIPES.recommended} onOpen={onOpen} />
      <RecipeSection icon="⚡" title="Easy wins" subtitle="Under 20 minutes, no fuss" recipes={RECIPES.easyWins} onOpen={onOpen} />
      <RecipeSection icon="🏆" title="Challenge yourself" subtitle="Push your skills further" recipes={RECIPES.challenge} onOpen={onOpen} />
      <RecipeSection icon="👥" title="From your friends" subtitle="What the community cooked this week" recipes={RECIPES.friends} onOpen={onOpen} />
    </ScrollView>
  );
}

export default function HomeScreenRoute() {
  return <HomeScreen onOpen={() => undefined} />;
}

const styles = StyleSheet.create({
  fill: { width: "100%", height: "100%" },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  // Home header
  homeHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingTop: 16, paddingBottom: 16, paddingHorizontal: 16 },
  eyebrow: { fontSize: 12, fontWeight: "600", color: colors.sage, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 },
  h1: { fontFamily: fonts.heading, fontSize: 30, color: colors.ink, lineHeight: 36 },
  subtitle: { fontSize: 14, fontWeight: "500", color: colors.muted, marginTop: 4 },
  avatar: { width: 48, height: 48, borderRadius: 24, overflow: "hidden", borderWidth: 2, borderColor: colors.sage, backgroundColor: colors.sageLight },
  avatarBadge: { position: "absolute", bottom: -4, right: -4, backgroundColor: colors.sage, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  avatarBadgeText: { color: "#fff", fontSize: 8, fontWeight: "800" },
  iconBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },

  // Streak
  streakCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16 },
  streakTitle: { fontFamily: fonts.heading, fontSize: 24, color: colors.ink },
  logBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  logBtnText: { fontSize: 12, fontWeight: "700" },
  dayDot: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  dayLabel: { fontSize: 9, fontWeight: "600", color: colors.faint, textTransform: "uppercase" },

  // Challenge
  challenge: { marginHorizontal: 16, marginBottom: 24, backgroundColor: colors.clay, borderRadius: 16, padding: 16, overflow: "hidden" },
  blobTR: { position: "absolute", top: -24, right: -24, width: 128, height: 128, borderRadius: 64, backgroundColor: "rgba(196,133,95,0.3)" },
  blobBL: { position: "absolute", bottom: -16, left: -16, width: 96, height: 96, borderRadius: 48, backgroundColor: "rgba(232,196,174,0.4)" },
  challengeEyebrow: { fontSize: 10, fontWeight: "800", color: "rgba(122,58,24,0.7)", textTransform: "uppercase", letterSpacing: 1.5 },
  challengeTitle: { fontFamily: fonts.heading, fontSize: 20, color: "#fff", marginTop: 6, marginBottom: 8 },
  challengeBody: { fontSize: 12, fontWeight: "500", color: "rgba(255,255,255,0.8)", lineHeight: 19, marginBottom: 12 },
  miniAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.3)", borderWidth: 1, borderColor: "rgba(255,255,255,0.5)", alignItems: "center", justifyContent: "center" },
  challengeFriends: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.9)" },
  joinBtn: { backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  joinBtnText: { color: colors.terracotta, fontSize: 12, fontWeight: "800" },

  // Sections / cards
  sectionHead: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: colors.ink },
  sectionSub: { fontSize: 12, fontWeight: "500", color: colors.muted, marginTop: 2 },
  recipeCard: { width: 176, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff" },
  recipeImgWrap: { height: 112, backgroundColor: colors.sageLight, overflow: "hidden" },
  friendTag: { position: "absolute", bottom: 8, left: 8, backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  friendTagText: { fontSize: 10, fontWeight: "600", color: colors.ink },
  recipeTitle: { fontSize: 12, fontWeight: "700", color: colors.ink, lineHeight: 15, marginBottom: 6 },
  pill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  pillText: { fontSize: 10, fontWeight: "600" },
  recipeTime: { fontSize: 10, fontWeight: "500", color: colors.muted },

});