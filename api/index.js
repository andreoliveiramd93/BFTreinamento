const express = require('express')
const path = require('path')
const cors = require('cors')
const sqlite3 = require('sqlite3').verbose()
const { open } = require('sqlite')

const DB_FILE = path.join(__dirname, '../data.sqlite')

let db = null

async function initDb() {
  if (db) return db
  db = await open({ filename: DB_FILE, driver: sqlite3.Database })
  await db.exec(`
    CREATE TABLE IF NOT EXISTS modules (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL
    );
  `)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      module_id TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      FOREIGN KEY(module_id) REFERENCES modules(id) ON DELETE CASCADE
    );
  `)
  return db
}

function uid() { return Math.random().toString(36).slice(2, 9) }

const app = express()
app.use(cors())
app.use(express.json())

// Middleware para inicializar DB
app.use(async (req, res, next) => {
  try {
    await initDb()
    next()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// API
app.get('/api/modules', async (req, res) => {
  try {
    const modules = await db.all('SELECT * FROM modules ORDER BY rowid')
    const result = []
    for (const m of modules) {
      const videos = await db.all('SELECT * FROM videos WHERE module_id = ? ORDER BY rowid', m.id)
      result.push({ id: m.id, title: m.title, videos })
    }
    res.json(result)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/modules', async (req, res) => {
  try {
    const { title } = req.body
    if (!title) return res.status(400).json({ error: 'title required' })
    const id = uid()
    await db.run('INSERT INTO modules (id, title) VALUES (?,?)', id, title)
    res.json({ id, title, videos: [] })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/modules/:id', async (req, res) => {
  try {
    const id = req.params.id
    await db.run('DELETE FROM videos WHERE module_id = ?', id)
    await db.run('DELETE FROM modules WHERE id = ?', id)
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/modules/:id/videos', async (req, res) => {
  try {
    const module_id = req.params.id
    const { title, url } = req.body
    if (!title || !url) return res.status(400).json({ error: 'title and url required' })
    const id = uid()
    await db.run('INSERT INTO videos (id, module_id, title, url) VALUES (?,?,?,?)', id, module_id, title, url)
    res.json({ id, module_id, title, url })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/modules/:id/videos/:vid', async (req, res) => {
  try {
    const vid = req.params.vid
    await db.run('DELETE FROM videos WHERE id = ?', vid)
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/modules/:id', async (req, res) => {
  try {
    const id = req.params.id
    const { title } = req.body
    if (!title) return res.status(400).json({ error: 'title required' })
    await db.run('UPDATE modules SET title = ? WHERE id = ?', title, id)
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/modules/:id/videos/:vid', async (req, res) => {
  try {
    const vid = req.params.vid
    const { title, url } = req.body
    if (!title || !url) return res.status(400).json({ error: 'title and url required' })
    await db.run('UPDATE videos SET title = ?, url = ? WHERE id = ?', title, url, vid)
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, '../')))

// 404 fallback para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'))
})

module.exports = app
