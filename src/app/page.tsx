'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { StatisticsSection } from '@/components/StatisticsSection';
import { LoginPage } from '@/components/LoginPage';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardActions } from '@/components/DashboardActions';
import { LockerSearch } from '@/components/LockerSearch';
import { EnhancedLockerGrid } from '@/components/EnhancedLockerGrid';
import { EnhancedItemSearchModal } from '@/components/EnhancedItemSearchModal';
import { useDashboardData } from '@/hooks/useDashboardData';

export default function Home() {
  const { data: session, status } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [showItemSearch, setShowItemSearch] = useState(false);

  // Use the custom hook for data management
  const {
    lockers,
    items,
    loading,
    fetchData,
    getItemsForLocker,
    getLockerInfo,
  } = useDashboardData(session);

  // Filter lockers based on search term
  const filteredLockers = lockers.filter(locker =>
    locker.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    locker.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  if (!session) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen dark-theme pt-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DashboardHeader />

        <StatisticsSection 
          lockers={lockers}
          items={items}
          getItemsForLocker={getItemsForLocker}
        />

        <DashboardActions onSearchClick={() => setShowItemSearch(true)} />

        <LockerSearch 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        <EnhancedLockerGrid
          lockers={filteredLockers}
          items={items}
          loading={loading}
          getItemsForLocker={getItemsForLocker}
          onDataRefresh={fetchData}
        />

        <EnhancedItemSearchModal
          items={items}
          isOpen={showItemSearch}
          onClose={() => setShowItemSearch(false)}
          getLockerInfo={getLockerInfo}
        />
      </div>
    </div>
  );
}
