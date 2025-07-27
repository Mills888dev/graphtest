function fetchSheetData(url, callback) {
  fetch(url)
    .then(res => res.text())
    .then(csv => {
      const lines = csv.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(val => val.trim());
        return Object.fromEntries(values.map((v, i) => [headers[i], v]));
      });
      callback(data);
    });
}

function renderGraph(data) {
  const typeColors = {
    "Central": "#E53935",
    "Board": "#8E24AA",
    "Donor": "#3949AB",
    "Partner": "#039BE5",
    "Faculty/Staff": "#43A047",
    "Student/Alumni": "#FB8C00",
    "Parent": "#FDD835",
    "Other": "#78909C"
  };

  const elements = [];
  const nodeIds = new Set();

  // Create nodes
  data.forEach(row => {
    const id = row.ID || '';
    const label = row.Label || id;
    const type = row.Type || "Other";
    const size = parseInt(row.Size) || 60;
    const color = row.Color || typeColors[type] || "#888";

    nodeIds.add(id);

    elements.push({
      data: { id, label, size, color, type }
    });
  });

  // Create edges
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

  const cy = cytoscape({
    container: document.getElementById('cy'),
    elements,
    style: [
      {
        selector: 'node',
        style: {
          'shape': 'ellipse',
          'background-color': 'data(color)',
          'width': 'data(size)',
          'height': 'data(size)',
          'label': 'data(label)',
          'text-valign': 'center',
          'text-halign': 'center',
          'color': '#fff',
          'font-size': '12px',
          'overlay-opacity': 0
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
}

  });

  // Optional: show Type on hover
  cy.nodes().forEach(n => {
    n.qtip && n.qtip('destroy'); // if qTip2 used previously
    n.popper({
      content: () => {
        const el = document.createElement('div');
        el.className = 'tooltip';
        el.textContent = n.data('type');
        return el;
      },
      popper: { placement: 'top' }
    });
  });
}

// 🔗 Your public Google Sheet (must include 'Type' column)
const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3eZlY581bQHv8_mK9eCmPwwJgrbTTXC9a1K7o5h_yN6jfWgI6ul_pWH-XPlItITXj1V1IXdJJL0k0/pub?gid=0&single=true&output=csv";

function refreshGraph() {
  document.getElementById('cy').innerHTML = ''; // Clear old graph
  fetchSheetData(sheetURL, renderGraph);
}

window.onload = refreshGraph;

