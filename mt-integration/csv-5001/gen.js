// 5001-01 registration CSV generator. Run: node gen.js  (outputs UTF-8; then iconv -> CP932)
const fs = require("fs");
const OUT = "C:/Users/Taku/Pictures/print-world/mt-integration/csv-5001";
const XLSX = "C:/Users/Taku/Pictures/print-world/mt-integration/product data/_xlsx";
const OPTMAP = "C:/Users/Taku/Pictures/print-world/mt-integration/csv/_optmap.json";

// ---- params (verify after uploads; regenerate if different) ----
const ITEM_ID = "13566";             // MT-assigned アイテムID (confirmed from アイテム編集:13566)
const NEWCOLOR_START = 6241;         // confirmed first ID of the 37 new colors (6241 ミックスグレー .. 6277 ヘイジーブルー)
const JAN_BASE = 2900000020001;      // provisional JANs for 5001-01 (distinct from CVT)
const CODE = "5001-01";
const NAME = "5.6オンス ハイクオリティー Tシャツ〈アダルト〉";
const MATERIAL = "綿100%";
const DESC = "United Athle 5001-01。5.6オンスの丈夫でしっかりした生地感。豊富なカラーとサイズ展開の定番Tシャツです。";
const NORTAN = "10";
const FIXED_IMG = "5001-01-0001.jpg";
const SIZE_HTML = "S,M,L,XL,XXL,XXXL";

function parseSheet() {
  const sh = fs.readFileSync(XLSX + "/xl/worksheets/sheet1.xml", "utf8");
  const rows = {}; let m;
  const re = /<x:c r="([A-Z]+)(\d+)"[^>]*>(?:<x:v>([^<]*)<\/x:v>)?<\/x:c>/g;
  while ((m = re.exec(sh))) { (rows[+m[2]] = rows[+m[2]] || {})[m[1]] = m[3] || ""; }
  return Object.keys(rows).map(Number).sort((a, b) => a - b).slice(1)
    .map(r => ({ hin: rows[r].A, size: rows[r].B, ccode: rows[r].C, cname: rows[r].D, taxin: +rows[r].E }))
    .filter(x => x.hin && x.size && x.ccode);
}
const skus = parseSheet();

const opt = JSON.parse(fs.readFileSync(OPTMAP, "utf8"));
const sizeMap = opt.sizes || {};
const existColor = opt.colors || {};

const colorOrder = []; const seen = new Set();
for (const s of skus) { if (!seen.has(s.cname)) { seen.add(s.cname); colorOrder.push(s); } }

const colorId = {}, newColors = [];
let nid = NEWCOLOR_START;
colorOrder.forEach(c => {
  if (existColor[c.cname]) colorId[c.cname] = existColor[c.cname];
  else { colorId[c.cname] = String(nid++); newColors.push(c); }
});
const colorDisp = {}; colorOrder.forEach((c, i) => colorDisp[c.cname] = i + 1);

const janOf = {}; let j = JAN_BASE;
skus.forEach(s => { janOf[s.ccode + "|" + s.size] = String(j++); });

const q = v => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
const line = arr => arr.map(q).join(",");
function writeCsv(name, header, rows) {
  const body = [line(header)].concat(rows.map(line)).join("\r\n") + "\r\n";
  fs.writeFileSync(OUT + "/" + name, body, "utf8");
  console.log(name, "rows=", rows.length);
}

writeCsv("5001-01_1_newcolors.csv",
  ["ID","アイテムオプションID","アイテムオプション名前(NC)","値","表示順","RGB","プラットフォームプリセット"],
  newColors.map((c, i) => ["", "2", "カラー", c.cname, String(200 + i), "", ""]));

writeCsv("5001-01_2_item.csv",
  ["アイテムID","アイテムコード","名称","代表画像ファイル名","説明","素材","サイズHTML","表示順","アイテム表示可否","納期(日)","配送コメント","最低数量","アイテムプラットフォームプリセット"],
  [["", CODE, NAME, FIXED_IMG, DESC, MATERIAL, SIZE_HTML, "3", "1", NORTAN, "（仮）通常配送", "1", "0"]]);

const indivHdr = ["アイテムID(NC)","アイテムコード","名称","代表画像ファイル名(NC)","説明","素材","サイズHTML","表示順","アイテム表示可否","納期(日)","配送コメント","最低数量","アイテムプラットフォームプリセット","アイテム個体ID","カラーID","カラー名称(NC)","カラー表示順","サイズID","サイズ名称(NC)","3DモデルID","3Dモデル名称(NC)","アイテム個体表示可否","アイテム個体プラットフォームプリセット","ベンダー名(ベンダー情報)","アイテム型番(ベンダー情報)","カラー名(ベンダー情報)","カラーコード(ベンダー情報)","サイズ名(ベンダー情報)","JAN(ベンダー情報)","価格(ベンダー情報)"];
writeCsv("5001-01_3_itemIndiv.csv", indivHdr, skus.map(s => {
  const zei = Math.round(s.taxin / 1.1);
  return [ITEM_ID, CODE, NAME, "", DESC, MATERIAL, SIZE_HTML, "3", "1", NORTAN, "（仮）通常配送", "1", "0",
    "", colorId[s.cname], s.cname, String(colorDisp[s.cname]), sizeMap[s.size] || "", "", "", "", "1", "0",
    "（仮）", CODE, s.cname, s.ccode, s.size, janOf[s.ccode + "|" + s.size], String(zei)];
}));

writeCsv("5001-01_4_itemPosImage.csv",
  ["アイテムID(NC)","アイテムコード","アイテム名(NC)","位置別アイテム画像コード","表示名","表示順","表示可否","プラットフォームプリセット","カラーID","カラー名称(NC)","サムネイルファイル名","マスク画像ファイル名"],
  colorOrder.map(c => [ITEM_ID, CODE, NAME, CODE + "_chest_left", "左胸", "1", "1", "0", colorId[c.cname], c.cname, FIXED_IMG, ""]));

writeCsv("5001-01_5_workOverItem.csv",
  ["ID","加工方法指定コード","アイテムコード","アイテムID(NC)","加工方法コード","加工方法ID(NC)","表示名","表示順","表示可否","キャンバス画像ファイル名","キャンバス座標Ax","キャンバス座標Ay","キャンバス座標Bx","キャンバス座標By","キャンバス座標Cx","キャンバス座標Cy","プラットフォームプリセット"],
  [["", CODE + "_chest_left", CODE, ITEM_ID, "inkjet_chest_left", "20286", "左胸", "1", "1", FIXED_IMG, "380","300","620","300","380","540","0"]]);

writeCsv("5001-01_6_stock.csv",
  ["在庫ID","JAN","拠点ID","プラットフォームプリセット","現在の数量(NC)","増減数量"],
  skus.map(s => ["", janOf[s.ccode + "|" + s.size], "195", "", "", "100"]));

console.log("colors:", colorOrder.length, "new:", newColors.length, "skus:", skus.length);
