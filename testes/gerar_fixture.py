# -*- coding: utf-8 -*-
"""Gera testes/planilha.json, a planilha simulada usada por teste.js.

Usa o calendário real (gerador/calendario.py) e questões FICTÍCIAS, para que os
testes rodem sem o banco de questões (que tem gabarito e fica fora do repositório).
Uso (na raiz do repositório):  python3 testes/gerar_fixture.py
"""
import json, os, sys
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RAIZ, "gerador"))
from calendario import DESAFIOS

def data(d):
    return {"__date__": d.isoformat() + "-03:00"}

desafios = [["ID", "Título", "Temas", "Aulas cobertas", "Publicar em", "Prazo", "Pontos", "Status",
             "Mensagens do robô", "Link do formulário", "Link de edição", "Link no Classroom",
             "ID do formulário", "IDs no Classroom"]]
questoes = [["Desafio", "Nº", "Área", "Enunciado", "A", "B", "C", "D", "E", "Correta", "Comentário", "Pontos", "Imagem"]]
for k, (i, titulo, temas, aulas, pub, prazo) in enumerate(DESAFIOS):
    desafios.append([i, titulo, temas, aulas, data(pub), data(prazo), 10, "RASCUNHO", "", "", "", "", "", ""])
    for n in range(1, 6):
        questoes.append([i, n, "Área de teste", f"Enunciado fictício {n} do desafio {i}.",
                         *[f"Alternativa {l} da questão {n}" for l in "ABCDE"],
                         "ABCDE"[(k + n) % 5], f"Comentário fictício da questão {n}.", 2, ""])

config = [["Chave", "Valor", "O que é"]] + [[k, v, ""] for k, v in [
    ("ID_TURMAS", ""), ("DOMINIO_ALUNOS", "cesar.school"), ("RESPONDENTES", "DOMINIO"),
    ("TOPICO_CLASSROOM", "Desafios da Semana"), ("NOTAS_NO_CLASSROOM", "RASCUNHO"),
    ("PUBLICAR_GABARITO", "SIM"), ("FECHAR_NO_PRAZO", "SIM"), ("UMA_RESPOSTA_POR_ALUNO", "SIM"),
    ("EMBARALHAR_QUESTOES", "NÃO"), ("AVISAR_ERROS_POR_EMAIL", "SIM"), ("PASTA_DRIVE_ID", ""),
    ("FORM_MODELO_ID", ""), ("TEXTO_EXTRA_NA_ATIVIDADE", "")]]

planilha = {
    "Como usar": [["Planilha simulada para testes"]],
    "Desafios": desafios,
    "Questoes": questoes,
    "Config": config,
    "Notas": [["Desafio", "E-mail", "Pontos no formulário", "Máximo", "Nota", "Enviado em", "Atualizado em"]],
    "Log": [["Quando", "Ação", "Desafio", "Detalhe"]],
}
json.dump(planilha, open(os.path.join(RAIZ, "testes", "planilha.json"), "w", encoding="utf-8"), ensure_ascii=False)
print("testes/planilha.json gerado:", len(desafios) - 1, "desafios,", len(questoes) - 1, "questões fictícias")
