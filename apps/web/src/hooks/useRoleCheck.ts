import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Hook to periodically check if user role has changed in Firebase
 * If role changed, force logout and redirect to login
 */
export function useRoleCheck(enabled = true) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    const checkRole = async () => {
      try {
        const userDataString = localStorage.getItem('user');
        const token = localStorage.getItem('firebaseToken');
        
        if (!userDataString || !token) return;

        const userData = JSON.parse(userDataString);
        
        // Call API to get current user data from Firebase
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          // Token invalid, logout
          console.warn('⚠️ Token invalid, logging out...');
          localStorage.removeItem('user');
          localStorage.removeItem('firebaseToken');
          router.push("/login");
          return;
        }

        const currentData = await response.json();
        
        // Check if role has changed
        if (currentData.user?.role && currentData.user.role !== userData.role) {
          console.warn('⚠️ Role changed from', userData.role, 'to', currentData.user.role);
          alert('⚠️ Вашата роля е променена! Моля влезте отново.');
          localStorage.removeItem('user');
          localStorage.removeItem('firebaseToken');
          router.push("/login");
        }
      } catch (error) {
        console.error('Role check error:', error);
      }
    };

    // Check role every 30 seconds
    const interval = setInterval(checkRole, 30000);

    // Check immediately on mount
    checkRole();

    return () => clearInterval(interval);
  }, [enabled, router]);
}
