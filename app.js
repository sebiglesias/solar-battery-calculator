// Solar Battery Bank & Inverter Calculator
const state = {
  dailyWh: 1800,
  chem: "lifepo4", // "lifepo4" (0.85) or "agm" (0.50)
  volts: 12,
  autonomy: 1,
  sunHours: 4.5
};

function init() {
  attachEventListeners();
  calculate();
}

function attachEventListeners() {
  const lifepo4Btn = document.getElementById("chemLifepo4");
  const agmBtn = document.getElementById("chemAgm");

  lifepo4Btn.addEventListener("click", () => {
    lifepo4Btn.classList.add("active");
    agmBtn.classList.remove("active");
    state.chem = "lifepo4";
    calculate();
  });

  agmBtn.addEventListener("click", () => {
    agmBtn.classList.add("active");
    lifepo4Btn.classList.remove("active");
    state.chem = "agm";
    calculate();
  });

  const whInput = document.getElementById("dailyWh");
  const voltsSelect = document.getElementById("systemVolts");
  const autoSelect = document.getElementById("autonomyDays");
  const sunInput = document.getElementById("sunHours");

  whInput.addEventListener("input", (e) => {
    state.dailyWh = parseFloat(e.target.value) || 0;
    calculate();
  });

  voltsSelect.addEventListener("change", (e) => {
    state.volts = parseInt(e.target.value, 10) || 12;
    calculate();
  });

  autoSelect.addEventListener("change", (e) => {
    state.autonomy = parseInt(e.target.value, 10) || 1;
    calculate();
  });

  sunInput.addEventListener("input", (e) => {
    state.sunHours = parseFloat(e.target.value) || 4.5;
    calculate();
  });

  // Preset Buttons
  document.querySelectorAll(".preset-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const wh = parseFloat(btn.dataset.wh);
      state.dailyWh = wh;
      whInput.value = wh;
      calculate();
    });
  });
}

function calculate() {
  const dod = state.chem === "lifepo4" ? 0.85 : 0.50;
  const usableWh = state.dailyWh * state.autonomy;
  const grossWh = usableWh / dod;
  const grossKwh = grossWh / 1000;

  // Amp-Hours at system voltage
  const totalAh = Math.ceil(grossWh / state.volts);

  // Batteries count (e.g. 100Ah units)
  const unitSize = 100;
  const numBatteries = Math.max(1, Math.ceil(totalAh / unitSize));

  // Solar array wattage needed (1.25 system inefficiency factor)
  const solarWattsRaw = (state.dailyWh * 1.25) / Math.max(1, state.sunHours);
  const solarWatts = Math.ceil(solarWattsRaw / 50) * 50; // round up to nearest 50W

  // Panels breakdown
  let panelsText = "";
  if (solarWatts <= 400) {
    panelsText = `${Math.ceil(solarWatts / 100)}× 100W Rigid Panels`;
  } else if (solarWatts <= 1000) {
    panelsText = `${Math.ceil(solarWatts / 200)}× 200W Monocrystalline Panels`;
  } else {
    panelsText = `${Math.ceil(solarWatts / 400)}× 400W High-Efficiency Panels`;
  }

  // MPPT sizing: Watts / Volts * 1.15
  const mpptCurrent = Math.ceil((solarWatts / state.volts) * 1.15);
  let mpptRec = "30 Amp MPPT";
  if (mpptCurrent <= 30) mpptRec = "30 Amp MPPT";
  else if (mpptCurrent <= 50) mpptRec = "50 Amp MPPT";
  else if (mpptCurrent <= 70) mpptRec = "60–70 Amp MPPT";
  else mpptRec = "80–100 Amp MPPT";

  // Inverter Sizing
  let inverterWatts = 1500;
  if (state.dailyWh < 1000) inverterWatts = 1000;
  else if (state.dailyWh <= 2200) inverterWatts = 2000;
  else if (state.dailyWh <= 4000) inverterWatts = 3000;
  else inverterWatts = 5000;

  // Weight estimation
  let estWeight = "";
  if (state.chem === "lifepo4") {
    const lbs = numBatteries * 24;
    estWeight = `≈ ${lbs} lbs (LiFePO4)`;
  } else {
    const lbs = numBatteries * 64;
    estWeight = `≈ ${lbs} lbs (Heavy Lead-Acid)`;
  }

  // DOM Updates
  document.getElementById("batteryAh").textContent = totalAh;
  document.getElementById("ahSuffix").textContent = `Amp-Hours (Ah) @ ${state.volts}V DC`;

  let configDesc = "";
  if (state.chem === "lifepo4") {
    configDesc = `≈ ${numBatteries}× ${state.volts}V 100Ah LiFePO4 (${grossKwh.toFixed(2)} kWh Total)`;
  } else {
    configDesc = `≈ ${numBatteries}× 12V 100Ah Heavy Deep-Cycle AGM (${grossKwh.toFixed(2)} kWh Total)`;
  }
  document.getElementById("batteryConfigText").textContent = configDesc;

  document.getElementById("solarWatts").textContent = `${solarWatts} Watts`;
  document.getElementById("solarPanelsText").textContent = panelsText;
  document.getElementById("inverterSize").textContent = `${inverterWatts} Watts`;
  document.getElementById("grossKwh").textContent = `${grossKwh.toFixed(2)} kWh`;
  document.getElementById("mpptAmps").textContent = mpptRec;
  document.getElementById("estWeight").textContent = estWeight;

  const lifespanEl = document.getElementById("lifespanVal");
  if (state.chem === "lifepo4") {
    lifespanEl.textContent = "3,500–5,000 Cycles (10+ Yrs)";
    lifespanEl.style.color = "#4ade80";
  } else {
    lifespanEl.textContent = "300–500 Cycles (2–3 Yrs)";
    lifespanEl.style.color = "#f87171";
  }
}

window.addEventListener("DOMContentLoaded", init);
