<script setup lang="ts">
import { LoaderCircle, LogOut, Route } from '@lucide/vue'
import { toast } from 'vue-sonner'

import LocaleSwitcher from '~/components/app/LocaleSwitcher.vue'
import ThemeSwitcher from '~/components/app/ThemeSwitcher.vue'
import CaretTitle from '~/components/common/CaretTitle.vue'
import Field from '~/components/common/Field.vue'
import AiProviderSection from '~/components/settings/AiProviderSection.vue'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { clockToMinutes, minutesToClock } from '~/lib/dates'

const { t } = useI18n()
const auth = useAuthStore()
const tour = useTourStore()
const errorMessage = useErrorMessage()

useHead({ title: () => `${t('nav.settings')} · Personal Planner` })

const form = reactive({
  displayName: auth.user?.displayName ?? '',
  timezone: auth.user?.timezone ?? 'UTC',
  dayStart: minutesToClock(auth.user?.dayStartMinutes ?? 540),
  dayEnd: minutesToClock(auth.user?.dayEndMinutes ?? 1080),
})

const timezones = computed(() =>
  [...new Set([form.timezone, ...Intl.supportedValuesOf('timeZone')])].sort(),
)

const saving = ref(false)
const confirmDelete = ref(false)
const hoursError = ref<string | null>(null)

const save = async () => {
  const dayStartMinutes = clockToMinutes(form.dayStart)
  const dayEndMinutes = clockToMinutes(form.dayEnd)

  if (dayStartMinutes === null || dayEndMinutes === null || dayEndMinutes <= dayStartMinutes) {
    hoursError.value = t('settings.hoursInvalid')
    return
  }

  hoursError.value = null
  saving.value = true

  try {
    await auth.updateProfile({
      displayName: form.displayName.trim(),
      timezone: form.timezone,
      dayStartMinutes,
      dayEndMinutes,
    })
    toast.success(t('settings.saved'))
  } catch (error) {
    toast.error(errorMessage(error))
  } finally {
    saving.value = false
  }
}

const logout = async () => {
  await auth.logout()
  await navigateTo('/login')
}

const removeAccount = async () => {
  try {
    await auth.deleteAccount()
    await navigateTo('/register')
  } catch (error) {
    toast.error(errorMessage(error))
  }
}

const detectTimezone = () => {
  form.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
}
</script>

<template>
  <div>
    <header class="border-b border-rule px-4 pt-5 pb-5 sm:px-6 lg:px-8 lg:pt-8">
      <p class="label">{{ auth.user?.email }}</p>
      <h1 class="display mt-3 text-metric"><CaretTitle :text="t('nav.settings')" /></h1>
    </header>

    <div class="max-w-2xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
      <section>
        <h2 class="label border-b border-rule-strong pb-2">01 · {{ t('settings.profile') }}</h2>
        <form class="mt-5 grid gap-5" @submit.prevent="save">
          <Field :label="t('auth.name')" for="settings-name">
            <Input
              id="settings-name"
              v-model="form.displayName"
              maxlength="80"
              autocomplete="name"
            />
          </Field>

          <Field :label="t('settings.timezone')">
            <template #aside>
              <button
                type="button"
                class="label underline-offset-4 hover:text-ink hover:underline"
                @click="detectTimezone"
              >
                {{ t('settings.detect') }}
              </button>
            </template>
            <Select v-model="form.timezone">
              <SelectTrigger class="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent class="max-h-72">
                <SelectItem v-for="zone in timezones" :key="zone" :value="zone">{{
                  zone
                }}</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field :label="t('settings.hours')" :error="hoursError" :hint="t('settings.hoursHint')">
            <div class="grid grid-cols-2 gap-3">
              <Input
                v-model="form.dayStart"
                type="time"
                step="900"
                class="font-mono"
                :aria-label="t('settings.dayStart')"
              />
              <Input
                v-model="form.dayEnd"
                type="time"
                step="900"
                class="font-mono"
                :aria-label="t('settings.dayEnd')"
              />
            </div>
          </Field>

          <div>
            <Button type="submit" :disabled="saving">
              <LoaderCircle v-if="saving" class="animate-spin" />
              {{ t('common.save') }}
            </Button>
          </div>
        </form>
      </section>

      <AiProviderSection index="02" />

      <section>
        <h2 class="label border-b border-rule-strong pb-2">03 · {{ t('settings.appearance') }}</h2>
        <div class="mt-5 grid gap-5 sm:grid-cols-2">
          <Field :label="t('settings.theme')">
            <ThemeSwitcher large />
          </Field>
          <Field :label="t('settings.language')">
            <LocaleSwitcher large />
          </Field>
        </div>
        <div
          class="mt-5 flex flex-col gap-3 border border-rule p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p class="text-sm">{{ t('settings.guide') }}</p>
            <p class="text-xs text-ink-faint">{{ t('settings.guideHint') }}</p>
          </div>
          <Button variant="outline" size="sm" @click="tour.start()">
            <Route />
            {{ t('settings.replayGuide') }}
          </Button>
        </div>
      </section>

      <section>
        <h2 class="label border-b border-rule-strong pb-2">04 · {{ t('settings.account') }}</h2>
        <dl class="mt-2">
          <div class="flex justify-between gap-4 border-b border-rule py-3 text-sm">
            <dt class="text-ink-muted">{{ t('auth.email') }}</dt>
            <dd class="truncate">{{ auth.user?.email }}</dd>
          </div>
          <div class="flex justify-between gap-4 border-b border-rule py-3 text-sm">
            <dt class="text-ink-muted">{{ t('settings.signInMethods') }}</dt>
            <dd class="font-mono text-2xs uppercase">
              {{
                [
                  auth.user?.hasPassword && t('settings.password'),
                  auth.user?.googleLinked && 'Google',
                ]
                  .filter(Boolean)
                  .join(' · ')
              }}
            </dd>
          </div>
        </dl>
        <div class="mt-5 flex flex-wrap gap-2">
          <Button variant="outline" @click="logout">
            <LogOut />
            {{ t('settings.logout') }}
          </Button>
          <Button
            variant="ghost"
            class="text-danger hover:bg-danger hover:text-white"
            @click="confirmDelete = true"
          >
            {{ t('settings.delete') }}
          </Button>
        </div>
      </section>
    </div>

    <AlertDialog v-model:open="confirmDelete">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle class="display text-lg">{{
            t('settings.deleteTitle')
          }}</AlertDialogTitle>
          <AlertDialogDescription>{{ t('settings.deleteText') }}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{{ t('common.cancel') }}</AlertDialogCancel>
          <AlertDialogAction class="bg-danger text-white hover:bg-ink" @click="removeAccount">{{
            t('settings.delete')
          }}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
