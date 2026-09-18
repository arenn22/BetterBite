import { supabase } from "@/lib/supabase";
import {
    fetchUserProfile,
    handleSignInEmail,
    handleSignInUsername,
    handleSignUp,
    signOut as signOutFromSupabase,
} from "@/services/api";
import { Profile } from "@/types/auth";
import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
	currentUser: Profile | null;
	loading: boolean;
	error: string | null;
	signup: (username: string, email: string, password: string) => Promise<boolean>;
	login: (email: string, password: string) => Promise<boolean>;
	loginWithUsername: (username: string, password: string) => Promise<boolean>;
	refreshCurrentUser: () => Promise<void>;
	signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
	currentUser: null,
	loading: false,
	error: null,
	signup: async () => false,
	login: async () => false,
	loginWithUsername: async () => false,
	refreshCurrentUser: async () => {},
	signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [currentUser, setCurrentUser] = useState<Profile | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let isActive = true;

		async function restoreProfile(session: NonNullable<Awaited<ReturnType<typeof supabase.auth.getSession>>>["data"]["session"]) {
			if (!session) {
				if (isActive) {
					setCurrentUser(null);
				}
				return;
			}

			const profile = await fetchUserProfile(session.user.id);
			if (!isActive) return;

			setCurrentUser(
				profile ?? {
					id: session.user.id,
					username:
						session.user.user_metadata?.username ??
						session.user.email?.split("@")[0] ??
						"User",
					email: session.user.email ?? "",
					date_joined: session.user.created_at
						? new Date(session.user.created_at)
						: null,
					pfp_url: session.user.user_metadata?.pfp_url ?? null,
					streakCount: 0,
					last_streak_post: null,
					streakcount: 0,
					last_post_at: null,
				},
			);
		}

		async function restoreSession() {
			setLoading(true);
			const { data, error: sessionError } = await supabase.auth.getSession();

			if (sessionError) {
				if (isActive) {
					setError(sessionError.message);
					setLoading(false);
				}
				return;
			}

			await restoreProfile(data.session);
			if (isActive) {
				setLoading(false);
			}
		}

		void restoreSession();

		const { data } = supabase.auth.onAuthStateChange((event, session) => {
			if (event === "SIGNED_OUT") {
				setCurrentUser(null);
				return;
			}

			if (session) {
				void restoreProfile(session);
			}
		});

		return () => {
			isActive = false;
			data.subscription.unsubscribe();
		};
	}, []);

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
		console.log("DEBUG refreshCurrentUser", {
			userId: currentUser.id,
			refreshedProfile,
			streakCount: refreshedProfile?.streakCount ?? refreshedProfile?.streakcount ?? null,
		});
		if (refreshedProfile) {
			setCurrentUser(refreshedProfile);
		}
	}

	async function signOut() {
		await signOutFromSupabase();
		setCurrentUser(null);
	}

	const value = {
		currentUser,
		loading,
		error,
		login,
		loginWithUsername,
		refreshCurrentUser,
			signOut,
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