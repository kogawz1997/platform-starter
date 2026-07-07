import { Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AdminMembersService } from './admin-members.service';

@UseGuards(AdminAuthGuard)
@Controller('admin/members')
export class AdminMembersController {
  constructor(private readonly adminMembersService: AdminMembersService) {}

  @Get(':id')
  getMemberDetail(@Param('id') id: string) {
    return this.adminMembersService.getMemberDetail(id);
  }

  @Patch(':id/status')
  updateMemberStatus(@Param('id') id: string, @Body() body: { status?: string; reason?: string }, @CurrentUser() admin: any, @Req() req: any) {
    return this.adminMembersService.updateMemberStatus(id, body.status, body.reason, admin, { ipAddress: req.ip, userAgent: req.headers?.['user-agent'] });
  }
}
