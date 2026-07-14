// Click-to-copy for the email CTA(s) and the Discord handle mention — ported from the original site.

document.querySelectorAll<HTMLAnchorElement>('.copy-email-btn').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    navigator.clipboard
      .writeText('vanushka060@gmail.com')
      .then(() => {
        const orig = btn.innerHTML;
        const origBg = btn.style.background;
        btn.innerHTML = 'Copied ✓';
        btn.style.background = 'linear-gradient(135deg,#4ade80,#22c55e)';
        btn.style.color = '#022c0e';
        setTimeout(() => {
          btn.innerHTML = orig;
          btn.style.background = origBg;
          btn.style.color = '';
        }, 2200);
      })
      .catch(() => {
        window.location.href = 'mailto:vanushka060@gmail.com';
      });
  });
});

const discordBtn = document.getElementById('copy-discord-btn');
if (discordBtn) {
  discordBtn.addEventListener('click', () => {
    navigator.clipboard.writeText('@fantacat').then(() => {
      const orig = discordBtn.textContent;
      discordBtn.textContent = 'copied!';
      discordBtn.style.color = '#4ade80';
      setTimeout(() => {
        discordBtn.textContent = orig;
        discordBtn.style.color = '';
      }, 1800);
    });
  });
}
