import { ref } from 'vue';

interface Notification {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

const notifications = ref<Notification[]>([]);
let notificationId = 0;

export function useNotification() {
  const show = (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    duration = 3000
  ) => {
    const id = ++notificationId;
    
    notifications.value.push({
      id,
      type,
      message,
      duration,
    });

    if (duration > 0) {
      setTimeout(() => {
        remove(id);
      }, duration);
    }
  };

  const remove = (id: number) => {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index > -1) {
      notifications.value.splice(index, 1);
    }
  };

  const success = (message: string, duration?: number) => {
    show(message, 'success', duration);
  };

  const error = (message: string, duration?: number) => {
    show(message, 'error', duration);
  };

  const info = (message: string, duration?: number) => {
    show(message, 'info', duration);
  };

  const warning = (message: string, duration?: number) => {
    show(message, 'warning', duration);
  };

  return {
    notifications,
    show,
    remove,
    success,
    error,
    info,
    warning,
  };
}
