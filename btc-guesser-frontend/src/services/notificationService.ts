import { NotificationType } from '../components/Notification';

type NotificationPayload = { message: string; type: NotificationType };
type Listener = (payload: NotificationPayload) => void;

const listeners: { [eventName: string]: Listener[] } = {};

const notificationService = {
  subscribe: (eventName: string, callback: Listener): (() => void) => {
    if (!listeners[eventName]) {
      listeners[eventName] = [];
    }
    listeners[eventName].push(callback);

    // Return an unsubscribe function
    return () => {
      listeners[eventName] = listeners[eventName].filter(cb => cb !== callback);
    };
  },

  emit: (eventName: string, payload: NotificationPayload): void => {
    if (listeners[eventName]) {
      listeners[eventName].forEach(callback => callback(payload));
    }
  },
};

export default notificationService;
