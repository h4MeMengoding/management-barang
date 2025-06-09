'use client';

import { LockerCard } from './LockerCard';
import { EmptyLockerState } from './EmptyLockerState';
import { DataLoadingSpinner } from './LoadingSpinner';
import { Locker, Item } from '@/types';

interface EnhancedLockerGridProps {
  lockers: Locker[];
  items: Item[];
  loading: boolean;
  getItemsForLocker: (lockerId: string) => Item[];
  onDataRefresh: () => void;
}

export function EnhancedLockerGrid({ 
  lockers, 
  items, // eslint-disable-line @typescript-eslint/no-unused-vars
  loading, 
  getItemsForLocker, 
  onDataRefresh 
}: EnhancedLockerGridProps) {
  if (loading) {
    return <DataLoadingSpinner />;
  }

  if (lockers.length === 0) {
    return <EmptyLockerState />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {lockers.map((locker) => {
        const lockerItems = getItemsForLocker(locker._id);
        return (
          <LockerCard
            key={locker._id}
            locker={locker}
            items={lockerItems}
            onDataRefresh={onDataRefresh}
          />
        );
      })}
    </div>
  );
}
