import { useEffect, useRef, useState, useCallback } from 'react';
import { triggerHaptic } from '../utils/audio';

/**
 * Custom hook to lock focus onto modals, prevent background interaction,
 * trap keyboard Tab focus, handle Escape to close, and ignore backdrop clicks
 * while providing an attention nudge animation.
 *
 * @param {boolean} isOpen - Whether the modal is currently open
 * @param {Function} onClose - Callback to close the modal (e.g. on Escape key)
 * @returns {{ modalRef: React.RefObject, isNudging: boolean, handleBackdropClick: Function }}
 */
export function useModalFocus(isOpen, onClose) {
  const modalRef = useRef(null);
  const [isNudging, setIsNudging] = useState(false);

  // Background click handler: ignores closing and gives a tactile/visual attention nudge
  const handleBackdropClick = useCallback((e) => {
    // Only respond if the click was directly on the backdrop itself
    if (e.target === e.currentTarget) {
      triggerHaptic('light');
      setIsNudging(true);
      setTimeout(() => setIsNudging(false), 300);
    }
  }, []);

  // Manage body scroll locking and keyboard accessibility (Tab trap & Escape key)
  useEffect(() => {
    if (!isOpen) return;

    // Add modal-open class to document body to lock scroll and disable background interactions
    document.body.classList.add('modal-open');

    const handleKeyDown = (e) => {
      // Escape key closes the modal
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
        return;
      }

      // Tab trap inside the modal container
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return { modalRef, isNudging, handleBackdropClick };
}
