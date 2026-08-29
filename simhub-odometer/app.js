const MAX_READING = 100000;

const instrument = document.querySelector('.instrument');
const reelCards = [...document.querySelectorAll('.digit-card')];
const distanceRange = document.querySelector('#distance-range');
const distanceNumber = document.querySelector('#distance-number');
const speedSelect = document.querySelector('#demo-speed');
const demoButton = document.querySelector('.demo-button');
const output = document.querySelector('output');

let targetDistance = 300;
let displayDistance = 300;
let velocity = 0;
let demoRunning = false;
let previousTime = performance.now();

function wrapDistance(value) {
  return ((value % MAX_READING) + MAX_READING) % MAX_READING;
}

function createDigit(position) {
  const digit = document.createElement('span');
  digit.className = 'reel-digit';
  digit.dataset.position = position;
  return digit;
}

reelCards.forEach((card) => {
  const reel = card.querySelector('.reel');
  reel.append(createDigit(-100), createDigit(0), createDigit(100));
});

function setDistance(metres, options = {}) {
  const value = Number(metres);
  if (!Number.isFinite(value)) return;

  targetDistance = Math.max(0, value);
  if (options.immediate === true) {
    displayDistance = targetDistance;
    velocity = 0;
  }
  const wrapped = Math.round(wrapDistance(targetDistance));
  distanceRange.value = wrapped;
  distanceNumber.value = wrapped;
}

function setDemoRunning(nextValue) {
  demoRunning = nextValue;
  demoButton.textContent = demoRunning ? 'Pause demo' : 'Run demo';
}

function draw(now) {
  const reading = Math.floor(wrapDistance(displayDistance));
  const movement = Math.min(Math.abs(velocity) / 16, 1);

  reelCards.forEach((card, index) => {
    const divisor = Number(card.dataset.divisor);
    const reelValue = displayDistance / divisor;
    const whole = Math.floor(reelValue);
    const progress = reelValue - whole;
    const current = ((whole % 10) + 10) % 10;
    const next = (current + 1) % 10;
    const previous = (current + 9) % 10;
    const jitter = Math.sin(now * 0.026 + index * 1.7) * movement * 0.45;
    const reel = card.querySelector('.reel');
    const digits = reel.querySelectorAll('.reel-digit');

    reel.style.transform = `translateY(${jitter}px)`;
    digits[0].textContent = next;
    digits[1].textContent = current;
    digits[2].textContent = previous;

    digits.forEach((digit) => {
      const position = Number(digit.dataset.position);
      digit.style.transform = `translate3d(0, ${position + progress * 100}%, 0)`;
    });
  });

  const formatted = String(reading).padStart(5, '0');
  output.textContent = `${formatted} m`;
  instrument.setAttribute('aria-label', `${reading} metres travelled`);
}

function animate(now) {
  const delta = Math.min((now - previousTime) / 1000, 0.05);
  previousTime = now;

  if (demoRunning) {
    targetDistance += Number(speedSelect.value) * delta;
    const wrapped = Math.round(wrapDistance(targetDistance));
    distanceRange.value = wrapped;
    distanceNumber.value = wrapped;
  }

  const difference = targetDistance - displayDistance;
  const acceleration = difference * 42 - velocity * 13;
  velocity += acceleration * delta;
  displayDistance += velocity * delta;

  if (!demoRunning && Math.abs(difference) < 0.0005 && Math.abs(velocity) < 0.001) {
    displayDistance = targetDistance;
    velocity = 0;
  }

  draw(now);
  requestAnimationFrame(animate);
}

distanceRange.addEventListener('input', (event) => {
  setDemoRunning(false);
  setDistance(event.target.value);
});

distanceNumber.addEventListener('input', (event) => {
  setDemoRunning(false);
  setDistance(event.target.value);
});

demoButton.addEventListener('click', () => setDemoRunning(!demoRunning));

window.rbrOdometer = {
  setDistance,
  getDistance: () => wrapDistance(displayDistance),
};

draw(performance.now());
requestAnimationFrame(animate);
