import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";

import { useAuthContext } from "@/lib/auth/auth-context";
import { DEFAULT_PROFILE_IMAGE, fetchUserProfile } from "@/services/api";

function formatJoinedDate(value: Date | string | null | undefined) {
	if (!value) return "Not provided";

	const date = value instanceof Date ? value : new Date(value);
	return Number.isNaN(date.getTime())
		? "Not provided"
		: date.toLocaleDateString(undefined, {
				month: "long",
				year: "numeric",
		  });
}

export default function ProfileScreen() {
	const { currentUser } = useAuthContext();
	const [profile, setProfile] = useState<Awaited<ReturnType<typeof fetchUserProfile>>>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!currentUser) {
			setProfile(null);
			return;
		}

		let isActive = true;
		setLoading(true);

		fetchUserProfile(currentUser.id)
			.then(fetchedProfile => {
				if (isActive) {
					setProfile(fetchedProfile);
				}
			})
			.finally(() => {
				if (isActive) {
					setLoading(false);
				}
			});

		return () => {
			isActive = false;
		};
	}, [currentUser]);

	const publicProfile = profile ?? currentUser;
	const profileImage = publicProfile?.pfp_url?.trim() || DEFAULT_PROFILE_IMAGE;

	return (
		<ScrollView
			contentContainerStyle={styles.container}
			showsVerticalScrollIndicator={false}
		>
			<View style={styles.heading}>
				<Text style={styles.eyebrow}>YOUR ACCOUNT</Text>
				<Text style={styles.title}>Profile</Text>
				<Text style={styles.subtitle}>A little about you in the BetterBite community.</Text>
			</View>
			{loading ? (
				<ActivityIndicator color="#203429" style={styles.loading} />
			) : publicProfile ? (
				<View style={styles.profileContent}>
					<View style={styles.profileHeader}>
						<Image
							accessibilityLabel={`${publicProfile.username}'s profile picture`}
							source={{ uri: profileImage }}
							style={styles.avatar}
						/>
						<View style={styles.identity}>
							<Text style={styles.displayName}>{publicProfile.username}</Text>
							<Text style={styles.handle}>@{publicProfile.username}</Text>
						</View>
					</View>

					<View style={styles.details}>
						<View style={styles.row}>
							<Text style={styles.label}>USERNAME</Text>
							<Text style={styles.value}>{publicProfile.username}</Text>
						</View>
						<View style={styles.row}>
							<Text style={styles.label}>MEMBER SINCE</Text>
							<Text style={styles.value}>
								{formatJoinedDate(publicProfile.date_joined)}
							</Text>
						</View>
					</View>
				</View>
			) : (
				<Text style={styles.message}>
					{currentUser ? "No profile data found." : "Sign in to view your profile."}
				</Text>
			)}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flexGrow: 1,
		padding: 24,
		backgroundColor: "#FFF8F3",
	},
	heading: { marginBottom: 26 },
	eyebrow: {
		color: "#B45E42",
		fontSize: 11,
		fontWeight: "800",
		letterSpacing: 1.5,
	},
	title: { color: "#203429", fontSize: 34, fontWeight: "800", marginTop: 6 },
	subtitle: { color: "#738078", fontSize: 15, lineHeight: 22, marginTop: 8 },
	loading: { marginTop: 24 },
	profileContent: {
		backgroundColor: "#FFFFFF",
		borderRadius: 20,
		padding: 20,
		shadowColor: "#18352A",
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.08,
		shadowRadius: 14,
		elevation: 3,
	},
	profileHeader: { alignItems: "center", paddingVertical: 8 },
	avatar: {
		width: 112,
		height: 112,
		borderRadius: 56,
		backgroundColor: "#F5DFD2",
		borderColor: "#FFF0E8",
		borderWidth: 5,
	},
	identity: { alignItems: "center", marginTop: 14 },
	displayName: { color: "#203429", fontSize: 24, fontWeight: "800" },
	handle: { color: "#738078", fontSize: 14, marginTop: 4 },
	details: { marginTop: 24 },
	row: {
		borderBottomColor: "#e4e9e5",
		borderBottomWidth: 1,
		paddingVertical: 16,
	},
	label: { color: "#738078", fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
	value: { color: "#203429", fontSize: 16, marginTop: 7 },
	message: { color: "#738078", fontSize: 15, marginTop: 16 },
});