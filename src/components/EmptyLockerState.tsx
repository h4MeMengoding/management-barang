'use client';

import Link from 'next/link';
import { Container, Plus } from 'lucide-react';

interface EmptyLockerStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  actionHref?: string;
}

export function EmptyLockerState({ 
  title = "Belum ada loker",
  description = "Mulai dengan menambahkan loker pertama Anda.",
  actionText = "Tambah Loker Pertama",
  actionHref = "/lockers/new"
}: EmptyLockerStateProps) {
  return (
    <div className="text-center py-16">
      <div className="dark-icon inline-flex mb-6 p-6">
        <Container className="h-16 w-16 text-gray-500" />
      </div>
      <h3 className="mt-2 text-xl font-medium text-gray-200">{title}</h3>
      <p className="mt-2 text-sm text-gray-400">{description}</p>
      <Link
        href={actionHref}
        className="inline-flex items-center space-x-2 mt-6 px-6 py-3 dark-button-primary text-white font-medium transition-all duration-200"
      >
        <Plus size={18} />
        <span>{actionText}</span>
      </Link>
    </div>
  );
}
