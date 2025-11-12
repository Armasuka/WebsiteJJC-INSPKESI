"use client";

import { useEffect } from "react";

interface ToastNotificationProps {
  message: string;
  type?: "success" | "error" | "warning" | "info";
  onClose: () => void;
  duration?: number;
}

export default function ToastNotification({ 
  message, 
  type = "success", 
  onClose,
  duration = 4000 
}: ToastNotificationProps) {
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeConfig = {
    success: {
      bg: "bg-gradient-to-r from-green-500 to-emerald-600",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      ),
      iconBg: "bg-white/20",
      borderColor: "border-green-400",
    },
    error: {
      bg: "bg-gradient-to-r from-red-500 to-rose-600",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      iconBg: "bg-white/20",
      borderColor: "border-red-400",
    },
    warning: {
      bg: "bg-gradient-to-r from-yellow-500 to-amber-600",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      iconBg: "bg-white/20",
      borderColor: "border-yellow-400",
    },
    info: {
      bg: "bg-gradient-to-r from-blue-500 to-indigo-600",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: "bg-white/20",
      borderColor: "border-blue-400",
    },
  };

  const config = typeConfig[type];

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-slide-in-right">
      <div 
        className={`${config.bg} text-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border-2 ${config.borderColor}`}
        style={{
          animation: "slideInRight 0.3s ease-out, fadeOut 0.5s ease-in " + (duration - 500) + "ms"
        }}
      >
        <div className="flex items-center gap-4 p-4">
          {/* Icon */}
          <div className={`${config.iconBg} backdrop-blur-sm w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0`}>
            {config.icon}
          </div>
          
          {/* Message */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-base leading-relaxed break-words">
              {message}
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-all flex-shrink-0"
            aria-label="Close notification"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-white/20">
          <div 
            className="h-full bg-white/60"
            style={{
              animation: `progress ${duration}ms linear`
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}
