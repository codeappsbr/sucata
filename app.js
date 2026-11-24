/* ============================================================
   Sucateamento de Equipamentos de TI — lógica da aplicação
   Persistência: IndexedDB (banco de dados local do navegador)
   com fallback para localStorage.
   ============================================================ */

'use strict';

/* ------------------------------------------------------------
   1. Constantes e dados iniciais
   ------------------------------------------------------------ */

const DB_NAME = 'sucateamento_db';
const DB_VERSION = 1;
const STORE_NAME = 'lancamentos';
const LS_KEY = 'sucateamento_records';
const LS_SEEDED = 'sucateamento_seeded_v1';
const PAGE_SIZE = 15;

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const FILIAIS = [
  '504 - AV. MARANHAO', '505 505 PICOS', '507 NOE MENDES', '508 PEDRA MOLE',
  '510 - Ig DE OUTUBRO', '512 - KENNEDY', '514 PLANALTO URUGUAI',
  '515 JOSE DE FREITAS', '515 - JOSE DE FREITAS', '516 BARAO TABULETA',
  '516 - BARAO', '518 - MOCAMBENHO', '518 - MOCAMBINHO', '519 -CD VAREJO',
  '521- TIMON CEASA', '523 - CAXIAS CENTRAL', '524 CAXIAS SAO PEDRO',
  '525 - TIMON ALVORADO', '530 MORADA NOVA', '535 - RZINHO :', 'ADM PUBLICIDADE'
];

const DESCRICOES = [
  'BUSCA-PREÇO', 'ESTAÇAO', 'Gaveta PDV', 'IMPRESSORA PDV', 'Impressora PDV',
  'LEITOR DE MAO', 'Leitor Fixo', 'Monitor', 'MONITOR', 'PDV', 'TECLADO PDV'
];

const MOTIVOS = [
  'BOTAO QUEBRADO', 'PLACA QUEIMADA', 'PLACA QUIEMADA', 'Placa Mãe Queimada',
  'SOLENOIDE QUEIMADO', 'TELA E PLACA QUEIMADO', 'Tela e Placa Queimado'
];

const DESTINOS = ['Avarias', 'Obsoleto', 'Quebra', 'Outros'];
const STATUS = ['Ok', 'Pendente', 'Em análise'];

// 30 registros do print original (PTM, Filial, Descrição, Motivo, Aquisição, Lançamento)
const SEED_ROWS = [
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

function makeSeedRecords() {
  const now = new Date().toISOString();
  return SEED_ROWS.map(function (row) {
    return {
      ptm: row[0], filial: row[1], descricao: row[2], motivo: row[3],
      dataAquisicao: row[4], dataLancamento: row[5],
      destino: 'Avarias', mes: 'Junho', status: 'Ok',
      createdAt: now, updatedAt: now
    };
  });
}

const SEED = makeSeedRecords();

const ICONS = {
  edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
  delete: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6M10 11v5M14 11v5"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 13 4 4L19 7"/></svg>',
  alert: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8v5m0 3h.01M10.3 3.9 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>',
  info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/></svg>'
};

/* ------------------------------------------------------------
   2. Estado e atalhos DOM
   ------------------------------------------------------------ */

const state = {
  records: [],
  editId: null,
  page: 1,
  sortKey: 'id',
  sortDir: 'desc'
};

const $ = function (selector) { return document.querySelector(selector); };
const $$ = function (selector) { return Array.from(document.querySelectorAll(selector)); };

let db = null;

/* ------------------------------------------------------------
   3. Utilitários
   ------------------------------------------------------------ */

function pad(n) { return String(n).padStart(2, '0'); }

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function formatDateBR(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const parts = iso.split('-');
  return parts[2] + '/' + parts[1] + '/' + parts[0];
}

function parseDate(value) {
  if (!value) return '';
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return m[3] + '-' + pad(m[2]) + '-' + pad(m[1]);
  if (/^\d{5}$/.test(s)) {
    const epoch = Date.UTC(1899, 11, 30) + Number(s) * 86400000;
    return new Date(epoch).toISOString().slice(0, 10);
  }
  return '';
}

function calcVidaUtil(startISO, endISO) {
  if (!startISO || !endISO) return 'SEM NÃO ENCONTRADO';
  const start = new Date(startISO + 'T00:00:00');
  const end = new Date(endISO + 'T00:00:00');
  if (isNaN(start) || isNaN(end) || end < start) return 'SEM NÃO ENCONTRADO';
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  if (end.getDate() < start.getDate()) months--;
  if (months < 0) { years--; months += 12; }
  return years + ' ano(s) e ' + months + ' mês(es)';
}

function mesFromDate(iso) {
  if (!iso) return '';
  const month = Number(iso.slice(5, 7));
  return MESES[month - 1] || '';
}

function dateStamp() { return new Date().toISOString().slice(0, 10); }

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

function toast(message, type) {
  type = type || 'success';
  const container = $('#toastContainer');
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = ICONS[type === 'success' ? 'check' : type === 'error' ? 'alert' : 'info'] +
    '<span>' + escapeHtml(message) + '</span>';
  container.appendChild(el);
  setTimeout(function () {
    el.classList.add('out');
    setTimeout(function () { el.remove(); }, 220);
  }, 3800);
}

function confirmAction(options) {
  return new Promise(function (resolve) {
    const dialog = $('#confirmDialog');
    $('#confirmTitle').textContent = options.title || 'Confirmar ação';
    $('#confirmMessage').textContent = options.message || 'Tem certeza?';
    $('#confirmOk').textContent = options.okLabel || 'Confirmar';
    $('#confirmOk').className = 'btn ' + (options.danger === false ? 'btn-primary' : 'btn-danger');
    $('#confirmIcon').className = 'modal-icon' + (options.danger === false ? '' : ' danger');
    $('#confirmIcon').textContent = options.danger === false ? '?' : '!';

    function finish(result) {
      $('#confirmOk').removeEventListener('click', onOk);
      $('#confirmCancel').removeEventListener('click', onCancel);
      dialog.removeEventListener('cancel', onCancel);
      if (dialog.open) dialog.close();
      resolve(result);
    }
    function onOk() { finish(true); }
    function onCancel(event) { if (event && event.type === 'cancel') event.preventDefault(); finish(false); }

    $('#confirmOk').addEventListener('click', onOk);
    $('#confirmCancel').addEventListener('click', onCancel);
    dialog.addEventListener('cancel', onCancel);
    dialog.showModal();
  });
}

/* ------------------------------------------------------------
   4. Camada de persistência (IndexedDB + fallback)
   ------------------------------------------------------------ */

function openDatabase() {
  return new Promise(function (resolve, reject) {
    if (!('indexedDB' in window)) return resolve(null);
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = function (event) {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('dataLancamento', 'dataLancamento', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }
    };
    request.onsuccess = function () { resolve(request.result); };
    request.onerror = function () { reject(request.error); };
  });
}

function requestDone(request) {
  return new Promise(function (resolve, reject) {
    request.onsuccess = function () { resolve(request.result); };
    request.onerror = function () { reject(request.error); };
  });
}

function transactionDone(transaction) {
  return new Promise(function (resolve, reject) {
    transaction.oncomplete = function () { resolve(); };
    transaction.onerror = function () { reject(transaction.error); };
    transaction.onabort = function () { reject(transaction.error); };
  });
}

const storage = {
  lsRead: function () {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
    catch (e) { return []; }
  },
  lsWrite: function (list) { localStorage.setItem(LS_KEY, JSON.stringify(list)); },

  getAll: async function () {
    if (!db) return this.lsRead();
    const tx = db.transaction(STORE_NAME, 'readonly');
    return requestDone(tx.objectStore(STORE_NAME).getAll());
  },
  add: async function (record) {
    if (!db) {
      const list = this.lsRead();
      record.id = list.length ? Math.max.apply(null, list.map(function (r) { return r.id; })) + 1 : 1;
      list.push(record);
      this.lsWrite(list);
      return record.id;
    }
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const key = await requestDone(tx.objectStore(STORE_NAME).add(record));
    await transactionDone(tx);
    return key;
  },
  update: async function (record) {
    if (!db) {
      const list = this.lsRead();
      const index = list.findIndex(function (r) { return r.id === record.id; });
      if (index >= 0) list[index] = record;
      this.lsWrite(list);
      return;
    }
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    await transactionDone(tx);
  },
  remove: async function (id) {
    if (!db) {
      this.lsWrite(this.lsRead().filter(function (r) { return r.id !== id; }));
      return;
    }
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    await transactionDone(tx);
  },
  clear: async function () {
    if (!db) { localStorage.removeItem(LS_KEY); return; }
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    await transactionDone(tx);
  },
  bulkAdd: async function (records) {
    if (!db) {
      const list = [];
      records.forEach(function (record, index) {
        const copy = Object.assign({}, record);
        copy.id = index + 1;
        list.push(copy);
      });
      this.lsWrite(list);
      return;
    }
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    records.forEach(function (record) { store.add(record); });
    await transactionDone(tx);
  }
};

async function initStorage() {
  db = await openDatabase();
  if (!localStorage.getItem(LS_SEEDED)) {
    const count = (await storage.getAll()).length;
    if (count === 0) await storage.bulkAdd(SEED);
    localStorage.setItem(LS_SEEDED, '1');
  }
}

/* ------------------------------------------------------------
   5. Carregamento e renderização
   ------------------------------------------------------------ */

async function loadRecords() {
  state.records = await storage.getAll();
  state.records.sort(function (a, b) { return (b.id || 0) - (a.id || 0); });
  render();
}

function render() {
  renderStats();
  renderTable();
}

function renderStats() {
  const records = state.records;
  $('#statTotal').textContent = records.length;
  $('#statOk').textContent = records.filter(function (r) { return r.status === 'Ok'; }).length;
  $('#statPendentes').textContent = records.filter(function (r) { return r.status && r.status !== 'Ok'; }).length;
  $('#statFiliais').textContent = new Set(records.map(function (r) { return r.filial; }).filter(Boolean)).size;
  $('#tableCount').textContent = records.length + ' registro(s) no banco de dados';
}

function getFilteredRecords() {
  const query = $('#busca').value.trim().toLocaleLowerCase('pt-BR');
  const status = $('#filtroStatus').value;
  const mes = $('#filtroMes').value;

  let list = state.records.filter(function (r) {
    if (status && r.status !== status) return false;
    if (mes && r.mes !== mes) return false;
    if (!query) return true;
    const fields = [r.ptm, r.filial, r.descricao, r.motivo, r.status,
      formatDateBR(r.dataAquisicao), formatDateBR(r.dataLancamento), r.mes];
    return fields.some(function (value) {
      return String(value || '').toLocaleLowerCase('pt-BR').includes(query);
    });
  });

  const key = state.sortKey;
  const direction = state.sortDir === 'asc' ? 1 : -1;
  list.sort(function (a, b) {
    const av = a[key] ?? '';
    const bv = b[key] ?? '';
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * direction;
    return String(av).localeCompare(String(bv), 'pt-BR', { numeric: true, sensitivity: 'base' }) * direction;
  });
  return list;
}

function statusBadge(status) {
  const value = status || '—';
  const css = value === 'Ok' ? 'badge-ok' : value === 'Em análise' ? 'badge-analise' : 'badge-pendente';
  return '<span class="badge ' + css + '">' + escapeHtml(value) + '</span>';
}

function pageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, function (_, i) { return i + 1; });
  const pages = [1];
  let start = Math.max(2, current - 1);
  let end = Math.min(total - 1, current + 1);
  if (current <= 3) { start = 2; end = 4; }
  if (current >= total - 2) { start = total - 3; end = total - 1; }
  if (start > 2) pages.push('…');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push('…');
  pages.push(total);
  return pages;
}

function renderTable() {
  const filtered = getFilteredRecords();
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if (state.page > totalPages) state.page = totalPages;
  const start = (state.page - 1) * PAGE_SIZE;
  const rows = filtered.slice(start, start + PAGE_SIZE);
  const tbody = $('#tabelaBody');

  if (!rows.length) {
    const message = state.records.length
      ? 'Nenhum lançamento encontrado com os filtros atuais.'
      : 'Nenhum lançamento cadastrado. Use o formulário acima para adicionar.';
    tbody.innerHTML = '<tr><td colspan="12" class="empty-cell">' + message + '</td></tr>';
  } else {
    tbody.innerHTML = rows.map(function (r) {
      return '<tr>' +
        '<td class="col-id">' + (r.id ?? '') + '</td>' +
        '<td class="num">' + escapeHtml(r.ptm || '—') + '</td>' +
        '<td>' + escapeHtml(r.filial || '—') + '</td>' +
        '<td>' + escapeHtml(r.descricao || '—') + '</td>' +
        '<td>' + escapeHtml(r.motivo || '—') + '</td>' +
        '<td class="num">' + escapeHtml(formatDateBR(r.dataAquisicao) || '—') + '</td>' +
        '<td class="num">' + escapeHtml(formatDateBR(r.dataLancamento) || '—') + '</td>' +
        '<td>' + escapeHtml(calcVidaUtil(r.dataAquisicao, r.dataLancamento)) + '</td>' +
        '<td>' + escapeHtml(r.mes || '—') + '</td>' +
        '<td>' + escapeHtml(r.destino || '—') + '</td>' +
        '<td>' + statusBadge(r.status) + '</td>' +
        '<td><div class="row-actions">' +
        '<button type="button" class="icon-btn" data-action="edit" data-id="' + r.id + '" title="Editar" aria-label="Editar registro ' + r.id + '">' + ICONS.edit + '</button>' +
        '<button type="button" class="icon-btn danger" data-action="delete" data-id="' + r.id + '" title="Excluir" aria-label="Excluir registro ' + r.id + '">' + ICONS.delete + '</button>' +
        '</div></td>' +
        '</tr>';
    }).join('');
  }

  const shownFrom = filtered.length ? start + 1 : 0;
  const shownTo = Math.min(start + PAGE_SIZE, filtered.length);
  $('#pageInfo').textContent = 'Mostrando ' + shownFrom + '–' + shownTo + ' de ' + filtered.length + ' registro(s)';
  $('#btnPrev').disabled = state.page === 1;
  $('#btnNext').disabled = state.page === totalPages;
  $('#pageNumbers').innerHTML = pageList(state.page, totalPages).map(function (p) {
    if (p === '…') return '<span class="page-ellipsis">…</span>';
    return '<button type="button" class="page-num' + (p === state.page ? ' active' : '') +
      '" data-page="' + p + '">' + p + '</button>';
  }).join('');

  $$('.data-table thead th').forEach(function (th) {
    const isSorted = th.dataset.sort === state.sortKey;
    th.classList.toggle('sorted', isSorted);
    const icon = th.querySelector('.sort-icon');
    if (icon) icon.textContent = isSorted ? (state.sortDir === 'asc' ? '▲' : '▼') : '';
  });
}

/* ------------------------------------------------------------
   6. Formulário
   ------------------------------------------------------------ */

function fillSelect(selector, values, placeholder) {
  $(selector).innerHTML = '<option value="">' + escapeHtml(placeholder || 'Selecione...') + '</option>' +
    values.map(function (value) {
      return '<option value="' + escapeHtml(value) + '">' + escapeHtml(value) + '</option>';
    }).join('');
}

function fillSelects() {
  fillSelect('#filial', FILIAIS, 'Selecione...');
  fillSelect('#descricao', DESCRICOES, 'Selecione...');
  fillSelect('#motivo', MOTIVOS, 'Selecione...');
  fillSelect('#destino', DESTINOS, 'Selecione...');
  fillSelect('#mes', MESES, 'Selecione...');
  fillSelect('#status', STATUS, 'Selecione...');
  fillSelect('#filtroStatus', STATUS, 'Todos os status');
  fillSelect('#filtroMes', MESES, 'Todos os meses');
}

function todayISO() {
  const now = new Date();
  return now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
}

function updateCalculated() {
  $('#vidaUtil').value = calcVidaUtil($('#dataAquisicao').value, $('#dataLancamento').value);
}

function applyDefaults() {
  $('#dataLancamento').value = todayISO();
  $('#destino').value = 'Avarias';
  $('#status').value = 'Ok';
  $('#mes').value = mesFromDate($('#dataLancamento').value);
  updateCalculated();
}

function clearForm() {
  $('#form').reset();
  $$('.invalid').forEach(function (el) { el.classList.remove('invalid'); });
  applyDefaults();
}

function cancelEdit() {
  state.editId = null;
  clearForm();
  $('#btnSubmit span').textContent = 'Adicionar';
  $('#formTitle').textContent = 'Novo lançamento';
  $('#formMode').textContent = 'Cadastro';
  $('#formMode').className = 'badge badge-soft';
  $('#btnCancelarEdicao').hidden = true;
}

async function startEdit(id) {
  const record = state.records.find(function (r) { return r.id === id; });
  if (!record) return;
  state.editId = id;
  ['ptm', 'filial', 'descricao', 'motivo', 'dataAquisicao', 'dataLancamento',
    'destino', 'mes', 'status'].forEach(function (field) {
    $('#' + field).value = record[field] || '';
  });
  updateCalculated();
  $('#btnSubmit span').textContent = 'Salvar alterações';
  $('#formTitle').textContent = 'Editar lançamento';
  $('#formMode').textContent = 'Editando #' + id;
  $('#formMode').className = 'badge badge-pendente';
  $('#btnCancelarEdicao').hidden = false;
  $('.form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function deleteRecord(id) {
  const record = state.records.find(function (r) { return r.id === id; });
  const ok = await confirmAction({
    title: 'Excluir lançamento',
    message: 'Deseja realmente excluir o lançamento ' + (record && record.ptm ? record.ptm : '#' + id) +
      '? Esta ação não pode ser desfeita.',
    okLabel: 'Excluir'
  });
  if (!ok) return;
  await storage.remove(id);
  if (state.editId === id) cancelEdit();
  await loadRecords();
  toast('Lançamento excluído com sucesso.');
}

/* ------------------------------------------------------------
   7. Importação e exportação
   ------------------------------------------------------------ */

function csvCell(value) {
  const text = String(value ?? '');
  return /[;"\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}

function exportCSV() {
  const headers = ['ID', 'Nº / PTM', 'Filial', 'Descrição', 'Motivo Sucateamento',
    'Aquisição', 'Data Lançada', 'Vida útil equipamento', 'Mês', 'Destino', 'Status'];
  const lines = state.records.map(function (r) {
    return [r.id, r.ptm, r.filial, r.descricao, r.motivo,
      formatDateBR(r.dataAquisicao), formatDateBR(r.dataLancamento),
      calcVidaUtil(r.dataAquisicao, r.dataLancamento), r.mes, r.destino, r.status];
  });
  const content = [headers].concat(lines).map(function (row) {
    return row.map(csvCell).join(';');
  }).join('\r\n');
  download(new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' }),
    'sucateamento_' + dateStamp() + '.csv');
  toast('Arquivo CSV exportado (' + state.records.length + ' registro(s)).');
}

function exportBackup() {
  const payload = {
    app: 'sucateamento-web',
    version: 1,
    exportedAt: new Date().toISOString(),
    records: state.records
  };
  download(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
    'backup_sucateamento_' + dateStamp() + '.json');
  toast('Backup JSON salvo com sucesso.');
}

function normalizeHeader(text) {
  return String(text).toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

function parseCSV(text) {
  text = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim();
  if (!text) return [];
  const lines = text.split('\n');
  const first = lines[0];
  const delimiter = (first.match(/;/g) || []).length >= (first.match(/,/g) || []).length ? ';' : ',';

  function splitLine(line) {
    const cells = [];
    let current = '';
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (quoted && line[i + 1] === '"') { current += '"'; i++; }
        else quoted = !quoted;
      } else if (char === delimiter && !quoted) {
        cells.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    cells.push(current);
    return cells.map(function (cell) { return cell.trim(); });
  }

  const headerMap = {
    'n ptm': 'ptm', 'ptm': 'ptm', 'filial': 'filial',
    'descricao': 'descricao', 'descricao equipamento': 'descricao',
    'motivo sucateamento': 'motivo', 'motvo sucateamento': 'motivo', 'motivo': 'motivo',
    'aquisicao': 'dataAquisicao', 'data aquisicao': 'dataAquisicao',
    'data lancada': 'dataLancamento', 'data lancamento': 'dataLancamento',
    'lancamento': 'dataLancamento', 'mes': 'mes',
    'destino': 'destino', 'destino avarias': 'destino',
    'status': 'status'
  };

  const headers = splitLine(lines[0]).map(normalizeHeader);
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cells = splitLine(lines[i]);
    const item = {};
    headers.forEach(function (header, index) {
      const key = headerMap[header];
      if (key) item[key] = cells[index] || '';
    });
    item.dataAquisicao = parseDate(item.dataAquisicao);
    item.dataLancamento = parseDate(item.dataLancamento);
    if (!item.dataLancamento) continue;
    item.ptm = item.ptm || '';
    item.filial = item.filial || '';
    item.descricao = item.descricao || '';
    item.motivo = item.motivo || '';
    item.destino = item.destino || 'Avarias';
    item.mes = item.mes || mesFromDate(item.dataLancamento);
    item.status = item.status || 'Ok';
    item.createdAt = new Date().toISOString();
    item.updatedAt = item.createdAt;
    records.push(item);
  }
  return records;
}

async function handleImport(file) {
  let text;
  try { text = await file.text(); }
  catch (e) { toast('Não foi possível ler o arquivo.', 'error'); return; }

  let incoming = [];
  let replace = false;
  try {
    if (file.name.toLowerCase().endsWith('.json')) {
      const parsed = JSON.parse(text);
      incoming = Array.isArray(parsed) ? parsed : (parsed.records || []);
      replace = true;
    } else {
      incoming = parseCSV(text);
      replace = false;
    }
  } catch (error) {
    toast('Arquivo inválido: ' + error.message, 'error');
    return;
  }

  if (!incoming.length) {
    toast('Nenhum registro válido encontrado no arquivo.', 'error');
    return;
  }

  const ok = await confirmAction({
    title: 'Importar registros',
    message: incoming.length + ' registro(s) encontrado(s). ' +
      (replace ? 'Os dados atuais serão SUBSTITUÍDOS pelos do arquivo.'
        : 'Os registros serão adicionados aos dados atuais.'),
    okLabel: 'Importar',
    danger: replace
  });
  if (!ok) return;

  if (replace) await storage.clear();
  for (const record of incoming) {
    delete record.id;
    await storage.add(record);
  }
  await loadRecords();
  toast(incoming.length + ' registro(s) importado(s) com sucesso.');
}

/* ------------------------------------------------------------
   8. Eventos
   ------------------------------------------------------------ */

function bindEvents() {
  $('#form').addEventListener('submit', async function (event) {
    event.preventDefault();

    let valid = true;
    ['filial', 'descricao', 'motivo', 'dataLancamento'].forEach(function (id) {
      const element = $('#' + id);
      const ok = !!element.value.trim();
      element.classList.toggle('invalid', !ok);
      if (!ok) valid = false;
    });
    if (!valid) {
      toast('Preencha os campos obrigatórios.', 'error');
      return;
    }

    const now = new Date().toISOString();
    const record = {
      ptm: $('#ptm').value.trim(),
      filial: $('#filial').value,
      descricao: $('#descricao').value,
      motivo: $('#motivo').value,
      dataAquisicao: $('#dataAquisicao').value,
      dataLancamento: $('#dataLancamento').value,
      destino: $('#destino').value || 'Avarias',
      mes: $('#mes').value || mesFromDate($('#dataLancamento').value),
      status: $('#status').value || 'Ok',
      updatedAt: now
    };

    try {
      if (state.editId) {
        record.id = state.editId;
        const original = state.records.find(function (r) { return r.id === state.editId; });
        record.createdAt = original ? original.createdAt : now;
        await storage.update(record);
        toast('Lançamento atualizado com sucesso.');
        cancelEdit();
      } else {
        record.createdAt = now;
        await storage.add(record);
        toast('Lançamento adicionado com sucesso.');
        clearForm();
      }
      state.page = 1;
      await loadRecords();
    } catch (error) {
      toast('Erro ao salvar: ' + error.message, 'error');
    }
  });

  $('#btnLimpar').addEventListener('click', function () {
    if (state.editId) cancelEdit();
    else clearForm();
  });
  $('#btnCancelarEdicao').addEventListener('click', cancelEdit);

  ['dataAquisicao', 'dataLancamento'].forEach(function (id) {
    $('#' + id).addEventListener('change', function () {
      updateCalculated();
      if (id === 'dataLancamento') $('#mes').value = mesFromDate($('#dataLancamento').value);
    });
  });

  let filterTimer = null;
  $('#busca').addEventListener('input', function () {
    clearTimeout(filterTimer);
    filterTimer = setTimeout(function () { state.page = 1; renderTable(); }, 150);
  });
  $('#filtroStatus').addEventListener('change', function () { state.page = 1; renderTable(); });
  $('#filtroMes').addEventListener('change', function () { state.page = 1; renderTable(); });

  $$('.data-table thead th[data-sort]').forEach(function (th) {
    th.addEventListener('click', function () {
      const key = th.dataset.sort;
      if (state.sortKey === key) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      else { state.sortKey = key; state.sortDir = 'asc'; }
      renderTable();
    });
  });

  $('#tabelaBody').addEventListener('click', function (event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const id = Number(button.dataset.id);
    if (button.dataset.action === 'edit') startEdit(id);
    if (button.dataset.action === 'delete') deleteRecord(id);
  });

  $('#btnPrev').addEventListener('click', function () {
    if (state.page > 1) { state.page--; renderTable(); }
  });
  $('#btnNext').addEventListener('click', function () {
    state.page++; renderTable();
  });
  $('#pageNumbers').addEventListener('click', function (event) {
    const button = event.target.closest('button[data-page]');
    if (!button) return;
    state.page = Number(button.dataset.page);
    renderTable();
  });

  $('#btnExport').addEventListener('click', exportCSV);
  $('#btnBackup').addEventListener('click', exportBackup);
  $('#btnImport').addEventListener('click', function () { $('#fileInput').click(); });
  $('#fileInput').addEventListener('change', function (event) {
    const file = event.target.files && event.target.files[0];
    if (file) handleImport(file);
    event.target.value = '';
  });

  $('#btnRestaurar').addEventListener('click', async function () {
    const ok = await confirmAction({
      title: 'Restaurar exemplos',
      message: 'Todos os registros atuais serão SUBSTITUÍDOS pelos 30 registros de exemplo do print original. Continuar?',
      okLabel: 'Restaurar'
    });
    if (!ok) return;
    await storage.clear();
    await storage.bulkAdd(makeSeedRecords());
    state.page = 1;
    await loadRecords();
    toast('Registros de exemplo restaurados.');
  });

  $('#btnLimparTudo').addEventListener('click', async function () {
    const ok = await confirmAction({
      title: 'Limpar todos os dados',
      message: 'Isso irá apagar TODOS os registros salvos no banco de dados. Faça um backup antes se desejar. Continuar?',
      okLabel: 'Apagar tudo'
    });
    if (!ok) return;
    await storage.clear();
    state.page = 1;
    await loadRecords();
    toast('Todos os registros foram removidos.');
  });
}

/* ------------------------------------------------------------
   9. Inicialização
   ------------------------------------------------------------ */

async function init() {
  fillSelects();
  bindEvents();
  try {
    await initStorage();
    await loadRecords();
  } catch (error) {
    console.error(error);
    toast('Erro ao acessar o banco de dados: ' + error.message, 'error');
    render();
  }
  applyDefaults();
}

init();
