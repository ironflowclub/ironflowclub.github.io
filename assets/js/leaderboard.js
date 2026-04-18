/**
 * IRONFLOW CLUB - Leaderboard Script
 */

(function() {
  'use strict';

  // Wait for dependencies
  if (!window.IronflowData || !window.IronflowUtils) {
    console.error('Dependencies not loaded');
    return;
  }

  const Utils = window.IronflowUtils;
  const MONTH_ALL = 'ALL';

  let allData = [];
  let chart = null;

  // DOM Elements
  const monthSelect = document.getElementById('monthSelect');
  const top3El = document.getElementById('top3');
  const listEl = document.getElementById('list');
  const modal = document.getElementById('modal');
  const closeModalBtn = document.getElementById('closeModal');

  /**
   * Compute leaderboard for a given month (or all time)
   */
  function computeLeaderboard(monthKey) {
    const monthData = monthKey === MONTH_ALL
      ? allData
      : allData.filter(r => Utils.ym(r.event_date) === monthKey);

    const members = [...new Set(allData.map(r => r.member_name))];

    const rows = members.map(name => {
      const runs = monthData.filter(r => r.member_name === name);
      const totalDist = runs.reduce((s, r) => s + parseFloat(r.distance_km || 0), 0);
      const totalTime = runs.reduce((s, r) => s + parseFloat(r.moving_time_min || 0), 0);
      const overallPace = totalDist > 0 ? totalTime / totalDist : 999;
      const bestPace = runs.length ? Math.min(...runs.map(r => Utils.parsePace(r.avg_pace))) : 999;

      return {
        member_name: name,
        totalDist,
        totalTime,
        overallPace,
        bestPace,
        runs: runs.length
      };
    });

    // Sort: lower pace = better
    rows.sort((a, b) => {
      if (a.runs === 0 && b.runs === 0) return 0;
      if (a.runs === 0) return 1;
      if (b.runs === 0) return -1;
      return a.overallPace - b.overallPace;
    });

    return rows;
  }

  /**
   * Render leaderboard
   */
  function render(monthKey) {
    Utils.clearElement(top3El);
    Utils.clearElement(listEl);

    const data = computeLeaderboard(monthKey).filter(r => r.runs > 0);

    if (!data.length) {
      top3El.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;color:rgba(255,255,255,.55);padding:30px 0;font-weight:700">
          No runs in this period
        </div>
      `;
      return;
    }

    // Render top 3 podium
    renderTop3(data);

    // Render FULL list starting from #1
    renderList(data);
  }

  /**
   * Render top 3 podium
   */
  function renderTop3(data) {
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
          <div class="avatar-wrap">
            <div class="avatar">—</div>
          </div>
          <p class="t-name">—</p>
        `;
        top3El.appendChild(card);
        return;
      }

      const isTop1 = slot.rank === 1;
      card.innerHTML = `
        <div class="avatar-wrap" role="button" tabindex="0" aria-label="${runner.member_name}">
          ${isTop1 ? `
            <div class="crown">
              <svg viewBox="0 0 24 24">
                <path d="M12 2l3 6 6 .5-4.5 4 1.6 6-6.1-3.4L5.9 18.5l1.6-6L3 8.5 9 8z"/>
              </svg>
            </div>
          ` : ''}
          <div class="avatar">${Utils.initials(runner.member_name)}</div>
          <div class="rank-chip">#${slot.rank}</div>
        </div>
        <p class="t-name" title="${runner.member_name}">${runner.member_name}</p>
        <div class="t-score">${Utils.formatPace(runner.overallPace)} /km</div>
        <div class="t-dist">${runner.totalDist.toFixed(1)} km</div>
      `;

      const wrap = card.querySelector('.avatar-wrap');
      wrap.addEventListener('click', () => openRunner(runner.member_name, monthSelect.value));
      wrap.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openRunner(runner.member_name, monthSelect.value);
        }
      });

      top3El.appendChild(card);
    });
  }

  /**
   * Render leaderboard list (FULL - starts from #1)
   */
  function renderList(data) {
    data.forEach((r, i) => {
      const rank = i + 1;
      const row = document.createElement('div');
      row.className = rank <= 3 ? 'row top-rank' : 'row';
      row.setAttribute('role', 'button');
      row.setAttribute('tabindex', '0');

      const medal = rank === 1 ? '🥇' : rank === 2 ? '#2' : rank === 3 ? '#3' : `#${rank}`;

      row.innerHTML = `
        <div class="r-rank">${medal}</div>
        <div class="r-who">
          <strong>${r.member_name}</strong>
          <small>${r.totalDist.toFixed(1)} km · ${r.runs} runs</small>
        </div>
        <div class="r-right">
          <div class="score">${Utils.formatPace(r.overallPace)} /km</div>
          <div class="lbl">Avg Pace</div>
        </div>
      `;

      row.addEventListener('click', () => openRunner(r.member_name, monthSelect.value));
      row.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openRunner(r.member_name, monthSelect.value);
        }
      });

      listEl.appendChild(row);
    });
  }

  /**
   * Open runner detail modal
   */
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
      ? 'All time · Pace ranking'
      : `${Utils.monthLabel(monthKey)} · Pace ranking`;

    // Update modal content
    document.getElementById('modalTitle').textContent = memberName;
    document.getElementById('modalSub').textContent = subLabel;
    document.getElementById('mScore').textContent = Utils.formatPace(overallPace) + ' /km';
    document.getElementById('mKm').textContent = totalDist.toFixed(1) + ' km';
    document.getElementById('mDays').textContent = String(runs.length);
    document.getElementById('mBest').textContent = Utils.formatPace(bestPace) + ' /km';

    // Render chart
    renderChart(runs);

    // Show modal
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  /**
   * Render pace chart in modal
   */
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
            callbacks: {
              label: ctx => ` ${Utils.formatPace(ctx.raw)} /km`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(17,20,28,0.05)' },
            ticks: {
              color: 'rgba(17,20,28,0.60)',
              font: { weight: 700, size: 11 }
            }
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

  /**
   * Close modal
   */
  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  /**
   * Initialize
   */
  function init() {
    // Modal event listeners
    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', e => {
      if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });

    // Load data
    window.IronflowData.fetch({
      onProgress: (msg) => {
        top3El.innerHTML = `
          <div style="grid-column:1/-1;text-align:center;color:rgba(255,255,255,.65);padding:30px 0;font-weight:600">
            ${msg}
          </div>
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

        // Populate month selector with All Time at top
        const months = [...new Set(data.map(r => Utils.ym(r.event_date)))].sort().reverse();

        // Add "All Time" option first
        const allOpt = document.createElement('option');
        allOpt.value = MONTH_ALL;
        allOpt.textContent = 'All Time';
        monthSelect.appendChild(allOpt);

        // Add monthly options
        months.forEach(m => {
          const opt = document.createElement('option');
          opt.value = m;
          opt.textContent = Utils.monthLabel(m);
          monthSelect.appendChild(opt);
        });

        // Default to most recent month (or All Time if no months)
        monthSelect.value = months[0] || MONTH_ALL;
        monthSelect.addEventListener('change', () => render(monthSelect.value));
        render(monthSelect.value);
      })
      .catch(err => {
        console.error('Fatal error:', err);
      });
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();