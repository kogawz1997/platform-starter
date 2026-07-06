export class RegisterDto {
  username!: string;
  phone?: string;
  email?: string;
  secret!: string;
  deviceId?: string;
  referralCode?: string;
}
