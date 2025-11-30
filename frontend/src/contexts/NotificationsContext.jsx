import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import { api, fetchNotifications } from "../api";
import { getToken } from "../utils/auth";

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
  const personalCodeInit = localStorage.getItem("personal_code") || null;
  const initialKey = personalCodeInit
    ? `notifications_${personalCodeInit}`
    : "notifications";
  const [notifications, setNotifications] = useState(() => {
    const raw = localStorage.getItem(initialKey) || "[]";
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // WebSocket connection ref
  const ws = useRef(null);
  const wsFailCount = useRef(0);
  const currentCodeRef = useRef(personalCodeInit);
  const [wsDisabled, setWsDisabled] = useState(() => {
    const v = localStorage.getItem("notifications_ws_disabled");
    return v === "true";
  });

  const persist = (list) => {
    setNotifications(list);
    try {
      const code = localStorage.getItem("personal_code") || null;
      const key = code ? `notifications_${code}` : "notifications";
      localStorage.setItem(key, JSON.stringify(list));
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

  // Initialize WebSocket connection
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (wsDisabled) return;

    const token = getToken();
    if (!token) return;

    const resolveWsUrl = () => {
      const envUrl = import.meta.env.VITE_WS_URL || null;
      const tokenParam = import.meta.env.VITE_WS_TOKEN_PARAM || "token";
      const personal_code = localStorage.getItem("personal_code") || null;
      if (envUrl) {
        try {
          const u = new URL(envUrl, window.location.origin);
          const protocol = u.protocol === "https:" ? "wss:" : "ws:";
          const base = `${protocol}//${u.host}${
            u.pathname.endsWith("/") ? u.pathname : u.pathname + "/"
          }`;
          const path = base.includes("notifications")
            ? base
            : base + "notifications/";
          const params = new URLSearchParams();
          params.set(tokenParam, token);
          if (personal_code) params.set("personal_code", personal_code);
          return `${path}?${params.toString()}`;
        } catch {
          void 0;
        }
      }
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsHost = window.location.host;
      const params2 = new URLSearchParams();
      params2.set(tokenParam, token);
      if (personal_code) params2.set("personal_code", personal_code);
      const proxied = `${wsProtocol}//${wsHost}/ws/notifications/?${params2.toString()}`;
      return proxied;
    };

    const url = resolveWsUrl();
    const prot = (import.meta.env.VITE_WS_PROTOCOLS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    ws.current =
      prot.length > 0 ? new WebSocket(url, prot) : new WebSocket(url);

    ws.current.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.type === "send_notification" && data.message) {
          addNotification({
            id: data.message.id || Date.now().toString(),
            title: data.message.title || "اعلان جدید",
            message: data.message.message || "",
            type: data.message.type || "info",
            read: false,
            createdAt: data.message.created_at || new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };

    ws.current.onclose = (event) => {
      console.log("WebSocket disconnected, attempting to reconnect...");
      const code = event?.code;
      if (code === 1008) {
        wsFailCount.current += 1;
        setWsDisabled(true);
        localStorage.setItem("notifications_ws_disabled", "true");
        return;
      }
      setTimeout(() => {
        if (wsDisabled) return;
        if (ws.current && ws.current.readyState !== WebSocket.OPEN) {
          const t = getToken();
          if (t) {
            const url2 = resolveWsUrl();
            ws.current =
              prot.length > 0 ? new WebSocket(url2, prot) : new WebSocket(url2);
          }
        }
      }, 5000);
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      wsFailCount.current += 1;
      if (wsFailCount.current >= 3) {
        setWsDisabled(true);
        localStorage.setItem("notifications_ws_disabled", "true");
      }
    };

    // Clean up WebSocket on unmount
    return () => {
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
    };
  }, [wsDisabled]);

  // Fetch unread forms count (kept for backward compatibility)
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
        if (currentCodeRef.current !== personal_code) {
          currentCodeRef.current = personal_code;
          try {
            const raw2 =
              localStorage.getItem(`notifications_${personal_code}`) || "[]";
            const parsed2 = JSON.parse(raw2);
            setNotifications(Array.isArray(parsed2) ? parsed2 : []);
          } catch (e) {
            setNotifications([]);
          }
        }
        const res = await fetchNotifications(personal_code);
        const list = Array.isArray(res?.notifications) ? res.notifications : [];
        // Merge unique by id
        const existingIds = new Set(notifications.map((n) => n.id));
        const incoming = list
          .filter((n) => !existingIds.has(String(n.id)))
          .map((n) => ({
            id: String(n.id),
            title: n.title || "اعلان",
            message: n.message || "",
            read: !!(n.is_read ?? n.read),
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
