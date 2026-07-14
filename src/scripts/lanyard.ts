// Live Discord status dot + "Now Playing" via Rich Presence (YouTube Music), through Lanyard's websocket.
// Ported from the original site's script.js.

const DISCORD_USER_ID = '325934332290007042';

const STATUS_COLORS: Record<string, { bg: string; glow: string }> = {
  online: { bg: '#4ade80', glow: 'rgba(74,222,128,0.7)' },
  idle: { bg: '#fbbf24', glow: 'rgba(251,191,36,0.7)' },
  dnd: { bg: '#f87171', glow: 'rgba(248,113,113,0.7)' },
  offline: { bg: '#6b7280', glow: 'rgba(107,114,128,0.4)' },
};

let npTimestamps: { start?: number; end?: number } | null = null;

function applyPresence(data: any) {
  // Discord status dot + custom status text
  const dot = document.getElementById('discord-status-dot');
  const label = document.getElementById('discord-status-text');
  const status = data.discord_status || 'offline';
  if (dot && label) {
    const c = STATUS_COLORS[status] || STATUS_COLORS.offline;
    dot.style.background = c.bg;
    dot.style.boxShadow = `0 0 6px ${c.glow}`;

    // Activity type 4 = Discord custom status
    const customAct = (data.activities || []).find((a: any) => a.type === 4);
    if (customAct && (customAct.state || customAct.emoji?.name)) {
      const emoji = customAct.emoji?.name ? customAct.emoji.name + ' ' : '';
      label.textContent = emoji + (customAct.state || '');
    } else {
      label.textContent = '@fantacat';
    }
  }

  (window as any)._faviconState?.(status);

  // Any Discord "Listening to ..." activity (type 2 — this is how Spotify's official
  // Discord integration reports, which is what actually reflects mobile playback), plus
  // YouTube Music / Amuse specifically since those sometimes report as type 0 (Playing).
  const musicAct = (data.activities || []).find(
    (a: any) =>
      a.type === 2 ||
      /youtube.?music|amuse/i.test(a.name || '') ||
      (a.assets?.large_image || '').toLowerCase().includes('youtube')
  );

  const npEl = document.getElementById('now-playing') as HTMLElement | null;
  const artEl = document.getElementById('np-art') as HTMLImageElement | null;
  const trackEl = document.getElementById('np-track') as HTMLAnchorElement | null;
  const artistEl = document.getElementById('np-artist');

  if (!npEl) return;

  if (musicAct && musicAct.details) {
    if (trackEl) {
      trackEl.textContent = musicAct.details || '';
      trackEl.href =
        musicAct.name === 'Spotify' && musicAct.sync_id
          ? `https://open.spotify.com/track/${musicAct.sync_id}`
          : `https://music.youtube.com/search?q=${encodeURIComponent(
              (musicAct.details || '') + ' ' + (musicAct.state || '')
            )}`;
    }
    if (artistEl) artistEl.textContent = musicAct.state || '';
    npTimestamps = musicAct.timestamps || null;
    if (artEl && musicAct.assets?.large_image) {
      const img: string = musicAct.assets.large_image;
      artEl.src = img.startsWith('spotify:')
        ? `https://i.scdn.co/image/${img.replace('spotify:', '')}`
        : img.startsWith('mp:external/')
          ? `https://media.discordapp.net/${img.replace('mp:', '')}`
          : img.startsWith('https')
            ? img
            : `https://cdn.discordapp.com/app-assets/${musicAct.application_id}/${img}.png`;
    }
    // Discord always wins over the Last.fm fallback (src/scripts/lastfm.ts), and restores
    // whatever Last.fm may have hidden while it didn't know a track's duration.
    const barTrack = npEl.querySelector<HTMLElement>('.np-bar-track');
    if (barTrack) barTrack.style.display = '';
    npEl.dataset.source = 'discord';
    npEl.classList.add('is-active');
  } else {
    npTimestamps = null;
    // Only back off if Discord itself was the one showing something — don't clobber a
    // track Last.fm is currently displaying.
    if (npEl.dataset.source === 'discord') {
      npEl.classList.remove('is-active');
      delete npEl.dataset.source;
    }
  }
}

let hbTimer: number | undefined;

function connect() {
  const ws = new WebSocket('wss://api.lanyard.rest/socket');

  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);

    if (msg.op === 1) {
      // HELLO — start heartbeat + subscribe
      window.clearInterval(hbTimer);
      hbTimer = window.setInterval(() => {
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
    window.clearInterval(hbTimer);
    setTimeout(connect, 3000);
  });

  ws.addEventListener('error', () => ws.close());
}

connect();

// Progress bar + elapsed time for Now Playing
setInterval(() => {
  const barFill = document.getElementById('np-bar-fill') as HTMLElement | null;
  const timeEl = document.getElementById('np-time');
  if (!npTimestamps || !barFill || !timeEl) return;

  const start = npTimestamps.start || 0;
  const end = npTimestamps.end || 0;
  const total = end - start;
  const elapsed = Math.max(0, Math.min(Date.now() - start, total));

  if (total > 0) {
    barFill.style.width = `${(elapsed / total) * 100}%`;
    const fmt = (ms: number) => {
      const s = Math.floor(ms / 1000);
      return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    };
    timeEl.textContent = `${fmt(elapsed)} / ${fmt(total)}`;
  }
}, 1000);
