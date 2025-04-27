import { useEffect, useRef } from "preact/hooks";
import { JSX } from "preact";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: JSX.Element | JSX.Element[];
  maxWidth?: string;
  closeOnOutsideClick?: boolean;
}

export function Modal({ 
  isOpen, 
  onClose, 
  children, 
  maxWidth = "max-w-4xl", 
  closeOnOutsideClick = true 
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Handle outside click to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (closeOnOutsideClick && modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      // Add the event listener with a slight delay to avoid triggering on the same click that opened the modal
      setTimeout(() => {
        document.addEventListener("mousedown", handleOutsideClick);
      }, 10);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen, onClose, closeOnOutsideClick]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center px-4 py-6 bg-black bg-opacity-50 dark:bg-opacity-50">
      <div ref={modalRef} className={`w-full ${maxWidth} rounded-lg shadow-xl relative`}>
        {children}
      </div>
    </div>
  );
} 
