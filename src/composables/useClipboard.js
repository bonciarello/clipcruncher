import { ref } from 'vue'

const STORAGE_KEY = 'clipcruncher_history'
const MAX_ITEMS = 500

const history = ref(loadHistory())

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(item => item && typeof item.id === 'string' && typeof item.content === 'string')
  } catch {
    return []
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.value))
  } catch (e) {
    console.warn('ClipCruncher: localStorage pieno, rimuovo elementi più vecchi.')
    history.value = history.value.slice(0, Math.floor(history.value.length / 2))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.value))
  }
}

function detectType(text) {
  const t = text.trim()
  if (!t) return 'Testo'
  if (/^https?:\/\/\S+$/i.test(t)) return 'URL'
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return 'Email'
  if (/<[a-z][\s\S]*?>/i.test(t) && /<\/[a-z]+>/i.test(t)) return 'HTML'
  if (/\b(function|const|let|var|import|export|class|if|for|while|return|async|await)\b|=>/.test(t)) return 'Codice'
  return 'Testo'
}

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
}

export function useClipboard() {
  function addItem(content) {
    if (!content || !content.trim()) return null

    // Deduplica: stesso contenuto entro 5 secondi
    const last = history.value[0]
    if (last && last.content === content) {
      const lastTime = new Date(last.timestamp).getTime()
      if (Date.now() - lastTime < 5000) return null
    }

    const item = {
      id: generateId(),
      content,
      type: detectType(content),
      length: content.length,
      wordCount: content.trim().split(/\s+/).filter(Boolean).length,
      timestamp: new Date().toISOString()
    }

    history.value.unshift(item)

    if (history.value.length > MAX_ITEMS) {
      history.value = history.value.slice(0, MAX_ITEMS)
    }

    persist()
    return item
  }

  function removeItem(id) {
    const idx = history.value.findIndex(item => item.id === id)
    if (idx !== -1) {
      history.value.splice(idx, 1)
      persist()
    }
  }

  function clearAll() {
    history.value = []
    persist()
  }

  return { history, addItem, removeItem, clearAll, detectType }
}

// Global copy listener management
let copyHandler = null

export function setupGlobalCopyListener(onCopy) {
  if (copyHandler) return
  copyHandler = (e) => {
    const text = e.clipboardData?.getData('text/plain')
    if (text) {
      onCopy(text)
    }
  }
  document.addEventListener('copy', copyHandler)
}

export function teardownGlobalCopyListener() {
  if (copyHandler) {
    document.removeEventListener('copy', copyHandler)
    copyHandler = null
  }
}
