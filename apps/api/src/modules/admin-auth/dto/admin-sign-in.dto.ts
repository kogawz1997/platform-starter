export class AdminSignInDto {
  username!: string;
  secret!: string;
  twoFactorCode?: string;
  deviceId?: string;
}
