const { contextBridge, ipcRenderer } = require("electron");

/* ================= util ================= */

function isPressed(btn) {
  return typeof btn === "object" ? btn.pressed : btn === 1.0;
}

const last = new Map();
function pulse(name, ms) {
  const now = Date.now();
  const prev = last.get(name) || 0;
  if (now - prev < ms) return false;
  last.set(name, now);
  return true;
}

function sendKey(key) {
  ipcRenderer.send("pad:key", key);
}

/* ================= close via window.close ================= */

contextBridge.exposeInMainWorld("tvApp", {
  requestClose: () => ipcRenderer.send("tvapp:close"),
});

window.addEventListener("DOMContentLoaded", () => {
  const oldClose = window.close;
  window.close = function () {
    try { oldClose.call(window); } catch (_) {}
    window.tvApp?.requestClose();
  };
});

/* ================= choose main joystick =================
   Select only joysticks mapped as "Standard" to avoid conflicts with other peripherals.
*/

function pickGamepad(pads) {
  const list = (pads || []).filter(p => p && p.connected);
  const standard = list.find(p => p.mapping === "standard");
  return standard || list[0] || null;
}

/* ================= Mapping ================= */

const cfg = {
  deadzone: 0.35,

  // Navigation
  repeatNav: 200,

  // (Hold) triggers (J/L)
  repeatHold: 130,

  // Buttons (A/B/X/Y/Start/Back)
  repeatBtn: 220,

  // LB/RB media
  repeatMedia: 300,

  // Volume (OSD + player volume)
  repeatVol: 160,
};

function tick() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const gp = pickGamepad(pads);

  if (!gp) {
    requestAnimationFrame(tick);
    return;
  }

  /* -------- Navigation (D-pad + left analogic) -------- */
  if (isPressed(gp.buttons[12]) && pulse("nav_up", cfg.repeatNav)) sendKey("Up");
  if (isPressed(gp.buttons[13]) && pulse("nav_down", cfg.repeatNav)) sendKey("Down");
  if (isPressed(gp.buttons[14]) && pulse("nav_left", cfg.repeatNav)) sendKey("Left");
  if (isPressed(gp.buttons[15]) && pulse("nav_right", cfg.repeatNav)) sendKey("Right");

  const lx = gp.axes?.[0] ?? 0;
  const ly = gp.axes?.[1] ?? 0;

  if (lx < -cfg.deadzone && pulse("ax_left", cfg.repeatNav)) sendKey("Left");
  if (lx > cfg.deadzone && pulse("ax_right", cfg.repeatNav)) sendKey("Right");
  if (ly < -cfg.deadzone && pulse("ax_up", cfg.repeatNav)) sendKey("Up");
  if (ly > cfg.deadzone && pulse("ax_down", cfg.repeatNav)) sendKey("Down");

  /* -------- Confir / Back -------- */
  // Enter = A
  if (isPressed(gp.buttons[0]) && pulse("A_enter", cfg.repeatBtn)) sendKey("Enter");

  // Esc = B and Back
  if (isPressed(gp.buttons[1]) && pulse("B_esc", cfg.repeatBtn)) sendKey("Escape");
  if (isPressed(gp.buttons[8]) && pulse("BACK_esc", cfg.repeatBtn)) sendKey("Escape");

  /* -------- Play/Pause -------- */
  // Espaço = Start and X
  if (isPressed(gp.buttons[9]) && pulse("START_space", cfg.repeatBtn)) sendKey("Space");
  if (isPressed(gp.buttons[2]) && pulse("X_space", cfg.repeatBtn)) sendKey("Space");

  /* -------- Search -------- */
  // S = Y
  if (isPressed(gp.buttons[3]) && pulse("Y_search", cfg.repeatBtn)) sendKey("S");

  /* -------- Previous Video / Next -------- */
  // Mídia: LB/RB
  if (isPressed(gp.buttons[4]) && pulse("LB_prev", cfg.repeatMedia)) sendKey("MediaPreviousTrack");
  if (isPressed(gp.buttons[5]) && pulse("RB_next", cfg.repeatMedia)) sendKey("MediaNextTrack");

  /* -------- Forward/Backward (hold) -------- */
  // J = LT / L = RT
  if (isPressed(gp.buttons[6]) && pulse("LT_j", cfg.repeatHold)) sendKey("J");
  if (isPressed(gp.buttons[7]) && pulse("RT_l", cfg.repeatHold)) sendKey("L");

  /* -------- Volume (player + OSD) --------
     Right analog stick: can be axis 3 or 2 depending on the controller/driver.
  */
  const ry = gp.axes?.[3] ?? gp.axes?.[2] ?? 0;

  if (ry < -cfg.deadzone && pulse("VOL_UP", cfg.repeatVol)) {
    ipcRenderer.send("pad:volume", 1);
  }
  if (ry > cfg.deadzone && pulse("VOL_DOWN", cfg.repeatVol)) {
    ipcRenderer.send("pad:volume", -1);
  }

  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
