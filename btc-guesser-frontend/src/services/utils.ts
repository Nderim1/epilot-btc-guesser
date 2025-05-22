import notificationService from './notificationService'; // Import the service

const parseError = async (response: Response) => {
  let errorData;
  try {
    errorData = await response.json();
  } catch (error) {
    errorData = { message: response.statusText || (error as Error).message };
  }
  const errorMessage = errorData?.message || `HTTP error! status: ${response.status}`;

  notificationService.emit('showAppNotification', { message: errorMessage, type: 'error' });

  throw new Error(errorMessage);
}

export const queryFetcher = (query: string) => {
  return fetch(query)
    .then(async (res) => {
      if (!res.ok) {
        await parseError(res);
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
    .then(async (response) => {
      if (!response.ok) {
        await parseError(response);
      }
      return response.json();
    })
    .catch((err) => {
      notificationService.emit('showAppNotification', {
        message: err.message || 'An API error occurred. Please try again.',
        type: 'error',
      });
      throw err;
    });
};