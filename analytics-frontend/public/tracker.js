/**
 * CausalFunnel Tracker — Lightweight user behavior analytics script
 * Self-contained IIFE, no external dependencies.
 * 
 * Captures: page_view, click, scroll_depth, mouse_move, rage_click, dead_click
 * Features: session identity, event batching (200ms/10 events), Beacon API fallback
 * 
 * Usage:
 *   <script>window.CF_CONFIG = { endpoint: 'http://localhost:4000' };</script>
 *   <script src="/tracker.js" defer></script>
 */
(function() {
  'use strict';

  var config = window.CF_CONFIG || {};
  var endpoint = config.endpoint || '';

  if (!endpoint) {
    console.warn('[CF Tracker] No endpoint configured. Set window.CF_CONFIG = { endpoint: "..." }');
    return;
  }

  // ─── Session Identity ───────────────────────────────────────────────
  function getOrCreateSessionId() {
    var stored = localStorage.getItem('cf_session_id');
    var lastSeen = parseInt(localStorage.getItem('cf_last_seen') || '0', 10);
    var expired = Date.now() - lastSeen > 30 * 60 * 1000; // 30 min timeout
    if (stored && !expired) {
      localStorage.setItem('cf_last_seen', String(Date.now()));
      return stored;
    }
    var id = crypto.randomUUID();
    localStorage.setItem('cf_session_id', id);
    localStorage.setItem('cf_last_seen', String(Date.now()));
    return id;
  }

  var sessionId = getOrCreateSessionId();
  var queue = [];

  function normalizePageUrl(href) {
    try {
      var u = new URL(href);
      u.hash = '';
      u.search = '';
      var pathname = u.pathname || '/';
      if (pathname.length > 1 && pathname.charAt(pathname.length - 1) === '/') {
        pathname = pathname.slice(0, -1);
      }
      return u.origin + pathname;
    } catch (e) {
      return href;
    }
  }

  // ─── Event Queue ────────────────────────────────────────────────────
  function enqueue(event) {
    queue.push({
      session_id: sessionId,
      timestamp: new Date().toISOString(),
      page_url: normalizePageUrl(window.location.href),
      event_type: event.event_type,
      x: event.x,
      y: event.y,
      target_tag: event.target_tag,
      target_id: event.target_id,
      target_class: event.target_class,
      depth_pct: event.depth_pct,
      path: event.path,
      sub_type: event.sub_type || null,
    });

    localStorage.setItem('cf_last_seen', String(Date.now()));

    if (queue.length >= 10) {
      flush();
    }
  }

  function flush() {
    if (queue.length === 0) return;
    var batch = queue.splice(0);
    var payload = JSON.stringify({ events: batch });

    if (document.visibilityState === 'hidden' && navigator.sendBeacon) {
      navigator.sendBeacon(
        endpoint + '/api/events',
        new Blob([payload], { type: 'application/json' })
      );
    } else {
      fetch(endpoint + '/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(function() {}); // fire-and-forget
    }
  }

  // Flush every 200ms
  setInterval(flush, 200);

  // ─── Page View ──────────────────────────────────────────────────────
  function trackPageView() {
    enqueue({ event_type: 'page_view' });
  }

  // ─── Click Tracking + Rage Click Detection ─────────────────────────
  var clickHistory = [];

  function detectRageClick(x, y) {
    var now = Date.now();
    clickHistory.push({ x: x, y: y, t: now });
    // Prune clicks older than 500ms
    while (clickHistory.length > 0 && now - clickHistory[0].t > 500) {
      clickHistory.shift();
    }
    var zone = clickHistory.filter(function(c) {
      return Math.abs(c.x - x) < 10 && Math.abs(c.y - y) < 10;
    });
    return zone.length >= 3;
  }

  // ─── Dead Click Detection ──────────────────────────────────────────
  function isInteractive(el) {
    var interactive = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'LABEL'];
    var current = el;
    for (var i = 0; i < 3; i++) {
      if (!current) break;
      if (interactive.indexOf(current.tagName) !== -1) return true;
      if (current.onclick || current.getAttribute('role') === 'button') return true;
      current = current.parentElement;
    }
    return false;
  }

  document.addEventListener('click', function(e) {
    var x = e.clientX;
    var y = e.clientY;
    var target = e.target;
    var tag = target.tagName || '';
    var id = target.id || '';
    var cls = (target.className && typeof target.className === 'string')
      ? target.className.split(' ')[0] || ''
      : '';

    // Check for rage click
    var isRage = detectRageClick(x, y);
    if (isRage) {
      enqueue({
        event_type: 'rage_click',
        x: x, y: y,
        target_tag: tag, target_id: id, target_class: cls,
        sub_type: 'rage',
      });
    }

    // Check for dead click
    var isDead = !isInteractive(target);
    if (isDead && !isRage) {
      enqueue({
        event_type: 'dead_click',
        x: x, y: y,
        target_tag: tag, target_id: id, target_class: cls,
        sub_type: 'dead',
      });
    }

    // Always enqueue the base click event
    enqueue({
      event_type: 'click',
      x: x, y: y,
      target_tag: tag, target_id: id, target_class: cls,
      sub_type: isRage ? 'rage' : (isDead ? 'dead' : null),
    });
  }, true); // capture phase

  // ─── Scroll Depth Tracking ─────────────────────────────────────────
  var scrollThresholds = {};
  var scrollPageKey = window.location.href;

  function resetScrollThresholds() {
    scrollThresholds = { 25: false, 50: false, 75: false, 100: false };
    scrollPageKey = window.location.href;
  }
  resetScrollThresholds();

  function checkScrollDepth() {
    // Reset if page changed (SPA navigation)
    if (window.location.href !== scrollPageKey) {
      resetScrollThresholds();
    }

    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    var docHeight = Math.max(
      document.body.scrollHeight || 0,
      document.documentElement.scrollHeight || 0,
      document.body.offsetHeight || 0,
      document.documentElement.offsetHeight || 0
    );
    var winHeight = window.innerHeight;

    if (docHeight <= winHeight) return; // page doesn't scroll

    var scrollPct = Math.round(((scrollTop + winHeight) / docHeight) * 100);

    var thresholds = [25, 50, 75, 100];
    for (var i = 0; i < thresholds.length; i++) {
      var threshold = thresholds[i];
      if (scrollPct >= threshold && !scrollThresholds[threshold]) {
        scrollThresholds[threshold] = true;
        enqueue({
          event_type: 'scroll_depth',
          depth_pct: threshold,
        });
      }
    }
  }

  var scrollDebounce = null;
  window.addEventListener('scroll', function() {
    clearTimeout(scrollDebounce);
    scrollDebounce = setTimeout(checkScrollDepth, 200);
  }, { passive: true });

  // ─── Mouse Movement Sampling ───────────────────────────────────────
  var mousePath = [];
  var mouseStartTime = Date.now();
  var lastMouseSample = 0;

  window.addEventListener('mousemove', function(e) {
    var now = Date.now();
    if (now - lastMouseSample < 100) return; // sample every 100ms
    lastMouseSample = now;

    mousePath.push({
      x: e.clientX,
      y: e.clientY,
      t: now - mouseStartTime,
    });

    // Send batch every 20 samples
    if (mousePath.length >= 20) {
      enqueue({
        event_type: 'mouse_move',
        path: mousePath.splice(0),
      });
    }
  }, { passive: true });

  // ─── Visibility Change — Flush on tab switch / close ───────────────
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
      // Flush remaining mouse path
      if (mousePath.length > 0) {
        enqueue({
          event_type: 'mouse_move',
          path: mousePath.splice(0),
        });
      }
      flush();
    }
  });

  // ─── Init ──────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackPageView);
  } else {
    trackPageView();
  }

  // Expose minimal API
  window.CF = {
    getSessionId: function() { return sessionId; },
  };
})();
