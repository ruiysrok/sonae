// =============================================================
// そなえ｜発注履歴 共有バックエンド（Google Apps Script）
// スプレッドシートの「拡張機能 → Apps Script」にこの全文を貼り付けて
// 「デプロイ → 新しいデプロイ → ウェブアプリ」で公開してください。
// 詳しくは「スプレッドシート共有手順.md」参照。
// =============================================================

var SHEET_NAME = "発注履歴";

// 発注の受け取り（アプリ → シートに追記）
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(5000);
  try {
    var data = JSON.parse(e.postData.contents);
    var sh = getSheet_();
    var items = data.items || [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      sh.appendRow([
        data.date || new Date().toISOString(),
        data.id || "",
        data.store || "",
        data.storeName || "",
        data.staff || "",
        it.name || "",
        it.supplier || "",
        it.spec || "",
        it.unit || "",
        Number(it.qty) || 0,
        Number(it.price) || 0,
        (Number(it.price) || 0) * (Number(it.qty) || 0),
        Number(data.total) || 0
      ]);
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// 履歴の読み出し（シート → アプリ）
function doGet(e) {
  try {
    var store = (e && e.parameter && e.parameter.store) || "";
    var sh = getSheet_();
    var rows = sh.getDataRange().getValues();
    var orders = {};
    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      var date = r[0], id = r[1], st = r[2], storeName = r[3], staff = r[4];
      var name = r[5], supplier = r[6], spec = r[7], unit = r[8];
      var qty = r[9], price = r[10], total = r[12];
      if (store && st !== store) continue;
      if (!id) continue;
      if (!orders[id]) {
        orders[id] = {
          id: id,
          date: (date instanceof Date) ? date.toISOString() : String(date),
          store: st, storeName: storeName, staff: staff,
          items: [], total: Number(total) || 0
        };
      }
      orders[id].items.push({
        name: name, supplier: supplier, spec: spec, unit: unit,
        qty: Number(qty) || 0, price: Number(price) || 0
      });
    }
    var list = Object.keys(orders).map(function (k) { return orders[k]; });
    return json_({ ok: true, orders: list });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(["発注日時", "注文ID", "店舗ID", "店舗名", "担当者",
                  "商品名", "購入先", "規格", "発注単位", "数量",
                  "参考単価", "小計", "注文合計"]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
