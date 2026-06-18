/**
 * Seed script — Generates 20+ synthetic sessions with varied event types
 * Run: npm run seed
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { Event } from './models/Event.js';
import { Session } from './models/Session.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trace';

const PAGES = [
  'http://localhost:5173/',
  'http://localhost:5173/features',
  'http://localhost:5173/pricing',
  'http://localhost:5173/signup',
  'http://localhost:5173/dashboard',
  'http://localhost:5173/reports',
  'http://localhost:5173/settings',
];

const TARGETS = [
  { tag: 'BUTTON', id: 'cta-signup', cls: 'btn-primary' },
  { tag: 'A', id: 'nav-pricing', cls: 'nav-link' },
  { tag: 'BUTTON', id: 'cta-buy', cls: 'btn-primary' },
  { tag: 'INPUT', id: 'email-input', cls: 'form-input' },
  { tag: 'DIV', id: 'hero-image', cls: 'hero' },
  { tag: 'SPAN', id: '', cls: 'text-content' },
  { tag: 'A', id: 'nav-features', cls: 'nav-link' },
  { tag: 'BUTTON', id: 'submit-form', cls: 'btn-submit' },
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

async function seed() {
  await mongoose.connect(MONGODB_URI, {
    dbName: process.env.MONGODB_DATABASE || 'trace',
  });
  console.log('[Seed] Connected to MongoDB');

  // Clear existing data
  await Event.deleteMany({});
  await Session.deleteMany({});
  console.log('[Seed] Cleared existing data');

  const numSessions = 25;
  let totalEvents = 0;

  for (let s = 0; s < numSessions; s++) {
    const sessionId = crypto.randomUUID();
    const sessionStart = new Date(Date.now() - randomInt(1, 168) * 60 * 60 * 1000); // within last week
    const numPages = randomInt(1, 5);
    const hasRage = s < 7; // first 7 sessions have rage clicks
    const hasDead = s < 10; // first 10 sessions have dead clicks
    const events: any[] = [];
    let currentTime = sessionStart.getTime();
    const pagesVisited: string[] = [];
    let maxScroll = 0;

    for (let p = 0; p < numPages; p++) {
      const page = PAGES[p % PAGES.length]!;
      pagesVisited.push(page);

      // page_view
      events.push({
        session_id: sessionId,
        event_type: 'page_view',
        page_url: page,
        timestamp: new Date(currentTime),
        received_at: new Date(currentTime + 50),
      });
      currentTime += randomInt(500, 2000);

      // Clicks on this page
      const numClicks = randomInt(2, 8);
      for (let c = 0; c < numClicks; c++) {
        const target = randomChoice(TARGETS);
        const x = randomInt(50, 1230);
        const y = randomInt(50, 750);

        events.push({
          session_id: sessionId,
          event_type: 'click',
          page_url: page,
          timestamp: new Date(currentTime),
          received_at: new Date(currentTime + 50),
          x, y,
          target_tag: target.tag,
          target_id: target.id,
          target_class: target.cls,
          sub_type: null,
        });
        currentTime += randomInt(300, 3000);
      }

      // Rage clicks (on qualifying sessions)
      if (hasRage && p === 0) {
        const rageTarget = randomChoice(TARGETS);
        const rx = randomInt(200, 600);
        const ry = randomInt(200, 600);
        for (let r = 0; r < 4; r++) {
          events.push({
            session_id: sessionId,
            event_type: 'rage_click',
            page_url: page,
            timestamp: new Date(currentTime),
            received_at: new Date(currentTime + 50),
            x: rx + randomInt(-5, 5),
            y: ry + randomInt(-5, 5),
            target_tag: rageTarget.tag,
            target_id: rageTarget.id,
            target_class: rageTarget.cls,
            sub_type: 'rage',
          });
          currentTime += randomInt(50, 150);
        }
      }

      // Dead clicks (on qualifying sessions)
      if (hasDead && p === 1) {
        events.push({
          session_id: sessionId,
          event_type: 'dead_click',
          page_url: page,
          timestamp: new Date(currentTime),
          received_at: new Date(currentTime + 50),
          x: randomInt(100, 1000),
          y: randomInt(100, 700),
          target_tag: 'DIV',
          target_id: '',
          target_class: 'static-content',
          sub_type: 'dead',
        });
        currentTime += randomInt(500, 2000);
      }

      // Scroll depth
      const scrollThresholds = [25, 50, 75, 100];
      const maxThresholdIndex = randomInt(0, 3);
      for (let t = 0; t <= maxThresholdIndex; t++) {
        const threshold = scrollThresholds[t]!;
        events.push({
          session_id: sessionId,
          event_type: 'scroll_depth',
          page_url: page,
          timestamp: new Date(currentTime),
          received_at: new Date(currentTime + 50),
          depth_pct: threshold,
        });
        maxScroll = Math.max(maxScroll, threshold);
        currentTime += randomInt(1000, 5000);
      }

      // Mouse movements
      const numMoveSegments = randomInt(1, 3);
      for (let m = 0; m < numMoveSegments; m++) {
        const path = [];
        let mx = randomInt(100, 500);
        let my = randomInt(100, 500);
        const pathLength = randomInt(5, 15);
        for (let i = 0; i < pathLength; i++) {
          mx += randomInt(-30, 30);
          my += randomInt(-30, 30);
          path.push({ x: Math.max(0, mx), y: Math.max(0, my), t: i * 100 });
        }
        events.push({
          session_id: sessionId,
          event_type: 'mouse_move',
          page_url: page,
          timestamp: new Date(currentTime),
          received_at: new Date(currentTime + 50),
          path,
        });
        currentTime += randomInt(2000, 5000);
      }

      currentTime += randomInt(3000, 15000);
    }

    // Insert events
    await Event.insertMany(events);
    totalEvents += events.length;

    // Create session document
    const sessionEnd = new Date(currentTime);
    const duration = sessionEnd.getTime() - sessionStart.getTime();
    const uniquePages = [...new Set(pagesVisited)];

    await Session.create({
      session_id: sessionId,
      started_at: sessionStart,
      last_seen_at: sessionEnd,
      duration_ms: duration,
      event_count: events.length,
      page_count: uniquePages.length,
      pages_visited: uniquePages,
      has_rage_click: hasRage,
      has_dead_click: hasDead,
      bounce: events.length <= 1 || duration < 10000,
      max_scroll_pct: maxScroll,
    });

    console.log(`[Seed] Session ${s + 1}/${numSessions}: ${sessionId.slice(0, 8)} — ${events.length} events, ${uniquePages.length} pages${hasRage ? ' [RAGE]' : ''}${hasDead ? ' [DEAD]' : ''}`);
  }

  console.log(`\n[Seed] Done! Created ${numSessions} sessions with ${totalEvents} total events.`);
  console.log(`[Seed] ${7} sessions have rage clicks, ${10} sessions have dead clicks.`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('[Seed] Error:', err);
  process.exit(1);
});
