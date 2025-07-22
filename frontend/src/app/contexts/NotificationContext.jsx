import { createContext } from "react";

const NotificationContext = createContext({
  notifications: [],
  deleteNotification: () => {},
  clearNotifications: () => {},
  getNotifications: () => {},
  createNotification: () => {}
});

export const NotificationProvider = ({ children }) => {
  return (
    <NotificationContext.Provider value={{
      notifications: [],
      deleteNotification: () => {},
      clearNotifications: () => {},
      getNotifications: () => {},
      createNotification: () => {}
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
