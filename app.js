// Modelo simples: array de módulos { id, title, videos: [{id,title,url}] }
let modules = []
let currentModuleId = null

// DOM
const modulesList = document.getElementById('modules')
const addModuleBtn = document.getElementById('add-module')
const newModuleTitle = document.getElementById('new-module-title')
const moduleArea = document.getElementById('module-area')

// Utils
function uid() { return Math.random().toString(36).slice(2,9) }

// API helpers
async function apiRequest(url, options = {}) {
  const resp = await fetch(url, options)
  const text = await resp.text()
  let data
  try {
    data = text ? JSON.parse(text) : null
  } catch (err) {
    data = text
  }

  if (!resp.ok) {
    const msg = data && typeof data === 'object' ? data.error || data.message : data
    throw new Error(msg || `HTTP ${resp.status}`)
  }

  return data
}

async function apiGetModules() {
  return apiRequest('/api/modules')
}
async function apiAddModule(title) {
  return apiRequest('/api/modules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) })
}
async function apiRemoveModule(id) {
  return apiRequest(`/api/modules/${id}`, { method: 'DELETE' })
}
async function apiAddVideo(moduleId, title, url) {
  return apiRequest(`/api/modules/${moduleId}/videos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, url }) })
}
async function apiRemoveVideo(moduleId, videoId) {
  return apiRequest(`/api/modules/${moduleId}/videos/${videoId}`, { method: 'DELETE' })
}

// Render
function renderModulesList() {
  modulesList.innerHTML = ''
  if (modules.length === 0) {
    const li = document.createElement('li')
    li.className = 'small'
    li.textContent = 'Nenhum módulo criado ainda.'
    modulesList.appendChild(li)
    return
  }
  modules.forEach(m => {
    const li = document.createElement('li')
    li.dataset.id = m.id
    li.innerHTML = `<span>${escapeHtml(m.title)}</span>`
    li.addEventListener('click', () => selectModule(m.id))
    if (m.id === currentModuleId) li.classList.add('active')

    const right = document.createElement('div')
    right.style.display = 'flex'
    right.style.gap = '6px'

    const del = document.createElement('button')
    del.textContent = '✕'
    del.title = 'Remover módulo'
    del.style.background = 'transparent'
    del.style.border = 'none'
    del.style.cursor = 'pointer'
    del.addEventListener('click', (ev) => { ev.stopPropagation(); removeModule(m.id) })

    right.appendChild(del)
    li.appendChild(right)
    modulesList.appendChild(li)
  })
}

function renderModuleArea() {
  if (!currentModuleId) {
    moduleArea.classList.add('empty')
    moduleArea.innerHTML = '<p>Selecione um módulo ou crie um novo para começar.</p>'
    return
  }
  moduleArea.classList.remove('empty')
  const mod = modules.find(x => x.id === currentModuleId)
  if (!mod) return

  const html = []
  html.push(`<div class="module-header"><h2>${escapeHtml(mod.title)}</h2><div class="small">${mod.videos.length} vídeo(s)</div></div>`)

  // Add video form
  html.push(`<div class="form-row"><input id="video-title" placeholder="Título do vídeo" /><input id="video-url" placeholder="URL do YouTube ou caminho .mp4" /><button id="add-video">Adicionar vídeo</button></div>`)

  // Videos
  html.push('<div class="videos-list">')
  if (mod.videos.length === 0) html.push('<p class="small">Nenhum vídeo ainda.</p>')
  mod.videos.forEach(v => {
    html.push(`<div class="video-card" data-v="${v.id}"><div class="video-meta"><strong>${escapeHtml(v.title)}</strong><div class="small">${escapeHtml(v.url)}</div></div><div class="video-actions"><button class="play"> ▶︎ </button> <button class="del">Remover</button></div></div>`)
  })
  html.push('</div>')

  // Embed area
  html.push('<div id="embed-area" class="embed-area"></div>')

  moduleArea.innerHTML = html.join('\n')

  // Events
  document.getElementById('add-video').addEventListener('click', () => {
    const title = document.getElementById('video-title').value.trim()
    const url = document.getElementById('video-url').value.trim()
    if (!title || !url) { alert('Preencha título e URL do vídeo.'); return }
    apiAddVideo(currentModuleId, title, url).then(() => {
      loadAndRender()
      document.getElementById('video-title').value = ''
      document.getElementById('video-url').value = ''
    }).catch(e => alert(e.message))
  })

  // play/delete handlers
  moduleArea.querySelectorAll('.video-card').forEach(card => {
    const vid = card.dataset.v
    card.querySelector('.play').addEventListener('click', () => playVideo(currentModuleId, vid))
    card.querySelector('.del').addEventListener('click', () => { if (confirm('Remover este vídeo?')) { apiRemoveVideo(currentModuleId, vid).then(()=>loadAndRender()).catch(e=>alert(e.message)) } })
  })
}

function playVideo(moduleId, videoId) {
  const mod = modules.find(m => m.id === moduleId)
  if (!mod) return
  const v = mod.videos.find(x => x.id === videoId)
  if (!v) return
  const embed = document.getElementById('embed-area')
  embed.innerHTML = ''
  if (isYouTubeUrl(v.url)) {
    const id = youTubeId(v.url)
    embed.innerHTML = `<iframe class="video-player" src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen></iframe>`
  } else {
    // assume direct video file
    embed.innerHTML = `<video class="video-player" controls src="${escapeHtml(v.url)}">Seu navegador não suporta a tag video.</video>`
  }
}

// CRUD
function addModule(title) {
  apiAddModule(title).then(m => { currentModuleId = m.id; loadAndRender() }).catch(e => alert(e.message))
}
function removeModule(id) {
  apiRemoveModule(id).then(()=>{ if (currentModuleId === id) currentModuleId = null; loadAndRender() }).catch(e=>alert(e.message))
}
function selectModule(id) { currentModuleId = id; renderModulesList(); renderModuleArea() }
// local helpers proxied to API - keep signatures for UI
function loadAndRender() {
  apiGetModules().then(data => {
    modules = data
    if (!currentModuleId && modules.length) currentModuleId = modules[0].id
    renderModulesList(); renderModuleArea()
  }).catch(e => { console.error(e); alert('Erro ao carregar módulos: '+e.message) })
}

// keep compatibility functions if needed
function addVideoToModule(moduleId, video) { return apiAddVideo(moduleId, video.title, video.url).then(loadAndRender) }
function removeVideoFromModule(moduleId, videoId) { return apiRemoveVideo(moduleId, videoId).then(loadAndRender) }

// Helpers
function isYouTubeUrl(url) { return /youtube.com|youtu.be/.test(url) }
function youTubeId(url) {
  // tenta extrair id simples
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/)
  return m ? m[1] : ''
}
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[c]) }

// Boot
async function load() {
  await loadAndRender()
}

load().catch(err => console.error('Falha ao iniciar:', err))

// UI events
addModuleBtn.addEventListener('click', () => {
  const title = newModuleTitle.value.trim()
  if (!title) { alert('Digite o nome do módulo'); return }
  addModule(title)
  newModuleTitle.value = ''
})

// Expose for debugging (optional)
window.__ms = { modules, save }
