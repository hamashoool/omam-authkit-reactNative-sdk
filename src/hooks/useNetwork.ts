import { useState, useEffect, useCallback } from 'react';
import { NetworkStatus } from '../types';

// Dynamically import NetInfo to avoid errors if not available
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let NetInfo: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let NetInfoStateType: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const netInfoModule = require('@react-native-community/netinfo');
  NetInfo = netInfoModule.default || netInfoModule;
  NetInfoStateType = netInfoModule.NetInfoStateType;
} catch (error) {
  // eslint-disable-next-line no-console
  console.warn('@react-native-community/netinfo not available, network status will be mocked');
}

/**
 * useNetwork hook - provides network connectivity status
 * Falls back to assuming online if NetInfo is not available (Expo Go)
 */
export function useNetwork() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: Boolean(true),
    type: 'unknown',
    isExpensive: Boolean(false),
  });

  /**
   * Handle network state change
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleNetworkChange = useCallback((state: any) => {
    const isConnected = Boolean(state.isConnected ?? true);

    let type: NetworkStatus['type'] = 'unknown';
    if (NetInfoStateType) {
      if (state.type === NetInfoStateType.wifi) {
        type = 'wifi';
      } else if (state.type === NetInfoStateType.cellular) {
        type = 'cellular';
      } else if (state.type === NetInfoStateType.ethernet) {
        type = 'ethernet';
      }
    }

    setNetworkStatus({
      isConnected,
      type,
      isExpensive: Boolean(state.details?.isConnectionExpensive ?? false),
    });
  }, []);

  useEffect(() => {
    if (!NetInfo) {
      // NetInfo not available, assume online
      return;
    }

    // Get initial network status
    NetInfo.fetch().then(handleNetworkChange).catch(() => {
      // Ignore errors
    });

    // Subscribe to network status changes
    const unsubscribe = NetInfo.addEventListener(handleNetworkChange);

    return () => {
      unsubscribe();
    };
  }, [handleNetworkChange]);

  /**
   * Manually refresh network status
   */
  const refresh = async () => {
    if (!NetInfo) {
      return;
    }

    try {
      const state = await NetInfo.fetch();
      handleNetworkChange(state);
    } catch (error) {
      // Ignore errors
    }
  };

  return {
    /** Whether device is connected to internet */
    isConnected: networkStatus.isConnected,
    /** Whether device is offline */
    isOffline: !networkStatus.isConnected,
    /** Type of network connection */
    connectionType: networkStatus.type,
    /** Whether connection is expensive (e.g., cellular data) */
    isExpensive: networkStatus.isExpensive,
    /** Full network status */
    status: networkStatus,
    /** Manually refresh network status */
    refresh,
  };
}
