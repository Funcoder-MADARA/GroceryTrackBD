import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export const usePendingUsers = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchPendingCount = async () => {
    if (user?.role !== 'admin') return;
    
    setLoading(true);
    try {
      const response = await api.get('/auth/pending-users-count');
      setPendingCount(response.data.pendingCount);
    } catch (error) {
      console.error('Failed to fetch pending count:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchPendingCount();
    }
  }, [user?.role]);

  return { pendingCount, loading, refetch: fetchPendingCount };
};
