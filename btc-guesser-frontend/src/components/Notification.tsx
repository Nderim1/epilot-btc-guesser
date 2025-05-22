import { XCircleIcon } from '@heroicons/react/24/outline';

export type NotificationType = 'success' | 'error' | 'info';

interface NotificationProps {
  message: string;
  type: NotificationType;
  onClose: () => void;
}

const Notification = ({ message, type, onClose }: NotificationProps) => {
  const baseStyle = 'fixed bottom-5 left-5 p-4 rounded-md shadow-lg flex items-center space-x-2 text-white';
  let typeStyle = '';

  switch (type) {
    case 'success':
      typeStyle = 'bg-green-500';
      break;
    case 'error':
      typeStyle = 'bg-red-500';
      break;
    case 'info':
    default:
      typeStyle = 'bg-blue-500';
      break;
  }

  return (
    <div className={`${baseStyle} ${typeStyle}`}>
      <span>{message}</span>
      <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20">
        <XCircleIcon className="h-6 w-6" />
      </button>
    </div>
  );
};

export default Notification;
