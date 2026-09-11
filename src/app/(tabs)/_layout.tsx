import { Redirect } from "expo-router";

import AppTabs from "@/components/app-tabs";
import { useAuthContext } from "@/lib/auth/auth-context";

export default function TabsLayout() {
	const { currentUser } = useAuthContext();

	if (!currentUser) {
		return <Redirect href="/login" />;
	}

	return <AppTabs />;
}
