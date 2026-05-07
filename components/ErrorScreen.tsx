/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useLiveAPIContext } from '../contexts/LiveAPIContext';
import React, { useEffect, useState } from 'react';
import { AppError } from './AppError';

export interface ExtendedErrorType {
  code?: number;
  message?: string;
  status?: string;
}

/**
 * A full-screen overlay component that displays error messages.
 * It listens for 'error' events from the Live API client and presents
 * them in a user-friendly format.
 */
export default function ErrorScreen() {
  const { client } = useLiveAPIContext();
  const [error, setError] = useState<{ message?: string } | null>(null);

  // Effect to subscribe and unsubscribe from the client's error events.
  useEffect(() => {
    function onError(error: any) {
      console.error(error);
      setError(error);
    }

    client.on('error', onError);

    return () => {
      client.off('error', onError);
    };
  }, [client]);

  // If there's no error, render nothing.
  if (!error) {
    return <div style={{ display: 'none' }} />;
  }

  return (
    <AppError 
      error={error}
      onRetry={() => setError(null)}
      showHomeButton={false}
    />
  );
}
