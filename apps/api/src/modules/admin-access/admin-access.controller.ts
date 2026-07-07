import { Controller, Get, UseGuards } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AdminAccessService } from './admin-access.service';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/access')
export class AdminAccessController {
  constructor(private readonly service: AdminAccessService) {}

  @RequirePermission('admin.access.view')
  @Get('overview')
  overview() {
    return this.service.overview();
  }
}
