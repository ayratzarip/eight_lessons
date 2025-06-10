import { useState, useEffect } from 'react';

/**
 * Hook для правильной обработки гидратации
 * Возвращает true только после того, как компонент смонтирован на клиенте
 */
export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
} 