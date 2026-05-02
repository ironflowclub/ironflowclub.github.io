/**
 * IRONFLOW CLUB - Translations
 * Bilingual support (English & Chinese)
 */

(function(window) {
  'use strict';

  const translations = {
    en: {
      // Homepage
      kicker: "Running Club · Sharjah",
      heroTitleHtml: `
        <span class="word"><span class="word-inner" style="--wd:80ms">Run,</span></span>
        <span class="word"><span class="word-inner" style="--wd:160ms"> Track</span></span><br>
        <span class="word"><span class="word-inner accent-line accent" style="--wd:260ms">Improve.</span></span>
      `,
      heroSub: "Track your runs and watch your progress unfold. Built for runners who refuse to settle.",
      leaderboardBtn: "Leaderboard",
      progressBtn: "My Progress",
      chatBtn: "CHAT",
      quote: 'Motivation gets you going,<br> but <span class="em">discipline</span> keeps you growing.',
      rights: "All rights reserved",
      langToggle: "中文",

      // Stats
      totalKm: "Total KM",
      members: "Members",

      // Common
      home: "HOME",
      loading: "Loading data…",
      retry: "Try Again"
    },

    zh: {
      // Homepage
      kicker: "跑步俱乐部 · 沙迦",
      heroTitleHtml: `
        <span class="word"><span class="word-inner" style="--wd:80ms">奔跑，</span></span>
        <span class="word"><span class="word-inner" style="--wd:160ms"> 记录</span></span><br>
        <span class="word"><span class="word-inner accent-line accent" style="--wd:260ms">进步。</span></span>
      `,
      heroSub: "记录你的每一次奔跑，见证自己的成长。为不甘平庸的跑者而生。",
      leaderboardBtn: "排行榜",
      progressBtn: "我的进度",
      chatBtn: "聊天",
      quote: '动力让你出发，<br> 但<span class="em">自律</span>让你成长。',
      rights: "版权所有",
      langToggle: "EN",

      // Stats
      totalKm: "总公里",
      members: "成员",

      // Common
      home: "首页",
      loading: "加载数据中…",
      retry: "重试"
    }
  };

  let currentLang = 'en';

  const Translation = {
    /**
     * Get current language
     */
    getLang() {
      return currentLang;
    },

    /**
     * Set language
     * @param {string} lang - 'en' or 'zh'
     */
    setLang(lang) {
      if (!translations[lang]) {
        console.warn(`Language '${lang}' not supported`);
        return;
      }
      currentLang = lang;
      document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
    },

    /**
     * Get translation string
     * @param {string} key - Translation key
     * @returns {string}
     */
    t(key) {
      return translations[currentLang][key] || key;
    },

    /**
     * Toggle between languages
     */
    toggle() {
      const newLang = currentLang === 'en' ? 'zh' : 'en';
      this.setLang(newLang);
      return newLang;
    },

    /**
     * Get all translations for current language
     */
    getAll() {
      return translations[currentLang];
    }
  };

  // Export to global scope
  window.IronflowTranslation = Translation;

})(window);