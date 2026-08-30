import { BACKEND_URL } from "./config";

export interface SarvamVoiceResponse {
  case_id: string;
  status: string;
  voice_mode: "REAL" | "MOCK" | "BLOCKED";
  provider: string;
  script: string;
  audio_available: boolean;
  audio_url?: string;
  audio_b64?: string;
  message?: string;
  policy_blocked?: boolean;
}

export async function triggerSarvamVoiceCall(
  caseId: string,
  customIntent?: string
): Promise<SarvamVoiceResponse> {
  const res = await fetch(`${BACKEND_URL}/cases/${caseId}/voice-call`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ custom_intent: customIntent || null }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Sarvam Voice API failed with status ${res.status}`);
  }

  return await res.json();
}
