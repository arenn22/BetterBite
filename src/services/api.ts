import { supabase } from "../lib/supabase";

async function create_user( username: string, password: string) {
    var salt = createSalt();
    var password_hash = hashPassword(password + salt);
    await supabase.rpc("create_user", {
        p_username: username,
        p_password_hash: password_hash,
        p_salt: salt,
    });

    //still working on this its not done

}

import argon2 from "argon2";

export async function hashPassword(password: string): Promise<string> {
    return await argon2.hash(password, {
        type: argon2.argon2id,
    });
}

export function createSalt() {
    //not implemented yet
}

const handleLogin = async (username: string, password: string) => {
    // not implemented yet
};