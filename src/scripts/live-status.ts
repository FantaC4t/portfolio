// Live data for the ticker's latest-push line, the TSNSMP project card's online count,
// and its weekly commit heat-strip. Each fetch is independent — one failing doesn't block the others.

function setText(id: string, html: string) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

async function loadTsnsmpStatus() {
  try {
    const res = await fetch('https://api.mcsrvstat.us/3/play.tsnsmp.online');
    if (!res.ok) throw new Error('bad response');
    const data = await res.json();
    if (data.online) {
      const count = data.players?.online ?? 0;
      const max = data.players?.max ?? 0;
      setText(
        'live-tsnsmp-stat',
        `<span class="live-dot" aria-hidden="true"></span>${count}/${max} online right now`
      );
    } else {
      setText('live-tsnsmp-stat', `<span class="live-dot" aria-hidden="true"></span>offline right now`);
    }
  } catch {
    // leave the static fallback text in place
  }
}

async function loadLatestPush() {
  try {
    const res = await fetch('https://api.github.com/users/fantac4t/events?per_page=15');
    if (!res.ok) throw new Error('bad response');
    const events = await res.json();
    const push = events.find((e: any) => e.type === 'PushEvent');
    if (!push) throw new Error('no push event found');

    const repo = push.repo.name.replace(/^fantac4t\//i, '');
    const diffH = Math.round((Date.now() - new Date(push.created_at).getTime()) / 3600000);
    const when = diffH < 1 ? 'just now' : diffH < 24 ? `${diffH}h ago` : `${Math.round(diffH / 24)}d ago`;

    setText(
      'live-push',
      `pushed to <a class="ticker-link" href="https://github.com/${push.repo.name}" target="_blank" rel="noopener">${repo}</a> &middot; ${when}`
    );
  } catch {
    setText('live-push', 'push history unavailable');
  }
}

async function loadTsnsmpHeat() {
  const WEEKS = 12;
  const wrap = document.getElementById('live-tsnsmp-heat-wrap');
  const cells = document.querySelectorAll<HTMLElement>('#live-tsnsmp-heat i');
  if (!wrap || !cells.length) return;

  try {
    const since = new Date(Date.now() - WEEKS * 7 * 24 * 3600 * 1000).toISOString();
    const res = await fetch(
      `https://api.github.com/repos/FantaC4t/tsnsmp-website/commits?since=${since}&per_page=100`
    );
    if (!res.ok) throw new Error('bad response');
    const commits = await res.json();
    if (!Array.isArray(commits)) throw new Error('unexpected shape');

    const buckets = new Array(WEEKS).fill(0);
    const now = Date.now();
    for (const c of commits) {
      const date = new Date(c.commit?.author?.date ?? c.commit?.committer?.date ?? 0).getTime();
      const weeksAgo = Math.floor((now - date) / (7 * 24 * 3600 * 1000));
      const idx = WEEKS - 1 - weeksAgo;
      if (idx >= 0 && idx < WEEKS) buckets[idx]++;
    }

    const max = Math.max(1, ...buckets);
    cells.forEach((cell, i) => {
      const count = buckets[i];
      cell.classList.remove('loading');
      cell.style.background =
        count === 0 ? 'rgba(255,255,255,0.07)' : `rgba(255,122,30,${0.28 + (count / max) * 0.72})`;
      cell.title = `${count} commit${count === 1 ? '' : 's'}`;
    });
  } catch {
    wrap.style.display = 'none';
  }
}

loadTsnsmpStatus();
loadLatestPush();
loadTsnsmpHeat();

setInterval(loadTsnsmpStatus, 60_000);
