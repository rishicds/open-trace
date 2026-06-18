export const SOCKET_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : 'https://open-trace.onrender.com');
const API_BASE = `${SOCKET_URL}/api`;

export interface SessionData {
  _id: string;
  session_id: string;
  started_at: string;
  last_seen_at: string;
  duration_ms: number;
  event_count: number;
  page_count: number;
  pages_visited: string[];
  has_rage_click: boolean;
  has_dead_click: boolean;
  bounce: boolean;
  max_scroll_pct: number;
  ai_summary: string | null;
  ai_generated_at: string | null;
  browser?: string | null;
  os?: string | null;
  device?: string | null;
  city?: string | null;
  country?: string | null;
}

export interface EventData {
  _id: string;
  session_id: string;
  event_type: string;
  page_url: string;
  timestamp: string;
  x?: number;
  y?: number;
  target_tag?: string;
  target_id?: string;
  target_class?: string;
  depth_pct?: number;
  path?: Array<{ x: number; y: number; t: number }>;
  sub_type?: string | null;
}

export interface MetricsData {
  total_sessions: number;
  total_events: number;
  bounce_rate_pct: number;
  avg_duration_ms: number;
  avg_events_per_session: number;
  rage_click_sessions: number;
  top_pages: Array<{ url: string; views: number }>;
  top_rage_click_targets: Array<{ target_id: string; count: number }>;
}

export interface HeatmapPoint {
  x: number;
  y: number;
  sub_type: string | null;
}

export interface ReplaySegment {
  page_url: string;
  started_at: string;
  path: Array<{ x: number; y: number; t: number }>;
  clicks: Array<{ x: number; y: number; t: number; sub_type: string | null }>;
}

export interface FunnelData {
  _id: string;
  name: string;
  steps: string[];
  created_at: string;
}

export interface FunnelAnalysis {
  funnel_id: string;
  name: string;
  window: { from: string; to: string };
  steps: Array<{ step: number; url: string; sessions: number; pct_of_start: number }>;
  overall_conversion_pct: number;
}

// ─── Sessions ──────────────────────────────────────────────────────
export async function fetchSessions(page = 1, limit = 20, rageOnly = false, from?: string, to?: string): Promise<{
  sessions: SessionData[];
  total: number;
  page: number;
  pages: number;
}> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (rageOnly) params.set('rage_only', 'true');
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const res = await fetch(`${API_BASE}/sessions?${params}`);
  return res.json();
}

export async function fetchSessionEvents(sessionId: string): Promise<{ session_id: string; events: EventData[] }> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/events`);
  return res.json();
}

export async function fetchSessionReplay(sessionId: string): Promise<{ session_id: string; segments: ReplaySegment[] }> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/replay`);
  return res.json();
}

export async function generateSessionSummary(sessionId: string, regenerate = false): Promise<{ session_id: string; summary: string }> {
  const params = regenerate ? '?regenerate=true' : '';
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/summary${params}`, { method: 'POST' });
  return res.json();
}

// ─── Metrics ───────────────────────────────────────────────────────
export async function fetchMetrics(from?: string, to?: string): Promise<MetricsData> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const res = await fetch(`${API_BASE}/metrics?${params}`);
  return res.json();
}

// ─── Heatmap ───────────────────────────────────────────────────────
export async function fetchHeatmap(url: string, type = 'all', from?: string, to?: string): Promise<{ url: string; total_clicks: number; points: HeatmapPoint[] }> {
  const params = new URLSearchParams({ url, type });
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const res = await fetch(`${API_BASE}/heatmap?${params}`);
  return res.json();
}

export async function fetchDistinctUrls(): Promise<{ urls: string[] }> {
  const res = await fetch(`${API_BASE}/heatmap/urls`);
  return res.json();
}

// ─── Funnels ───────────────────────────────────────────────────────
export async function fetchFunnels(): Promise<{ funnels: FunnelData[] }> {
  const res = await fetch(`${API_BASE}/funnels`);
  return res.json();
}

export async function createFunnel(name: string, steps: string[]): Promise<FunnelData> {
  const res = await fetch(`${API_BASE}/funnels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, steps }),
  });
  return res.json();
}

export async function analyzeFunnel(funnelId: string): Promise<FunnelAnalysis> {
  const res = await fetch(`${API_BASE}/funnels/${funnelId}/analysis`);
  return res.json();
}
