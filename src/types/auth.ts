export interface Profile {
	id : string;
	username : string;
	email : string;
	date_joined : Date | string | null;
}

export interface AuthResult {
	profile : Profile | null;
	error : string | null;
}
