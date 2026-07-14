// WakaTime last-7-days language bars + GitHub contribution heatmap for the hero stats row.

function fmtTime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return '< 1m';
}

function hidePanel(el: Element | null) {
  const panel = el?.closest('.stat-panel');
  if (panel) (panel as HTMLElement).style.display = 'none';
}

async function loadWakaBars() {
  const WAKA_LANGS =
    'https://wakatime.com/share/@e5607946-deed-4d4e-9264-3a7cb7eb2a42/a7fb97a5-e023-47ed-9e02-7b196ddc16b9.json';
  const WAKA_ACTIVITY =
    'https://wakatime.com/share/@e5607946-deed-4d4e-9264-3a7cb7eb2a42/15e3ec86-7b4d-4ac5-bcc5-82165df62b1b.json';

  const container = document.getElementById('waka-bars');
  const totalEl = document.getElementById('waka-total');
  if (!container) return;

  try {
    const [langsRes, activityRes] = await Promise.all([fetch(WAKA_LANGS), fetch(WAKA_ACTIVITY)]);
    if (!langsRes.ok || !activityRes.ok) throw new Error('bad response');
    const langs = await langsRes.json();
    const activity = await activityRes.json();

    const langData = langs.data ?? [];
    if (!langData.length) throw new Error('empty');

    const totalSecs = (activity.data ?? []).reduce(
      (sum: number, day: any) => sum + (day.grand_total?.total_seconds ?? 0),
      0
    );

    const top = langData.filter((l: any) => l.name && l.name !== 'Other').slice(0, 4);
    const maxPct = top[0]?.percent || 100;

    if (totalEl && totalSecs > 0) totalEl.textContent = fmtTime(totalSecs);

    container.innerHTML = top
      .map((lang: any) => {
        const langSecs = (lang.percent / 100) * totalSecs;
        const timeText = totalSecs > 0 ? fmtTime(langSecs) : `${lang.percent.toFixed(1)}%`;
        const pct = ((lang.percent / maxPct) * 100).toFixed(1);
        return `<div class="waka-bar">
          <span class="waka-name">${lang.name}</span>
          <span class="waka-track"><span class="waka-fill" style="--lang-color:${lang.color || 'var(--accent)'}" data-pct="${pct}"></span></span>
          <span class="waka-time">${timeText}</span>
        </div>`;
      })
      .join('');

    requestAnimationFrame(() => {
      container.querySelectorAll<HTMLElement>('.waka-fill').forEach((fill) => {
        fill.style.width = `${fill.dataset.pct}%`;
      });
    });
  } catch {
    hidePanel(container);
  }
}

async function loadContribHeatmap() {
  const container = document.getElementById('contrib-heatmap');
  const totalEl = document.getElementById('contrib-total');
  if (!container) return;

  const WEEKS = 20;
  const CELL = 7;
  const GAP = 2;
  const STEP = CELL + GAP;
  const COLORS = [
    'rgba(255,255,255,0.07)',
    'rgba(217,174,92,0.32)',
    'rgba(255,122,30,0.6)',
    'rgba(217,174,92,0.8)',
    'rgba(244,221,154,1)',
  ];

  try {
    const res = await fetch('https://github-contributions-api.jogruber.de/v4/fantac4t?y=last');
    if (!res.ok) throw new Error('bad response');
    const { contributions, total } = await res.json();

    const days = contributions.slice(-(WEEKS * 7));
    const svgW = WEEKS * STEP - GAP;
    const svgH = 7 * STEP - GAP;

    const rects = days
      .map((d: any, i: number) => {
        const col = Math.floor(i / 7);
        const row = i % 7;
        const color = COLORS[d.level] ?? COLORS[0];
        return `<rect x="${col * STEP}" y="${row * STEP}" width="${CELL}" height="${CELL}" rx="1.5" fill="${color}"><title>${d.date}: ${d.count} contribution${d.count !== 1 ? 's' : ''}</title></rect>`;
      })
      .join('');

    container.innerHTML = `<svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">${rects}</svg>`;

    const yr = new Date().getFullYear();
    const ytd = total[yr] ?? Object.values(total).reduce((a: number, b: any) => a + Number(b), 0);
    if (totalEl) totalEl.textContent = `${ytd} this year`;
  } catch {
    hidePanel(container);
  }
}

loadWakaBars();
loadContribHeatmap();
