// funções puras de pontuação
const ler = texto => parseInt(texto, 10) || 0
const proximo = atual => atual + 1
const formatar = n => String(n)
const calcularNovaPontuacao = (pontosAtuais, nivelUpgrade) => pontosAtuais + 1 + nivelUpgrade

// pega elementos: numero, botões
const scoreEl = document.getElementById('score')
const btn = document.getElementById('score-btn')
const pontosQEl = document.getElementById('PontosQ')
const upgradeBtns = [].slice.call(document.querySelectorAll('.upgrade-btn'))

// leitura derivada
const totalUpgrades = () => ler(pontosQEl.textContent)

// aplica upgrade simples (soma incremento)
const aplicarUpgrade = inc => {
	const atual = totalUpgrades()
	const valor = atual + inc
	pontosQEl.textContent = formatar(valor)
}

// clique soma +1 + upgrades atuais
const ganharPonto = () => {
	const atual = ler(scoreEl.textContent)
	const bonus = totalUpgrades()
	const valor = calcularNovaPontuacao(atual, bonus)
	scoreEl.textContent = formatar(valor)
}

// util recursivo simples (evita forEach/map)
const each = (xs, fn) => xs.length ? (fn(xs[0]), each(xs.slice(1), fn)) : 0

// liga upgrades
each(upgradeBtns, b => {
	const inc = ler(b.dataset.inc)
	b.addEventListener('click', () => aplicarUpgrade(inc))
})

// liga ponto
btn && btn.addEventListener('click', ganharPonto)