import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { fetchFriends } from "@/services/api/social";
import { getActiveStreak } from "@/lib/streak";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/auth";

const STREAK_NOTIFICATION_TYPE = "streak-reminder";
const FRIEND_NOTIFICATION_TYPE = "friend-post";
const STREAK_REMINDER_HOUR = 20;

let friendPostChannel: ReturnType<typeof supabase.channel> | null = null;
let friendPostChannelRemoval: Promise<unknown> | null = null;
let friendPostSubscriptionId = 0;
let permissionRequest: Promise<boolean> | null = null;

function removeFriendPostChannel(channel: ReturnType<typeof supabase.channel>) {
  const removal = supabase.removeChannel(channel);
  friendPostChannelRemoval = removal;
  void removal.then(
    () => {
      if (friendPostChannelRemoval === removal) friendPostChannelRemoval = null;
    },
    () => {
      if (friendPostChannelRemoval === removal) friendPostChannelRemoval = null;
    },
  );
  return removal;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function isNative() {
  return Platform.OS === "ios" || Platform.OS === "android";
}

function getStreakCount(profile: Profile) {
  return getActiveStreak(profile.streakCount ?? profile.streakcount, profile.last_streak_post ?? profile.last_post_at);
}

async function requestPermission() {
  if (!isNative()) return false;
  if (permissionRequest) return permissionRequest;

  permissionRequest = (async () => {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "BetterBite notifications",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const current = await Notifications.getPermissionsAsync();
    if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
      return true;
    }

    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  })().finally(() => {
    permissionRequest = null;
  });

  return permissionRequest;
}

async function cancelNotifications(type: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((notification) => notification.content.data?.type === type)
      .map((notification) => Notifications.cancelScheduledNotificationAsync(notification.identifier)),
  );
}

export async function syncStreakReminder(profile: Profile | null) {
  if (!isNative()) return;

  await cancelNotifications(STREAK_NOTIFICATION_TYPE);
  if (!profile || profile.notify_streaks === false || getStreakCount(profile) <= 0) return;
  if (!(await requestPermission())) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Keep your streak going",
      body: "Share a recipe today to keep your BetterBite streak alive.",
      data: { type: STREAK_NOTIFICATION_TYPE },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: STREAK_REMINDER_HOUR,
      minute: 0,
    },
  });
}

async function notifyAboutFriendPost(username: string, title: string) {
  if (!(await requestPermission())) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${username} shared a new recipe`,
      body: title || "See what your friend cooked up on BetterBite.",
      data: { type: FRIEND_NOTIFICATION_TYPE },
    },
    trigger: null,
  });
}

function getFriendId(value: unknown): string | null {
  if (typeof value !== "object" || value === null) return null;
  const row = value as Record<string, unknown>;
  const id = row.id ?? row.friend_id ?? row.profile_id ?? row.user_id ?? row.receiver_id ?? row.sender_id;
  return typeof id === "string" ? id : id == null ? null : String(id);
}

export async function subscribeToFriendPostNotifications(
  profile: Profile | null,
) {
  if (!isNative() || !profile || profile.notify_friend_activity === false) return () => {};

  const subscriptionId = ++friendPostSubscriptionId;
  const friends = await fetchFriends();
  if (subscriptionId !== friendPostSubscriptionId) return () => {};

  const friendIds = new Set(
    friends.map(getFriendId).filter((id): id is string => id !== null && id !== profile.id),
  );
  if (!friendIds.size) return () => {};

  if (friendPostChannel) {
    const previousChannel = friendPostChannel;
    friendPostChannel = null;
    await removeFriendPostChannel(previousChannel);
  } else if (friendPostChannelRemoval) {
    await friendPostChannelRemoval;
  }
  if (subscriptionId !== friendPostSubscriptionId) return () => {};

  let active = true;
  const channel = supabase
    .channel(`friend-post-notifications:${profile.id}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "posts" },
      (payload) => {
        if (!active) return;
        const post = payload.new as Record<string, unknown>;
        const authorId = getFriendId(post);
        if (!authorId || !friendIds.has(authorId)) return;
        void notifyAboutFriendPost(
          typeof post.author_username === "string" ? post.author_username : "A friend",
          typeof post.title === "string" ? post.title : "",
        );
      },
    )
    .subscribe();
  friendPostChannel = channel;

  return () => {
    active = false;
    if (friendPostSubscriptionId === subscriptionId) {
      friendPostSubscriptionId += 1;
    }
    if (friendPostChannel === channel) {
      friendPostChannel = null;
      void removeFriendPostChannel(channel);
    }
  };
}
