import { useState, useEffect } from 'react';
import { Locker, Item } from '@/types';

export const useDashboardData = (session: any) => {
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [lockersRes, itemsRes] = await Promise.all([
        fetch('/api/lockers'),
        fetch('/api/items'),
      ]);
      
      if (lockersRes.ok) {
        const lockersData = await lockersRes.json();
        setLockers(lockersData);
      }
      
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setItems(itemsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getItemsForLocker = (lockerId: string) => {
    return items.filter(item => {
      const itemLockerId = typeof item.lockerId === 'string' 
        ? item.lockerId 
        : item.lockerId._id;
      return itemLockerId === lockerId;
    });
  };

  const getLockerInfo = (lockerId: string | { _id: string; code: string; label: string }) => {
    if (typeof lockerId === 'object') {
      return lockerId;
    }
    return lockers.find(locker => locker._id === lockerId);
  };

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  return {
    lockers,
    items,
    loading,
    fetchData,
    getItemsForLocker,
    getLockerInfo,
  };
};
