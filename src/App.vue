<template>
  <div class="app-shell">
    <!-- Header -->
    <header class="app-header">
      <div class="app-brand">
        <svg class="app-logo" viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <rect x="8" y="4" width="24" height="32" rx="3" fill="white" stroke="#6366F1" stroke-width="2" />
          <rect x="13" y="10" width="14" height="3" rx="1.5" fill="#818CF8" />
          <rect x="13" y="16" width="14" height="3" rx="1.5" fill="#818CF8" />
          <rect x="13" y="22" width="9" height="3" rx="1.5" fill="#818CF8" opacity="0.5" />
          <rect x="13" y="28" width="11" height="3" rx="1.5" fill="#818CF8" opacity="0.35" />
          <circle cx="29" cy="8" r="5" fill="#EC4899" />
          <path d="M27.5 8l1.2 1.2 2.3-2.3" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <div>
          <h1 class="app-title">ClipCruncher</h1>
          <p class="app-subtitle">La tua clipboard sotto la lente. Copia, traccia, analizza — tutto in locale.</p>
        </div>
      </div>

      <div class="header-actions">
        <nav class="tab-nav" aria-label="Sezioni">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'history' }"
            @click="activeTab = 'history'"
            aria-pressed="activeTab === 'history'"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M5 1H3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V3a2 2 0 00-2-2H5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M5 1v2h6V1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M5 8h6M5 11h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            Cronologia
            <span v-if="history.length" class="tab-badge">{{ history.length }}</span>
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'dashboard' }"
            @click="activeTab = 'dashboard'"
            aria-pressed="activeTab === 'dashboard'"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="1" y="8" width="4" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/>
              <rect x="6" y="4" width="4" height="11" rx="1" stroke="currentColor" stroke-width="1.5"/>
              <rect x="11" y="1" width="4" height="14" rx="1" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            Dashboard
          </button>
        </nav>

        <button class="btn btn-primary" @click="captureFromClipboard" :disabled="capturing">
          <svg v-if="!capturing" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M11 2H3a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V3a1 1 0 00-1-1z" stroke="currentColor" stroke-width="1.5"/>
            <path d="M13 10h1a1 1 0 001-1V3a1 1 0 00-1-1h-1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 16 16" fill="none" class="spinner" aria-hidden="true">
            <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" opacity="0.25" />
            <path d="M8 2a6 6 0 016 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
          {{ capturing ? 'Cattura in corso…' : 'Cattura dagli appunti' }}
        </button>
      </div>
    </header>

    <!-- Main content -->
    <main>
      <ClipboardHistory
        v-if="activeTab === 'history'"
        :history="history"
        @remove="removeItem"
        @clear="showClearConfirm = true"
      />
      <StatsDashboard
        v-else
        :history="history"
      />
    </main>

    <!-- Footer -->
    <footer class="app-footer">
      <p class="footer-text">
        ClipCruncher &middot; I tuoi dati restano nel browser — nessun cookie, nessun server, nessuna telemetria.
      </p>
    </footer>

    <!-- Clear confirm dialog -->
    <div v-if="showClearConfirm" class="dialog-overlay" @click.self="showClearConfirm = false">
      <div class="dialog-box" role="alertdialog" aria-labelledby="dialog-title">
        <h2 id="dialog-title" class="dialog-title">Cancellare tutta la cronologia?</h2>
        <p class="dialog-text">Questa azione è irreversibile. Tutti i {{ history.length }} elementi saranno eliminati definitivamente.</p>
        <div class="dialog-actions">
          <button class="btn btn-ghost" @click="showClearConfirm = false" autofocus>Annulla</button>
          <button class="btn btn-danger" @click="confirmClear">Sì, cancella tutto</button>
        </div>
      </div>
    </div>

    <!-- Toast container -->
    <div class="toast-container" aria-live="polite">
      <div v-for="toast in toasts" :key="toast.id" :class="['toast', `toast-${toast.type}`]">
        <svg v-if="toast.type === 'success'" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <circle cx="9" cy="9" r="8" stroke="currentColor" stroke-width="1.5"/>
          <path d="M5.5 9l2.5 2.5 4.5-4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <svg v-else width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <circle cx="9" cy="9" r="8" stroke="currentColor" stroke-width="1.5"/>
          <path d="M9 5.5v4M9 12.5h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        {{ toast.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useClipboard, setupGlobalCopyListener, teardownGlobalCopyListener } from './composables/useClipboard.js'
import ClipboardHistory from './components/ClipboardHistory.vue'
import StatsDashboard from './components/StatsDashboard.vue'

const { history, addItem, removeItem, clearAll } = useClipboard()

const activeTab = ref('history')
const showClearConfirm = ref(false)
const capturing = ref(false)

// Toast system
const toasts = ref([])
let toastId = 0

function showToast(message, type = 'success') {
  const id = ++toastId
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, 3000)
}

// Global copy listener
onMounted(() => {
  setupGlobalCopyListener((text) => {
    const item = addItem(text)
    if (item) {
      showToast(`Catturato: "${text.slice(0, 40)}${text.length > 40 ? '…' : ''}"`)
    }
  })
})

onUnmounted(() => {
  teardownGlobalCopyListener()
})

// Active clipboard capture
async function captureFromClipboard() {
  capturing.value = true
  try {
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      showToast('API Clipboard non disponibile. Usa un browser recente con HTTPS.', 'error')
      return
    }
    const text = await navigator.clipboard.readText()
    if (!text || !text.trim()) {
      showToast('Nessun testo trovato negli appunti.', 'error')
      return
    }
    const item = addItem(text)
    if (item) {
      showToast(`Catturato: "${text.slice(0, 50)}${text.length > 50 ? '…' : ''}"`)
      activeTab.value = 'history'
    } else {
      showToast('Elemento già presente nella cronologia.', 'error')
    }
  } catch (err) {
    if (err.name === 'NotAllowedError') {
      showToast('Permesso negato. Concedi l\'accesso agli appunti quando il browser lo richiede.', 'error')
    } else {
      showToast('Impossibile leggere gli appunti. Riprova.', 'error')
    }
  } finally {
    capturing.value = false
  }
}

function confirmClear() {
  clearAll()
  showClearConfirm.value = false
  showToast('Cronologia cancellata.')
}
</script>

<style scoped>
.spinner {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
