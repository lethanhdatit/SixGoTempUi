import { useState, useRef, useEffect } from "react";
import React from "react";
import { Copy, Check } from "lucide-react";

export const CopyableField = ({ value, label }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef(null);

  const trimmed = value?.trim();
  if (!trimmed) return null;

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(trimmed);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const toggleExpand = (e) => {
    e.stopPropagation();
    setExpanded((prev) => !prev);
  };

  return (
    <div className="flex items-center text-sm text-gray-600 mt-1 min-w-0">
      <span className="font-medium mr-2 shrink-0">{label}:</span>
      <OverflowText
        ref={textRef}
        text={trimmed}
        expanded={expanded}
        onOverflowChange={setIsOverflowing}
      />
      {isOverflowing && (
        <button
          onClick={toggleExpand}
          className="ml-1 text-indigo-500 hover:text-indigo-700 shrink-0 text-xs font-medium"
          title={expanded ? "Collapse" : "Show full"}
        >
          {expanded ? "▲" : "…"}
        </button>
      )}
      <button
        onClick={handleCopy}
        className={`ml-1 p-1 rounded-full transition-colors duration-200 shrink-0 ${
          copied ? "bg-green-100" : "hover:bg-gray-200"
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

const OverflowText = React.forwardRef(({ text, expanded, onOverflowChange }, ref) => {
  const innerRef = useRef(null);
  const combinedRef = ref || innerRef;

  useEffect(() => {
    const el = combinedRef.current;
    if (el) {
      onOverflowChange(el.scrollWidth > el.clientWidth);
    }
  });

  return (
    <span
      ref={combinedRef}
      className={expanded ? "break-all min-w-0" : "truncate min-w-0"}
    >
      {text}
    </span>
  );
});
