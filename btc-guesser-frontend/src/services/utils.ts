import notificationService from './notificationService'; // Import the service


export const queryFetcher = (query: string) => {
  return fetch(query)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
      }
      return res.json();
    })
    .catch((err) => {
      console.error('API Fetch Error:', err);
      notificationService.emit('showAppNotification', {
        message: err.message || 'An API error occurred. Please try again.',
        type: 'error',
      });
      throw err;
    });
};

export const postFetcher = (query: string, data: unknown) => {
  return fetch(query, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
      }
      return res.json();
    })
    .catch((err) => {
      console.error('API Fetch Error:', err);
      notificationService.emit('showAppNotification', {
        message: err.message || 'An API error occurred. Please try again.',
        type: 'error',
      });
      throw err;
    });
};