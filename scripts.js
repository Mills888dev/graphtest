/**
 * Fetches CSV data from a Google Sheet and parses it into JSON.
 * @param {string} url - The published CSV URL of the Google Sheet.
 * @param {function} callback - The function to call with the parsed data.
 */
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

/**
 * Builds and displays the Cytoscape graph using sheet data.
 * @param {Array} data - Parsed array of node objects from the sheet.
 */
function renderGraph(data) {
  const elements = [];
  const nodeIds = new Set();

  // Add nodes (all circular, no compound/parent structure)
  data.forEach(row => {
    const id = row.ID || '';
    const label = row.Label || id;
    const size = parseInt(row.Size) || 60;
    const color = row.Color || '#888';

    nodeIds.add(id);

    elements.push({
      data: { id, label, size, color }
    });
  });

  // Add edges (connections only, no parenting)
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
    elements: elements,
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
          'target-arrow-color': '#aaa',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier'
        }
      }
    ],
    layout: {
      name: 'circle',
      padding: 10,
      avoidOverlap: true
    }
  });
}

// 🔗 CSV from your public Google Sheet
const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3eZlY581bQHv8_mK9eCmPwwJgrbTTXC9a1K7o5h_yN6jfWgI6ul_pWH-XPlItITXj1V1IXdJJL0k0/pub?gid=0&single=true&output=csv";

window.onload = () => {
  fetchSheetData(sheetURL, renderGraph);
};
