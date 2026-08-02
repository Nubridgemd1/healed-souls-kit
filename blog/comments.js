/* ============================================================================
 * Healed Souls — blog comments widget
 * ----------------------------------------------------------------------------
 * Lets blog readers comment on each article. Drop this on a page with:
 *     <div id="hs-comments" data-slug="unique-post-slug"></div>
 *     <script src="comments.js"></script>
 *
 * LIVE mode : set SUPABASE_URL + SUPABASE_ANON_KEY below — comments are then
 *             real and shared across ALL readers and devices.
 * DEMO mode : if blank, comments save in the reader's own browser (great for
 *             previewing). No account or backend needed to try it.
 *
 * One-time Supabase setup (free, ~3 min): create a project, run this SQL, then
 * paste the Project URL + anon public key below.
 *   create table comments (
 *     id uuid primary key default gen_random_uuid(),
 *     post_slug text not null, name text not null, body text not null,
 *     status text default 'approved', created_at timestamptz default now());
 *   alter table comments enable row level security;
 *   create policy "read"   on comments for select using (true);
 *   create policy "insert" on comments for insert with check (true);
 * (Optional) set WEB3FORMS_KEY to also email the office when a comment is posted.
 * ==========================================================================*/
(function () {
  var SUPABASE_URL = '';
  var SUPABASE_ANON_KEY = '';
  var WEB3FORMS_KEY = '';
  var OFFICE_EMAIL = 'healingsoulhealthcare@gmail.com';
  var LIVE = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

  function sb(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY, 'Content-Type': 'application/json' }, opts.headers || {});
    return fetch(SUPABASE_URL + '/rest/v1/' + path, opts).then(function (r) { if (!r.ok) throw new Error(r.status); return r.status === 204 ? null : r.json(); });
  }
  function lsGet(k) { try { return JSON.parse(localStorage.getItem('hs_c_' + k)) || []; } catch (e) { return []; } }
  function lsSet(k, v) { try { localStorage.setItem('hs_c_' + k, JSON.stringify(v)); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }
  function initials(n) { return (n || '?').trim().split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase(); }
  function when(iso) { try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); } catch (e) { return ''; } }

  function getComments(slug) {
    if (LIVE) return sb('comments?post_slug=eq.' + encodeURIComponent(slug) + '&status=eq.approved&order=created_at.asc');
    return Promise.resolve(lsGet(slug));
  }
  function addComment(slug, name, body) {
    var c = { post_slug: slug, name: name, body: body, status: 'approved', created_at: new Date().toISOString() };
    if (WEB3FORMS_KEY) {
      fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ access_key: WEB3FORMS_KEY, subject: 'New blog comment — ' + slug, from_name: 'Healed Souls Blog', 'Comment on': slug, Name: name, Comment: body }) }).catch(function () {});
    }
    if (LIVE) return sb('comments', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(c) });
    var all = lsGet(slug); c.id = 'id' + Date.now(); all.push(c); lsSet(slug, all); return Promise.resolve(c);
  }

  var CSS = '' +
    '.hsc{max-width:760px;margin:8px auto 50px;font-family:Mulish,system-ui,sans-serif}' +
    '.hsc-h{font-family:"Cormorant Garamond",Georgia,serif;font-size:27px;color:#0e5551;font-weight:700;display:flex;align-items:center;gap:10px}' +
    '.hsc-dot{width:9px;height:9px;border-radius:50%;background:#14746f;box-shadow:0 0 0 4px #e3f1ee}' +
    '.hsc-note{color:#8a94a3;font-size:13px;margin:4px 0 16px}' +
    '.hsc-mode{display:inline-block;font-size:11.5px;font-weight:700;padding:4px 11px;border-radius:20px;margin-bottom:14px}' +
    '.hsc-form{background:#f4f9f7;border:1px solid #d9e7e3;border-radius:14px;padding:18px;margin-bottom:22px}' +
    '.hsc-form input,.hsc-form textarea{width:100%;font-family:inherit;font-size:14.5px;color:#17302d;background:#fff;border:1.5px solid #d9e7e3;border-radius:10px;padding:11px 13px;margin-bottom:10px}' +
    '.hsc-form input:focus,.hsc-form textarea:focus{outline:none;border-color:#14746f;box-shadow:0 0 0 3px #e3f1ee}' +
    '.hsc-form textarea{resize:vertical;min-height:78px}' +
    '.hsc-btn{background:#14746f;color:#fff;border:none;border-radius:30px;font-weight:800;font-size:14px;padding:11px 22px;cursor:pointer;font-family:inherit}' +
    '.hsc-btn:hover{background:#0e5551}' +
    '.hsc-list{display:flex;flex-direction:column;gap:12px}' +
    '.hsc-item{background:#fff;border:1px solid #e7ded0;border-radius:12px;padding:14px 16px}' +
    '.hsc-top{display:flex;align-items:center;gap:10px;margin-bottom:5px}' +
    '.hsc-av{width:34px;height:34px;border-radius:50%;background:#e3f1ee;color:#14746f;font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center}' +
    '.hsc-nm{font-weight:800;color:#0e5551;font-size:14.5px}.hsc-dt{font-size:12px;color:#8a94a3}' +
    '.hsc-tx{font-size:14.5px;color:#465c58;line-height:1.6}' +
    '.hsc-empty{color:#8a94a3;font-size:14px;padding:8px 0}' +
    '.hsc-toast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%) translateY(120px);background:#0e5551;color:#fff;padding:12px 20px;border-radius:30px;font-weight:700;font-size:14px;transition:transform .3s;z-index:100}.hsc-toast.on{transform:translateX(-50%) translateY(0)}';

  function boot() {
    var host = document.getElementById('hs-comments');
    if (!host) return;
    var slug = host.getAttribute('data-slug') || (location.pathname.split('/').pop() || 'post').replace('.html', '');
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    host.className = 'hsc';
    host.innerHTML =
      '<div class="hsc-h">Join the conversation<span class="hsc-dot"></span></div>' +
      '<div class="hsc-mode" style="' + (LIVE ? 'background:#eaf6ee;color:#1a7f43' : 'background:#f3e6c8;color:#9a6a12') + '">' + (LIVE ? '🟢 Live — comments are shared with all readers' : '🟡 Preview — comments save in your browser') + '</div>' +
      '<div class="hsc-note">Please keep comments kind and don’t share private health details. In a crisis, call or text 988.</div>' +
      '<form class="hsc-form" id="hscForm"><input id="hscName" placeholder="Your name (or initials)" maxlength="60" required><textarea id="hscBody" placeholder="Share a thought or question…" maxlength="1200" required></textarea><button class="hsc-btn" type="submit">Post Comment</button></form>' +
      '<div class="hsc-list" id="hscList"></div>' +
      '<div class="hsc-toast" id="hscToast"></div>';

    function toast(m) { var t = document.getElementById('hscToast'); t.textContent = m; t.classList.add('on'); setTimeout(function () { t.classList.remove('on'); }, 2400); }
    function render() {
      getComments(slug).then(function (cs) {
        var el = document.getElementById('hscList');
        el.innerHTML = cs.length ? cs.map(function (c) {
          return '<div class="hsc-item"><div class="hsc-top"><div class="hsc-av">' + esc(initials(c.name)) + '</div><div><div class="hsc-nm">' + esc(c.name) + '</div><div class="hsc-dt">' + when(c.created_at) + '</div></div></div><div class="hsc-tx">' + esc(c.body) + '</div></div>';
        }).join('') : '<div class="hsc-empty">Be the first to share a thought.</div>';
      }).catch(function () { document.getElementById('hscList').innerHTML = '<div class="hsc-empty">Comments are unavailable right now.</div>'; });
    }
    document.getElementById('hscForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('hscName').value.trim(), body = document.getElementById('hscBody').value.trim();
      if (!name || !body) return;
      addComment(slug, name, body).then(function () { document.getElementById('hscName').value = ''; document.getElementById('hscBody').value = ''; toast('Comment posted ✓'); render(); });
    });
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
