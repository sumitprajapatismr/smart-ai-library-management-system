import api from './api';

interface OfflineAction {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'DELETE';
  body: any;
  timestamp: number;
}

// Check network state
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Cache API response
export const cacheResponse = (key: string, data: any) => {
  try {
    const payload = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(`cache_${key}`, JSON.stringify(payload));
  } catch (e) {
    console.error('Failed to write response cache', e);
  }
};

// Retrieve cached response (expires after 1 hour)
export const getCachedResponse = (key: string, maxAgeMs = 60 * 60 * 1000): any | null => {
  try {
    const raw = localStorage.getItem(`cache_${key}`);
    if (!raw) return null;
    
    const parsed = JSON.parse(raw);
    const age = Date.now() - parsed.timestamp;
    if (age > maxAgeMs) {
      localStorage.removeItem(`cache_${key}`);
      return null;
    }
    return parsed.data;
  } catch (e) {
    return null;
  }
};

// Fetch with cache fallback
export const fetchWithCache = async (url: string, params: any = {}, maxAgeMs = 15 * 60 * 1000): Promise<any> => {
  const cacheKey = `${url}_${JSON.stringify(params)}`;
  
  if (!isOnline()) {
    const cached = getCachedResponse(cacheKey, maxAgeMs);
    if (cached) {
      console.warn(`[Offline Mode] Serving cached data for ${url}`);
      return { data: cached, offline: true };
    }
    throw new Error('You are currently offline and no cached data is available.');
  }

  // If online, fetch from API and cache
  const res = await api.get(url, { params });
  if (res.data && res.data.success) {
    cacheResponse(cacheKey, res.data);
  }
  return { data: res.data, offline: false };
};

// Add mutating action to offline queue
export const queueOfflineAction = (url: string, method: 'POST' | 'PUT' | 'DELETE', body: any) => {
  try {
    const raw = localStorage.getItem('offline_actions_queue');
    const queue: OfflineAction[] = raw ? JSON.parse(raw) : [];
    
    const action: OfflineAction = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      url,
      method,
      body,
      timestamp: Date.now()
    };
    
    queue.push(action);
    localStorage.setItem('offline_actions_queue', JSON.stringify(queue));
    console.log(`[Offline Sync] Action queued for ${url}`);
  } catch (e) {
    console.error('Failed to queue offline action', e);
  }
};

// Process/Flush queued offline actions when online
export const syncOfflineActions = async (): Promise<{ success: boolean; count: number }> => {
  if (!isOnline()) return { success: false, count: 0 };
  
  try {
    const raw = localStorage.getItem('offline_actions_queue');
    if (!raw) return { success: true, count: 0 };
    
    const queue: OfflineAction[] = JSON.parse(raw);
    if (queue.length === 0) return { success: true, count: 0 };
    
    console.log(`[Offline Sync] Processing ${queue.length} queued actions...`);
    let processedCount = 0;
    
    for (const action of queue) {
      try {
        if (action.method === 'POST') {
          await api.post(action.url, action.body);
        } else if (action.method === 'PUT') {
          await api.put(action.url, action.body);
        } else if (action.method === 'DELETE') {
          await api.delete(action.url);
        }
        processedCount++;
      } catch (err) {
        console.error(`[Offline Sync] Failed to sync action ${action.id}:`, err);
        // If it is a validation error (400) or authorization error (401, 403), remove it to prevent blockages
        // Otherwise, keep it to retry later
      }
    }
    
    // Clear processed elements
    const remaining = queue.slice(processedCount);
    if (remaining.length === 0) {
      localStorage.removeItem('offline_actions_queue');
    } else {
      localStorage.setItem('offline_actions_queue', JSON.stringify(remaining));
    }
    
    return { success: true, count: processedCount };
  } catch (e) {
    console.error('[Offline Sync] Sync process crashed', e);
    return { success: false, count: 0 };
  }
};

// Setup automatic online trigger listeners
export const initOfflineSyncListener = (onSyncComplete?: (count: number) => void) => {
  window.addEventListener('online', async () => {
    console.log('[Offline Sync] Connection restored. Synchronizing offline queue...');
    const result = await syncOfflineActions();
    if (result.success && result.count > 0 && onSyncComplete) {
      onSyncComplete(result.count);
    }
  });
  
  window.addEventListener('offline', () => {
    console.warn('[Offline Sync] Connection lost. Mutating requests will be queued.');
  });
};
