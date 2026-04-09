import React, { useEffect } from 'react';
import { useAdminStore } from '../../store/adminStore';

export const PendingRequests: React.FC = () => {
  const { setActiveModule } = useAdminStore();

  useEffect(() => {
    // Pending requests is effectively the same as Verify Organizations
    // We just alias it to the main queue
    setActiveModule('verify-organizations');
  }, [setActiveModule]);

  return <div style={{ padding: 40, color: '#ffffff' }}>Redirecting to Verify Queue...</div>;
};

export default PendingRequests;
