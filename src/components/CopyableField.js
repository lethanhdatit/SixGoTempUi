import { useState } from "react";
import { Copy, Check } from "lucide-react";

const urlRegex = /(https?:\/\/[^\s]+)/g;

const renderWithLinks = (text) => {
  const parts = text.split(urlRegex);
  return parts.map((part, i) =>
    urlRegex.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="text-blue-600 underline hover:text-blue-800"
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
};

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
    <div className="flex items-start sm:items-center text-sm text-gray-600 mt-1 min-w-0">
      {label && (<span className="font-medium mr-2 shrink-0">{label}:</span>)}
      <span className="break-words min-w-0">{renderWithLinks(trimmed)}</span>
      <button
        onClick={handleCopy}
        className={`ml-1 p-1 rounded-full transition-colors duration-200 shrink-0 ${copied ? "bg-green-100" : "hover:bg-gray-200"
          }`}
        title={copied ? "Copied!" : "Copy"}
      >
        {copied ? (
          <Check size={14} className="text-green-600" />
        ) : (
          <Copy size={14} className="text-gray-500" />
        )}
      </button>
    </div>
  );
};
