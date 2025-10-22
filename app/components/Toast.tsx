"use client";

interface AlertModalProps {
  message: string;
  type?: "success" | "error" | "warning" | "info";
  onClose: () => void;
}

export default function AlertModal({ message, type = "warning", onClose }: AlertModalProps) {
  const typeConfig = {
    success: {
      bg: "bg-green-50",
      border: "border-green-500",
      icon: "✓",
      iconBg: "bg-green-500",
      title: "Berhasil!",
      titleColor: "text-green-800",
      buttonBg: "bg-green-600 hover:bg-green-700",
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-500",
      icon: "✕",
      iconBg: "bg-red-500",
      title: "Error!",
      titleColor: "text-red-800",
      buttonBg: "bg-red-600 hover:bg-red-700",
    },
    warning: {
      bg: "bg-yellow-50",
      border: "border-yellow-500",
      icon: "⚠",
      iconBg: "bg-yellow-500",
      title: "Peringatan!",
      titleColor: "text-yellow-800",
      buttonBg: "bg-yellow-600 hover:bg-yellow-700",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-500",
      icon: "ℹ",
      iconBg: "bg-blue-500",
      title: "Informasi",
      titleColor: "text-blue-800",
      buttonBg: "bg-blue-600 hover:bg-blue-700",
    },
  };

  const config = typeConfig[type];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-scale-in">
        {/* Header with Icon */}
        <div className={`${config.bg} border-b-4 ${config.border} rounded-t-2xl p-6 flex items-center gap-4`}>
          <div className={`${config.iconBg} text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg`}>
            {config.icon}
          </div>
          <h3 className={`text-2xl font-bold ${config.titleColor}`}>{config.title}</h3>
        </div>

        {/* Message */}
        <div className="p-6">
          <p className="text-gray-700 text-lg leading-relaxed">{message}</p>
        </div>

        {/* Button */}
        <div className="p-6 pt-0 flex justify-end">
          <button
            onClick={onClose}
            className={`${config.buttonBg} text-white px-8 py-3 rounded-lg font-semibold transition shadow-md hover:shadow-lg transform hover:scale-105`}
          >
            OK, Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}
