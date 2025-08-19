# Factory Mind / Calouro DCOMP

Jogo incremental (clicker) temático: você é o calouro tentando acumular **Conhecimento** através de cliques, upgrades únicos, construções (geração passiva) e melhorias. O objetivo final: fazer o professor desistir da prova.

> Versão atual de base de código: foco em core loop (clique + upgrades + produção passiva + final). Paradigma funcional aplicado na lógica de evolução de estado; efeitos (DOM / áudio / storage) confinados.

## Sumário
1. Visão Geral
2. Conceitos do Jogo
3. Arquitetura e Paradigma
4. Estrutura de Estado
5. Funções de Evolução (Puras)
6. Ciclo de Renderização e Loop Passivo
7. Persistência / Salvamento
8. Áudio e Efeitos
9. Extensões Planejadas (Roadmap)
10. Guia de Contribuição Rápido
11. FAQ Técnica
12. Licença / Créditos

## 1. Visão Geral
O jogo combina clique ativo (ganho imediato) com progressão passiva (construções) e upgrades únicos que aumentam ganho por clique. Melhorias incrementam produção base das construções. Um item final encerra a macro-meta atual.

## 2. Conceitos do Jogo
| Conceito | Descrição |
|----------|-----------|
| Pontos (Conhecimento) | Recurso principal. |
| Clique | Ação ativa que gera pontos usando fórmula dinâmica. |
| Upgrades Únicos | Itens comprados uma vez que adicionam +1 por clique (ou outras regras futuras). |
| Construções | Geram conhecimento passivo por segundo. Custos escalam exponencialmente. |
| Melhorias de Construção | Aumentam multiplicativamente a produção de cada construção específica. |
| Final | Meta cara que sinaliza “fim” da run atual (possível gatilho para prestígio futuro). |
| Prestígio (planejado) | Reset com bônus permanente. |

## 3. Arquitetura e Paradigma
Estilo “funcional pragmático”: 
- Funções puras para calcular evolução de estado (não acessam DOM). 
- Estado armazenado em objetos imutáveis empilhados (historicamente poderia permitir undo/redo se desejado). 
- Efeitos colaterais (DOM, áudio, localStorage, Date, requestAnimationFrame) isolados em seções claras.

Benefícios:
- Testabilidade: funções de evolução podem ser testadas com objetos simples.
- Previsibilidade: nenhuma função pura altera objetos existentes (retornam novos).
- Evolução incremental: adicionar novo tipo de construção ou upgrade exige só: (1) estender estadoInicial, (2) ajustar função de produção ou clique, (3) render.

## 4. Estrutura de Estado (exemplo simplificado)
```js
{
	versao: 2,
	pontos: Number,
	clicks: Number,
	prestigio: Number,
	upgradesUnicos: { id: { nome, custo, desc, comprado } },
	construcoes: { id: { nome, q, base, custoBase, fator } },
	melhoriasConstrucoes: { id: { nome, nivel, custoBase, fator } },
	final: { nome, custo, comprado },
	ultimoTick: Number (timestamp)
}
```

## 5. Funções de Evolução (Puras)
Principais funções (exemplos):
- `calcularClique(st)` → número de pontos obtidos em um clique.
- `producaoPassivaPorSegundo(st)` → soma ponderada das construções e melhorias.
- `evoluirClique(st)` → retorna novo estado após clique válido.
- `evoluirCompraConstrucao(st, id)` → compra unidade (se recursos suficientes).
- `evoluirUpgradeUnico(st, id)` / `evoluirMelhoriaConstrucao(st, id)` / `evoluirFinal(st)`.
- `evoluirPassivo(st, deltaSec)` → acumula produção passiva no intervalo decorrido.

Todas retornam NOVO objeto (uso de spread). Nenhuma muta o estado recebido.

## 6. Ciclo de Renderização e Loop Passivo
O `loop` via `requestAnimationFrame`:
1. Calcula `dt` (delta em segundos) usando timestamps.
2. Aplica `evoluirPassivo` se `dt > 0`.
3. Render parcial em baixa frequência (probabilidade ou condição) para reduzir custo em dispositivos mais fracos.

Render: Constrói/atualiza botões de cada categoria, recalcula custos escalonados e estado de disabled.

## 7. Persistência / Salvamento
- Chave localStorage: `fm-save`.
- Na carga: valida versão antes de mesclar com `estadoInicial`.
- Futuro: sistema de migrações (ex: `versao: 3` → adaptador de compatibilidade) + export/import manual.

## 8. Áudio e Efeitos
- Sons de clique, compra e música de fundo abstraídos em funções fáceis de trocar.
- Falhas de áudio são capturadas (try/catch) para evitar quebra em navegadores com autoplay bloqueado.

## 9. Extensões Planejadas (Roadmap)
Curto Prazo:
- Barra de progresso para custo do próximo upgrade único.
- Tooltip detalhado (produção passiva projetada, ROI).
- Botão de salvamento manual explícito.

Médio Prazo:
- Sistema de prestígio (reset com multiplicador persistente).
- Estatísticas avançadas (produção média, pico de CPS, histórico de compras).
- Aumento de acessibilidade (navegação por teclado, aria labels refinadas).

Longo Prazo:
- Eventos temporários (boosts de produção).
- Desafios / “modos” (run sem upgrades únicos, run tempo limitado).
- Sistema de achievements persistentes.

## 10. Guia de Contribuição Rápido
1. Criar branch a partir de `features`.
2. Manter novas funções de lógica sem usar DOM.
3. Adicionar testes unitários (quando a pasta de testes for formalizada) para cada nova função pura.
4. Atualizar README se adicionar novos tipos de entidade.
5. Evitar acoplamento de strings mágicas (usar constantes de id quando crescer).

## 11. FAQ Técnica
**Por que usar objetos imutáveis?** Simplifica raciocínio e previne bugs de aliasing.

**Por que custo escalonado exponencial?** Mantém curva de progressão (evita saturação rápida). Fórmula: `base * fator^q` arredondado.

**Por que nem tudo é 100% funcional?** Efeitos (DOM/áudio/storage) precisam ocorrer; objetivo é minimizar sua área e manter núcleo previsível.

**Undo/Redo existe?** A pilha de estados permite extender rapidamente (basta armazenar snapshots); ainda não exposto na UI principal.

## 12. Licença / Créditos
Definir (MIT / Apache / Proprietária). Indicar autores e fontes de assets (imagens / áudio) quando aplicável.

---

## Análise de Escalabilidade do Código Atual

Forças:
- Núcleo funcional bem separado (evolução de estado puramente declarativa).
- Custos escalonados e produção passiva já generalizados (fácil adicionar novos ids).
- Render reconstruindo listas garante consistência (menos risco de estado “zumbi”).
- Fácil estender upgrades únicos (apenas acrescentar objeto em `upgradesUnicos`).

Limitações / Riscos:
- Crescimento de listas aumenta custo de reconstrução completa (possível otimizar com diff incremental). 
- `entries` usa `Object.keys(...).map` (pode ser trocado por um gerador personalizado caso queira remover dependência de map). 
- Falta de sistema formal de migração de versões (risco ao mudar shape do estado salvo). 
- Sem throttle configurável para render (probabilidade fixa pode gerar frames “perdidos” em máquinas lentas). 
- Ausência de testes automatizados deixa lógica vulnerável a regressões ao refatorar.

Escala Prevista:
- Até dezenas de construções/melhorias: OK.
- Centenas de itens: considerar virtualização ou chunked render.
- Grande número de efeitos de som simultâneos: abstrair mixer / debounce de play.

Sugestões Prioritárias:
1. Introduzir módulo `state.js` somente com funções puras (facilita testes). 
2. Adicionar testes (ex.: Jest) para `custoEscalonado`, `producaoPassivaPorSegundo`, `evoluir*`. 
3. Criar `constants.js` para fatores repetidos (chaves, base inicial). 
4. Implementar `migrarSave(saveAntigo)` para futuras versões. 
5. Adicionar métrica de performance simples (tempo médio de render). 
6. Export/Import JSON manual (backup do jogador). 

Estado do Paradigma Funcional: BOM (núcleo), com efeitos devidamente isolados. Para “excelente”, mover construção de botões para uma função pura que gera descritores (dados) e uma fase que materializa no DOM.

---

URL antiga de referência / deploy (histórico):
https://idleufs.netlify.app/
