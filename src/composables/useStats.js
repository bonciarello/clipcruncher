import { computed } from 'vue'

const STOP_WORDS = new Set([
  'il','lo','la','i','gli','le','un','uno','una','l','un',
  'e','ed','di','a','ad','da','in','con','su','per','tra','fra',
  'che','non','è','sono','ho','ha','hai','hanno','era','erano','sarà','saranno',
  'si','no','ma','o','come','se','più','anche','già','ancora','dopo','prima',
  'del','della','dei','delle','al','alla','ai','alle','dal','dalla','dai','dalle',
  'nel','nella','nei','nelle','sul','sulla','sui','sulle',
  'mi','ti','ci','vi','li','ne','lo','la',
  'questo','questa','questi','queste','quello','quella','quelli','quelle',
  'the','a','an','is','are','was','were','be','been','being',
  'have','has','had','do','does','did','will','would','could','should',
  'may','might','can','shall','to','of','in','for','on','with','at',
  'by','from','as','into','through','during','before','after',
  'above','below','between','out','off','over','under','again',
  'further','then','once','here','there','when','where','why','how',
  'all','both','each','few','more','most','other','some','such',
  'no','nor','not','only','own','same','so','than','too','very',
  'and','but','or','if','because','until','while',
  'it','its','he','she','they','them','their','his','her',
  'my','your','our','me','you','us','we','i','him',
  'about','just','that','this','these','those','what','which','who',
  'whom','any','anybody','anyone','anything','anywhere',
  'per','essere','avere','fare','dire','io','tu','lui','lei',
  'noi','voi','loro','mio','tuo','suo','nostro','vostro',
  'de','la','el','los','las','unos','unas','y','que','en','por','para','se','del',
  'now','get','got','one','two','new','like','also','well','see','know',
  'c','è','s','t','d',
])

const TYPE_COLORS = {
  'Testo':    '#6366F1',
  'URL':      '#FBBF24',
  'Email':    '#10B981',
  'HTML':     '#EC4899',
  'Codice':   '#64748B',
  'Immagine': '#F472B6',
}

export function useStats(history) {
  const totalItems = computed(() => history.value.length)

  const totalCharacters = computed(() =>
    history.value.reduce((sum, item) => sum + item.length, 0)
  )

  const totalWords = computed(() =>
    history.value.reduce((sum, item) => sum + item.wordCount, 0)
  )

  const averageLength = computed(() =>
    history.value.length > 0
      ? Math.round(totalCharacters.value / history.value.length)
      : 0
  )

  const averageWords = computed(() =>
    history.value.length > 0
      ? Math.round((totalWords.value / history.value.length) * 10) / 10
      : 0
  )

  const typeDistribution = computed(() => {
    const counts = {}
    history.value.forEach(item => {
      counts[item.type] = (counts[item.type] || 0) + 1
    })
    return Object.entries(counts)
      .map(([type, count]) => ({ type, count, color: TYPE_COLORS[type] || '#94A3B8' }))
      .sort((a, b) => b.count - a.count)
  })

  const topWords = computed(() => {
    const wordCounts = {}
    history.value.forEach(item => {
      const words = item.content
        .toLowerCase()
        .replace(/[^a-zà-ü0-9\s]/gi, ' ')
        .split(/\s+/)
        .filter(w => w.length > 1 && !STOP_WORDS.has(w))
      words.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1
      })
    })
    return Object.entries(wordCounts)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)
  })

  const hourlyDistribution = computed(() => {
    const hours = new Array(24).fill(0)
    history.value.forEach(item => {
      const hour = new Date(item.timestamp).getHours()
      hours[hour]++
    })
    return hours.map((count, hour) => ({
      hour: `${String(hour).padStart(2, '0')}:00`,
      count,
      hourNum: hour
    }))
  })

  const dailyDistribution = computed(() => {
    const dayMap = {}
    history.value.forEach(item => {
      const d = new Date(item.timestamp)
      const key = d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
      dayMap[key] = (dayMap[key] || 0) + 1
    })
    const entries = Object.entries(dayMap)
    return entries.slice(-14).map(([date, count]) => ({ date, count }))
  })

  const typeAvgLength = computed(() => {
    const types = {}
    history.value.forEach(item => {
      if (!types[item.type]) types[item.type] = { total: 0, count: 0 }
      types[item.type].total += item.length
      types[item.type].count++
    })
    return Object.entries(types).map(([type, data]) => ({
      type,
      avg: Math.round(data.total / data.count),
      color: TYPE_COLORS[type] || '#94A3B8'
    }))
  })

  return {
    totalItems,
    totalCharacters,
    totalWords,
    averageLength,
    averageWords,
    typeDistribution,
    topWords,
    hourlyDistribution,
    dailyDistribution,
    typeAvgLength,
    TYPE_COLORS,
  }
}
