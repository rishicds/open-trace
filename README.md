# Trace Analytics Platform

It is a full-stack user analytics application that tracks interactions on a webpage (page views, clicks, rage clicks, scroll depth, etc.) and visualizes them on a comprehensive React dashboard.

## Overview

The platform consists of:
1. **Frontend Tracker Script**: A lightweight JavaScript library (`tracker.js`) dropped into any target site. It batches events and uses `navigator.sendBeacon` for reliable off-loading.
2. **Backend API (Node.js/Express)**: A robust REST & WebSocket API that processes incoming events, generates user sessions, tracks metrics, and broadcasts live data.
3. **MongoDB Database**: Uses `mongoose` with highly optimized aggregation pipelines for metrics and session replay generation.
4. **Dashboard (React/Vite)**: A rich, beautiful, interactive web application featuring:
   - **Metrics Overview**: High-level KPIs with custom time filters (1h, 24h, 7d, custom).
   - **Session Replay**: A full visual recreation of a user's journey using the recorded coordinates and clicks.
   - **Interaction Heatmaps**: Visual overlay of clicks (and rage/dead clicks) on specific pages.
   - **Conversion Funnels**: Track drop-offs across specific URL flows.
   - **Live Stream**: Watch incoming events stream directly into the dashboard in real-time.

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Socket.io-client
- **Backend**: Node.js, Express, Socket.io, Mongoose, Zod (for validation), UAParser & GeoIP (for session metadata enrichment)
- **Database**: MongoDB

## Setup Instructions

1. **Clone the repository**
2. **Install dependencies**
   ```bash
   cd analytics-backend
   npm install
   
   cd ../analytics-frontend
   npm install
   
   cd ../test-site
   npm install
   ```

3. **Configure Environment Variables**
   In `analytics-backend/`, copy `.env.example` to `.env` and set your local MongoDB connection string:
   ```env
   PORT=4000
   MONGODB_URI=mongodb://localhost:27017/trace
   ```

4. **Start the Services**
   Open three terminal windows:
   ```bash
   # Terminal 1: Backend
   cd analytics-backend
   npm run dev

   # Terminal 2: Dashboard Frontend
   cd analytics-frontend
   npm run dev

   # Terminal 3: Test Site (Generates traffic)
   cd test-site
   npm run dev
   ```

5. **Usage**
   - Browse the test site at `http://localhost:5174` (or whichever port Vite allocates).
   - Click around, resize, scroll, and rapidly click elements (to trigger rage clicks).
   - Open the Dashboard at `http://localhost:5173` to see your sessions, view heatmaps, and watch the live stream!

## Assumptions & Trade-offs

1. **Session Grouping**: A session is defined simply by a `session_id` generated on the client and stored in `localStorage`. If a user clears their storage, they get a new session. We assume that sessions end after an extended period of inactivity, which could be enforced by setting an expiry on the localStorage key.
2. **Database Scalability**: Events are bulk-inserted and sessions are upserted. In a true enterprise environment, we would place a message queue (like Kafka or Redis) in front of the MongoDB ingestion to prevent write bottlenecks during massive traffic spikes.
3. **Time Filters**: For simplicity, time filters use local browser time. In a multi-timezone deployment, we would strictly standardize on UTC for both the UI date pickers and backend aggregations.
