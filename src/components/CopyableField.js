import { useState } from "react";
import { Copy, Check } from "lucide-react";

const renderRichContent = (text) => {
  // Matches: URLs, **bold**, *italic*
  const tokenRegex = /(https?:\/\/[^\s]+)|\*\*(.+?)\*\*|\*([^*]+?)\*/g;

  const result = [];
  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push(<span key={`t${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>);
    }

    if (match[1]) {
      result.push(
        <a key={`u${match.index}`} href={match[1]} target="_blank" rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-blue-600 underline hover:text-blue-800">
          {match[1]}
        </a>
      );
    } else if (match[2]) {
      result.push(<strong key={`b${match.index}`}>{match[2]}</strong>);
    } else if (match[3]) {
      result.push(<em key={`i${match.index}`}>{match[3]}</em>);
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    result.push(<span key={`t${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }

  return result.length > 0 ? result : [<span key="0">{text}</span>];
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
      <span className="break-words min-w-0 whitespace-pre-wrap">{renderRichContent(trimmed)}</span>
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
