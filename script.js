// Scale iframes to fill their card at full desktop width
function scaleIframes() {
  document.querySelectorAll('.iframe-wrap').forEach(wrap => {
    const iframe = wrap.querySelector('iframe');
    if (!iframe) return;
    const INNER_W = 1280;
    const scale   = wrap.clientWidth / INNER_W;
    iframe.style.width  = `${INNER_W}px`;
    iframe.style.height = `${Math.ceil(wrap.clientHeight / scale)}px`;
    iframe.style.transform = `scale(${scale})`;
  });
}

scaleIframes();
window.addEventListener('resize', scaleIframes);

// Subtle 3D tilt on non-game cells (desktop only)
if (window.matchMedia('(pointer: fine)').matches) {
  document.querySelectorAll('.cell:not(.game-card)').forEach(cell => {
    cell.addEventListener('mousemove', e => {
      const r = cell.getBoundingClientRect();
      const x = (e.clientX - r.left)  / r.width  - 0.5;
      const y = (e.clientY - r.top)   / r.height - 0.5;
      cell.style.transition = 'transform 0.06s linear, border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease';
      cell.style.transform  = `perspective(700px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg) translateY(-2px)`;
    });
    cell.addEventListener('mouseleave', () => {
      cell.style.transition = '';
      cell.style.transform  = '';
    });
  });
}

// ── Hero h1 name cycling (typewriter, random interval) ───────────
(function () {
  const h1 = document.querySelector('.cell-hero h1');
  if (!h1) return;

  const NAMES = [
    { plain: 'fanta', grad: 'cat' },
    { plain: 'Ivan ',  grad: 'S.' },
  ];
  const TYPE_MS  = 85;   // ms per character typed
  const ERASE_MS = 48;   // ms per character erased
  const MIN_WAIT = 4000; // minimum pause before switching
  const MAX_WAIT = 12000; // maximum pause before switching

  let idx = 0;

  function render(plain, grad) {
    h1.innerHTML = plain + (grad ? `<span class="name-accent">${grad}</span>` : '') + '<span class="typing-caret">|</span>';
  }

  const wait = ms => new Promise(r => setTimeout(r, ms));

  async function erase({ plain, grad }) {
    for (let i = grad.length; i > 0; i--) {
      render(plain, grad.slice(0, i - 1));
      await wait(ERASE_MS);
    }
    for (let i = plain.length; i > 0; i--) {
      render(plain.slice(0, i - 1), '');
      await wait(ERASE_MS);
    }
  }

  async function type({ plain, grad }) {
    for (let i = 1; i <= plain.length; i++) {
      render(plain.slice(0, i), '');
      await wait(TYPE_MS);
    }
    for (let i = 1; i <= grad.length; i++) {
      render(plain, grad.slice(0, i));
      await wait(TYPE_MS);
    }
  }

  (async function cycle() {
    while (true) {
      await wait(MIN_WAIT + Math.random() * (MAX_WAIT - MIN_WAIT));
      await erase(NAMES[idx]);
      await wait(180);
      idx = (idx + 1) % NAMES.length;
      await type(NAMES[idx]);
    }
  })();
})();

// ── Tel Aviv clock ──────────────────────────────────────────────
(function () {
  const timeEl = document.getElementById('clock-time');
  if (!timeEl) return;
  function tick() {
    timeEl.textContent = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jerusalem',
      hour:     '2-digit',
      minute:   '2-digit',
      hour12:   false,
    }).format(new Date());
  }
  tick();
  setInterval(tick, 15000);
})();

// ── Lanyard: Discord status + custom status + YouTube Music ──────
(function () {
  const DISCORD_USER_ID = '325934332290007042';

  const STATUS_COLORS = {
    online:  { bg: '#4ade80', glow: 'rgba(74,222,128,0.7)'  },
    idle:    { bg: '#fbbf24', glow: 'rgba(251,191,36,0.7)'  },
    dnd:     { bg: '#f87171', glow: 'rgba(248,113,113,0.7)' },
    offline: { bg: '#6b7280', glow: 'rgba(107,114,128,0.4)' },
  };

  // Capture static fallback once so we can restore it when VS Code closes
  const _statusEl       = document.getElementById('hero-status-text');
  const _statusFallback = _statusEl ? _statusEl.textContent : '';

  function applyPresence(data) {
    // ── Discord status dot + custom status text ──────────────────
    const dot   = document.getElementById('discord-status-dot');
    const label = document.getElementById('discord-status-text');
    if (dot && label) {
      const s = data.discord_status || 'offline';
      const c = STATUS_COLORS[s] || STATUS_COLORS.offline;
      dot.style.background = c.bg;
      dot.style.boxShadow  = `0 0 6px ${c.glow}`;

      // Activity type 4 = Discord custom status
      const customAct = (data.activities || []).find(a => a.type === 4);
      if (customAct && (customAct.state || customAct.emoji?.name)) {
        const emoji = customAct.emoji?.name ? customAct.emoji.name + ' ' : '';
        label.textContent = emoji + (customAct.state || '');
      } else {
        label.textContent = '@fantacat';
      }
    }

    // ── VS Code activity → "currently editing" status ────────────
    const vsAct = (data.activities || []).find(a =>
      /visual.?studio.?code|vscode/i.test(a.name || '')
    );
    if (_statusEl) {
      if (vsAct && vsAct.details) {
        _statusEl.textContent = vsAct.details.toLowerCase();
      } else {
        _statusEl.textContent = _statusFallback;
      }
    }

    // ── YouTube Music via Rich Presence ──────────────────────────
    const ytAct = (data.activities || []).find(a =>
      /youtube.?music|amuse/i.test(a.name || '') ||
      (a.assets?.large_image || '').toLowerCase().includes('youtube')
    );

    const npEl     = document.getElementById('now-playing');
    const artEl    = document.getElementById('np-art');
    const trackEl  = document.getElementById('np-track');
    const artistEl = document.getElementById('np-artist');

    if (npEl) {
      if (ytAct && ytAct.details) {
        if (trackEl) {
          trackEl.textContent = ytAct.details || '';
          trackEl.href = `https://music.youtube.com/search?q=${encodeURIComponent((ytAct.details || '') + ' ' + (ytAct.state || ''))}`;
        }
        if (artistEl) artistEl.textContent = ytAct.state || '';
        window._npTimestamps = ytAct.timestamps || null;
        if (artEl && ytAct.assets?.large_image) {
          const img = ytAct.assets.large_image;
          artEl.src = img.startsWith('mp:external/')
            ? `https://media.discordapp.net/${img.replace('mp:', '')}`
            : img.startsWith('https')
              ? img
              : `https://cdn.discordapp.com/app-assets/${ytAct.application_id}/${img}.png`;
        }
        npEl.classList.add('is-active');
      } else {
        npEl.classList.remove('is-active');
        window._npTimestamps = null;
      }
    }
  }

  // ── Lanyard WebSocket (real-time, auto-reconnect) ─────────────
  let hbTimer = null;

  function connect() {
    const ws = new WebSocket('wss://api.lanyard.rest/socket');

    ws.addEventListener('message', e => {
      const msg = JSON.parse(e.data);

      if (msg.op === 1) {
        // HELLO — start heartbeat + subscribe
        clearInterval(hbTimer);
        hbTimer = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ op: 3 }));
        }, msg.d.heartbeat_interval);
        ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: DISCORD_USER_ID } }));
      }

      if (msg.op === 0) {
        // INIT_STATE or PRESENCE_UPDATE
        applyPresence(msg.d);
      }
    });

    ws.addEventListener('close', () => {
      clearInterval(hbTimer);
      setTimeout(connect, 3000);
    });

    ws.addEventListener('error', () => ws.close());
  }

  connect();

  // ── Progress bar + elapsed time for Now Playing ───────────────
  setInterval(() => {
    const ts      = window._npTimestamps;
    const barFill = document.getElementById('np-bar-fill');
    const timeEl  = document.getElementById('np-time');
    if (!ts || !barFill || !timeEl) return;
    const start   = ts.start || 0;
    const end     = ts.end   || 0;
    const total   = end - start;
    const elapsed = Math.max(0, Math.min(Date.now() - start, total));
    if (total > 0) {
      barFill.style.width = `${(elapsed / total) * 100}%`;
      const fmt = ms => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
      timeEl.textContent = `${fmt(elapsed)} / ${fmt(total)}`;
    }
  }, 1000);
})();

// ── PSR version badge ────────────────────────────────────────────
(function () {
  const badge = document.getElementById('psr-version');
  if (!badge) return;
  fetch('https://api.github.com/repos/fantac4t/PlayerStatusReal/releases/latest')
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(({ tag_name }) => {
      if (tag_name) {
        badge.textContent   = tag_name;
        badge.style.display = 'inline-flex';
      }
    })
    .catch(() => {});
})();

// ── Click-to-copy email ──────────────────────────────────────────
(function () {
  const btn = document.getElementById('copy-email-btn');
  if (!btn) return;
  btn.addEventListener('click', e => {
    e.preventDefault();
    navigator.clipboard.writeText('vanushka060@gmail.com')
      .then(() => {
        const orig = btn.innerHTML;
        const origBg = btn.style.background;
        btn.innerHTML        = 'Copied ✓';
        btn.style.background = 'linear-gradient(135deg,#4ade80,#22c55e)';
        btn.style.color      = '#022c0e';
        setTimeout(() => {
          btn.innerHTML        = orig;
          btn.style.background = origBg;
          btn.style.color      = '';
        }, 2200);
      })
      .catch(() => {
        window.location.href = 'mailto:vanushka060@gmail.com';
      });
  });
})();

// ── Click-to-copy Discord username ───────────────────────────────
(function () {
  const chip = document.querySelector('.contact-discord');
  if (!chip) return;
  const label = chip.querySelector('span');
  chip.addEventListener('click', () => {
    navigator.clipboard.writeText('fantacat').then(() => {
      label.textContent = 'copied ✓';
      chip.style.color  = '#5865f2';
      setTimeout(() => { label.textContent = '@fantacat'; chip.style.color = ''; }, 2000);
    });
  });
})();

// ── Magnetic buttons ─────────────────────────────────────────────
if (window.matchMedia('(pointer: fine)').matches) {
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r  = btn.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width  / 2)) * 0.38;
      const dy = (e.clientY - (r.top  + r.height / 2)) * 0.38;
      btn.style.transform = `translate(${dx}px,${dy}px) scale(1.04)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

// ── Konami code easter egg ───────────────────────────────────────
(function () {
  const SEQ = [
    'ArrowUp','ArrowUp','ArrowDown','ArrowDown',
    'ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a',
  ];
  let idx = 0;

  document.addEventListener('keydown', e => {
    if (e.key === SEQ[idx]) {
      idx++;
      if (idx === SEQ.length) { idx = 0; triggerKonami(); }
    } else {
      idx = (e.key === SEQ[0]) ? 1 : 0;
    }
  });

  function triggerKonami() {
    if (typeof config !== 'undefined') config.COLORFUL = true;

    const toast = document.getElementById('konami-toast');
    if (toast) toast.classList.add('show');

    document.querySelectorAll('.cell').forEach((cell, i) => {
      setTimeout(() => {
        cell.classList.add('konami-shake');
        setTimeout(() => {
          cell.classList.remove('konami-shake');
          cell.classList.add('konami-rainbow');
        }, 620);
      }, i * 80);
    });

    setTimeout(() => {
      if (typeof config !== 'undefined') config.COLORFUL = false;
      if (toast) toast.classList.remove('show');
      document.querySelectorAll('.cell').forEach(c =>
        c.classList.remove('konami-shake', 'konami-rainbow')
      );
    }, 7500);
  }
})();

// ── Mini GitHub contribution heatmap ────────────────────────────
(function () {
  const container = document.getElementById('contrib-heatmap');
  const countEl   = document.getElementById('contrib-count');
  if (!container) return;

  const WEEKS  = 20;   // how many weeks to show
  const CELL   = 7;    // px per cell
  const GAP    = 2;    // px gap between cells
  const STEP   = CELL + GAP;
  // Orange-tinted scale matching the site palette
  const COLORS = [
    'rgba(255,255,255,0.07)',  // 0 — none
    'rgba(255,120,45,0.28)',   // 1
    'rgba(255,130,50,0.52)',   // 2
    'rgba(255,140,55,0.76)',   // 3
    'rgba(255,160,65,1.0)',    // 4 — max
  ];

  fetch('https://github-contributions-api.jogruber.de/v4/fantac4t?y=last')
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(({ contributions, total }) => {
      const days = contributions.slice(-(WEEKS * 7));
      const svgW = WEEKS * STEP - GAP;
      const svgH = 7     * STEP - GAP;

      const rects = days.map((d, i) => {
        const col   = Math.floor(i / 7);
        const row   = i % 7;
        const color = COLORS[d.level] ?? COLORS[0];
        return `<rect x="${col * STEP}" y="${row * STEP}" width="${CELL}" height="${CELL}" rx="1.5" fill="${color}"><title>${d.date}: ${d.count} contribution${d.count !== 1 ? 's' : ''}</title></rect>`;
      }).join('');

      container.innerHTML =
        `<svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">${rects}</svg>`;

      const yr  = new Date().getFullYear();
      const ytd = total[yr] ?? Object.values(total).reduce((a, b) => a + b, 0);
      if (countEl) countEl.textContent = `${ytd} commits in ${yr}`;
    })
    .catch(() => {
      const el = document.getElementById('hero-contrib');
      if (el) el.style.display = 'none';
    });
})();

// ── Scroll-linked parallax on mobile ─────────────────────────────
(function () {
  if (window.matchMedia('(pointer: fine)').matches) return;
  // Subtle depth factors — odd indices move faster for layered feel
  const DEPTHS = [0, 0.007, 0.013, 0.005, 0.011, 0.016, 0.004];
  let ticking  = false;

  window.addEventListener('scroll', () => {
    if (ticking) return;
    requestAnimationFrame(() => {
      const sy = window.scrollY;
      document.querySelectorAll('.cell').forEach((cell, i) => {
        cell.style.transform = `translateY(${-(sy * (DEPTHS[i] ?? 0.008))}px)`;
      });
      ticking = false;
    });
    ticking = true;
  }, { passive: true });
})();

