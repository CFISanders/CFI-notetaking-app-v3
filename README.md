# Thrust Flight Notes

A CFI lesson notes app for Thrust Flight instructors. Tracks students, HOBBS time, lesson topics, and structured flight notes with an offline-first PWA design.

## Features

- Student profiles with training type (IRA, CAX, CFII)
- Smart HOBBS calculator (auto-calculates the third value)
- "Need to Cover" topic checklist per lesson
- Editable note snippets with favorites system
- Approach builder (airport + runway + type)
- Lesson archive — automatic save on copy
- Works offline once installed
- Installable on iPhone home screen (PWA)

## Deploying to Vercel (free)

1. Push this folder to a GitHub repository
2. Go to vercel.com → New Project → Import your repo
3. Vercel will auto-detect Vite and deploy

That's it — your app will be live at `your-project.vercel.app`

## Local development

```bash
npm install
npm run dev
```

## Building for production

```bash
npm run build
```

The built files will be in `dist/`.
