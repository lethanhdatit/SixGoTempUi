import { useState } from "react";
import { Copy, Check } from "lucide-react";

export const CopyableField = ({ value, label }) => {
  const [copied, setCopied] = useState(false);

  const trimmed = value?.trim();
  if (!trimmed) return null;

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(trimmed);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center text-sm text-gray-600 mt-1">
      <span className="font-medium mr-2">{label}:</span>
      <span className="truncate">{trimmed}</span>
      <button
        onClick={handleCopy}
        className={`ml-2 p-1 rounded-full transition-colors duration-200 ${
          copied ? "bg-green-100" : "hover:bg-gray-200"
        }`}
        title={copied ? "Copied!" : "Copy"}
      >
        {copied ? (
          <Check size={16} className="text-green-600" />
        ) : (
          <Copy size={16} className="text-gray-500" />
        )}
      </button>
    </div>
  );
};
