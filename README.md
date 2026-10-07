# Desafios ENADE automáticos no Google Classroom

Desafios de revisão para o ENADE publicados, corrigidos e lançados no Google Classroom sem trabalho manual semanal.
Criado para as turmas TC2 e TC3 de Ciência da Computação da CESAR School (2026.2), mas funciona com qualquer turma do Classroom.

> **O banco de questões não está neste repositório.** As questões usadas nas turmas têm gabarito e ficam com a professora.
> Aqui estão o script, a planilha-modelo com um desafio de exemplo, o gerador das planilhas e os testes.

## Como funciona

1. **Planilha Google:** cada desafio é uma linha na aba `Desafios` e cada questão uma linha na aba `Questoes`.
2. **Google Forms:** para cada desafio marcado como `PRONTO`, o script cria um formulário em modo teste, com correção automática e um comentário por questão.
3. **Classroom:** a atividade é criada já agendada, com prazo, pontos e o formulário anexado. O próprio Classroom publica no horário.
4. **No prazo:** o script fecha o formulário, lança as notas no Classroom como rascunho e publica o gabarito comentado.

Um gatilho do Apps Script roda a cada 15 minutos (o "piloto automático"). O script fica na planilha e roda na conta de quem instalou; não precisa de servidor.

Status de cada desafio: `RASCUNHO → PRONTO → AGENDADO → PUBLICADO → ENCERRADO` (ou `ERRO`, com o motivo na planilha e aviso por e-mail).

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `apps-script/` | `Codigo.gs` e `appsscript.json` usados na TC2/TC3 |
| `kit-professores/` | Para usar em outra disciplina: versão genérica do script, `Planilha_Modelo_Desafios.xlsx` (com o desafio de exemplo EX01), `Modelo_Envio_Questoes.xlsx` (para professores enviarem questões) e `LEIA-ME.txt` |
| `gerador/` | `calendario.py` (calendário da TC2/TC3), `questoes_exemplo.json` (as questões do EX01) e `gerar_planilhas.py` |
| `testes/` | Testes do script com dublês dos serviços do Google, usando questões fictícias |
| `docs/` | Guia de instalação e uso da TC2/TC3 |

A versão do script em `kit-professores/` é igual à de `apps-script/`, exceto por não ter textos fixos de "estilo ENADE" e "nota de participação" na descrição da atividade; esses textos ficam em `Config > TEXTO_EXTRA_NA_ATIVIDADE`.

## Instalação rápida

1. Suba `kit-professores/Planilha_Modelo_Desafios.xlsx` para o Google Drive e use **Arquivo → Salvar como Planilhas Google**.
2. **Extensões → Apps Script**: cole `Codigo.gs` e, com o manifesto visível nas configurações do projeto, `appsscript.json`.
3. Recarregue a planilha e use o menu **Desafios ENADE**: Verificar configuração → Listar minhas turmas (cole o ID em `Config > ID_TURMAS`) → escreva seus desafios e questões → Pré-visualizar → marcar `PRONTO` → Ligar piloto automático.

Passo a passo completo e solução de problemas: [`kit-professores/LEIA-ME.txt`](kit-professores/LEIA-ME.txt) e [`docs/INSTALACAO_TC2.md`](docs/INSTALACAO_TC2.md).

## Gerar as planilhas

```bash
pip install openpyxl
python3 gerador/gerar_planilhas.py
```

Sem o banco, o gerador atualiza só os arquivos do kit. Com um banco próprio em `gerador/questoes.json` (mesmo formato de `questoes_exemplo.json`, com um desafio por ID do calendário), ele também gera `planilhas/Desafios_ENADE_TC2.xlsx` e `questoes/banco_questoes_TC2.md`. Esses três caminhos estão no `.gitignore`, para que o gabarito nunca seja enviado ao GitHub por engano.

## Testes

```bash
python3 testes/gerar_fixture.py                  # planilha simulada com questões fictícias
node testes/teste.js                              # testa apps-script/Codigo.gs
node testes/teste.js kit-professores/Codigo.gs   # testa a versão do kit
```

São 18 cenários: leitura da configuração e das datas, prévia, agendamento com prazo em UTC, não duplicação, erros de conteúdo, refazer, encerramento com notas e gabarito, piloto automático, formulário-modelo e correção do fuso. Os testes simulam os serviços do Google; o primeiro uso real deve ser validado com a pré-visualização e um aluno de teste.

## Referências

- [Classroom API: courseWork](https://developers.google.com/workspace/classroom/reference/rest/v1/courses.courseWork)
- [Forms API: publicação e respondentes](https://developers.google.com/workspace/forms/api/guides/publish-form)
- [Apps Script: classe Form](https://developers.google.com/apps-script/reference/forms/form)
- Portaria Inep nº 157/2026: diretrizes do ENADE de Ciência da Computação

Autora: Laura Pacífico · CESAR School
