const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

let win;

/* ================= helpers ================= */

function tapKey(keyCode) {
  if (!win) return;
  win.webContents.sendInputEvent({ type: "keyDown", keyCode });
  win.webContents.sendInputEvent({ type: "keyUp", keyCode });
}

async function ensureOSD() {
  if (!win) return;

  const js = `
    (function() {
      if (window.__tvOsdReady) return true;

      const style = document.createElement('style');
      style.id = 'tv-osd-style';
      style.textContent = \`
        #tv-volume-osd {
          position: fixed;
          right: 22px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 2147483647;
          font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
          pointer-events: none;
          opacity: 0;
          transition: opacity 150ms ease;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        #tv-volume-osd .panel {
          background: rgba(0,0,0,0.55);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 16px;
          padding: 10px 10px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.35);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        #tv-volume-osd .pct {
          color: #fff;
          font-weight: 800;
          font-size: 14px;
          letter-spacing: 0.4px;
          min-width: 52px;
          text-align: center;
          opacity: 0.95;
        }

        #tv-volume-osd .bar {
          width: 14px;
          height: 160px;
          border-radius: 999px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.12);
          overflow: hidden;
          position: relative;
        }

        #tv-volume-osd .fill {
          position: absolute;
          left: 0;
          bottom: 0;
          width: 100%;
          height: 0%;
          background: rgba(255,255,255,0.9);
          border-radius: 999px;
          transition: height 90ms linear;
        }

        #tv-volume-osd .label {
          color: #fff;
          font-size: 10px;
          letter-spacing: 1.4px;
          opacity: 0.65;
        }
      \`;

      document.documentElement.appendChild(style);

      const wrap = document.createElement('div');
      wrap.id = 'tv-volume-osd';
      wrap.innerHTML = \`
        <div class="panel">
          <div class="pct">--%</div>
          <div class="bar"><div class="fill"></div></div>
          <div class="label">VOL</div>
        </div>
      \`;
      document.documentElement.appendChild(wrap);

      window.__tvOsdReady = true;
      window.__tvOsdTimer = null;

      window.__tvShowVolume = function(pct) {
        const el = document.getElementById('tv-volume-osd');
        if (!el) return;

        const pctEl = el.querySelector('.pct');
        const fillEl = el.querySelector('.fill');

        if (pctEl) pctEl.textContent = pct + '%';
        if (fillEl) fillEl.style.height = Math.max(0, Math.min(100, pct)) + '%';

        el.style.opacity = '1';
        clearTimeout(window.__tvOsdTimer);
        window.__tvOsdTimer = setTimeout(() => {
          el.style.opacity = '0';
        }, 900);
      };

      return true;
    })();
  `;

  try {
    await win.webContents.executeJavaScript(js, true);
  } catch (_) {
    // ignore
  }
}

async function showVolumeOSD(volume01) {
  if (!win) return;

  const pct = Math.round(Math.max(0, Math.min(1, volume01)) * 100);

  const js = `
    (function() {
      if (typeof window.__tvShowVolume === 'function') {
        window.__tvShowVolume(${pct});
      }
    })();
  `;

  try {
    await win.webContents.executeJavaScript(js, true);
  } catch (_) {}
}

async function setYoutubeVolumeDelta(deltaSteps) {
  if (!win) return;

  // 1 step = 5%
  const step = 0.05;

  const js = `
    (function() {
      const vids = Array.from(document.querySelectorAll('video'));
      if (!vids.length) return { ok:false, reason:'no_video' };

      let v0 = vids[0];
      // tenta garantir que não está muted
      for (const v of vids) v.muted = false;

      const current = (v0.volume ?? 1);
      const next = Math.max(0, Math.min(1, current + (${deltaSteps}) * ${step}));

      let changed = 0;
      for (const v of vids) {
        if (v.volume !== next) {
          v.volume = next;
          changed++;
        }
      }

      return { ok:true, volume: next, changed };
    })();
  `;

  try {
    const res = await win.webContents.executeJavaScript(js, true);
    if (res && res.ok) {
      await ensureOSD();
      await showVolumeOSD(res.volume);
    }
  } catch (_) {
    // ignore
  }
}

/* ================= app window ================= */

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 720,
    backgroundColor: "#000000",
    fullscreen: true,
    frame: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // User-Agent (Xbox Series X)
  const XBOX_SERIES_X_UA =
    "Mozilla/5.0 (Xbox; Xbox Series X) AppleWebKit/537.36 (KHTML, like Gecko) " +
    "Chrome/94.0.4606.138 Safari/537.36 Edg/94.0.992.31";
  win.webContents.setUserAgent(XBOX_SERIES_X_UA);

  win.loadURL("https://www.youtube.com/tv");

  // Invisible Cursor
  win.webContents.on("did-finish-load", async () => {
    win.webContents.insertCSS(`
      * { cursor: none !important; }
      body { background: #000 !important; }
    `);


    await ensureOSD();
  });

  // Keyboard Shortcut
  win.webContents.on("before-input-event", (event, input) => {

    if (input.key === "Escape") return;

    // Fullscreen toggle
    if (input.key === "F11") {
      event.preventDefault();
      win.setFullScreen(!win.isFullScreen());
      return;
    }

    if (input.control && input.alt && input.key.toLowerCase() === "f") {
      event.preventDefault();
      win.setFullScreen(!win.isFullScreen());
      return;
    }

    // Close App
    if (input.alt && input.key === "F4") {
      event.preventDefault();
      app.quit();
      return;
    }

    // Reload
    if (input.control && input.key.toLowerCase() === "r") {
      event.preventDefault();
      win.reload();
      return;
    }

    // DevTools
    if (input.control && input.shift && input.key.toLowerCase() === "i") {
      event.preventDefault();
      win.webContents.openDevTools({ mode: "detach" });
      return;
    }
  });
}

/* ================= IPC ================= */

// Close via preload (window.close)
ipcMain.on("tvapp:close", () => {
  if (win) win.close();
});

// Joystick keys
ipcMain.on("pad:key", (_e, key) => {
  if (!win) return;

  const allowed = new Set([
    // Navigation
    "Up", "Down", "Left", "Right",

    // Actions
    "Enter", "Escape", "Space",

    // Youtube Shortcuts
    "J", "L", "S",

    // Media keys
    "MediaPreviousTrack", "MediaNextTrack",
  ]);

  if (!allowed.has(key)) return;

  tapKey(key);
});

// Volume
ipcMain.on("pad:volume", (_e, delta) => {
  if (delta !== 1 && delta !== -1) return;
  setYoutubeVolumeDelta(delta);
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
