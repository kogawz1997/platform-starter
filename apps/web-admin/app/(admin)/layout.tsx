'use client';

import { ReactNode, useEffect } from 'react';

export default function AdminProtectedLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    const token = window.localStorage.getItem('admin_access_token');
    if (!token) window.location.href = '/login';
  }, []);

  return <>{children}</>;
}
