import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // TODO P1:
    // 1. Read Authorization bearer token
    // 2. Verify admin JWT
    // 3. Load admin session
    // 4. Check admin status
    // 5. Attach admin user and permissions to request

    if (!request.headers.authorization) {
      throw new UnauthorizedException('Missing admin authorization header');
    }

    return true;
  }
}
