/**
 * PWA utilities for offline functionality and service worker management
 */

export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface CacheStatus {
  [cacheName: string]: number;
}

export interface OfflineData {
  farmerInputs?: any;
  environmentalData?: any;
  marketData?: any;
  timestamp: number;
}

export class PWAManager {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private installPrompt: PWAInstallPrompt | null = null;
  private isOnline = navigator.onLine;
  private onlineCallbacks: (() => void)[] = [];
  private offlineCallbacks: (() => void)[] = [];

  constructor() {
    this.initializeEventListeners();
  }

  /**
   * Initialize PWA and register service worker
   */
  async initialize(): Promise<boolean> {
    try {
      if ('serviceWorker' in navigator) {
        this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        console.log('Service Worker registered successfully:', this.swRegistration);

        // Handle service worker updates
        this.swRegistration.addEventListener('updatefound', () => {
          const newWorker = this.swRegistration!.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.notifyUpdate();
              }
            });
          }
        });

        return true;
      } else {
        console.warn('Service Worker not supported');
        return false;
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  /**
   * Check if app can be installed as PWA
   */
  canInstall(): boolean {
    return this.installPrompt !== null;
  }

  /**
   * Trigger PWA installation
   */
  async install(): Promise<boolean> {
    if (!this.installPrompt) {
      return false;
    }

    try {
      await this.installPrompt.prompt();
      const choiceResult = await this.installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA installation accepted');
        this.installPrompt = null;
        return true;
      } else {
        console.log('PWA installation dismissed');
        return false;
      }
    } catch (error) {
      console.error('PWA installation failed:', error);
      return false;
    }
  }

  /**
   * Check if app is currently online
   */
  isAppOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Subscribe to online status changes
   */
  onOnline(callback: () => void): () => void {
    this.onlineCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.onlineCallbacks.indexOf(callback);
      if (index > -1) {
        this.onlineCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to offline status changes
   */
  onOffline(callback: () => void): () => void {
    this.offlineCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.offlineCallbacks.indexOf(callback);
      if (index > -1) {
        this.offlineCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Store data for offline access
   */
  async storeOfflineData(data: OfflineData): Promise<void> {
    try {
      if (this.swRegistration?.active) {
        const messageChannel = new MessageChannel();
        
        return new Promise((resolve, reject) => {
          messageChannel.port1.onmessage = (event) => {
            if (event.data.type === 'DATA_STORED') {
              resolve();
            } else {
              reject(new Error('Failed to store offline data'));
            }
          };

          this.swRegistration!.active!.postMessage(
            { type: 'STORE_OFFLINE_DATA', payload: data },
            [messageChannel.port2]
          );
        });
      } else {
        // Fallback to localStorage for basic offline storage
        localStorage.setItem('smart-silo-offline-data', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Failed to store offline data:', error);
      throw error;
    }
  }

  /**
   * Retrieve offline data
   */
  getOfflineData(): OfflineData | null {
    try {
      const data = localStorage.getItem('smart-silo-offline-data');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to retrieve offline data:', error);
      return null;
    }
  }

  /**
   * Clear offline data
   */
  clearOfflineData(): void {
    try {
      localStorage.removeItem('smart-silo-offline-data');
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  }

  /**
   * Get cache status from service worker
   */
  async getCacheStatus(): Promise<CacheStatus> {
    if (!this.swRegistration?.active) {
      return {};
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.type === 'CACHE_STATUS') {
          resolve(event.data.payload);
        }
      };

      this.swRegistration!.active!.postMessage(
        { type: 'GET_CACHE_STATUS' },
        [messageChannel.port2]
      );
    });
  }

  /**
   * Clear all caches
   */
  async clearCache(): Promise<void> {
    if (!this.swRegistration?.active) {
      return;
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.type === 'CACHE_CLEARED') {
          resolve();
        }
      };

      this.swRegistration!.active!.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );
    });
  }

  /**
   * Update service worker
   */
  async updateServiceWorker(): Promise<void> {
    if (this.swRegistration) {
      await this.swRegistration.update();
      
      if (this.swRegistration.waiting) {
        this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    }
  }

  /**
   * Schedule background sync
   */
  async scheduleBackgroundSync(tag: string): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in (window as any).ServiceWorkerRegistration.prototype) {
      try {
        const registration = this.swRegistration as any;
        await registration?.sync?.register(tag);
        console.log('Background sync scheduled:', tag);
      } catch (error) {
        console.error('Background sync registration failed:', error);
      }
    }
  }

  /**
   * Check if running as installed PWA
   */
  isRunningAsPWA(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  /**
   * Get PWA display mode
   */
  getDisplayMode(): string {
    if (this.isRunningAsPWA()) {
      return 'standalone';
    }
    
    if (window.matchMedia('(display-mode: minimal-ui)').matches) {
      return 'minimal-ui';
    }
    
    if (window.matchMedia('(display-mode: fullscreen)').matches) {
      return 'fullscreen';
    }
    
    return 'browser';
  }

  /**
   * Add to home screen prompt for iOS
   */
  showIOSInstallPrompt(): boolean {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = (window.navigator as any).standalone;
    
    if (isIOS && !isInStandaloneMode) {
      // Show custom iOS install instructions
      return true;
    }
    
    return false;
  }

  // Private methods

  private initializeEventListeners(): void {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.installPrompt = event as any;
      console.log('PWA install prompt available');
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('PWA installed successfully');
      this.installPrompt = null;
    });

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('App is online');
      this.onlineCallbacks.forEach(callback => callback());
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('App is offline');
      this.offlineCallbacks.forEach(callback => callback());
    });

    // Listen for service worker messages
    navigator.serviceWorker?.addEventListener('message', (event) => {
      const { type } = event.data;
      
      switch (type) {
        case 'SW_UPDATE_AVAILABLE':
          this.notifyUpdate();
          break;
        case 'SW_OFFLINE_READY':
          console.log('App ready for offline use');
          break;
        default:
          console.log('Unknown service worker message:', type);
      }
    });
  }

  private notifyUpdate(): void {
    // Notify user about available update
    if (confirm('A new version of Smart-Silo is available. Update now?')) {
      this.updateServiceWorker().then(() => {
        window.location.reload();
      });
    }
  }
}

// Singleton instance
export const pwaManager = new PWAManager();

// Utility functions for offline detection
export function isOnline(): boolean {
  return navigator.onLine;
}

export function isOffline(): boolean {
  return !navigator.onLine;
}

// Utility function to check if response is from cache
export function isFromCache(response: Response): boolean {
  return response.headers.get('sw-offline') === 'true';
}

// Utility function to handle offline API responses
export function handleOfflineResponse<T>(
  response: Response,
  fallbackData?: T
): Promise<T> {
  if (response.status === 503 && isFromCache(response)) {
    // Return fallback data for offline responses
    return Promise.resolve(fallbackData || {} as T);
  }
  
  return response.json();
}

// Utility function to show offline notification
export function showOfflineNotification(): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Smart-Silo is offline', {
      body: 'Some features may be limited. Data will sync when connection is restored.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'offline-notification'
    });
  }
}

// Utility function to request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

// Initialize and register service worker
export async function registerSW(): Promise<void> {
  try {
    await pwaManager.initialize();
    console.log('PWA initialized successfully');
  } catch (error) {
    console.error('PWA initialization failed:', error);
  }
}