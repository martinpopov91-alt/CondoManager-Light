import { useEffect, useRef, useState, useCallback } from 'react';
import { MonthData } from '../types';

export interface UseAutoSaveMonthDataOptions {
  /**
   * Interval in milliseconds between periodic saves to localStorage.
   * Default: 4000ms (4 seconds)
   */
  intervalMs?: number;

  /**
   * Whether the periodic auto-save is enabled.
   * Default: true
   */
  enabled?: boolean;

  /**
   * Custom key or function to derive the primary localStorage key.
   * Default: condo_${year}-${month.toString().padStart(2, '0')}
   */
  storageKey?: string | ((data: MonthData) => string);

  /**
   * Prefix for the secondary autosave snapshot/backup key.
   * Default: 'condo_autosave_'
   */
  backupKeyPrefix?: string;

  /**
   * Save immediately when the window triggers beforeunload, pagehide, or visibilitychange.
   * Default: true
   */
  saveOnUnload?: boolean;

  /**
   * Callback invoked whenever a periodic or forced save successfully completes.
   */
  onSave?: (savedAt: Date, data: MonthData) => void;

  /**
   * Callback invoked if saving to localStorage fails (e.g. quota exceeded).
   */
  onError?: (error: unknown) => void;
}

export interface UseAutoSaveMonthDataReturn {
  /** Timestamp of the last successful save to localStorage */
  lastSaved: Date | null;
  /** Whether a save operation is currently in progress */
  isSaving: boolean;
  /** Overall save status */
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  /** Whether monthData has modifications that haven't been written to localStorage yet */
  hasUnsavedChanges: boolean;
  /** Immediately forces a synchronous save of the current monthData to localStorage */
  forceSave: () => boolean;
  /** Last error encountered during save, if any */
  lastError: Error | null;
}

export function getDefaultMonthKey(year: number, month: number): string {
  return `condo_${year}-${month.toString().padStart(2, '0')}`;
}

export function getDefaultBackupKey(prefix: string, year: number, month: number): string {
  return `${prefix}${year}-${month.toString().padStart(2, '0')}`;
}

/**
 * Custom React hook that periodically saves the current monthData state to localStorage.
 * 
 * Features:
 * 1. Periodic background saving via timer (default every 4 seconds) when data changes.
 * 2. Synchronous flush on 'beforeunload' and 'pagehide' to prevent data loss on accidental browser refreshes.
 * 3. Dual storage: writes to primary month key + creates timestamped backup snapshot for recovery.
 * 4. Exposes save status, lastSaved timestamp, and manual forceSave() function.
 */
export function useAutoSaveMonthData(
  monthData: MonthData | null,
  options: UseAutoSaveMonthDataOptions = {}
): UseAutoSaveMonthDataReturn {
  const {
    intervalMs = 4000,
    enabled = true,
    storageKey,
    backupKeyPrefix = 'condo_autosave_',
    saveOnUnload = true,
    onSave,
    onError,
  } = options;

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [lastError, setLastError] = useState<Error | null>(null);

  // Keep fresh references to avoid unnecessary timer restarts
  const monthDataRef = useRef<MonthData | null>(monthData);
  const lastSavedJsonRef = useRef<string | null>(null);
  const isSavingRef = useRef<boolean>(false);

  // Resolve storage key for a given MonthData instance
  const resolveStorageKey = useCallback(
    (data: MonthData): string => {
      if (typeof storageKey === 'function') {
        return storageKey(data);
      }
      if (typeof storageKey === 'string' && storageKey.length > 0) {
        return storageKey;
      }
      return getDefaultMonthKey(data.year, data.month);
    },
    [storageKey]
  );

  // Initialize lastSavedJsonRef once data is first loaded to avoid false "unsaved changes"
  useEffect(() => {
    monthDataRef.current = monthData;

    if (!monthData) {
      setHasUnsavedChanges(false);
      return;
    }

    try {
      const currentJson = JSON.stringify(monthData);

      // If we haven't recorded a saved JSON yet, check if localStorage already has it
      if (lastSavedJsonRef.current === null) {
        const key = resolveStorageKey(monthData);
        const stored = localStorage.getItem(key);
        if (stored) {
          lastSavedJsonRef.current = stored;
          // If stored matches current, we start as saved
          if (stored === currentJson) {
            setHasUnsavedChanges(false);
            setSaveStatus('saved');
            return;
          }
        } else {
          // If not in storage yet, consider it needs saving
          lastSavedJsonRef.current = null;
        }
      }

      // Check if current data diverges from the last saved snapshot
      const isDirty = currentJson !== lastSavedJsonRef.current;
      setHasUnsavedChanges(isDirty);
      if (isDirty && saveStatus === 'saved') {
        setSaveStatus('idle');
      }
    } catch {
      // Ignore JSON serialization errors in render/effect
    }
  }, [monthData, resolveStorageKey, saveStatus]);

  // Execute the write operation to localStorage
  const executeSave = useCallback(
    (dataToSave: MonthData): boolean => {
      if (isSavingRef.current) return false;

      try {
        isSavingRef.current = true;
        setSaveStatus('saving');

        const json = JSON.stringify(dataToSave);
        const key = resolveStorageKey(dataToSave);
        const backupKey = getDefaultBackupKey(backupKeyPrefix, dataToSave.year, dataToSave.month);

        // 1. Primary write to monthly key
        localStorage.setItem(key, json);

        // 2. Backup write with metadata for safety & accident recovery
        const backupPayload = JSON.stringify({
          timestamp: Date.now(),
          savedAtIso: new Date().toISOString(),
          year: dataToSave.year,
          month: dataToSave.month,
          data: dataToSave,
        });
        localStorage.setItem(backupKey, backupPayload);

        // 3. Global last autosave marker
        localStorage.setItem('condo_last_autosave_time', new Date().toISOString());

        lastSavedJsonRef.current = json;
        const now = new Date();
        setLastSaved(now);
        setHasUnsavedChanges(false);
        setSaveStatus('saved');
        setLastError(null);

        onSave?.(now, dataToSave);
        return true;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        console.error('[useAutoSaveMonthData] Failed to save state to localStorage:', errorObj);
        setLastError(errorObj);
        setSaveStatus('error');
        onError?.(errorObj);
        return false;
      } finally {
        isSavingRef.current = false;
      }
    },
    [resolveStorageKey, backupKeyPrefix, onSave, onError]
  );

  // Manual save trigger
  const forceSave = useCallback((): boolean => {
    if (!monthDataRef.current) return false;
    return executeSave(monthDataRef.current);
  }, [executeSave]);

  // Periodic interval timer
  useEffect(() => {
    if (!enabled || intervalMs <= 0) return;

    const timer = setInterval(() => {
      const current = monthDataRef.current;
      if (!current) return;

      try {
        const currentJson = JSON.stringify(current);
        if (currentJson !== lastSavedJsonRef.current) {
          executeSave(current);
        }
      } catch (err) {
        console.error('[useAutoSaveMonthData] Error in periodic check:', err);
      }
    }, intervalMs);

    return () => {
      clearInterval(timer);
    };
  }, [enabled, intervalMs, executeSave]);

  // Accident-prevention handlers: flush immediately when window is about to unload, refresh, or hide
  useEffect(() => {
    if (!saveOnUnload || !enabled) return;

    const handleBeforeUnloadOrHide = () => {
      const current = monthDataRef.current;
      if (!current) return;

      try {
        const currentJson = JSON.stringify(current);
        // Only write if there are actual unsaved modifications
        if (currentJson !== lastSavedJsonRef.current) {
          const key = resolveStorageKey(current);
          const backupKey = getDefaultBackupKey(backupKeyPrefix, current.year, current.month);

          localStorage.setItem(key, currentJson);
          localStorage.setItem(
            backupKey,
            JSON.stringify({
              timestamp: Date.now(),
              savedAtIso: new Date().toISOString(),
              reason: 'accidental_refresh_or_unload',
              data: current,
            })
          );
          localStorage.setItem('condo_last_autosave_time', new Date().toISOString());
          lastSavedJsonRef.current = currentJson;
        }
      } catch (e) {
        console.error('[useAutoSaveMonthData] Unload flush failed:', e);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleBeforeUnloadOrHide();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnloadOrHide);
    window.addEventListener('pagehide', handleBeforeUnloadOrHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnloadOrHide);
      window.removeEventListener('pagehide', handleBeforeUnloadOrHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Also flush immediately on hook unmount
      handleBeforeUnloadOrHide();
    };
  }, [saveOnUnload, enabled, resolveStorageKey, backupKeyPrefix]);

  return {
    lastSaved,
    isSaving: saveStatus === 'saving',
    saveStatus,
    hasUnsavedChanges,
    forceSave,
    lastError,
  };
}

/**
 * Alias for useAutoSaveMonthData matching the user request terminology.
 */
export const usePeriodicSaveMonthData = useAutoSaveMonthData;
export default useAutoSaveMonthData;
