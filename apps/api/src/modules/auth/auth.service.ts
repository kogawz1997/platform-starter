export class AuthService {
  async register() {
    // TODO P1: validate unique user, hash secret, create user and profile
  }

  async signIn() {
    // TODO P1: verify credentials, create session, write login history
  }

  async refreshSession() {
    // TODO P1: verify hashed refresh token and rotate session
  }

  async signOut() {
    // TODO P1: revoke current session
  }
}
