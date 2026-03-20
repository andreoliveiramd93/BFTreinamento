const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

function uid() { return Math.random().toString(36).slice(2, 9) }

let modules = []

app.get('/api/modules', (req, res) => {
  res.json(modules)
})

app.post('/api/modules', (req, res) => {
  const { title } = req.body
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'title required' })
  }

  const newModule = { id: uid(), title: title.trim(), videos: [] }
  modules.push(newModule)
  res.json(newModule)
})

app.delete('/api/modules/:id', (req, res) => {
  const { id } = req.params
  modules = modules.filter(m => m.id !== id)
  res.json({ ok: true })
})

app.post('/api/modules/:id/videos', (req, res) => {
  const { id } = req.params
  const module = modules.find(m => m.id === id)
  if (!module) return res.status(404).json({ error: 'module not found' })

  const { title, url } = req.body
  if (!title || !url || !title.trim() || !url.trim()) {
    return res.status(400).json({ error: 'title and url required' })
  }

  const video = { id: uid(), module_id: id, title: title.trim(), url: url.trim() }
  module.videos.push(video)
  res.json(video)
})

app.delete('/api/modules/:id/videos/:vid', (req, res) => {
  const { id, vid } = req.params
  const module = modules.find(m => m.id === id)
  if (!module) return res.status(404).json({ error: 'module not found' })

  module.videos = module.videos.filter(v => v.id !== vid)
  res.json({ ok: true })
})

app.put('/api/modules/:id', (req, res) => {
  const { id } = req.params
  const { title } = req.body
  const module = modules.find(m => m.id === id)
  if (!module) return res.status(404).json({ error: 'module not found' })

  if (!title || !title.trim()) return res.status(400).json({ error: 'title required' })

  module.title = title.trim()
  res.json({ ok: true })
})

app.put('/api/modules/:id/videos/:vid', (req, res) => {
  const { id, vid } = req.params
  const { title, url } = req.body
  const module = modules.find(m => m.id === id)
  if (!module) return res.status(404).json({ error: 'module not found' })

  const video = module.videos.find(v => v.id === vid)
  if (!video) return res.status(404).json({ error: 'video not found' })

  if (!title || !url || !title.trim() || !url.trim()) return res.status(400).json({ error: 'title and url required' })

  video.title = title.trim()
  video.url = url.trim()
  res.json({ ok: true })
})

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found' })
})

module.exports = app
