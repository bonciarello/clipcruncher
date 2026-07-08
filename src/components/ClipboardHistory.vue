<template>
  <div>
    <!-- Toolbar -->
    <div class="history-toolbar">
      <p v-if="history.length" class="stat-label" style="margin:0">
        {{ history.length }} elemento{{ history.length !== 1 ? 'i' : '' }} nella cronologia
      </p>
      <button
        v-if="history.length"
        class="btn btn-outline btn-sm"
        @click="$emit('clear')"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M2 4h10M5 4V2.5a1 1 0 011-1h2a1 1 0 011 1V4M11 4v7a1 1 0 01-1 1H4a1 1 0 01-1-1V4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Cancella tutto
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="!history.length" class="empty-state">
      <svg class="empty-icon" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <rect x="12" y="8" width="40" height="50" rx="4" stroke="currentColor" stroke-width="2" />
        <rect x="20" y="18" width="24" height="4" rx="2" fill="currentColor" opacity="0.25" />
        <rect x="20" y="26" width="24" height="4" rx="2" fill="currentColor" opacity="0.25" />
        <rect x="20" y="34" width="16" height="4" rx="2" fill="currentColor" opacity="0.15" />
        <rect x="20" y="42" width="20" height="4" rx="2" fill="currentColor" opacity="0.1" />
        <circle cx="50" cy="14" r="6" fill="#6366F1" opacity="0.2" />
        <path d="M46 14l3 3 5-5" stroke="#6366F1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <h2 class="empty-title">Cronologia vuota</h2>
      <p class="empty-text">
        Copia del testo in questa pagina o usa il pulsante <strong>«Cattura dagli appunti»</strong> per importare ciò che hai già copiato altrove. La cronologia resta salvata nel tuo browser.
      </p>
    </div>

    <!-- History list -->
    <div v-else class="history-list">
      <div
        v-for="item in history"
        :key="item.id"
        class="clip-item"
        :class="{ 'new-item': newItemIds.has(item.id) }"
      >
        <div :class="['clip-accent', `type-${item.type}`]" aria-hidden="true"></div>
        <div class="clip-body">
          <div class="clip-meta">
            <span :class="['clip-type', `type-${item.type}`]">{{ item.type }}</span>
            <span class="clip-time">{{ formatTime(item.timestamp) }}</span>
          </div>
          <div class="clip-content" :title="item.content">{{ item.content }}</div>
          <div class="clip-chars">
            {{ item.length }} caratteri &middot; {{ item.wordCount }} parole
          </div>
        </div>
        <div class="clip-actions">
          <button
            class="btn btn-icon btn-ghost"
            :aria-label="`Elimina elemento copiato il ${formatDate(item.timestamp)}`"
            title="Elimina"
            @click="$emit('remove', item.id)"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 4h10M5.5 4V3a1 1 0 011-1h3a1 1 0 011 1v1M10 4v7a1 1 0 01-1 1H7a1 1 0 01-1-1V4" stroke="#EF4444" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  history: { type: Array, required: true }
})

defineEmits(['remove', 'clear'])

const newItemIds = ref(new Set())

// Track newly added items for the pulse animation
watch(() => props.history.length, (newLen, oldLen) => {
  if (newLen > oldLen && props.history[0]) {
    const id = props.history[0].id
    newItemIds.value.add(id)
    setTimeout(() => {
      newItemIds.value.delete(id)
    }, 700)
  }
})

function formatTime(iso) {
  const d = new Date(iso)
  return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
</script>
