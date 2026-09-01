"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { playSuccessSound, playWarningSound, playErrorSound, playInfoSound } from "@/lib/notification-sound";

export type ToastType = "success" | "info" | "warning" | "error";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  dismissible?: boolean;
  onDismiss?: () => void;
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

function getToastStyles(type: ToastType) {
  const styles = {
    success: {
      bg: "bg-emerald-50 border-emerald-200",
      icon: <CheckCircle className="text-emerald-600" size={24} />,
      text: "text-emerald-900",
      button: "bg-emerald-600 hover:bg-emerald-700",
    },
    info: {
      bg: "bg-blue-50 border-blue-200",
      icon: <Info className="text-blue-600" size={24} />,
      text: "text-blue-900",
      button: "bg-blue-600 hover:bg-blue-700",
    },
    warning: {
      bg: "bg-amber-50 border-amber-200",
      icon: <AlertTriangle className="text-amber-600" size={24} />,
      text: "text-amber-900",
      button: "bg-amber-600 hover:bg-amber-700",
    },
    error: {
      bg: "bg-rose-50 border-rose-200",
      icon: <AlertCircle className="text-rose-600" size={24} />,
      text: "text-rose-900",
      button: "bg-rose-600 hover:bg-rose-700",
    },
  };

  return styles[type];
}

export function Toast({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(true);
  const styles = getToastStyles(toast.type);

  useEffect(() => {
    if (!toast.duration) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onDismiss(toast.id);
        toast.onDismiss?.();
      }, 300);
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!isVisible) return null;

  return (
    <div
      className={`
        fixed bottom-6 right-6 max-w-sm transform transition-all duration-300 z-50
        ${isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}
      `}
    >
      <div className={`rounded-2xl border-2 ${styles.bg} p-5 shadow-2xl`}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-0.5">{styles.icon}</div>
          <div className="flex-1 min-w-0">
            <p className={`font-semibold ${styles.text} break-words`}>{toast.message}</p>
          </div>
          {toast.dismissible !== false && (
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => {
                  onDismiss(toast.id);
                  toast.onDismiss?.();
                }, 300);
              }}
              className={`flex-shrink-0 p-2 rounded-lg transition ${styles.button} text-white hover:shadow-lg`}
              aria-label="Dismiss notification"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-0 right-0 p-6 pointer-events-none space-y-4 z-50">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}

/**
 * Hook to manage toast notifications
 */
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info", duration = 4000) => {
    const id = Math.random().toString(36).substr(2, 9);

    // Play sound based on type
    if (type === "success") playSuccessSound();
    else if (type === "error") playErrorSound();
    else if (type === "warning") playWarningSound();
    else if (type === "info") playInfoSound();

    const toast: Toast = { id, message, type, duration, dismissible: true };
    setToasts((prev) => [...prev, toast]);

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((message: string, duration?: number) => addToast(message, "success", duration), [addToast]);
  const error = useCallback((message: string, duration?: number) => addToast(message, "error", duration || 5000), [addToast]);
  const warning = useCallback((message: string, duration?: number) => addToast(message, "warning", duration), [addToast]);
  const info = useCallback((message: string, duration?: number) => addToast(message, "info", duration), [addToast]);

  return useMemo(
    () => ({
      toasts,
      addToast,
      removeToast,
      success,
      error,
      warning,
      info,
    }),
    [toasts, addToast, removeToast, success, error, warning, info],
  );
}
