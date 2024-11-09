import React, { useEffect } from 'react';

const Notifications = ({ notifications, removeNotification }) => {
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        removeNotification();
      }, 3000); // Each notification displays for 3 seconds
      return () => clearTimeout(timer);
    }
  }, [notifications, removeNotification]);

  return (
    <div className="fixed top-4 right-4 space-y-2">
      {notifications.map((notification, index) => (
        <div
          key={index}
          className={`p-4 rounded shadow-lg ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white`}
        >
          {notification.message}
        </div>
      ))}
    </div>
  );
};

export default Notifications;
