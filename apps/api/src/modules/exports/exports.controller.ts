import { Controller, Get, Header, Query, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { ExportsService } from './exports.service';

@UseGuards(AdminAuthGuard)
@Controller('admin/exports')
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get('topups.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  topUps(@Query() query: ExportQuery) {
    return this.exportsService.exportTopUps(query);
  }

  @Get('withdrawals.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  withdrawals(@Query() query: ExportQuery) {
    return this.exportsService.exportWithdrawals(query);
  }

  @Get('ledgers.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  ledgers(@Query() query: ExportQuery) {
    return this.exportsService.exportLedgers(query);
  }
}

type ExportQuery = { status?: string; from?: string; to?: string; limit?: string };
