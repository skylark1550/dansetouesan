let timetableData = null;

/* ---------------- NORMALIZATION ---------------- */
function normalizeName(str) {
  return str.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

let stationLookup = {};

/* ---------------- LOAD DATA ---------------- */
fetch("data/shore_connect_export.json")
  .then(res => res.json())
  .then(json => {
    timetableData = json;

    // Normalize timetable station IDs and times
    timetableData.timetable.forEach(stop => {
      // Use stop.stationId if present, otherwise fallback to stop.station name
      stop.stationId = stop.stationId || normalizeName(stop.station);
      stop.trainId = String(stop.trainId);
      if (stop.departure && stop.departure.length === 5) stop.departure += ":00";
      if (stop.arrival && stop.arrival.length === 5) stop.arrival += ":00";
    });

    // Populate station lookup table
    timetableData.stations.forEach(st => {
      st.stationId = st.stationId || normalizeName(st.name);
      stationLookup[normalizeName(st.name)] = st;
    });

    populateStationDropdowns();
  })
  .catch(err => console.error("Data load failed:", err));

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
    from.add(new Option(st.name, st.name));
    to.add(new Option(st.name, st.name));
  });
}

/* ---------------- TIME HELPERS ---------------- */
function toSeconds(t) {
  if (!t) return 0;
  const parts = t.split(":").map(Number);
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  const s = parts[2] || 0;
  return h * 3600 + m * 60 + s;
}

function calculateDuration(start, end) {
  let s = toSeconds(start);
  let e = toSeconds(end);
  if (e < s) e += 86400;
  const d = e - s;
  return `${Math.floor(d / 3600)}h ${Math.floor((d % 3600) / 60)}m`;
}

/* ---------------- STATION SEARCH ---------------- */
document.getElementById("searchBtn").onclick = () => {
  if (!timetableData) return;

  const fromName = document.getElementById("fromStation").value;
  const toName   = document.getElementById("toStation").value;
  const timeRaw  = document.getElementById("departureTime").value;
  const after    = timeRaw ? (timeRaw.length === 5 ? timeRaw + ":00" : timeRaw) : "00:00:00";
  const typeFilter = document.getElementById("trainTypeFilter").value;

  const resultsDiv = document.getElementById("results");
  const loading    = document.getElementById("loading");
  const panel      = document.getElementById("timetablePanel");

  resultsDiv.innerHTML = "";
  panel.classList.add("hidden");
  panel.innerHTML = "";
  loading.classList.remove("hidden");

  setTimeout(() => {
    const fromSt = stationLookup[normalizeName(fromName)];
    const toSt   = stationLookup[normalizeName(toName)];

    if (!fromSt || !toSt || String(fromSt.stationId) === String(toSt.stationId)) {
      loading.classList.add("hidden");
      resultsDiv.innerHTML = "<p>Invalid station selection.</p>";
      return;
    }

    const matches = timetableData.trains.filter(train => {
      if (typeFilter && train.serviceType !== typeFilter) return false;

      // normalize IDs as strings
      const stops = timetableData.timetable
        .filter(s => String(s.trainId) === String(train.trainId))
        .map(s => ({
          ...s,
          stationId: String(s.stationId),
          departure: s.departure.length === 5 ? s.departure + ":00" : s.departure,
          arrival: s.arrival ? (s.arrival.length === 5 ? s.arrival + ":00" : s.arrival) : "00:00:00"
        }))
        .sort((a, b) => a.sequence - b.sequence);

      const a = stops.find(s => s.stationId === String(fromSt.stationId));
      const b = stops.find(s => s.stationId === String(toSt.stationId));

      if (!a || !b) return false;
      if (a.sequence >= b.sequence) return false;

      return toSeconds(a.departure) >= toSeconds(after);
    });

    loading.classList.add("hidden");

    if (!matches.length) {
      resultsDiv.innerHTML = "<p>No trains found.</p>";

      // diagnostic log
      console.log("No matches found. Debug info:");
      console.log("From station ID:", fromSt.stationId);
      console.log("To station ID:", toSt.stationId);
      console.log("Time after (seconds):", toSeconds(after));
      console.log("All trains:", timetableData.trains.map(t => String(t.trainId)));
      return;
    }

    renderResultsTable(matches, fromSt, toSt);
  }, 200);
};

/* ---------------- TRAIN NUMBER SEARCH ---------------- */
document.getElementById("trainSearchBtn").onclick = () => {
  const input = document.getElementById("trainIdInput").value.trim();
  const resultsDiv = document.getElementById("results");
  const panel = document.getElementById("timetablePanel");

  resultsDiv.innerHTML = "";
  panel.classList.add("hidden");

  if (!input) {
    resultsDiv.innerHTML = "<p>Enter a train ID.</p>";
    return;
  }

  const train = timetableData.trains.find(
    t => String(t.trainId).toUpperCase() === input.toUpperCase()
  );

  if (!train) {
    resultsDiv.innerHTML = "<p>Train not found.</p>";
    return;
  }

  showFullTimetable(train.trainId);
};

/* ---------------- RESULTS TABLE ---------------- */
function renderResultsTable(trains, fromSt, toSt) {
  const resultsDiv = document.getElementById("results");

  let html = `
    <table class="results-table">
      <thead>
        <tr>
          <th>Train</th>
          <th>Type</th>
          <th>Departs</th>
          <th>Arrives</th>
          <th>Duration</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
  `;

  trains.forEach(train => {
    const stops = timetableData.timetable
      .filter(s => String(s.trainId) === String(train.trainId))
      .sort((a, b) => a.sequence - b.sequence);

    const a = stops.find(s => String(s.stationId) === String(fromSt.stationId));
    const b = stops.find(s => String(s.stationId) === String(toSt.stationId));

    html += `
      <tr>
        <td>${train.trainId}</td>
        <td>${train.serviceType.replaceAll("_", " ")}</td>
        <td>${a.departure}</td>
        <td>${b.arrival}</td>
        <td>${calculateDuration(a.departure, b.arrival)}</td>
        <td>
          <button onclick="showFullTimetable('${train.trainId}')">View</button>
        </td>
      </tr>
    `;
  });

  html += "</tbody></table>";
  resultsDiv.innerHTML = html;
}

/* ---------------- FULL TIMETABLE ---------------- */
function showFullTimetable(trainId) {
  const train = timetableData.trains.find(t => String(t.trainId) === String(trainId));
  const stops = timetableData.timetable
    .filter(s => String(s.trainId) === String(trainId))
    .sort((a, b) => a.sequence - b.sequence);

  const panel = document.getElementById("timetablePanel");

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

  stops.forEach((s, i) => {
    const station = timetableData.stations.find(st => String(st.stationId) === String(s.stationId));
    html += `
      <tr>
        <td>${i + 1}</td>
        <td>${station.name}</td>
        <td>${s.arrival || "-"}</td>
        <td>${s.departure || "-"}</td>
      </tr>
    `;
  });

  html += "</tbody></table>";
  panel.innerHTML = html;
  panel.classList.remove("hidden");
}
