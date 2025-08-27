// funções puras e helpers
const ler = texto => parseInt(texto, 10) || 0
const formatar = n => String(n)
const clampMin = (n, min) => (n < min ? min : n)
const soma = (a, b) => a + b

// seleção de elementos
const scoreEl = document.getElementById('score')
const btn = document.getElementById('score-btn')
const pontosQEl = document.getElementById('PoderClicker')
const upgradeBtns = [].slice.call(document.querySelectorAll('.upgrade-btn'))
const body = document.body
const oneShotBtn = document.getElementById('upgrade-unico-clique2')

// estado derivado do DOM
const poderClicker = () => ler(pontosQEl.textContent)
const getScore = () => ler(scoreEl.textContent)
const setScore = v => (scoreEl.textContent = formatar(v))
const setPoderClicker = v => (pontosQEl.textContent = formatar(v))
const getBaseClick = () => ler(body.getAttribute('data-base-click') || '1')
const setBaseClick = v => body.setAttribute('data-base-click', String(v))
const creditarRecompensa = v => setScore(getScore() + v)

// custo/inflacao utilities
const getCost = el => ler(el.getAttribute('data-cost') || '0')
const setCost = (el, v) => el.setAttribute('data-cost', String(v))
const inflacionar = custo => Math.ceil(custo * 1.05) // +5% por compra
const formatarRotuloUpgrade = (el) => {
	const inc = ler(el.dataset.inc)
	const custo = getCost(el)
	el.setAttribute('aria-label', `Upgrade +${inc} (Custo: ${custo})`)
	el.innerHTML = `
		<span class="upg-inc">+${inc}</span>
		<span class="upg-cost"><span class="cost-label">Custo</span><span class="cost-value">${custo}</span></span>
	`.trim()
}

// atualiza todos os rótulos de upgrade
const atualizarRotulos = () => upgradeBtns.forEach(formatarRotuloUpgrade)

// inflação global: aplica fator a todos os upgrades para manter mesma razão de preços
const inflacionarGlobal = (fator = 1.05) => {
	upgradeBtns.forEach(b => {
		const atual = getCost(b)
		const novo = Math.ceil(atual * fator)
		if (novo !== atual) setCost(b, novo)
		formatarRotuloUpgrade(b)
	})
}

// pagar e aplicar upgrade
const tentarComprarUpgrade = (el) => {
	const custo = getCost(el)
	const saldo = getScore()
	if (saldo < custo) return false
	setScore(saldo - custo)
	// aplica incremento ao poder do clicker
	const inc = ler(el.dataset.inc)
	setPoderClicker(poderClicker() + inc)
	// aumenta custo para próxima compra: todos os upgrades sobem na mesma razão (+5%)
	inflacionarGlobal(1.05)
	return true
}

// clique soma base + upgrades atuais
const ganharPonto = () => {
	// clique deve valer exatamente o Poder do Clicker
	const valor = getScore() + poderClicker()
	setScore(valor)
}

// liga upgrades com custo
upgradeBtns.forEach(b => {
	formatarRotuloUpgrade(b)
	b.addEventListener('click', () => void tentarComprarUpgrade(b))
})

// inflação de custo com o tempo (a cada 45s aumenta 2%)
const inflacionarPeriodicamente = () => {
	upgradeBtns.forEach(b => {
		const atual = getCost(b)
	const novo = Math.ceil(atual * 1.02) // +2% a cada ciclo
		if (novo !== atual) setCost(b, novo)
		formatarRotuloUpgrade(b)
	})
}
setInterval(inflacionarPeriodicamente, 45000) // a cada 45s

// upgrade único: efeito misterioso (vida extra no Genius por run)
const formatarRotuloOneShot = (el) => {
	const custo = getCost(el)
	el.setAttribute('aria-label', `Upgrade misterioso único (Custo: ${custo})`)
	el.innerHTML = `
		<span class="upg-title">Upgrade misterioso</span>
		<span class="badge">Único</span>
		<span class="upg-cost"><span class="cost-label">Custo</span><span class="cost-value">${custo}</span></span>
	`.trim()
}

if (oneShotBtn) {
	formatarRotuloOneShot(oneShotBtn)
	oneShotBtn.addEventListener('click', () => {
		if (oneShotBtn.disabled) return
		const custo = getCost(oneShotBtn)
		const saldo = getScore()
		if (saldo < custo) return
		setScore(saldo - custo)
	// compra única: apenas marca como adquirido
		body.setAttribute('data-one-shot', 'comprado')
		oneShotBtn.disabled = true
		oneShotBtn.innerHTML = `
			<span class="upg-title">Upgrade misterioso</span>
			<span class="badge">Adquirido</span>
		`.trim()
		oneShotBtn.setAttribute('aria-disabled', 'true')
	})
}

// removido reset e persistência; upgrade só vale durante a sessão

// liga ponto
btn && btn.addEventListener('click', ganharPonto)

// ========== Jogo Genius (instância única) + vida extra por run ==========
const criarEstadoInicialG = () => [0, [], [], false, true]
const NIVEL = 0, SEQ_COMP = 1, SEQ_JOG = 2, TURNO_JOG = 3, FIM_JOGO = 4
const proximoPasso = seq => {
	const cores = ['green','red','yellow','blue']
	const cor = cores[Math.floor(Math.random() * cores.length)]
	return [...seq, cor]
}
const verificarJogada = (seqComp, seqJog) => {
	const i = seqJog.length - 1
	if (seqJog[i] !== seqComp[i]) return 'incorreta'
	if (seqJog.length === seqComp.length) return 'completa'
	return 'correta'
}
const reducerG = (estado, acao) => {
	const h = {
		INICIAR: () => [0, [], [], false, false],
		TURNO_COMP: ([n, sc, , , fim]) => [n+1, proximoPasso(sc), [], false, fim],
		TURNO_JOG: ([n, sc, sj, , fim]) => [n, sc, sj, true, fim],
		JOGADA: ([n, sc, sj, , fim], {cor}) => {
			const sj2 = [...sj, cor]
			const r = verificarJogada(sc, sj2)
			return r === 'incorreta' ? [n, sc, sj2, false, true]
				: r === 'completa' ? [n, sc, sj2, false, fim]
				: [n, sc, sj2, true, fim]
		}
	}
	return (h[acao.tipo] || (s=>s))(estado, acao)
}

const iniciarGeniusNo = (rootEl) => {
	if (!rootEl) return
	const pads = {
		green: rootEl.querySelector('[data-color="green"]'),
		red: rootEl.querySelector('[data-color="red"]'),
		yellow: rootEl.querySelector('[data-color="yellow"]'),
		blue: rootEl.querySelector('[data-color="blue"]')
	}
	const btnStart = rootEl.querySelector('.start-btn')
	const levelEl = rootEl.querySelector('.level')
	const esperar = ms => new Promise(r => setTimeout(r, ms))
	const piscar = async (cor) => { const el = pads[cor]; el.classList.add('lit'); await esperar(400); el.classList.remove('lit'); await esperar(200) }
	const tocarSeq = seq => seq.reduce((p, cor) => p.then(() => piscar(cor)), Promise.resolve())
	const atualizarUI = (s) => {
		const [nivel, , , turnoJog, fim] = s
		levelEl.textContent = fim && nivel>0 ? `Fim! Nível ${nivel}` : nivel
		btnStart.disabled = !fim
		rootEl.querySelector('.genius-board').style.pointerEvents = turnoJog ? 'auto' : 'none'
	}
	const aguardarClique = () => new Promise(res => {
		const botoes = Object.values(pads)
		const onClick = e => { botoes.forEach(b=>b.removeEventListener('click', onClick)); res(e.target.getAttribute('data-color')) }
		botoes.forEach(b=>b.addEventListener('click', onClick))
	})
	const atualizarVidas = (vidas) => {
		const span = rootEl.querySelector('#genius-lives-count')
		if (!span) return
		span.textContent = String(vidas)
	}
	const loopJog = (estado, vidas) => aguardarClique()
		.then(c => { const s2 = reducerG(estado, {tipo:'JOGADA', cor:c}); atualizarUI(s2); return s2 })
		.then(async s2 => {
			if (!s2[FIM_JOGO]) return s2[TURNO_JOG] ? loopJog(s2, vidas) : loop(s2, vidas)
			// decrementa vidas totais; se ainda houver (v2 > 0), repete a MESMA sequência; senão, fim da run
			const v2 = vidas - 1
			atualizarVidas(v2)
			if (v2 > 0) {
				const sRetry = [s2[NIVEL], s2[SEQ_COMP], [], false, false]
				atualizarUI(sRetry)
				return loop(sRetry, v2)
			}
			// vidas chegou a 0: run terminou -> aplicar recompensa nivel^2 * (poder do clicker)^2 e avisar no navegador
			const nivelFinal = s2[NIVEL]
			const upgrades = poderClicker()
			const recompensa = Math.pow(nivelFinal, 2) * Math.pow(upgrades, 2)
			if (recompensa > 0) creditarRecompensa(recompensa)
			try {
				alert(`Run do Genius finalizada!\nNível: ${nivelFinal}\nPoder do Clicker: ${upgrades}\nRecompensa: ${recompensa}`)
			} catch {}
			return undefined
		})
	const loop = (estado, vidas) => Promise.resolve()
		.then(()=>esperar(600))
		.then(()=>reducerG(estado, {tipo:'TURNO_COMP'}))
		.then(sC => { atualizarUI(sC); return tocarSeq(sC[SEQ_COMP]).then(()=>sC) })
		.then(sC => reducerG(sC, {tipo:'TURNO_JOG'}))
		.then(sJ => { atualizarUI(sJ); return sJ })
		.then(sJ => loopJog(sJ, vidas))
	const setup = () => {
		let s0 = criarEstadoInicialG(); atualizarUI(s0); atualizarVidas(ler(document.getElementById('genius-lives-count')?.textContent || '1'))
		btnStart.addEventListener('click', () => {
			// vidas totais na run: sem upgrade = 1; com upgrade = 2
			const temUpgrade = body.getAttribute('data-one-shot') === 'comprado'
			const vidas0 = temUpgrade ? 2 : 1
			atualizarVidas(vidas0)
			const st = reducerG(criarEstadoInicialG(), {tipo:'INICIAR'})
			loop(st, vidas0)
		})
	}
	setup()
}

// inicializa instância do Genius
iniciarGeniusNo(document.getElementById('genius1'))