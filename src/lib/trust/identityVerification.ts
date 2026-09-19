import type { VerificationStatus } from "@/lib/supabase/database.types";

/**
 * Abstraction for a future identity / selfie vendor (Persona, Stripe Identity, Clear, etc.).
 * Do not pretend a third-party check succeeded. A mock provider stays pending unless
 * an explicit development outcome is recorded.
 *
 * Before wiring a real vendor: confirm current API, pricing, eligibility, and web support.
 * Identity verification is optional for the MVP.
 */
export interface IdentityVerificationSession {
  sessionId: string;
  profileId: string;
  status: VerificationStatus;
  providerId: string;
}

export interface IdentityVerificationProvider {
  id: string;
  startVerification(profileId: string): Promise<IdentityVerificationSession>;
  getStatus(sessionId: string): Promise<VerificationStatus>;
}

const sessions = new Map<string, IdentityVerificationSession>();

export class MockDevelopmentIdentityProvider implements IdentityVerificationProvider {
  id = "mock_dev";

  async startVerification(profileId: string): Promise<IdentityVerificationSession> {
    const session: IdentityVerificationSession = {
      sessionId: `idv-${profileId}-${Date.now()}`,
      profileId,
      status: "pending",
      providerId: this.id,
    };
    sessions.set(session.sessionId, session);
    return session;
  }

  async getStatus(sessionId: string): Promise<VerificationStatus> {
    return sessions.get(sessionId)?.status ?? "unverified";
  }
}

let provider: IdentityVerificationProvider = new MockDevelopmentIdentityProvider();

export function getIdentityVerificationProvider() {
  return provider;
}

export function setIdentityVerificationProvider(next: IdentityVerificationProvider) {
  provider = next;
}
