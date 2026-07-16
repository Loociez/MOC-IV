const express = require('express');
const cookieParser = require('cookie-parser');
const { createProxyMiddleware, responseInterceptor } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

const TARGET = 'https://play.consty.com';

// --- Set these as Environment Variables in the Render dashboard ---
// SITE_PASSWORD  = a code you make up, given only to trusted players
// CONSTY_EMAIL   = the shared game account's email
// CONSTY_PASSWORD= the shared game account's password
const SITE_PASSWORD = process.env.SITE_PASSWORD || '';
const CONSTY_EMAIL = process.env.CONSTY_EMAIL || '';
const CONSTY_PASSWORD = process.env.CONSTY_PASSWORD || '';

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// ---------- Access gate (separate from the game password) ----------
app.get('/gate', (req, res) => {
  res.send(`<!doctype html><html><body style="font-family:sans-serif;background:#111;color:#eee;
    display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
    <form method="POST" action="/gate" style="text-align:center;">
      <h2>Enter access code</h2>
      <input type="password" name="pw" autofocus
        style="padding:8px;font-size:16px;border-radius:6px;border:1px solid #555;background:#222;color:#eee;" />
      <br /><br />
      <button type="submit" style="padding:8px 16px;border-radius:6px;">Enter</button>
    </form>
  </body></html>`);
});

app.post('/gate', (req, res) => {
  if (SITE_PASSWORD && req.body.pw === SITE_PASSWORD) {
    res.cookie('gate_ok', '1', {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    });
    return res.redirect('/');
  }
  res.status(401).send('Wrong code. <a href="/gate">Try again</a>');
});

function requireGate(req, res, next) {
  if (req.cookies && req.cookies.gate_ok === '1') return next();
  return res.redirect('/gate');
}

// ---------- Script injected into the proxied HTML ----------
const AUTOLOGIN_SNIPPET = `
<script>
(function () {
  var EMAIL = ${JSON.stringify(CONSTY_EMAIL)};
  var PASSWORD = ${JSON.stringify(CONSTY_PASSWORD)};

  var style = document.createElement('style');
  style.textContent =
    '#winLogin button[title="Modify account"],' +
    '#winLogin button[title="Recover account"],' +
    '#winLogin button[title="Register new account"],' +
    '#winSelectPlayer button[title="Remove selected player"],' +
    '#winSelectPlayer button[title="Back to login"]' +
    '{display:none!important;}';
  document.documentElement.appendChild(style);

  // Hard once-only flags. Set BEFORE clicking so a rapid re-fire of the
  // observer (which happens a lot in this game's UI) can never queue a
  // second click/connect attempt.
  var loginClicked = false;
  var playClicked = false;

  function tryLogin() {
    if (loginClicked) return;
    var form = document.getElementById('winLogin');
    if (!form) return;
    var emailInput = form.querySelector('input[name="txtEmail"]');
    var passInput = form.querySelector('input[name="txtPassword"]');
    var loginBtn = form.querySelector('button[title="Login"]');
    if (!emailInput || !passInput || !loginBtn) return;
    loginClicked = true;
    emailInput.value = EMAIL;
    passInput.value = PASSWORD;
    loginBtn.click();
  }

  function tryPlay() {
    if (playClicked) return;
    var form = document.getElementById('winSelectPlayer');
    if (!form) return;
    var playBtn = form.querySelector('button[title="Play player"]');
    if (!playBtn) return;
    playClicked = true;
    playBtn.click();
  }

  var observer = new MutationObserver(function () {
    tryLogin();
    tryPlay();
    if (loginClicked && playClicked) observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  tryLogin();
  tryPlay();

  // Safety net: stop watching the DOM after 30s no matter what, so a stuck
  // state can't leave a heavy observer running indefinitely.
  setTimeout(function () { observer.disconnect(); }, 30000);
})();
</script>
`;

// ---------- Reverse proxy to the game, with HTML injection ----------
const proxyMiddleware = createProxyMiddleware({
  target: TARGET,
  changeOrigin: true,
  ws: true,
  selfHandleResponse: true,
  onProxyRes: responseInterceptor(async (responseBuffer, proxyRes) => {
    const contentType = proxyRes.headers['content-type'] || '';
    if (!contentType.includes('text/html')) return responseBuffer;
    let body = responseBuffer.toString('utf8');
    body = body.includes('</body>')
      ? body.replace('</body>', AUTOLOGIN_SNIPPET + '</body>')
      : body + AUTOLOGIN_SNIPPET;
    return body;
  }),
});

app.use('/', requireGate, proxyMiddleware);

const server = app.listen(PORT, () => {
  console.log('Proxy running on port ' + PORT);
});

// WebSocket upgrades bypass Express middleware, so wire them up separately
server.on('upgrade', proxyMiddleware.upgrade);