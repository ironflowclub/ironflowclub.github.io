/**
 * IRONFLOW CLUB - Translations
 * Bilingual support (English & Chinese)
 */

(function(window) {
  'use strict';

  const translations = {
    en: {
      // Homepage
      kicker: "Men’s Movement Club",
      heroTitleHtml: `
        <span class="word"><span class="word-inner" style="--wd:80ms">Run,</span></span>
        <span class="word"><span class="word-inner" style="--wd:160ms"> Track</span></span><br>
        <span class="word"><span class="word-inner accent-line accent" style="--wd:260ms">Improve.</span></span>
      `,
      heroSub: "Built for men who move. Weekly runs, sport sessions, and a community that refuses to settle.",
      leaderboardBtn: "Running",
      progressBtn: "My Progress",
      badmintonBtn: "Badminton", 
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
      kicker: "男子运动俱乐部",
      heroTitleHtml: `
        <span class="word"><span class="word-inner" style="--wd:80ms">奔跑，</span></span>
        <span class="word"><span class="word-inner" style="--wd:160ms"> 记录</span></span><br>
        <span class="word"><span class="word-inner accent-line accent" style="--wd:260ms">进步。</span></span>
      `,
      heroSub: "为行动者而生。每周跑步、运动课程，以及一个永不止步的社群。",
      leaderboardBtn: "跑步",
      progressBtn: "我的进度",
      badmintonBtn: "羽毛球",
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