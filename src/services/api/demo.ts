import { supabase } from "../../lib/supabase";
import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from "@supabase/supabase-js";

const isDevelopment = process.env.NODE_ENV !== "production";

async function getFunctionErrorDetails(error: FunctionsHttpError): Promise<{
  status: number;
  code: string | null;
  body: Record<string, unknown> | string | null;
}> {
  const response = error.context;
  const code = response.headers.get("sb-error-code");

  try {
    const body = await response.clone().json();
    return {
      status: response.status,
      code,
      body: body && typeof body === "object" ? body as Record<string, unknown> : String(body),
    };
  } catch {
    try {
      return { status: response.status, code, body: await response.clone().text() };
    } catch {
      return { status: response.status, code, body: null };
    }
  }
}

function getSafeBodyMessage(body: Record<string, unknown> | string | null): string | null {
  if (typeof body === "string") return body.trim() || null;
  if (!body) return null;
  const message = body.error ?? body.message;
  return typeof message === "string" && message.trim() ? message : null;
}

export async function seedVideoDemo(): Promise<void> {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error(`Unable to verify your session: ${sessionError.message}`);
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      throw new Error("Please sign in again before adding sample users.");
    }

    const { error } = await supabase.functions.invoke("seed-video-demo", {
      body: { confirm: "seed-video-demo" },
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!error) return;

    if (error instanceof FunctionsHttpError) {
      const details = await getFunctionErrorDetails(error);
      if (isDevelopment) {
        console.error("seed-video-demo HTTP error:", {
          status: details.status,
          code: details.code,
          body: details.body,
        });
      }
      const responseMessage = getSafeBodyMessage(details.body);
      if (details.status === 401) {
        throw new Error(responseMessage ?? "Your sign-in session is invalid or expired. Please sign in again.");
      }
      if (details.status === 403) {
        throw new Error(responseMessage ?? "Your account is not allowed to add sample users.");
      }
      throw new Error(
        responseMessage
          ? `Unable to add sample users (${details.status}): ${responseMessage}`
          : `Unable to add sample users (${details.status}).`,
      );
    }

    if (error instanceof FunctionsRelayError) {
      if (isDevelopment) console.error("seed-video-demo relay error:", error.message);
      throw new Error("The sample-data service could not process the request. Please try again.");
    }

    if (error instanceof FunctionsFetchError) {
      if (isDevelopment) console.error("seed-video-demo network error:", error.message);
      throw new Error("Could not reach the sample-data service. Check your connection and try again.");
    }

    throw new Error("The sample-data service returned an unexpected error.");
  } catch (error) {
    throw error;
  }
}
