const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const port = parseInt(process.env.PORT || '3000', 10)
const app = next({ dev })
const handle = app.getRequestHandler()

/** @type {Map<string, Game>} */
const games = new Map()

function generatePin() {
  let pin
  do { pin = String(Math.floor(100000 + Math.random() * 900000)) }
  while (games.has(pin))
  return pin
}

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    await handle(req, res, parse(req.url, true))
  })

  const io = new Server(httpServer, { cors: { origin: '*' } })

  io.on('connection', (socket) => {

    // ── Host creates a game ─────────────────────────────────────────────────
    socket.on('host:create', (questions, callback) => {
      const pin = generatePin()
      games.set(pin, {
        pin, hostSocketId: socket.id,
        players: [], questions,
        currentQuestionIndex: -1,
        phase: 'lobby', answers: [],
        timer: null, questionTimeLeft: 0,
      })
      socket.join(`host-${pin}`)
      socket.join(pin)
      callback({ pin })
    })

    // ── Player joins ────────────────────────────────────────────────────────
    socket.on('player:join', ({ pin, name }, callback) => {
      const game = games.get(pin)
      if (!game) return callback({ error: 'Game not found' })
      if (game.phase !== 'lobby') return callback({ error: 'Game already started' })
      if (game.players.find(p => p.id === socket.id))
        return callback({ ok: true, player: game.players.find(p => p.id === socket.id) })

      const player = { id: socket.id, name, score: 0, lastCorrect: null, lastPoints: 0 }
      game.players.push(player)
      socket.join(pin)
      io.to(pin).emit('game:player-joined', game.players)
      callback({ ok: true, player })
    })

    // ── Host starts game ────────────────────────────────────────────────────
    socket.on('host:start', ({ pin }) => {
      const game = games.get(pin)
      if (!game || game.hostSocketId !== socket.id) return
      game.phase = 'starting'
      io.to(pin).emit('game:started')
      setTimeout(() => sendQuestion(io, game), 2000)
    })

    // ── Player submits answer ───────────────────────────────────────────────
    socket.on('player:answer', ({ pin, answerIndex }) => {
      const game = games.get(pin)
      if (!game || game.phase !== 'question') return
      if (game.answers.find(a => a.playerId === socket.id)) return

      game.answers.push({ playerId: socket.id, answerIndex, timeLeft: game.questionTimeLeft })
      io.to(`host-${pin}`).emit('game:answer-count', {
        count: game.answers.length, total: game.players.length,
      })

      if (game.answers.length >= game.players.length) {
        clearInterval(game.timer)
        revealResults(io, game)
      }
    })

    // ── Host advances to next question ──────────────────────────────────────
    socket.on('host:next', ({ pin }) => {
      const game = games.get(pin)
      if (!game || game.hostSocketId !== socket.id) return
      game.currentQuestionIndex++
      if (game.currentQuestionIndex >= game.questions.length) endGame(io, game)
      else sendQuestion(io, game)
    })

    // ── Cleanup on disconnect ───────────────────────────────────────────────
    socket.on('disconnect', () => {
      for (const [, game] of games) {
        if (game.hostSocketId === socket.id) {
          clearInterval(game.timer)
          io.to(game.pin).emit('game:host-disconnected')
          games.delete(game.pin)
        } else {
          const i = game.players.findIndex(p => p.id === socket.id)
          if (i !== -1) {
            game.players.splice(i, 1)
            if (game.phase === 'lobby')
              io.to(game.pin).emit('game:player-joined', game.players)
          }
        }
      }
    })
  })

  // ── Game logic ─────────────────────────────────────────────────────────────
  function sendQuestion(io, game) {
    if (game.currentQuestionIndex < 0) game.currentQuestionIndex = 0
    const q = game.questions[game.currentQuestionIndex]
    game.phase = 'question'
    game.answers = []
    game.questionTimeLeft = q.timeLimit

    // Full question (with correct) → host only
    io.to(`host-${game.pin}`).emit('game:question', {
      ...q, index: game.currentQuestionIndex, total: game.questions.length,
    })
    // Stripped question (no correct field) → players
    const stripped = { ...q, answers: q.answers.map(a => ({ text: a.text })),
      index: game.currentQuestionIndex, total: game.questions.length }
    // Emit to room then host re-receives stripped, but host ignores it (it already got the full one)
    // Workaround: emit only to player sockets
    const room = io.sockets.adapter.rooms.get(game.pin)
    if (room) {
      for (const sid of room) {
        if (sid !== game.hostSocketId) io.to(sid).emit('game:question', stripped)
      }
    }

    game.timer = setInterval(() => {
      game.questionTimeLeft--
      io.to(game.pin).emit('game:timer', game.questionTimeLeft)
      if (game.questionTimeLeft <= 0) { clearInterval(game.timer); revealResults(io, game) }
    }, 1000)
  }

  function revealResults(io, game) {
    if (game.phase !== 'question') return
    game.phase = 'results'
    clearInterval(game.timer)

    const q = game.questions[game.currentQuestionIndex]
    const correctIndex = q.answers.findIndex(a => a.correct)

    game.players.forEach(p => { p.lastCorrect = false; p.lastPoints = 0 })
    game.answers.forEach(({ playerId, answerIndex, timeLeft }) => {
      const p = game.players.find(p => p.id === playerId)
      if (!p) return
      if (answerIndex === correctIndex) {
        const bonus = Math.round((timeLeft / q.timeLimit) * 500)
        p.score += q.points + bonus
        p.lastCorrect = true
        p.lastPoints = q.points + bonus
      }
    })

    io.to(game.pin).emit('game:results', {
      correctIndex,
      answerCounts: q.answers.map((_, i) => game.answers.filter(a => a.answerIndex === i).length),
      players: game.players,
    })
  }

  function endGame(io, game) {
    game.phase = 'finished'
    clearInterval(game.timer)
    io.to(game.pin).emit('game:over', game.players)
  }

  httpServer.listen(port, () => console.log(`> Ready on http://localhost:${port}`))
})
