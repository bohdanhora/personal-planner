<script setup lang="ts">
import { LoaderCircle } from '@lucide/vue'
import { toast } from 'vue-sonner'

import CaretTitle from '~/components/common/CaretTitle.vue'
import Field from '~/components/common/Field.vue'
import Segmented from '~/components/common/Segmented.vue'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Switch } from '~/components/ui/switch'
import { Textarea } from '~/components/ui/textarea'
import type { ProjectArea } from '~/lib/types'

const CODE_PATTERN = /^[A-Z0-9]{2,5}$/

const { t } = useI18n()
const ui = useUiStore()
const router = useRouter()
const errorMessage = useErrorMessage()
const actions = useProjectActions()
const projects = useProjectMap()

const form = reactive({
  name: '',
  code: '',
  area: 'WORK' as ProjectArea,
  description: '',
  archived: false,
})

const codeTouched = ref(false)
const errors = reactive({ name: null as string | null, code: null as string | null })
const project = computed(() =>
  ui.projectEditorId ? projects.value.get(ui.projectEditorId) : undefined,
)
const saving = computed(() => actions.create.isPending.value || actions.update.isPending.value)

const suggestCode = (name: string) => {
  const latin = name
    .normalize('NFD')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .trim()
  const words = latin.split(/\s+/).filter(Boolean)
  const base = words.length > 1 ? words.map((word) => word[0]).join('') : (words[0] ?? '')
  return transliterate(base)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4)
}

const CYRILLIC: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  ґ: 'g',
  д: 'd',
  е: 'e',
  є: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  і: 'i',
  ї: 'i',
  й: 'i',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'c',
  ч: 'ch',
  ш: 'sh',
  щ: 'sh',
  ы: 'y',
  э: 'e',
  ю: 'yu',
  я: 'ya',
}

const transliterate = (value: string) =>
  [...value.toLowerCase()].map((char) => CYRILLIC[char] ?? char).join('')

watch(
  () => ui.projectEditorOpen,
  (open) => {
    if (!open) {
      return
    }

    form.name = project.value?.name ?? ''
    form.code = project.value?.code ?? ''
    form.area = project.value?.area ?? 'WORK'
    form.description = project.value?.description ?? ''
    form.archived = project.value?.archived ?? false
    codeTouched.value = Boolean(project.value)
    errors.name = null
    errors.code = null
  },
)

watch(
  () => form.name,
  (name) => {
    if (!codeTouched.value) {
      form.code = suggestCode(name)
    }
  },
)

const areaOptions = computed(() =>
  (['WORK', 'PERSONAL'] as const).map((value) => ({ value, label: t(`areas.${value}`) })),
)

const save = async () => {
  form.code = form.code.toUpperCase()
  errors.name = form.name.trim() ? null : t('projects.nameRequired')
  errors.code = CODE_PATTERN.test(form.code) ? null : t('projects.codeInvalid')

  if (errors.name || errors.code) {
    return
  }

  const payload = {
    name: form.name.trim(),
    code: form.code,
    area: form.area,
    description: form.description.trim() || null,
  }

  try {
    if (project.value) {
      await actions.update.mutateAsync({
        id: project.value.id,
        patch: { ...payload, archived: form.archived },
      })
    } else {
      const created = await actions.create.mutateAsync(payload)
      await router.push(`/projects/${created.id}`)
    }
    ui.projectEditorOpen = false
  } catch (error) {
    toast.error(errorMessage(error))
  }
}
</script>

<template>
  <Dialog v-model:open="ui.projectEditorOpen">
    <DialogContent>
      <DialogHeader>
        <p class="label">{{ t('projects.label') }}</p>
        <DialogTitle class="display text-xl">
          <CaretTitle :text="project ? t('projects.edit') : t('projects.new')" />
        </DialogTitle>
        <DialogDescription>{{ t('projects.hint') }}</DialogDescription>
      </DialogHeader>

      <form class="grid gap-5" @submit.prevent="save">
        <div class="grid grid-cols-3 gap-4">
          <Field
            class="col-span-2"
            :label="t('projects.name')"
            for="project-name"
            :error="errors.name"
          >
            <Input id="project-name" v-model="form.name" maxlength="80" autocomplete="off" />
          </Field>
          <Field :label="t('projects.code')" for="project-code" :error="errors.code">
            <Input
              id="project-code"
              v-model="form.code"
              class="font-mono uppercase"
              maxlength="5"
              autocomplete="off"
              @input="codeTouched = true"
            />
          </Field>
        </div>

        <Field :label="t('projects.area')">
          <Segmented
            v-model="form.area"
            :options="areaOptions"
            :label="t('projects.area')"
            stretch
          />
        </Field>

        <Field :label="t('projects.description')" for="project-description">
          <Textarea id="project-description" v-model="form.description" maxlength="500" rows="2" />
        </Field>

        <label
          v-if="project"
          class="flex items-center justify-between gap-4 border border-rule p-3"
        >
          <span>
            <span class="block text-sm">{{ t('projects.archive') }}</span>
            <span class="block text-xs text-ink-faint">{{ t('projects.archiveHint') }}</span>
          </span>
          <Switch v-model="form.archived" />
        </label>

        <DialogFooter
          class="-mx-5 flex-row justify-end gap-2 border-t border-rule px-5 pt-4 sm:-mx-6 sm:px-6"
        >
          <Button type="button" variant="outline" @click="ui.projectEditorOpen = false">
            {{ t('common.cancel') }}
          </Button>
          <Button type="submit" :disabled="saving">
            <LoaderCircle v-if="saving" class="animate-spin" />
            {{ project ? t('common.save') : t('projects.create') }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
