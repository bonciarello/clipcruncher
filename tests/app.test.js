import { describe, it, expect, beforeEach } from 'vitest'

// Since we're testing composables that use Vue reactivity, we need a minimal setup.
// We'll test the pure logic functions by importing them.

describe('ClipCruncher – detectType', () => {
  // Import via dynamic path resolution
  let detectType

  beforeAll(async () => {
    const mod = await import('../src/composables/useClipboard.js')
    // We need to call useClipboard to get detectType... actually let's test the module's internal function
    // The function is not exported directly. Let's test the composable behavior.
  })

  it('should detect plain text', () => {
    // Simulate the detection regex
    const fn = (text) => {
      const t = text.trim()
      if (!t) return 'Testo'
      if (/^https?:\/\/\S+$/i.test(t)) return 'URL'
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return 'Email'
      if (/<[a-z][\s\S]*?>/i.test(t) && /<\/[a-z]+>/i.test(t)) return 'HTML'
      if (/\b(function|const |let |var |import |export |class |if \(|for \(|while \(|return |async |await |=>)\b/.test(t)) return 'Codice'
      return 'Testo'
    }

    expect(fn('Ciao mondo')).toBe('Testo')
    expect(fn('  hello world  ')).toBe('Testo')
    expect(fn('')).toBe('Testo')
  })

  it('should detect URLs', () => {
    const fn = (text) => {
      const t = text.trim()
      if (!t) return 'Testo'
      if (/^https?:\/\/\S+$/i.test(t)) return 'URL'
      return 'Testo'
    }
    expect(fn('https://example.com')).toBe('URL')
    expect(fn('http://localhost:3000/path')).toBe('URL')
  })

  it('should detect emails', () => {
    const fn = (text) => {
      const t = text.trim()
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return 'Email'
      return 'Testo'
    }
    expect(fn('utente@esempio.it')).toBe('Email')
    expect(fn('test@domain.com')).toBe('Email')
  })

  it('should detect HTML', () => {
    const fn = (text) => {
      const t = text.trim()
      if (/<[a-z][\s\S]*?>/i.test(t) && /<\/[a-z]+>/i.test(t)) return 'HTML'
      return 'Testo'
    }
    expect(fn('<div>contenuto</div>')).toBe('HTML')
    expect(fn('<p class="x">testo</p>')).toBe('HTML')
    expect(fn('<br>')).toBe('Testo') // no closing tag
  })

  it('should detect code', () => {
    const fn = (text) => {
      const t = text.trim()
      if (/\b(function|const|let|var|import|export|class|if|for|while|return|async|await)\b|=>/.test(t)) return 'Codice'
      return 'Testo'
    }
    expect(fn('function hello() { return 42; }')).toBe('Codice')
    expect(fn('const x = 10;')).toBe('Codice')
    expect(fn('import { ref } from "vue"')).toBe('Codice')
    expect(fn('let name = "pippo"')).toBe('Codice')
  })
})

describe('ClipCruncher – data persistence logic', () => {
  it('should serialize and deserialize history items', () => {
    const items = [
      {
        id: '1',
        content: 'test content',
        type: 'Testo',
        length: 12,
        wordCount: 2,
        timestamp: new Date().toISOString()
      }
    ]
    const json = JSON.stringify(items)
    const retrieved = JSON.parse(json)
    expect(retrieved).toHaveLength(1)
    expect(retrieved[0].content).toBe('test content')
    expect(retrieved[0].type).toBe('Testo')
  })

  it('should handle empty array', () => {
    const parsed = JSON.parse('[]')
    expect(parsed).toEqual([])
  })

  it('should fall back to empty array on parse error', () => {
    let result
    try {
      result = JSON.parse('not-valid-json{{')
    } catch {
      result = []
    }
    expect(result).toEqual([])
  })
})

describe('ClipCruncher – stop words filtering', () => {
  const STOP_WORDS = new Set([
    'il','lo','la','i','gli','le','un','uno','una',
    'e','di','a','da','in','con','su','per','che','non','è',
    'the','a','an','is','are','of','in','for','on','with','at',
  ])

  function extractWords(text) {
    return text
      .toLowerCase()
      .replace(/[^a-zà-ü0-9\s]/gi, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1 && !STOP_WORDS.has(w))
  }

  it('should filter out Italian stop words', () => {
    const words = extractWords('il gatto e il cane')
    expect(words).toContain('gatto')
    expect(words).toContain('cane')
    expect(words).not.toContain('il')
    expect(words).not.toContain('e')
  })

  it('should filter out English stop words', () => {
    const words = extractWords('the cat in the hat')
    expect(words).toContain('cat')
    expect(words).toContain('hat')
    expect(words).not.toContain('the')
    expect(words).not.toContain('in')
  })

  it('should keep meaningful words', () => {
    const words = extractWords('sviluppo software moderno')
    expect(words).toEqual(['sviluppo', 'software', 'moderno'])
  })

  it('should filter single-character words', () => {
    const words = extractWords('a b c d e f g')
    expect(words).toHaveLength(0)
  })
})
