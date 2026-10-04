<div align="center">

# Personal Planner

**A daily planner for work and personal life, with drag and drop, projects, statistics and an assistant.**

[![Nuxt](https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxt&logoColor=white)](https://nuxt.com/)
[![Vue](https://img.shields.io/badge/Vue-3-4FC08D?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![shadcn-vue](https://img.shields.io/badge/shadcn--vue-reka--ui-000000)](https://www.shadcn-vue.com/)

[Backend repository](https://github.com/bohdanhora/personal-planner-back)

</div>

## Overview

Personal Planner keeps one calm list for the whole day. Tasks live on days or in an inbox, belong to work or personal projects, and move with drag and drop between the list, the week strip, the week board and the inbox. An assistant panel plans the day, gives specific tips, and turns free text into tasks written in one consistent style.

## Features

- **Today** - date navigation, done, planned and free time, a week strip that accepts dropped tasks, list and schedule views, filters by work or personal area, carry over of unfinished tasks.
- **Week** - seven columns on desktop and stacked days on phones, with a load line per day and the inbox above for dragging tasks into days.
- **Inbox** - tasks without a day and everything overdue.
- **Projects** - short codes, work and personal areas, archive, progress and grouped tasks.
- **Insights** - completed against planned per day, completion rate, focus time, streaks, weekday averages and a project breakdown, with tooltips and a table view.
- **Assistant** - quick add from a free note, tidy up a single task, plan the day with one click to apply, tips, and a chat that proposes tasks to accept.
- **Accounts** - registration with an emailed six digit code, sign in with Google, rotating sessions.
- **Everywhere** - light and dark themes, English, Russian and Ukrainian, a layout made for phones with a bottom tab bar and bottom sheets.

## Design

The interface follows the shared engineering datasheet style: hard 1px rules, key and value rows, small uppercase monospace labels, a blinking block caret, no rounded corners, gradients or shadows. Unbounded for display, IBM Plex Sans for text, Martian Mono for labels. Ultramarine is the only accent colour.

## Tech stack

| Area | Technology |
| --- | --- |
| Framework | Nuxt 4 in SPA mode, Vue 3, TypeScript |
| UI | shadcn-vue on reka-ui, Tailwind CSS 4, lucide icons |
| Data | TanStack Vue Query, Pinia |
| Drag and drop | vue-draggable-plus on SortableJS, mouse and touch |
| i18n | @nuxtjs/i18n |
| Theme | @nuxtjs/color-mode |
| Fonts | @nuxt/fonts with Google Fonts, Cyrillic subsets |

## Getting started

Start the [backend](https://github.com/bohdanhora/personal-planner-back) first, then:

```bash
cp .env.example .env
npm install
npm run dev
```

The app runs on `http://localhost:3200`. Sign in with the seeded demo account `admin@admin.com` / `ChangeMe123` or create a new one.

| Variable | Purpose |
| --- | --- |
| `NUXT_PUBLIC_API_URL` | Base URL of the API, `http://localhost:4200/api` by default |

Google sign-in and the assistant switch on automatically when the backend has them configured.

## Project structure

```text
app
  assets/css     design tokens and base styles
  components
    app          shell, sidebar, tab bar, switchers
    assistant    panel, plan preview, task drafts
    auth         Google button, password field
    common       field, segmented control, empty states
    day          header, week strip, quick add, schedule
    insights     charts
    projects     project dialog
    tasks        rows, cards, sortable list, task dialog
    ui           shadcn-vue components restyled to the datasheet look
  composables    data hooks, formatting, clock
  layouts        app shell and sign in layout
  lib            API client, dates, types
  middleware     route guard
  pages          today, week, inbox, projects, insights, settings, auth
  stores         session and interface state
i18n/locales     en, ru, uk
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server on port 3200 |
| `npm run build` | Production build |
| `npm run generate` | Static build for any static host |
| `npm run lint` | ESLint |
| `npm run typecheck` | Type check with vue-tsc |
| `npm run format` | Prettier |
