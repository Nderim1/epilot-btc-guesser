import { NotificationType } from '../components/Notification';

type NotificationPayload = { message: string; type: NotificationType };

const notificationService = {
  subscribe: (eventName: string, callback: (payload: NotificationPayload) => void): (() => void) => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<NotificationPayload>;
      callback(customEvent.detail);
    };

    window.addEventListener(eventName, handler);

    return () => {
      window.removeEventListener(eventName, handler);
    };
  },

  emit: (eventName: string, payload: NotificationPayload): void => {
    const event = new CustomEvent<NotificationPayload>(eventName, {
      detail: payload,
    });

    window.dispatchEvent(event);
  },
};

export default notificationService;
