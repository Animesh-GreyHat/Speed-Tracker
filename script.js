const pointer = document.getElementById("pointer");
const resultDisplay = document.getElementById("result");
const highlightRing = document.getElementById("highlightRing");

const tickValues = [0, 100, 200, 300, 400, 500, 700, 1000];
const minAngle = -130;
const maxAngle = 122.7;

function updateNeedle(speed) {
  const clampedSpeed = Math.min(speed, 1000); 
  const angle = minAngle + ((maxAngle - minAngle) * clampedSpeed) / 1000;
  pointer.style.transform = `rotate(${angle}deg)`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function measureSpeed() {
  const fileSizeMB = 5;
  const url = "http://localhost:5000/download/5MB.bin?_=" + Date.now();

  const start = performance.now();
  const response = await fetch(url);
  await response.blob();
  const end = performance.now();

  const duration = (end - start) / 1000;
  const speed = (fileSizeMB * 8) / duration; 
  return speed;
}

async function startTest() {
  resultDisplay.textContent = "Testing...";
  highlightRing.style.borderColor = "deepskyblue";
  let totalSpeed = 0;
  const rounds = 5;

  for (let i = 0; i < rounds; i++) {
    const speed = await measureSpeed();
    totalSpeed += speed;
    updateNeedle(speed);
    resultDisplay.textContent = `Testing... ${speed.toFixed(1)} Mbps`;
    await sleep(800);
  }

  const finalSpeed = totalSpeed / rounds;
  updateNeedle(finalSpeed);
  resultDisplay.textContent = `Final Download Speed: ${finalSpeed.toFixed(2)} Mbps`;
}

function downloadResult() {
  const text = document.getElementById("result").innerText;
  const blob = new Blob([text], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "speedtest_result.txt";
  link.click();
}

// Draw ticks on wheel
const ticksContainer = document.getElementById("ticksContainer");
tickValues.forEach((value, index) => {
  const angle = minAngle + ((maxAngle - minAngle) * index) / (tickValues.length - 1);
  const tick = document.createElement("div");
  tick.className = "tick";
  tick.setAttribute("value", value);
  tick.style.transform = `rotate(${angle}deg)`;
  ticksContainer.appendChild(tick);
});
