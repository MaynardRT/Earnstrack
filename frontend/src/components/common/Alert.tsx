import React from "react";
import { AlertCircle, CheckCircle, Info } from "lucide-react";

interface AlertProps {
  type: "error" | "success" | "info";
  title: string;
  message?: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  type,
  title,
  message,
  onClose,
}) => {
  const styles = {
    error:
      "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200",
    success:
      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200",
    info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200",
  };

  const icons = {
    error: <AlertCircle size={20} />,
    success: <CheckCircle size={20} />,
    info: <Info size={20} />,
  };

  return (
    <div
      className={`border rounded-lg p-4 pb-6 flex items-start space-x-3 ${styles[type]}`}
    >
      {icons[type]}
      <div className="flex-1">
        <h4 className="font-semibold">{title}</h4>
        {message && <p className="text-sm mt-1">{message}</p>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-xl opacity-70 hover:opacity-100"
        >
          ×
        </button>
      )}
    </div>
  );
};
