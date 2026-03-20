/**
 * Tracks a custom event in Google Analytics.
 * 
 * @param eventName The name of the event (e.g., 'login', 'create_project', 'agent_changed')
 * @param params Optional parameters to send with the event
 */
export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, params);
  } else {
    // Fallback for local development or when GA is not configured
    console.debug(`[Analytics Event]: ${eventName}`, params);
  }
};
