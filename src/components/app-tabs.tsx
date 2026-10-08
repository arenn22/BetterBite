import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useColorScheme } from "react-native";

import { Colors } from "@/constants/theme";

export default function AppTabs() {
	const scheme = useColorScheme();
	const colors = Colors[scheme === "unspecified" ? "light" : scheme];

	return (
		<NativeTabs
			backgroundColor={colors.background}
			indicatorColor={colors.backgroundElement}
			labelStyle={{ selected: { color: colors.text } }}
		>
			<NativeTabs.Trigger name="home">
				<NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon
					sf={{ default: "house", selected: "house.fill" }}
					md={{ default: "home", selected: "home" }}
				/>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="explore">
				<NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon
					sf="magnifyingglass"
					md="search"
				/>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="create">
				<NativeTabs.Trigger.Label>Create</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon
					sf="plus"
					md="add"
				/>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="social">
				<NativeTabs.Trigger.Label>Social</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon
					sf="person.2"
					md="group"
				/>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="profile">
				<NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon
					sf="person"
					md="person"
				/>
			</NativeTabs.Trigger>
		</NativeTabs>
	);
}
