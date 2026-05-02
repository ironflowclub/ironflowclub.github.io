/**
 * IRONFLOW CLUB - Leaderboard Script (v2)
 * Tabs: Most Consistent | Highest Distance | Best Pace (min 4 runs)
 */

(function () {
  'use strict';

  if (!window.IronflowData || !window.IronflowUtils) {
    console.error('Dependencies not loaded');
    return;
  }

  const Utils = window.IronflowUtils;
  const MONTH_ALL = 'ALL';
  const PACE_MIN_RUNS = 4;

  let allData = [];
  let chart = null;
  let activeTab = 'consistent'; // 'consistent' | 'distance' | 'pace'

  // DOM Elements
  const monthSelect = document.getElementById('monthSelect');
  const top3El = document.getElementById('top3');
  const listEl = document.getElementById('list');
  const modal = document.getElementById('modal');
  const closeModalBtn = document.getElementById('closeModal');
  const tabBtns = document.querySelectorAll('.lb-tab');
  const improvedBanner = document.getElementById('improvedBanner');

  /* ─── Compute ──────────────────────────────────────────── */

  function getFilteredData(monthKey) {
    return monthKey === MONTH_ALL
      ? allData
      : allData.filter(r => Utils.ym(r.event_date) === monthKey);
  }

  function getMemberStats(monthKey) {
    const monthData = getFilteredData(monthKey);
    const members = [...new Set(allData.map(r => r.member_name))];

    return members.map(name => {
      const allRuns = allData.filter(r => r.member_name === name);
      const runs = monthData.filter(r => r.member_name === name);
      const totalDist = runs.reduce((s, r) => s + parseFloat(r.distance_km || 0), 0);
      const totalTime = runs.reduce((s, r) => s + parseFloat(r.moving_time_min || 0), 0);
      const overallPace = totalDist > 0 ? totalTime / totalDist : 999;
      const bestPace = runs.length ? Math.min(...runs.map(r => Utils.parsePace(r.avg_pace))) : 999;
      const firstRun = allRuns.slice().sort((a, b) => a.event_date.localeCompare(b.event_date))[0];
      const daysSinceJoin = (new Date() - new Date(firstRun.event_date)) / (1000 * 60 * 60 * 24);
      const isNewcomer = daysSinceJoin <= 30;

      return {
        member_name: name,
        totalDist,
        totalTime,
        overallPace,
        bestPace,
        runs: runs.length,
        isNewcomer
      };
    });
  }

  function computeConsistent(monthKey) {
    return getMemberStats(monthKey)
      .filter(r => r.runs > 0)
      .sort((a, b) => b.runs - a.runs || a.overallPace - b.overallPace);
  }

  function computeDistance(monthKey) {
    return getMemberStats(monthKey)
      .filter(r => r.runs > 0)
      .sort((a, b) => b.totalDist - a.totalDist || a.overallPace - b.overallPace);
  }

  function computePace(monthKey) {
    const all = getMemberStats(monthKey).filter(r => r.runs > 0);
    const qualified = all.filter(r => r.runs >= PACE_MIN_RUNS)
      .sort((a, b) => a.overallPace - b.overallPace);
    const unqualified = all.filter(r => r.runs < PACE_MIN_RUNS)
      .sort((a, b) => b.runs - a.runs);
    return { qualified, unqualified };
  }

  /* ─── Most Improved Banner ─────────────────────────────── */

  function computeMostImproved() {
    const members = [...new Set(allData.map(r => r.member_name))];
    let best = null;
    let bestImprovement = 0;

    members.forEach(name => {
      const runs = allData
        .filter(r => r.member_name === name)
        .sort((a, b) => a.event_date.localeCompare(b.event_date));
      if (runs.length < 3) return;

      const first = runs.slice(0, 2);
      const last = runs.slice(-2);
      const earlyPace = first.reduce((s, r) => s + Utils.parsePace(r.avg_pace), 0) / first.length;
      const latePace = last.reduce((s, r) => s + Utils.parsePace(r.avg_pace), 0) / last.length;
      const improvement = earlyPace - latePace; // positive = got faster

      if (improvement > bestImprovement) {
        bestImprovement = improvement;
        best = { name, improvement, earlyPace, latePace };
      }
    });

    return best;
  }

  function renderImprovedBanner() {
    if (!improvedBanner) return;
    const imp = computeMostImproved();
    if (!imp || imp.improvement <= 0) {
      improvedBanner.style.display = 'none';
      return;
    }
    const secs = Math.round(imp.improvement * 60);
    improvedBanner.style.display = '';
    improvedBanner.innerHTML = `
      <span class="imp-icon">📈</span>
      <span class="imp-text">
        <strong>${imp.name}</strong> is most improved —
        ${secs}s/km faster than their first runs
      </span>
    `;
  }

  /* ─── Render ────────────────────────────────────────────── */

  function render(monthKey) {
    Utils.clearElement(top3El);
    Utils.clearElement(listEl);

    if (activeTab === 'consistent') renderConsistent(monthKey);
    else if (activeTab === 'distance') renderDistance(monthKey);
    else if (activeTab === 'pace') renderPace(monthKey);
  }

  function renderConsistent(monthKey) {
    const data = computeConsistent(monthKey);
    if (!data.length) { renderEmpty(); return; }
    renderTop3(data, r => ({
      score: `${r.runs} runs`,
      sub: ``
    }));
    renderList(data, r => ({
      score: `${r.runs}`,
      scoreUnit: 'runs',
      label: 'Runs',
      sub: `${r.totalDist.toFixed(1)} km`
    }));
  }

  function renderDistance(monthKey) {
    const data = computeDistance(monthKey);
    if (!data.length) { renderEmpty(); return; }
    renderTop3(data, r => ({
      score: `${r.totalDist.toFixed(1)} km`,
      sub: `${r.runs} runs`
    }));
    renderList(data, r => ({
      score: `${r.totalDist.toFixed(1)}`,
      scoreUnit: 'km',
      label: 'Distance',
      sub: ``
    }));
  }

  function renderPace(monthKey) {
    const { qualified, unqualified } = computePace(monthKey);

    if (!qualified.length && !unqualified.length) { renderEmpty(); return; }

    if (!qualified.length) {
      top3El.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;color:rgba(255,255,255,.65);padding:30px 0;font-weight:700;font-size:13px">
          No runners have reached ${PACE_MIN_RUNS} runs yet
        </div>
      `;
    } else {
      renderTop3(qualified, r => ({
        score: `${Utils.formatPace(r.overallPace)} /km`,
        sub: `${r.totalDist.toFixed(1)} km`
      }));
    }

    renderList(qualified, r => ({
      score: Utils.formatPace(r.overallPace),
      scoreUnit: '/km',
      label: 'Avg Pace',
      sub: `${r.totalDist.toFixed(1)} km · ${r.runs} runs`
    }));

    // Unqualified section
    if (unqualified.length) {
      const divider = document.createElement('div');
      divider.className = 'unqualified-divider';
      divider.innerHTML = `
        <span>Need ${PACE_MIN_RUNS} runs to qualify</span>
      `;
      listEl.appendChild(divider);

      unqualified.forEach(r => {
        const needed = PACE_MIN_RUNS - r.runs;
        const row = document.createElement('div');
        row.className = 'row row-unqualified';
        row.setAttribute('role', 'button');
        row.setAttribute('tabindex', '0');
        row.innerHTML = `
          <div class="r-rank r-rank-lock">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="rgba(17,20,28,.35)">
              <path d="M18 8h-1V6A5 5 0 0 0 7 6v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zM12 17a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm3.1-9H8.9V6a3.1 3.1 0 0 1 6.2 0v2z"/>
            </svg>
          </div>
          <div class="r-who">
            <strong>${r.member_name} ${r.isNewcomer ? '<span class="badge-new">NEW</span>' : ''}</strong>
            <small>${r.runs} run${r.runs !== 1 ? 's' : ''} · ${needed} more to qualify</small>
          </div>
          <div class="r-right">
            <div class="score score-muted">${Utils.formatPace(r.overallPace)} /km</div>
            <div class="lbl">Current Pace</div>
          </div>
        `;
        row.addEventListener('click', () => openRunner(r.member_name, monthSelect.value));
        row.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openRunner(r.member_name, monthSelect.value); }
        });
        listEl.appendChild(row);
      });
    }
  }

  function renderEmpty() {
    top3El.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;color:rgba(255,255,255,.55);padding:30px 0;font-weight:700">
        No runs in this period
      </div>
    `;
  }

  /* ─── Top 3 Podium ──────────────────────────────────────── */

  function renderTop3(data, getDisplay) {
    Utils.clearElement(top3El);
    const slots = [
      { cls: 'top2', rank: 2 },
      { cls: 'top1', rank: 1 },
      { cls: 'top3p', rank: 3 }
    ];

    slots.forEach(slot => {
      const runner = data[slot.rank - 1] || null;
      const card = document.createElement('div');
      card.className = `top-card ${slot.cls}`;

      if (!runner) {
        card.innerHTML = `
          <div class="avatar-wrap"><div class="avatar">—</div></div>
          <p class="t-name">—</p>
        `;
        top3El.appendChild(card);
        return;
      }

      const isTop1 = slot.rank === 1;
      const display = getDisplay(runner);

      card.innerHTML = `
        <div class="avatar-wrap" role="button" tabindex="0" aria-label="${runner.member_name}">
          ${isTop1 ? `
            <div class="crown">
              <svg viewBox="0 0 24 24"><path d="M12 2l3 6 6 .5-4.5 4 1.6 6-6.1-3.4L5.9 18.5l1.6-6L3 8.5 9 8z"/></svg>
            </div>` : ''}
          <div class="avatar">${Utils.initials(runner.member_name)}</div>
          <div class="rank-chip">#${slot.rank}</div>
        </div>
        <p class="t-name" title="${runner.member_name}">
          ${runner.member_name}${runner.isNewcomer ? ' <span class="badge-new badge-new--dark">NEW</span>' : ''}
        </p>
        <div class="t-score">${display.score}</div>
        <div class="t-dist">${display.sub}</div>
      `;

      const wrap = card.querySelector('.avatar-wrap');
      wrap.addEventListener('click', () => openRunner(runner.member_name, monthSelect.value));
      wrap.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openRunner(runner.member_name, monthSelect.value); }
      });

      top3El.appendChild(card);
    });
  }

  /* ─── List ──────────────────────────────────────────────── */

  function renderList(data, getDisplay) {
    data.forEach((r, i) => {
      const rank = i + 1;
      const row = document.createElement('div');
      row.className = rank <= 3 ? 'row top-rank' : 'row';
      row.setAttribute('role', 'button');
      row.setAttribute('tabindex', '0');

      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
      const display = getDisplay(r);

      row.innerHTML = `
        <div class="r-rank">${medal}</div>
        <div class="r-who">
          <strong>${r.member_name}${r.isNewcomer ? ' <span class="badge-new">NEW</span>' : ''}</strong>
          <small>${display.sub}</small>
        </div>
        <div class="r-right">
          <div class="score">${display.score}<span class="score-unit"> ${display.scoreUnit}</span></div>
          <div class="lbl">${display.label}</div>
        </div>
      `;

      row.addEventListener('click', () => openRunner(r.member_name, monthSelect.value));
      row.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openRunner(r.member_name, monthSelect.value); }
      });

      listEl.appendChild(row);
    });
  }

  /* ─── Modal ─────────────────────────────────────────────── */

  function openRunner(memberName, monthKey) {
    const runs = allData
      .filter(r => {
        if (r.member_name !== memberName) return false;
        if (monthKey === MONTH_ALL) return true;
        return Utils.ym(r.event_date) === monthKey;
      })
      .sort((a, b) => a.event_date.localeCompare(b.event_date));

    if (!runs.length) return;

    const totalDist = runs.reduce((s, r) => s + parseFloat(r.distance_km || 0), 0);
    const totalTime = runs.reduce((s, r) => s + parseFloat(r.moving_time_min || 0), 0);
    const overallPace = totalTime / totalDist;
    const bestPace = Math.min(...runs.map(r => Utils.parsePace(r.avg_pace)));

    const subLabel = monthKey === MONTH_ALL
      ? 'All time · Stats'
      : `${Utils.monthLabel(monthKey)} · Stats`;

    document.getElementById('modalTitle').textContent = memberName;
    document.getElementById('modalSub').textContent = subLabel;
    document.getElementById('mScore').textContent = Utils.formatPace(overallPace) + ' /km';
    document.getElementById('mKm').textContent = totalDist.toFixed(1) + ' km';
    document.getElementById('mDays').textContent = String(runs.length);
    document.getElementById('mBest').textContent = Utils.formatPace(bestPace) + ' /km';

    renderChart(runs);

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function renderChart(runs) {
    const labels = runs.map(r => Utils.fmtDateShort(r.event_date));
    const paceVals = runs.map(r => Utils.parsePace(r.avg_pace));
    const minPace = Math.min(...paceVals);

    const ctx = document.getElementById('runnerChart');
    if (chart) chart.destroy();

    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Pace',
          data: paceVals,
          borderColor: 'rgba(255,193,7,0.95)',
          backgroundColor: 'rgba(255,193,7,0.10)',
          fill: true,
          tension: 0.35,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: paceVals.map(p => p === minPace ? '#2a9d5c' : 'rgba(255,193,7,0.95)'),
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: ctx => ` ${Utils.formatPace(ctx.raw)} /km` }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(17,20,28,0.05)' },
            ticks: { color: 'rgba(17,20,28,0.60)', font: { weight: 700, size: 11 } }
          },
          y: {
            reverse: true,
            min: minPace - 0.3,
            max: Math.max(...paceVals) + 0.3,
            grid: { color: 'rgba(17,20,28,0.05)' },
            ticks: {
              color: 'rgba(17,20,28,0.60)',
              font: { weight: 700, size: 11 },
              callback: val => Utils.formatPace(val)
            }
          }
        }
      }
    });
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  /* ─── Tabs ──────────────────────────────────────────────── */

  function initTabs() {
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTab = btn.dataset.tab;
        render(monthSelect.value);
      });
    });
  }

  /* ─── Init ──────────────────────────────────────────────── */

  function init() {
    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });

    initTabs();

    window.IronflowData.fetch({
      onProgress: msg => {
        top3El.innerHTML = `
          <div style="grid-column:1/-1;text-align:center;color:rgba(255,255,255,.65);padding:30px 0;font-weight:600">${msg}</div>
        `;
      },
      onError: (msg, isCritical) => {
        const color = isCritical ? 'rgba(255,100,100,.85)' : 'rgba(255,193,7,.85)';
        top3El.innerHTML = `
          <div style="grid-column:1/-1;text-align:center;color:${color};padding:30px 20px;font-weight:700">
            ⚠️ ${msg}
            ${isCritical ? '<br><button onclick="location.reload()" style="margin-top:16px;padding:10px 20px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#fff;border-radius:999px;cursor:pointer;font-weight:800;text-transform:uppercase;font-size:11px;letter-spacing:.1em">Retry</button>' : ''}
          </div>
        `;
      }
    })
      .then(data => {
        allData = data;

        const months = [...new Set(data.map(r => Utils.ym(r.event_date)))].sort().reverse();

        const allOpt = document.createElement('option');
        allOpt.value = MONTH_ALL;
        allOpt.textContent = 'All Time';
        monthSelect.appendChild(allOpt);

        months.forEach(m => {
          const opt = document.createElement('option');
          opt.value = m;
          opt.textContent = Utils.monthLabel(m);
          monthSelect.appendChild(opt);
        });

        monthSelect.value = MONTH_ALL;
        monthSelect.addEventListener('change', () => render(monthSelect.value));

        renderImprovedBanner();
        render(monthSelect.value);
      })
      .catch(err => console.error('Fatal error:', err));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();