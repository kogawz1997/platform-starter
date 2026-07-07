import { Controller, Get, Param, UseGuards } from '@nestjs/common';
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
}
