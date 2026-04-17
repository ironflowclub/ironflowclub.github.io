/**
 * IRONFLOW CLUB - Progress Tracker Script
 */

(function() {
  'use strict';

  // Wait for dependencies
  if (!window.IronflowData || !window.IronflowUtils) {
    console.error('Dependencies not loaded');
    return;
  }

  const Utils = window.IronflowUtils;

  let allData = [];
  let paceChart = null;
  let fsChartInstance = null;
  let currentChartData = null;

  // DOM Elements
  const memberSelect = document.getElementById('memberSelect');
  const contentEl = document.getElementById('content');
  const fsOverlay = document.getElementById('fsOverlay');
  const fsClose = document.getElementById('fsClose');

  /**
   * Generate feedback based on progress
   */
  function generateFeedback(runs) {
    if (runs.length < 2) return null;

    const first = runs[0];
    const last = runs[runs.length - 1];
    const firstPace = Utils.parsePace(first.avg_pace);
    const lastPace = Utils.parsePace(last.avg_pace);
    const paceImproved = lastPace < firstPace;
    const paceDiff = Math.abs(firstPace - lastPace);
    const distImproved = parseFloat(last.distance_km) > parseFloat(first.distance_km);
    const paceDiffStr = Utils.formatPace(paceDiff);

    let badge, feedback;

    if (paceImproved && distImproved) {
      badge = { cls: 'badge-good', text: 'Improving' };
      feedback = `<strong>Solid progress!</strong> You're running faster and covering more ground. Your pace improved by <strong>${paceDiffStr} min/km</strong> — that's a meaningful gain. Keep showing up every Saturday and this trend will compound.`;
    } else if (paceImproved && !distImproved) {
      badge = { cls: 'badge-mixed', text: 'Mixed' };
      feedback = `<strong>Your pace is faster</strong> — down by <strong>${paceDiffStr} min/km</strong>, which is real improvement. But your distance has dipped. Push yourself to go a little further each week.`;
    } else if (!paceImproved && distImproved) {
      badge = { cls: 'badge-mixed', text: 'Building Base 💪' };
      feedback = `<strong>You're running further</strong> — that's building your aerobic base. But your pace has slipped by <strong>${paceDiffStr} min/km</strong>. Once the base is there, add tempo efforts to sharpen up.`;
    } else {
      badge = { cls: 'badge-early', text: 'Keep Going' };
      feedback = `Both pace and distance are down compared to your first run. Don't overthink it — consistency beats perfection. Just show up, run your best, and the numbers will follow.`;
    }

    return { badge, feedback, first, last, paceImproved };
  }

  /**
   * Build chart configuration
   */
  function buildChartConfig(labels, paceDecimals, minPace, maxPace, isDark) {
    const pad = 0.3;
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(17,20,28,0.05)';
    const tickColor = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(17,20,28,0.60)';
    const tooltipBg = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(28,31,58,0.95)';
    const tooltipText = '#fff';

    return {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Pace (min/km)',
          data: paceDecimals,
          borderColor: 'rgba(255,193,7,0.95)',
          backgroundColor: isDark ? 'rgba(255,193,7,0.12)' : 'rgba(255,193,7,0.10)',
          fill: true,
          tension: 0.35,
          borderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 9,
          pointBackgroundColor: paceDecimals.map(p =>
            p === minPace ? '#48c774' : 'rgba(255,193,7,0.95)'
          ),
          pointBorderColor: isDark ? 'rgba(255,255,255,0.25)' : '#fff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: tooltipBg,
            titleColor: tooltipText,
            bodyColor: tooltipText,
            titleFont: { family: 'Outfit', weight: 800, size: 13 },
            bodyFont: { family: 'Inter', weight: 700, size: 14 },
            cornerRadius: 12,
            padding: 14,
            callbacks: {
              label: (ctx) => ` ${Utils.paceLabel(ctx.raw)}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: {
              color: tickColor,
              font: { weight: 700, size: 12 },
              maxRotation: 45,
              minRotation: 0
            }
          },
          y: {
            reverse: true,
            min: minPace - pad,
            max: maxPace + pad,
            grid: { color: gridColor },
            ticks: {
              color: tickColor,
              font: { weight: 700, size: 12 },
              callback: (val) => Utils.formatPace(val)
            }
          }
        },
        layout: {
          padding: { left: 4, right: 12, top: 10, bottom: 4 }
        }
      }
    };
  }

  /**
   * Open fullscreen chart
   */
  function openFullscreen() {
    if (!currentChartData) return;

    fsOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Try to lock to landscape
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(() => {});
    }

    requestAnimationFrame(() => {
      const ctx = document.getElementById('fsChart');
      if (fsChartInstance) fsChartInstance.destroy();

      const { labels, paceDecimals, minPace, maxPace } = currentChartData;
      const config = buildChartConfig(labels, paceDecimals, minPace, maxPace, true);

      // Fullscreen tweaks
      config.options.scales.x.ticks.font.size = 13;
      config.options.scales.y.ticks.font.size = 13;
      config.options.plugins.tooltip.bodyFont.size = 15;
      config.data.datasets[0].pointRadius = 7;
      config.data.datasets[0].pointHoverRadius = 11;
      config.data.datasets[0].borderWidth = 3.5;

      fsChartInstance = new Chart(ctx, config);
    });
  }

  /**
   * Close fullscreen chart
   */
  function closeFullscreen() {
    fsOverlay.classList.remove('active');
    document.body.style.overflow = '';

    if (fsChartInstance) {
      fsChartInstance.destroy();
      fsChartInstance = null;
    }

    // Unlock orientation
    if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
    }
  }

  /**
   * Render progress for selected member
   */
  function render(memberName) {
    if (!memberName) {
      contentEl.innerHTML = `<div class="state-msg">Select your name above to see your progress.</div>`;
      currentChartData = null;
      return;
    }

    const runs = allData
      .filter(r => r.member_name === memberName)
      .sort((a, b) => a.event_date.localeCompare(b.event_date));

    if (!runs.length) {
      contentEl.innerHTML = `<div class="state-msg">No runs found for ${memberName}.</div>`;
      currentChartData = null;
      return;
    }

    const totalDist = runs.reduce((s, r) => s + parseFloat(r.distance_km || 0), 0);
    const totalTime = runs.reduce((s, r) => s + parseFloat(r.moving_time_min || 0), 0);
    const overallPace = totalTime / totalDist;
    const bestPaceDecimal = Math.min(...runs.map(r => Utils.parsePace(r.avg_pace)));
    const attendance = runs.length;
    const imp = generateFeedback(runs);

    // Store chart data for fullscreen
    const labels = runs.map(r => Utils.fmtDateShort(r.event_date));
    const paceDecimals = runs.map(r => Utils.parsePace(r.avg_pace));
    const minPace = Math.min(...paceDecimals);
    const maxPace = Math.max(...paceDecimals);
    currentChartData = { labels, paceDecimals, minPace, maxPace };

    let html = '';

    // Stats Grid
    html += `
      <div class="stats-grid enter" style="animation-delay:80ms">
        <div class="stat-card">
          <div class="k">Total Distance</div>
          <div class="v">${totalDist.toFixed(1)}<span style="font-size:14px;font-weight:700;color:var(--muted)"> km</span></div>
          <div class="sub">${runs.length} runs</div>
        </div>
        <div class="stat-card">
          <div class="k">Overall Pace</div>
          <div class="v">${Utils.formatPace(overallPace)}<span style="font-size:14px;font-weight:700;color:var(--muted)"> /km</span></div>
          <div class="sub">weighted avg</div>
        </div>
        <div class="stat-card">
          <div class="k">Best Pace</div>
          <div class="v" style="color:#2a9d5c">${Utils.formatPace(bestPaceDecimal)}<span style="font-size:14px;font-weight:700;color:var(--muted)"> /km</span></div>
          <div class="sub">personal best</div>
        </div>
        <div class="stat-card">
          <div class="k">Saturdays</div>
          <div class="v">${attendance}</div>
          <div class="sub">runs attended</div>
        </div>
      </div>
    `;

    // Improvement Card
    if (imp) {
      const firstRun = imp.first;
      const lastRun = imp.last;
      html += `
        <div class="improvement-card enter" style="animation-delay:120ms">
          <div class="imp-header">
            <div class="imp-title">First vs Latest Run</div>
            <div class="imp-badge ${imp.badge.cls}">${imp.badge.text}</div>
          </div>
          <div class="imp-runs">
            <div class="imp-run">
              <div class="run-label">First Run</div>
              <div class="run-date">${Utils.fmtDate(firstRun.event_date)}</div>
              <div class="run-pace">${firstRun.avg_pace} /km</div>
              <div class="run-dist">${parseFloat(firstRun.distance_km).toFixed(2)} km</div>
            </div>
            <div class="imp-arrow">→</div>
            <div class="imp-run">
              <div class="run-label">Latest Run</div>
              <div class="run-date">${Utils.fmtDate(lastRun.event_date)}</div>
              <div class="run-pace">${lastRun.avg_pace} /km</div>
              <div class="run-dist">${parseFloat(lastRun.distance_km).toFixed(2)} km</div>
            </div>
          </div>
          <div class="imp-feedback">${imp.feedback}</div>
        </div>
      `;
    }

    // Chart Card
    html += `
      <div class="chart-card enter" style="animation-delay:160ms">
        <div class="chart-card-head">
          <strong>Pace Over Time</strong>
          <span>Lower = Faster</span>
        </div>
        <div class="chart-wrap">
          <canvas id="paceChart" aria-label="Pace over time chart" role="img"></canvas>
        </div>
        <button class="expand-btn" id="expandChartBtn" aria-label="View chart fullscreen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
            <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
          </svg>
          View Fullscreen
        </button>
      </div>
    `;

    // History Table
    const bestPaceRun = runs.reduce(
      (best, r) => Utils.parsePace(r.avg_pace) < Utils.parsePace(best.avg_pace) ? r : best,
      runs[0]
    );

    html += `
      <div class="history-card enter" style="animation-delay:200ms">
        <div class="history-head">
          <strong>Run History</strong>
          <span>${runs.length} Runs</span>
        </div>
        <div style="overflow-x:auto">
          <table class="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Event</th>
                <th>Distance</th>
                <th>Time</th>
                <th>Pace</th>
              </tr>
            </thead>
            <tbody>
              ${runs.slice().reverse().map(r => {
                const isBest = r.activity_id === bestPaceRun.activity_id;
                return `
                  <tr>
                    <td>${Utils.fmtDateShort(r.event_date)}</td>
                    <td class="event-name-cell">${r.event_name}</td>
                    <td>${parseFloat(r.distance_km).toFixed(2)} km</td>
                    <td>${parseFloat(r.moving_time_min).toFixed(1)} min</td>
                    <td class="pace-cell ${isBest ? 'pace-good' : ''}">
                      ${isBest
                        ? `<span class="pace-best">${r.avg_pace} /km <span class="best-tag">Best</span></span>`
                        : `${r.avg_pace} /km`
                      }
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    contentEl.innerHTML = html;

    // Wire up expand button
    const expandBtn = document.getElementById('expandChartBtn');
    if (expandBtn) {
      expandBtn.addEventListener('click', openFullscreen);
    }

    // Draw inline chart
    requestAnimationFrame(() => {
      const ctx = document.getElementById('paceChart');
      if (!ctx) return;
      if (paceChart) paceChart.destroy();

      const config = buildChartConfig(labels, paceDecimals, minPace, maxPace, false);
      paceChart = new Chart(ctx, config);
    });
  }

  /**
   * Initialize
   */
  function init() {
    // Fullscreen controls
    fsClose.addEventListener('click', closeFullscreen);
    fsOverlay.addEventListener('click', (e) => {
      if (e.target === fsOverlay) closeFullscreen();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && fsOverlay.classList.contains('active')) {
        closeFullscreen();
      }
    });

    // Load data
    window.IronflowData.fetch({
      onProgress: (msg) => {
        contentEl.innerHTML = `
          <div class="state-msg">
            <div class="spinner"></div>
            ${msg}
          </div>
        `;
      },
      onError: (msg, isCritical) => {
        const color = isCritical ? '#e74c3c' : '#ffc107';
        contentEl.innerHTML = `
          <div class="state-msg">
            <p style="color:${color}">⚠️ ${msg}</p>
            ${isCritical ? '<button onclick="location.reload()" class="btn btn-ghost" style="margin-top:16px">Try Again</button>' : ''}
          </div>
        `;
      }
    })
      .then(data => {
        allData = data;

        // Populate member selector
        const names = [...new Set(data.map(r => r.member_name))].sort();
        names.forEach(name => {
          const opt = document.createElement('option');
          opt.value = name;
          opt.textContent = name;
          memberSelect.appendChild(opt);
        });

        contentEl.innerHTML = `<div class="state-msg">Select your name above to see your progress.</div>`;
      })
      .catch(() => {
        // Error already handled by onError callback
      });

    // Member selection
    memberSelect.addEventListener('change', () => render(memberSelect.value));
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();