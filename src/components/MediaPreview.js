import React, { useState, useEffect, useCallback, useRef } from "react";
import ReactDOM from "react-dom";
import { X, Download, ChevronLeft, ChevronRight } from "lucide-react";

const isImageUrl = (url) =>
  /\.(jpe?g|png|gif|bmp|webp|svg|tiff?|heic)$/i.test(url);

const isPdfUrl = (url) => /\.pdf$/i.test(url);

const isVideoUrl = (url) => /\.(mp4|webm|ogg|mov)$/i.test(url);

// Get or create a dedicated portal root outside the React tree
const getPortalRoot = () => {
  let el = document.getElementById("media-preview-root");
  if (!el) {
    el = document.createElement("div");
    el.id = "media-preview-root";
    document.body.appendChild(el);
  }
  return el;
};

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: "100%",
  height: "100%",
  zIndex: 99999,
  backgroundColor: "rgba(0,0,0,0.92)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  WebkitOverflowScrolling: "touch",
};

const btnStyle = {
  position: "absolute",
  zIndex: 100000,
  padding: "8px",
  borderRadius: "50%",
  backgroundColor: "rgba(0,0,0,0.6)",
  color: "white",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const MediaPreview = ({ url, title, onClose, gallery }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollYRef = useRef(0);

  const currentUrl = gallery ? gallery[currentIndex].url : url;
  const currentTitle = gallery ? gallery[currentIndex].title : title;

  useEffect(() => {
    if (gallery && url) {
      const idx = gallery.findIndex((g) => g.url === url);
      if (idx >= 0) setCurrentIndex(idx);
    }
  }, [gallery, url]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") onClose();
      if (gallery) {
        if (e.key === "ArrowLeft" && currentIndex > 0)
          setCurrentIndex((i) => i - 1);
        if (e.key === "ArrowRight" && currentIndex < gallery.length - 1)
          setCurrentIndex((i) => i + 1);
      }
    },
    [onClose, gallery, currentIndex]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    // iOS Safari scroll lock
    scrollYRef.current = window.scrollY;
    const html = document.documentElement;
    const body = document.body;
    html.style.overflow = "hidden";
    html.style.height = "100%";
    body.style.overflow = "hidden";
    body.style.height = "100%";
    body.style.position = "fixed";
    body.style.top = `-${scrollYRef.current}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";

    // Block touch scrolling on the background
    const preventTouch = (e) => e.preventDefault();
    document.addEventListener("touchmove", preventTouch, { passive: false });

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("touchmove", preventTouch);
      html.style.overflow = "";
      html.style.height = "";
      body.style.overflow = "";
      body.style.height = "";
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      window.scrollTo(0, scrollYRef.current);
    };
  }, [handleKeyDown]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const renderContent = () => {
    const imgStyle = {
      maxHeight: "80vh",
      maxWidth: "95vw",
      objectFit: "contain",
      borderRadius: "8px",
    };
    if (isImageUrl(currentUrl)) {
      return (
        <img
          src={currentUrl}
          alt={currentTitle || "Preview"}
          style={imgStyle}
          onClick={(e) => e.stopPropagation()}
        />
      );
    }
    if (isPdfUrl(currentUrl)) {
      return (
        <iframe
          src={currentUrl}
          title={currentTitle || "PDF Preview"}
          style={{ width: "95vw", height: "80vh", borderRadius: "8px", backgroundColor: "white" }}
          onClick={(e) => e.stopPropagation()}
        />
      );
    }
    if (isVideoUrl(currentUrl)) {
      return (
        <video
          src={currentUrl}
          controls
          style={imgStyle}
          onClick={(e) => e.stopPropagation()}
        />
      );
    }
    return (
      <div
        style={{ background: "white", borderRadius: "12px", padding: "24px", textAlign: "center", maxWidth: "320px", margin: "0 16px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>📄</div>
        <p style={{ color: "#1f2937", fontWeight: 500, marginBottom: "4px", wordBreak: "break-word" }}>
          {currentTitle || "File"}
        </p>
        <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "16px" }}>
          Preview is not available for this file type.
        </p>
        <a
          href={currentUrl}
          download
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", backgroundColor: "#2563eb", color: "white", borderRadius: "8px", textDecoration: "none" }}
        >
          <Download size={16} />
          Download
        </a>
      </div>
    );
  };

  const showNav = gallery && gallery.length > 1;

  return ReactDOM.createPortal(
    <div style={overlayStyle} onClick={handleBackdropClick}>
      {/* Close */}
      <button onClick={onClose} style={{ ...btnStyle, top: 12, right: 12 }}>
        <X size={24} />
      </button>

      {/* Download */}
      {(isImageUrl(currentUrl) || isVideoUrl(currentUrl)) && (
        <a
          href={currentUrl}
          download
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{ ...btnStyle, top: 12, right: 56, textDecoration: "none" }}
        >
          <Download size={20} />
        </a>
      )}

      {/* Counter */}
      {showNav && (
        <div style={{ ...btnStyle, top: 12, left: 12, borderRadius: "20px", padding: "4px 12px", fontSize: "14px", cursor: "default" }}>
          {currentIndex + 1} / {gallery.length}
        </div>
      )}

      {/* Prev */}
      {showNav && currentIndex > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); setCurrentIndex((i) => i - 1); }}
          style={{ ...btnStyle, left: 8, top: "50%", transform: "translateY(-50%)" }}
        >
          <ChevronLeft size={28} />
        </button>
      )}

      {/* Next */}
      {showNav && currentIndex < gallery.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); setCurrentIndex((i) => i + 1); }}
          style={{ ...btnStyle, right: 8, top: "50%", transform: "translateY(-50%)" }}
        >
          <ChevronRight size={28} />
        </button>
      )}

      {renderContent()}

      {/* Title */}
      {currentTitle && (
        <div style={{
          position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
          zIndex: 100000, padding: "6px 16px", borderRadius: "20px",
          backgroundColor: "rgba(0,0,0,0.6)", color: "white", fontSize: "13px",
          maxWidth: "80vw", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {currentTitle}
        </div>
      )}
    </div>,
    getPortalRoot()
  );
};

/**
 * Clickable image thumbnail that opens the lightbox.
 * Use gallery prop (array of {url, title}) for multi-image navigation.
 */
export const PreviewableImage = ({ url, alt, className, gallery }) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <>
      <img
        src={url}
        alt={alt || "Image"}
        className={`cursor-pointer ${className || ""}`}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setShowPreview(true);
        }}
      />
      {showPreview && (
        <MediaPreview
          url={url}
          title={alt}
          onClose={() => setShowPreview(false)}
          gallery={gallery}
        />
      )}
    </>
  );
};

/**
 * Clickable file attachment that opens preview (or downloads if not previewable).
 */
export const PreviewableFile = ({ url, displayName }) => {
  const [showPreview, setShowPreview] = useState(false);
  const canPreview = isPdfUrl(url) || isVideoUrl(url);

  if (!canPreview) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        download
        onClick={(e) => e.stopPropagation()}
        className="flex items-center space-x-1 text-blue-600 underline hover:text-blue-800"
      >
        📎
        <span>{displayName || "File"}</span>
      </a>
    );
  }

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowPreview(true);
        }}
        className="flex items-center space-x-1 text-blue-600 underline hover:text-blue-800 cursor-pointer"
      >
        {isPdfUrl(url) ? "📄" : "🎬"}
        <span>{displayName || "File"}</span>
      </button>
      {showPreview && (
        <MediaPreview
          url={url}
          title={displayName}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
};

export default MediaPreview;
