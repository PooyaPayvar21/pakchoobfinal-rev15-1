import React from "react";
import Header from "../components/Common/Header";
import { useNotifications } from "../contexts/NotificationsContext";

const NotificationsPage = () => {
  const { notifications, markAsRead, markAllAsRead, removeNotification } =
    useNotifications();

  const isLight = document.documentElement.classList.contains("light");

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title="اعلان‌ها" />
      <main className="max-w-5xl mx-auto py-6 px-4 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <h2
            className={`text-lg font-medium ${
              isLight ? "text-gray-900" : "text-gray-100"
            }`}
          >
            لیست اعلان‌ها
          </h2>
          <button
            onClick={markAllAsRead}
            className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700"
          >
            علامت‌گذاری همه به عنوان خوانده‌شده
          </button>
        </div>

        <div
          className={`backdrop-blur-md shadow-lg rounded-xl border ${
            isLight
              ? "bg-white/90 border-gray-200"
              : "bg-gray-800/60 border-gray-700"
          }`}
        >
          {notifications.length === 0 ? (
            <div
              className={`p-6 text-center ${
                isLight ? "text-gray-600" : "text-gray-300"
              }`}
            >
              اعلانی وجود ندارد
            </div>
          ) : (
            <ul
              className={
                isLight
                  ? "divide-y divide-gray-200"
                  : "divide-y divide-gray-700"
              }
            >
              {notifications.map((n) => (
                <li key={n.id} className="p-4 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          n.read
                            ? isLight
                              ? "bg-gray-400"
                              : "bg-gray-500"
                            : "bg-red-500"
                        }`}
                      />
                      <span
                        className={`${
                          isLight ? "text-gray-900" : "text-gray-100"
                        } font-semibold`}
                      >
                        {n.title}
                      </span>
                      <span
                        className={`text-xs ${
                          isLight ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        {new Date(n.createdAt).toLocaleString("fa-IR")}
                      </span>
                    </div>
                    <div
                      className={`mt-1 text-sm ${
                        isLight ? "text-gray-700" : "text-gray-300"
                      }`}
                    >
                      {n.message}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!n.read && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700"
                      >
                        خواندن
                      </button>
                    )}
                    <button
                      onClick={() => removeNotification(n.id)}
                      className="px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700"
                    >
                      حذف
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
};

export default NotificationsPage;
