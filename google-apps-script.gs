/* ============================================================
   Sucateamento de Equipamentos de TI — banco no Google Sheets
   ------------------------------------------------------------
   Como usar:
   1) Abra a planilha que será o banco.
   2) Extensões > Apps Script...
   3) Apague o conteúdo inicial e cole este arquivo.
   4) Salve (Ctrl+S).
   5) Implantar > Nova implantação > Aplicativo da Web.
      - Executar como: Eu
      - Quem tem acesso: Qualquer pessoa
   6) Copie a URL terminada em /exec e cole em
      google-sheets-config.js -> webAppUrl.

   A planilha "lancamentos" é criada automaticamente na primeira
   leitura, junto com os 30 registros de exemplo. A aba "meta"
   guarda a sequência de IDs.
   ============================================================ */

'use strict';

var SHEET_NAME = 'lancamentos';
var META_SHEET = 'meta';

var HEADERS = [
  'ID', 'PTM', 'Filial', 'Descrição', 'Motivo Sucateamento',
  'Data Aquisição', 'Data Lançamento', 'Vida Útil Equipamento',
  'Mês', 'Destino Avarias', 'Status', 'Criado em', 'Atualizado em'
];

var META_HEADERS = ['chave', 'valor'];

// PTM, Filial, Descrição, Motivo, Aquisição, Lançamento
var SEED_ROWS = [
  ['52934', '514 PLANALTO URUGUAI', 'LEITOR DE MAO', 'BOTAO QUEBRADO', '2020-09-23', '2024-06-21'],
  ['42727', '516 BARAO TABULETA', 'LEITOR DE MAO', 'PLACA QUEIMADA', '2018-06-18', '2024-06-21'],
  ['S/PTM', '530 MORADA NOVA', 'Gaveta PDV', 'SOLENOIDE QUEIMADO', '', '2024-06-21'],
  ['11351', '507 NOE MENDES', 'Gaveta PDV', 'SOLENOIDE QUEIMADO', '2012-12-31', '2024-06-21'],
  ['51064', '507 NOE MENDES', 'Leitor Fixo', 'Placa Mãe Queimada', '2019-07-10', '2024-06-21'],
  ['41301', '515 JOSE DE FREITAS', 'Impressora PDV', 'Placa Mãe Queimada', '2017-09-14', '2024-06-21'],
  ['36983', '505 505 PICOS', 'Impressora PDV', 'Placa Mãe Queimada', '', '2024-06-21'],
  ['20099', '524 CAXIAS SAO PEDRO', 'Monitor', 'Tela e Placa Queimado', '2014-11-12', '2024-06-21'],
  ['13144', '508 PEDRA MOLE', 'Monitor', 'Tela e Placa Queimado', '2014-12-11', '2024-06-21'],
  ['59964', '521- TIMON CEASA', 'MONITOR', 'TELA E PLACA QUEIMADO', '', '2024-06-21'],
  ['56807', '519 -CD VAREJO', 'MONITOR', 'TELA E PLACA QUEIMADO', '2022-06-14', '2024-06-21'],
  ['30665', 'ADM PUBLICIDADE', 'MONITOR', 'TELA E PLACA QUEIMADO', '', '2024-06-21'],
  ['55429', '515 - JOSE DE FREITAS', 'MONITOR', 'TELA E PLACA QUEIMADO', '2021-11-10', '2024-06-21'],
  ['14159', '523 - CAXIAS CENTRAL', 'MONITOR', 'TELA E PLACA QUEIMADO', '', '2024-06-21'],
  ['56300', '535 - RZINHO :', 'MONITOR', 'TELA E PLACA QUEIMADO', '2022-08-19', '2024-06-21'],
  ['53027', '525 - TIMON ALVORADO', 'MONITOR', 'TELA E PLACA QUEIMADO', '2020-11-05', '2024-06-21'],
  ['26539', '524 - CAXIAS SAO PEDRO', 'MONITOR', 'TELA E PLACA QUEIMADO', '2012-12-31', '2024-06-21'],
  ['16935', '504 - AV. MARANHAO', 'MONITOR', 'TELA E PLACA QUEIMADO', '2018-06-27', '2024-06-21'],
  ['18507', '504 - AV. MARANHAO', 'MONITOR', 'TELA E PLACA QUEIMADO', '2014-09-23', '2024-06-21'],
  ['46039', '512 - KENNEDY', 'TECLADO PDV', 'PLACA QUEIMADA', '2018-10-24', '2024-06-21'],
  ['19992', '518 - MOCAMBENHO', 'BUSCA-PREÇO', 'PLACA QUEIMADA', '2018-04-17', '2024-06-21'],
  ['36527', '524 - CAXIAS SAO PEDRO', 'IMPRESSORA PDV', 'PLACA QUEIMADA', '2018-04-21', '2024-06-21'],
  ['39798', '524 - CAXIAS SAO PEDRO', 'IMPRESSORA PDV', 'PLACA QUEIMADA', '2017-02-21', '2024-06-21'],
  ['39804', '524 - CAXIAS SAO PEDRO', 'IMPRESSORA PDV', 'PLACA QUEIMADA', '2017-02-21', '2024-06-21'],
  ['31600', '518 - MOCAMBINHO', 'ESTAÇAO', 'PLACA QUEIMADA', '2018-11-19', '2024-06-21'],
  ['13341', '518 - MOCAMBINHO', 'PDV', 'PLACA QUEIMADA', '2018-04-17', '2024-06-21'],
  ['28675', '521- TIMON CEASA', 'PDV', 'PLACA QUEIMADA', '2018-05-11', '2024-06-21'],
  ['265', '508 - PEDRA MOLE', 'ESTAÇAO', 'PLACA QUIEMADA', '2009-08-05', '2024-06-21'],
  ['36194', '516 - BARAO', 'PDV', 'PLACA QUEIMADA', '2017-01-27', '2024-06-21'],
  ['10601', '510 - Ig DE OUTUBRO', 'MONITOR', 'TELA E PLACA QUEIMADO', '2018-04-17', '2024-07-22']
];

/* ------------------------------------------------------------
   Endpoints do aplicativo da web
   ------------------------------------------------------------ */

function doGet(e) {
  try {
    var action = e && e.parameter ? (e.parameter.action || 'read') : 'read';
    if (action === 'read') {
      return output({ ok: true, records: readRecords(), revision: revision() });
    }
    if (action === 'ping') {
      return output({ ok: true, pong: true });
    }
    return output({ ok: false, error: 'Ação GET desconhecida: ' + action });
  } catch (error) {
    return output({ ok: false, error: errorMessage(error) });
  }
}

function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) || '{}';
    var payload = JSON.parse(raw);
    var action = payload.action;
    var result;

    switch (action) {
      case 'add':
        result = addRecord(payload.record || {});
        break;
      case 'update':
        result = updateRecord(payload.record || {});
        break;
      case 'remove':
        result = removeRecord(payload.id);
        break;
      case 'clear':
        result = clearRecords();
        break;
      case 'restore':
        result = restoreSeed();
        break;
      case 'import':
        result = importRecords(payload.records || [], payload.replace === true);
        break;
      default:
        return output({ ok: false, error: 'Ação POST desconhecida: ' + action });
    }

    result.ok = true;
    result.revision = revision();
    return output(result);
  } catch (error) {
    return output({ ok: false, error: errorMessage(error) });
  }
}

function output(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorMessage(error) {
  return error && error.message ? error.message : String(error);
}

/* ------------------------------------------------------------
   Planilhas e metadados
   ------------------------------------------------------------ */

function getSheet() {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = book.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = book.insertSheet(SHEET_NAME);
  ensureHeader(sheet);
  return sheet;
}

function getMetaSheet() {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = book.getSheetByName(META_SHEET);
  if (!sheet) {
    sheet = book.insertSheet(META_SHEET);
    sheet.getRange(1, 1, 1, META_HEADERS.length).setValues([META_HEADERS]);
  } else if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, META_HEADERS.length).setValues([META_HEADERS]);
  } else if (sheet.getRange(1, 1).getValue() !== 'chave') {
    sheet.insertRowBefore(1);
    sheet.getRange(1, 1, 1, META_HEADERS.length).setValues([META_HEADERS]);
  }
  return sheet;
}

function ensureHeader(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    return;
  }
  if (sheet.getRange(1, 1).getValue() !== 'ID') sheet.insertRowBefore(1);
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
}

function getMeta(key, fallback) {
  var sheet = getMetaSheet();
  var last = sheet.getLastRow();
  if (last < 2) return fallback;
  var values = sheet.getRange(2, 1, last - 1, 2).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === key) return values[i][1];
  }
  return fallback;
}

function setMeta(key, value) {
  var sheet = getMetaSheet();
  var last = sheet.getLastRow();
  var values = last >= 2 ? sheet.getRange(2, 1, last - 1, 1).getValues() : [];
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === key) {
      sheet.getRange(i + 2, 2).setValue(value);
      return;
    }
  }
  sheet.appendRow([key, value]);
}

function nextIds(count) {
  var current = Number(getMeta('sequencia', 0)) || 0;
  var ids = [];
  for (var i = 1; i <= count; i++) ids.push(current + i);
  setMeta('sequencia', current + count);
  return ids;
}

function ensureSeeded() {
  if (String(getMeta('seeded', '')) === '1') return;
  var sheet = getSheet();
  if (sheet.getLastRow() < 2) seedRows();
  setMeta('seeded', '1');
}

function seedRows() {
  var sheet = getSheet();
  var timestamp = new Date().toISOString();
  var rows = SEED_ROWS.map(function (row, index) {
    return toRow({
      id: index + 1,
      ptm: row[0],
      filial: row[1],
      descricao: row[2],
      motivo: row[3],
      dataAquisicao: row[4],
      dataLancamento: row[5],
      destino: 'Avarias',
      mes: 'Junho',
      status: 'Ok',
      createdAt: timestamp,
      updatedAt: timestamp
    });
  });
  if (rows.length) sheet.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
  setMeta('sequencia', SEED_ROWS.length);
  setMeta('seeded', '1');
}

/* ------------------------------------------------------------
   Leitura, escrita e operações
   ------------------------------------------------------------ */

function readRecords() {
  ensureSeeded();
  var sheet = getSheet();
  var last = sheet.getLastRow();
  if (last < 2) return [];

  var values = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
  var records = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var id = Number(row[0]);
    if (!id) continue;
    records.push({
      id: id,
      ptm: String(row[1] || ''),
      filial: String(row[2] || ''),
      descricao: String(row[3] || ''),
      motivo: String(row[4] || ''),
      dataAquisicao: isoDate(row[5]),
      dataLancamento: isoDate(row[6]),
      vidaUtil: String(row[7] || ''),
      mes: String(row[8] || ''),
      destino: String(row[9] || ''),
      status: String(row[10] || ''),
      createdAt: String(row[11] || ''),
      updatedAt: String(row[12] || '')
    });
  }
  records.sort(function (a, b) { return b.id - a.id; });
  return records;
}

function addRecord(record) {
  ensureSeeded();
  var id = nextIds(1)[0];
  var timestamp = new Date().toISOString();
  var full = Object.assign({}, record, {
    id: id,
    createdAt: timestamp,
    updatedAt: timestamp
  });
  getSheet().appendRow(toRow(full));
  return { id: id, record: full };
}

function updateRecord(record) {
  var id = Number(record.id);
  if (!id) throw new Error('ID do registro não informado.');
  var sheet = getSheet();
  var rowIndex = findRow(sheet, id);
  if (!rowIndex) throw new Error('Registro ' + id + ' não encontrado na planilha.');

  var existing = readRecords().filter(function (item) { return item.id === id; })[0] || {};
  var full = Object.assign({}, existing, record, {
    id: id,
    updatedAt: new Date().toISOString()
  });
  sheet.getRange(rowIndex, 1, 1, HEADERS.length).setValues([toRow(full)]);
  return { id: id, record: full };
}

function removeRecord(id) {
  var sheet = getSheet();
  var rowIndex = findRow(sheet, Number(id));
  if (!rowIndex) throw new Error('Registro ' + id + ' não encontrado na planilha.');
  sheet.deleteRow(rowIndex);
  return { removed: Number(id) };
}

function clearRecords() {
  var sheet = getSheet();
  var last = sheet.getLastRow();
  if (last >= 2) sheet.deleteRows(2, last - 1);
  setMeta('sequencia', 0);
  setMeta('seeded', '1');
  return { cleared: true };
}

function restoreSeed() {
  clearRecords();
  seedRows();
  return { count: SEED_ROWS.length };
}

function importRecords(records, replace) {
  if (replace) clearRecords();
  else ensureSeeded();

  var list = Array.isArray(records) ? records : [];
  if (!list.length) return { count: 0 };

  var ids = nextIds(list.length);
  var timestamp = new Date().toISOString();
  var rows = list.map(function (record, index) {
    return toRow(Object.assign({}, record, {
      id: ids[index],
      createdAt: record.createdAt || timestamp,
      updatedAt: timestamp
    }));
  });
  var sheet = getSheet();
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, HEADERS.length).setValues(rows);
  return { count: rows.length };
}

function findRow(sheet, id) {
  var last = sheet.getLastRow();
  if (last < 2) return 0;
  var values = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (Number(values[i][0]) === id) return i + 2;
  }
  return 0;
}

/* ------------------------------------------------------------
   Conversões
   ------------------------------------------------------------ */

function toRow(record) {
  return [
    Number(record.id) || 0,
    record.ptm || '',
    record.filial || '',
    record.descricao || '',
    record.motivo || '',
    record.dataAquisicao || '',
    record.dataLancamento || '',
    calcVidaUtil(record.dataAquisicao, record.dataLancamento),
    record.mes || '',
    record.destino || '',
    record.status || '',
    record.createdAt || '',
    record.updatedAt || ''
  ];
}

function calcVidaUtil(startISO, endISO) {
  if (!startISO || !endISO) return 'SEM NÃO ENCONTRADO';
  var start = new Date(startISO + 'T00:00:00');
  var end = new Date(endISO + 'T00:00:00');
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 'SEM NÃO ENCONTRADO';
  var years = end.getFullYear() - start.getFullYear();
  var months = end.getMonth() - start.getMonth();
  if (end.getDate() < start.getDate()) months--;
  if (months < 0) { years--; months += 12; }
  return years + ' ano(s) e ' + months + ' mês(es)';
}

function isoDate(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  var text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  var parts = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (parts) return parts[3] + '-' + pad(parts[2]) + '-' + pad(parts[1]);
  if (/^\d{5}$/.test(text)) {
    var date = new Date(1899, 11, 30);
    date.setDate(date.getDate() + Number(text));
    return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return text;
}

function pad(value) { return String(value).padStart(2, '0'); }

function revision() {
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    JSON.stringify(readRecords())
  );
  return bytes.map(function (byte) {
    return ('0' + (byte & 0xff).toString(16)).slice(-2);
  }).join('').slice(0, 16);
}
