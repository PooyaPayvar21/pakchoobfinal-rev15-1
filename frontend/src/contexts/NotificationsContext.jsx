import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { api, fetchNotifications } from "../api";

const NotificationsContext = createContext();

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used within NotificationsProvider"
    );
  return ctx;
};

export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(() => {
    const raw = localStorage.getItem("notifications") || "[]";
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const persist = (list) => {
    setNotifications(list);
    try {
      localStorage.setItem("notifications", JSON.stringify(list));
    } catch (e) {
      void e;
    }
  };

  const addNotification = useCallback(
    (notif) => {
      const n = {
        id: notif.id || Date.now().toString(),
        title: notif.title || "اعلان",
        message: notif.message || "",
        read: false,
        createdAt: notif.createdAt || new Date().toISOString(),
        type: notif.type || "info",
      };
      persist([n, ...notifications].slice(0, 100));
    },
    [notifications]
  );

  const markAsRead = (id) => {
    persist(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    persist(notifications.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = (id) => {
    persist(notifications.filter((n) => n.id !== id));
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // Example: derive notification from unread forms count
  useEffect(() => {
    let mounted = true;
    const fetchUnreadForms = async () => {
      try {
        const enabled = localStorage.getItem("notifications_enabled");
        if (enabled === "false") return;
        const res = await api.get("/forms/unread/");
        const count = res?.data?.count || 0;
        if (mounted && count > 0) {
          const exists = notifications.some(
            (n) => n.type === "forms_unread" && n.message.includes(`${count}`)
          );
          if (!exists) {
            addNotification({
              title: "فرم های خوانده‌نشده",
              message: `شما ${count} فرم خوانده‌نشده دارید`,
              type: "forms_unread",
            });
          }
        }
      } catch (e) {
        void e;
      }
    };
    const fetchUserNotifications = async () => {
      try {
        const enabled = localStorage.getItem("notifications_enabled");
        if (enabled === "false") return;
        let personal_code = localStorage.getItem("personal_code") || null;
        if (!personal_code) {
          try {
            const info = JSON.parse(
              localStorage.getItem("kpiUserInfo") || "{}"
            );
            if (info && info.personal_code) {
              personal_code = String(info.personal_code);
              localStorage.setItem("personal_code", personal_code);
            }
          } catch (e) {
            void e;
          }
        }
        if (!personal_code) return;
        const res = await fetchNotifications(personal_code);
        const list = Array.isArray(res?.data?.notifications)
          ? res.data.notifications
          : [];
        // Merge unique by id
        const existingIds = new Set(notifications.map((n) => n.id));
        const incoming = list
          .filter((n) => !existingIds.has(String(n.id)))
          .map((n) => ({
            id: String(n.id),
            title: n.title || "اعلان",
            message: n.message || "",
            read: !!n.read,
            createdAt: n.created_at || n.createdAt || new Date().toISOString(),
            type: n.type || "info",
          }));
        if (incoming.length > 0) persist([...incoming, ...notifications]);
      } catch (e) {
        void e;
      }
    };

    fetchUnreadForms();
    fetchUserNotifications();
    const interval = setInterval(fetchUnreadForms, 60000);
    const notifInterval = setInterval(fetchUserNotifications, 60000);
    return () => {
      mounted = false;
      clearInterval(interval);
      clearInterval(notifInterval);
    };
  }, [notifications, addNotification]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        unreadCount,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};
