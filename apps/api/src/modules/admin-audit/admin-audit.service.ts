import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: AuditLogQuery) {
    const page = Math.max(Number(query.page ?? 1) || 1, 1);
    const take = Math.min(Math.max(Number(query.take ?? 50), 1), 100);
    const where: Prisma.AdminAuditLogWhereInput = {};

    if (query.module) where.module = String(query.module);
    if (query.action) where.action = { contains: String(query.action), mode: 'insensitive' };
    if (query.adminUserId) where.adminUserId = String(query.adminUserId);
    if (query.from || query.to) {
      where.createdAt = {
        gte: query.from ? new Date(String(query.from)) : undefined,
        lte: query.to ? new Date(String(query.to)) : undefined,
      };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * take,
        take,
        include: { adminUser: { select: { id: true, username: true, email: true } } },
      }),
      this.prisma.adminAuditLog.count({ where }),
    ]);

    return { items, total, page, take, pageCount: Math.max(Math.ceil(total / take), 1) };
  }
}

export type AuditLogQuery = {
  module?: string;
  action?: string;
  adminUserId?: string;
  from?: string;
  to?: string;
  page?: string | number;
  take?: string | number;
};
