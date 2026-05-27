(function () {
  "use strict";

  const viewportDefaults = {
    width: 1366,
    height: 768,
  };

  const fullPageHeights = {
    "375x667": 3200,
    "390x844": 3600,
    "768x1024": 4200,
    "1280x720": 2600,
    "1366x768": 2800,
    "1440x900": 3200,
    "1920x1080": 3600,
  };

  const $ = (id) => document.getElementById(id);
  const root = document.documentElement;
  let autoReloadTimer = 0;
  let syncingHorizontalScroll = false;

  const fields = {
    left: {
      url: $("left-url"),
      auth: $("left-auth-enabled"),
      user: $("left-user"),
      pass: $("left-pass"),
      frame: $("left-frame"),
      status: $("left-status"),
      shiftY: $("left-shift-y"),
    },
    right: {
      url: $("right-url"),
      auth: $("right-auth-enabled"),
      user: $("right-user"),
      pass: $("right-pass"),
      frame: $("right-frame"),
      status: $("right-status"),
      shiftY: $("right-shift-y"),
    },
  };

  function selectedRadio(name) {
    return document.querySelector(`input[name="${name}"]:checked`);
  }

  function setCssPx(name, value, fallback) {
    const number = Number(value);
    root.style.setProperty(name, `${Number.isFinite(number) ? number : fallback}px`);
  }

  function normalizeUrl(rawValue) {
    const rawUrl = rawValue.trim();
    if (!rawUrl) return "";
    if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
    return `https://${rawUrl}`;
  }

  function buildAuthUrl(sideName) {
    const config = fields[sideName];
    const normalized = normalizeUrl(config.url.value);
    if (!normalized) return "";

    const parsed = new URL(normalized);
    if (config.auth.checked) {
      parsed.username = config.user.value;
      parsed.password = config.pass.value;
    } else {
      parsed.username = "";
      parsed.password = "";
    }

    return parsed.toString();
  }

  function updateAuthState(sideName) {
    const config = fields[sideName];
    const enabled = config.auth.checked;
    config.user.disabled = !enabled;
    config.pass.disabled = !enabled;
  }

  function setStatus(sideName, message) {
    fields[sideName].status.textContent = message;
  }

  function hasAnyUrl() {
    return Boolean(fields.left.url.value.trim() || fields.right.url.value.trim());
  }

  function scheduleReload() {
    window.clearTimeout(autoReloadTimer);
    autoReloadTimer = window.setTimeout(() => {
      if (hasAnyUrl()) loadFrames();
    }, 450);
  }

  function loadFrame(sideName) {
    try {
      const src = buildAuthUrl(sideName);
      if (!src) {
        setStatus(sideName, "URL未入力");
        fields[sideName].frame.removeAttribute("src");
        return;
      }

      setStatus(sideName, "読み込み中");
      fields[sideName].frame.src = src;
    } catch (error) {
      setStatus(sideName, "URL形式エラー");
    }
  }

  function loadFrames() {
    loadFrame("left");
    loadFrame("right");
  }

  function updateViewport() {
    const viewport = $("viewport").value;
    const [width, height] = viewport.split("x").map(Number);
    const nextWidth = Number.isFinite(width) ? width : viewportDefaults.width;
    const nextHeight = Number.isFinite(height) ? height : viewportDefaults.height;

    root.style.setProperty("--viewport-width", `${nextWidth}px`);
    root.style.setProperty("--viewport-height", `${nextHeight}px`);

    if (!$("page-height").dataset.touched) {
      $("page-height").value = String(fullPageHeights[viewport] || Math.max(nextHeight * 4, 2400));
      updatePageHeight();
    }
    updateHorizontalScroller();
    if ($("stage").dataset.mode === "overlay") centerOverlayStage();
  }

  function updateMode() {
    const mode = selectedRadio("display-mode").value;
    const overlay = selectedRadio("overlay-mode").value;
    const stage = $("stage");
    const comparison = $("comparison");
    stage.dataset.mode = mode;
    stage.dataset.overlay = overlay;
    comparison.dataset.mode = mode;

    const overlayDisabled = mode !== "overlay";
    document.querySelectorAll("input[name='overlay-mode']").forEach((input) => {
      input.disabled = overlayDisabled;
    });
    $("amount").disabled = overlayDisabled;
    updateHorizontalScroller();
    if (mode === "overlay") centerOverlayStage();
  }

  function updateAmount() {
    const amount = Number($("amount").value);
    const safeAmount = Number.isFinite(amount) ? Math.min(Math.max(amount, 0), 100) : 50;
    root.style.setProperty("--right-opacity", String(safeAmount / 100));
    root.style.setProperty("--swipe", `${safeAmount}%`);
    $("swipe-handle").setAttribute("aria-valuenow", String(safeAmount));
  }

  function updatePageHeight() {
    const rawHeight = Number($("page-height").value);
    const pageHeight = Number.isFinite(rawHeight) ? Math.min(Math.max(rawHeight, 800), 20000) : 3200;
    root.style.setProperty("--page-height", `${pageHeight}px`);
  }

  function centerOverlayStage() {
    window.requestAnimationFrame(() => {
      const comparison = $("comparison");
      const stage = $("stage");
      if (!comparison || stage.dataset.mode !== "overlay") return;

      const maxScroll = Math.max(comparison.scrollWidth - comparison.clientWidth, 0);
      const comparisonRect = comparison.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();
      const comparisonCenter = comparisonRect.left + comparisonRect.width / 2;
      const stageCenter = stageRect.left + stageRect.width / 2;
      const centeredScroll = comparison.scrollLeft + stageCenter - comparisonCenter;
      comparison.scrollLeft = Math.min(Math.max(centeredScroll, 0), maxScroll);
      updateHorizontalScroller();
    });
  }

  function updateShift(sideName) {
    setCssPx(`--${sideName}-shift-y`, fields[sideName].shiftY.value, 0);
  }

  function updateRightShiftX() {
    setCssPx("--right-shift-x", $("right-shift-x").value, 0);
  }

  function syncHorizontalScroll(source, target) {
    if (syncingHorizontalScroll || !source || !target) return;
    const sourceMax = Math.max(source.scrollWidth - source.clientWidth, 0);
    const targetMax = Math.max(target.scrollWidth - target.clientWidth, 0);
    const ratio = sourceMax ? source.scrollLeft / sourceMax : 0;

    syncingHorizontalScroll = true;
    target.scrollLeft = targetMax * ratio;
    window.requestAnimationFrame(() => {
      syncingHorizontalScroll = false;
    });
  }

  function updateHorizontalScroller() {
    const comparison = $("comparison");
    const scroller = $("sticky-x-scroll");
    const inner = $("sticky-x-scroll-inner");
    if (!comparison || !scroller || !inner) return;

    inner.style.width = `${comparison.scrollWidth}px`;
    scroller.hidden = comparison.scrollWidth <= comparison.clientWidth + 1;
    if (scroller.hidden) return;

    const comparisonMax = Math.max(comparison.scrollWidth - comparison.clientWidth, 0);
    const scrollerMax = Math.max(scroller.scrollWidth - scroller.clientWidth, 0);
    const ratio = comparisonMax ? comparison.scrollLeft / comparisonMax : 0;
    scroller.scrollLeft = scrollerMax * ratio;
  }

  function nudgeShift(sideName, step) {
    const input = fields[sideName].shiftY;
    const nextValue = (Number(input.value) || 0) + step;
    input.value = String(nextValue);
    updateShift(sideName);
  }

  function startShiftHold(button) {
    const sideName = button.dataset.shift;
    const step = Number(button.dataset.step);
    let intervalId = 0;
    let timeoutId = 0;

    nudgeShift(sideName, step);
    timeoutId = window.setTimeout(() => {
      intervalId = window.setInterval(() => nudgeShift(sideName, step), 45);
    }, 280);

    const stop = () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
      window.removeEventListener("blur", stop);
    };

    window.addEventListener("pointerup", stop, { once: true });
    window.addEventListener("pointercancel", stop, { once: true });
    window.addEventListener("blur", stop, { once: true });
  }

  function setSwipeFromPointer(clientX) {
    const rect = $("stage").getBoundingClientRect();
    const percent = ((clientX - rect.left) / rect.width) * 100;
    $("amount").value = String(Math.round(Math.min(Math.max(percent, 0), 100)));
    updateAmount();
  }

  function startSwipeDrag(event) {
    if ($("stage").dataset.mode !== "overlay" || $("stage").dataset.overlay !== "swipe") return;
    event.preventDefault();
    setSwipeFromPointer(event.clientX);

    const move = (moveEvent) => setSwipeFromPointer(moveEvent.clientX);
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop, { once: true });
  }

  function bindEvents() {
    Object.keys(fields).forEach((sideName) => {
      fields[sideName].url.addEventListener("input", scheduleReload);
      fields[sideName].auth.addEventListener("change", () => {
        updateAuthState(sideName);
        scheduleReload();
      });
      fields[sideName].user.addEventListener("input", scheduleReload);
      fields[sideName].pass.addEventListener("input", scheduleReload);
      fields[sideName].frame.addEventListener("load", () => setStatus(sideName, "表示中"));
      fields[sideName].shiftY.addEventListener("input", () => updateShift(sideName));
    });

    $("load").addEventListener("click", loadFrames);
    $("viewport").addEventListener("change", () => {
      updateViewport();
      scheduleReload();
    });
    $("page-height").addEventListener("input", () => {
      $("page-height").dataset.touched = "true";
      updatePageHeight();
      scheduleReload();
    });
    document.querySelectorAll("input[name='display-mode']").forEach((input) => input.addEventListener("change", updateMode));
    document.querySelectorAll("input[name='overlay-mode']").forEach((input) => input.addEventListener("change", updateMode));
    $("amount").addEventListener("input", updateAmount);
    $("right-shift-x").addEventListener("input", updateRightShiftX);
    $("comparison").addEventListener("scroll", () => syncHorizontalScroll($("comparison"), $("sticky-x-scroll")));
    $("sticky-x-scroll").addEventListener("scroll", () => syncHorizontalScroll($("sticky-x-scroll"), $("comparison")));
    $("swipe-handle").addEventListener("pointerdown", startSwipeDrag);
    $("swipe-handle").addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const step = event.key === "ArrowLeft" ? -1 : 1;
      $("amount").value = String(Math.min(Math.max((Number($("amount").value) || 0) + step, 0), 100));
      updateAmount();
    });

    document.querySelectorAll("[data-shift]").forEach((button) => {
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        startShiftHold(button);
      });
      button.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        nudgeShift(button.dataset.shift, Number(button.dataset.step));
      });
    });
  }

  function init() {
    bindEvents();
    updateAuthState("left");
    updateAuthState("right");
    updateViewport();
    updateMode();
    updateAmount();
    updatePageHeight();
    updateShift("left");
    updateShift("right");
    updateRightShiftX();
    updateHorizontalScroller();
    new ResizeObserver(updateHorizontalScroller).observe($("comparison"));
    window.addEventListener("resize", () => {
      updateHorizontalScroller();
      if ($("stage").dataset.mode === "overlay") centerOverlayStage();
    });
  }

  document.addEventListener("DOMContentLoaded", init);

  window.kasanely = {
    buildAuthUrl,
    normalizeUrl,
    updateViewport,
    updatePageHeight,
    updateShift,
    updateRightShiftX,
    updateHorizontalScroller,
    loadFrames,
  };
})();
