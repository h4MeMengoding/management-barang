'use client';

interface DashboardHeaderProps {
  title?: string;
  description?: string;
}

export function DashboardHeader({ 
  title = "Dashboard", 
  description = "Kelola loker dan barang Anda dengan mudah" 
}: DashboardHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 mb-2">{title}</h1>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}
