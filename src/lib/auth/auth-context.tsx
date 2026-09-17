import {
	fetchUserProfile,
	handleSignInEmail,
	handleSignInUsername,
	handleSignUp,
} from "@/services/api";
import { Profile } from "@/types/auth";
import { createContext, useContext, useState } from "react";
interface AuthContextType {
	currentUser: Profile | null;
	loading: boolean;
	error: string | null;
	signup: (username: string, email: string, password: string) => Promise<boolean>;
	login: (email: string, password: string) => Promise<boolean>;
	loginWithUsername: (username: string, password: string) => Promise<boolean>;
	refreshCurrentUser: () => Promise<void>;
	logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
	currentUser: null,
	loading: false,
	error: null,
	signup: async () => false,
	login: async () => false,
	loginWithUsername: async () => false,
	refreshCurrentUser: async () => {},
	logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [currentUser, setCurrentUser] = useState<Profile | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function signup(username: string, email: string, password: string) {
		setLoading(true);
		setError(null);

		const { profile, error: signUpError } = await handleSignUp(
			username,
			email,
			password
		);

		setLoading(false);

		if (signUpError || !profile) {
			setError(signUpError ?? "Something went wrong. Please try again.");
			return false;
		}

		setCurrentUser(profile);
		return true;
	}

	async function login(identifier: string, password: string) {
		setLoading(true);
		setError(null);

		const normalizedIdentifier = identifier.trim();
		const { profile, error: signInError } = normalizedIdentifier.includes("@")
			? await handleSignInEmail(normalizedIdentifier, password)
			: await handleSignInUsername(normalizedIdentifier, password);

		setLoading(false);

		if (signInError) {
			setError(signInError);
			return false;
		}

		setCurrentUser(profile);
		return true;
	}

	async function loginWithUsername(username: string, password: string) {
		setLoading(true);
		setError(null);

		const { profile, error: signInError } = await handleSignInUsername(
			username,
			password
		);

		setLoading(false);

		if (signInError) {
			setError(signInError);
			return false;
		}

		setCurrentUser(profile);
		return true;
	}

	async function refreshCurrentUser() {
		if (!currentUser) return;

		const refreshedProfile = await fetchUserProfile(currentUser.id);
		if (refreshedProfile) {
			setCurrentUser(refreshedProfile);
		}
	}

	function logout() {
		setCurrentUser(null);
	}

	const value = {
		currentUser,
		loading,
		error,
		login,
		loginWithUsername,
		refreshCurrentUser,
		logout,
		signup,
	};

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
}

export function useAuthContext() {
	const context = useContext(AuthContext);

	if (!context) {
		throw new Error("useAuthContext must be used within an AuthProvider");
	}

	return context;
}