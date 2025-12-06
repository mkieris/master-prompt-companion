import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface DebugEvent {
  id: string;
  timestamp: Date;
  category: 'form' | 'api' | 'response' | 'error' | 'state' | 'navigation' | 'prompt';
  action: string;
  details: any;
  duration?: number;
}

interface DebugContextType {
  events: DebugEvent[];
  isDebugMode: boolean;
  toggleDebugMode: () => void;
  log: (category: DebugEvent['category'], action: string, details?: any) => void;
  logWithTimer: (category: DebugEvent['category'], action: string) => () => void;
  clearLogs: () => void;
  exportLogs: () => void;
}

const DebugContext = createContext<DebugContextType | undefined>(undefined);

export const DebugProvider = ({ children }: { children: ReactNode }) => {
  const [events, setEvents] = useState<DebugEvent[]>([]);
  const [isDebugMode, setIsDebugMode] = useState(() => {
    return localStorage.getItem('debug-mode') === 'true';
  });

  const toggleDebugMode = useCallback(() => {
    setIsDebugMode(prev => {
      const newValue = !prev;
      localStorage.setItem('debug-mode', String(newValue));
      return newValue;
    });
  }, []);

  const log = useCallback((category: DebugEvent['category'], action: string, details?: any) => {
    const event: DebugEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      category,
      action,
      details: details ?? null,
    };
    
    setEvents(prev => [...prev.slice(-199), event]); // Keep last 200 events
    
    // Also log to console in debug mode
    if (localStorage.getItem('debug-mode') === 'true') {
      const emoji = {
        form: '📝',
        api: '🌐',
        response: '📥',
        error: '❌',
        state: '🔄',
        navigation: '🧭',
        prompt: '💬'
      }[category];
      console.log(`${emoji} [${category.toUpperCase()}] ${action}`, details ?? '');
    }
  }, []);

  const logWithTimer = useCallback((category: DebugEvent['category'], action: string) => {
    const startTime = Date.now();
    log(category, `${action} - START`);
    
    return () => {
      const duration = Date.now() - startTime;
      const event: DebugEvent = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        category,
        action: `${action} - COMPLETE`,
        details: { duration: `${duration}ms` },
        duration,
      };
      setEvents(prev => [...prev.slice(-199), event]);
    };
  }, [log]);

  const clearLogs = useCallback(() => {
    setEvents([]);
  }, []);

  const exportLogs = useCallback(() => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      eventCount: events.length,
      events: events.map(e => ({
        ...e,
        timestamp: e.timestamp.toISOString()
      }))
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-log-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [events]);

  return (
    <DebugContext.Provider value={{
      events,
      isDebugMode,
      toggleDebugMode,
      log,
      logWithTimer,
      clearLogs,
      exportLogs
    }}>
      {children}
    </DebugContext.Provider>
  );
};

export const useDebug = () => {
  const context = useContext(DebugContext);
  if (!context) {
    throw new Error('useDebug must be used within a DebugProvider');
  }
  return context;
};
