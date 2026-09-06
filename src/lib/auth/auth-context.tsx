import { User } from "@/types/auth";
import { createContext, useContext, useState } from "react";

interface AuthContextType {
	currentUser: User | null;
	login: (user: User) => void;
	logout: () => void;
	signup: (user: User) => void;
}

const AuthContext = createContext<AuthContextType>({
	currentUser: null,
	login: () => {},
	logout: () => {},
	signup: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [currentUser, setCurrentUser] = useState<User | null>(null);

	function login(user: User) {
		setCurrentUser(user);
	}

	function logout() {
		setCurrentUser(null);
	}

	function signup(user: User) {
		setCurrentUser(user);
	}

	const value = {
		currentUser,
		login,
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
