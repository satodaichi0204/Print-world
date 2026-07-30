// Batch generator for 7 United Athle products (5001-01 already registered -> excluded).
// Outputs per-product folders with item/itemIndiv/posimage/workOver/stock CSVs,
// plus _masters/newcolors.csv + newsizes.csv. UTF-8 here; converted to CP932 after.
const fs = require("fs");
const path = require("path");
const ROOT = "C:/Users/Taku/Pictures/print-world/mt-integration";
const CD = ROOT + "/csv-data";
const WORK = CD + "/_work";

// ---------- product configs (name from sheet2; material = best guess, VERIFY; jan = distinct base) ----------
// itemId = MT-assigned アイテムID (confirmed 2026-07-31 after item.csv upload)
const PRODUCTS = {
  "2020-01": { itemId: "13567", name: "4.7オンス スペシャルドライカノコ ポロシャツ（ローブリード）", material: "ポリエステル100%", jan: 2900000030001, sizeHtml: "XS,S,M,L,XL,XXL,XXXL,XXXXL,5XL" },
  "2024-01": { itemId: "13568", name: "4.7オンス スペシャルドライカノコ ロングスリーブ ポロシャツ（ポケット付）（ローブリード）", material: "ポリエステル100%", jan: 2900000031001, sizeHtml: "S,M,L,XL,XXL" },
  "5010-01": { itemId: "13569", name: "5.6オンス ロングスリーブ Tシャツ", material: "綿100%", jan: 2900000032001, sizeHtml: "S,M,L,XL,XXL" },
  "5041-01": { itemId: "13570", name: "5.6オンス ラグランスリーブ Tシャツ", material: "綿100%", jan: 2900000033001, sizeHtml: "S,M,L,XL" },
  "5397-01": { itemId: "13571", name: "8.8オンス オーセンティックパイル スウェット フルジップパーカ（裏パイル）", material: "綿90% ポリエステル10%", jan: 2900000034001, sizeHtml: "S,M,L,XL,XXL" },
  "5399-01": { itemId: "13572", name: "8.8オンス オーセンティックパイル クルーネックスウェット（裏パイル）", material: "綿90% ポリエステル10%", jan: 2900000035001, sizeHtml: "S,M,L,XL,XXL" },
  "5942-01": { itemId: "13573", name: "6.2オンス プレミアム Tシャツ", material: "綿100%", jan: 2900000036001, sizeHtml: "XS,S,M,L,XL,XXL,XXXL" },
};
const ORDER = Object.keys(PRODUCTS); // deterministic

// ---------- predicted ID bases (VERIFY after upload; regenerate if different) ----------
const NEWCOLOR_ID_START = 6278;   // current master max color id = 6277
const NEWCOLOR_DISP_START = 237;  // 5001-01 used 表示順 200..236
const NEWSIZE_ID_START = 6302;    // = NEWCOLOR_ID_START + 24 new colors (upload colors FIRST, then sizes)
const NEWSIZE_DISP_START = 20;    // current size 表示順 max = 19 (5L)

// ---------- master maps (optmap + 37 colors from 5001-01) ----------
const opt = JSON.parse(fs.readFileSync(ROOT + "/csv/_optmap.json", "utf8"));
const colorId = Object.assign({}, opt.colors);
const sizeId = Object.assign({}, opt.sizes);
(function () {
  const u = require("child_process").execSync('iconv -f CP932 -t UTF-8 "' + ROOT + '/csv-5001/5001-01_1_newcolors.csv"').toString();
  u.trim().split(/\r?\n/).slice(1).forEach((l, i) => {
    const nm = (l.match(/(".*?"|[^,]*)(,|$)/g).map(s => s.replace(/,$/, "").replace(/^"|"$/g, "")))[3];
    if (nm && !colorId[nm]) colorId[nm] = String(6241 + i);
  });
})();

// ---------- xlsx sheet1 parser (namespace-agnostic; inlineStr / str / shared) ----------
function parseSheet(dir) {
  const xml = fs.readFileSync(dir + "/xl/worksheets/sheet1.xml", "utf8");
  let shared = [];
  const ssPath = dir + "/xl/sharedStrings.xml";
  if (fs.existsSync(ssPath)) {
    const ss = fs.readFileSync(ssPath, "utf8");
    shared = (ss.match(/<(?:x:)?si>[\s\S]*?<\/(?:x:)?si>/g) || []).map(si =>
      (si.match(/<(?:x:)?t[^>]*>([\s\S]*?)<\/(?:x:)?t>/g) || []).map(t => t.replace(/<[^>]+>/g, "")).join(""));
  }
  const rows = {};
  const re = /<(?:x:)?c r="([A-Z]+)(\d+)"([^>]*)>([\s\S]*?)<\/(?:x:)?c>/g;
  let m;
  while ((m = re.exec(xml))) {
    const col = m[1], row = +m[2], attr = m[3], inner = m[4];
    const t = (attr.match(/t="([^"]+)"/) || [, ""])[1];
    let val;
    if (t === "inlineStr") val = (inner.match(/<(?:x:)?t[^>]*>([\s\S]*?)<\/(?:x:)?t>/) || [, ""])[1];
    else { const v = (inner.match(/<(?:x:)?v>([\s\S]*?)<\/(?:x:)?v>/) || [, ""])[1]; val = (t === "s") ? (shared[+v] || "") : v; }
    (rows[row] = rows[row] || {})[col] = val;
  }
  return Object.keys(rows).map(Number).sort((a, b) => a - b).slice(1)
    .map(r => ({ size: rows[r].B, ccode: rows[r].C, cname: rows[r].D, price: +rows[r].E }))
    .filter(x => x.ccode && x.size);
}

// ---------- pass 1: assign IDs to NEW colors/sizes (deterministic order) ----------
const productRows = {};
let nc = NEWCOLOR_ID_START, ncd = NEWCOLOR_DISP_START;
let ns = NEWSIZE_ID_START, nsd = NEWSIZE_DISP_START;
const newColors = [], newSizes = [];
for (const code of ORDER) {
  const rows = parseSheet(path.join(WORK, code));
  productRows[code] = rows;
  const seenC = new Set(), seenS = new Set();
  for (const r of rows) {
    if (!seenC.has(r.cname)) { seenC.add(r.cname); if (!colorId[r.cname]) { colorId[r.cname] = String(nc++); newColors.push({ name: r.cname, disp: ncd++ }); } }
    if (!seenS.has(r.size)) { seenS.add(r.size); if (!sizeId[r.size]) { sizeId[r.size] = String(ns++); newSizes.push({ name: r.size, disp: nsd++ }); } }
  }
}

// ---------- csv helpers ----------
const q = v => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
const line = a => a.map(q).join(",");
function writeCsv(file, header, rows) {
  fs.writeFileSync(file, [line(header)].concat(rows.map(line)).join("\r\n") + "\r\n", "utf8");
}

// ---------- masters ----------
fs.mkdirSync(CD + "/_masters", { recursive: true });
writeCsv(CD + "/_masters/newcolors.csv",
  ["ID", "アイテムオプションID", "アイテムオプション名前(NC)", "値", "表示順", "RGB", "プラットフォームプリセット"],
  newColors.map(c => ["", "2", "カラー", c.name, String(c.disp), "", ""]));
writeCsv(CD + "/_masters/newsizes.csv",
  ["ID", "アイテムオプションID", "アイテムオプション名前(NC)", "値", "表示順", "RGB", "プラットフォームプリセット"],
  newSizes.map(s => ["", "1", "サイズ", s.name, String(s.disp), "", ""]));

// ---------- per-product CSVs ----------
const NORTAN = "10", DELIV = "（仮）通常配送";
const itemHdr = ["アイテムID", "アイテムコード", "名称", "代表画像ファイル名", "説明", "素材", "サイズHTML", "表示順", "アイテム表示可否", "納期(日)", "配送コメント", "最低数量", "アイテムプラットフォームプリセット"];
const indivHdr = ["アイテムID(NC)", "アイテムコード", "名称", "代表画像ファイル名(NC)", "説明", "素材", "サイズHTML", "表示順", "アイテム表示可否", "納期(日)", "配送コメント", "最低数量", "アイテムプラットフォームプリセット", "アイテム個体ID", "カラーID", "カラー名称(NC)", "カラー表示順", "サイズID", "サイズ名称(NC)", "3DモデルID", "3Dモデル名称(NC)", "アイテム個体表示可否", "アイテム個体プラットフォームプリセット", "ベンダー名(ベンダー情報)", "アイテム型番(ベンダー情報)", "カラー名(ベンダー情報)", "カラーコード(ベンダー情報)", "サイズ名(ベンダー情報)", "JAN(ベンダー情報)", "価格(ベンダー情報)"];
const posHdr = ["アイテムID(NC)", "アイテムコード", "アイテム名(NC)", "位置別アイテム画像コード", "表示名", "表示順", "表示可否", "プラットフォームプリセット", "カラーID", "カラー名称(NC)", "サムネイルファイル名", "マスク画像ファイル名"];
const woHdr = ["ID", "加工方法指定コード", "アイテムコード", "アイテムID(NC)", "加工方法コード", "加工方法ID(NC)", "表示名", "表示順", "表示可否", "キャンバス画像ファイル名", "キャンバス座標Ax", "キャンバス座標Ay", "キャンバス座標Bx", "キャンバス座標By", "キャンバス座標Cx", "キャンバス座標Cy", "プラットフォームプリセット"];
const stockHdr = ["在庫ID", "JAN", "拠点ID", "プラットフォームプリセット", "現在の数量(NC)", "増減数量"];

const report = [];
for (const code of ORDER) {
  const P = PRODUCTS[code], rows = productRows[code];
  const dir = CD + "/" + code;
  fs.mkdirSync(dir, { recursive: true });
  const NAME = code + " " + P.name;
  const DESC = "United Athle " + code + "。" + P.name + "。";
  // color order (first seen) + display order
  const colorOrder = []; const seen = new Set();
  for (const r of rows) if (!seen.has(r.cname)) { seen.add(r.cname); colorOrder.push(r); }
  const colorDisp = {}; colorOrder.forEach((c, i) => colorDisp[c.cname] = i + 1);
  const img = c => code + "-" + c.ccode + ".jpg";
  const repImg = img(colorOrder[0]);
  // jan per sku
  const janOf = {}; let j = P.jan; rows.forEach(r => janOf[r.ccode + "|" + r.size] = String(j++));

  writeCsv(dir + "/" + code + "_2_item.csv", itemHdr,
    [["", code, NAME, repImg, DESC, P.material, P.sizeHtml, "3", "1", NORTAN, DELIV, "1", "0"]]);

  writeCsv(dir + "/" + code + "_3_itemIndiv.csv", indivHdr, rows.map(r => {
    const zei = Math.round(r.price / 1.1);
    return [P.itemId, code, NAME, "", DESC, P.material, P.sizeHtml, "3", "1", NORTAN, DELIV, "1", "0",
      "", colorId[r.cname], r.cname, String(colorDisp[r.cname]), sizeId[r.size], "", "", "", "1", "0",
      "（仮）", code, r.cname, r.ccode, r.size, janOf[r.ccode + "|" + r.size], String(zei)];
  }));

  writeCsv(dir + "/" + code + "_4_itemPosImage.csv", posHdr, colorOrder.map(c =>
    [P.itemId, code, NAME, code + "_chest_left", "左胸", "1", "1", "0", colorId[c.cname], c.cname, img(c), ""]));

  writeCsv(dir + "/" + code + "_5_workOverItem.csv", woHdr,
    [["", code + "_chest_left", code, P.itemId, "inkjet_chest_left", "20286", "左胸", "1", "1", repImg, "380", "300", "620", "300", "380", "540", "0"]]);

  writeCsv(dir + "/" + code + "_6_stock.csv", stockHdr, rows.map(r =>
    ["", janOf[r.ccode + "|" + r.size], "195", "", "", "100"]));

  // verify each color's image exists in the source zip folder
  const srcImgDir = fs.readdirSync(WORK).includes(code) ? null : null;
  report.push({ code, skus: rows.length, colors: colorOrder.length, name: P.name });
}

console.log("NEW colors:", newColors.length, "(", NEWCOLOR_ID_START, "-", NEWCOLOR_ID_START + newColors.length - 1, ")");
console.log("NEW sizes :", newSizes.map(s => s.name).join(","), "(", NEWSIZE_ID_START, "-", NEWSIZE_ID_START + newSizes.length - 1, ")");
report.forEach(r => console.log("  " + r.code + " : " + r.skus + " SKU / " + r.colors + " colors — " + r.name));
