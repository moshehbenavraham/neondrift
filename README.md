# Retrofly

Retrofly is an async retrospective workspace for collecting team feedback,
grouping related responses, generating concise summaries, and tracking action
items after each retro.

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Supabase Auth, Database, Realtime, and Edge Functions
- OpenAI-compatible chat completions for AI summaries and grouping

## Getting Started

Install dependencies:

```sh
npm install
```

Create a local environment file:

```sh
cp .env.example .env
```

Fill in the Supabase values in `.env`, then start the app:

```sh
npm run dev
```

## Supabase Setup

The frontend expects:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

The Edge Functions use server-side secrets:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (optional, defaults to `gpt-4o-mini`)

Set function secrets with the Supabase CLI:

```sh
supabase secrets set OPENAI_API_KEY=your_api_key
supabase secrets set OPENAI_MODEL=gpt-4o-mini
```

## Scripts

```sh
npm run dev
npm run build
npm run lint
npm run preview
```

## Deployment

Deploy the Vite frontend to any static hosting platform and deploy the
Supabase migrations and Edge Functions with the Supabase CLI.
