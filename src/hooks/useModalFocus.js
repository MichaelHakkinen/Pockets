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
// Shared across all modal instances so overlapping modals don't unlock the page early
let lockCount = 0;
let savedLock = null;

export function useModalFocus(isOpen, onClose) {
  const modalRef = useRef(null);
  const [isNudging, setIsNudging] = useState(false);

  // Keep the latest onClose without re-running the lock effect on every parent render
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Background click handler: ignores closing and gives a tactile/visual attention nudge
  const handleBackdropClick = useCallback((e) => {
    // Only respond if the click was directly on the backdrop itself
    if (e.target === e.currentTarget) {
      e.stopPropagation();
      e.preventDefault();
      triggerHaptic('light');
      setIsNudging(true);
      setTimeout(() => setIsNudging(false), 300);
    }
  }, []);

  // Manage body scroll locking, overscroll chaining containment, and keyboard accessibility
  useEffect(() => {
    if (!isOpen) return;

    // Only the first open modal locks the page; later ones just bump the counter
    if (lockCount === 0) {
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      savedLock = {
        scrollY,
        position: document.body.style.position,
        top: document.body.style.top,
        width: document.body.style.width,
        overflow: document.body.style.overflow,
      };

      document.documentElement.classList.add('modal-open');
      document.body.classList.add('modal-open');

      // Fixed body prevents background scroll leaks on iOS / mobile
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    }
    lockCount += 1;

    // Prevent wheel events from chaining to background
    const handleWheel = (e) => {
      if (!modalRef.current) return;
      const modal = modalRef.current;
      const isInside = modal.contains(e.target);

      if (!isInside) {
        // Scrolling on backdrop: block it completely
        e.preventDefault();
        return;
      }

      // Check if modal container is at its scroll boundaries
      const { scrollTop, scrollHeight, clientHeight } = modal;
      const isScrollingDown = e.deltaY > 0;
      const isScrollingUp = e.deltaY < 0;

      if (isScrollingDown && scrollTop + clientHeight >= scrollHeight - 1) {
        // Reached the max bottom: prevent scroll leak to background
        e.preventDefault();
      } else if (isScrollingUp && scrollTop <= 0) {
        // Reached the top: prevent scroll leak to background
        e.preventDefault();
      }
    };

    // Prevent touch scrolling leaks on mobile (rubberband/overscroll chaining)
    let startY = 0;
    const handleTouchStart = (e) => {
      if (e.touches && e.touches[0]) {
        startY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e) => {
      if (!modalRef.current) return;
      const modal = modalRef.current;
      const isInside = modal.contains(e.target);

      if (!isInside) {
        // Touching/dragging on backdrop: block completely
        if (e.cancelable) e.preventDefault();
        return;
      }

      if (e.touches && e.touches[0]) {
        const currentY = e.touches[0].clientY;
        const deltaY = currentY - startY; // positive = pulling down, negative = pulling up
        const { scrollTop, scrollHeight, clientHeight } = modal;

        // At max bottom and pulling up
        if (deltaY < 0 && scrollTop + clientHeight >= scrollHeight - 1) {
          if (e.cancelable) e.preventDefault();
        }
        // At top and pulling down
        else if (deltaY > 0 && scrollTop <= 0) {
          if (e.cancelable) e.preventDefault();
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    const handleKeyDown = (e) => {
      // Escape key closes the modal
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current?.();
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
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);

      lockCount -= 1;
      if (lockCount === 0 && savedLock) {
        const { scrollY, position, top, width, overflow } = savedLock;
        savedLock = null;
        document.body.style.position = position;
        document.body.style.top = top;
        document.body.style.width = width;
        document.body.style.overflow = overflow;

        document.documentElement.classList.remove('modal-open');
        document.body.classList.remove('modal-open');

        window.scrollTo(0, scrollY);
      }
    };
  }, [isOpen]);

  return { modalRef, isNudging, handleBackdropClick };
}
