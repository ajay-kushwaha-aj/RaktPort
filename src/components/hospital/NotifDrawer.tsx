// hospital/NotifDrawer.tsx
import { Bell, BellOff, CheckCheck, Trash, X } from "lucide-react";
import type { Notification } from "./types";

export const NotifDrawer = ({
  isOpen, notifs, onClose, onMarkRead, onMarkAllRead, onClear,
}: {
  isOpen: boolean; notifs: Notification[];
  onClose: () => void; onMarkRead: (id: string) => void;
  onMarkAllRead: () => void; onClear: () => void;
}) => {
  if (!isOpen) return null;
  const unread = notifs.filter(n => !n.read).length;
  return (
    <>
      <div className="fixed inset-0 bg-black/15 z-40" onClick={onClose} />
      <div className="fixed top-[70px] right-4 w-80 max-h-[75vh] overflow-hidden z-50 rounded-2xl shadow-2xl border border-[var(--border-color)] dark:border-gray-700 bg-[var(--bg-surface)] dark:bg-gray-900 flex flex-col hd-enter-sm">
        <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <h3 className="font-bold text-[var(--text-primary)] dark:text-gray-100 flex items-center gap-2 text-sm">
            <Bell className="w-4 h-4 text-[var(--clr-brand)]" /> Notifications
            {unread > 0 && <span className="bg-[var(--clr-brand)] text-[var(--txt-inverse)] text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unread}</span>}
          </h3>
          <div className="flex items-center gap-1">
            {unread > 0 && (
              <button onClick={onMarkAllRead} title="Mark all read"
                className="w-7 h-7 rounded-lg bg-[var(--bg-page)] dark:bg-gray-800 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-700 text-[var(--text-secondary)] dark:text-gray-400 flex items-center justify-center transition-colors">
                <CheckCheck className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={onClear} title="Clear all"
              className="w-7 h-7 rounded-lg bg-[var(--bg-page)] dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-[var(--clr-danger)] text-[var(--text-secondary)] dark:text-gray-400 flex items-center justify-center transition-colors">
              <Trash className="w-3.5 h-3.5" />
            </button>
            <button onClick={onClose} className="w-7 h-7 rounded-lg bg-[var(--bg-page)] dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center">
              <X className="w-3.5 h-3.5 text-[var(--text-secondary)] dark:text-gray-300" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 divide-y divide-gray-50 dark:divide-gray-800">
          {notifs.length === 0 ? (
            <div className="p-8 text-center">
              <BellOff className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
              <p className="text-sm text-gray-400 dark:text-[var(--text-secondary)]">No notifications</p>
            </div>
          ) : notifs.map(n => (
            <div key={n.id}
              className={`px-4 py-3 hover:bg-[var(--bg-page)] dark:hover:bg-gray-800/50 cursor-pointer transition-colors flex items-start gap-2 ${n.read ? "opacity-60" : ""}`}
              onClick={() => onMarkRead(n.id)}>
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.type === "alert" ? "bg-[var(--clr-danger)]" : n.type === "update" ? "bg-[var(--clr-info)]" : n.type === "system" ? "bg-gray-400" : "bg-[var(--clr-success)]"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">{n.message}</p>
                <p className="text-[10px] text-gray-400 dark:text-[var(--text-secondary)] mt-0.5">{n.time}</p>
              </div>
              {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-[var(--clr-brand)] mt-2 flex-shrink-0" />}
            </div>
          ))}
        </div>
        {notifs.length > 0 && (
          <div className="p-3 border-t dark:border-gray-700 flex-shrink-0 bg-[var(--bg-page)] dark:bg-gray-800/50">
            <p className="text-[11px] text-gray-400 dark:text-[var(--text-secondary)] text-center">Click notification to mark as read</p>
          </div>
        )}
      </div>
    </>
  );
};
