# -*- coding: utf-8 -*-
"""Calendário dos 16 desafios (2 por semana: seg e qua às 12:30, abertos até o próximo)."""
from datetime import datetime

AR = [
    "As asserções I e II são proposições verdadeiras, e a II é uma justificativa correta da I.",
    "As asserções I e II são proposições verdadeiras, mas a II não é uma justificativa correta da I.",
    "A asserção I é uma proposição verdadeira, e a II é uma proposição falsa.",
    "A asserção I é uma proposição falsa, e a II é uma proposição verdadeira.",
    "As asserções I e II são proposições falsas.",
]

def ar(intro, i, ii):
    return f"{intro}\n\nI. {i}\n\nPORQUE\n\nII. {ii}\n\nA respeito dessas asserções, assinale a opção correta."

def dt(d, m, h=12, mi=30):
    return datetime(2026, m, d, h, mi)

# (id, título, temas, aulas cobertas, publicar, prazo)
DESAFIOS = [
    ("D01", "Desafio 1 · Análise de Algoritmos", "Análise de Algoritmos",
     "Aula 18 (seg 05/10): Tópicos em Análise de Algoritmo", dt(5, 10), dt(7, 10)),
    ("D02", "Desafio 2 · Modelagem e Projeto de BD (parte 1)", "Modelagem e Projeto de Banco de Dados",
     "Aula 19 (qua 07/10): Tópicos em Modelagem e Projeto de BD", dt(7, 10), dt(12, 10)),
    ("D03", "Desafio 3 · Revisão: Segurança da Informação", "Segurança da Informação (revisão)",
     "Revisão da aula 16 (seg 28/09): Tópicos em Segurança · 12/10 é feriado, sem aula", dt(12, 10), dt(14, 10)),
    ("D04", "Desafio 4 · Análise e Visualização de Dados", "Análise e Visualização de Dados",
     "Aula 20 (qua 14/10): Tópicos em Análise e Visualização de Dados", dt(14, 10), dt(19, 10)),
    ("D05", "Desafio 5 · Revisão: Redes de Computadores", "Redes de Computadores (revisão)",
     "Revisão das aulas 8 (26/08) e 11 (09/09): Infraestrutura de Comunicação · 19/10 é dia do Simuladinho 3", dt(19, 10), dt(21, 10)),
    ("D06", "Desafio 6 · Sistemas Operacionais", "Sistemas Operacionais",
     "Aula 22 (qua 21/10): Tópicos em SO", dt(21, 10), dt(26, 10)),
    ("D07", "Desafio 7 · Computação Concorrente, Paralela e Distribuída", "Computação Concorrente, Paralela e Distribuída",
     "Aula 23 (seg 26/10): Fundamentos de Computação Concorrente, Paralela e Distribuída", dt(26, 10), dt(28, 10)),
    ("D08", "Desafio 8 · Modelagem e Projeto de BD (parte 2)", "Normalização, SQL e transações",
     "Aula 24 (qua 28/10): Tópicos em Modelagem e Projeto de BD", dt(28, 10), dt(2, 11)),
    ("D09", "Desafio 9 · Revisão: Engenharia de Software", "Requisitos, Projeto de Software e Validação (revisão)",
     "Revisão da aula 12 (14/09): Requisitos, Projeto de Software e Validação · 02/11 é feriado, sem aula", dt(2, 11), dt(4, 11)),
    ("D10", "Desafio 10 · Teoria dos Grafos", "Teoria dos Grafos",
     "Aula 25 (qua 04/11): Tópicos em Teoria dos Grafos", dt(4, 11), dt(9, 11)),
    ("D11", "Desafio 11 · Revisão: Lógica e Teoria da Computação", "Lógica Matemática e Teoria da Computação (revisão)",
     "Revisão das aulas 4 (12/08) e 15 (23/09) · 09/11 é dia do Simuladinho 4", dt(9, 11), dt(11, 11)),
    ("D12", "Desafio 12 · Ética, Direito e Sociedade", "Ética, Computação e Sociedade (LGPD, vieses, licenças)",
     "Aula 27 (qua 11/11): Tópicos em Ética, Direito e Sociedade", dt(11, 11), dt(16, 11)),
    ("D13", "Desafio 13 · Atualidades e Formação Geral", "Atualidades e Formação Geral",
     "Aula 28 (seg 16/11): Tópicos em Atualidades", dt(16, 11), dt(18, 11)),
    ("D14", "Desafio 14 · Revisão: Estruturas de Dados e Orientação a Objetos", "Algoritmos e Estruturas de Dados; Orientação a Objetos (revisão)",
     "Revisão das aulas 5 (17/08) e 7 (24/08) · 18/11 é dia do Simuladão 2", dt(18, 11), dt(23, 11)),
    ("D15", "Desafio 15 · Revisão: IHC e Estatística", "Interação Humano-Computador; Estatística e Probabilidade (revisão)",
     "Revisão das aulas 6 (19/08) e 10 (02/09) · 23/11: orientações gerais para a prova", dt(23, 11), dt(25, 11)),
    ("D16", "Desafio 16 · Reta final para o ENADE", "Revisão mista: sistemas digitais, arquitetura, IA, compiladores e computação gráfica",
     "Temas da Portaria do ENADE de Computação que não tiveram aula própria · prova em 29/11", dt(25, 11), dt(28, 11)),
]
