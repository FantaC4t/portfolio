// "Now Playing" fallback via Last.fm — for whenever Discord Rich Presence has nothing to
// show (e.g. listening on mobile, where YouTube Music has no Discord integration). Only
// takes over the widget when Discord isn't already showing something; see lanyard.ts,
// which sets/clears `data-source="discord"` on #now-playing to signal ownership.

const LASTFM_API_KEY = 'd261b6e087820182ccdc36d700e56471';
const LASTFM_USER = 'fabanter';
const POLL_MS = 15_000;

// Last.fm's "now playing" entry carries no playback position, so we approximate: the
// moment we first see a given track as playing, we start our own clock for it, and
// best-effort fetch the track's duration to render a real progress bar against.
let currentTrackKey: string | null = null;
let trackStartedAt: number | null = null;
let trackDurationMs: number | null = null;

function fmtTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

async function fetchDuration(artist: string, track: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${LASTFM_API_KEY}&artist=${encodeURIComponent(
        artist
      )}&track=${encodeURIComponent(track)}&format=json`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const ms = Number(data?.track?.duration);
    return ms > 0 ? ms : null;
  } catch {
    return null;
  }
}

async function checkLastfm() {
  const npEl = document.getElementById('now-playing') as HTMLElement | null;
  if (!npEl) return;

  // Discord has priority — never clobber a live Discord-sourced track.
  if (npEl.dataset.source === 'discord') return;

  try {
    const res = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USER}&api_key=${LASTFM_API_KEY}&format=json&limit=1`
    );
    if (!res.ok) throw new Error('bad response');
    const data = await res.json();
    const track = data.recenttracks?.track?.[0];
    const isPlaying = track?.['@attr']?.nowplaying === 'true';

    if (!track || !isPlaying) {
      if (npEl.dataset.source === 'lastfm') {
        npEl.classList.remove('is-active');
        delete npEl.dataset.source;
      }
      currentTrackKey = null;
      trackStartedAt = null;
      trackDurationMs = null;
      return;
    }

    const artist = track.artist?.['#text'] || '';
    const name = track.name || '';
    const key = `${artist}::${name}`;

    if (key !== currentTrackKey) {
      currentTrackKey = key;
      trackStartedAt = Date.now();
      trackDurationMs = null;
      fetchDuration(artist, name).then((ms) => {
        if (currentTrackKey === key) trackDurationMs = ms;
      });
    }

    const trackEl = document.getElementById('np-track') as HTMLAnchorElement | null;
    const artistEl = document.getElementById('np-artist');
    const artEl = document.getElementById('np-art') as HTMLImageElement | null;

    if (trackEl) {
      trackEl.textContent = name;
      trackEl.href = track.url || '#';
    }
    if (artistEl) artistEl.textContent = artist;
    if (artEl) {
      const art =
        track.image?.find((i: any) => i.size === 'extralarge')?.['#text'] ||
        track.image?.at(-1)?.['#text'];
      if (art) artEl.src = art;
    }

    npEl.dataset.source = 'lastfm';
    npEl.classList.add('is-active');
  } catch {
    // leave whatever's currently shown
  }
}

checkLastfm();
setInterval(checkLastfm, POLL_MS);

// Our own approximate progress tick, only while Last.fm owns the widget.
setInterval(() => {
  const npEl = document.getElementById('now-playing') as HTMLElement | null;
  if (!npEl || npEl.dataset.source !== 'lastfm' || !trackStartedAt) return;

  const barTrack = npEl.querySelector<HTMLElement>('.np-bar-track');
  const barFill = document.getElementById('np-bar-fill') as HTMLElement | null;
  const timeEl = document.getElementById('np-time');
  if (!barFill || !timeEl) return;

  const elapsed = Date.now() - trackStartedAt;

  if (trackDurationMs) {
    if (barTrack) barTrack.style.display = '';
    barFill.style.width = `${Math.min(100, (elapsed / trackDurationMs) * 100)}%`;
    timeEl.textContent = `${fmtTime(Math.min(elapsed, trackDurationMs))} / ${fmtTime(trackDurationMs)}`;
  } else {
    // Duration unknown (still fetching, or Last.fm has no metadata for it) — show
    // elapsed time only, no fabricated total.
    if (barTrack) barTrack.style.display = 'none';
    timeEl.textContent = fmtTime(elapsed);
  }
}, 1000);
