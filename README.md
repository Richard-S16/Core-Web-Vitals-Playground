# Core Web Vitals Playground

A web app that analyzes any website's performance and explains **WHY** it is slow.

## Features

- **URL Performance Audit:** Real-time data from PageSpeed Insights API.
- **Visual Metric Breakdown:** Color-coded cards for LCP, CLS, INP, FCP, TBT and Speed Index.
- **Field Data:** Real-world Chrome User Experience Report (CrUX) distribution bars.
- **Mobile & Desktop:** Toggle between strategies for a full picture.

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript)
- **Styling:** Tailwind CSS 4
- **Data Source:** [PageSpeed Insights REST API](https://developers.google.com/speed/docs/insights/v5/get-started)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up your API key

Get a free PageSpeed Insights API key:

1. Go to [Google Cloud Console → PageSpeed Insights API](https://console.cloud.google.com/apis/library/pagespeedonline.googleapis.com)
2. Enable the API
3. Go to **Credentials → Create Credentials → API Key**
4. Copy the key into `.env.local`:

```bash
PAGESPEED_API_KEY=your_key_here
```

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start analyzing.

## Project Structure

```
src/
  app/
    api/analyze/route.ts   # PSI API proxy (server-side, key never exposed)
    layout.tsx              # Root layout with ReportProvider
    page.tsx                # Landing page + results display
  components/
    url-input.tsx           # URL input with validation & strategy toggle
    metric-card.tsx         # Single metric display with color-coded rating
    results-panel.tsx       # Full results dashboard
  context/
    report-context.tsx      # React Context for analysis state
  types/
    pagespeed.ts            # PSI API response types
    metrics.ts              # App metric types, thresholds, formatting
```
