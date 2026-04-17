/**
 * IRONFLOW CLUB - Utility Functions
 * Shared helper functions across all pages
 */

(function(window) {
  'use strict';

  const Utils = {
    /**
     * Parse pace string (M:SS) to decimal minutes
     * @param {string} str - Pace in format "5:30"
     * @returns {number} - Pace in decimal minutes (5.5)
     */
    parsePace(str) {
      if (!str) return 999;
      const [m, s] = String(str).split(":").map(Number);
      return m + (s || 0) / 60;
    },

    /**
     * Format decimal pace to M:SS
     * @param {number} decimal - Pace in decimal (5.5)
     * @returns {string} - Formatted pace "5:30"
     */
    formatPace(decimal) {
      const m = Math.floor(decimal);
      const s = Math.round((decimal - m) * 60);
      return `${m}:${String(s).padStart(2, "0")}`;
    },

    /**
     * Format pace with unit
     * @param {number} decimal - Pace in decimal
     * @returns {string} - "5:30 /km"
     */
    paceLabel(decimal) {
      return this.formatPace(decimal) + " /km";
    },

    /**
     * Extract YYYY-MM from date string
     * @param {string} dateStr - Date in format "2024-01-15"
     * @returns {string} - "2024-01"
     */
    ym(dateStr) {
      return String(dateStr).slice(0, 7);
    },

    /**
     * Format month key to readable label
     * @param {string} ymKey - "2024-01"
     * @returns {string} - "Jan 2024"
     */
    monthLabel(ymKey) {
      const [y, m] = ymKey.split("-");
      return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric"
      });
    },

    /**
     * Get initials from name
     * @param {string} name - "John Doe"
     * @returns {string} - "JD"
     */
    initials(name) {
      return String(name)
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(p => (p[0] || "").toUpperCase())
        .join("");
    },

    /**
     * Format date to short format
     * @param {string} dateStr - "2024-01-15"
     * @returns {string} - "15 Jan"
     */
    fmtDateShort(dateStr) {
      const d = new Date(dateStr + "T00:00:00");
      return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short"
      });
    },

    /**
     * Format date to full format
     * @param {string} dateStr - "2024-01-15"
     * @returns {string} - "15 Jan 2024"
     */
    fmtDate(dateStr) {
      const d = new Date(dateStr + "T00:00:00");
      return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    },

    /**
     * Clear all children from DOM element
     * @param {HTMLElement} el - Element to clear
     */
    clearElement(el) {
      while (el.firstChild) {
        el.removeChild(el.firstChild);
      }
    },

    /**
     * Add button ripple effect
     * @param {HTMLElement} btn - Button element
     * @param {PointerEvent} e - Pointer event
     */
    addRipple(btn, e) {
      const r = document.createElement("span");
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.4;

      r.className = "btn-ripple";
      r.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${e.clientX - rect.left - size/2}px;
        top: ${e.clientY - rect.top - size/2}px;
      `;

      btn.appendChild(r);
      setTimeout(() => r.remove(), 700);
    },

    /**
     * Check if user prefers reduced motion
     * @returns {boolean}
     */
    prefersReducedMotion() {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    },

    /**
     * Debounce function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function}
     */
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }
  };

  // Export to global scope
  window.IronflowUtils = Utils;

})(window);