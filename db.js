const fs   = require('fs')
const path = require('path')

const DB_PATH  = process.env.DATABASE_PATH || path.join(__dirname, 'games.json')
const TTL_MS   = 24 * 60 * 60 * 1000

function read() {
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')) }
  catch { return { games: {} } }
}

function write(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data), 'utf8')
}

function cleanup(data) {
  const cutoff = Date.now() - TTL_MS
  let removed = 0
  for (const pin of Object.keys(data.games)) {
    if (data.games[pin].createdAt < cutoff) { delete data.games[pin]; removed++ }
  }
  if (removed > 0) console.log(`[db] Cleaned up ${removed} expired game(s)`)
}

function initDb() {
  const data = read()
  cleanup(data)
  write(data)
}

function saveGame(game) {
  const data = read()
  const existing = data.games[game.pin]
  data.games[game.pin] = {
    pin:                  game.pin,
    phase:                game.phase,
    currentQuestionIndex: game.currentQuestionIndex,
    questionTimeLeft:     game.questionTimeLeft,
    questions:            game.questions,
    players:              game.players,
    answers:              game.answers,
    createdAt:            existing?.createdAt ?? game._createdAt ?? Date.now(),
  }
  write(data)
}

function deleteGame(pin) {
  const data = read()
  delete data.games[pin]
  write(data)
}

function loadAllGames() {
  const data   = read()
  const cutoff = Date.now() - TTL_MS
  return Object.values(data.games)
    .filter(g => g.createdAt >= cutoff)
    .map(g => ({ ...g, _createdAt: g.createdAt, hostSocketId: null, timer: null }))
}

function startCleanupJob() {
  setInterval(() => { const d = read(); cleanup(d); write(d) }, 60 * 60 * 1000)
}

module.exports = { initDb, saveGame, deleteGame, loadAllGames, startCleanupJob }
