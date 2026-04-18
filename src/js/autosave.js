// Shared autosave utilities — IndexedDB + File System Access API
// Requires DOM elements: #autosave-bar, #as-icon, #as-text, #as-flash

const IDB_DB = "cka-autosave", IDB_STORE = "handles";
const HAS_FSA = typeof window.showSaveFilePicker === "function";

function idbOpen() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(IDB_DB, 1);
    r.onupgradeneeded = e => e.target.result.createObjectStore(IDB_STORE);
    r.onsuccess = e => res(e.target.result); r.onerror = rej;
  });
}

async function idbGet(key) {
  const db = await idbOpen();
  return new Promise(res => {
    const r = db.transaction(IDB_STORE).objectStore(IDB_STORE).get(key);
    r.onsuccess = () => res(r.result ?? null); r.onerror = () => res(null);
  });
}

async function idbSet(key, val) {
  const db = await idbOpen();
  return new Promise(res => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(val, key); tx.oncomplete = res; tx.onerror = res;
  });
}

async function idbDel(key) {
  const db = await idbOpen();
  return new Promise(res => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).delete(key); tx.oncomplete = res; tx.onerror = res;
  });
}

async function canWrite(h) {
  const o = { mode: "readwrite" };
  if ((await h.queryPermission(o)) === "granted") return true;
  if ((await h.requestPermission(o)) === "granted") return true;
  return false;
}

async function writeHandle(h, data, marker) {
  const w = await h.createWritable();
  await w.write(JSON.stringify({ _type: marker, saved: new Date().toISOString(), data }, null, 2));
  await w.close();
}

async function readHandle(h, marker) {
  const text = await (await h.getFile()).text();
  const p = JSON.parse(text);
  if (p._type !== marker) throw new Error("wrong file");
  return p.data || {};
}

function asFlash(msg, color) {
  const el = document.getElementById("as-flash");
  if (!el) return;
  el.textContent = msg; el.style.color = color || "#16a34a";
  el.classList.add("show"); setTimeout(() => el.classList.remove("show"), 2000);
}

function mkBtn(label, cls, fn) {
  const b = document.createElement("button");
  b.className = "as-btn" + (cls ? " " + cls : ""); b.textContent = label; b.onclick = fn; return b;
}

function setBarText(el, parts) {
  el.textContent = "";
  parts.forEach(p => {
    if (typeof p === "string") {
      el.appendChild(document.createTextNode(p));
    } else {
      const node = document.createElement(p.tag || "span");
      if (p.style) node.setAttribute("style", p.style);
      node.textContent = p.text;
      el.appendChild(node);
    }
  });
}

// cbs: { pickFile, reEnable, manualExport, manualImport }
function setBarState(state, filename, cbs) {
  const bar = document.getElementById("autosave-bar");
  const icon = document.getElementById("as-icon");
  const text = document.getElementById("as-text");
  if (!bar) return;
  bar.className = "autosave-bar state-" + state;
  bar.querySelectorAll(".as-btn, input[type=file]").forEach(el => el.remove());
  const fin = document.getElementById("as-flash");

  if (state === "active") {
    icon.textContent = "✅";
    setBarText(text, ["Auto-saving to ", { tag: "strong", text: filename }]);
    bar.insertBefore(mkBtn("Change file", "", cbs.pickFile), fin);
  } else if (state === "perm") {
    icon.textContent = "⚠️";
    setBarText(text, [{ tag: "strong", text: "Click to re-enable auto-save" }, " — browser needs one-time permission"]);
    bar.insertBefore(mkBtn("Re-enable", "amber", cbs.reEnable), fin);
  } else if (state === "none") {
    icon.textContent = "💾";
    setBarText(text, [{ tag: "strong", text: "Set up auto-save" }, " — pick a file once, then it saves automatically"]);
    bar.insertBefore(mkBtn("Set up auto-save", "primary", cbs.pickFile), fin);
  } else { // fallback (Firefox etc.)
    icon.textContent = "⚠️";
    setBarText(text, [
      "Auto-save is not supported in this browser. Use manual export/import below.",
      { tag: "br", text: "" },
      { tag: "span", style: "font-size:11px;opacity:0.75", text: "Auto-save works in: Chrome 86+, Edge 86+, Opera 72+. Not supported in Firefox or Safari." }
    ]);
    const inp = document.createElement("input"); inp.type = "file"; inp.accept = ".json"; inp.style.display = "none"; inp.onchange = cbs.manualImport;
    bar.insertBefore(mkBtn("Export", "primary", cbs.manualExport), fin);
    bar.insertBefore(mkBtn("Import", "", () => inp.click()), fin);
    bar.insertBefore(inp, fin);
  }
}
