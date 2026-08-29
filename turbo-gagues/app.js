const ticks = Array.from({ length: 21 }, (_, index) => ({ angle: -132 + index * 13.2, major: index % 5 === 0 }));
const segments = Array.from({ length: 16 }, (_, index) => index);
const analog = document.querySelector('#analog-gauge');
const digital = document.querySelector('#digital-gauge');
const rack = document.querySelector('#instrument-rack');
const ledTrack = document.querySelector('.led-track');
const lossSector = document.querySelector('.loss-sector');
const peakNeedle = document.querySelector('.peak-needle');
const liveNeedle = document.querySelector('.live-needle');
const pressureRange = document.querySelector('#pressure-range');
const maxRange = document.querySelector('#max-range');
const holdRange = document.querySelector('#hold-range');
const decayRange = document.querySelector('#decay-range');
const phaseLabel = document.querySelector('#phase-label');
const rpmLabel = document.querySelector('#rpm-label');
const statusLamp = document.querySelector('#status-lamp');
const runButton = document.querySelector('#run-button');
const autoButton = document.querySelector('#auto-button');
const manualButton = document.querySelector('#manual-button');
const glanceButton = document.querySelector('#glance-button');
const resetButton = document.querySelector('#reset-button');
const peakReadout = document.querySelector('.peak-readout');
const digitalValue = document.querySelector('.digital-value');
const fadeNote = document.querySelector('.fade-note');
const stagePeakOutput = document.querySelector('#stage-peak');
const maxOutput = document.querySelector('#max-output');
const holdOutput = document.querySelector('#hold-output');
const decayOutput = document.querySelector('#decay-output');
const pressureOutput = document.querySelector('#pressure-output');

const gaugeFace = document.querySelector('.gauge-face');
ticks.forEach((tick) => { const element = document.createElement('i'); element.className = tick.major ? 'tick major' : 'tick'; element.style.transform = `rotate(${tick.angle}deg)`; gaugeFace.prepend(element); });
segments.forEach((segment) => { const element = document.createElement('i'); element.dataset.segment = segment; ledTrack.append(element); });

let mode = 'auto';
let running = true;
let manualBoost = 0.8;
let maxBar = 2;
let holdSeconds = 3.5;
let decaySeconds = 2.5;
let elapsed = 0;
let previousTime = performance.now();
let recentPeak = 0.04;
let stagePeak = 0.04;
let holdUntil = 0;

function mix(from, to, progress) { return from + (to - from) * progress; }
function smooth(progress) { const value = Math.max(0, Math.min(1, progress)); return value * value * (3 - 2 * value); }
function sampleAt(time) {
  const t = time % 12;
  if (t < 1.1) return { boost: .04, rpm: 2300, phase: 'OFF BOOST', fading: false };
  if (t < 3.4) { const p = smooth((t - 1.1) / 2.3); return { boost: mix(.04, 1.56, p), rpm: mix(2400, 5600, p), phase: 'SPOOLING', fading: false }; }
  if (t < 4.3) return { boost: 1.56 + Math.sin(t * 17) * .012, rpm: mix(5600, 6500, (t - 3.4) / .9), phase: 'FULL BOOST', fading: false };
  if (t < 6.15) { const p = smooth((t - 4.3) / 1.85); return { boost: mix(1.55, 1.27, p), rpm: mix(6500, 7900, p), phase: 'HIGH-RPM FADE', fading: true }; }
  if (t < 6.65) { const p = smooth((t - 6.15) / .5); return { boost: mix(1.27, .18, p), rpm: mix(7900, 5100, p), phase: 'SHIFT', fading: false }; }
  if (t < 8.25) { const p = smooth((t - 6.65) / 1.6); return { boost: mix(.18, 1.47, p), rpm: mix(5100, 6900, p), phase: 'RESPOOL', fading: false }; }
  if (t < 9.55) { const p = smooth((t - 8.25) / 1.3); return { boost: mix(1.47, 1.29, p), rpm: mix(6900, 7900, p), phase: 'HIGH-RPM FADE', fading: true }; }
  if (t < 10.35) { const p = smooth((t - 9.55) / .8); return { boost: mix(1.29, .04, p), rpm: mix(7900, 2800, p), phase: 'LIFT', fading: false }; }
  return { boost: .04, rpm: 2400, phase: 'OFF BOOST', fading: false };
}
function setMode(nextMode) { mode = nextMode; autoButton.classList.toggle('active', mode === 'auto'); manualButton.classList.toggle('active', mode === 'manual'); pressureRange.disabled = mode === 'auto'; pressureRange.parentElement.classList.toggle('disabled-control', mode === 'auto'); runButton.disabled = mode === 'manual'; }
function resetMemory() { recentPeak = boost; stagePeak = boost; holdUntil = performance.now() + holdSeconds * 1000; }
function update(now) {
  const delta = Math.min((now - previousTime) / 1000, .08); previousTime = now;
  if (running && mode === 'auto') elapsed += delta;
  const sample = mode === 'auto' ? sampleAt(elapsed) : { boost: manualBoost, rpm: 0, phase: 'MANUAL INPUT', fading: false };
  boost = Math.max(0, Math.min(maxBar, sample.boost));
  if (boost >= recentPeak) { recentPeak = boost; holdUntil = now + holdSeconds * 1000; } else if (now > holdUntil) { recentPeak += (boost - recentPeak) * Math.min(1, delta / (decaySeconds * 1000)); if (recentPeak - boost < .005) recentPeak = boost; }
  if (boost > stagePeak) stagePeak = boost;
  render(now, boost, sample);
  requestAnimationFrame(update);
}
function render(now, boost, sample) {
  const liveRatio = Math.max(0, Math.min(1, boost / maxBar)); const peakRatio = Math.max(0, Math.min(1, recentPeak / maxBar)); const liveAngle = -132 + liveRatio * 264; const peakAngle = -132 + peakRatio * 264; const fade = Math.max(0, recentPeak - boost); const warning = sample.fading && fade >= .1; const peak = boost > maxBar * .55 && fade < .04 && (sample.phase === 'FULL BOOST' || sample.phase === 'MANUAL INPUT' || (sample.phase === 'RESPOOL' && boost > maxBar * .68)); const state = warning ? 'state-fade' : peak ? 'state-peak' : 'state-spool';
  analog.className = `analog-gauge ${state}`; digital.className = `digital-gauge ${state}`; peakNeedle.style.transform = `rotate(${peakAngle}deg)`; liveNeedle.style.transform = `rotate(${liveAngle + (boost > .25 ? Math.sin(boost * 37) * .35 : 0)}deg)`; lossSector.style.background = `conic-gradient(from ${liveAngle}deg, rgba(204,63,35,.78) 0deg ${Math.max(0, peakAngle - liveAngle)}deg, transparent ${Math.max(0, peakAngle - liveAngle)}deg 360deg)`;
  const lit = Math.round(liveRatio * segments.length); const memoryEnd = Math.max(lit, Math.round(peakRatio * segments.length)); ledTrack.querySelectorAll('i').forEach((element, index) => { const zone = index < 10 ? 'green' : index < 14 ? 'amber' : 'red'; element.className = `${index < lit ? 'lit' : ''} ${index >= lit && index < memoryEnd ? 'memory' : ''} ${zone}`; });
  document.querySelector('.peak-pin')?.style.setProperty('left', `calc(${peakRatio * 100}% - 1px)`); digitalValue.textContent = boost.toFixed(2); peakReadout.textContent = `PK ${recentPeak.toFixed(2)}`; fadeNote.textContent = fade > .015 ? `LOSS −${fade.toFixed(2)}` : 'HOLD'; phaseLabel.textContent = sample.phase; rpmLabel.textContent = mode === 'auto' ? `${Math.round(sample.rpm)} RPM · automatic rally pull` : 'direct pressure input'; statusLamp.classList.toggle('on', running); stagePeakOutput.textContent = stagePeak.toFixed(2); analog.setAttribute('aria-label', `Current boost ${boost.toFixed(2)} bar, peak ${recentPeak.toFixed(2)} bar`); digital.setAttribute('aria-label', `Current boost ${boost.toFixed(2)} bar, peak ${recentPeak.toFixed(2)} bar`);
}
autoButton.addEventListener('click', () => setMode('auto')); manualButton.addEventListener('click', () => setMode('manual')); runButton.addEventListener('click', () => { running = !running; runButton.textContent = running ? 'Pause' : 'Run'; }); glanceButton.addEventListener('click', () => { rack.classList.toggle('glance-test'); glanceButton.classList.toggle('active'); glanceButton.textContent = rack.classList.contains('glance-test') ? 'Clear view' : 'Glance test'; }); resetButton.addEventListener('click', resetMemory);
pressureRange.addEventListener('input', (event) => { manualBoost = Number(event.target.value); pressureOutput.textContent = `${manualBoost.toFixed(2)} bar`; }); maxRange.addEventListener('input', (event) => { maxBar = Number(event.target.value); maxOutput.textContent = `${maxBar.toFixed(1)} bar`; pressureRange.max = maxBar; }); holdRange.addEventListener('input', (event) => { holdSeconds = Number(event.target.value); holdOutput.textContent = `${holdSeconds.toFixed(1)} sec`; }); decayRange.addEventListener('input', (event) => { decaySeconds = Number(event.target.value); decayOutput.textContent = `${decaySeconds.toFixed(1)} sec`; });
window.rbrTurboGauge = { setBoost(value) { setMode('manual'); manualBoost = Math.max(0, Number(value) || 0); pressureRange.value = Math.min(manualBoost, maxBar); pressureOutput.textContent = `${manualBoost.toFixed(2)} bar`; }, resetPeak: resetMemory };
let boost = .04;
requestAnimationFrame(update);
