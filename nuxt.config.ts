import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  ssr: false,
  devtools: { enabled: false },
  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxtjs/color-mode',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    'shadcn-nuxt',
  ],
  css: ['~/assets/css/main.css'],
  components: {
    dirs: [{ path: '~/components', pathPrefix: false, ignore: ['ui/**'] }],
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: [
        '@internationalized/date',
        '@lucide/vue',
        '@tanstack/vue-query',
        '@vueuse/core',
        'class-variance-authority',
        'clsx',
        'reka-ui',
        'reka-ui/date',
        'tailwind-merge',
        'vue-draggable-plus',
        'vue-input-otp',
        'vue-sonner',
      ],
    },
  },
  app: {
    head: {
      title: 'Personal Planner',
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'Plan your day, work and life, with an assistant.' },
        { name: 'theme-color', content: '#0c0d0f' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },
  runtimeConfig: {
    public: {
      apiUrl: 'http://localhost:4200/api',
    },
  },
  colorMode: {
    preference: 'system',
    fallback: 'dark',
    classSuffix: '',
    storageKey: 'pp-color-mode',
  },
  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'en',
    locales: [
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
      { code: 'ru', language: 'ru-RU', name: 'Русский', file: 'ru.json' },
      { code: 'uk', language: 'uk-UA', name: 'Українська', file: 'uk.json' },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'pp-locale',
      fallbackLocale: 'en',
      redirectOn: 'root',
    },
  },
  fonts: {
    defaults: {
      subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
    },
    families: [
      { name: 'Unbounded', provider: 'google', weights: [500, 600] },
      { name: 'IBM Plex Sans', provider: 'google', weights: [400, 500, 600] },
      { name: 'Martian Mono', provider: 'google', weights: [400] },
    ],
  },
  shadcn: {
    prefix: '',
    componentDir: '~/components/ui',
  },
  typescript: {
    strict: true,
  },
})
