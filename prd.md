# Product Requirements Document
## User Behavior Analytics Platform
**Assignment Submission — CausalFunnel Full Stack Engineer Role**

---

| Field | Value |
|---|---|
| Author | Candidate |
| Version | 1.0.0 |
| Status | Final |
| Last Updated | June 2026 |
| Stack | Node.js · React · MongoDB · WebSocket |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Problem Statement](#2-problem-statement)
3. [Goals and Non-Goals](#3-goals-and-non-goals)
4. [User Personas](#4-user-personas)
5. [System Architecture](#5-system-architecture)
6. [Data Models](#6-data-models)
7. [Tracking Script Specification](#7-tracking-script-specification)
8. [Backend API Specification](#8-backend-api-specification)
9. [Dashboard Feature Specifications](#9-dashboard-feature-specifications)
10. [Enhanced Features](#10-enhanced-features)
11. [Non-Functional Requirements](#11-non-functional-requirements)
12. [Implementation Phases](#12-implementation-phases)
13. [Design Decisions](#13-design-decisions)
14. [Success Metrics](#14-success-metrics)
15. [Future Roadmap](#15-future-roadmap)

---

## 1. Overview

This document defines requirements for a full-stack user behavior analytics platform. The system enables e-commerce businesses to instrument their webpages with a lightweight tracking script, capture user interactions in real time, and explore the resulting data through a rich analytics dashboard.

The platform captures `page_view`, `click`, `scroll_depth`, and `mouse_move` events; detects behavioral signals like rage clicks and dead clicks; replays sessions as animated cursor trails; and uses an AI layer to generate natural-language summaries of individual user journeys. Operators can also define multi-step conversion funnels and view aggregate click density as a kernel density estimation heatmap.

---

## 2. Problem Statement

E-commerce businesses routinely lose conversion opportunities because they cannot see what users actually do on their pages. Standard web analytics tools (Google Analytics, etc.) provide aggregate traffic numbers but offer no behavioral signal — no way to know that users are rage-clicking a broken CTA, abandoning a page at the 50% scroll mark, or consistently dropping off between the pricing and checkout pages.

The platform described in this document bridges that gap. By combining session-level event capture with behavioral pattern detection and AI-assisted interpretation, it gives product and growth teams actionable insight rather than raw numbers.

---

## 3. Goals and Non-Goals

### Goals

- Provide a drop-in JavaScript snippet that any webpage can embed without build-tool dependencies.
- Capture events reliably, including on page unload, with minimal performance impact on the host page.
- Store structured event data in MongoDB in a schema optimized for the queries the dashboard requires.
- Expose a REST + WebSocket API covering all dashboard data needs.
- Deliver a React dashboard with sessions, heatmap, session replay, funnel, and live feed views.
- Detect rage clicks and dead clicks automatically and surface them as first-class signals.
- Generate AI-powered natural-language summaries of individual session journeys.
- Ship with Docker Compose so the entire stack starts with one command.

### Non-Goals

- Full DOM snapshot replay (rrweb-style) is out of scope; mouse-path replay is sufficient for this version.
- Cross-device session stitching (linking a logged-in user across mobile and desktop) is not in scope.
- A/B testing or experimentation features are not in scope.
- Authentication and multi-tenant access control are not in scope for this assignment; the API is assumed to be internal.
- GDPR/CCPA consent management UI is noted as a future concern but not built here.

---

## 4. User Personas

### 4.1 Product Manager — "Priya"

Priya owns the conversion funnel for a mid-size D2C brand. She checks the dashboard weekly to understand where users drop off and which pages generate rage clicks. She is non-technical and needs the heatmap and funnel views to be immediately readable without configuration.

**Primary interactions:** Heatmap view, funnel view, metrics overview cards.

### 4.2 Frontend Engineer — "Arjun"

Arjun embeds the tracking snippet on new pages and occasionally reviews rage-click reports to identify broken UI elements. He cares that the snippet is small, has no render-blocking behavior, and does not interfere with the host page's JavaScript.

**Primary interactions:** Tracking snippet, session detail / event journey, rage-click highlights.

### 4.3 CX Analyst — "Sofia"

Sofia investigates individual sessions when a customer reports a confusing experience. She uses session replay and the AI summary to reconstruct the user's journey in under a minute without watching a full recording.

**Primary interactions:** Sessions list, session replay scrubber, AI summary card.

---

## 5. System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Host Webpage                      │
│  <script src="tracker.js">                          │
│   ├── Event listeners (click, scroll, mousemove)    │
│   ├── Event batcher (200ms flush / 10-event cap)    │
│   └── Beacon API fallback on page unload            │
└───────────────────┬─────────────────────────────────┘
                    │ POST /api/events (batch)
                    │ sendBeacon on unload
                    ▼
┌─────────────────────────────────────────────────────┐
│              Node.js / Express Backend               │
│   REST API         WebSocket (Socket.io)             │
│   ├── POST /events  └── /live  (broadcast new events)│
│   ├── GET  /sessions                                 │
│   ├── GET  /sessions/:id/events                      │
│   ├── GET  /heatmap?url=                             │
│   ├── GET  /sessions/:id/replay                      │
│   ├── POST /sessions/:id/summary  (AI)               │
│   ├── POST /funnels                                  │
│   └── GET  /metrics                                  │
└───────────────────┬─────────────────────────────────┘
                    │ Mongoose ODM
                    ▼
┌─────────────────────────────────────────────────────┐
│                    MongoDB                           │
│   Collections: events · sessions · funnels          │
│   Indexes: session_id+timestamp · url+type · TTL    │
└─────────────────────────────────────────────────────┘
                    ▲
┌───────────────────┴─────────────────────────────────┐
│             React Dashboard (Vite)                   │
│   Views: Sessions · Heatmap · Replay · Funnel · Live │
│   Charts: Recharts · Canvas KDE · SVG cursor path    │
└─────────────────────────────────────────────────────┘
```

The backend and frontend are separate processes. In development both run locally; in the Docker Compose setup the backend runs on port 4000 and the frontend (Vite dev server) on port 3000, with a proxy rule forwarding `/api` requests to avoid CORS issues.

---

## 6. Data Models

### 6.1 Event

Every user interaction produces one Event document.

```js
{
  _id:          ObjectId,
  session_id:   String,        // UUID stored in localStorage
  event_type:   String,        // "page_view" | "click" | "scroll_depth"
                               // | "mouse_move" | "rage_click" | "dead_click"
  page_url:     String,        // window.location.href at time of event
  timestamp:    Date,          // ISO 8601, set client-side
  received_at:  Date,          // set server-side on ingestion

  // click, rage_click, dead_click only
  x:            Number,        // viewport-relative px
  y:            Number,
  target_tag:   String,        // e.g. "BUTTON", "A", "DIV"
  target_id:    String,        // element id attribute, if present
  target_class: String,        // first class on the element

  // scroll_depth only
  depth_pct:    Number,        // 25 | 50 | 75 | 100

  // mouse_move only (sampled at 100ms)
  path:         [{ x, y, t }], // array of {x, y, relative_ms}

  // rage_click / dead_click flags
  sub_type:     String         // "rage" | "dead" | null
}
```

**Indexes:**
```js
{ session_id: 1, timestamp: 1 }           // session journey queries
{ page_url: 1, event_type: 1 }            // heatmap queries
{ event_type: 1, sub_type: 1 }            // rage-click reports
{ received_at: 1, expireAfterSeconds: 7776000 } // TTL: 90 days
```

### 6.2 Session

One Session document is upserted per `session_id`. It is updated on every ingested event batch.

```js
{
  _id:           ObjectId,
  session_id:    String,        // matches Event.session_id
  started_at:    Date,          // timestamp of first event
  last_seen_at:  Date,          // timestamp of most recent event
  duration_ms:   Number,        // last_seen_at - started_at
  event_count:   Number,        // total events in session
  page_count:    Number,        // distinct page_url values
  pages_visited: [String],      // ordered, deduplicated
  has_rage_click: Boolean,
  has_dead_click: Boolean,
  bounce:        Boolean,       // event_count <= 1 || duration_ms < 10000
  max_scroll_pct: Number,       // highest scroll_depth seen
  ai_summary:    String | null, // generated on demand
  ai_generated_at: Date | null
}
```

**Indexes:**
```js
{ session_id: 1 }               // unique
{ started_at: -1 }              // sessions list, newest first
{ has_rage_click: 1 }           // rage-click filter
```

### 6.3 Funnel

Analyst-defined conversion funnels.

```js
{
  _id:    ObjectId,
  name:   String,
  steps:  [String],   // ordered array of page_url patterns (exact match or prefix)
  created_at: Date
}
```

---

## 7. Tracking Script Specification

### 7.1 Embedding

```html
<script>
  window.CF_CONFIG = { endpoint: 'https://your-backend.com' };
</script>
<script src="/tracker.js" defer></script>
```

The script is a single self-contained IIFE with no external dependencies. It must not define globals beyond `window.CF` and must not use `document.write`.

### 7.2 Session Identity

On first load the script generates a UUID v4 and stores it in `localStorage` under the key `cf_session_id`. The same value is reused for the lifetime of the browser tab. A new value is generated if the stored one is missing or if more than 30 minutes have elapsed since `cf_last_seen` (session timeout).

```js
function getOrCreateSessionId() {
  const stored = localStorage.getItem('cf_session_id');
  const lastSeen = parseInt(localStorage.getItem('cf_last_seen') || '0', 10);
  const expired = Date.now() - lastSeen > 30 * 60 * 1000;
  if (stored && !expired) {
    localStorage.setItem('cf_last_seen', Date.now());
    return stored;
  }
  const id = crypto.randomUUID();
  localStorage.setItem('cf_session_id', id);
  localStorage.setItem('cf_last_seen', Date.now());
  return id;
}
```

### 7.3 Event Capture

| Event | Trigger | Notes |
|---|---|---|
| `page_view` | DOMContentLoaded | Fires once per page load |
| `click` | `document` click (capture phase) | Records `x`, `y`, `target_tag`, `target_id`, `target_class` |
| `scroll_depth` | `window` scroll, debounced 200ms | Fires at 25 / 50 / 75 / 100 % thresholds (once each per session-page combination) |
| `mouse_move` | `window` mousemove, sampled 100ms | Batched into `path` array; not sent as individual events |
| `rage_click` | Detected in click handler | 3+ clicks within 500ms in a 20×20px zone |
| `dead_click` | Detected in click handler | Click on element with no interactive ancestors within 3 levels |

### 7.4 Event Batching

Events accumulate in an in-memory queue. The queue is flushed under any of the following conditions:

- 200ms have elapsed since the last flush (interval-based).
- The queue contains 10 or more events.
- `document.visibilityState` changes to `"hidden"` (tab switch or close).

On visibility change, `navigator.sendBeacon(endpoint, payload)` is used if available; it falls back to a synchronous `XMLHttpRequest` with `async: false` as a last resort. This ensures the final events of a session are not lost on page close.

```js
function flush() {
  if (queue.length === 0) return;
  const payload = JSON.stringify({ events: queue.splice(0) });
  if (document.visibilityState === 'hidden' && navigator.sendBeacon) {
    navigator.sendBeacon(`${config.endpoint}/api/events`, payload);
  } else {
    fetch(`${config.endpoint}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true
    }).catch(() => {}); // fire-and-forget; errors are silently dropped
  }
}
```

### 7.5 Rage Click Detection

```js
const clickHistory = [];
function detectRageClick(x, y) {
  const now = Date.now();
  clickHistory.push({ x, y, t: now });
  // Prune clicks older than 500ms
  const window = clickHistory.filter(c => now - c.t < 500);
  const zone = window.filter(c => Math.abs(c.x - x) < 10 && Math.abs(c.y - y) < 10);
  if (zone.length >= 3) return true;
  return false;
}
```

### 7.6 Dead Click Detection

```js
function isInteractive(el) {
  const interactive = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'LABEL'];
  let current = el;
  for (let i = 0; i < 3; i++) {
    if (!current) break;
    if (interactive.includes(current.tagName)) return true;
    if (current.onclick || current.getAttribute('role') === 'button') return true;
    current = current.parentElement;
  }
  return false;
}
```

---

## 8. Backend API Specification

Base URL: `http://localhost:4000/api`

All responses return `Content-Type: application/json`. Error responses use the shape `{ error: string, details?: any }`.

---

### 8.1 POST /events

Ingest a batch of events from the tracking script.

**Request body:**
```json
{
  "events": [
    {
      "session_id": "uuid",
      "event_type": "click",
      "page_url": "https://shop.example.com/pricing",
      "timestamp": "2026-06-18T10:22:01.445Z",
      "x": 312,
      "y": 540,
      "target_tag": "BUTTON",
      "target_id": "cta-buy",
      "target_class": "btn-primary",
      "sub_type": null
    }
  ]
}
```

**Behavior:**
1. Validate each event with Zod. Drop malformed events; do not reject the entire batch.
2. Bulk-insert valid events into the `events` collection.
3. Upsert the corresponding `sessions` document (update counters, timestamps, flags).
4. Broadcast each valid event over the WebSocket `/live` channel.

**Response:** `202 Accepted`
```json
{ "accepted": 1, "dropped": 0 }
```

---

### 8.2 GET /sessions

Return a paginated list of sessions, newest first.

**Query params:**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Page size (max 100) |
| `rage_only` | bool | false | Filter to sessions with rage clicks |
| `url` | string | — | Filter to sessions that visited this URL |

**Response:** `200 OK`
```json
{
  "sessions": [
    {
      "session_id": "uuid",
      "started_at": "2026-06-18T10:20:00.000Z",
      "duration_ms": 142000,
      "event_count": 34,
      "page_count": 4,
      "has_rage_click": true,
      "bounce": false,
      "max_scroll_pct": 75,
      "ai_summary": null
    }
  ],
  "total": 284,
  "page": 1,
  "pages": 15
}
```

---

### 8.3 GET /sessions/:session_id/events

Return all events for a session in chronological order.

**Response:** `200 OK`
```json
{
  "session_id": "uuid",
  "events": [
    {
      "_id": "...",
      "event_type": "page_view",
      "page_url": "https://shop.example.com/",
      "timestamp": "2026-06-18T10:20:00.000Z"
    }
  ]
}
```

---

### 8.4 GET /sessions/:session_id/replay

Return mouse movement path data for replay, grouped by page URL in chronological order.

**Response:** `200 OK`
```json
{
  "session_id": "uuid",
  "segments": [
    {
      "page_url": "https://shop.example.com/pricing",
      "started_at": "2026-06-18T10:22:00.000Z",
      "path": [
        { "x": 120, "y": 340, "t": 0 },
        { "x": 125, "y": 338, "t": 100 }
      ],
      "clicks": [
        { "x": 312, "y": 540, "t": 4200, "sub_type": "rage" }
      ]
    }
  ]
}
```

---

### 8.5 GET /heatmap

Return all click coordinates for a given page URL, used to render the heatmap on the client.

**Query params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `url` | string | yes | Exact page URL |
| `from` | ISO date | no | Filter by date range start |
| `to` | ISO date | no | Filter by date range end |
| `type` | string | no | `"all"` \| `"rage"` \| `"dead"` (default `"all"`) |

**Response:** `200 OK`
```json
{
  "url": "https://shop.example.com/pricing",
  "total_clicks": 1842,
  "points": [
    { "x": 312, "y": 540, "sub_type": null },
    { "x": 314, "y": 543, "sub_type": "rage" }
  ]
}
```

---

### 8.6 POST /sessions/:session_id/summary

Generate or regenerate the AI summary for a session. Calls the Gemini / Claude API with the session's ordered event list. Stores the result on the session document and returns it.

**Request body:** empty

**Response:** `200 OK`
```json
{
  "session_id": "uuid",
  "summary": "The user landed on the homepage and scrolled to 50% before navigating to /pricing. They clicked the 'Buy now' button three times in quick succession (rage click detected), then moved to /contact where they submitted the enquiry form."
}
```

**AI prompt template (server-side):**
```
You are an analyst summarizing a user session on an e-commerce website.
Given the ordered list of events below, write a 2-3 sentence plain-language
summary of what the user did, noting any rage clicks, dead clicks, or
drop-off points. Be concise and factual. Do not speculate about intent.

Events:
{{events_as_text}}
```

---

### 8.7 GET /metrics

Return aggregate platform metrics for the metrics overview bar.

**Query params:**

| Param | Type | Default | Description |
|---|---|---|---|
| `from` | ISO date | 7 days ago | Start of window |
| `to` | ISO date | now | End of window |

**Response:** `200 OK`
```json
{
  "total_sessions": 1284,
  "total_events": 48220,
  "bounce_rate_pct": 24.3,
  "avg_duration_ms": 134000,
  "avg_events_per_session": 37.6,
  "rage_click_sessions": 142,
  "top_pages": [
    { "url": "https://shop.example.com/pricing", "views": 832 }
  ],
  "top_rage_click_targets": [
    { "target_id": "cta-buy", "count": 94 }
  ]
}
```

---

### 8.8 POST /funnels

Create a funnel definition.

**Request body:**
```json
{
  "name": "Checkout funnel",
  "steps": [
    "https://shop.example.com/",
    "https://shop.example.com/pricing",
    "https://shop.example.com/checkout",
    "https://shop.example.com/success"
  ]
}
```

**Response:** `201 Created` — returns the saved funnel document.

---

### 8.9 GET /funnels/:funnel_id/analysis

Compute conversion and drop-off rates for a funnel.

**Query params:** `from`, `to` (same as `/metrics`).

**Response:** `200 OK`
```json
{
  "funnel_id": "...",
  "name": "Checkout funnel",
  "window": { "from": "...", "to": "..." },
  "steps": [
    { "step": 1, "url": "https://shop.example.com/",        "sessions": 1284, "pct_of_start": 100 },
    { "step": 2, "url": "https://shop.example.com/pricing", "sessions":  832, "pct_of_start": 64.8 },
    { "step": 3, "url": "https://shop.example.com/checkout","sessions":  311, "pct_of_start": 24.2 },
    { "step": 4, "url": "https://shop.example.com/success", "sessions":  188, "pct_of_start": 14.6 }
  ],
  "overall_conversion_pct": 14.6
}
```

---

### 8.10 WebSocket — /live

Socket.io namespace. Clients join on dashboard load. The server broadcasts every accepted event in real time after batch ingestion.

```js
// Server
io.emit('event', eventDocument);

// Client
socket.on('event', (event) => {
  // append to live feed
});
```

---

## 9. Dashboard Feature Specifications

### 9.1 Metrics Overview Bar

Displayed at the top of every view. Pulls from `GET /metrics` with the currently selected date range. Renders six stat cards:

- Total sessions
- Total events
- Bounce rate
- Avg session duration (formatted as `Xm Ys`)
- Rage-click sessions (with warning color if > 10% of total)
- Avg events per session

### 9.2 Sessions View

**List panel (left):**
- Paginated table: session ID (first 8 chars), start time (relative, e.g. "3h ago"), duration, event count, page count.
- Rage-click badge (⚠) if `has_rage_click` is true.
- Filter toggle: "Rage clicks only."
- Clicking a row opens the detail panel.

**Session detail panel (right):**
- AI summary card (with a "Generate summary" button if `ai_summary` is null; shows a loading spinner during generation).
- Chronological event timeline: each event rendered as a row with an icon (🖱 click, 👁 page view, 📜 scroll, ⚠ rage click), the event type, page URL, and relative timestamp.
- Rage-click events highlighted in amber. Dead-click events highlighted in red.
- "Watch replay" button — opens the replay modal.

### 9.3 Heatmap View

**Controls:**
- Page URL selector (dropdown populated from distinct `page_url` values in the events collection).
- Date range picker.
- Click type filter: All / Rage only / Dead only.

**Canvas rendering:**
- A 2D canvas element sized to match a standard 1280×800 viewport.
- For each click point, paint a radial gradient centered at `(x, y)` with radius 30px, hot color at center, transparent at edge.
- Composite all gradients; map the resulting density field to a four-stop color ramp: transparent → blue → green → yellow → red.
- Rage clicks are overlaid as small amber rings after the density layer.

**KDE implementation (client-side):**
```js
function renderHeatmap(ctx, points, width, height) {
  const offscreen = new OffscreenCanvas(width, height);
  const octx = offscreen.getContext('2d');
  octx.globalCompositeOperation = 'lighter';

  for (const { x, y } of points) {
    const grad = octx.createRadialGradient(x, y, 0, x, y, 30);
    grad.addColorStop(0,   'rgba(255,0,0,0.12)');
    grad.addColorStop(1,   'rgba(255,0,0,0)');
    octx.fillStyle = grad;
    octx.beginPath();
    octx.arc(x, y, 30, 0, Math.PI * 2);
    octx.fill();
  }

  // Map density to RGBA via ImageData
  const imageData = octx.getImageData(0, 0, width, height);
  // ... colour ramp mapping ...
  ctx.putImageData(imageData, 0, 0);
}
```

### 9.4 Session Replay View

Opens as a modal with a full-width canvas.

**Playback:**
- A cursor SVG (12×12px arrow) animates along the recorded mouse path, interpolating linearly between samples.
- Clicks are shown as ripple circles expanding from the click point and fading out over 300ms.
- Rage clicks render a triple-ripple in amber.
- Playback speed selector: 1× / 2× / 4×.
- A scrubber timeline at the bottom maps to the session duration. The user can click any point to seek.
- Page changes are shown as full-canvas fade transitions with the new URL overlaid for 1 second.

**Implementation approach:**
```js
function startReplay(segment, canvas, speed = 1) {
  const ctx = canvas.getContext('2d');
  const path = segment.path;
  let frame = 0;

  function tick() {
    if (frame >= path.length) return;
    const { x, y } = path[frame];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCursor(ctx, x, y);
    frame++;
    setTimeout(tick, (100 / speed)); // 100ms between samples / speed multiplier
  }
  tick();
}
```

### 9.5 Funnel View

- Funnel builder: ordered list of URL inputs with add/remove controls.
- "Analyze" button calls `GET /funnels/:id/analysis`.
- Results rendered as a stepped horizontal bar chart (Recharts) where each bar's width is proportional to sessions at that step.
- Drop-off percentage between each step shown in red above the gap.
- Overall conversion displayed as a large stat below the chart.

### 9.6 Live Event Feed

A fixed sidebar panel on the right of the dashboard. Connects to the WebSocket on mount.

- Displays the last 50 events as a scrolling list, newest at top.
- Each row: event type icon · session ID (8 chars) · page URL (truncated to 30 chars) · timestamp (HH:MM:SS).
- Rage-click events pulse in amber for 2 seconds on arrival.
- A connection status indicator (green dot = connected, red = reconnecting) in the panel header.
- Toggle to pause / resume the feed without disconnecting the socket.

---

## 10. Enhanced Features

### 10.1 Rage Click and Dead Click Detection

Rage clicks and dead clicks are surfaced as first-class event types (not just metadata) so they can be queried independently. The `/metrics` endpoint reports the top rage-click targets by `target_id`. The sessions list shows a visual badge. The heatmap overlays rage clicks as a separate layer. This turns a raw click stream into a UX defect detection tool.

### 10.2 Scroll Depth Tracking

The tracking script fires `scroll_depth` events at 25%, 50%, 75%, and 100% thresholds. Each threshold fires at most once per page-URL per session. The session document stores `max_scroll_pct` as a summary field. In the session detail view, a horizontal progress bar visualizes how far the user scrolled on each page they visited.

### 10.3 AI Session Summaries

The AI summary feature calls an LLM (Gemini Flash or Claude Sonnet) with the session's event list formatted as prose and receives a 2–3 sentence natural-language summary. The prompt instructs the model to mention rage clicks, dead clicks, scroll depth, and page transitions without speculating on intent.

This is generated on demand (not automatically for every session) to manage API cost. The result is stored in MongoDB and displayed in the session detail panel. A cached summary is served if one already exists; a "Regenerate" button forces a fresh call.

### 10.4 KDE Heatmap

The heatmap uses kernel density estimation rather than raw dot rendering. Each click contributes a Gaussian kernel to an offscreen canvas using the `lighter` composite operation. The resulting density field is colour-mapped to a four-stop ramp. This produces a smooth, visually intuitive heat gradient instead of a cloud of opaque dots — the same technique used by Hotjar and FullStory.

### 10.5 Session Replay

Mouse positions sampled at 100ms intervals are stored in `mouse_move` event documents as a `path` array. The `/sessions/:id/replay` endpoint reassembles these into ordered segments per page URL. On the client, a requestAnimationFrame loop interpolates the cursor's position between samples and renders clicks as expanding ripple circles. This provides a lightweight approximation of session replay without full DOM snapshotting.

### 10.6 Funnel Analysis

The funnel analysis engine queries the `sessions` collection for all sessions that contain at least one event with each step URL, in order. The aggregation pipeline uses `$lookup` to join event documents, `$group` to count matching sessions per step, and `$project` to compute percentage-of-start values. Funnels are saved so they can be reanalyzed across different date ranges.

---

## 11. Non-Functional Requirements

### 11.1 Performance

- The tracking script must be under 8 KB minified and gzipped.
- The script must not block the main thread. All event listeners use passive mode where applicable.
- The `POST /events` endpoint must respond within 100ms at p95 for batches of up to 50 events.
- MongoDB queries for session lists must complete within 50ms. All queries are backed by an index.

### 11.2 Reliability

- The Beacon API fallback ensures events are not dropped on page close.
- The event batcher queues events in memory and retries failed flushes once with a 1-second delay.
- The server validates all incoming event payloads with Zod and drops malformed events without rejecting the batch.

### 11.3 Developer Experience

- `docker compose up` starts the full stack (MongoDB + backend + frontend) with a single command.
- A seed script (`npm run seed`) populates 20 synthetic sessions with varied event types for immediate dashboard testing.
- Environment configuration is managed via `.env` files with a committed `.env.example`.
- The backend emits structured JSON logs (using `pino`) with request ID, duration, and status code.

### 11.4 Code Quality

- The backend is written in TypeScript with strict mode enabled.
- The React frontend is TypeScript with ESLint and Prettier configured.
- All API request and response shapes are typed and validated with Zod on the server and inferred on the client.
- Unit tests cover the rage-click detector, dead-click detector, and scroll-depth threshold logic.

---

## 12. Implementation Phases

### Phase 1 — Core (Days 1–2)

- [ ] Tracking script: `page_view`, `click`, session identity, batching, Beacon API.
- [ ] `POST /events` endpoint with Zod validation and MongoDB bulk insert.
- [ ] Session upsert logic.
- [ ] `GET /sessions` and `GET /sessions/:id/events`.
- [ ] React app scaffold: sessions list + event timeline.

### Phase 2 — Heatmap and Enhanced Tracking (Day 3)

- [ ] Scroll depth tracking in the script.
- [ ] Rage click and dead click detection in the script.
- [ ] `GET /heatmap` endpoint.
- [ ] Mouse movement sampling and storage.
- [ ] Canvas KDE heatmap component.
- [ ] Rage-click badges in sessions list.

### Phase 3 — Replay, Live Feed, and AI (Day 4)

- [ ] `GET /sessions/:id/replay` endpoint.
- [ ] Session replay canvas component with scrubber.
- [ ] Socket.io integration (server broadcast + client feed).
- [ ] `POST /sessions/:id/summary` AI endpoint.
- [ ] AI summary card in session detail.

### Phase 4 — Funnel, Metrics, and Polish (Day 5)

- [ ] Funnel builder and `GET /funnels/:id/analysis`.
- [ ] Funnel chart component (Recharts).
- [ ] `GET /metrics` endpoint.
- [ ] Metrics overview bar.
- [ ] MongoDB indexes and TTL.
- [ ] Docker Compose + seed script.
- [ ] TypeScript strict mode, ESLint, Prettier.
- [ ] README with architecture diagram and design decisions.

---

## 13. Design Decisions

### Why MongoDB over PostgreSQL

Events have a flexible, heterogeneous schema: click events carry `x`, `y`, and `target_*` fields; scroll events carry `depth_pct`; mouse-move events carry a `path` array. A document store accommodates this variance without null columns or a normalised child table per event type. MongoDB's aggregation pipeline also makes the funnel analysis query concise. The trade-off is weaker relational integrity — acceptable here because sessions are append-heavy and never updated except to increment counters.

### Why event batching instead of per-event requests

A user on a typical page generates 5–20 events per minute. Sending individual HTTP requests for each would create 5–20× more network round-trips, prevent the browser from using HTTP/2 multiplexing efficiently, and consume unnecessary battery on mobile. Batching reduces network overhead by roughly 10× at the cost of up to 200ms of additional latency before an event is visible on the server — a trade-off that is acceptable for an analytics system.

### Why the Beacon API matters

The browser does not guarantee that `fetch` or `XHR` calls issued during the `visibilitychange → hidden` event will complete before the page is destroyed. `navigator.sendBeacon` is specifically designed for this scenario and is guaranteed to complete even after the page is unloaded. Without it, the final events of every session (including the last page view and any clicks just before leaving) are silently dropped.

### Why KDE heatmap instead of dots

Dot rendering is visually noisy above a few hundred clicks — overlapping dots obscure each other and make density differences hard to perceive. Kernel density estimation produces a smooth gradient field where the human eye can immediately identify hot zones. The implementation requires no server-side computation; the browser renders it from raw coordinate data using OffscreenCanvas and `globalCompositeOperation: 'lighter'`.

### Why AI summaries are on-demand, not automatic

Generating a summary for every session via an LLM API would incur unbounded cost as session volume grows. Summaries are most valuable for sessions that have been selected for investigation — the analyst has already decided to look more closely. On-demand generation keeps cost proportional to actual usage while caching ensures the same session is not summarized twice unless explicitly regenerated.

### What we'd build next with more time

- **Full DOM snapshot replay** using rrweb or a custom mutation observer recorder — captures the actual page state at each point rather than just cursor position.
- **Alerting** — notify via webhook when rage-click rate on a specific element exceeds a threshold.
- **Funnel A/B comparison** — compare conversion rates between two date ranges or two URL variants.
- **User identification** — accept an optional `user_id` payload from the tracking script to stitch anonymous sessions to known users post-login.
- **GDPR consent gate** — wrap the tracking script initialization in a consent check and provide an opt-out API.

---

## 14. Success Metrics

The following metrics will be used to evaluate whether the platform is functioning correctly during demo and review.

| Metric | Target |
|---|---|
| Event ingestion latency (p95) | < 100ms |
| Session list query time | < 50ms |
| Heatmap query time (10k points) | < 200ms |
| Tracker script size (gzipped) | < 8 KB |
| AI summary generation time | < 5 seconds |
| Dashboard initial load (Lighthouse) | > 85 performance score |
| Seed script sessions | ≥ 20 sessions, ≥ 5 with rage clicks |
| Unit test coverage (core logic) | > 80% |

---

## 15. Future Roadmap

| Priority | Feature | Rationale |
|---|---|---|
| P0 | rrweb DOM snapshot replay | True session replay without limitations of cursor-path approach |
| P0 | User identification API | Link anonymous sessions to CRM records post-login |
| P1 | Alerting and anomaly detection | Proactive notification of UX defects |
| P1 | Funnel A/B comparison | Date-range and variant comparison for funnel optimization |
| P1 | GDPR/CCPA consent management | Compliance requirement for EU/California users |
| P2 | Custom event tracking SDK | Allow product teams to fire arbitrary named events |
| P2 | Cohort analysis | Compare behavior across segments (source, device, returning vs new) |
| P2 | Export to CSV / BigQuery | Data portability for analysts who prefer SQL |
| P3 | Browser extension for visual funnel builder | Click-to-select page elements to define funnel steps without editing URLs |

---

*End of document.*