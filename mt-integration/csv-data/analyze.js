// Analyze all 8 product Excels: sizes, colors (known vs new) vs current option master.
const fs = require("fs");
const path = require("path");
const ROOT = "C:/Users/Taku/Pictures/print-world/mt-integration";
const WORK = ROOT + "/csv-data/_work";

// ---- current option master = optmap.json + the 37 colors added by 5001-01 ----
const opt = JSON.parse(fs.readFileSync(ROOT + "/csv/_optmap.json", "utf8"));
const colorId = Object.assign({}, opt.colors); // name -> id (strings)
const sizeId = Object.assign({}, opt.sizes);

// reconstruct 5001-01's 37 new colors: newcolors CSV rows are in 表示順 order, ids = 6241+i
function readCsvCol(file, colIdx) {
  const u = require("child_process").execSync('iconv -f CP932 -t UTF-8 "' + file + '"').toString();
  return u.trim().split(/\r?\n/).slice(1).map(l => {
    const m = l.match(/(".*?"|[^,]*)(,|$)/g).map(s => s.replace(/,$/, "").replace(/^"|"$/g, ""));
    return m[colIdx];
  });
}
try {
  const names = readCsvCol(ROOT + "/csv-5001/5001-01_1_newcolors.csv", 3); // 値 column
  names.forEach((nm, i) => { if (nm && !colorId[nm]) colorId[nm] = String(6241 + i); });
} catch (e) { console.log("WARN: could not load 5001 newcolors:", e.message); }

// ---- xlsx sheet1 parser (handles inlineStr, t="str" inline <x:v>, and shared strings t="s") ----
function parseSheet(dir) {
  const shPath = dir + "/xl/worksheets/sheet1.xml";
  const xml = fs.readFileSync(shPath, "utf8");
  let shared = [];
  const ssPath = dir + "/xl/sharedStrings.xml";
  if (fs.existsSync(ssPath)) {
    const ss = fs.readFileSync(ssPath, "utf8");
    shared = (ss.match(/<(?:x:)?si>[\s\S]*?<\/(?:x:)?si>/g) || []).map(si => {
      const t = si.match(/<(?:x:)?t[^>]*>([\s\S]*?)<\/(?:x:)?t>/g) || [];
      return t.map(x => x.replace(/<[^>]+>/g, "")).join("");
    });
  }
  const rows = {};
  const cellRe = /<(?:x:)?c r="([A-Z]+)(\d+)"([^>]*)>([\s\S]*?)<\/(?:x:)?c>/g;
  let m;
  while ((m = cellRe.exec(xml))) {
    const col = m[1], row = +m[2], attr = m[3], inner = m[4];
    let val = "";
    const tMatch = attr.match(/t="([^"]+)"/);
    const t = tMatch ? tMatch[1] : "";
    if (t === "inlineStr") {
      val = (inner.match(/<(?:x:)?t[^>]*>([\s\S]*?)<\/(?:x:)?t>/) || [, ""])[1];
    } else {
      const v = (inner.match(/<(?:x:)?v>([\s\S]*?)<\/(?:x:)?v>/) || [, ""])[1];
      val = (t === "s") ? (shared[+v] || "") : v;
    }
    (rows[row] = rows[row] || {})[col] = val;
  }
  return Object.keys(rows).map(Number).sort((a, b) => a - b).slice(1)
    .map(r => ({ hin: rows[r].A, size: rows[r].B, ccode: rows[r].C, cname: rows[r].D, price: rows[r].E }))
    .filter(x => x && x.ccode && x.size);
}

// ---- analyze each product ----
const dirs = fs.readdirSync(WORK).filter(d => fs.statSync(path.join(WORK, d)).isDirectory()).sort();
const allNewColors = new Map(); // name -> code (first seen)
const allNewSizes = new Set();
console.log("code | rows | sizes | colors | NEWcolors | NEWsizes | price(税込)min-max");
console.log("-----------------------------------------------------------------------------");
const summary = [];
for (const code of dirs) {
  const rows = parseSheet(path.join(WORK, code));
  const sizes = [...new Set(rows.map(r => r.size))];
  const colors = [...new Set(rows.map(r => r.cname))];
  const newC = colors.filter(c => !colorId[c]);
  const newS = sizes.filter(s => !sizeId[s]);
  newC.forEach(c => { const row = rows.find(r => r.cname === c); if (!allNewColors.has(c)) allNewColors.set(c, row.ccode); });
  newS.forEach(s => allNewSizes.add(s));
  const prices = rows.map(r => +r.price).filter(x => x > 0);
  const pr = prices.length ? Math.min(...prices) + "-" + Math.max(...prices) : "?";
  console.log(`${code} | ${rows.length} | ${sizes.length}(${sizes.join("/")}) | ${colors.length} | ${newC.length} | ${newS.length}(${newS.join("/") || "-"}) | ${pr}`);
  summary.push({ code, rows: rows.length, sizes, colors: colors.length, newC, newS });
}
console.log("\n===== 集約: 全商品で新規のカラー (master未登録) =====");
console.log("新規カラー総数:", allNewColors.size);
for (const [name, ccode] of allNewColors) console.log("  " + name + " (code " + ccode + ")");
console.log("\n===== 集約: 全商品で新規のサイズ (master未登録) =====");
console.log([...allNewSizes].join(", ") || "なし（全サイズ既存）");
