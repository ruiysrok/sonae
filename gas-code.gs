// =============================================================
// そなえ｜発注履歴の共有（Google Apps Script）v2
// -------------------------------------------------------------
// v2: 発注の「取消」に対応（記録は消さず、取消済みの印を付けます）
//
// 【更新のしかた（すでに設定済みの人）】
//  1. スプレッドシート →「拡張機能」→「Apps Script」
//  2. 中身を全部消して、このファイルの全文を貼り付け → 💾保存
//  3. 「デプロイ」→「デプロイを管理」→ ✏（編集）→
//     バージョン「新バージョン」→「デプロイ」
//     ※URLは変わらないので、アプリ側の変更は不要です
// =============================================================

var SHEET_NAME = "発注履歴";
var CANCEL_MARK = "【取消】";

// 発注・取消の受け取り（アプリ→シートに追記）
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(5000);
  try {
    var data = JSON.parse(e.postData.contents);
    var sh = getSheet_();

    // 取消：記録は残したまま「取消行」を追記する
    if (data.action === "cancel") {
      sh.appendRow([
        new Date().toISOString(), data.id || "", data.store || "", "",
        data.staff || "", CANCEL_MARK, "", "", "", 0, 0, 0, 0
      ]);
      return json_({ ok: true });
    }

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

// 履歴の読み出し（シート→アプリ）
function doGet(e) {
  try {
    var store = (e && e.parameter && e.parameter.store) || "";
    var sh = getSheet_();
    var rows = sh.getDataRange().getValues(); // 1行目はヘッダー
    var orders = {};
    var cancelled = {};
    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      var date = r[0], id = r[1], st = r[2], storeName = r[3], staff = r[4];
      var name = String(r[5]);
      if (store && String(st) !== store) continue;
      if (!id) continue;
      if (name === CANCEL_MARK) { cancelled[String(id)] = true; continue; }
      if (!orders[id]) {
        orders[id] = {
          id: String(id),
          date: (date instanceof Date) ? date.toISOString() : String(date),
          store: String(st), storeName: String(storeName), staff: String(staff),
          items: [], total: Number(r[12]) || 0
        };
      }
      orders[id].items.push({
        name: name, supplier: String(r[6]), spec: String(r[7]),
        unit: String(r[8]), qty: Number(r[9]) || 0, price: Number(r[10]) || 0
      });
    }
    var list = Object.keys(orders).map(function (k) {
      var o = orders[k];
      if (cancelled[o.id]) o.cancelled = true;
      return o;
    });
    return json_({ ok: true, orders: list });
  } catch (err) {
    return json_({ ok: false, error: String(err), orders: [] });
  }
}

// ---- 内部ヘルパー ----
function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(["発注日時","注文ID","店舗ID","店舗名","担当者","商品名","購入先","規格・メモ","発注単位","数量","参考単価","小計","注文合計"]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
