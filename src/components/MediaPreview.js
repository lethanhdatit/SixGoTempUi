import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { X, Download, ChevronLeft, ChevronRight } from "lucide-react";

const isImageUrl = (url) =>
  /\.(jpe?g|png|gif|bmp|webp|svg|tiff?|heic)$/i.test(url);

const isPdfUrl = (url) => /\.pdf$/i.test(url);

const isVideoUrl = (url) => /\.(mp4|webm|ogg|mov)$/i.test(url);

/**
 * Full-screen modal for previewing images (with gallery navigation),
 * PDFs (inline iframe), videos, and fallback download for other files.
 */
const MediaPreview = ({ url, title, onClose, gallery }) => {
  // gallery = [{ url, title }] — optional array for multi-image navigation
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentUrl = gallery ? gallery[currentIndex].url : url;
  const currentTitle = gallery ? gallery[currentIndex].title : title;

  // Set initial index when gallery changes
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
    // Lock body scroll (iOS Safari needs both)
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, [handleKeyDown]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const renderContent = () => {
    if (isImageUrl(currentUrl)) {
      return (
        <img
          src={currentUrl}
          alt={currentTitle || "Preview"}
          className="max-h-[85vh] max-w-[95vw] sm:max-w-[90vw] object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
      );
    }
    if (isPdfUrl(currentUrl)) {
      return (
        <iframe
          src={currentUrl}
          title={currentTitle || "PDF Preview"}
          className="w-[95vw] h-[85vh] sm:w-[80vw] rounded-lg bg-white"
          onClick={(e) => e.stopPropagation()}
        />
      );
    }
    if (isVideoUrl(currentUrl)) {
      return (
        <video
          src={currentUrl}
          controls
          className="max-h-[85vh] max-w-[95vw] sm:max-w-[90vw] rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
      );
    }
    // Fallback: download prompt
    return (
      <div
        className="bg-white rounded-lg p-6 sm:p-8 text-center max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-4xl mb-3">📄</div>
        <p className="text-gray-800 font-medium mb-1 break-words">
          {currentTitle || "File"}
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Preview is not available for this file type.
        </p>
        <a
          href={currentUrl}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Download size={16} />
          Download
        </a>
      </div>
    );
  };

  const showNav = gallery && gallery.length > 1;

  return ReactDOM.createPortal(
    <div
      className="flex items-center justify-center"
      onClick={handleBackdropClick}
      onTouchMove={(e) => e.preventDefault()}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100dvh",
        zIndex: 9999,
        backgroundColor: "rgba(0,0,0,0.92)",
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
        style={{ zIndex: 10000 }}
      >
        <X size={24} />
      </button>

      {/* Download button for images/videos */}
      {(isImageUrl(currentUrl) || isVideoUrl(currentUrl)) && (
        <a
          href={currentUrl}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-3 right-14 sm:top-4 sm:right-16 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
          onClick={(e) => e.stopPropagation()}
          style={{ zIndex: 10000 }}
        >
          <Download size={20} />
        </a>
      )}

      {/* Gallery counter */}
      {showNav && (
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 px-3 py-1 rounded-full bg-black/60 text-white text-sm" style={{ zIndex: 10000 }}>
          {currentIndex + 1} / {gallery.length}
        </div>
      )}

      {/* Previous button */}
      {showNav && currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCurrentIndex((i) => i - 1);
          }}
          className="absolute left-2 sm:left-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
          style={{ zIndex: 10000 }}
        >
          <ChevronLeft size={28} />
        </button>
      )}

      {/* Next button */}
      {showNav && currentIndex < gallery.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCurrentIndex((i) => i + 1);
          }}
          className="absolute right-2 sm:right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
          style={{ zIndex: 10000 }}
        >
          <ChevronRight size={28} />
        </button>
      )}

      {/* Content */}
      {renderContent()}

      {/* Title */}
      {currentTitle && (
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/60 text-white text-sm max-w-[80vw] truncate" style={{ zIndex: 10000 }}>
          {currentTitle}
        </div>
      )}
    </div>,
    document.body
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
