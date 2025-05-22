import notificationService from './notificationService'; // Import the service

export const queryFetcher = (query: string) => {
  return fetch(query)
    .then((res) => {
      if (!res.ok) {
        // If response is not OK, throw an error to be caught by .catch
        // You might want to parse the error response body if your API provides one
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
      }
      return res.json();
    })
    .catch((err) => {
      console.error('API Fetch Error:', err);
      // Emit a notification for the UI
      notificationService.emit('showAppNotification', {
        message: err.message || 'An API error occurred. Please try again.',
        type: 'error',
      });
      // Re-throw the error so that TanStack Query or other callers can handle it
      throw err;
    });
};
