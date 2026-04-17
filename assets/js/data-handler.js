(function(window) {
  'use strict';

  const SHEET_URL =
    "https://opensheet.elk.sh/1L8m_uoBtYx-UIwqDy6D_TPHa_N7BygkAhmpYMHSUStg/APP_DATA";

  async function fetchRunData(options = {}) {
    try {
      const response = await fetch(SHEET_URL);

      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error("Data fetch error:", error);
      throw error;
    }
  }

  window.IronflowData = {
    fetch: fetchRunData
  };

})(window);