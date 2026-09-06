import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { supabase } from "../lib/supabase";

type Instrument = {
	id: number;
	name: string;
};

type User = {
	user_id: number;
	username: string;
};

export default function App() {
	const [instruments, setInstruments] = useState<Instrument[]>([]);
	const [error, setError] = useState<string | null>(null);

	const [users, setUsers] = useState<User[]>([]);
	const [userError, setUserError] = useState<string | null>(null);
	useEffect(() => {
		getInstruments();
		getUsers();
	}, []);

	async function getInstruments() {
		const { data, error } = await supabase.from("instruments").select();

		if (error) {
			setError(error.message);
			return;
		}

		setInstruments(data ?? []);
	}

	async function getUsers() {
		const { data, error } = await supabase
			.from("users")
			.select("user_id, username");

		if (error) {
			setUserError(error.message);
			return;
		}

		setUsers(data ?? []);
	}

	if (error) {
		return (
			<View style={styles.container}>
				<Text>Error loading instruments: {error}</Text>
			</View>
		);
	}
	if (userError) {
		return (
			<View style={styles.container}>
				<Text>Error loading users: {userError}</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<ScrollView>
				<Text style={styles.heading}>
					Instruments ({instruments.length})
				</Text>
				{instruments.map((instrument) => (
					<Text key={instrument.id} style={styles.item}>
						{instrument.name}
					</Text>
				))}
				<Text style={styles.heading}>Users ({users.length})</Text>
				{users.map((user) => (
					<Text key={user.user_id} style={styles.item}>
						{user.username}
					</Text>
				))}
				{users.length === 0 && (
					<Text style={styles.empty}>No users found.</Text>
				)}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
		paddingTop: 50,
		paddingHorizontal: 16,
	},
	item: {
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#ccc",
	},
	heading: {
		paddingTop: 16,
		paddingBottom: 8,
		fontSize: 18,
		fontWeight: "600",
	},
	empty: {
		padding: 16,
		color: "#666",
	},
});
