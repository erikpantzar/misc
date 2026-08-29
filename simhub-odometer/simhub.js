(() => {
  const params = new URLSearchParams(window.location.search);
  const embedded = params.has('simhub') || params.get('mode') === 'embedded';

  if (!embedded) return;

  document.documentElement.classList.add('embedded');

  const SNAPSHOT_PATH = '/api/GetGameData';
  const UPDATES_PATH = '/api/GetGameDataUpdates';
  const RESTART_DROP_METRES = 25;
  const RECONNECT_MIN_MS = 1000;
  const RECONNECT_MAX_MS = 10000;

  let lastMetres = null;
  let reconnectDelay = RECONNECT_MIN_MS;
  let reconnectTimer = null;
  let socket = null;

  function numberAt(value) {
    if (value === null || value === undefined || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
  }

  function findTrackPositionMetres(data) {
    const candidates = [
      data?.NewData?.TrackPositionMeters,
      data?.GameNewData?.TrackPositionMeters,
      data?.TrackPositionMeters,
    ];

    for (const candidate of candidates) {
      const value = numberAt(candidate);
      if (value !== null) return value;
    }

    return null;
  }

  function applyTelemetry(data) {
    const metres = findTrackPositionMetres(data);
    if (metres === null) return;

    const firstValue = lastMetres === null;
    const stageRestart =
      !firstValue &&
      (metres < lastMetres - RESTART_DROP_METRES ||
        (metres <= 5 && lastMetres > metres + 5));
    const smallBackwardCorrection = !firstValue && metres < lastMetres;

    if (smallBackwardCorrection && !stageRestart) return;

    window.rbrOdometer.setDistance(metres, {
      immediate: firstValue || stageRestart,
    });
    lastMetres = metres;
  }

  async function loadInitialValue() {
    try {
      const response = await fetch(SNAPSHOT_PATH, { cache: 'no-store' });
      if (!response.ok) return;
      applyTelemetry(await response.json());
    } catch {
      // The live socket will retry when SimHub becomes available.
    }
  }

  function scheduleReconnect() {
    if (reconnectTimer !== null) return;
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null;
      connectUpdates();
    }, reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_MS);
  }

  function connectUpdates() {
    if (socket && socket.readyState <= WebSocket.OPEN) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      socket = new WebSocket(`${protocol}//${window.location.host}${UPDATES_PATH}`);
    } catch {
      scheduleReconnect();
      return;
    }

    socket.addEventListener('open', () => {
      reconnectDelay = RECONNECT_MIN_MS;
      loadInitialValue();
    });

    socket.addEventListener('message', (event) => {
      try {
        applyTelemetry(JSON.parse(event.data));
      } catch {
        // Ignore malformed or non-JSON messages without disturbing the reading.
      }
    });

    socket.addEventListener('close', scheduleReconnect);
    socket.addEventListener('error', () => socket.close());
  }

  loadInitialValue();
  connectUpdates();
})();
