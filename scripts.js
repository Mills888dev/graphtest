
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
    "Board": "#8E24AA",
    "Donor": "#3949AB",
    "Partner": "#039BE5",
    "Faculty/Staff": "#43A047",
    "Student/Alumni": "#FB8C00",
    "Parent": "#FDD835",
    "Other": "#78909C",
    "Central": "#E53935",
    "test": "#FFFFFF"
  };
  const colorMap = {
  Board: "#8E24AA",
  Donor: "#3949AB",
  Partner: "#039BE5",
  "Faculty/Staff": "#43A047",
  "Student/Alumni": "#FB8C00",
  Parent: "#FDD835",
  Other: "#78909C",
  Central: "#E53935"
};

  const elements = [];
  const nodeIds = new Set();

  data.forEach(row => {
    const id = row.ID || '';
    const label = row.Label || id;
    const size = parseInt(row.Size) || 60;
    // Collect all types marked TRUE in this row
    const selectedTypes = Object.keys(colorMap).filter(type => row[type]?.toLowerCase() === "true");

    // Determine color
    let color = "#FF007F"; // default
    if (selectedTypes.length === 1) {
      color = colorMap[selectedTypes[0]];
    } else if (selectedTypes.length > 1) {
      const colors = selectedTypes.map(t => colorMap[t]);
      // Use chroma.js to blend all selected colors
      color = chroma.mix(colors[0], colors[1], 0.5, 'lab');
      for (let i = 2; i < colors.length; i++) {
        color = chroma.mix(color, colors[i], 0.5, 'lab');
      }
    color = color.hex();
    }
    

    nodeIds.add(id);
    elements.push({
      data: { id, label, size, color }
    });
  });

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

function refreshGraph() {
  const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3eZlY581bQHv8_mK9eCmPwwJgrbTTXC9a1K7o5h_yN6jfWgI6ul_pWH-XPlItITXj1V1IXdJJL0k0/pub?output=csv";
  document.getElementById('cy').innerHTML = '';
  fetchSheetData(sheetURL, renderGraph);
}

window.onload = refreshGraph;
