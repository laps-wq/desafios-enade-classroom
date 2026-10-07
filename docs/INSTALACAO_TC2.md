# Desafios Semanais ENADE · TC2 e TC3

Dois desafios por semana no Google Classroom, publicados sozinhos às **12:30 de segunda e de quarta**. Cada um tem 5 questões no estilo ENADE (correção automática no Google Forms) e fica aberto até o próximo sair. No prazo, o script fecha o formulário, lança as notas no Classroom como rascunho e publica o gabarito comentado.

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `Desafios_ENADE_TC2.xlsx` | A planilha de controle: 16 desafios, 80 questões com gabarito comentado, configurações. **Não fica no repositório público** (tem gabarito): é gerada com o banco privado (`gerador/questoes.json`) ou distribuída diretamente pela professora. Para começar do zero, use `kit-professores/Planilha_Modelo_Desafios.xlsx`. |
| `Codigo.gs` | O script (Google Apps Script) que publica tudo |
| `appsscript.json` | O manifesto: liga a API do Classroom e define o fuso e as permissões |

## Instalação (uma vez só, uns 10 minutos)

Use a conta **@cesar.school** que é professora da turma no Classroom.

1. No Google Drive: **Novo → Upload de arquivo** → `Desafios_ENADE_TC2.xlsx`. Abra o arquivo e use **Arquivo → Salvar como Planilhas Google**. Daqui em diante, trabalhe só na versão Google.
2. Na planilha Google: **Extensões → Apps Script**.
3. No editor do Apps Script, apague o conteúdo de `Código.gs` e cole todo o conteúdo de `Codigo.gs`.
4. Clique na engrenagem (**Configurações do projeto**) e marque **"Mostrar arquivo de manifesto appsscript.json no editor"**. Volte ao editor, abra `appsscript.json`, apague tudo e cole o conteúdo do arquivo `appsscript.json`. Salve com **Ctrl+S**.
5. Volte à planilha e recarregue a página. Aparece o menu **Desafios ENADE**.
6. Menu → **1) Verificar configuração**. O Google pede autorização: escolha sua conta e permita. Se aparecer o aviso de "app não verificado", clique em **Avançado → Acessar** (o app é o seu próprio script).
7. Menu → **2) Listar minhas turmas do Classroom**. Na aba **Turmas**, copie os IDs das turmas TC2 e TC3 e cole na aba **Config**, linha `ID_TURMAS`, separados por vírgula.
8. Confira `DOMINIO_ALUNOS` na aba **Config** (vem como `cesar.school`). É o domínio do e-mail dos alunos.
9. Rode **1) Verificar configuração** de novo: a turma deve aparecer como "Turma OK" e cada desafio com "ok".

## Antes de ligar: teste e revise

1. Na aba **Desafios**, clique na linha do D01 e rode **3) Pré-visualizar o desafio da linha selecionada**. Nada é postado no Classroom.
2. Abra **Ver como aluno**, responda e envie. Se puder, peça a um aluno ou monitor para abrir o mesmo link e confirmar que consegue responder.
3. Revise as questões na aba **Questoes**. Pode editar tudo: enunciado, alternativas, letra correta, comentário e pontos.
4. Para aprovar um desafio, mude o **Status** dele de `RASCUNHO` para `PRONTO`. Dá para marcar vários de uma vez.
5. Menu → **Ligar piloto automático**.

A partir daí, a cada 15 minutos o script agenda no Classroom os desafios `PRONTO` e encerra os que venceram. As atividades agendadas aparecem no Classroom como "Programadas" e são publicadas pelo próprio Classroom na hora certa, mesmo com o computador desligado.

> **Atenção ao D01:** ele está marcado para **segunda, 05/10, às 12:30**. Se não der tempo de instalar antes, mude a data na planilha ou deixe como está: um desafio marcado como `PRONTO` depois do horário de publicação sai na hora.

## O que significa cada Status

| Status | O que está acontecendo |
|---|---|
| `RASCUNHO` | Em revisão. O script ignora. |
| `PRONTO` | Na próxima rodada, o script cria o formulário e agenda a atividade. |
| `AGENDADO` | A atividade já está no Classroom, programada para a data de "Publicar em". |
| `PUBLICADO` | Visível para os alunos e aceitando respostas até o "Prazo". |
| `ENCERRADO` | Formulário fechado, notas lançadas como rascunho, gabarito publicado. |
| `ERRO` | A coluna **Mensagens do robô** explica o problema. Corrija e volte o Status para `PRONTO` (ou para `PUBLICADO`, se o erro foi no encerramento). Você também recebe um e-mail. |

## Calendário

| ID | Publica (12:30) | Prazo (12:30) | Tema |
|---|---|---|---|
| D01 | seg 05/10 | qua 07/10 | Análise de Algoritmos |
| D02 | qua 07/10 | seg 12/10 | Modelagem e Projeto de BD (parte 1) |
| D03 | seg 12/10 (feriado) | qua 14/10 | Revisão: Segurança da Informação |
| D04 | qua 14/10 | seg 19/10 | Análise e Visualização de Dados |
| D05 | seg 19/10 (Simuladinho 3) | qua 21/10 | Revisão: Redes de Computadores |
| D06 | qua 21/10 | seg 26/10 | Sistemas Operacionais |
| D07 | seg 26/10 | qua 28/10 | Computação Concorrente, Paralela e Distribuída |
| D08 | qua 28/10 | seg 02/11 | Modelagem e Projeto de BD (parte 2) |
| D09 | seg 02/11 (feriado) | qua 04/11 | Revisão: Engenharia de Software |
| D10 | qua 04/11 | seg 09/11 | Teoria dos Grafos |
| D11 | seg 09/11 (Simuladinho 4) | qua 11/11 | Revisão: Lógica e Teoria da Computação |
| D12 | qua 11/11 | seg 16/11 | Ética, Direito e Sociedade |
| D13 | seg 16/11 | qua 18/11 | Atualidades e Formação Geral |
| D14 | qua 18/11 (Simuladão 2) | seg 23/11 | Revisão: Estruturas de Dados e Orientação a Objetos |
| D15 | seg 23/11 | qua 25/11 | Revisão: IHC e Estatística |
| D16 | qua 25/11 | sáb 28/11 | Reta final: sistemas digitais, arquitetura, IA, compiladores, computação gráfica |

Nos dias sem aula de conteúdo (feriados, simuladinhos, simuladão), o desafio revisa um tema do módulo 1. O D16 cobre temas da Portaria do ENADE de Computação que não tiveram aula própria. Para mudar qualquer data, edite "Publicar em" e "Prazo" (formato `dd/mm/aaaa hh:mm`) antes de marcar `PRONTO`.

## No dia a dia

- **Notas:** entram no Classroom como rascunho. Abra a atividade, confira e clique em **Devolver** para os alunos verem. A aba **Notas** guarda tudo (pontos, nota, horário de envio). Para lançar direto como nota atribuída, troque `NOTAS_NO_CLASSROOM` para `ATRIBUIDA`.
- **Errou uma questão num desafio que ainda não saiu (AGENDADO):** corrija na aba Questoes, selecione a linha do desafio e use **Refazer o desafio selecionado**.
- **Errou uma questão num desafio já publicado:** edite direto no formulário pelo **Link de edição**. As respostas já enviadas são mantidas.
- **Novo desafio:** acrescente uma linha em Desafios (ID novo, ex. `D17`) e as questões em Questoes com o mesmo ID na coluna Desafio. Pode ter mais ou menos de 5 questões e de 2 a 5 alternativas.
- **Imagem numa questão:** cole o link de um arquivo do seu Drive na coluna **Imagem**. Ela aparece logo antes do enunciado.

## Configurações (aba Config)

| Chave | Padrão | Observação |
|---|---|---|
| `ID_TURMAS` | (vazio) | Obrigatório. Várias turmas: separe por vírgula. |
| `DOMINIO_ALUNOS` | `cesar.school` | Só contas desse domínio abrem o formulário. |
| `RESPONDENTES` | `DOMINIO` | `DOMINIO`, `ALUNOS` (só quem está na turma) ou `QUALQUER`. |
| `TOPICO_CLASSROOM` | Desafios da Semana | Tópico do Classroom onde ficam desafios e gabaritos. |
| `NOTAS_NO_CLASSROOM` | `RASCUNHO` | `RASCUNHO`, `ATRIBUIDA` ou `NAO`. |
| `PUBLICAR_GABARITO` | `SIM` | Gabarito comentado publicado logo após o prazo. |
| `FECHAR_NO_PRAZO` | `SIM` | Fecha o formulário até 15 min depois do prazo. |
| `UMA_RESPOSTA_POR_ALUNO` | `SIM` | |
| `EMBARALHAR_QUESTOES` | `NÃO` | |
| `AVISAR_ERROS_POR_EMAIL` | `SIM` | E-mail quando o piloto automático encontra um erro. |
| `PASTA_DRIVE_ID` | (vazio) | Pasta do Drive para guardar os formulários. |
| `FORM_MODELO_ID` | (vazio) | Veja abaixo. |

**Esconder as respostas até o prazo.** Por padrão, o Google Forms mostra a nota e as respostas certas assim que o aluno envia, e elas podem circular na turma antes do prazo. Para evitar isso: crie um formulário vazio, ative **Configurações → Testes → Tornar este formulário um teste**, desmarque **Respostas corretas** (ou escolha liberar a nota manualmente) e cole o link dele em `FORM_MODELO_ID`. Todo desafio passa a copiar essas configurações, e o gabarito chega pelo post automático depois do prazo.

## Problemas comuns

- **"Classroom is not defined":** o `appsscript.json` não foi colado (passo 4). Outra opção: no editor, **Serviços +** → **Google Classroom API** → Adicionar; faça o mesmo com **Drive API**.
- **"Requested entity was not found" ao verificar a turma:** o ID em `ID_TURMAS` está errado ou a turma não é sua. Use o menu **Listar minhas turmas**.
- **"The caller does not have permission" ou "ProjectPermissionDenied":** o administrador do Google Workspace da CESAR pode ter bloqueado o acesso de scripts ao Classroom. Peça à TI para liberar o Apps Script / a API do Classroom para sua conta.
- **Aluno não consegue abrir o formulário:** confira `DOMINIO_ALUNOS`. Se os alunos usam outro domínio, troque `RESPONDENTES` para `ALUNOS` e use **Refazer** nos desafios que ainda não saíram.
- **Horários deslocados em 3 horas:** rode **1) Verificar configuração**, que ajusta o fuso da planilha para São Paulo.
- **Algo deu errado e não sei o quê:** a aba **Log** registra cada ação do script.

## Limites a saber

- O Classroom só importa a nota do Forms automaticamente quando o formulário é anexado pela interface. Como aqui é o script quem anexa, ele mesmo calcula e lança as notas no encerramento.
- O aluno precisa responder com a conta institucional; é pelo e-mail que a nota é ligada ao aluno no Classroom.
- O piloto automático roda na sua conta. Se você desligar o piloto, as atividades já agendadas continuam saindo, mas os formulários não fecham sozinhos e as notas não são lançadas: use o menu **Encerrar desafios vencidos e lançar notas**.
