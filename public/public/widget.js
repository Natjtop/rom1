/**
 * Replyma Live Chat Widget Loader v2
 * Embed: <script src="https://replyma.com/widget.js" data-workspace-id="YOUR_ID" async></script>
 * Supports legacy protocol (replyma:widget:resize / resizeDone) for existing iframe app.
 * Customization (color, etc.) is loaded inside iframe from /api/v1/widget/settings/:workspaceId.
 */
(function () {
  'use strict';

  var PROTOCOL_VERSION = 1;
  var WIDGET_ORIGIN = 'https://replyma.com';
  var WIDGET_ORIGIN_WWW = 'https://www.replyma.com';
  var isLocal = typeof document !== 'undefined' && (document.location.origin === 'http://localhost:3000' || document.location.origin.indexOf('http://127.0.0.1') === 0);
  var CHILD_ORIGIN = isLocal ? document.location.origin : WIDGET_ORIGIN;
  var MSG_READY = 'replyma:ready';
  var MSG_INIT = 'replyma:init';
  var MSG_SET_STATE = 'replyma:set-state';
  var MSG_STATE_REQUEST = 'replyma:state-request';
  var MSG_STATE_APPLIED = 'replyma:state-applied';
  var MSG_LEGACY_RESIZE = 'replyma:widget:resize';
  var MSG_LEGACY_RESIZE_DONE = 'replyma:widget:resizeDone';
  var MSG_RESIZE_DONE = 'replyma:resize-done';
  var ROOT_ID = 'replyma-widget-root';
  var MOUNT_FLAG = '__replymaWidgetMounted';
  var FAILSAFE_MS = 8000;
  var RESIZE_DEBOUNCE_MS = 250;
  var BREAKPOINT_PX = 640;

  var BUTTON_PX = 56;
  var AURA_BLEED_PX = 14;
  var HOVER_SCALE_EXTRA_PX = 4;
  var DESKTOP_INSET_PX = 24;
  var MOBILE_INSET_PX = 0;
  var SHADOW_MARGIN_PX = 18;
  var CLOSED_SIZE_DESKTOP_PX = BUTTON_PX + AURA_BLEED_PX * 2 + 3 + HOVER_SCALE_EXTRA_PX + SHADOW_MARGIN_PX;
  var CLOSED_SIZE_MOBILE_PX = 108;
  /** Match LiveChatWidget embed panel width (380px) + horizontal insets (10px each). */
  var PANEL_CONTENT_WIDTH_PX = 380;
  var EMBED_PANEL_HORIZ_INSET_PX = 10;
  var PANEL_WIDTH_TOTAL_PX = PANEL_CONTENT_WIDTH_PX + EMBED_PANEL_HORIZ_INSET_PX * 2;
  /** Match LiveChatWidget embed: panel above launcher (bottom 98 = 18 inset + 80 launcher slot), height 600/700. */
  var PANEL_CONTENT_HEIGHT_PX = 600;
  var EMBED_PANEL_BOTTOM_OFFSET_PX = 98;
  var PANEL_HEIGHT_TOTAL_PX = PANEL_CONTENT_HEIGHT_PX + EMBED_PANEL_BOTTOM_OFFSET_PX;
  var PANEL_EXPANDED_CONTENT_HEIGHT_PX = 700;
  var PANEL_EXPANDED_WIDTH_PX = 560;
  var PANEL_EXPANDED_HEIGHT_TOTAL_PX = PANEL_EXPANDED_CONTENT_HEIGHT_PX + EMBED_PANEL_BOTTOM_OFFSET_PX;
  var PANEL_EXPANDED_WIDTH_TOTAL_PX = PANEL_EXPANDED_WIDTH_PX + EMBED_PANEL_HORIZ_INSET_PX * 2;
  var PROACTIVE_WIDTH_PX = 380;
  var PROACTIVE_HEIGHT_PX = 220;

  var TRANSITION_DEFAULT = 'opacity 0.2s ease, width 0.24s cubic-bezier(0.22,1,0.36,1), height 0.24s cubic-bezier(0.22,1,0.36,1), border-radius 0.24s cubic-bezier(0.22,1,0.36,1)';
  var TRANSITION_OPEN = 'width 0.08s ease-out, height 0.08s ease-out, border-radius 0.08s ease-out';
  /** No transition on open: avoids "button flies up then back" when iframe resizes (instant size change). */
  var TRANSITION_OPEN_INSTANT = 'none';
  /** Smooth expand: one "all" transition so width/height/border-radius animate in lockstep (same as main page transition-all). */
  var TRANSITION_OPEN_SMOOTH = 'all 0.3s cubic-bezier(0.22,1,0.36,1)';
  /** No transition when closing (used only for loading/initial closed). */
  var TRANSITION_CLOSE_INSTANT = 'none';
  /** Smooth collapse: explicit width+height+border-radius so both dimensions share same timing (avoids height-then-width in iframe). */
  var TRANSITION_CLOSE_SMOOTH = 'width 0.25s cubic-bezier(0.22,1,0.36,1), height 0.25s cubic-bezier(0.22,1,0.36,1), border-radius 0.25s cubic-bezier(0.22,1,0.36,1)';
  /** Only transform: for scale-close so one property animates = no width/height desync in iframe. */
  var TRANSITION_CLOSE_SCALE = 'transform 0.25s cubic-bezier(0.22,1,0.36,1)';

  var ALLOWED_STATES = { loading: 1, closed: 1, proactive: 1, open: 1 };

  function clamp(num, min, max) {
    return Math.max(min, Math.min(max, num));
  }

  function getViewport() {
    var doc = document.documentElement;
    var w = Math.max(doc.clientWidth || 0, window.innerWidth || 0);
    var h = Math.max(doc.clientHeight || 0, window.innerHeight || 0);
    if (typeof window.visualViewport !== 'undefined') {
      var vv = window.visualViewport;
      w = vv.width;
      h = vv.height;
    }
    return { w: w, h: h };
  }

  function getLayout(state, viewport, expanded) {
    var mobile = viewport.w < BREAKPOINT_PX;
    var inset = mobile ? MOBILE_INSET_PX : DESKTOP_INSET_PX;
    if (state === 'loading' || state === 'closed') {
      var size = mobile ? CLOSED_SIZE_MOBILE_PX : CLOSED_SIZE_DESKTOP_PX;
      var closedRadius = mobile ? '999px' : '28px';
      return { w: size, h: size, inset: inset, radius: closedRadius, transition: TRANSITION_CLOSE_SMOOTH, mobile: mobile };
    }
    if (state === 'proactive') {
      var pw = clamp(viewport.w - 8, 240, PROACTIVE_WIDTH_PX);
      return { w: pw, h: PROACTIVE_HEIGHT_PX, inset: inset, radius: '16px', transition: TRANSITION_OPEN_INSTANT, mobile: mobile };
    }
    if (state === 'open') {
      if (mobile) {
        return {
          fullscreen: true,
          w: viewport.w,
          h: viewport.h,
          inset: 0,
          radius: '0',
          transition: 'opacity 0.16s ease',
          mobile: true,
        };
      }
      var panelW = expanded
        ? Math.min(viewport.w - DESKTOP_INSET_PX, PANEL_EXPANDED_WIDTH_TOTAL_PX)
        : Math.min(viewport.w - DESKTOP_INSET_PX, PANEL_WIDTH_TOTAL_PX);
      var panelH = expanded ? PANEL_EXPANDED_HEIGHT_TOTAL_PX : PANEL_HEIGHT_TOTAL_PX;
      return { w: panelW, h: panelH, inset: inset, radius: '24px', transition: TRANSITION_OPEN_SMOOTH, mobile: false };
    }
    return { w: CLOSED_SIZE_DESKTOP_PX, h: CLOSED_SIZE_DESKTOP_PX, inset: DESKTOP_INSET_PX, radius: '999px', transition: TRANSITION_DEFAULT, mobile: false };
  }

  function applyLayout(root, state, layout) {
    root.style.removeProperty('width');
    root.style.removeProperty('height');
    root.style.removeProperty('transition');
    root.style.removeProperty('-webkit-transition');
    root.setAttribute('data-state', state);
    root.setAttribute('data-mobile', layout.mobile ? 'true' : 'false');
    root.style.setProperty('--replyma-inset', layout.inset + 'px');
    root.style.setProperty('--replyma-radius', layout.radius);
    root.style.setProperty('--replyma-transition', layout.transition);
    if (layout.fullscreen) {
      root.style.setProperty('--replyma-w', '100%');
      root.style.setProperty('--replyma-h', '100%');
      root.style.setProperty('--replyma-min-w', '100vw');
      root.style.setProperty('--replyma-min-h', '100dvh');
      root.style.setProperty('--replyma-top', '0');
      root.style.setProperty('--replyma-left', '0');
      root.style.setProperty('--replyma-right', '');
      root.style.setProperty('--replyma-bottom', '');
    } else {
      root.style.removeProperty('--replyma-top');
      root.style.removeProperty('--replyma-left');
      root.style.setProperty('--replyma-right', layout.inset + 'px');
      root.style.setProperty('--replyma-bottom', layout.inset + 'px');
      root.style.setProperty('--replyma-w', layout.w + 'px');
      root.style.setProperty('--replyma-h', layout.h + 'px');
      if (state === 'open') {
        root.style.setProperty('--replyma-min-w', layout.w + 'px');
        root.style.setProperty('--replyma-min-h', layout.h + 'px');
      } else {
        root.style.removeProperty('--replyma-min-w');
        root.style.removeProperty('--replyma-min-h');
      }
    }
  }

  var EXPAND_DURATION_MS = 320;
  /** Close by animating only transform:scale so width/height never desync (see docs/WIDGET_IFRAME_CLOSE_ANIMATION_ANALYSIS.md). */
  function closeWithScaleAnimation(root, openW, openH, closedLayout) {
    var closedSize = closedLayout.w;
    var scaleX = closedSize / openW;
    var scaleY = closedSize / openH;

    root.setAttribute('data-state', 'closed');
    root.setAttribute('data-mobile', closedLayout.mobile ? 'true' : 'false');
    root.style.setProperty('--replyma-inset', closedLayout.inset + 'px');
    root.style.setProperty('--replyma-radius', closedLayout.radius);
    root.style.removeProperty('--replyma-min-w');
    root.style.removeProperty('--replyma-min-h');
    root.style.setProperty('--replyma-w', openW + 'px');
    root.style.setProperty('--replyma-h', openH + 'px');
    root.style.setProperty('--replyma-right', closedLayout.inset + 'px');
    root.style.setProperty('--replyma-bottom', closedLayout.inset + 'px');
    root.style.removeProperty('--replyma-top');
    root.style.removeProperty('--replyma-left');
    root.style.setProperty('--replyma-transition', 'none');
    root.style.setProperty('will-change', 'transform');
    root.style.transform = 'scale(1)';

    function finishClosed() {
      root.removeEventListener('transitionend', onEnd);
      root.style.setProperty('--replyma-transition', TRANSITION_CLOSE_INSTANT);
      root.style.setProperty('--replyma-w', closedSize + 'px');
      root.style.setProperty('--replyma-h', closedSize + 'px');
      root.style.removeProperty('transform');
      root.style.removeProperty('will-change');
      void root.offsetHeight;
    }
    function onEnd(e) {
      if (e.target !== root || e.propertyName !== 'transform') return;
      finishClosed();
    }
    root.addEventListener('transitionend', onEnd);
    /* Animation starts after 2 rAF (~32ms), duration 250ms → ends ~282ms; wait 300ms so we never snap early */
    setTimeout(finishClosed, 300);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        root.style.setProperty('--replyma-transition', TRANSITION_CLOSE_SCALE);
        root.style.transform = 'scale(' + scaleX + ',' + scaleY + ')';
      });
    });
  }

  function scheduleOpenMinDimensions(root, getLayoutFn, getViewportFn, getExpanded) {
    var done = false;
    function setMin() {
      if (done) return;
      done = true;
      var openLayout = getLayoutFn('open', getViewportFn(), getExpanded());
      if (openLayout.fullscreen) return;
      root.style.setProperty('--replyma-min-w', openLayout.w + 'px');
      root.style.setProperty('--replyma-min-h', openLayout.h + 'px');
    }
    function onEnd(e) {
      if (e.target !== root) return;
      if (e.propertyName !== 'width' && e.propertyName !== 'height' && e.propertyName !== 'border-radius' && e.propertyName !== 'all') return;
      root.removeEventListener('transitionend', onEnd);
      setMin();
    }
    root.addEventListener('transitionend', onEnd);
    setTimeout(setMin, EXPAND_DURATION_MS);
  }

  function createStyles() {
    var style = document.createElement('style');
    style.id = 'replyma-widget-styles';
    style.textContent =
      '#' + ROOT_ID + '{' +
      'position:fixed;z-index:2147483647;' +
      'bottom:var(--replyma-bottom,30px);right:var(--replyma-right,30px);' +
      'width:var(--replyma-w,76px);height:var(--replyma-h,76px);' +
      'min-width:var(--replyma-min-w,auto);min-height:var(--replyma-min-h,auto);' +
      'top:var(--replyma-top,auto);left:var(--replyma-left,auto);' +
      'border-radius:var(--replyma-radius,999px);' +
      'transition:var(--replyma-transition,' + TRANSITION_DEFAULT + ');' +
      'transform-origin:bottom right;' +
      'border:none;overflow:hidden;pointer-events:auto;' +
      'background:transparent !important;box-shadow:none;outline:none;box-sizing:border-box;' +
      'contain:style paint;' +
      '}' +
      '#' + ROOT_ID + '[data-state="loading"]{opacity:0;visibility:hidden;}' +
      '#' + ROOT_ID + ':not([data-state="loading"]){opacity:1;visibility:visible;}' +
      '#' + ROOT_ID + ' iframe{display:block;width:100%;height:100%;border:none;background:transparent;}' +
      '#' + ROOT_ID + '[data-mobile="true"][data-state="open"]{' +
      'top:0;left:0;right:0;bottom:0;width:100%;height:100%;' +
      'min-width:100vw;min-height:100dvh;min-height:100vh;' +
      'border-radius:0;}';
    return style;
  }

  function run(workspaceId) {
    if (typeof workspaceId !== 'string' || !workspaceId.trim()) {
      console.warn('Replyma: data-workspace-id is required and must be a non-empty string.');
      return;
    }
    workspaceId = workspaceId.trim();

    if (window[MOUNT_FLAG] || document.getElementById(ROOT_ID)) {
      return;
    }
    window[MOUNT_FLAG] = true;

    var viewport = getViewport();
    var desktop = viewport.w >= BREAKPOINT_PX;
    var baseUrl = isLocal ? document.location.origin : WIDGET_ORIGIN;
    var iframeSrc = baseUrl + '/widget/' + encodeURIComponent(workspaceId) + '?desktop=' + (desktop ? '1' : '0');

    var state = 'loading';
    var embedExpanded = false;
    var resizeTimer = null;
    var failsafeTimer = null;
    var closedAt = 0;
    var PROACTIVE_COOLDOWN_MS = 1800;

    var styleEl = createStyles();
    var root = document.createElement('div');
    root.id = ROOT_ID;
    root.setAttribute('data-state', 'loading');
    root.setAttribute('aria-hidden', 'true');

    var iframe = document.createElement('iframe');
    iframe.src = iframeSrc;
    iframe.title = 'Replyma Chat';
    iframe.setAttribute('allow', 'clipboard-write');
    iframe.style.background = 'transparent';

    root.appendChild(iframe);
    document.head.appendChild(styleEl);
    document.body.appendChild(root);

    // Apply closed size/position now so there is zero layout shift when we reveal.
    // Keep data-state="loading" (hidden) until iframe sends replyma:ready — no empty box, no teleport.
    var closedLayout = getLayout('closed', viewport, false);
    root.setAttribute('data-mobile', closedLayout.mobile ? 'true' : 'false');
    root.style.setProperty('--replyma-inset', closedLayout.inset + 'px');
    root.style.setProperty('--replyma-radius', closedLayout.radius);
    root.style.setProperty('--replyma-transition', closedLayout.transition);
    root.style.setProperty('--replyma-w', closedLayout.w + 'px');
    root.style.setProperty('--replyma-h', closedLayout.h + 'px');
    root.style.setProperty('--replyma-right', closedLayout.inset + 'px');
    root.style.setProperty('--replyma-bottom', closedLayout.inset + 'px');

    function sendToChild(msg) {
      try {
        if (iframe.contentWindow && iframe.contentWindow.postMessage) {
          iframe.contentWindow.postMessage(msg, CHILD_ORIGIN);
        }
      } catch (e) {}
    }

    function clearFailsafe() {
      if (!failsafeTimer) return;
      clearTimeout(failsafeTimer);
      failsafeTimer = null;
    }

    function notifyOpenApplied() {
      sendToChild({ type: MSG_RESIZE_DONE, version: PROTOCOL_VERSION, state: 'open' });
      sendToChild({ type: MSG_LEGACY_RESIZE_DONE, mode: 'open' });
    }

    function sendStateApplied(requestId, appliedState) {
      if (requestId === null || requestId === undefined) return;
      sendToChild({
        type: MSG_STATE_APPLIED,
        version: PROTOCOL_VERSION,
        requestId: requestId,
        state: appliedState,
      });
    }

    function transitionTo(nextState) {
      if (!ALLOWED_STATES[nextState]) return false;
      if (state === nextState) return false;
      var prevState = state;
      state = nextState;
      if (state === 'closed' && prevState === 'open') { closedAt = Date.now(); embedExpanded = false; }
      viewport = getViewport();
      var layout = getLayout(state, viewport, embedExpanded);
      applyLayout(root, state, layout);
      if (state === 'open') {
        notifyOpenApplied();
        if (!layout.fullscreen) scheduleOpenMinDimensions(root, getLayout, getViewport, function () { return embedExpanded; });
      }
      return true;
    }

    function handleStateRequest(nextState, requestId) {
      if (!ALLOWED_STATES[nextState] || nextState === 'loading') return;
      clearFailsafe();
      if (state === 'loading') {
        transitionTo('closed');
        if (nextState === 'closed') {
          sendStateApplied(requestId, state);
          return;
        }
      }
      var changed = transitionTo(nextState);
      if (!changed && nextState === 'open') {
        notifyOpenApplied();
      }
      sendStateApplied(requestId, state);
    }

    function handleMessage(event) {
      if (event.source !== iframe.contentWindow) return;
      var origin = event.origin;
      var originOk = origin === WIDGET_ORIGIN || origin === WIDGET_ORIGIN_WWW || (isLocal && origin === document.location.origin);
      if (!originOk) return;

      var data = event.data;
      if (!data || typeof data !== 'object' || typeof data.type !== 'string') return;

      var msgType = data.type;

      if (msgType === MSG_LEGACY_RESIZE) {
        clearFailsafe();
        if (state === 'loading') transitionTo('closed');
        var mode = data.mode;
        if (mode === 'proactive' && state === 'closed' && (Date.now() - closedAt) < PROACTIVE_COOLDOWN_MS) return;
        if (mode === 'open' || mode === 'closed' || mode === 'proactive') {
          var changed = transitionTo(mode);
          if (!changed && mode === 'open') notifyOpenApplied();
        }
        return;
      }

      if (msgType === MSG_STATE_REQUEST) {
        if (data.version !== PROTOCOL_VERSION) return;
        var requestedState = data.state;
        var requestId = (typeof data.requestId === 'string' || typeof data.requestId === 'number') ? data.requestId : null;
        handleStateRequest(requestedState, requestId);
        return;
      }

      if (data.version !== undefined && data.version !== PROTOCOL_VERSION) return;

      switch (msgType) {
        case MSG_READY:
          clearFailsafe();
          viewport = getViewport();
          if (state === 'loading') {
            lastMobile = viewport.w < BREAKPOINT_PX;
            requestAnimationFrame(function () {
              requestAnimationFrame(function () {
                if (state !== 'loading') return;
                transitionTo('closed');
                sendToChild({
                  type: MSG_INIT,
                  version: PROTOCOL_VERSION,
                  viewport: viewport,
                  desktop: viewport.w >= BREAKPOINT_PX,
                });
              });
            });
          } else {
            sendToChild({
              type: MSG_INIT,
              version: PROTOCOL_VERSION,
              viewport: viewport,
              desktop: viewport.w >= BREAKPOINT_PX,
            });
          }
          break;
        case MSG_SET_STATE:
          var s = data.state;
          if (s === 'proactive' && state === 'closed' && (Date.now() - closedAt) < PROACTIVE_COOLDOWN_MS) break;
          if (s === 'open') embedExpanded = !!data.expanded;
          else embedExpanded = false;
          if (ALLOWED_STATES[s] && s !== 'loading') {
            transitionTo(s);
            if (s === 'open') {
              viewport = getViewport();
              var openLayout = getLayout('open', viewport, embedExpanded);
              applyLayout(root, 'open', openLayout);
              if (!openLayout.fullscreen) scheduleOpenMinDimensions(root, getLayout, getViewport, function () { return embedExpanded; });
            }
          }
          break;
        case 'replyma:error':
          if (state === 'loading') transitionTo('closed');
          break;
        default:
          break;
      }
    }

    var lastMobile = viewport.w < BREAKPOINT_PX;
    function onResize() {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        resizeTimer = null;
        var v = getViewport();
        var mobile = v.w < BREAKPOINT_PX;
        var prevMobile = lastMobile;
        viewport = v;
        lastMobile = mobile;
        if (state === 'loading') return;
        if (state === 'closed') {
          if ((Date.now() - closedAt) < 600) return;
          if (mobile === prevMobile) return;
        }
        if (state === 'open' && !mobile) return;
        var layout = getLayout(state, viewport, embedExpanded);
        applyLayout(root, state, layout);
        sendToChild({ type: MSG_INIT, version: PROTOCOL_VERSION, viewport: viewport, desktop: !mobile });
      }, RESIZE_DEBOUNCE_MS);
    }

    window.addEventListener('message', handleMessage);
    window.addEventListener('resize', onResize);
    if (window.visualViewport && window.visualViewport.addEventListener) {
      window.visualViewport.addEventListener('resize', onResize);
      window.visualViewport.addEventListener('scroll', onResize);
    }

    failsafeTimer = setTimeout(function () {
      failsafeTimer = null;
      if (state === 'loading') transitionTo('closed');
    }, FAILSAFE_MS);

    function destroy() {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('resize', onResize);
      if (window.visualViewport && window.visualViewport.removeEventListener) {
        window.visualViewport.removeEventListener('resize', onResize);
        window.visualViewport.removeEventListener('scroll', onResize);
      }
      if (resizeTimer) clearTimeout(resizeTimer);
      if (failsafeTimer) clearTimeout(failsafeTimer);
      var el = document.getElementById(ROOT_ID);
      if (el && el.parentNode) el.parentNode.removeChild(el);
      var st = document.getElementById('replyma-widget-styles');
      if (st && st.parentNode) st.parentNode.removeChild(st);
      window[MOUNT_FLAG] = false;
    }

    window.addEventListener('replyma:destroy', destroy);
  }

  function bootstrap() {
    var script = document.currentScript;
    if (!script) {
      console.warn('Replyma: currentScript not available.');
      return;
    }
    var workspaceId = script.getAttribute('data-workspace-id');
    if (document.body) {
      run(workspaceId);
    } else {
      if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', function () { run(workspaceId); });
      } else {
        document.attachEvent('onreadystatechange', function () {
          if (document.readyState !== 'loading') run(workspaceId);
        });
      }
    }
  }

  bootstrap();
})();
