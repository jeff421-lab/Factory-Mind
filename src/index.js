// funções puras de pontuação
const ler = texto => parseInt(texto, 10) || 0
const proximo = atual => atual + 1
const formatar = n => String(n)

// pega elementos: numero e botão
const scoreEl = document.getElementById('score')
const btn = document.getElementById('score-btn')

// clique soma +1 e mostra
btn.addEventListener('click', () => {
	const atual = ler(scoreEl.textContent)
	const valor = proximo(atual)
	scoreEl.textContent = formatar(valor)
})