import { useState, useEffect } from 'react';

/**
 * Hook sử dụng localStorage để lưu trữ dữ liệu và đồng bộ giữa các tab
 * @param key Khóa lưu trữ trong localStorage
 * @param initialValue Giá trị mặc định khi chưa có dữ liệu
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Kiểm tra xem đang ở phía client hay server
  const isClient = typeof window !== 'undefined';

  // State để lưu trữ giá trị của chúng ta
  // Truyền vào hàm khởi tạo để useState chỉ chạy một lần
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Lấy từ local storage theo key
      if (isClient) {
        const item = window.localStorage.getItem(key);
        // Parse dữ liệu lưu trữ hoặc trả về initialValue
        return item ? JSON.parse(item) : initialValue;
      }
      return initialValue;
    } catch (error) {
      // Nếu có lỗi, trả về initialValue
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Hàm để cập nhật cả state và localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Cho phép value là một function như trong useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // Lưu state
      setStoredValue(valueToStore);
      
      // Lưu vào localStorage
      if (isClient) {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Listen for changes to this localStorage key in other tabs
  useEffect(() => {
    if (!isClient) return;
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(`Error parsing localStorage change for key "${key}":`, error);
        }
      }
    };
    
    // Listen for storage events
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, isClient]);

  return [storedValue, setValue];
}

export default useLocalStorage; 