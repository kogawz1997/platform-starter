'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminGrid, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack } from '../_components/admin-ui';

type Permission = { id: string; code: string; name: string; module: string; description?: string | null };
type Role = { id: string; code: string; name: string; description?: string | null; level: number; adminUserCount: number; permissionCount: number; hasWildcard: boolean; permissions: Permission[] };
type AdminUser = { id: string; username: string; email: string; status: string; twoFactorEnabled: boolean; lastLoginAt?: string | null; createdAt: string; roles: { id: string; code: string; name: string; level: number }[] };
type AccessResponse = { summary: { roleCount: number; permissionCount: number; adminUserCount: number; wildcardRoleCount: number }; roles: Role[]; permissions: Permission[]; adminUsers: AdminUser[] };

export default function AccessOverviewPage() {
  const [data, setData] = useState<AccessResponse | null>(null);
  const [message, setMessage] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');

  useEffect(() => { load(); }, []);

  async function load() {
    setMessage('กำลังโหลดสิทธิ์แอดมิน...');
    const res = await adminApiFetch('/admin/access/overview');
    const payload = await res.json().catch(() => null);
    if (!res.ok) { setMessage(payload?.message ?? 'โหลดข้อมูลสิทธิ์ไม่สำเร็จ'); return; }
    setData(payload);
    setMessage('');
  }

  const modules = useMemo(() => ['ALL', ...Array.from(new Set((data?.permissions ?? []).map((item) => item.module))).sort()], [data]);
  const permissions = useMemo(() => moduleFilter === 'ALL' ? data?.permissions ?? [] : (data?.permissions ?? []).filter((item) => item.module === moduleFilter), [data, moduleFilter]);

  return <AdminPage eyebrow="Security" title="Access Control" description="ภาพรวม roles, permissions และ admin users แบบ read-only ก่อนเปิดให้แก้สิทธิ์จริง" actions={<AdminButton onClick={load}>Reload</AdminButton>}>
    {message && <AdminNotice>{message}</AdminNotice>}
    {data && <>
      <AdminMetricGrid>
        <AdminMetric title="Roles" value={String(data.summary.roleCount)} helper={`${data.summary.wildcardRoleCount} wildcard`} />
        <AdminMetric title="Permissions" value={String(data.summary.permissionCount)} helper="permission codes" />
        <AdminMetric title="Admin users" value={String(data.summary.adminUserCount)} helper="accounts" />
      </AdminMetricGrid>

      <AdminGrid>
        <AdminCard title="Roles" description="Role และ permission ที่ผูกอยู่">
          <AdminStack>{data.roles.map((role) => <AdminRow key={role.id}><div><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><AdminBadge tone={role.hasWildcard ? 'danger' : 'neutral'}>{role.hasWildcard ? 'WILDCARD' : 'ROLE'}</AdminBadge><AdminBadge>Level {role.level}</AdminBadge></div><strong>{role.name}</strong><p>{role.code} · {role.permissionCount} permissions · {role.adminUserCount} users</p>{role.description && <p>{role.description}</p>}</div></AdminRow>)}{data.roles.length === 0 && <AdminEmpty>ยังไม่มี roles</AdminEmpty>}</AdminStack>
        </AdminCard>

        <AdminCard title="Admin users" description="บัญชีแอดมินและ role ที่ได้รับ">
          <AdminStack>{data.adminUsers.map((user) => <AdminRow key={user.id}><div><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><AdminBadge tone={user.status === 'ACTIVE' ? 'success' : 'danger'}>{user.status}</AdminBadge><AdminBadge tone={user.twoFactorEnabled ? 'success' : 'warning'}>{user.twoFactorEnabled ? '2FA ON' : '2FA OFF'}</AdminBadge></div><strong>{user.username}</strong><p>{user.email}</p><p>Roles: {user.roles.map((role) => role.code).join(', ') || '-'}</p></div></AdminRow>)}{data.adminUsers.length === 0 && <AdminEmpty>ยังไม่มี admin users</AdminEmpty>}</AdminStack>
        </AdminCard>
      </AdminGrid>

      <AdminCard title="Permissions" description="รายการ permission ทั้งหมดในระบบ">
        <div style={toolbarStyle}><select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)}>{modules.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
        <AdminStack>{permissions.map((permission) => <AdminRow key={permission.id}><div><AdminBadge>{permission.module}</AdminBadge><strong>{permission.code}</strong><p>{permission.name}</p>{permission.description && <p>{permission.description}</p>}</div></AdminRow>)}{permissions.length === 0 && <AdminEmpty>ไม่มี permission ใน filter นี้</AdminEmpty>}</AdminStack>
      </AdminCard>
    </>}
  </AdminPage>;
}

const toolbarStyle = { display: 'grid', gridTemplateColumns: 'minmax(0, 260px)', gap: 10, marginBottom: 12 } as const;
