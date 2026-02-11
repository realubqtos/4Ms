import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Clock, Signal, BatteryCharging, BatteryLow, BatteryMedium, BatteryFull } from 'lucide-react';

export function StatusBar() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [batteryLevel, setBatteryLevel] = useState(87);
  const [isCharging, setIsCharging] = useState(false);
  const [signalStrength, setSignalStrength] = useState(4);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Simulate battery changes for demo
    const batteryTimer = setInterval(() => {
      setBatteryLevel(prev => {
        const newLevel = prev + (Math.random() > 0.5 ? 1 : -1);
        return Math.max(10, Math.min(100, newLevel));
      });
      setIsCharging(prev => Math.random() > 0.9 ? !prev : prev);
    }, 30000);

    // Simulate signal strength changes
    const signalTimer = setInterval(() => {
      setSignalStrength(Math.floor(Math.random() * 5));
    }, 45000);

    return () => {
      clearInterval(timer);
      clearInterval(batteryTimer);
      clearInterval(signalTimer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getBatteryIcon = () => {
    if (isCharging) {
      return BatteryCharging;
    }
    if (batteryLevel < 20) {
      return BatteryLow;
    }
    if (batteryLevel < 80) {
      return BatteryMedium;
    }
    return BatteryFull;
  };

  const BatteryIcon = getBatteryIcon();
  const batteryColor = batteryLevel < 20 && !isCharging ? 'var(--accent-3)' : 'var(--text-tertiary)';

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
          <Signal
            size={12}
            style={{ color: signalStrength >= 3 ? 'var(--accent-2)' : signalStrength >= 1 ? 'var(--text-tertiary)' : 'var(--accent-3)' }}
          />
        </div>
        <div className="flex items-center gap-1.5">
          {isOnline ? (
            <Wifi size={12} style={{ color: 'var(--accent-2)' }} />
          ) : (
            <WifiOff size={12} style={{ color: 'var(--accent-3)' }} />
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Clock size={12} />
        <span className="font-mono">{formatTime(currentTime)}</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="font-mono">{batteryLevel}%</span>
        <BatteryIcon size={12} style={{ color: batteryColor }} />
      </div>
    </div>
  );
}
