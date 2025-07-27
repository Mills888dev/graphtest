function fetchSheetData(callback) {
  fetch('hierarchical_network_sheet.csv')
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
  const elements = [];
  const nodeIds = new Set();

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
  name: 'breadthfirst',
  directed: true,
  padding: 30,
  spacingFactor: 1.75,
  avoidOverlap: true,
  roots: ['root']
    }
  });
}
const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3eZlY581bQHv8_mK9eCmPwwJgrbTTXC9a1K7o5h_yN6jfWgI6ul_pWH-XPlItITXj1V1IXdJJL0k0/pub?gid=0&single=true&output=csv";
window.onload = () => {
  fetchSheetData(sheetURL, renderGraph);
};

window.onload = refreshGraph;
