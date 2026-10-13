import { Button } from "@/components/ui/button";

interface AuthButtonProps {
	title: string;
	onPress?: () => void;
	disabled?: boolean;
	loading?: boolean;
}

export default function AuthButton({
	title,
	onPress,
	disabled,
	loading,
}: AuthButtonProps) {
	return (
		<Button
			title={title}
			onPress={onPress}
			disabled={disabled}
			loading={loading}
			size="lg"
			iconRight={loading ? undefined : "forward"}
			fullWidth
			style={{ borderRadius: 26 }}
		/>
	);
}
