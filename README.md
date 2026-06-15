# Website For You

Next.js website for real estate in Dubai.

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** CSS Modules (no Tailwind)
- **i18n:** next-intl (English default, Russian)
- **Font:** Inter (light weight)

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
├── app/
│   ├── [locale]/          # Localized pages (en, ru)
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/
│   ├── Header.tsx         # Header with transparent/white scroll
│   ├── Header.module.css
│   ├── Hero.tsx           # Hero section with video background
│   └── Hero.module.css
├── messages/              # i18n translations
│   ├── en.json
│   └── ru.json
├── public/
│   ├── dubai-hero-video.mp4
│   ├── new logo.png
│   └── new logo blue.png
└── i18n.ts               # i18n configuration
```

## Features

- ✅ Hero section with video background
- ✅ Gradient overlays (top & bottom)
- ✅ Transparent header (white on scroll)
- ✅ Glassmorphism buttons
- ✅ Multi-language support (en/ru)
- ✅ Inter font (light weight)
- ✅ Accent color: #003077

## Languages

- English (default) - `/` or `/en`
- Russian - `/ru`
