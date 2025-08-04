
// Mapping of types to base colors add more if needed is CASE SENSITIVE
const colorMap = {
  Board: "#0000ff",
  Donor: "#008000",
  Partner: "#FFD700",
  "Faculty/Staff": "#008080",
  "Student/Alumni": "#E04014",
  Parent: "#800080",
  Other: "#78909C",
  Central: "#ffffff",
  PHInternship: "#ffffff",
  Internship: "#FFD700",
  Black: "#000000"
};

// Fetch and parse Google Sheet CSV(sheet needs to be published publicly go fo file>share>publish to web)
function fetchSheetData(callback) {
  fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3eZlY581bQHv8_mK9eCmPwwJgrbTTXC9a1K7o5h_yN6jfWgI6ul_pWH-XPlItITXj1V1IXdJJL0k0/pub?output=csv")
    .then(res => res.text())
    .then(csv => {
      const lines = csv.trim().split("\n");
      const headers = lines[0].split(",").map(h => h.trim());
      const data = lines.slice(1).map(line => {
        const values = line.split(",").map(val => val.trim());
        return Object.fromEntries(values.map((v, i) => [headers[i], v]));
      });
      callback(data);
    });
}

// Determine color from T/F columns
function getBlendedColor(row) {
  const types = Object.keys(colorMap).filter(type => row[type]?.toLowerCase() === "true");

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 100;
  canvas.height = 100;

  let gradient;

  if (types.length >= 1) {
    gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    types.forEach((type, i) => {
      const stop = types.length === 1 ? 0.5 : i / (types.length - 1);
      gradient.addColorStop(stop, colorMap[type]);
    });
  } else {
    // default gray
    gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, "#888");
    gradient.addColorStop(1, "#888");
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  return canvas.toDataURL();
}

// Build and render graph
function renderGraph(data) {
  const elements = [];
  const nodeIds = new Set();

  // Add nodes
  data.forEach(row => {
    const id = row.ID || '';
    const label = row.Label || id;
    const size = parseInt(row.Size) || 60;
    const color = getBlendedColor(row);

    nodeIds.add(id);

    elements.push({
      data: { id, label, size, color }
    });
  });

  // Add edges from all parent references
  data.forEach(row => {
    const parents = row.Parents || row.Parent || "";
    const parentIDs = parents.split(",").map(p => p.trim()).filter(p => p);
    parentIDs.forEach(parent => {
      if (nodeIds.has(parent)) {
        elements.push({
          data: {
            id: `${parent}->${row.ID}`,
            source: parent,
            target: row.ID
          }
        });
      }
    });
  });

  const cy = cytoscape({
    container: document.getElementById('cy'),
    elements,
    style: [
      {
        selector: 'node',
        style: {
          'shape': 'ellipse',
          'background-image': 'data(color)',       
          'background-fit': 'cover',
          'background-clip': 'node',
          'width': 'data(size)',
          'height': 'data(size)',
          'label': 'data(label)',
          'text-valign': 'center',
          'text-halign': 'center',
          'color': '#fff',
          'font-size': '12px'
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 2,
          'line-color': '#aaa',
          'target-arrow-shape': 'triangle',
          'target-arrow-color': '#aaa',
          'curve-style': 'bezier'
        }
      }
    ],
    layout: {
      name: 'cose',
      animate: true, 
      padding: 30,
      fit: true
    },
    autoungrabify: true,
    userPanningEnabled: false,
    userZoomingEnabled: false,
    boxSelectionEnabled: false
  });
}
// Refresh graph button(SLATTED FOR DELETION)
function refreshGraph() {
  const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3eZlY581bQHv8_mK9eCmPwwJgrbTTXC9a1K7o5h_yN6jfWgI6ul_pWH-XPlItITXj1V1IXdJJL0k0/pub?output=csv";
  document.getElementById('cy').innerHTML = '';
  fetchSheetData(renderGraph);
}

window.onload = refreshGraph;
