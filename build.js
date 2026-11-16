const fs = require('fs'), path = require('path');
const SITE_NAME = 'Click & Get The Job';
const SITE_URL = (process.env.URL || 'https://YOURSITE.netlify.app').replace(/\/$/, '');
const ADSENSE = process.env.ADSENSE_CLIENT || '';            // e.g. ca-pub-1234567890123456
const EMAIL = process.env.CONTACT_EMAIL || 'youremail@example.com';
const FB = 'https://www.facebook.com/share/1DvAUSkTuj/';
const esc = s => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" rel="nofollow noopener" target="_blank">$1</a>');
function md(t) {
  const out = []; let list = false, para = [];
  const fp = () => { if (para.length) { out.push('<p>' + para.join('<br>') + '</p>'); para = []; } };
  const fl = () => { if (list) { out.push('</ul>'); list = false; } };
  for (const raw of String(t).split(/\r?\n/)) {
    const l = raw.trim(); let m;
    if (!l) { fp(); fl(); continue; }
    if ((m = l.match(/^(#{1,3})\s+(.*)/))) { fp(); fl(); const n = m[1].length + 1; out.push(`<h${n}>${inline(m[2])}</h${n}>`); }
    else if ((m = l.match(/^[-*]\s+(.*)/))) { fp(); if (!list) { out.push('<ul>'); list = true; } out.push('<li>' + inline(m[1]) + '</li>'); }
    else { fl(); para.push(inline(l)); }
  }
  fp(); fl(); return out.join('\n');
}
function parse(f) {
  const m = fs.readFileSync(f, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return null;
  const d = {};
  for (const l of m[1].split(/\r?\n/)) { const k = l.match(/^(\w+):\s*(.*)$/); if (k) d[k[1]] = k[2].trim().replace(/^(["'])(.*)\1$/, '$2'); }
  d.body = m[2]; return d;
}
const fmt = d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const ad = () => ADSENSE ? `<div class="ad"><ins class="adsbygoogle" style="display:block" data-ad-client="${ADSENSE}" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></div>` : '';
const layout = (title, desc, body, p) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${SITE_URL}${p}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><link rel="stylesheet" href="/style.css">${ADSENSE ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE}" crossorigin="anonymous"></script>` : ''}</head><body><header><a class="logo" href="/">${esc(SITE_NAME)}</a><nav><a href="/">Jobs</a><a href="/about/">About</a><a href="/contact/">Contact</a></nav></header><main>${body}</main><footer><p>&copy; ${new Date().getFullYear()} ${esc(SITE_NAME)} &middot; <a href="/about/">About</a> &middot; <a href="/contact/">Contact</a> &middot; <a href="/privacy-policy/">Privacy Policy</a> &middot; <a href="/disclaimer/">Disclaimer</a></p><p><a href="${FB}" target="_blank" rel="noopener">Follow us on Facebook</a></p></footer></body></html>`;

fs.rmSync('dist', { recursive: true, force: true });
const w = (p, c) => { const f = path.join('dist', p); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, c); };

const jobs = fs.readdirSync('content/jobs').filter(f => f.endsWith('.md')).map(f => {
  const d = parse(path.join('content/jobs', f)); if (!d || !d.title) return null;
  d.slug = f.replace(/\.md$/, ''); d.date = d.date || new Date().toISOString(); return d;
}).filter(Boolean).sort((a, b) => new Date(b.date) - new Date(a.date));

for (const j of jobs) {
  const url = `${SITE_URL}/jobs/${j.slug}/`, share = encodeURIComponent(url);
  const rows = [['Company', j.company], ['Location', j.location], ['Category', j.category], ['Salary', j.salary], ['Last Date', j.deadline]]
    .filter(r => r[1]).map(r => `<tr><th>${r[0]}</th><td>${esc(r[1])}</td></tr>`).join('');
  const apply = j.apply_link ? (/^https?:/.test(j.apply_link) ? `<a class="btn" href="${esc(j.apply_link)}" target="_blank" rel="nofollow noopener">Apply Now</a>` : `<p><strong>Apply:</strong> ${esc(j.apply_link)}</p>`) : '';
  w(`jobs/${j.slug}/index.html`, layout(`${j.title} - ${SITE_NAME}`, `${j.title} at ${j.company || ''} ${j.location || ''}. Last date: ${j.deadline || 'see details'}.`,
    `<article><h1>${esc(j.title)}</h1><p class="meta">Posted ${fmt(j.date)}</p><table>${rows}</table>${ad()}${md(j.body)}${apply}<p class="warn"><strong>Warning:</strong> Never pay any fee or advance for a job. Verify the employer before sharing documents.</p><p><a class="btn alt" href="https://www.facebook.com/sharer/sharer.php?u=${share}" target="_blank" rel="noopener">Share on Facebook</a> <a class="btn alt" href="https://wa.me/?text=${encodeURIComponent(j.title + ' ')}${share}" target="_blank" rel="noopener">Share on WhatsApp</a></p>${ad()}<p><a href="/">&larr; All jobs</a></p></article>`, `/jobs/${j.slug}/`));
}

const cats = [...new Set(jobs.map(j => j.category).filter(Boolean))];
const cards = jobs.map(j => `<a class="card" href="/jobs/${j.slug}/" data-c="${esc(j.category)}" data-s="${esc((j.title + ' ' + j.company + ' ' + j.location + ' ' + j.category).toLowerCase())}"><h3>${esc(j.title)}</h3><p>${esc(j.company)}${j.location ? ' &middot; ' + esc(j.location) : ''}</p><p class="meta">${esc(j.category)} &middot; ${fmt(j.date)}${j.deadline ? ' &middot; Last date: ' + esc(j.deadline) : ''}</p></a>`).join('\n');
w('index.html', layout(`${SITE_NAME} - Latest Jobs in Pakistan`, 'Daily job updates, hiring alerts and career tips for Pakistan.',
  `<section class="hero"><h1>Latest Jobs in Pakistan</h1><p>Daily job updates, hiring alerts and career tips.</p><input id="q" type="search" placeholder="Search jobs, city, company..."><div class="chips"><button class="chip on" data-c="">All</button>${cats.map(c => `<button class="chip" data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div></section>${ad()}<section class="list">${cards || '<p>No jobs yet.</p>'}</section><script>const q=document.getElementById('q'),cs=[...document.querySelectorAll('.chip')],cd=[...document.querySelectorAll('.card')];let cat='';function f(){const t=q.value.toLowerCase();cd.forEach(c=>{c.hidden=!(c.dataset.s.includes(t)&&(!cat||c.dataset.c===cat))})}q.oninput=f;cs.forEach(b=>b.onclick=()=>{cat=b.dataset.c;cs.forEach(x=>x.classList.toggle('on',x===b));f()})</script>`, '/'));

const pages = {
  'about': ['About Us', `<p>${esc(SITE_NAME)} is a job information platform for Pakistan. We publish daily job openings, hiring alerts and career guidance for job seekers in Karachi, Sindh and across the country.</p><p>Our team collects job information from official announcements and employer notices, rewrites it clearly, and shares it for free. We never charge job seekers any fee.</p><p>Follow our <a href="${FB}" target="_blank" rel="noopener">Facebook page</a> for daily updates.</p>`],
  'contact': ['Contact Us', `<p>For job posting inquiries, advertising or feedback, email us at <a href="mailto:${esc(EMAIL)}">${esc(EMAIL)}</a> or message us on our <a href="${FB}" target="_blank" rel="noopener">Facebook page</a>.</p>`],
  'privacy-policy': ['Privacy Policy', `<p>Last updated: ${new Date().getFullYear()}. This site respects your privacy.</p><h2>Information we collect</h2><p>We do not ask visitors to create accounts. We may collect non-personal data such as browser type, pages visited and approximate location through analytics tools.</p><h2>Cookies and advertising</h2><p>We use Google AdSense to show ads. Google and its partners use cookies to serve ads based on your visits to this and other websites. You can opt out of personalised advertising at <a href="https://adssettings.google.com" rel="nofollow noopener">Google Ads Settings</a>.</p><h2>External links</h2><p>Job posts link to third-party websites. We are not responsible for their content or privacy practices.</p><h2>Contact</h2><p>Questions about this policy: ${esc(EMAIL)}.</p>`],
  'disclaimer': ['Disclaimer', `<p>Job information on this site is collected from public sources and employer announcements for general information only. We do not guarantee any job, and we are not the employer or a recruitment agency.</p><p>Always verify the employer before applying. Never pay money for a job, interview or visa. We are not responsible for losses from dealings with third parties.</p>`]
};
for (const [s, [t, b]] of Object.entries(pages)) w(`${s}/index.html`, layout(`${t} - ${SITE_NAME}`, `${t} for ${SITE_NAME}`, `<article><h1>${t}</h1>${b}</article>`, `/${s}/`));

w('style.css', `*{box-sizing:border-box}body{margin:0;font:16px/1.6 system-ui,sans-serif;color:#1d2330;background:#f5f7fb}a{color:#0b5fd7}header{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;padding:12px 16px;background:#0f2a5c}.logo{color:#fff;font-weight:700;font-size:1.15rem;text-decoration:none}nav a{color:#cfe0ff;margin-left:14px;text-decoration:none}main{max-width:820px;margin:0 auto;padding:16px}.hero{text-align:center;padding:18px 0}.hero h1{margin:.2em 0}input{width:100%;padding:12px;border:1px solid #c9d2e3;border-radius:10px;font-size:1rem}.chips{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:12px}.chip{border:1px solid #c9d2e3;background:#fff;border-radius:20px;padding:6px 14px;cursor:pointer}.chip.on{background:#0b5fd7;color:#fff;border-color:#0b5fd7}.card{display:block;background:#fff;border-radius:12px;padding:14px 16px;margin:10px 0;text-decoration:none;color:inherit;box-shadow:0 1px 3px rgba(0,0,0,.08)}.card[hidden]{display:none}.card h3{margin:0 0 4px;color:#0b5fd7}.card p{margin:2px 0}.meta{color:#667;font-size:.9rem}article{background:#fff;padding:18px;border-radius:12px}table{width:100%;border-collapse:collapse;margin:12px 0}th,td{text-align:left;padding:8px;border-bottom:1px solid #e3e8f2}th{width:35%;color:#445}.btn{display:inline-block;background:#0b5fd7;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;margin:6px 4px 6px 0}.btn.alt{background:#e8eefb;color:#0b5fd7}.warn{background:#fff6e0;padding:10px;border-radius:8px}.ad{margin:14px 0;min-height:60px}footer{text-align:center;padding:20px 16px;color:#556;font-size:.9rem}`);
w('robots.txt', `User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: ${SITE_URL}/sitemap.xml\n`);
w('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/', ...Object.keys(pages).map(p => `/${p}/`), ...jobs.map(j => `/jobs/${j.slug}/`)].map(u => `<url><loc>${SITE_URL}${u}</loc></url>`).join('')}</urlset>`);
if (ADSENSE) w('ads.txt', `google.com, ${ADSENSE.replace('ca-', '')}, DIRECT, f08c47fec0942fa0\n`);
fs.cpSync('admin', 'dist/admin', { recursive: true });
if (fs.existsSync('uploads')) fs.cpSync('uploads', 'dist/uploads', { recursive: true });
console.log(`Built ${jobs.length} job(s)`);
