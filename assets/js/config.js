/**
 * IRONFLOW CLUB - Global Application Configuration
 * Centralized API proxy configuration and endpoint mappings.
 */
(function(window) {
  'use strict';

  window.IFC_CONFIG = {
    PROXY_URL: 'https://ironflow-proxy.syed-mujeebprojects.workers.dev',
    ONESIGNAL_APP_ID: '82207c5d-d78c-4fde-b5a0-5939771239a9',
    SHEET_ID: '1L8m_uoBtYx-UIwqDy6D_TPHa_N7BygkAhmpYMHSUStg',
    ADMIN_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbx5hJrtKlcude3vR5954psRtg0XUqsBa7tERzlV_avVcDE7FqigIyNeVxJn5dimW-w/exec',
    endpoints: {
      appData: 'https://opensheet.elk.sh/1L8m_uoBtYx-UIwqDy6D_TPHa_N7BygkAhmpYMHSUStg/APP_DATA',
      eventDetails: 'https://opensheet.elk.sh/1L8m_uoBtYx-UIwqDy6D_TPHa_N7BygkAhmpYMHSUStg/Event_details',
      memberDetails: 'https://opensheet.elk.sh/1L8m_uoBtYx-UIwqDy6D_TPHa_N7BygkAhmpYMHSUStg/Member_details',
      proxy: 'https://ironflow-proxy.syed-mujeebprojects.workers.dev'
    }
  };
})(window);
