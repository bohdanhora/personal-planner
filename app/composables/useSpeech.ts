const LANGUAGES: Record<string, string> = { en: 'en-US', ru: 'ru-RU', uk: 'uk-UA' }

interface RecognitionResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>
}

interface RecognitionErrorEvent {
  error: string
}

interface Recognition {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: RecognitionResultEvent) => void) | null
  onerror: ((event: RecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type RecognitionConstructor = new () => Recognition

const findRecognition = (): RecognitionConstructor | null => {
  if (!import.meta.client) return null
  const scope = window as Window & {
    SpeechRecognition?: RecognitionConstructor
    webkitSpeechRecognition?: RecognitionConstructor
  }
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null
}

export const useSpeech = (text: Ref<string>) => {
  const { locale } = useI18n()
  const Recognition = findRecognition()
  const supported = Recognition !== null
  const listening = ref(false)
  const error = ref<string | null>(null)

  let recognition: Recognition | null = null
  let prefix = ''

  const stop = () => recognition?.stop()

  const start = () => {
    if (!Recognition || listening.value) return

    error.value = null
    prefix = text.value.trim() ? `${text.value.trim()} ` : ''
    recognition = new Recognition()
    recognition.lang = LANGUAGES[locale.value] ?? locale.value
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event) => {
      let spoken = ''
      for (const result of Array.from(event.results)) {
        spoken += result[0]?.transcript ?? ''
      }
      text.value = `${prefix}${spoken.trim()}`
    }
    recognition.onerror = (event) => {
      if (event.error !== 'aborted' && event.error !== 'no-speech') error.value = event.error
    }
    recognition.onend = () => {
      listening.value = false
      recognition = null
    }

    recognition.start()
    listening.value = true
  }

  const toggle = () => (listening.value ? stop() : start())

  onBeforeUnmount(() => recognition?.abort())

  return { supported, listening, error, start, stop, toggle }
}
