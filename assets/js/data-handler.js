/**
 * IRONFLOW CLUB - Data Handler
 * Fetches run data from Google Sheets via opensheet.elk.sh
 * Supports onProgress, onError callbacks + retry + timeout
 */

(function(window) {
  'use strict';

  const SHEET_URL =
    "https://opensheet.elk.sh/1L8m_uoBtYx-UIwqDy6D_TPHa_N7BygkAhmpYMHSUStg/APP_DATA";

  const MAX_RETRIES = 3;
  const TIMEOUT_MS  = 10000; // 10 seconds per attempt

  /**
   * Fetch with a timeout
   */
  function fetchWithTimeout(url, ms) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return fetch(url, { signal: controller.signal })
      .finally(() => clearTimeout(timer));
  }

  /**
   * Main fetch function
   * @param {object} options
   * @param {function} options.onProgress - called with a status message string
   * @param {function} options.onError    - called with (message, isCritical)
   * @returns {Promise<Array>}
   */
  async function fetchRunData(options = {}) {
    const { onProgress, onError } = options;

    const notify  = (msg)           => typeof onProgress === 'function' && onProgress(msg);
    const warning = (msg, critical) => typeof onError    === 'function' && onError(msg, critical);

    let lastError = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const isRetry = attempt > 1;

      notify(isRetry
        ? `Retrying… (${attempt}/${MAX_RETRIES})`
        : 'Loading leaderboard data…'
      );

      try {
        const response = await fetchWithTimeout(SHEET_URL, TIMEOUT_MS);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('Sheet returned empty or invalid data');
        }

        return data;

      } catch (err) {
        lastError = err;
        const isAbort = err.name === 'AbortError';

        console.warn(`Fetch attempt ${attempt} failed:`, err.message);

        // Non-critical warning after first failure (if more retries remain)
        if (attempt < MAX_RETRIES) {
          warning(
            isAbort
              ? `Request timed out — retrying (${attempt}/${MAX_RETRIES})…`
              : `Could not load data — retrying…`,
            false
          );
          // Brief pause before retry
          await new Promise(res => setTimeout(res, 1000 * attempt));
        }
      }
    }

    // All retries exhausted
    console.error('All fetch attempts failed:', lastError);
    warning(
      'Could not load leaderboard data. Check your connection and try again.',
      true // isCritical — shows Retry button
    );

    throw lastError;
  }

  window.IronflowData = {
    fetch: fetchRunData
  };

})(window);