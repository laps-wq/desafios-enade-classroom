/**
 * =====================================================================
 *  DESAFIOS NO GOOGLE CLASSROOM — publicação automática
 *  Kit para professores · CESAR School · versão out/2026
 * =====================================================================
 *
 *  O que este script faz:
 *    1. Lê os desafios (aba "Desafios") e as questões (aba "Questoes").
 *    2. Para cada desafio com Status = PRONTO, cria um Google Forms em
 *       modo teste (correção automática + comentário por questão).
 *    3. Cria a atividade no Classroom já AGENDADA para o horário de
 *       publicação, com prazo, pontuação e o formulário anexado.
 *    4. No prazo: fecha o formulário, lança as notas no Classroom
 *       (como rascunho, por padrão) e publica o gabarito comentado.
 *
 *  Com o "piloto automático" ligado, tudo isso roda sozinho a cada 15 min.
 *  Instalação passo a passo: aba "Como usar" da planilha ou LEIA-ME.txt.
 *  Textos específicos da sua turma (ex.: "conta para a nota de participação")
 *  vão em Config > TEXTO_EXTRA_NA_ATIVIDADE.
 */

// ---------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------

const ABAS = {
  CONFIG: 'Config',
  DESAFIOS: 'Desafios',
  QUESTOES: 'Questoes',
  NOTAS: 'Notas',
  TURMAS: 'Turmas',
  LOG: 'Log',
};

const FUSO_PADRAO = 'America/Sao_Paulo';
const MINUTOS_GATILHO = 15;

const STATUS = {
  RASCUNHO: 'RASCUNHO',
  PRONTO: 'PRONTO',
  AGENDADO: 'AGENDADO',
  PUBLICADO: 'PUBLICADO',
  ENCERRADO: 'ENCERRADO',
  ERRO: 'ERRO',
};

// Cabeçalhos da aba Desafios (o script procura pelo nome, não pela posição)
const CD = {
  ID: 'ID',
  TITULO: 'Título',
  TEMAS: 'Temas',
  AULAS: 'Aulas cobertas',
  PUBLICAR: 'Publicar em',
  PRAZO: 'Prazo',
  PONTOS: 'Pontos',
  STATUS: 'Status',
  OBS: 'Mensagens do robô',
  FORM_URL: 'Link do formulário',
  FORM_EDIT: 'Link de edição',
  LINK_CLASSROOM: 'Link no Classroom',
  FORM_ID: 'ID do formulário',
  ATIVIDADES: 'IDs no Classroom',
};

// Cabeçalhos da aba Questoes
const CQ = {
  DESAFIO: 'Desafio',
  NUM: 'Nº',
  AREA: 'Área',
  ENUNCIADO: 'Enunciado',
  CORRETA: 'Correta',
  COMENTARIO: 'Comentário',
  PONTOS: 'Pontos',
  IMAGEM: 'Imagem',
};
const LETRAS = ['A', 'B', 'C', 'D', 'E'];

const DIAS_SEMANA = ['', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];

// ---------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Desafios ENADE')
    .addItem('1) Verificar configuração', 'verificarConfiguracao')
    .addItem('2) Listar minhas turmas do Classroom', 'listarTurmas')
    .addItem('3) Pré-visualizar o desafio da linha selecionada', 'preVisualizarLinha')
    .addSeparator()
    .addItem('Agendar agora os desafios PRONTOS', 'agendarProntos')
    .addItem('Refazer o desafio selecionado (antes de publicar)', 'refazerLinha')
    .addItem('Encerrar desafios vencidos e lançar notas', 'encerrarVencidos')
    .addItem('Lançar notas do desafio selecionado', 'lancarNotasLinha')
    .addSeparator()
    .addItem('Ligar piloto automático', 'ligarPilotoAutomatico')
    .addItem('Desligar piloto automático', 'desligarPilotoAutomatico')
    .addToUi();
}

// ---------------------------------------------------------------------
// Ações do menu
// ---------------------------------------------------------------------

function verificarConfiguracao() {
  comTrava_(function () {
    const ss = ss_();
    const msgs = [];

    // 1. Fuso horário da planilha (as datas das células dependem dele)
    const tz = ss.getSpreadsheetTimeZone();
    if (Utilities.formatDate(new Date(), tz, 'Z') !== '-0300') {
      ss.setSpreadsheetTimeZone(FUSO_PADRAO);
      msgs.push('Fuso da planilha ajustado de ' + tz + ' para ' + FUSO_PADRAO + '.');
    } else {
      msgs.push('Fuso da planilha OK (' + tz + ').');
    }

    // 2. Turmas
    const cfg = lerConfig_();
    if (!cfg.turmas.length) {
      msgs.push('ID_TURMAS está vazio: use o menu "2) Listar minhas turmas" e copie o ID para a aba Config.');
    }
    cfg.turmas.forEach(function (id) {
      try {
        const c = Classroom.Courses.get(id);
        msgs.push('Turma OK: ' + c.name + (c.section ? ' — ' + c.section : '') + ' (' + c.courseState + ')');
      } catch (e) {
        msgs.push('Turma ' + id + ': não encontrei ou você não tem acesso (' + e.message + ').');
      }
    });

    // 3. Pasta e formulário-modelo (opcionais)
    if (cfg.pastaId) {
      try { msgs.push('Pasta do Drive OK: ' + DriveApp.getFolderById(cfg.pastaId).getName()); }
      catch (e) { msgs.push('PASTA_DRIVE_ID inválido: ' + e.message); }
    }
    if (cfg.modeloId) {
      try { msgs.push('Formulário-modelo OK: ' + DriveApp.getFileById(cfg.modeloId).getName()); }
      catch (e) { msgs.push('FORM_MODELO_ID inválido: ' + e.message); }
    }
    msgs.push('Quem pode responder: ' + descreverRespondentes_(cfg));

    // 4. Desafios
    msgs.push('');
    const desafios = lerDesafios_();
    if (!desafios.length) msgs.push('Nenhum desafio na aba Desafios.');
    desafios.forEach(function (d) {
      const qs = lerQuestoes_(d.id);
      const checar = [STATUS.RASCUNHO, STATUS.PRONTO, STATUS.ERRO].indexOf(d.status) >= 0;
      const erros = checar ? validar_(d, qs, {}) : [];
      msgs.push(
        d.id + ' [' + d.status + '] ' + qs.length + ' questões · publica ' +
        (d.publicar ? fmt_(d.publicar) : '?') + ' · prazo ' + (d.prazo ? fmt_(d.prazo) : '?') +
        (erros.length ? '  >> PROBLEMAS: ' + erros.join('; ') : '  >> ok')
      );
    });

    // 5. Piloto automático
    msgs.push('');
    msgs.push(gatilhoAtivo_() ? 'Piloto automático: LIGADO' : 'Piloto automático: desligado');

    mostrarTexto_('Verificação da configuração', msgs);
  });
}

function listarTurmas() {
  comTrava_(function () {
    const cursos = listarTodas_(function (op) {
      return Classroom.Courses.list(Object.assign({ teacherId: 'me', courseStates: ['ACTIVE'] }, op));
    }, 'courses');
    const sh = aba_(ABAS.TURMAS, true);
    sh.clear();
    const linhas = [['Nome', 'Seção', 'ID da turma (copie para Config > ID_TURMAS)', 'Link']].concat(
      cursos.map(function (c) { return [c.name, c.section || '', String(c.id), c.alternateLink]; })
    );
    sh.getRange(1, 1, linhas.length, 4).setNumberFormat('@').setValues(linhas);
    sh.getRange(1, 1, 1, 4).setFontWeight('bold');
    sh.autoResizeColumns(1, 4);
    sh.activate();
    avisar_(cursos.length + ' turma(s) ativa(s) listada(s) na aba "Turmas".\n\n' +
      'Copie o ID da turma de Tópicos Contemporâneos 2 para Config > ID_TURMAS.');
  });
}

function preVisualizarLinha() {
  comTrava_(function () {
    const d = desafioSelecionado_();
    const cfg = lerConfig_();
    const qs = lerQuestoes_(d.id);
    const erros = validar_(d, qs, { previa: true });
    if (erros.length) throw new Error(erros.join('\n'));

    descartarPrevia_(d.id);
    const r = construirFormulario_(d, qs, cfg, '[PRÉVIA] ');
    PropertiesService.getDocumentProperties().setProperty('previa_' + d.id, r.form.getId());
    registrar_('prévia', d.id, r.form.getEditUrl());

    mostrarLinks_('Prévia de ' + d.id, [
      ['Ver como aluno', r.form.getPublishedUrl()],
      ['Editar formulário', r.form.getEditUrl()],
    ], 'Nada foi postado no Classroom. A prévia é apagada quando o desafio for agendado.' +
       (r.aviso ? '<br><br><b>Atenção:</b> ' + escapar_(r.aviso) : ''));
  });
}

function agendarProntos() {
  comTrava_(function () {
    const r = agendarProntos_(false);
    avisar_(resumo_('Agendamento', r) || 'Nenhum desafio com Status = PRONTO.');
  });
}

function refazerLinha() {
  comTrava_(function () {
    const d = desafioSelecionado_();
    if (jaVisivel_(d)) {
      throw new Error('Este desafio já está visível para os alunos. Para corrigir uma questão, ' +
        'edite o formulário pelo "Link de edição" (as respostas já enviadas são mantidas).');
    }
    const ui = SpreadsheetApp.getUi();
    const ok = ui.alert('Refazer ' + d.id,
      'Vou apagar o formulário e a atividade agendada deste desafio e criar tudo de novo ' +
      'com o conteúdo atual da planilha. Continuar?', ui.ButtonSet.YES_NO);
    if (ok !== ui.Button.YES) return;

    removerAtividades_(d);
    if (d.formId) lixeira_(d.formId);
    const limpar = {};
    [CD.ATIVIDADES, CD.FORM_ID, CD.FORM_URL, CD.FORM_EDIT, CD.LINK_CLASSROOM].forEach(function (c) { limpar[c] = ''; });
    limpar[CD.STATUS] = STATUS.PRONTO;
    limpar[CD.OBS] = 'Refeito: aguardando novo agendamento';
    escrever_(d, limpar);

    const cfg = lerConfig_();
    const novo = lerDesafios_().filter(function (x) { return x.linha === d.linha; })[0];
    try {
      agendarDesafio_(novo, cfg);
      avisar_(d.id + ' refeito e agendado novamente.');
    } catch (e) {
      marcarErro_(novo, e, cfg, false);
      throw e;
    }
  });
}

function encerrarVencidos() {
  comTrava_(function () {
    const r = encerrarVencidos_(false);
    avisar_(resumo_('Encerramento', r) || 'Nenhum desafio com prazo vencido para encerrar.');
  });
}

function lancarNotasLinha() {
  comTrava_(function () {
    const d = desafioSelecionado_();
    if (!d.formId) throw new Error('Este desafio ainda não tem formulário.');
    const cfg = lerConfig_();
    const msg = lancarNotas_(d, cfg);
    escrever_(d, campo_(CD.OBS, 'Notas atualizadas em ' + fmt_(new Date()) + ' · ' + msg));
    registrar_('notas', d.id, msg);
    avisar_(d.id + ': ' + msg + '\n\nDetalhes na aba "Notas".');
  });
}

function ligarPilotoAutomatico() {
  comTrava_(function () {
    removerGatilhos_();
    ScriptApp.newTrigger('rotinaAutomatica').timeBased().everyMinutes(MINUTOS_GATILHO).create();
    const r = executarRotina_(false);
    registrar_('piloto', '', 'ligado');
    avisar_('Piloto automático LIGADO.\n\n' +
      'A cada ' + MINUTOS_GATILHO + ' minutos o script vai:\n' +
      '• agendar no Classroom os desafios marcados como PRONTO;\n' +
      '• fechar o formulário quando o prazo vencer, lançar as notas e o gabarito.\n\n' +
      (resumo_('Agendados agora', r.agendados) || 'Nada para agendar agora.') + '\n' +
      (resumo_('Encerrados agora', r.encerrados) || ''));
  });
}

function desligarPilotoAutomatico() {
  comTrava_(function () {
    const n = removerGatilhos_();
    registrar_('piloto', '', 'desligado');
    avisar_((n ? 'Piloto automático DESLIGADO.' : 'O piloto automático já estava desligado.') + '\n\n' +
      'Atenção: atividades já agendadas no Classroom continuam agendadas e serão publicadas, ' +
      'mas os formulários não serão fechados nem as notas lançadas automaticamente.');
  });
}

/** Executada pelo gatilho de tempo (não chame pelo menu). */
function rotinaAutomatica() {
  const trava = LockService.getScriptLock();
  if (!trava.tryLock(5000)) return;
  try {
    executarRotina_(true);
  } catch (e) {
    registrar_('erro', 'rotina', e.message);
    throw e; // o Google avisa por e-mail quando um gatilho falha
  } finally {
    trava.releaseLock();
  }
}

// ---------------------------------------------------------------------
// Núcleo
// ---------------------------------------------------------------------

function executarRotina_(silencioso) {
  const agendados = agendarProntos_(silencioso);
  atualizarPublicados_();
  const encerrados = encerrarVencidos_(silencioso);
  return { agendados: agendados, encerrados: encerrados };
}

function agendarProntos_(silencioso) {
  const cfg = lerConfig_();
  const res = { ok: [], erro: [] };
  lerDesafios_()
    .filter(function (d) { return d.status === STATUS.PRONTO; })
    .forEach(function (d) {
      try {
        agendarDesafio_(d, cfg);
        res.ok.push(d.id);
      } catch (e) {
        marcarErro_(d, e, cfg, silencioso);
        res.erro.push(d.id + ': ' + e.message);
      }
    });
  return res;
}

function agendarDesafio_(d, cfg) {
  const qs = lerQuestoes_(d.id);
  const erros = validar_(d, qs, {});
  if (!cfg.turmas.length) erros.unshift('preencha ID_TURMAS na aba Config');
  if (d.atividades) erros.push('esta linha já tem atividade no Classroom (use "Refazer o desafio selecionado")');
  if (erros.length) throw new Error(erros.join('; '));

  // Formulário de tentativa anterior e prévias vão para a lixeira
  if (d.formId) lixeira_(d.formId);
  descartarPrevia_(d.id);

  const r = construirFormulario_(d, qs, cfg, '');
  if (r.aviso) {
    lixeira_(r.form.getId());
    throw new Error(r.aviso);
  }
  const form = r.form;
  const camposForm = {};
  camposForm[CD.FORM_ID] = form.getId();
  camposForm[CD.FORM_URL] = form.getPublishedUrl();
  camposForm[CD.FORM_EDIT] = form.getEditUrl();
  escrever_(d, camposForm);

  const agora = new Date();
  // Se a publicação for daqui a menos de 2 min, publica direto
  const agendar = d.publicar.getTime() > agora.getTime() + 2 * 60 * 1000;
  const criadas = [];
  let link = '';
  cfg.turmas.forEach(function (courseId) {
    const topicId = obterTopico_(courseId, cfg.topico);
    const cw = Classroom.Courses.CourseWork.create(recursoAtividade_(d, qs, cfg, form, topicId, agendar), courseId);
    criadas.push(courseId + ':' + cw.id);
    link = link || cw.alternateLink || '';
    escrever_(d, campo_(CD.ATIVIDADES, criadas.join(';')));
  });

  const status = agendar ? STATUS.AGENDADO : STATUS.PUBLICADO;
  const fim = {};
  fim[CD.STATUS] = status;
  fim[CD.LINK_CLASSROOM] = link;
  fim[CD.OBS] = (agendar ? 'Agendado para ' + fmt_(d.publicar) : 'Publicado em ' + fmt_(agora)) +
    ' · prazo ' + fmt_(d.prazo) + ' · ' + qs.length + ' questões · ' + cfg.turmas.length + ' turma(s)';
  escrever_(d, fim);
  registrar_(status.toLowerCase(), d.id, fim[CD.OBS]);
}

function atualizarPublicados_() {
  const agora = new Date();
  lerDesafios_()
    .filter(function (d) { return d.status === STATUS.AGENDADO && d.publicar && d.publicar <= agora; })
    .forEach(function (d) {
      const c = {};
      c[CD.STATUS] = STATUS.PUBLICADO;
      c[CD.OBS] = 'Publicado pelo Classroom em ' + fmt_(d.publicar) + ' · prazo ' + fmt_(d.prazo);
      escrever_(d, c);
    });
}

function encerrarVencidos_(silencioso) {
  const cfg = lerConfig_();
  const agora = new Date();
  const res = { ok: [], erro: [] };
  lerDesafios_()
    .filter(function (d) {
      return (d.status === STATUS.PUBLICADO || d.status === STATUS.AGENDADO) &&
        d.prazo && d.prazo <= agora && d.formId;
    })
    .forEach(function (d) {
      try {
        const form = FormApp.openById(d.formId);
        if (cfg.fecharNoPrazo) {
          form.setAcceptingResponses(false);
          tentar_(function () {
            form.setCustomClosedFormMessage('O prazo deste desafio terminou. O gabarito comentado está no Classroom.');
          });
        }
        const msgNotas = lancarNotas_(d, cfg);
        if (cfg.publicarGabarito) publicarGabarito_(d, cfg);
        const c = {};
        c[CD.STATUS] = STATUS.ENCERRADO;
        c[CD.OBS] = 'Encerrado em ' + fmt_(agora) + ' · ' + msgNotas +
          (cfg.publicarGabarito ? ' · gabarito publicado' : '');
        escrever_(d, c);
        registrar_('encerrado', d.id, c[CD.OBS]);
        res.ok.push(d.id);
      } catch (e) {
        marcarErro_(d, e, cfg, silencioso);
        res.erro.push(d.id + ': ' + e.message);
      }
    });
  return res;
}

// ---------------------------------------------------------------------
// Google Forms
// ---------------------------------------------------------------------

/**
 * Cria o formulário-teste do desafio.
 * Retorna { form, aviso }. "aviso" é preenchido quando não foi possível
 * liberar o acesso dos alunos (o chamador decide se é erro).
 */
function construirFormulario_(d, qs, cfg, prefixo) {
  const nomeArquivo = prefixo + d.id + ' — ' + d.titulo;
  let form;
  if (cfg.modeloId) {
    const copia = DriveApp.getFileById(cfg.modeloId).makeCopy(nomeArquivo);
    form = FormApp.openById(copia.getId());
    form.getItems().forEach(function (it) { form.deleteItem(it); });
  } else {
    form = FormApp.create(nomeArquivo);
  }

  if (cfg.pastaId) {
    tentar_(function () { DriveApp.getFileById(form.getId()).moveTo(DriveApp.getFolderById(cfg.pastaId)); });
  }

  form.setTitle(d.titulo);
  form.setDescription(descricaoFormulario_(d, qs, cfg));
  form.setIsQuiz(true);
  form.setShuffleQuestions(cfg.embaralhar);
  form.setProgressBar(true);
  form.setAllowResponseEdits(false);
  form.setConfirmationMessage('Respostas enviadas! Agora volte ao Classroom e clique em "Marcar como concluída".');
  tentar_(
    function () { form.setEmailCollectionType(FormApp.EmailCollectionType.VERIFIED); },
    function () { form.setCollectEmail(true); }
  );
  tentar_(function () { form.setLimitOneResponsePerUser(cfg.umaResposta); });

  qs.forEach(function (q, i) {
    if (q.imagem) {
      let blob;
      try { blob = obterImagem_(q.imagem); }
      catch (e) { throw new Error('questão ' + q.num + ': não consegui carregar a imagem (' + e.message + ')'); }
      form.addImageItem().setTitle('Figura da questão ' + (i + 1)).setImage(blob);
    }
    const item = form.addMultipleChoiceItem();
    item.setTitle('Questão ' + (i + 1) + (q.area ? ' — ' + q.area : ''));
    item.setHelpText(q.enunciado);
    item.setChoices(q.alternativas.map(function (a) {
      return item.createChoice(a.letra + ') ' + a.texto, a.letra === q.correta);
    }));
    item.setPoints(Math.max(0, Math.round(q.pontos)));
    item.setRequired(true);
    if (q.comentario) {
      item.setFeedbackForCorrect(FormApp.createFeedback().setText('Correto! ' + q.comentario).build());
      item.setFeedbackForIncorrect(FormApp.createFeedback()
        .setText('Resposta esperada: ' + q.correta + '. ' + q.comentario).build());
    }
  });

  form.setAcceptingResponses(true);
  const aviso = liberarRespondentes_(form, cfg);
  return { form: form, aviso: aviso };
}

/**
 * Formulários novos usam o modelo de "respondentes" do Google Forms:
 * é preciso publicar e dizer quem pode responder. Retorna '' se deu certo
 * ou um texto de aviso.
 */
function liberarRespondentes_(form, cfg) {
  let avancado = false;
  try {
    avancado = typeof form.supportsAdvancedResponderPermissions === 'function' &&
      form.supportsAdvancedResponderPermissions();
  } catch (e) { avancado = false; }
  if (!avancado) return ''; // modelo antigo: o formulário já nasce publicado

  try {
    form.setPublished(true);
    if (cfg.respondentes === 'QUALQUER') {
      Drive.Permissions.create({ type: 'anyone', role: 'reader', view: 'published' }, form.getId());
    } else if (cfg.respondentes === 'ALUNOS') {
      const emails = {};
      cfg.turmas.forEach(function (id) {
        const m = emailsDosAlunos_(id);
        Object.keys(m).forEach(function (k) { emails[m[k]] = true; });
      });
      const lista = Object.keys(emails);
      if (!lista.length) return 'não encontrei alunos nas turmas para liberar como respondentes';
      form.addPublishedReaders(lista);
    } else {
      if (!cfg.dominio) return 'preencha DOMINIO_ALUNOS na aba Config (ex.: cesar.school)';
      Drive.Permissions.create({ type: 'domain', domain: cfg.dominio, role: 'reader', view: 'published' }, form.getId());
    }
    return '';
  } catch (e) {
    return 'não consegui liberar o formulário para os alunos (' + e.message + '). ' +
      'Confira RESPONDENTES / DOMINIO_ALUNOS na aba Config.';
  }
}

function descricaoFormulario_(d, qs, cfg) {
  const partes = [];
  if (d.temas) partes.push('Temas: ' + d.temas);
  if (d.aulas) partes.push('Aulas revisadas: ' + d.aulas);
  partes.push(qs.length + ' questões objetivas · prazo: ' + fmt_(d.prazo) + '.');
  partes.push('Responda como se fosse a prova: leia o enunciado inteiro, elimine as alternativas erradas e só depois marque.' +
    (cfg.publicarGabarito ? ' O gabarito comentado sai no Classroom logo depois do prazo.' : ''));
  return partes.join('\n\n');
}

function obterImagem_(ref) {
  const id = extrairIdDrive_(ref);
  if (id) return DriveApp.getFileById(id).getBlob();
  return UrlFetchApp.fetch(ref).getBlob();
}

// ---------------------------------------------------------------------
// Google Classroom
// ---------------------------------------------------------------------

function recursoAtividade_(d, qs, cfg, form, topicId, agendar) {
  const p = d.prazo; // dueDate/dueTime são em UTC
  const r = {
    title: d.titulo,
    description: descricaoAtividade_(d, qs, cfg),
    materials: [{ link: { url: form.getPublishedUrl() } }],
    workType: 'ASSIGNMENT',
    maxPoints: Math.max(0, Math.round(d.pontos)),
    dueDate: { year: p.getUTCFullYear(), month: p.getUTCMonth() + 1, day: p.getUTCDate() },
    dueTime: { hours: p.getUTCHours(), minutes: p.getUTCMinutes() },
    state: agendar ? 'DRAFT' : 'PUBLISHED',
  };
  if (agendar) r.scheduledTime = d.publicar.toISOString();
  if (topicId) r.topicId = topicId;
  return r;
}

function descricaoAtividade_(d, qs, cfg) {
  const l = [];
  l.push('Desafio da semana: ' + (d.temas || d.titulo));
  if (d.aulas) l.push('Aulas revisadas: ' + d.aulas);
  l.push('');
  l.push('• ' + qs.length + ' questões objetivas, com correção automática');
  l.push('• Prazo: ' + fmt_(d.prazo));
  l.push('');
  l.push('Como fazer: abra o formulário anexo, entre com seu e-mail institucional, responda e envie. ' +
    'Depois volte aqui e clique em "Marcar como concluída".');
  if (cfg.publicarGabarito) l.push('O gabarito comentado sai aqui no Classroom logo depois do prazo.');
  if (cfg.textoExtra) { l.push(''); l.push(cfg.textoExtra); }
  return l.join('\n');
}

function obterTopico_(courseId, nome) {
  if (!nome) return null;
  const cache = CacheService.getDocumentCache();
  const chave = 'topico_' + courseId + '_' + nome;
  const salvo = cache && cache.get(chave);
  if (salvo) return salvo;
  try {
    const topicos = listarTodas_(function (op) { return Classroom.Courses.Topics.list(courseId, op); }, 'topic');
    let t = topicos.filter(function (x) { return x.name === nome; })[0];
    if (!t) t = Classroom.Courses.Topics.create({ name: nome }, courseId);
    if (cache) cache.put(chave, t.topicId, 21600);
    return t.topicId;
  } catch (e) {
    registrar_('aviso', '', 'não consegui usar o tópico "' + nome + '" na turma ' + courseId + ': ' + e.message);
    return null;
  }
}

function emailsDosAlunos_(courseId) {
  const m = {};
  listarTodas_(function (op) { return Classroom.Courses.Students.list(courseId, op); }, 'students')
    .forEach(function (s) {
      const e = s.profile && s.profile.emailAddress;
      if (e) m[s.userId] = String(e).toLowerCase();
    });
  return m;
}

function removerAtividades_(d) {
  pares_(d.atividades).forEach(function (p) {
    try { Classroom.Courses.CourseWork.remove(p.courseId, p.cwId); }
    catch (e) { registrar_('aviso', d.id, 'não consegui apagar a atividade ' + p.cwId + ': ' + e.message); }
  });
}

/** True se alguma atividade do desafio já está publicada para os alunos. */
function jaVisivel_(d) {
  if (d.status === STATUS.PUBLICADO || d.status === STATUS.ENCERRADO) return true;
  if (d.publicar && d.publicar <= new Date() && d.atividades) return true;
  return pares_(d.atividades).some(function (p) {
    try { return Classroom.Courses.CourseWork.get(p.courseId, p.cwId).state === 'PUBLISHED'; }
    catch (e) { return false; }
  });
}

// ---------------------------------------------------------------------
// Notas e gabarito
// ---------------------------------------------------------------------

function calcularNotas_(d) {
  const form = FormApp.openById(d.formId);
  let max = 0;
  form.getItems().forEach(function (it) {
    if (it.getType() === FormApp.ItemType.MULTIPLE_CHOICE) max += it.asMultipleChoiceItem().getPoints();
  });
  const notas = {};
  form.getResponses().forEach(function (r) {
    const email = String(r.getRespondentEmail() || '').toLowerCase();
    if (!email) return;
    const pontos = r.getGradableItemResponses().reduce(function (s, ir) { return s + (Number(ir.getScore()) || 0); }, 0);
    const nota = max ? Math.round((pontos / max) * d.pontos * 100) / 100 : 0;
    if (!notas[email] || nota > notas[email].nota) {
      notas[email] = { pontos: pontos, max: max, nota: nota, quando: r.getTimestamp() };
    }
  });
  return notas;
}

/** Calcula as notas, grava na aba Notas e (se configurado) lança no Classroom. */
function lancarNotas_(d, cfg) {
  const notas = calcularNotas_(d);
  gravarNotasNaPlanilha_(d, notas);
  const total = Object.keys(notas).length;
  if (cfg.modoNotas === 'NAO' || !d.atividades) return total + ' resposta(s) registradas na aba Notas';

  let lancadas = 0;
  let semResposta = 0;
  pares_(d.atividades).forEach(function (p) {
    const emails = emailsDosAlunos_(p.courseId);
    listarTodas_(function (op) {
      return Classroom.Courses.CourseWork.StudentSubmissions.list(p.courseId, p.cwId, op);
    }, 'studentSubmissions').forEach(function (sub) {
      const email = emails[sub.userId];
      const n = email && notas[email];
      if (!n) { semResposta++; return; }
      const rec = { draftGrade: n.nota };
      let mask = 'draftGrade';
      if (cfg.modoNotas === 'ATRIBUIDA') { rec.assignedGrade = n.nota; mask += ',assignedGrade'; }
      Classroom.Courses.CourseWork.StudentSubmissions.patch(rec, p.courseId, p.cwId, sub.id, { updateMask: mask });
      lancadas++;
    });
  });
  return lancadas + ' nota(s) lançada(s) no Classroom como ' +
    (cfg.modoNotas === 'ATRIBUIDA' ? 'nota atribuída' : 'rascunho') + ' · ' + semResposta + ' aluno(s) sem resposta';
}

function gravarNotasNaPlanilha_(d, notas) {
  const sh = aba_(ABAS.NOTAS, true);
  const cab = ['Desafio', 'E-mail', 'Pontos no formulário', 'Máximo', 'Nota', 'Enviado em', 'Atualizado em'];
  const atuais = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, cab.length).getValues() : [];
  const outras = atuais.filter(function (r) { return String(r[0]) !== d.id; });
  const agora = new Date();
  const novas = Object.keys(notas).sort().map(function (e) {
    const n = notas[e];
    return [d.id, e, n.pontos, n.max, n.nota, n.quando, agora];
  });
  const todas = outras.concat(novas);
  sh.clearContents();
  sh.getRange(1, 1, 1, cab.length).setValues([cab]).setFontWeight('bold');
  if (todas.length) sh.getRange(2, 1, todas.length, cab.length).setValues(todas);
}

function publicarGabarito_(d, cfg) {
  const props = PropertiesService.getDocumentProperties();
  const chave = 'gabarito_' + d.id;
  if (props.getProperty(chave)) return; // já publicado
  const qs = lerQuestoes_(d.id);
  const linhas = ['Gabarito comentado — ' + d.titulo, ''];
  qs.forEach(function (q, i) {
    linhas.push('Questão ' + (i + 1) + (q.area ? ' (' + q.area + ')' : '') + ': alternativa ' + q.correta);
    if (q.comentario) linhas.push(q.comentario);
    linhas.push('');
  });
  pares_(d.atividades).forEach(function (p) {
    const rec = { title: 'Gabarito — ' + d.titulo, description: linhas.join('\n'), state: 'PUBLISHED' };
    const topicId = obterTopico_(p.courseId, cfg.topico);
    if (topicId) rec.topicId = topicId;
    Classroom.Courses.CourseWorkMaterials.create(rec, p.courseId);
  });
  props.setProperty(chave, new Date().toISOString());
}

// ---------------------------------------------------------------------
// Leitura da planilha
// ---------------------------------------------------------------------

function lerConfig_() {
  const vals = aba_(ABAS.CONFIG).getDataRange().getValues();
  const m = {};
  vals.forEach(function (r) {
    const k = semAcento_(r[0]).replace(/\s+/g, '_');
    if (k) m[k] = r[1];
  });
  const modo = semAcento_(m.NOTAS_NO_CLASSROOM || 'RASCUNHO');
  const resp = semAcento_(m.RESPONDENTES || 'DOMINIO');
  return {
    turmas: String(m.ID_TURMAS || '').split(/[,;\s]+/).map(function (s) { return s.trim(); }).filter(Boolean),
    topico: String(m.TOPICO_CLASSROOM || 'Desafios da Semana').trim(),
    respondentes: resp.indexOf('QUALQUER') === 0 ? 'QUALQUER' : (resp.indexOf('ALUNO') === 0 ? 'ALUNOS' : 'DOMINIO'),
    dominio: String(m.DOMINIO_ALUNOS || '').trim().replace(/^@/, ''),
    pastaId: extrairIdDrive_(m.PASTA_DRIVE_ID),
    modeloId: extrairIdDrive_(m.FORM_MODELO_ID),
    embaralhar: simNao_(m.EMBARALHAR_QUESTOES, false),
    umaResposta: simNao_(m.UMA_RESPOSTA_POR_ALUNO, true),
    fecharNoPrazo: simNao_(m.FECHAR_NO_PRAZO, true),
    modoNotas: modo.indexOf('ATRIB') === 0 ? 'ATRIBUIDA' : (modo.indexOf('N') === 0 ? 'NAO' : 'RASCUNHO'),
    publicarGabarito: simNao_(m.PUBLICAR_GABARITO, true),
    avisarPorEmail: simNao_(m.AVISAR_ERROS_POR_EMAIL, true),
    textoExtra: String(m.TEXTO_EXTRA_NA_ATIVIDADE || '').trim(),
  };
}

function lerDesafios_() {
  const sh = aba_(ABAS.DESAFIOS);
  const n = sh.getLastRow() - 1;
  if (n < 1) return [];
  const mapa = mapaCabecalho_(sh);
  const vals = sh.getRange(2, 1, n, sh.getLastColumn()).getValues();
  const tz = ss_().getSpreadsheetTimeZone();
  return vals.map(function (r, k) {
    const g = leitor_(mapa, r);
    return {
      linha: k + 2,
      id: String(g(CD.ID)).trim(),
      titulo: String(g(CD.TITULO)).trim(),
      temas: String(g(CD.TEMAS)).trim(),
      aulas: String(g(CD.AULAS)).trim(),
      publicar: lerDataHora_(g(CD.PUBLICAR), tz),
      prazo: lerDataHora_(g(CD.PRAZO), tz),
      pontos: Number(g(CD.PONTOS)) || 10,
      status: semAcento_(g(CD.STATUS)) || STATUS.RASCUNHO,
      formId: String(g(CD.FORM_ID)).trim(),
      atividades: String(g(CD.ATIVIDADES)).trim(),
    };
  }).filter(function (d) { return d.id; });
}

function lerQuestoes_(idDesafio) {
  const sh = aba_(ABAS.QUESTOES);
  const n = sh.getLastRow() - 1;
  if (n < 1) return [];
  const mapa = mapaCabecalho_(sh);
  const vals = sh.getRange(2, 1, n, sh.getLastColumn()).getValues();
  const alvo = semAcento_(idDesafio);
  const qs = [];
  vals.forEach(function (r, k) {
    const g = leitor_(mapa, r);
    if (semAcento_(g(CQ.DESAFIO)) !== alvo) return;
    const alternativas = LETRAS
      .map(function (l) { return { letra: l, texto: String(g(l)).trim() }; })
      .filter(function (a) { return a.texto; });
    qs.push({
      linha: k + 2,
      num: Number(g(CQ.NUM)) || qs.length + 1,
      area: String(g(CQ.AREA)).trim(),
      enunciado: String(g(CQ.ENUNCIADO)).trim(),
      alternativas: alternativas,
      correta: semAcento_(g(CQ.CORRETA)).charAt(0),
      comentario: String(g(CQ.COMENTARIO)).trim(),
      pontos: g(CQ.PONTOS) === '' ? 1 : Number(g(CQ.PONTOS)),
      imagem: String(g(CQ.IMAGEM)).trim(),
    });
  });
  return qs.sort(function (a, b) { return a.num - b.num; });
}

function validar_(d, qs, op) {
  const erros = [];
  if (!d.titulo) erros.push('sem título');
  if (!d.publicar) erros.push('"Publicar em" inválido (use dd/mm/aaaa hh:mm)');
  if (!d.prazo) erros.push('"Prazo" inválido (use dd/mm/aaaa hh:mm)');
  if (d.publicar && d.prazo && d.prazo <= d.publicar) erros.push('o prazo precisa ser depois da publicação');
  if (!op.previa && d.prazo && d.prazo <= new Date()) erros.push('o prazo já passou');
  if (!qs.length) erros.push('nenhuma questão com Desafio = "' + d.id + '" na aba Questoes');
  qs.forEach(function (q) {
    const ref = 'questão ' + q.num + ' (linha ' + q.linha + ')';
    if (!q.enunciado) erros.push(ref + ': sem enunciado');
    if (q.alternativas.length < 2) erros.push(ref + ': precisa de pelo menos 2 alternativas');
    if (!q.alternativas.some(function (a) { return a.letra === q.correta; })) {
      erros.push(ref + ': "Correta" precisa ser a letra de uma alternativa preenchida');
    }
    if (isNaN(q.pontos) || q.pontos < 0) erros.push(ref + ': pontos inválidos');
  });
  return erros;
}

function desafioSelecionado_() {
  const sh = SpreadsheetApp.getActiveSheet();
  if (sh.getName() !== ABAS.DESAFIOS) throw new Error('Vá para a aba "Desafios" e clique em uma célula da linha do desafio.');
  const linha = sh.getActiveRange().getRow();
  const d = lerDesafios_().filter(function (x) { return x.linha === linha; })[0];
  if (!d) throw new Error('Selecione uma linha com desafio (a partir da linha 2).');
  return d;
}

// ---------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------

function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }

function aba_(nome, criar) {
  let sh = ss_().getSheetByName(nome);
  if (!sh && criar) sh = ss_().insertSheet(nome);
  if (!sh) throw new Error('Aba "' + nome + '" não encontrada.');
  return sh;
}

function mapaCabecalho_(sh) {
  const cab = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const m = {};
  cab.forEach(function (c, i) {
    const k = semAcento_(c);
    if (k && m[k] === undefined) m[k] = i;
  });
  return m;
}

/** Devolve uma função g(nomeDaColuna) que lê o valor dessa coluna na linha r. */
function leitor_(mapa, r) {
  return function (nome) {
    const i = mapa[semAcento_(nome)];
    return i === undefined ? '' : r[i];
  };
}

function escrever_(d, campos) {
  const sh = aba_(ABAS.DESAFIOS);
  const mapa = mapaCabecalho_(sh);
  Object.keys(campos).forEach(function (nome) {
    const i = mapa[semAcento_(nome)];
    if (i === undefined) return;
    const cel = sh.getRange(d.linha, i + 1);
    const v = campos[nome];
    // IDs numéricos (ex.: "6152634:7123") ficam como texto para o Sheets não converter
    if (typeof v === 'string' && /^[\d:;]+$/.test(v)) cel.setNumberFormat('@');
    cel.setValue(v);
  });
  SpreadsheetApp.flush();
}

function campo_(nome, valor) { const o = {}; o[nome] = valor; return o; }

function marcarErro_(d, e, cfg, silencioso) {
  const c = {};
  c[CD.STATUS] = STATUS.ERRO;
  c[CD.OBS] = 'ERRO em ' + fmt_(new Date()) + ': ' + e.message;
  try { escrever_(d, c); } catch (x) { console.log(x); }
  registrar_('erro', d.id, e.message);
  if (silencioso && cfg && cfg.avisarPorEmail) {
    avisarPorEmail_('Erro no ' + d.id, 'O desafio ' + d.id + ' (' + d.titulo + ') ficou com status ERRO:\n\n' + e.message +
      '\n\nCorrija na planilha e mude o Status de volta para PRONTO (ou para PUBLICADO, se o erro foi no encerramento).');
  }
}

function lerDataHora_(v, tz) {
  if (v instanceof Date && !isNaN(v.getTime())) return v;
  const s = String(v == null ? '' : v).trim();
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+(\d{1,2})[:h](\d{2}))?/);
  if (!m) return null;
  const ano = m[3].length === 2 ? '20' + m[3] : m[3];
  return Utilities.parseDate(ano + '-' + pad_(m[2]) + '-' + pad_(m[1]) + ' ' + pad_(m[4] || '0') + ':' + (m[5] || '00'),
    tz, 'yyyy-MM-dd HH:mm');
}

function fmt_(d) {
  const tz = ss_().getSpreadsheetTimeZone();
  const dia = DIAS_SEMANA[Number(Utilities.formatDate(d, tz, 'u'))] || '';
  return dia + ', ' + Utilities.formatDate(d, tz, "dd/MM 'às' HH:mm");
}

function pad_(n) { return ('0' + n).slice(-2); }

function semAcento_(s) {
  return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toUpperCase();
}

function simNao_(v, padrao) {
  const s = semAcento_(v);
  if (!s) return padrao;
  return s.charAt(0) === 'S' || s === 'TRUE' || s === 'VERDADEIRO';
}

function extrairIdDrive_(v) {
  const s = String(v == null ? '' : v).trim();
  if (!s) return '';
  let m = s.match(/\/d\/(?:e\/)?([\w-]{20,})/) || s.match(/[?&]id=([\w-]{20,})/);
  if (m) return m[1];
  m = s.match(/^([\w-]{20,})$/);
  return m ? m[1] : '';
}

function pares_(texto) {
  return String(texto || '').split(';').map(function (s) { return s.trim(); }).filter(Boolean).map(function (s) {
    const p = s.split(':');
    return { courseId: p[0], cwId: p[1] };
  });
}

function listarTodas_(chamada, campo) {
  const itens = [];
  let token = '';
  do {
    const op = { pageSize: 100 };
    if (token) op.pageToken = token;
    const r = chamada(op) || {};
    (r[campo] || []).forEach(function (x) { itens.push(x); });
    token = r.nextPageToken || '';
  } while (token);
  return itens;
}

function tentar_(fn, alternativa) {
  try { fn(); }
  catch (e) {
    if (alternativa) { try { alternativa(); } catch (e2) { console.log(e2); } }
    else console.log(e);
  }
}

function lixeira_(id) {
  tentar_(function () { DriveApp.getFileById(id).setTrashed(true); });
}

function descartarPrevia_(idDesafio) {
  const props = PropertiesService.getDocumentProperties();
  const chave = 'previa_' + idDesafio;
  const id = props.getProperty(chave);
  if (id) { lixeira_(id); props.deleteProperty(chave); }
}

function descreverRespondentes_(cfg) {
  if (cfg.respondentes === 'QUALQUER') return 'qualquer pessoa com o link';
  if (cfg.respondentes === 'ALUNOS') return 'somente os alunos das turmas configuradas';
  return cfg.dominio ? 'qualquer conta @' + cfg.dominio + ' com o link' : 'DOMINIO_ALUNOS vazio (preencha na aba Config)';
}

function gatilhoAtivo_() {
  return ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'rotinaAutomatica'; });
}

function removerGatilhos_() {
  let n = 0;
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'rotinaAutomatica') { ScriptApp.deleteTrigger(t); n++; }
  });
  return n;
}

function comTrava_(fn) {
  const trava = LockService.getScriptLock();
  if (!trava.tryLock(20000)) { avisar_('Outra execução está em andamento. Tente de novo em instantes.'); return; }
  try { fn(); }
  catch (e) { registrar_('erro', '', e.message); avisar_('Não deu certo:\n\n' + e.message); }
  finally { trava.releaseLock(); }
}

function resumo_(titulo, r) {
  if (!r || (!r.ok.length && !r.erro.length)) return '';
  let s = titulo + ': ' + r.ok.length + ' ok';
  if (r.ok.length) s += ' (' + r.ok.join(', ') + ')';
  if (r.erro.length) s += '\nCom erro:\n• ' + r.erro.join('\n• ');
  return s;
}

function registrar_(acao, id, detalhe) {
  try {
    const sh = aba_(ABAS.LOG, true);
    if (sh.getLastRow() === 0) sh.appendRow(['Quando', 'Ação', 'Desafio', 'Detalhe']);
    sh.appendRow([new Date(), acao, id || '', detalhe || '']);
  } catch (e) { console.log(e); }
}

function avisar_(msg) {
  try { SpreadsheetApp.getUi().alert(msg); }
  catch (e) { console.log(msg); }
}

function avisarPorEmail_(assunto, corpo) {
  try {
    MailApp.sendEmail(Session.getEffectiveUser().getEmail(), '[Desafios ENADE] ' + assunto,
      corpo + '\n\nPlanilha: ' + ss_().getUrl());
  } catch (e) { console.log(e); }
}

function escapar_(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function mostrarTexto_(titulo, linhas) {
  const html = '<div style="font:13px/1.5 Arial,sans-serif;white-space:pre-wrap">' +
    linhas.map(escapar_).join('\n') + '</div>';
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(720).setHeight(520), titulo);
}

function mostrarLinks_(titulo, links, rodape) {
  const html = '<div style="font:14px/1.6 Arial,sans-serif">' +
    links.map(function (l) {
      return '<p><a href="' + escapar_(l[1]) + '" target="_blank">' + escapar_(l[0]) + '</a></p>';
    }).join('') +
    (rodape ? '<p style="color:#555;font-size:12px">' + rodape + '</p>' : '') + '</div>';
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(460).setHeight(240), titulo);
}
