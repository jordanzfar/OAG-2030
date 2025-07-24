import { createContext } from 'react';

export const NotificationContext = createContext({
  notifications: [],
  addNotification: () => {},
  markAsRead: () => {},
  unreadCount: 0,
});