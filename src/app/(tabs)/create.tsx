import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView, Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Circle, Ellipse, G, Line, Rect } from "react-native-svg";
import { colors, fonts, shadowSm } from "./theme";

// ─── Types & constants ───────────────────────────────────────────────────────

const DIFFICULTIES = ["Beginner", "Easy", "Medium", "Hard", "Advanced"] as const;
type Difficulty = typeof DIFFICULTIES[number];

const DIETARY_TAGS = [
  { id: "vegan", label: "Vegan", emoji: "🌱" },
  { id: "vegetarian", label: "Vegetarian", emoji: "🥦" },
  { id: "glutenfree", label: "Gluten-Free", emoji: "🌾" },
  { id: "dairyfree", label: "Dairy-Free", emoji: "🥛" },
  { id: "kosher", label: "Kosher", emoji: "✡️" },
  { id: "halal", label: "Halal", emoji: "☪️" },
  { id: "keto", label: "Keto", emoji: "🥩" },
  { id: "paleo", label: "Paleo", emoji: "🍖" },
];

const CUISINE_TAGS = [
  { id: "italian", label: "Italian", emoji: "🍝" },
  { id: "mexican", label: "Mexican", emoji: "🌮" },
  { id: "thai", label: "Thai", emoji: "🍜" },
  { id: "indian", label: "Indian", emoji: "🍛" },
  { id: "japanese", label: "Japanese", emoji: "🍱" },
  { id: "french", label: "French", emoji: "🥐" },
  { id: "american", label: "American", emoji: "🍔" },
  { id: "mediterranean", label: "Mediterranean", emoji: "🫒" },
  { id: "chinese", label: "Chinese", emoji: "🥟" },
  { id: "middleeastern", label: "Middle Eastern", emoji: "🧆" },
];

const DIFF_COLOR: Record<Difficulty, { bg: string; text: string }> = {
  Beginner: { bg: "#E8EDE5", text: "#687B5D" },
  Easy: { bg: "#E8EDE5", text: "#687B5D" },
  Medium: { bg: "#FDF0EA", text: "#C4855F" },
  Hard: { bg: "#FCE4D6", text: "#B5603A" },
  Advanced: { bg: "#F8DDD0", text: "#9B3A1A" },
};

// ─── Small reusable pieces ───────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function StyledInput({
  label, value, onChange, placeholder, multiline = false, rows = 3,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean; rows?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.ghost}
        multiline={multiline}
        numberOfLines={multiline ? rows : 1}
        textAlignVertical={multiline ? "top" : "center"}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          focused && styles.inputFocused,
          multiline && { minHeight: rows * 22 + 20, lineHeight: 20 },
        ]}
      />
    </View>
  );
}

function ListRow({
  index, value, onChange, onRemove, placeholder,
}: {
  index: number; value: string; onChange: (v: string) => void;
  onRemove: () => void; placeholder: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <View style={styles.indexBubble}>
        <Text style={styles.indexText}>{index + 1}</Text>
      </View>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.ghost}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.input, { flex: 1, paddingVertical: 8, paddingHorizontal: 12 }, focused && styles.inputFocused]}
      />
      <Pressable onPress={onRemove} hitSlop={6} style={styles.removeBtn}>
        <Text style={{ color: colors.ghost, fontSize: 12, fontWeight: "700" }}>✕</Text>
      </Pressable>
    </View>
  );
}

// ─── Image upload placeholder SVG ────────────────────────────────────────────

function UploadPlaceholder() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice">
      <Rect width={320} height={180} fill="#FDF0EA" />
      <Ellipse cx={60} cy={40} rx={55} ry={38} fill="#D9A28B" opacity={0.18} />
      <Ellipse cx={270} cy={140} rx={65} ry={42} fill="#C4855F" opacity={0.14} />
      <Ellipse cx={160} cy={90} rx={100} ry={65} fill="#E8C4AE" opacity={0.15} />

      <G transform="translate(25,20) rotate(-15)">
        <Line x1={0} y1={0} x2={0} y2={30} stroke="#8A9E7A" strokeWidth={1.2} opacity={0.55} />
        <Ellipse cx={-7} cy={8} rx={7} ry={2.8} fill="#687B5D" opacity={0.4} transform="rotate(-30 -7 8)" />
        <Ellipse cx={7} cy={16} rx={7} ry={2.8} fill="#8A9E7A" opacity={0.38} transform="rotate(30 7 16)" />
        <Ellipse cx={-6} cy={24} rx={6} ry={2.2} fill="#687B5D" opacity={0.35} transform="rotate(-25 -6 24)" />
      </G>
      <G transform="translate(285,150) rotate(160)">
        <Line x1={0} y1={0} x2={0} y2={26} stroke="#8A9E7A" strokeWidth={1} opacity={0.5} />
        <Ellipse cx={-6} cy={7} rx={6} ry={2.4} fill="#687B5D" opacity={0.38} transform="rotate(-30 -6 7)" />
        <Ellipse cx={6} cy={14} rx={6} ry={2.4} fill="#8A9E7A" opacity={0.35} transform="rotate(30 6 14)" />
      </G>

      <G transform="translate(270,30)" opacity={0.5}>
        <Circle cx={0} cy={0} r={4.5} fill="#D9A28B" />
        <Circle cx={8} cy={-3} r={3.5} fill="#C4855F" />
        <Circle cx={4} cy={8} r={4} fill="#D9A28B" />
        <Line x1={0} y1={-4} x2={-5} y2={-12} stroke="#8A9E7A" strokeWidth={0.9} />
      </G>

      {[[55, 90], [80, 150], [200, 30], [240, 60], [130, 155], [170, 130], [305, 70]].map(([cx, cy], i) => (
        <Circle key={i} cx={cx} cy={cy} r={2} fill="#C4855F" opacity={0.22} />
      ))}

      <Circle cx={160} cy={90} r={48} fill="white" opacity={0.55} />
      <Circle cx={160} cy={90} r={42} fill="none" stroke="#D9A28B" strokeWidth={1.5} strokeDasharray="5 4" opacity={0.55} />
    </Svg>
  );
}

// ─── Live preview card ────────────────────────────────────────────────────────

function PreviewCard({
  name, difficulty, photoSrc,
}: { name: string; difficulty: Difficulty; photoSrc: string | null }) {
  const diff = DIFF_COLOR[difficulty];
  return (
    <View style={[styles.previewCard, shadowSm]}>
      <View style={{ height: 112, backgroundColor: colors.cream, overflow: "hidden" }}>
        {photoSrc ? (
          <Image source={{ uri: photoSrc }} style={styles.fill} resizeMode="cover" />
        ) : (
          <View style={[styles.fill, { alignItems: "center", justifyContent: "center" }]}>
            <Text style={{ fontSize: 30, opacity: 0.4 }}>📷</Text>
          </View>
        )}
        <View style={{ position: "absolute", top: 8, left: 8 }}>
          <View style={{ backgroundColor: diff.bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 }}>
            <Text style={{ fontSize: 9, fontWeight: "800", color: diff.text }}>{difficulty}</Text>
          </View>
        </View>
      </View>
      <View style={{ padding: 10 }}>
        <Text numberOfLines={2} style={{ fontSize: 12, fontWeight: "700", color: colors.ink, lineHeight: 16, minHeight: 32 }}>
          {name || <Text style={{ color: colors.ghost, fontWeight: "500" }}>Your recipe title…</Text>}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
          <View style={{ width: 16, height: 16, borderRadius: 8, overflow: "hidden", backgroundColor: colors.clay }}>
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1556910636-c508da52e01c?w=32&h=32&fit=crop&auto=format" }}
              style={styles.fill}
            />
          </View>
          <Text style={{ fontSize: 9, fontWeight: "500", color: colors.muted }}>by Sofía</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ pct, step, total }: { pct: number; step: number; total: number }) {
  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
        <Text style={{ fontSize: 10, fontWeight: "700", color: colors.muted }}>Step {step} of {total}</Text>
        <Text style={{ fontSize: 10, fontWeight: "700", color: colors.clay }}>{pct}% complete</Text>
      </View>
      <View style={{ height: 6, backgroundColor: colors.cream, borderRadius: 999, overflow: "hidden" }}>
        <LinearGradient
          colors={[colors.clay, colors.terracotta]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: "100%", width: `${pct}%`, borderRadius: 999 }}
        />
      </View>
    </View>
  );
}

// ─── Tag chip row ─────────────────────────────────────────────────────────────

function TagChips({
  tags, selected, onToggle,
}: {
  tags: { id: string; label: string; emoji: string }[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {tags.map((t) => {
        const active = selected.has(t.id);
        return (
          <Pressable
            key={t.id}
            onPress={() => onToggle(t.id)}
            style={({ pressed }) => [
              styles.tagChip,
              active && { backgroundColor: colors.sage, borderColor: colors.sage },
              pressed && { transform: [{ scale: 0.95 }] },
            ]}
          >
            <Text style={{ fontSize: 14 }}>{t.emoji}</Text>
            <Text style={{ fontSize: 12, fontWeight: "700", color: active ? "#fff" : colors.ink }}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function CreateScreen() {
  const [photoSrc, setPhotoSrc] = useState<string | null>(null);
  const [recipeName, setRecipeName] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Easy");
  const [ingredients, setIngredients] = useState(["", ""]);
  const [steps, setSteps] = useState(["", ""]);
  const [dietary, setDietary] = useState<Set<string>>(new Set());
  const [cuisines, setCuisines] = useState<Set<string>>(new Set());
  const [published, setPublished] = useState(false);

  const doneFlags = [
    photoSrc !== null,
    recipeName.trim().length > 2,
    ingredients.filter((i) => i.trim()).length >= 1,
    steps.filter((s) => s.trim()).length >= 1,
  ];
  const doneCount = doneFlags.filter(Boolean).length;
  const pct = Math.round((doneCount / 4) * 100);
  const currentStep = Math.min(doneCount + 1, 4);

  const handlePhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], // on older expo-image-picker use ImagePicker.MediaTypeOptions.Images
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]) setPhotoSrc(res.assets[0].uri);
  };

  const updateList = (list: string[], idx: number, val: string) => {
    const next = [...list];
    next[idx] = val;
    return next;
  };
  const removeFromList = (list: string[], idx: number) => list.filter((_, i) => i !== idx);

  const toggleTag = (set: Set<string>, id: string): Set<string> => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  };

  if (published) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
        <View style={styles.successCircle}>
          <Text style={{ fontSize: 36 }}>🎉</Text>
        </View>
        <Text style={{ fontFamily: fonts.heading, fontSize: 24, color: colors.ink, marginBottom: 8 }}>Recipe shared!</Text>
        <Text style={{ fontSize: 14, fontWeight: "500", color: colors.muted, lineHeight: 22, textAlign: "center", marginBottom: 24 }}>
          <Text style={{ fontWeight: "700", color: colors.ink }}>{recipeName || "Your recipe"}</Text> is now live on the community table.
        </Text>
        <Pressable
          onPress={() => {
            setPublished(false);
            setRecipeName(""); setDescription(""); setPhotoSrc(null);
            setIngredients(["", ""]); setSteps(["", ""]);
            setDietary(new Set()); setCuisines(new Set());
            setDifficulty("Easy");
          }}
          style={({ pressed }) => [styles.primaryBtn, pressed && { transform: [{ scale: 0.95 }] }]}
        >
          <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>Create another recipe</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 128 }}
      >
        {/* HEADER */}
        <View style={{ paddingTop: 16, paddingBottom: 16, paddingHorizontal: 16 }}>
          <Text style={styles.eyebrow}>Share the table</Text>
          <Text style={styles.h1}>Create a recipe</Text>
          <Text style={styles.subtitle}>Turn something you love to cook into the next community favorite.</Text>
        </View>

        <ProgressBar pct={pct} step={currentStep} total={4} />

        <View style={{ paddingHorizontal: 16 }}>
          {/* PHOTO UPLOAD */}
          <View style={{ marginBottom: 20 }}>
            <SectionLabel>Recipe photo</SectionLabel>
            <Pressable
              onPress={handlePhoto}
              style={({ pressed }) => [
                styles.photoBtn,
                { height: photoSrc ? 200 : 160 },
                pressed && { opacity: 0.95 },
              ]}
            >
              {photoSrc ? (
                <Image source={{ uri: photoSrc }} style={styles.fill} resizeMode="cover" />
              ) : (
                <>
                  <View style={StyleSheet.absoluteFill}>
                    <UploadPlaceholder />
                  </View>
                  <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center", gap: 8 }]}>
                    <View style={styles.plusCircle}>
                      <Text style={{ color: "#fff", fontSize: 20 }}>+</Text>
                    </View>
                    <View style={styles.photoLabel}>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: colors.terracotta }}>Add a recipe photo</Text>
                    </View>
                  </View>
                </>
              )}
            </Pressable>
          </View>

          {/* NAME & DESC */}
          <StyledInput label="Recipe name" value={recipeName} onChange={setRecipeName} placeholder="e.g. Golden Garlic Pasta" />
          <StyledInput
            label="Description"
            value={description}
            onChange={setDescription}
            placeholder="What makes this dish special? Any tips?"
            multiline
            rows={3}
          />

          {/* DIFFICULTY */}
          <View style={{ marginBottom: 20 }}>
            <Text style={[styles.label, { marginBottom: 8 }]}>Difficulty</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {DIFFICULTIES.map((d) => {
                const active = difficulty === d;
                const col = DIFF_COLOR[d];
                return (
                  <Pressable
                    key={d}
                    onPress={() => setDifficulty(d)}
                    style={({ pressed }) => [
                      styles.diffBtn,
                      active
                        ? { backgroundColor: col.bg, borderColor: "transparent" }
                        : { backgroundColor: "#fff", borderColor: colors.border },
                      pressed && { transform: [{ scale: 0.95 }] },
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={{ fontSize: 10, fontWeight: "800", color: active ? col.text : colors.faint }}
                    >
                      {d}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {/* Visual range rail */}
            <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={{ fontSize: 9, fontWeight: "500", color: colors.faint }}>Simple</Text>
              <View style={{ flex: 1, height: 4, backgroundColor: colors.divider, borderRadius: 999, overflow: "hidden" }}>
                <LinearGradient
                  colors={["#8A9E7A", "#C4855F", "#9B3A1A"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    height: "100%",
                    borderRadius: 999,
                    width: `${(DIFFICULTIES.indexOf(difficulty) / (DIFFICULTIES.length - 1)) * 100}%`,
                  }}
                />
              </View>
              <Text style={{ fontSize: 9, fontWeight: "500", color: colors.faint }}>Expert</Text>
            </View>
          </View>

          {/* INGREDIENTS */}
          <View style={{ marginBottom: 20 }}>
            <Text style={[styles.label, { marginBottom: 8 }]}>Ingredients</Text>
            {ingredients.map((val, i) => (
              <ListRow
                key={i}
                index={i}
                value={val}
                onChange={(v) => setIngredients(updateList(ingredients, i, v))}
                onRemove={() => ingredients.length > 1 && setIngredients(removeFromList(ingredients, i))}
                placeholder={`e.g. ${["2 cloves garlic", "1 cup flour", "3 tbsp olive oil", "Salt to taste"][i % 4]}`}
              />
            ))}
            <Pressable onPress={() => setIngredients([...ingredients, ""])} style={styles.addRow}>
              <View style={styles.addCircle}><Text style={{ color: colors.sage, fontSize: 12 }}>+</Text></View>
              <Text style={styles.addText}>Add ingredient</Text>
            </Pressable>
          </View>

          {/* STEPS */}
          <View style={{ marginBottom: 20 }}>
            <Text style={[styles.label, { marginBottom: 8 }]}>Steps</Text>
            {steps.map((val, i) => (
              <ListRow
                key={i}
                index={i}
                value={val}
                onChange={(v) => setSteps(updateList(steps, i, v))}
                onRemove={() => steps.length > 1 && setSteps(removeFromList(steps, i))}
                placeholder={`Step ${i + 1}…`}
              />
            ))}
            <Pressable onPress={() => setSteps([...steps, ""])} style={styles.addRow}>
              <View style={styles.addCircle}><Text style={{ color: colors.sage, fontSize: 12 }}>+</Text></View>
              <Text style={styles.addText}>Add step</Text>
            </Pressable>
          </View>

          {/* DIETARY */}
          <View style={{ marginBottom: 20 }}>
            <Text style={[styles.label, { marginBottom: 8 }]}>Dietary</Text>
            <TagChips tags={DIETARY_TAGS} selected={dietary} onToggle={(id) => setDietary(toggleTag(dietary, id))} />
          </View>

          {/* CUISINE */}
          <View style={{ marginBottom: 24 }}>
            <Text style={[styles.label, { marginBottom: 8 }]}>Cuisine</Text>
            <TagChips tags={CUISINE_TAGS} selected={cuisines} onToggle={(id) => setCuisines(toggleTag(cuisines, id))} />
          </View>

          {/* LIVE PREVIEW */}
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <SectionLabel>Feed preview</SectionLabel>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.clay, marginBottom: 8 }} />
            </View>
            <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
              <View style={{ width: 160 }}>
                <PreviewCard name={recipeName} difficulty={difficulty} photoSrc={photoSrc} />
              </View>
              <View style={{ flex: 1, paddingTop: 4 }}>
                <Text style={{ fontSize: 10, fontWeight: "500", color: colors.muted, lineHeight: 16 }}>
                  This is how your recipe will appear in the Explore feed and your profile.
                </Text>
                {pct === 100 ? (
                  <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Text style={{ fontSize: 12 }}>✅</Text>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: colors.sage }}>Ready to publish!</Text>
                  </View>
                ) : (
                  <View style={{ marginTop: 8, gap: 4 }}>
                    {!doneFlags[0] && <Todo text="Add a photo" />}
                    {!doneFlags[1] && <Todo text="Name your recipe" />}
                    {!doneFlags[2] && <Todo text="Add ingredients" />}
                    {!doneFlags[3] && <Todo text="Add steps" />}
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* PUBLISH BUTTON — pinned */}
      <LinearGradient
        colors={["rgba(247,247,244,0)", "rgba(247,247,244,0.95)", colors.bg]}
        locations={[0, 0.4, 1]}
        pointerEvents="box-none"
        style={styles.publishWrap}
      >
        <Pressable
          onPress={() => recipeName.trim() && setPublished(true)}
          style={({ pressed }) => [
            styles.publishBtn,
            recipeName.trim()
              ? { backgroundColor: colors.sage, shadowColor: colors.sage, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 }
              : { backgroundColor: "#C8D4C0" },
            pressed && { transform: [{ scale: 0.98 }] },
          ]}
        >
          <Text style={{ color: "#fff", fontSize: 14, fontWeight: "800" }}>
            {pct === 100 ? "🎉 Publish recipe" : recipeName.trim() ? "Publish recipe →" : "Add a name to publish"}
          </Text>
        </Pressable>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

function Todo({ text }: { text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.cream, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 8, color: colors.faint }}>○</Text>
      </View>
      <Text style={{ fontSize: 10, fontWeight: "500", color: colors.faint }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { width: "100%", height: "100%" },
  eyebrow: { fontSize: 10, fontWeight: "800", color: colors.sage, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 },
  h1: { fontFamily: fonts.heading, fontSize: 30, color: colors.ink, lineHeight: 36 },
  subtitle: { fontSize: 14, fontWeight: "500", color: colors.muted, marginTop: 4, lineHeight: 21 },
  sectionLabel: { fontSize: 10, fontWeight: "800", color: colors.muted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 },
  label: { fontSize: 12, fontWeight: "700", color: colors.ink, marginBottom: 6 },

  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, fontWeight: "500", color: colors.ink },
  inputFocused: { borderColor: colors.sage, shadowColor: colors.sage, shadowOpacity: 0.2, shadowRadius: 3, shadowOffset: { width: 0, height: 0 } },

  indexBubble: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.sageLight, alignItems: "center", justifyContent: "center" },
  indexText: { fontSize: 9, fontWeight: "800", color: colors.sage },
  removeBtn: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },

  photoBtn: { width: "100%", borderRadius: 16, borderWidth: 2, borderStyle: "dashed", borderColor: colors.clay, overflow: "hidden" },
  plusCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(217,162,139,0.8)", alignItems: "center", justifyContent: "center" },
  photoLabel: { backgroundColor: "rgba(255,255,255,0.8)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },

  diffBtn: { flex: 1, paddingVertical: 8, paddingHorizontal: 2, borderRadius: 12, borderWidth: 1, alignItems: "center" },

  addRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  addCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: colors.sage, alignItems: "center", justifyContent: "center" },
  addText: { fontSize: 12, fontWeight: "700", color: colors.sage },

  tagChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff" },

  previewCard: { borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff", width: "100%" },

  successCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.sageLight, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  primaryBtn: { backgroundColor: colors.sage, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16 },

  publishWrap: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 12 },
  publishBtn: { width: "100%", paddingVertical: 16, borderRadius: 16, alignItems: "center" },
});