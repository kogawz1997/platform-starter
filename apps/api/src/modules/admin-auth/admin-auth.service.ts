export class AdminAuthService {
  async signIn() {
    // TODO P1: verify admin credentials and start 2FA challenge if enabled
  }

  async verifyTwoFactor() {
    // TODO P1: verify 2FA code, create admin session, write audit log
  }

  async refreshSession() {
    // TODO P1: rotate admin session
  }

  async signOut() {
    // TODO P1: revoke admin session and write audit log
  }
}
