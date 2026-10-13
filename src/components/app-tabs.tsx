import { NativeTabs } from "expo-router/unstable-native-tabs";

import { colors } from "@/app/(tabs)/theme";

export default function AppTabs() {
	return (
		<NativeTabs
			backgroundColor={colors.card}
			indicatorColor={colors.sageLight}
			tintColor={colors.sage}
			iconColor={{
				default: colors.faint,
				selected: colors.sage,
			}}
			labelStyle={{
				default: { color: colors.muted, fontWeight: "600" },
				selected: { color: colors.sage, fontWeight: "800" },
			}}
		>
			<NativeTabs.Trigger name="home">
				<NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon
					sf={{ default: "house", selected: "house.fill" }}
					md="home"
				/>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="explore">
				<NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon
					sf={{ default: "safari", selected: "safari.fill" }}
					md="explore"
				/>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="create">
				<NativeTabs.Trigger.Label>Create</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon
					sf={{ default: "plus.circle", selected: "plus.circle.fill" }}
					md="add_circle"
				/>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="social">
				<NativeTabs.Trigger.Label>Social</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon
					sf={{ default: "person.2", selected: "person.2.fill" }}
					md="group"
				/>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="profile">
				<NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon
					sf={{ default: "person.crop.circle", selected: "person.crop.circle.fill" }}
					md="account_circle"
				/>
			</NativeTabs.Trigger>
		</NativeTabs>
	);
}
