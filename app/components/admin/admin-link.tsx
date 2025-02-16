'use client';

import { useRouter } from 'next/navigation';

export default function AdminLink() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push('/admin/login')}
      className="admin-link"
      aria-label="Admin Login"
    >
      Admin
    </button>
  );
}