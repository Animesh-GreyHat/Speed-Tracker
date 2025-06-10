const pointer = document.getElementById("pointer");
const resultDisplay = document.getElementById("result");
const highlightRing = document.getElementById("highlightRing");
const ticksContainer = document.getElementById("ticksContainer");

const tickValues = [0, 5, 10, 50, 100, 250, 500, 750, 1000];
const minAngle = -130;
const maxAngle = 122.7;
const maxSpeed = 1000;

tickValues.forEach((value, index) => {
  const normalized = index / (tickValues.length - 1);
  const angle = minAngle + normalized * (maxAngle - minAngle);
  const tick = document.createElement("div");
  tick.className = "tick";
  tick.setAttribute("value", value);
  tick.style.transform = `rotate(${angle}deg)`;
  ticksContainer.appendChild(tick);
});

function updateNeedle(speed) {
  const clampedSpeed = Math.min(speed, maxSpeed);
  let lowerIndex = 0;
  for (let i = 0; i < tickValues.length - 1; i++) {
    if (clampedSpeed >= tickValues[i] && clampedSpeed <= tickValues[i + 1]) {
      lowerIndex = i;
      break;
    }
  }
  const lowerValue = tickValues[lowerIndex];
  const upperValue = tickValues[lowerIndex + 1];
  const lowerAngle = minAngle + (lowerIndex / (tickValues.length - 1)) * (maxAngle - minAngle);
  const upperAngle = minAngle + ((lowerIndex + 1) / (tickValues.length - 1)) * (maxAngle - minAngle);
  const t = (clampedSpeed - lowerValue) / (upperValue - lowerValue);
  const angle = lowerAngle + t * (upperAngle - lowerAngle);
  pointer.style.transform = `rotate(${angle}deg)`;
}

let animationFrameId = null;
let currentNeedleSpeed = 0;

function animateNeedle(fromSpeed, toSpeed, duration) {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  const startTime = performance.now();

  function animate(time) {
    const elapsed = time - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const currentSpeed = fromSpeed + (toSpeed - fromSpeed) * progress;
    updateNeedle(currentSpeed);
    currentNeedleSpeed = currentSpeed;
    if (progress < 1) animationFrameId = requestAnimationFrame(animate);
    else animationFrameId = null;
  }

  animationFrameId = requestAnimationFrame(animate);
}

async function measureSpeedLive(updateCallback) {
  const url = "https://speedtest-backend-ocqz.onrender.com/download/5MB.bin";
  let totalBits = 0;
  const alpha = 0.15;
  let smoothedSpeed = 0;
  const startTime = performance.now();

  for (let i = 0; i < 2; i++) {
    const response = await fetch(url + "?_=" + Date.now());
    const reader = response.body.getReader();
    let loaded = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      loaded += value.length;
      const elapsed = (performance.now() - startTime) / 1000;
      const speed = (loaded / 1024 / 1024 * 8) / elapsed;
      smoothedSpeed = smoothedSpeed * (1 - alpha) + speed * alpha;
      updateCallback(smoothedSpeed);
    }

    totalBits += loaded * 8;
  }

  const endTime = performance.now();
  const durationSeconds = (endTime - startTime) / 1000;
  const finalMbps = totalBits / 1024 / 1024 / durationSeconds;
  return finalMbps;
}

async function startTest() {
  resultDisplay.textContent = "Testing...";
  highlightRing.classList.add("pulsing-ring");
  currentNeedleSpeed = 0;
  updateNeedle(0);

  const finalSpeed = await measureSpeedLive((currentSpeed) => {
    animateNeedle(currentNeedleSpeed, currentSpeed, 200);
    resultDisplay.textContent = `Testing... ${currentSpeed.toFixed(1)} Mbps`;
    currentNeedleSpeed = currentSpeed;
  });

  animateNeedle(currentNeedleSpeed, finalSpeed, 300);
  resultDisplay.textContent = `Final Download Speed: ${finalSpeed.toFixed(2)} Mbps`;

  highlightRing.classList.remove("pulsing-ring");
  highlightRing.style.borderColor = "lime";
}
