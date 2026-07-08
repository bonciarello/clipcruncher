<template>
  <div>
    <!-- Empty state -->
    <div v-if="!history.length" class="empty-state">
      <svg class="empty-icon" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <rect x="8" y="28" width="8" height="24" rx="2" fill="currentColor" opacity="0.15" />
        <rect x="20" y="18" width="8" height="34" rx="2" fill="currentColor" opacity="0.25" />
        <rect x="32" y="8" width="8" height="44" rx="2" fill="currentColor" opacity="0.35" />
        <rect x="44" y="22" width="8" height="30" rx="2" fill="currentColor" opacity="0.2" />
      </svg>
      <h2 class="empty-title">Nessun dato da analizzare</h2>
      <p class="empty-text">
        Inizia a copiare testo o usa il pulsante <strong>«Cattura dagli appunti»</strong> per popolare la cronologia. Qui vedrai grafici e statistiche sulle tue abitudini di copia.
      </p>
    </div>

    <!-- Stats dashboard -->
    <template v-else>
      <!-- KPI cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Elementi totali</div>
          <div class="stat-value">{{ totalItems }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Caratteri totali</div>
          <div class="stat-value">{{ totalCharacters.toLocaleString() }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Lunghezza media</div>
          <div class="stat-value">{{ averageLength.toLocaleString() }}<span class="stat-unit">caratteri</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Parole totali</div>
          <div class="stat-value">{{ totalWords.toLocaleString() }}</div>
        </div>
      </div>

      <!-- Charts row 1: type distribution + avg length by type -->
      <div class="chart-grid">
        <div class="chart-box">
          <h3 class="chart-title">Distribuzione per tipo</h3>
          <div class="chart-wrap">
            <canvas ref="typeChartRef" aria-label="Grafico a torta della distribuzione per tipo di contenuto" role="img"></canvas>
          </div>
        </div>
        <div class="chart-box">
          <h3 class="chart-title">Lunghezza media per tipo</h3>
          <div class="chart-wrap">
            <canvas ref="avgLenChartRef" aria-label="Grafico a barre della lunghezza media per tipo di contenuto" role="img"></canvas>
          </div>
        </div>
      </div>

      <!-- Charts row 2: hourly activity + daily trend -->
      <div class="chart-grid">
        <div class="chart-box">
          <h3 class="chart-title">Attività oraria</h3>
          <div class="chart-wrap">
            <canvas ref="hourlyChartRef" aria-label="Grafico a barre dell'attività di copia per ora del giorno" role="img"></canvas>
          </div>
        </div>
        <div class="chart-box">
          <h3 class="chart-title">Andamento giornaliero</h3>
          <div class="chart-wrap">
            <canvas ref="dailyChartRef" aria-label="Grafico a linee dell'andamento delle copie negli ultimi giorni" role="img"></canvas>
          </div>
        </div>
      </div>

      <!-- Top words -->
      <div class="chart-box" v-if="topWords.length">
        <h3 class="chart-title">Parole più copiate</h3>
        <div class="top-words-list">
          <span v-for="w in topWords.slice(0, 20)" :key="w.word" class="top-word-chip">
            {{ w.word }} <span class="count">{{ w.count }}×</span>
          </span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Chart, DoughnutController, BarController, LineController, ArcElement, BarElement, PointElement, LineElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
import { useStats } from '../composables/useStats.js'

Chart.register(
  DoughnutController, BarController, LineController,
  ArcElement, BarElement, PointElement, LineElement,
  CategoryScale, LinearScale, Tooltip, Legend
)

const props = defineProps({
  history: { type: Array, required: true }
})

const historyRef = computed(() => props.history)

const {
  totalItems, totalCharacters, totalWords,
  averageLength, typeDistribution, topWords,
  hourlyDistribution, dailyDistribution, typeAvgLength
} = useStats(historyRef)

// Chart refs
const typeChartRef = ref(null)
const avgLenChartRef = ref(null)
const hourlyChartRef = ref(null)
const dailyChartRef = ref(null)

// Chart instances
let typeChart = null
let avgLenChart = null
let hourlyChart = null
let dailyChart = null

const chartColors = {
  indigo: '#6366F1',
  indigoLight: '#A5B4FC',
  pink: '#EC4899',
  amber: '#FBBF24',
  emerald: '#10B981',
  slate: '#64748B',
  grid: '#E2E8F0',
  text: '#475569',
  textLight: '#94A3B8',
}

const chartFont = {
  family: "'Inter', system-ui, sans-serif",
  size: 12,
}

function createTypeChart() {
  if (!typeChartRef.value) return
  if (typeChart) typeChart.destroy()

  const data = typeDistribution.value
  typeChart = new Chart(typeChartRef.value, {
    type: 'doughnut',
    data: {
      labels: data.map(d => d.type),
      datasets: [{
        data: data.map(d => d.count),
        backgroundColor: data.map(d => d.color),
        borderColor: '#FFFFFF',
        borderWidth: 2,
        hoverBorderWidth: 3,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 16,
            usePointStyle: true,
            pointStyleWidth: 10,
            font: chartFont,
            color: chartColors.text,
          }
        },
        tooltip: {
          backgroundColor: '#1E293B',
          titleFont: { ...chartFont, weight: '600' },
          bodyFont: chartFont,
          padding: 10,
          cornerRadius: 8,
          displayColors: true,
          boxPadding: 4,
        }
      },
    }
  })
}

function createAvgLenChart() {
  if (!avgLenChartRef.value) return
  if (avgLenChart) avgLenChart.destroy()

  const data = typeAvgLength.value
  avgLenChart = new Chart(avgLenChartRef.value, {
    type: 'bar',
    data: {
      labels: data.map(d => d.type),
      datasets: [{
        label: 'Lunghezza media (caratteri)',
        data: data.map(d => d.avg),
        backgroundColor: data.map(d => d.color),
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1E293B',
          titleFont: { ...chartFont, weight: '600' },
          bodyFont: chartFont,
          padding: 10,
          cornerRadius: 8,
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: chartFont, color: chartColors.textLight },
        },
        y: {
          beginAtZero: true,
          grid: { color: chartColors.grid },
          ticks: { font: chartFont, color: chartColors.textLight },
        }
      },
    }
  })
}

function createHourlyChart() {
  if (!hourlyChartRef.value) return
  if (hourlyChart) hourlyChart.destroy()

  const data = hourlyDistribution.value
  // Only show hours that have activity or are in a continuous range
  const activeHours = data.filter(d => d.count > 0)
  const showAll = activeHours.length <= 12
  const chartData = showAll ? data : data.filter(d => d.count > 0 || (
    data.indexOf(d) > 0 && data[data.indexOf(d) - 1].count > 0
  ) || (
    data.indexOf(d) < data.length - 1 && data[data.indexOf(d) + 1].count > 0
  ))

  hourlyChart = new Chart(hourlyChartRef.value, {
    type: 'bar',
    data: {
      labels: data.map(d => d.hour),
      datasets: [{
        label: 'Copie',
        data: data.map(d => d.count),
        backgroundColor: data.map(d => d.count > 0 ? chartColors.indigo : chartColors.grid),
        borderRadius: 4,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1E293B',
          titleFont: { ...chartFont, weight: '600' },
          bodyFont: chartFont,
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            title: (ctx) => `Ore ${ctx[0].label}`,
            label: (ctx) => `${ctx.raw} copia/e`,
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: chartFont,
            color: chartColors.textLight,
            maxTicksLimit: 12,
            callback: (_, i) => i % 3 === 0 ? data[i].hour : '',
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: chartColors.grid },
          ticks: {
            font: chartFont,
            color: chartColors.textLight,
            stepSize: 1,
          },
        }
      },
    }
  })
}

function createDailyChart() {
  if (!dailyChartRef.value) return
  if (dailyChart) dailyChart.destroy()

  const data = dailyDistribution.value
  dailyChart = new Chart(dailyChartRef.value, {
    type: 'line',
    data: {
      labels: data.map(d => d.date),
      datasets: [{
        label: 'Copie',
        data: data.map(d => d.count),
        borderColor: chartColors.indigo,
        backgroundColor: 'rgba(99,102,241,0.08)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: chartColors.indigo,
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1E293B',
          titleFont: { ...chartFont, weight: '600' },
          bodyFont: chartFont,
          padding: 10,
          cornerRadius: 8,
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: chartFont, color: chartColors.textLight, maxTicksLimit: 7 },
        },
        y: {
          beginAtZero: true,
          grid: { color: chartColors.grid },
          ticks: {
            font: chartFont,
            color: chartColors.textLight,
            stepSize: 1,
          },
        }
      },
    }
  })
}

function createAllCharts() {
  createTypeChart()
  createAvgLenChart()
  createHourlyChart()
  createDailyChart()
}

// Watch for history changes with debounce
let chartTimer = null
watch(() => props.history, () => {
  if (chartTimer) clearTimeout(chartTimer)
  chartTimer = setTimeout(() => {
    nextTick(createAllCharts)
  }, 200)
}, { deep: true })

onMounted(() => {
  nextTick(createAllCharts)
})

onUnmounted(() => {
  if (chartTimer) clearTimeout(chartTimer)
  if (typeChart) typeChart.destroy()
  if (avgLenChart) avgLenChart.destroy()
  if (hourlyChart) hourlyChart.destroy()
  if (dailyChart) dailyChart.destroy()
})
</script>
