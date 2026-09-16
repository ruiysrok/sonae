// =============================================================
// そなえ｜発注履歴の共有（Google Apps Script）v3
// -------------------------------------------------------------
// v3: ①発注の「取消」 ②品目ごとの進捗（発注準備中→注文済み→納品済み）
//     ③数式インジェクション対策（セキュリティ強化）に対応
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
var STATUS_MARK = "【状態】";

// 発注・取消・進捗の受け取り（アプリ→シートに追記）
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(5000);
  try {
    var data = JSON.parse(e.postData.contents);
    var sh = getSheet_();

    // 取消：記録は残したまま「取消行」を追記する
    if (data.action === "cancel") {
      sh.appendRow([
        new Date().toISOString(), s_(data.id), s_(data.store), "",
        s_(data.staff), CANCEL_MARK, "", "", "", 0, 0, 0, 0
      ]);
      return json_({ ok: true });
    }

    // 進捗：品目の状態変更（注文済み／納品済み）を追記する
    if (data.action === "status") {
      sh.appendRow([
        s_(data.at) || new Date().toISOString(), s_(data.id), s_(data.store), "",
        s_(data.staff), STATUS_MARK, s_(data.status), s_(data.item), "", 0, 0, 0, 0
      ]);
      return json_({ ok: true });
    }

    var items = data.items || [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      sh.appendRow([
        s_(data.date) || new Date().toISOString(),
        s_(data.id),
        s_(data.store),
        s_(data.storeName),
        s_(data.staff),
        s_(it.name),
        s_(it.supplier),
        s_(it.spec),
        s_(it.unit),
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
    var statusEvents = []; // 行順＝時系列。後の行が勝つ
    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      var date = r[0], id = r[1], st = r[2], storeName = r[3], staff = r[4];
      var name = String(r[5]);
      if (store && String(st) !== store) continue;
      if (!id) continue;
      if (name === CANCEL_MARK) { cancelled[String(id)] = true; continue; }
      if (name === STATUS_MARK) {
        statusEvents.push({
          id: String(id), status: String(r[6]), item: String(r[7]),
          by: String(staff), at: (date instanceof Date) ? date.toISOString() : String(date)
        });
        continue;
      }
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
    // 進捗イベントを適用（後の行が上書き）
    for (var k = 0; k < statusEvents.length; k++) {
      var ev = statusEvents[k];
      var o = orders[ev.id];
      if (!o) continue;
      for (var j = 0; j < o.items.length; j++) {
        if (o.items[j].name === ev.item) {
          o.items[j].status = ev.status;
          o.items[j].statusBy = ev.by;
          o.items[j].statusAt = ev.at;
        }
      }
    }
    var list = Object.keys(orders).map(function (key) {
      var o = orders[key];
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

// セキュリティ：セルの先頭が = + - @ 等だと数式として実行されるため無効化する
function s_(v) {
  v = String(v == null ? "" : v);
  return /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
