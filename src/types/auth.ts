export interface Profile {
	id : string;
	username : string;
	email : string;
	date_joined : Date | string | null;
	pfp_url? : string | null;
	cuisine_preferences?: number[] | null;
	experience_level?: number | null;
	experienceLevel?: number | null;
	dietary_restrictions?: number[] | null;
	dietaryRestrictions?: number[] | null;
	streakCount?: number | null;
	last_streak_post?: Date | string | null;
	streakcount?: number | null;
	last_post_at?: Date | string | null;
}

export type SearchUserResult = Pick<Profile, "id" | "username" | "pfp_url">;

export interface AuthResult {
	profile : Profile | null;
	error : string | null;
}
