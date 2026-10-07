// Teste do Codigo.gs com dublês (mocks) dos serviços do Google Apps Script.
// Antes: python3 testes/gerar_fixture.py  (gera testes/planilha.json com questões fictícias)
// O relógio é fixado em 04/10/2026 para os cenários serem reproduzíveis.
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const path = require('path');
const DIR = __dirname + '/';
// Uso: node testes/teste.js [caminho do Codigo.gs]  (padrão: apps-script/Codigo.gs)
const CODIGO = path.resolve(process.argv[2] || path.join(__dirname, '..', 'apps-script', 'Codigo.gs'));
const raw = JSON.parse(fs.readFileSync(DIR + 'planilha.json', 'utf8'));
const LOG = [];
const eq = (a, b, m) => assert.deepStrictEqual(JSON.parse(JSON.stringify(a === undefined ? null : a)), JSON.parse(JSON.stringify(b === undefined ? null : b)), m);
const log = (...a) => LOG.push(a.join(' '));

// ---------- Planilha ----------
function conv(v) { return v && v.__date__ ? new Date(v.__date__) : v; }
class Range {
  constructor(sh, r, c, nr, nc) { Object.assign(this, { sh, r, c, nr: nr || 1, nc: nc || 1 }); }
  getValues() { const o = []; for (let i = 0; i < this.nr; i++) { const l = []; for (let j = 0; j < this.nc; j++) l.push(this.sh.get(this.r + i, this.c + j)); o.push(l); } return o; }
  setValues(v) { v.forEach((l, i) => l.forEach((x, j) => this.sh.set(this.r + i, this.c + j, x))); return this; }
  setValue(x) { this.sh.set(this.r, this.c, x); return this; }
  setNumberFormat() { return this; } setFontWeight() { return this; }
  getRow() { return this.r; }
}
class Sheet {
  constructor(name, data) { this.name = name; this.d = (data || []).map(l => l.map(conv)); }
  get(r, c) { const l = this.d[r - 1]; return l && l[c - 1] !== undefined ? l[c - 1] : ''; }
  set(r, c, x) { while (this.d.length < r) this.d.push([]); const l = this.d[r - 1]; while (l.length < c) l.push(''); l[c - 1] = x; }
  getName() { return this.name; }
  getLastRow() { let n = this.d.length; while (n > 0 && this.d[n - 1].every(x => x === '' || x === undefined)) n--; return n; }
  getLastColumn() { return Math.max(0, ...this.d.map(l => { let n = l.length; while (n > 0 && (l[n - 1] === '' || l[n - 1] === undefined)) n--; return n; })); }
  getRange(r, c, nr, nc) { return new Range(this, r, c, nr, nc); }
  getDataRange() { return new Range(this, 1, 1, this.getLastRow(), this.getLastColumn()); }
  appendRow(v) { this.d.push(v.slice()); }
  clear() { this.d = []; } clearContents() { this.d = []; }
  activate() {} autoResizeColumns() {}
  getActiveRange() { return new Range(this, ATIVA.linha, 1); }
}
const ATIVA = { aba: 'Desafios', linha: 2 };
let TZ = 'America/Sao_Paulo';
const sheets = {}; Object.keys(raw).forEach(k => sheets[k] = new Sheet(k, raw[k]));
const SS = {
  getSheetByName: n => sheets[n] || null,
  insertSheet: n => (sheets[n] = new Sheet(n, [])),
  getSpreadsheetTimeZone: () => TZ, setSpreadsheetTimeZone: t => { TZ = t; },
  getUrl: () => 'https://docs.google.com/spreadsheets/d/PLANILHA',
};
const ALERTAS = [], DIALOGOS = [];
const ui = {
  alert: (a, b) => { ALERTAS.push(b ? a + ' | ' + b : a); return 'YES'; },
  showModalDialog: (h, t) => DIALOGOS.push({ t, h: h.html }),
  createMenu: () => ({ addItem() { return this; }, addSeparator() { return this; }, addToUi() {} }),
  ButtonSet: { YES_NO: 'YES_NO' }, Button: { YES: 'YES' },
};
const SpreadsheetApp = { getActiveSpreadsheet: () => SS, getActiveSheet: () => sheets[ATIVA.aba], flush() {}, getUi: () => ui };

// ---------- Forms ----------
let nForm = 0; const FORMS = {}; const TRASH = new Set();
class Item {
  constructor(tipo) { this.tipo = tipo; this.choices = []; this.points = 0; }
  setTitle(t) { this.title = t; return this; } setHelpText(t) { this.help = t; return this; }
  createChoice(v, ok) { return { v, ok }; } setChoices(c) { this.choices = c; return this; }
  setPoints(p) { assert(Number.isInteger(p)); this.points = p; return this; } setRequired() { return this; }
  setFeedbackForCorrect(f) { this.fbOk = f; return this; } setFeedbackForIncorrect(f) { this.fbNo = f; return this; }
  setImage(b) { this.img = b; return this; }
  getType() { return this.tipo; } asMultipleChoiceItem() { return this; } getPoints() { return this.points; }
}
class Form {
  constructor(name) { this.id = 'FORM' + (++nForm); this.name = name; this.items = []; this.responses = []; this.accepting = true; this.published = false; FORMS[this.id] = this; }
  getId() { return this.id; } getItems() { return this.items.slice(); } deleteItem(it) { this.items = this.items.filter(x => x !== it); }
  setTitle(t) { this.title = t; return this; } setDescription(t) { this.desc = t; return this; }
  setIsQuiz(b) { this.quiz = b; return this; } setShuffleQuestions(b) { this.shuffle = b; return this; }
  setProgressBar() { return this; } setAllowResponseEdits() { return this; } setConfirmationMessage(m) { this.conf = m; return this; }
  setEmailCollectionType(t) { this.email = t; return this; } setLimitOneResponsePerUser(b) { this.one = b; return this; }
  addImageItem() { const i = new Item('IMAGE'); this.items.push(i); return i; }
  addMultipleChoiceItem() { const i = new Item('MULTIPLE_CHOICE'); this.items.push(i); return i; }
  setAcceptingResponses(b) { this.accepting = b; return this; } setCustomClosedFormMessage(m) { this.closedMsg = m; return this; }
  supportsAdvancedResponderPermissions() { return true; } setPublished(b) { this.published = b; return this; }
  addPublishedReaders(l) { this.readers = l; return this; }
  getPublishedUrl() { return 'https://docs.google.com/forms/d/e/' + this.id + '/viewform'; }
  getEditUrl() { return 'https://docs.google.com/forms/d/' + this.id + '/edit'; }
  getResponses() { return this.responses; }
}
const FormApp = {
  create: n => new Form(n), openById: id => { if (!FORMS[id]) throw new Error('form inexistente ' + id); return FORMS[id]; },
  ItemType: { MULTIPLE_CHOICE: 'MULTIPLE_CHOICE', IMAGE: 'IMAGE' }, EmailCollectionType: { VERIFIED: 'VERIFIED' },
  createFeedback: () => ({ setText(t) { this.t = t; return this; }, build() { return { text: this.t }; } }),
};
const DriveApp = {
  getFileById: id => ({ setTrashed: () => TRASH.add(id), moveTo() {}, getName: () => 'arquivo ' + id, getId: () => id,
    makeCopy: n => { const f = new Form(n); f.items.push(new Item('MULTIPLE_CHOICE')); return { getId: () => f.id }; }, getBlob: () => 'BLOB' }),
  getFolderById: id => ({ getName: () => 'pasta ' + id }),
};
const PERMS = [];
const Drive = { Permissions: { create: (r, id) => { PERMS.push({ r, id }); return {}; } } };

// ---------- Classroom ----------
let nCw = 0; const CW = {}; const TOPICS = { '123456789012': [] }; const PATCHES = []; const MATERIAIS = [];
const ALUNOS = [{ userId: 'u1', profile: { emailAddress: 'Ana@cesar.school' } }, { userId: 'u2', profile: { emailAddress: 'bia@cesar.school' } }, { userId: 'u3', profile: { emailAddress: 'caio@cesar.school' } }];
const Classroom = { Courses: {
  get: id => { if (id !== '123456789012') throw new Error('Requested entity was not found.'); return { name: 'TC2', section: 'COMP20262_7A', courseState: 'ACTIVE' }; },
  list: op => { eq(op.courseStates, ['ACTIVE']); return { courses: [{ id: '123456789012', name: 'TC2', section: '7A', alternateLink: 'https://classroom.google.com/c/X' }] }; },
  Topics: { list: (c, op) => ({ topic: TOPICS[c] }), create: (r, c) => { const t = { topicId: 'T' + (TOPICS[c].length + 1), name: r.name }; TOPICS[c].push(t); return t; } },
  CourseWork: {
    create: (r, c) => { const id = 'CW' + (++nCw); CW[id] = Object.assign({ id, courseId: c, alternateLink: 'https://classroom.google.com/c/X/a/' + id }, JSON.parse(JSON.stringify(r))); return CW[id]; },
    get: (c, id) => CW[id], remove: (c, id) => { CW[id].removed = true; },
    StudentSubmissions: {
      list: (c, cw, op) => (op.pageToken ? { studentSubmissions: [{ id: 'S3', userId: 'u3' }] } : { studentSubmissions: [{ id: 'S1', userId: 'u1' }, { id: 'S2', userId: 'u2' }], nextPageToken: 'p2' }),
      patch: (r, c, cw, id, op) => PATCHES.push({ r, c, cw, id, op }),
    },
  },
  Students: { list: (c, op) => ({ students: ALUNOS }) },
  CourseWorkMaterials: { create: (r, c) => MATERIAIS.push({ r, c }) },
} };

// ---------- Outros serviços ----------
function partes(d, tz) {
  const f = new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false });
  const o = {}; f.formatToParts(d).forEach(p => o[p.type] = p.value); return o;
}
const Utilities = {
  formatDate: (d, tz, pat) => {
    const o = partes(d, tz);
    if (pat === 'Z') { const off = tz === 'America/Sao_Paulo' || tz === 'America/Recife' ? '-0300' : '+0000'; return off; }
    if (pat === 'u') return String({ Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[o.weekday]);
    if (pat === "dd/MM 'às' HH:mm") return `${o.day}/${o.month} às ${o.hour}:${o.minute}`;
    throw new Error('padrão não simulado ' + pat);
  },
  parseDate: (s, tz, pat) => { assert(pat === 'yyyy-MM-dd HH:mm'); assert(tz === 'America/Sao_Paulo'); return new Date(s.replace(' ', 'T') + ':00-03:00'); },
};
const props = {}; const cache = {};
const PropertiesService = { getDocumentProperties: () => ({ getProperty: k => props[k] || null, setProperty: (k, v) => { props[k] = v; }, deleteProperty: k => { delete props[k]; } }) };
const CacheService = { getDocumentCache: () => ({ get: k => cache[k] || null, put: (k, v) => { cache[k] = v; } }) };
const LockService = { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) };
let TRIGGERS = [];
const ScriptApp = {
  getProjectTriggers: () => TRIGGERS.slice(), deleteTrigger: t => { TRIGGERS = TRIGGERS.filter(x => x !== t); },
  newTrigger: h => ({ timeBased() { return this; }, everyMinutes(m) { assert([1, 5, 10, 15, 30].includes(m)); return this; }, create() { const t = { getHandlerFunction: () => h }; TRIGGERS.push(t); return t; } }),
};
const EMAILS = [];
const MailApp = { sendEmail: (to, s, b) => EMAILS.push({ to, s, b }) };
const Session = { getEffectiveUser: () => ({ getEmail: () => 'professora@exemplo.com' }) };
const HtmlService = { createHtmlOutput: html => ({ html, setWidth() { return this; }, setHeight() { return this; } }) };
const UrlFetchApp = { fetch: () => ({ getBlob: () => 'BLOBURL' }) };

const AGORA_FIXO = Date.parse('2026-10-04T20:00:00Z');
class FakeDate extends Date { constructor(...a) { if (a.length === 0) super(AGORA_FIXO); else super(...a); } static now() { return AGORA_FIXO; } static [Symbol.hasInstance](x) { return x instanceof Date; } }
const ctx = vm.createContext({ SpreadsheetApp, FormApp, DriveApp, Drive, Classroom, Utilities, PropertiesService, CacheService, LockService, ScriptApp, MailApp, Session, HtmlService, UrlFetchApp, console: { log }, Date: FakeDate, Math, JSON, Object, String, Number, Array, isNaN, Error });
vm.runInContext(fs.readFileSync(CODIGO, 'utf8'), ctx);
const run = c => vm.runInContext(c, ctx);

// helpers de teste
const D = sheets['Desafios']; const cab = D.d[0];
const col = n => cab.indexOf(n) + 1;
const linhaDe = id => D.d.findIndex(l => l[0] === id) + 1;
const val = (id, c) => D.get(linhaDe(id), col(c));
const setv = (id, c, v) => D.set(linhaDe(id), col(c), v);
const cfgSet = (k, v) => { const C = sheets['Config']; const r = C.d.findIndex(l => l[0] === k) + 1; C.set(r, 2, v); };
let ok = 0; const passo = (n, f) => { f(); ok++; console.log('✓', n); };

// =============== CENÁRIOS ===============
passo('leitura da config e dos 16 desafios', () => {
  const cfg = run('lerConfig_()');
  eq(cfg.turmas, []); assert.strictEqual(cfg.dominio, 'cesar.school'); assert.strictEqual(cfg.respondentes, 'DOMINIO');
  assert.strictEqual(cfg.modoNotas, 'RASCUNHO'); assert.strictEqual(cfg.embaralhar, false); assert.strictEqual(cfg.publicarGabarito, true);
  const ds = run('lerDesafios_()'); assert.strictEqual(ds.length, 16);
  ds.forEach(d => { assert(d.publicar instanceof Date && d.prazo > d.publicar); assert.strictEqual(d.status, 'RASCUNHO'); });
  for (const d of ds) { const qs = run(`lerQuestoes_('${d.id}')`); assert.strictEqual(qs.length, 5, d.id); eq(run(`validar_(lerDesafios_().filter(x=>x.id==='${d.id}')[0], lerQuestoes_('${d.id}'), {})`), [], d.id); }
});

passo('datas e formatação pt-BR (seg 12:30 → qua 12:30)', () => {
  const d1 = run("lerDesafios_()[0]");
  assert.strictEqual(d1.publicar.toISOString(), '2026-10-05T15:30:00.000Z');
  assert.strictEqual(run('fmt_(lerDesafios_()[0].publicar)'), 'segunda, 05/10 às 12:30');
  assert.strictEqual(run('fmt_(lerDesafios_()[0].prazo)'), 'quarta, 07/10 às 12:30');
  assert.strictEqual(run("lerDataHora_('12/10/2026 12:30', 'America/Sao_Paulo').toISOString()"), '2026-10-12T15:30:00.000Z');
  assert.strictEqual(run("lerDataHora_('abc', 'America/Sao_Paulo')"), null);
  // calendário: todo "Publicar em" cai em segunda ou quarta às 12:30
  run('lerDesafios_()').forEach(d => assert(/^(segunda|quarta), \d\d\/\d\d às 12:30$/.test(run(`fmt_(new Date(${d.publicar.getTime()}))`)), d.id));
});

passo('verificar configuração sem turma', () => {
  run('verificarConfiguracao()');
  const h = DIALOGOS.pop().h; assert(h.includes('ID_TURMAS está vazio')); assert(h.includes('D16 [RASCUNHO] 5 questões')); assert(h.includes('Piloto automático: desligado'));
});

passo('agendar sem turma → ERRO com mensagem', () => {
  setv('D01', 'Status', 'PRONTO');
  run('agendarProntos()');
  assert.strictEqual(val('D01', 'Status'), 'ERRO'); assert(val('D01', 'Mensagens do robô').includes('preencha ID_TURMAS'));
  assert.strictEqual(EMAILS.length, 0, 'execução manual não manda e-mail');
});

passo('listar turmas', () => { run('listarTurmas()'); assert.strictEqual(sheets['Turmas'].get(2, 3), '123456789012'); });

passo('prévia cria formulário sem tocar no Classroom', () => {
  cfgSet('ID_TURMAS', '123456789012');
  ATIVA.linha = linhaDe('D01'); run('preVisualizarLinha()');
  const f = FORMS['FORM1']; assert(f.name.startsWith('[PRÉVIA] D01'));
  assert.strictEqual(Object.keys(CW).length, 0); assert.strictEqual(props['previa_D01'], 'FORM1');
  assert(DIALOGOS.pop().h.includes('viewform'));
});

passo('agendar D01: formulário-teste + atividade agendada', () => {
  setv('D01', 'Status', 'PRONTO');
  run('agendarProntos()');
  assert.strictEqual(val('D01', 'Status'), 'AGENDADO', val('D01', 'Mensagens do robô'));
  assert(TRASH.has('FORM1'), 'prévia foi para a lixeira');
  const f = FORMS[val('D01', 'ID do formulário')];
  assert.strictEqual(f.quiz, true); assert.strictEqual(f.email, 'VERIFIED'); assert.strictEqual(f.one, true); assert.strictEqual(f.published, true);
  assert.strictEqual(f.items.length, 5); assert(f.items.every(i => i.points === 2 && i.choices.length === 5 && i.choices.filter(c => c.ok).length === 1));
  const gab = run("lerQuestoes_('D01')").map(q => q.correta).join('');
  assert.strictEqual(f.items.map(i => i.choices.find(c => c.ok).v[0]).join(''), gab);
  assert(f.items[0].fbNo.text.startsWith('Resposta esperada: ' + gab[0]));
  eq(PERMS[0].r, { type: 'domain', domain: 'cesar.school', role: 'reader', view: 'published' });
  const cw = CW['CW1'];
  assert.strictEqual(cw.state, 'DRAFT'); assert.strictEqual(cw.scheduledTime, '2026-10-05T15:30:00.000Z');
  eq(cw.dueDate, { year: 2026, month: 10, day: 7 }); eq(cw.dueTime, { hours: 15, minutes: 30 });
  assert.strictEqual(cw.maxPoints, 10); assert.strictEqual(cw.workType, 'ASSIGNMENT'); assert.strictEqual(cw.topicId, 'T1');
  assert.strictEqual(cw.materials[0].link.url, f.getPublishedUrl());
  assert(cw.description.includes('Prazo: quarta, 07/10 às 12:30'));
  assert.strictEqual(val('D01', 'IDs no Classroom'), '123456789012:CW1');
  assert(val('D01', 'Mensagens do robô').startsWith('Agendado para segunda, 05/10 às 12:30'));
});

passo('não duplica: rodar de novo não recria D01', () => { run('agendarProntos()'); assert.strictEqual(Object.keys(CW).length, 1); });

passo('erro de conteúdo em D02 (letra inexistente) → ERRO, sem atividade', () => {
  const Q = sheets['Questoes']; const r = Q.d.findIndex(l => l[0] === 'D02') + 1; const antes = Q.get(r, 10); Q.set(r, 10, 'F');
  setv('D02', 'Status', 'PRONTO'); run('agendarProntos()');
  assert.strictEqual(val('D02', 'Status'), 'ERRO'); assert(val('D02', 'Mensagens do robô').includes('"Correta" precisa ser a letra'));
  Q.set(r, 10, antes); setv('D02', 'Status', 'PRONTO'); run('agendarProntos()');
  assert.strictEqual(val('D02', 'Status'), 'AGENDADO');
  eq(CW['CW2'].dueDate, { year: 2026, month: 10, day: 12 });
});

passo('refazer D02 agendado (ainda não publicado)', () => {
  ATIVA.linha = linhaDe('D02'); const formAntigo = val('D02', 'ID do formulário');
  run('refazerLinha()');
  assert(CW['CW2'].removed); assert(TRASH.has(formAntigo)); assert.strictEqual(val('D02', 'Status'), 'AGENDADO'); assert.strictEqual(val('D02', 'IDs no Classroom'), '123456789012:CW3');
});

passo('refazer bloqueado quando já publicado', () => {
  setv('D01', 'Status', 'PUBLICADO'); ATIVA.linha = linhaDe('D01'); run('refazerLinha()');
  assert(ALERTAS.pop().includes('já está visível')); assert(!CW['CW1'].removed);
});

passo('encerramento: fecha formulário, lança notas (rascunho) e publica gabarito', () => {
  const f = FORMS[val('D01', 'ID do formulário')];
  const resp = (email, acertos) => ({ getRespondentEmail: () => email, getTimestamp: () => new Date(), getGradableItemResponses: () => [0, 1, 2, 3, 4].map(i => ({ getScore: () => (i < acertos ? 2 : 0) })) });
  f.responses = [resp('ana@cesar.school', 4), resp('bia@cesar.school', 2), resp('bia@cesar.school', 5)];
  setv('D01', 'Prazo', new Date(AGORA_FIXO - 60000)); setv('D01', 'Publicar em', new Date(AGORA_FIXO - 3600000));
  run('encerrarVencidos()');
  assert.strictEqual(val('D01', 'Status'), 'ENCERRADO', val('D01', 'Mensagens do robô'));
  assert.strictEqual(f.accepting, false);
  eq(PATCHES.map(p => [p.id, p.r.draftGrade, p.op.updateMask]), [['S1', 8, 'draftGrade'], ['S2', 10, 'draftGrade']]);
  assert(val('D01', 'Mensagens do robô').includes('2 nota(s) lançada(s)') && val('D01', 'Mensagens do robô').includes('1 aluno(s) sem resposta'));
  const N = sheets['Notas']; assert.strictEqual(N.getLastRow(), 3); assert.strictEqual(N.get(2, 2), 'ana@cesar.school'); assert.strictEqual(N.get(3, 5), 10);
  assert.strictEqual(MATERIAIS.length, 1); assert(MATERIAIS[0].r.title.startsWith('Gabarito — Desafio 1')); assert.strictEqual(MATERIAIS[0].r.topicId, 'T1');
  assert(MATERIAIS[0].r.description.includes('Questão 5'));
});

passo('gabarito não é publicado duas vezes', () => {
  setv('D01', 'Status', 'PUBLICADO'); run('encerrarVencidos()'); assert.strictEqual(MATERIAIS.length, 1);
});

passo('notas ATRIBUIDA preenchem assignedGrade', () => {
  cfgSet('NOTAS_NO_CLASSROOM', 'ATRIBUIDA'); PATCHES.length = 0; ATIVA.linha = linhaDe('D01'); run('lancarNotasLinha()');
  assert.strictEqual(PATCHES[0].op.updateMask, 'draftGrade,assignedGrade'); assert.strictEqual(PATCHES[0].r.assignedGrade, 8);
  cfgSet('NOTAS_NO_CLASSROOM', 'RASCUNHO');
});

passo('piloto automático: liga, agenda PRONTOS, publica e manda e-mail em erro', () => {
  setv('D03', 'Status', 'PRONTO'); run('ligarPilotoAutomatico()');
  assert.strictEqual(TRIGGERS.length, 1); assert.strictEqual(val('D03', 'Status'), 'AGENDADO');
  // erro no gatilho → e-mail
  setv('D04', 'Status', 'PRONTO'); setv('D04', 'Prazo', 'data ruim'); run('rotinaAutomatica()');
  assert.strictEqual(val('D04', 'Status'), 'ERRO'); assert.strictEqual(EMAILS.length, 1); assert(EMAILS[0].s.includes('D04'));
  // AGENDADO com publicação no passado vira PUBLICADO
  setv('D03', 'Publicar em', new Date(AGORA_FIXO - 1000)); run('rotinaAutomatica()'); assert.strictEqual(val('D03', 'Status'), 'PUBLICADO');
  run('ligarPilotoAutomatico()'); assert.strictEqual(TRIGGERS.length, 1, 'não duplica gatilho');
  run('desligarPilotoAutomatico()'); assert.strictEqual(TRIGGERS.length, 0);
});

passo('publicação imediata quando a data já chegou', () => {
  setv('D05', 'Publicar em', new Date(AGORA_FIXO - 1000)); setv('D05', 'Status', 'PRONTO'); run('agendarProntos()');
  const id = val('D05', 'IDs no Classroom').split(':')[1]; assert.strictEqual(CW[id].state, 'PUBLISHED'); assert.strictEqual(CW[id].scheduledTime, undefined);
  assert.strictEqual(val('D05', 'Status'), 'PUBLICADO');
});

passo('respondentes ALUNOS e formulário-modelo', () => {
  cfgSet('RESPONDENTES', 'ALUNOS'); cfgSet('FORM_MODELO_ID', 'https://docs.google.com/forms/d/1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789/edit');
  setv('D06', 'Status', 'PRONTO'); run('agendarProntos()');
  const f = FORMS[val('D06', 'ID do formulário')];
  assert.strictEqual(f.items.length, 5, 'item do modelo foi removido'); eq(f.readers.sort(), ['ana@cesar.school', 'bia@cesar.school', 'caio@cesar.school']);
});

passo('fuso diferente é corrigido pela verificação', () => {
  TZ = 'Etc/UTC'; run('verificarConfiguracao()'); assert.strictEqual(TZ, 'America/Sao_Paulo'); assert(DIALOGOS.pop().h.includes('Fuso da planilha ajustado'));
});

console.log(`\n${ok} cenários OK. Log da planilha: ${sheets['Log'].getLastRow() - 1} linhas.`);
