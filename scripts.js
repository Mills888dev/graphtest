// 🔗 Your published Google Sheet (as CSV)
const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3eZlY581bQHv8_mK9eCmPwwJgrbTTXC9a1K7o5h_yN6jfWgI6ul_pWH-XPlItITXj1V1IXdJJL0k0/pub?gid=0&single=true&output=csv";

function fetchSheetData(callback) {
  fetch(sheetURL)
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

function renderGraph(data) {
  const elements = [];
  const nodeIds = new Set();

  // Add nodes
  data.forEach(row => {
    const id = row.ID || '';
    const label = row.Label || id;
    const size = parseInt(row.Size) || 60;
    const color = row.Color || '#888';
    const type = row.Type || 'Other';

    nodeIds.add(id);

    elements.push({
      data: { id, label, size, color, type }
    });
  });

  // Add edges
  data.forEach(row => {
    if (row.Parent && nodeIds.has(row.Parent)) {
      elements.push({
        data: {
          id: `${row.Parent}->${row.ID}`,
          source: row.Parent,
          target: row.ID
        }
      });
    }
  });

  // Auto-detect root(s): nodes that aren't targets in any edge
  const targets = new Set(elements.filter(e => e.data?.target).map(e => e.data.target));
  const roots = elements
    .filter(e => e.data?.id && !targets.has(e.data.id))
    .map(e => e.data.id);

  const cy = cytoscape({
    container: document.getElementById("cy"),
    elements,
    style: [
      {
        selector: "node",
        style: {
          "shape": "ellipse",
          "background-color": "data(color)",
          "width": "data(size)",
          "height": "data(size)",
          "label": "data(label)",
          "text-valign": "center",
          "text-halign": "center",
          "color": "#fff",
          "font-size": "12px"
        }
      },
      {
        selector: "edge",
        style: {
          "width": 2,
          "line-color": "#aaa",
          "target-arrow-shape": "triangle",
          "target-arrow-color": "#aaa",
          "curve-style": "bezier"
        }
      }
    ],
    layout: {
      name: "breadthfirst",
      directed: true,
      spacingFactor: 1.6,
      padding: 20,
      avoidOverlap: true,
      roots
    }
  });
}

function refreshGraph() {
  document.getElementById("cy").innerHTML = "";
  fetchSheetData(renderGraph);
}

window.onload = refreshGraph;
