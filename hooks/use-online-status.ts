import { useState, useEffect } from 'react';

/**
 * Hook để theo dõi trạng thái kết nối internet của người dùng
 * @returns {boolean} trạng thái kết nối (true = online, false = offline)
 */
export function useOnlineStatus(): boolean {
  // Kiểm tra xem đang ở phía client hay server
  const isClient = typeof window !== 'undefined';
  
  // State để lưu trữ trạng thái kết nối
  const [isOnline, setIsOnline] = useState<boolean>(isClient ? navigator.onLine : true);

  useEffect(() => {
    if (!isClient) return;

    // Cập nhật state khi trạng thái kết nối thay đổi
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    // Đăng ký các event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Xóa event listeners khi component unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isClient]);

  return isOnline;
}

export default useOnlineStatus; 