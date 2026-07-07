import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const [roles, permissions, adminUsers] = await Promise.all([
      this.prisma.role.findMany({
        include: { permissions: { include: { permission: true }, orderBy: { permission: { module: 'asc' } } }, adminUsers: true },
        orderBy: [{ level: 'asc' }, { code: 'asc' }],
      }),
      this.prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { code: 'asc' }] }),
      this.prisma.adminUser.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          status: true,
          twoFactorEnabled: true,
          lastLoginAt: true,
          createdAt: true,
          roles: { include: { role: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      summary: {
        roleCount: roles.length,
        permissionCount: permissions.length,
        adminUserCount: adminUsers.length,
        wildcardRoleCount: roles.filter((role) => role.permissions.some((item) => item.permission.code === '*')).length,
      },
      roles: roles.map((role) => ({
        id: role.id,
        code: role.code,
        name: role.name,
        description: role.description,
        level: role.level,
        adminUserCount: role.adminUsers.length,
        permissionCount: role.permissions.length,
        hasWildcard: role.permissions.some((item) => item.permission.code === '*'),
        permissions: role.permissions.map((item) => ({
          id: item.permission.id,
          code: item.permission.code,
          name: item.permission.name,
          module: item.permission.module,
          description: item.permission.description,
        })),
      })),
      permissions: permissions.map((permission) => ({
        id: permission.id,
        code: permission.code,
        name: permission.name,
        module: permission.module,
        description: permission.description,
      })),
      adminUsers: adminUsers.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        status: user.status,
        twoFactorEnabled: user.twoFactorEnabled,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        roles: user.roles.map((item) => ({ id: item.role.id, code: item.role.code, name: item.role.name, level: item.role.level })),
      })),
    };
  }
}
