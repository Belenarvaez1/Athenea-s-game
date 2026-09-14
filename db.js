const Database = require('better-sqlite3')
const path = require('path')

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'games.db')
const TTL_SECONDS = 24 * 60 * 60

let db

function initDb() {
  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      pin                    TEXT PRIMARY KEY,
      phase                  TEXT NOT NULL,
      current_question_index INTEGER NOT NULL DEFAULT -1,
      question_time_left     INTEGER NOT NULL DEFAULT 0,
      questions              TEXT NOT NULL,
      players                TEXT NOT NULL,
      answers                TEXT NOT NULL,
      created_at             INTEGER NOT NULL,
      updated_at             INTEGER NOT NULL
    )
  `)
  cleanup()
}

const stmtUpsert = () => db.prepare(`
  INSERT INTO games (pin, phase, current_question_index, question_time_left,
                     questions, players, answers, created_at, updated_at)
  VALUES (@pin, @phase, @current_question_index, @question_time_left,
          @questions, @players, @answers, @created_at, @updated_at)
  ON CONFLICT(pin) DO UPDATE SET
    phase                  = excluded.phase,
    current_question_index = excluded.current_question_index,
    question_time_left     = excluded.question_time_left,
    questions              = excluded.questions,
    players                = excluded.players,
    answers                = excluded.answers,
    updated_at             = excluded.updated_at
`)

const stmtDelete = () => db.prepare('DELETE FROM games WHERE pin = ?')
const stmtLoadAll = () => db.prepare(
  'SELECT * FROM games WHERE created_at > unixepoch() - ?'
)
const stmtCleanup = () => db.prepare(
  'DELETE FROM games WHERE created_at < unixepoch() - ?'
)

function saveGame(game) {
  stmtUpsert().run({
    pin:                    game.pin,
    phase:                  game.phase,
    current_question_index: game.currentQuestionIndex,
    question_time_left:     game.questionTimeLeft,
    questions:              JSON.stringify(game.questions),
    players:                JSON.stringify(game.players),
    answers:                JSON.stringify(game.answers),
    created_at:             game._createdAt || Math.floor(Date.now() / 1000),
    updated_at:             Math.floor(Date.now() / 1000),
  })
}

function deleteGame(pin) {
  stmtDelete().run(pin)
}

function loadAllGames() {
  return stmtLoadAll().all(TTL_SECONDS).map(row => ({
    pin:                  row.pin,
    phase:                row.phase,
    currentQuestionIndex: row.current_question_index,
    questionTimeLeft:     row.question_time_left,
    questions:            JSON.parse(row.questions),
    players:              JSON.parse(row.players),
    answers:              JSON.parse(row.answers),
    _createdAt:           row.created_at,
    // runtime fields — caller must set these
    hostSocketId: null,
    timer:        null,
  }))
}

function cleanup() {
  const { changes } = stmtCleanup().run(TTL_SECONDS)
  if (changes > 0) console.log(`[db] Cleaned up ${changes} expired game(s)`)
}

function startCleanupJob() {
  setInterval(cleanup, 60 * 60 * 1000)
}

module.exports = { initDb, saveGame, deleteGame, loadAllGames, startCleanupJob }
