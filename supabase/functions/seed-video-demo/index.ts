import { createClient } from "npm:@supabase/supabase-js@2.57.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const rawSecretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
if (!SUPABASE_URL) throw new Error("SUPABASE_URL is required");
if (!rawSecretKeys) throw new Error("SUPABASE_SECRET_KEYS is required");

const secretKeys = JSON.parse(rawSecretKeys) as Record<string, string>;
const SECRET_KEY_NAME = "default";
const ADMIN_KEY = secretKeys[SECRET_KEY_NAME];
if (!ADMIN_KEY) throw new Error(`Secret API key '${SECRET_KEY_NAME}' is not available`);

const admin = createClient(SUPABASE_URL, ADMIN_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const allowedOrigins = new Set([
  "http://localhost:8081",
  "http://localhost:19006",
  "http://localhost:19000",
  "https://supabase.com",
  "https://app.supabase.com",
  ...(Deno.env.get("DEMO_ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
]);
function response(body: unknown, status = 200, origin: string | null = null) {
  const headers = new Headers({ "Content-Type": "application/json", "Cache-Control": "no-store" });
  if (origin && allowedOrigins.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }
  headers.set("Access-Control-Allow-Headers", "authorization, apikey, content-type, x-client-info");
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  return new Response(JSON.stringify(body), { status, headers });
}

const people = [
  { name: "Mia Chen", handle: "miaspoon" },
  { name: "Jordan Rivera", handle: "jordancooks" },
  { name: "Priya Shah", handle: "spicewithpriya" },
  { name: "Theo Martin", handle: "theoonthetable" },
  { name: "Aisha Brooks", handle: "aishabites" },
  { name: "Luca Moretti", handle: "lucasupperclub" },
  { name: "Samira Khan", handle: "samirastirs" },
  { name: "Noah Kim", handle: "noahnoodles" },
  { name: "Elena Rossi", handle: "elenaeats" },
  { name: "Marcus Lee", handle: "marcuscooks" },
  { name: "Zoe Bennett", handle: "zoeskillet" },
  { name: "Diego Alvarez", handle: "diegodishes" },
];

const meals = [
  { title: "Crispy Chickpea & Avocado Bowl", cuisine: "Mediterranean", tags: ["Vegan", "Gluten-Free"], description: "Crunchy chickpeas, ripe avocado, herbs, and a bright lemon-tahini drizzle.", ingredients: ["chickpeas", "avocado", "cucumber", "lemon", "tahini", "parsley"], steps: ["Roast seasoned chickpeas until crisp.", "Toss cucumber and greens with lemon.", "Add avocado, chickpeas, and tahini."], minutes: 30 },
  { title: "Weeknight Tomato Basil Pasta", cuisine: "Italian", tags: ["Vegetarian"], description: "A simple tomato sauce with garlic, fresh basil, and parmesan.", ingredients: ["pasta", "tomatoes", "garlic", "basil", "olive oil", "parmesan"], steps: ["Boil pasta until just tender.", "Simmer tomatoes, garlic, and olive oil.", "Toss together and finish with basil."], minutes: 25 },
  { title: "Gochujang Sesame Salmon", cuisine: "Korean", tags: ["Gluten-Free"], description: "Sweet-spicy glazed salmon with rice and quick-pickled cucumber.", ingredients: ["salmon", "gochujang", "honey", "sesame", "rice", "cucumber"], steps: ["Whisk gochujang, honey, and sesame.", "Brush salmon and roast until flaky.", "Serve over rice with cucumber."], minutes: 35 },
  { title: "Roasted Vegetable Tacos", cuisine: "Mexican", tags: ["Vegetarian", "Gluten-Free"], description: "Charred peppers and sweet potato with lime crema and crunchy slaw.", ingredients: ["sweet potato", "bell pepper", "corn tortillas", "lime", "cabbage", "yogurt"], steps: ["Roast vegetables with cumin.", "Mix lime juice into yogurt.", "Fill warm tortillas and top with slaw."], minutes: 40 },
  { title: "Lemony Orzo with Spinach", cuisine: "Greek", tags: ["Vegetarian"], description: "Creamy orzo, wilted spinach, feta, and a generous squeeze of lemon.", ingredients: ["orzo", "spinach", "feta", "lemon", "vegetable stock", "dill"], steps: ["Toast orzo briefly in olive oil.", "Add stock and simmer until tender.", "Fold in spinach, feta, dill, and lemon."], minutes: 28 },
  { title: "Miso Mushroom Rice Bowl", cuisine: "Japanese", tags: ["Vegan", "Gluten-Free"], description: "Savory mushrooms over rice with scallions and gingery miso dressing.", ingredients: ["mushrooms", "rice", "miso", "ginger", "scallions", "tamari"], steps: ["Cook rice until fluffy.", "Sear mushrooms until browned.", "Stir together miso dressing and serve."], minutes: 32 },
  { title: "Green Goddess Crunch Salad", cuisine: "American", tags: ["Vegetarian", "Gluten-Free"], description: "A crisp, herby salad with peas, cucumber, avocado, and creamy green dressing.", ingredients: ["romaine", "peas", "cucumber", "avocado", "yogurt", "fresh herbs"], steps: ["Blend yogurt and herbs into dressing.", "Chop vegetables into bite-size pieces.", "Toss well and top with avocado."], minutes: 20 },
  { title: "Coconut Chickpea Curry", cuisine: "Indian", tags: ["Vegan", "Gluten-Free"], description: "A cozy coconut curry with chickpeas, tomato, spinach, and warm spices.", ingredients: ["chickpeas", "coconut milk", "tomatoes", "spinach", "ginger", "curry spices"], steps: ["Cook ginger and spices until fragrant.", "Add tomatoes, chickpeas, and coconut milk.", "Simmer, fold in spinach, and serve."], minutes: 35 },
  { title: "Sesame Soba Noodle Salad", cuisine: "Japanese", tags: ["Vegan"], description: "Chilled soba noodles with edamame, vegetables, and sesame dressing.", ingredients: ["soba noodles", "edamame", "carrot", "cabbage", "sesame", "rice vinegar"], steps: ["Cook and rinse soba noodles.", "Whisk sesame, vinegar, and soy dressing.", "Toss with vegetables and edamame."], minutes: 22 },
  { title: "Roasted Tomato & White Bean Toast", cuisine: "Italian", tags: ["Vegetarian", "Dairy-Free"], description: "Creamy white beans and blistered tomatoes on toasted sourdough.", ingredients: ["white beans", "cherry tomatoes", "sourdough", "garlic", "basil", "olive oil"], steps: ["Roast tomatoes with garlic and olive oil.", "Mash beans with lemon and herbs.", "Pile onto toast and finish with tomatoes."], minutes: 30 },
  { title: "Mango Lime Breakfast Oats", cuisine: "American", tags: ["Vegan", "Gluten-Free", "Dairy-Free"], description: "Overnight oats topped with mango, lime zest, and toasted coconut.", ingredients: ["rolled oats", "oat milk", "mango", "lime", "chia seeds", "coconut"], steps: ["Stir oats, milk, and chia together.", "Chill overnight.", "Top with mango, lime, and coconut."], minutes: 10 },
  { title: "Garlic Lemon Roast Chicken", cuisine: "French", tags: ["Gluten-Free", "Dairy-Free"], description: "Golden roast chicken with lemon, garlic, rosemary, and pan juices.", ingredients: ["chicken", "lemon", "garlic", "rosemary", "potatoes", "olive oil"], steps: ["Season chicken with lemon, garlic, and herbs.", "Roast until golden and cooked through.", "Rest before serving with potatoes."], minutes: 65 },
];

const photoIds = [
  "photo-1546069901-ba9599a7e63c",
  "photo-1565299624946-b28f40a0ae38",
  "photo-1473093295043-cdd812d0e601",
  "photo-1504674900247-0877df9cc836",
  "photo-1512621776951-a57141f2eefd",
  "photo-1490645935967-10de6ba17061",
  "photo-1540189549336-e6e99c3679fe",
  "photo-1525351484163-7529414344d8",
];
const reviewTexts = [
  "Made this for dinner and it disappeared fast. Adding it to my regular rotation.",
  "The seasoning is spot on. I added extra lemon and loved it.",
  "Easy to follow and great for meal prep. The leftovers were even better.",
  "Really nice balance of textures. My family asked me to make it again.",
  "A new favorite! I swapped one ingredient and it still worked beautifully.",
  "This came together quickly and tasted restaurant-level.",
];
const dietaryPlans = [
  ["Vegetarian"], ["Gluten-Free"], ["Dairy-Free"], ["Vegan"],
  ["Vegetarian"], ["Gluten-Free"], ["Dairy-Free"], ["Vegetarian"],
  ["Vegan"], ["Gluten-Free"], ["Vegetarian"], ["Dairy-Free"],
];
const DAY = 86_400_000;
const rand = (max) => Math.floor(Math.random() * max);
const daysAgo = (maxDays) => new Date(Date.now() - rand(maxDays + 1) * DAY);
const dateOnly = (date) => date.toISOString().slice(0, 10);
const normalized = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
function unwrap(label: string, result: { data: any; error: any }) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}
function avatarSvg(name: string, i: number) {
  const initials = name.split(" ").map((part) => part[0]).join("");
  const colors = ["#d8e9df", "#f5dfc8", "#e2d8f2", "#f3d9dc", "#d7e7f2", "#e9e5c8"];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320"><rect width="320" height="320" rx="160" fill="${colors[i % colors.length]}"/><circle cx="160" cy="126" r="58" fill="#fff" fill-opacity=".72"/><path d="M52 292c12-66 52-100 108-100s96 34 108 100" fill="#fff" fill-opacity=".72"/><text x="160" y="305" text-anchor="middle" font-family="sans-serif" font-size="30" font-weight="700" fill="#334155">${initials}</text></svg>`;
}
async function upload(bucket: string, path: string, bytes: Uint8Array, contentType: string) {
  const blob = new Blob([bytes], { type: contentType });
  unwrap(`Upload ${bucket}/${path}`, await admin.storage.from(bucket).upload(path, blob, {
    contentType, cacheControl: "3600", upsert: true,
  }));
}
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>) {
  const output: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      output[index] = await fn(items[index], index);
    }
  });
  await Promise.all(workers);
  return output;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return response({ ok: true }, 200, origin);
  if (req.method !== "POST") return response({ error: "POST required" }, 405, origin);

  // The platform's default JWT verification remains enabled. Validate the
  // signed-in caller as well, without requiring the client to hold a secret key.
  const authorization = req.headers.get("authorization") ?? "";
  const accessToken = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!accessToken) {
    console.error("seed-video-demo auth failure: NO_BEARER");
    return response({ error: "Authorization required" }, 401, origin);
  }
  const { data: caller, error: callerError } = await admin.auth.getUser(accessToken);
  if (callerError || !caller.user) {
    console.error("seed-video-demo auth failure: INVALID_USER_TOKEN");
    return response({ error: "Invalid or expired sign-in session." }, 401, origin);
  }
  const allowedAdminIds = new Set(
    (Deno.env.get("DEMO_SEED_ADMIN_IDS") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
  if (!caller.user || !allowedAdminIds.has(caller.user.id)) {
    console.error("seed-video-demo auth failure: USER_NOT_ALLOWED");
    return response({ error: "This signed-in user is not allowed to seed demo data." }, 403, origin);
  }

  let body: { confirm?: string };
  try {
    body = await req.json();
  } catch {
    return response({ error: "JSON body required" }, 400, origin);
  }
  if (body.confirm !== "seed-video-demo") {
    return response({ error: "Set confirm to seed-video-demo to run this one-time seed." }, 400, origin);
  }

  const accounts: Array<{ name: string; username: string; email: string; password: string; id: string }> = [];
  try {
    // One-run guard. Seed usernames/emails are stable so a retry cannot silently duplicate the batch.
    const existingSeed = unwrap("Check one-run guard", await admin.from("profiles")
      .select("id").like("username", "vidseedx%").limit(1));
    if (existingSeed?.length) return response({ error: "This demo seed has already started. Refusing to duplicate it." }, 409, origin);

    const buckets = [
      ["pfps", true],
      ["post-images", false],
      ["cooked_posts-images", true],
    ] as const;
    for (const [name, expectedPublic] of buckets) {
      const bucket = unwrap(`Check bucket ${name}`, await admin.storage.getBucket(name));
      if (bucket.public !== expectedPublic) throw new Error(`Bucket ${name} has unexpected visibility; no bucket settings were changed.`);
    }

    const cuisines = unwrap("Read cuisines", await admin.from("cuisines").select("id,name"));
    const restrictions = unwrap("Read dietary restrictions", await admin.from("dietary_restrictions").select("id,name"));
    if (!cuisines?.length || !restrictions?.length) throw new Error("Cuisine or dietary restriction lookup data is empty.");

    const photoBytes = await Promise.all(photoIds.map(async (id) => {
      const photo = await fetch(`https://images.unsplash.com/${id}?fit=crop&w=1200&q=82`);
      if (!photo.ok) throw new Error(`Could not download a demo food photo (${photo.status}).`);
      return new Uint8Array(await photo.arrayBuffer());
    }));

    // Upload one private post photo per recipe and generate URLs for the 30-day video window.
    const postImageUrls: string[] = [];
    for (let i = 0; i < meals.length; i++) {
      const path = `video-demo/recipe-${i + 1}.jpg`;
      const bytes = photoBytes[i % photoBytes.length];
      await upload("post-images", path, bytes, "image/jpeg");
      const signed = unwrap(`Sign post image ${i + 1}`, await admin.storage.from("post-images").createSignedUrl(path, 30 * 24 * 60 * 60));
      postImageUrls.push(signed.signedUrl);
    }

    const profiles: any[] = [];
    for (let i = 0; i < people.length; i++) {
      const person = people[i];
      const username = `vidseedx_${person.handle}`;
      const email = `vidseedx-${person.handle}@example.com`;
      const password = `Demo!${crypto.randomUUID().replaceAll("-", "")}9`;
      const created = unwrap(`Create Auth user ${email}`, await admin.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { full_name: person.name, demo_account: true, demo_seed: "video" },
      }));
      accounts.push({ name: person.name, username, email, password, id: created.user.id });

      const avatarPath = `video-demo/${person.handle}.svg`;
      await upload("pfps", avatarPath, new TextEncoder().encode(avatarSvg(person.name, i)), "image/svg+xml");
      const avatarUrl = admin.storage.from("pfps").getPublicUrl(avatarPath).data.publicUrl;
      profiles.push({
        id: created.user.id, username, email,
        date_joined: dateOnly(daysAgo(90)), pfp_url: avatarUrl,
        streakCount: 2 + rand(19), last_streak_post: daysAgo(3).toISOString(),
        experience_level: 2 + rand(8), xp_points: 0,
      });
    }
    unwrap("Insert profiles", await admin.from("profiles").upsert(profiles, { onConflict: "id" }));

    const edgeMap = new Map<string, any>();
    for (let i = 0; i < profiles.length; i++) {
      for (const offset of [1, 3]) {
        const j = (i + offset) % profiles.length;
        const a = Math.min(i, j), b = Math.max(i, j);
        edgeMap.set(`${a}-${b}`, {
          sender_id: profiles[a].id, receiver_id: profiles[b].id,
          status: "accepted", created_at: daysAgo(40).toISOString(), updated_at: new Date().toISOString(),
        });
      }
    }
    unwrap("Insert friendships", await admin.from("friendships").insert([...edgeMap.values()]));

    const posts: any[] = [];
    for (let i = 0; i < profiles.length; i++) {
      for (let j = 0; j < 3; j++) {
        const mealIndex = (i * 3 + j) % meals.length;
        const meal = meals[mealIndex];
        posts.push({
          id: crypto.randomUUID(), profile_id: profiles[i].id,
          date_created: dateOnly(daysAgo(55)), difficulty: 2 + rand(8),
          image_url: postImageUrls[mealIndex], title: meal.title, description: meal.description,
          authorUsername: profiles[i].username,
          recipe: {
            servings: 2 + rand(3), prep_time_minutes: Math.max(5, Math.floor(meal.minutes / 3)),
            cook_time_minutes: meal.minutes, ingredients: meal.ingredients, instructions: meal.steps,
          },
          views: 180 + rand(4200), likes: 5, time: meal.minutes,
          _ownerIndex: i, _mealIndex: mealIndex,
        });
      }
    }
    unwrap("Insert posts", await admin.from("posts").insert(posts.map(({ _ownerIndex, _mealIndex, ...row }) => row)));

    const findId = (rows: any[], label: string) =>
      rows.find((row) => normalized(row.name).includes(normalized(label)))?.id ?? rows[0].id;
    const cuisineLinks = posts.map((post) => ({
      post_id: post.id, cuisine_id: findId(cuisines, meals[post._mealIndex].cuisine),
    }));
    unwrap("Link cuisines", await admin.from("post_cuisines").insert(cuisineLinks));

    const restrictionId = (tag: string) =>
      restrictions.find((row: any) => normalized(row.name).includes(normalized(tag)))?.id;
    const postRestrictionLinks: any[] = [];
    for (const post of posts) {
      for (const tag of meals[post._mealIndex].tags) {
        const id = restrictionId(tag);
        if (id) postRestrictionLinks.push({ post_id: post.id, restriction_id: id });
      }
    }
    if (postRestrictionLinks.length) unwrap("Link post restrictions", await admin.from("post_restrictions").insert(postRestrictionLinks));

    const profileRestrictionLinks: any[] = [];
    profiles.forEach((profile, i) => {
      for (const tag of dietaryPlans[i]) {
        const id = restrictionId(tag);
        if (id) profileRestrictionLinks.push({ profile_id: profile.id, restriction_id: id });
      }
    });
    if (profileRestrictionLinks.length) unwrap("Link profile restrictions", await admin.from("profile_restrictions").insert(profileRestrictionLinks));

    const reviewRows: any[] = [];
    const likeRows: any[] = [];
    for (const post of posts) {
      for (let j = 1; j <= 3; j++) {
        const reviewer = profiles[(post._ownerIndex + j * 2) % profiles.length];
        reviewRows.push({
          post_id: post.id, profile_id: reviewer.id, rating: j === 2 ? 4 : 5,
          description: reviewTexts[(post._ownerIndex + j) % reviewTexts.length],
          created_at: new Date(Math.max(Date.now() - rand(35) * DAY, new Date(post.date_created).getTime())).toISOString(),
        });
      }
      for (let j = 1; j <= 5; j++) {
        likeRows.push({ post_id: post.id, user_id: profiles[(post._ownerIndex + j) % profiles.length].id, liked_at: daysAgo(25).toISOString() });
      }
    }
    unwrap("Insert post reviews", await admin.from("post_reviews").insert(reviewRows));
    unwrap("Insert likes", await admin.from("liked_posts").insert(likeRows));
    await mapLimit(posts, 8, async (post) => unwrap(
      "Set like count", await admin.from("posts").update({ likes: 5 }).eq("id", post.id),
    ));

    const cookedRows: any[] = [];
    for (let i = 0; i < profiles.length; i++) {
      for (const offset of [1, 3]) {
        const targetOwner = (i + offset) % profiles.length;
        const post = posts.find((candidate) => candidate._ownerIndex === targetOwner);
        const mealIndex = post._mealIndex;
        const path = `video-demo/${profiles[i].username}-${cookedRows.length}.jpg`;
        cookedRows.push({
          profile_id: profiles[i].id, post_id: post.id, path, mealIndex,
          created_at: new Date(Math.max(Date.now() - rand(25) * DAY, new Date(post.date_created).getTime())).toISOString(),
        });
      }
    }
    await mapLimit(cookedRows, 6, async (row) => upload(
      "cooked_posts-images", row.path, photoBytes[row.mealIndex % photoBytes.length], "image/jpeg",
    ));
    const cookedInsertRows = cookedRows.map((row) => ({
      profile_id: row.profile_id, post_id: row.post_id,
      image_url: admin.storage.from("cooked_posts-images").getPublicUrl(row.path).data.publicUrl,
      created_at: row.created_at,
    }));
    const cooked = unwrap("Insert cooked posts", await admin.from("cooked_posts").insert(cookedInsertRows).select("id,profile_id,post_id"));

    const cookedIds = cooked.map((row: any) => row.id);
    const existingAwards = unwrap("Check XP awards", await admin.from("cooked_post_xp_awards")
      .select("cooked_post_id").in("cooked_post_id", cookedIds));
    const awarded = new Set(existingAwards.map((row: any) => row.cooked_post_id));
    const missingAwards = cooked.filter((row: any) => !awarded.has(row.id)).map((row: any) => ({
      cooked_post_id: row.id, profile_id: row.profile_id, post_id: row.post_id, xp_awarded: 25,
    }));
    if (missingAwards.length) unwrap("Insert XP awards", await admin.from("cooked_post_xp_awards").insert(missingAwards));

    await mapLimit(profiles, 6, async (profile) => unwrap(
      "Set profile XP", await admin.from("profiles").update({ xp_points: 250 + rand(900) }).eq("id", profile.id),
    ));

    return response({
      ok: true,
      totals: {
        accounts: accounts.length, friendships: edgeMap.size, posts: posts.length,
        reviews: reviewRows.length, likes: likeRows.length, cookedPosts: cooked.length,
        postCuisineLinks: cuisineLinks.length,
        postRestrictionLinks: postRestrictionLinks.length,
        profileRestrictionLinks: profileRestrictionLinks.length,
      },
      accounts: accounts.map(({ name, username, email }) => ({ name, username, email })),
      note: "Post-image signed URLs expire in 30 days. The one-run guard prevents seeding this batch twice.",
    }, 200, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown seed error";
    return response({
      ok: false, error: message,
      accountsCreated: accounts.map(({ name, username, email }) => ({ name, username, email })),
      note: "The function is not transactional; inspect the partial batch before retrying.",
    }, 500, origin);
  }
});