import { ProfilePage } from "@/components/profile/profile-page";
import { useLocalSearchParams } from "expo-router";

export default function OtherProfileRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProfilePage userId={id} />;
}
