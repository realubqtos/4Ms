import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Clock } from 'lucide-react';

export function StatusBar() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 h-8 glass-light flex items-center justify-between px-4 text-xs z-[100]"
      style={{
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        color: 'var(--text-tertiary)',
      }}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          {isOnline ? (
            <Wifi size={12} style={{ color: 'var(--accent-2)' }} />
          ) : (
            <WifiOff size={12} style={{ color: 'var(--accent-3)' }} />
          )}
          <span>{isOnline ? 'Connected' : 'Offline'}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Clock size={12} />
        <span className="font-mono">{formatTime(currentTime)}</span>
      </div>
    </div>
  );
}
