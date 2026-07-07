import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AdminAuditService, AuditLogQuery } from './admin-audit.service';

@UseGuards(AdminAuthGuard)
@Controller('admin/audit-logs')
export class AdminAuditController {
  constructor(private readonly service: AdminAuditService) {}

  @Get()
  list(@Query() query: AuditLogQuery) {
    return this.service.list(query);
  }
}
