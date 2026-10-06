import { ProfileScreenContent } from "@/app/(tabs)/profile";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";

export default function OtherProfileRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View style={styles.profileFrame}>
      <ProfileScreenContent userId={id} />
    </View>
  );
}

const styles = StyleSheet.create({
  profileFrame: {
    flex: 1,
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    backgroundColor: "#F7F7F4",
  },
});
