let timetableData = null;

/* ---------------- NORMALIZATION ---------------- */
function normalizeName(str) {
  return str.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

let stationLookup = {};
let stopsByStation = {};
let stopsByTrain = {};

const MIN_LAYOVER_SECONDS = 5 * 60;

/* ---------------- LOAD DATA ---------------- */
fetch("data/shore_connect_export.json")
  .then(res => res.json())
  .then(json => {
    timetableData = json;

    timetableData.timetable.forEach(stop => {
      stop.stationId = String(stop.stationId || normalizeName(stop.station));
      stop.trainId = String(stop.trainId);
      if (stop.departure && stop.departure.length === 5) stop.departure += ":00";
      if (stop.arrival && stop.arrival.length === 5) stop.arrival += ":00";
    });

    timetableData.stations.forEach(st => {
      st.stationId = String(st.stationId || normalizeName(st.name));
      stationLookup[st.stationId] = st;
    });

    indexTimetable();
    populateStationDropdowns();
  })
  .catch(err => console.error("Data load failed:", err));

/* ---------------- INDEXING ---------------- */
function indexTimetable() {
  stopsByStation = {};
  stopsByTrain = {};

  timetableData.timetable.forEach(s => {
    if (!stopsByStation[s.stationId]) stopsByStation[s.stationId] = [];
    if (!stopsByTrain[s.trainId]) stopsByTrain[s.trainId] = [];

    stopsByStation[s.stationId].push(s);
    stopsByTrain[s.trainId].push(s);
  });

  Object.values(stopsByStation).forEach(arr =>
    arr.sort((a, b) => toSeconds(a.departure || a.arrival) - toSeconds(b.departure || b.arrival))
  );

  Object.values(stopsByTrain).forEach(arr =>
    arr.sort((a, b) => a.sequence - b.sequence)
  );
}

/* ---------------- MODE TOGGLE ---------------- */
const stationModeBtn = document.getElementById("stationMode");
const trainModeBtn   = document.getElementById("trainMode");
const stationSearch  = document.getElementById("stationSearch");
const trainSearch    = document.getElementById("trainSearch");

stationModeBtn.onclick = () => {
  stationModeBtn.classList.add("active");
  trainModeBtn.classList.remove("active");
  stationSearch.classList.remove("hidden");
  trainSearch.classList.add("hidden");
};

trainModeBtn.onclick = () => {
  trainModeBtn.classList.add("active");
  stationModeBtn.classList.remove("active");
  trainSearch.classList.remove("hidden");
  stationSearch.classList.add("hidden");
};

/* ---------------- STATIONS ---------------- */
function populateStationDropdowns() {
  const from = document.getElementById("fromStation");
  const to   = document.getElementById("toStation");

  timetableData.stations.forEach(st => {
    from.add(new Option(st.name, st.stationId));
    to.add(new Option(st.name, st.stationId));
  });
}

/* ---------------- TIME HELPERS ---------------- */
function toSeconds(t) {
  if (!t) return 0;
  const [h = 0, m = 0, s = 0] = t.split(":").map(Number);
  return h * 3600 + m * 60 + s;
}

function calculateDuration(start, end) {
  let s = toSeconds(start);
  let e = toSeconds(end);
  if (e < s) e += 86400;
  const d = e - s;
  return `${Math.floor(d / 3600)}h ${Math.floor((d % 3600) / 60)}m`;
}

function formatLayover(seconds) {
  return `${Math.floor(seconds / 60)}m`;
}

/* ---------------- STATION SEARCH ---------------- */
function normalizeServiceType(str) {
  return str.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

document.getElementById("searchBtn").onclick = () => {
  if (!timetableData) return;

  const fromId = document.getElementById("fromStation").value;
  const toId   = document.getElementById("toStation").value;
  const timeRaw = document.getElementById("departureTime").value;
  const after = timeRaw ? (timeRaw.length === 5 ? timeRaw + ":00" : timeRaw) : "00:00:00";
  const beforeRaw = document.getElementById("departureBefore").value;
  const before = beforeRaw ? (beforeRaw.length === 5 ? beforeRaw + ":00" : beforeRaw) : "23:59:59";
  const typeFilter = document.getElementById("trainTypeFilter").value;
  const directOnly = document.getElementById("directOnly").checked;
  const resultsDiv = document.getElementById("results");
  const loading = document.getElementById("loading");
  const panel = document.getElementById("timetablePanel");

  resultsDiv.innerHTML = "";
  panel.classList.add("hidden");
  loading.classList.remove("hidden");

  setTimeout(() => {
    const fromSt = stationLookup[fromId];
    const toSt = stationLookup[toId];

    if (!fromSt || !toSt || fromId === toId) {
      loading.classList.add("hidden");
      resultsDiv.innerHTML = "<p>Invalid station selection.</p>";
      return;
    }

    const results = [];

    // Direct trains
    for (const a of stopsByStation[fromId] || []) {
      if (toSeconds(a.departure) < toSeconds(after) || toSeconds(a.departure) > toSeconds(before)) continue;

      const stops = stopsByTrain[a.trainId];
      const b = stops.find(s => s.stationId === toId && s.sequence > a.sequence);
      if (!b) continue;

      const train = timetableData.trains.find(t => t.trainId === a.trainId);
      if (typeFilter && normalizeServiceType(train.serviceType) !== normalizeServiceType(typeFilter)) continue;

      results.push({ type: "direct", train1: train, from: a, to: b });
    }

    if (!directOnly) {
      /* -------- ONE TRANSFER -------- */
      for (const a of stopsByStation[fromId] || []) {
        if (toSeconds(a.departure) < toSeconds(after)) continue;

        const firstStops = stopsByTrain[a.trainId];
        const train1 = timetableData.trains.find(t => t.trainId === a.trainId);

        const reachableMidStations = firstStops
          .filter(mid => mid.sequence > a.sequence && stopsByStation[mid.stationId])
          .map(mid => ({ mid, arrivalSec: toSeconds(mid.arrival) }));

        for (const { mid, arrivalSec } of reachableMidStations) {
          const secondCandidates = stopsByStation[mid.stationId] || [];

          for (const b2 of secondCandidates) {
            if (b2.trainId === a.trainId) continue;
            if (toSeconds(b2.departure) - arrivalSec < MIN_LAYOVER_SECONDS) continue;

            const secondStops = stopsByTrain[b2.trainId];
            const end = secondStops.find(s => s.stationId === toId && s.sequence > b2.sequence);
            if (!end) continue;

            const train2 = timetableData.trains.find(t => t.trainId === b2.trainId);
            if (typeFilter && normalizeServiceType(train2.serviceType) !== normalizeServiceType(typeFilter)) continue;

            results.push({
              type: "transfer",
              train1,
              train2,
              from: a,
              mid,
              midDep: b2,
              to: end,
              layover: toSeconds(b2.departure) - arrivalSec
            });
          }
        }
      }
    }

    loading.classList.add("hidden");

    if (!results.length) {
      resultsDiv.innerHTML = "<p>No trains found.</p>";
      return;
    }

    renderResultsTable(results, fromSt, toSt);
  }, 200);
};

/* ---------------- RESULTS TABLE ---------------- */
function renderResultsTable(results, fromSt, toSt) {
  const resultsDiv = document.getElementById("results");

  let html = `
    <table class="results-table">
      <thead>
        <tr>
          <th>Route</th>
          <th>Departure</th>
          <th>Arrival</th>
          <th>Duration</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
  `;

  results.forEach(r => {
    if (r.type === "direct") {
      html += `
        <tr class="clickable" data-train-id="${r.train1.trainId}" data-from="${r.from.stationId}" data-to="${r.to.stationId}">
          <td>${r.train1.trainId}</td>
          <td>${r.from.departure}</td>
          <td>${r.to.arrival}</td>
          <td>${calculateDuration(r.from.departure, r.to.arrival)}</td>
          <td>Direct</td>
        </tr>
      `;
    } else {
      html += `
        <tr class="clickable" data-train-id="${r.train1.trainId},${r.train2.trainId}" data-from="${r.from.stationId}" data-to="${r.to.stationId}">
          <td>${r.train1.trainId} → ${r.train2.trainId}</td>
          <td>${r.from.departure}</td>
          <td>${r.to.arrival}</td>
          <td>${calculateDuration(r.from.departure, r.to.arrival)}</td>
          <td>Change at ${stationLookup[r.mid.stationId].name} (${formatLayover(r.layover)} layover)</td>
        </tr>
      `;
    }
  });

  html += "</tbody></table>";
  resultsDiv.innerHTML = html;

  // Add click listeners
  document.querySelectorAll(".clickable").forEach(row => {
    row.onclick = () => {
      const trainIds = row.dataset.trainId.split(",");
      const fromStation = row.dataset.from;
      const toStation = row.dataset.to;
      showFullTimetable(trainIds, fromStation, toStation);
    };
  });
}

/* ---------------- FULL TIMETABLE ---------------- */
function showFullTimetable(trainIds, fromStation, toStation) {
  const panel = document.getElementById("timetablePanel");
  panel.innerHTML = "";

  trainIds.forEach(trainId => {
    const train = timetableData.trains.find(t => t.trainId === trainId);
    const stops = stopsByTrain[trainId];

    let html = `
      <h3>${train.trainId} – ${train.serviceType.replaceAll("_", " ")}</h3>
      <table class="timetable-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Station</th>
            <th>Arrival</th>
            <th>Departure</th>
          </tr>
        </thead>
        <tbody>
    `;

    let highlight = false;
    stops.forEach((s, i) => {
      if (s.stationId === fromStation) highlight = true;
      const rowClass = highlight ? "style='background: orange; color: white'" : "";
      html += `
        <tr ${rowClass}>
          <td>${i + 1}</td>
          <td>${stationLookup[s.stationId].name}</td>
          <td>${s.arrival || "-"}</td>
          <td>${s.departure || "-"}</td>
        </tr>
      `;
      if (s.stationId === toStation) highlight = false;
    });

    html += "</tbody></table>";
    panel.innerHTML += html;
  });

  panel.classList.remove("hidden");
}

// Train number search
document.getElementById("trainSearchBtn").onclick = () => {
  if (!timetableData) return;

  const trainIdRaw = document.getElementById("trainIdInput").value.trim();
  if (!trainIdRaw) return;

  const trainId = normalizeName(trainIdRaw); // make sure format matches your stored trainId
  const train = timetableData.trains.find(t => t.trainId === trainId);

  const resultsDiv = document.getElementById("results");
  const loading = document.getElementById("loading");
  const panel = document.getElementById("timetablePanel");

  resultsDiv.innerHTML = "";
  panel.classList.add("hidden");
  loading.classList.remove("hidden");

  setTimeout(() => {
    if (!train || !stopsByTrain[trainId] || stopsByTrain[trainId].length === 0) {
      loading.classList.add("hidden");
      resultsDiv.innerHTML = "<p>No train found with that number.</p>";
      return;
    }

    loading.classList.add("hidden");

    // Show full timetable, highlight entire route
    const firstStation = stopsByTrain[trainId][0].stationId;
    const lastStation = stopsByTrain[trainId][stopsByTrain[trainId].length - 1].stationId;
    showFullTimetable([trainId], firstStation, lastStation);
  }, 100);
};
