import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const permissions = [
  ['users.view', 'Users View', 'users'],
  ['users.update', 'Users Update', 'users'],
  ['users.suspend', 'Users Suspend', 'users'],
  ['wallet.view', 'Wallet View', 'wallet'],
  ['deposit.view', 'Deposit View', 'deposit'],
  ['deposit.claim', 'Deposit Claim', 'deposit'],
  ['deposit.approve', 'Deposit Approve', 'deposit'],
  ['deposit.reject', 'Deposit Reject', 'deposit'],
  ['withdraw.view', 'Withdraw View', 'withdraw'],
  ['withdraw.claim', 'Withdraw Claim', 'withdraw'],
  ['withdraw.success', 'Withdraw Success', 'withdraw'],
  ['withdraw.reject', 'Withdraw Reject', 'withdraw'],
  ['risk.view', 'Risk View', 'risk'],
  ['risk.resolve', 'Risk Resolve', 'risk'],
  ['provider.view', 'Provider View', 'provider'],
  ['provider.update', 'Provider Update', 'provider'],
  ['promotion.view', 'Promotion View', 'promotion'],
  ['promotion.create', 'Promotion Create', 'promotion'],
  ['seo.view', 'SEO View', 'seo'],
  ['seo.update', 'SEO Update', 'seo'],
  ['admin.view', 'Admin View', 'admin'],
  ['admin.create', 'Admin Create', 'admin'],
  ['roles.update', 'Roles Update', 'admin'],
  ['settings.update', 'Settings Update', 'settings'],
  ['reports.view', 'Reports View', 'reports'],
  ['reports.export', 'Reports Export', 'reports'],
] as const;

async function main() {
  for (const [code, name, module] of permissions) {
    await prisma.permission.upsert({
      where: { code },
      update: { name, module },
      create: { code, name, module },
    });
  }

  const superAdminRole = await prisma.role.upsert({
    where: { code: 'super_admin' },
    update: { name: 'Super Admin', level: 1 },
    create: { code: 'super_admin', name: 'Super Admin', level: 1 },
  });

  const allPermissions = await prisma.permission.findMany();
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: permission.id,
      },
    });
  }

  const firstAdminSecret = process.env.DEFAULT_ADMIN_SECRET ?? 'ChangeThisLocalOnly123!';
  const firstAdmin = await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@example.local',
      passwordHash: await argon2.hash(firstAdminSecret),
      twoFactorEnabled: false,
    },
  });

  await prisma.adminUserRole.upsert({
    where: {
      adminUserId_roleId: {
        adminUserId: firstAdmin.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      adminUserId: firstAdmin.id,
      roleId: superAdminRole.id,
    },
  });

  console.log('Seed completed');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
