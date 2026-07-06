import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class MemberAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // TODO P1:
    // 1. Read Authorization bearer token
    // 2. Verify JWT
    // 3. Load member session
    // 4. Attach user to request

    if (!request.headers.authorization) {
      throw new UnauthorizedException('Missing authorization header');
    }

    return true;
  }
}
