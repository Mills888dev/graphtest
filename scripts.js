/**
 * Fetches CSV from Google Sheets and parses to JSON.
 * @param {string} url - Published CSV URL
 * @param {function} callback - Function to handle parsed data
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
 * Renders the Cytoscape graph using parsed sheet data.
 * @param {Array} data - Parsed sheet rows
 */
function renderGraph(data) {
  const elements = [];

  // Create nodes
  data.forEach(row => {
    elements.push({
      data: {
        id: row.ID,
        label: row.Label,
        parent: row.Parent || null,
        size: parseInt(row.Size) || 60,
        color: row.Color || "#888"
      }
    });
  });

  // Create edges
  data.forEach(row => {
    if (row.Parent) {
      elements.push({
        data: {
          id: `${row.Parent}-${row.ID}`,
          source: row.Parent,
          target: row.ID
        }
      });
    }
  });

  // Initialize Cytoscape
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
          'line-color': '#555',
          'target-arrow-color': '#555',
          'target-arrow-shape': 'triangle'
        }
      }
    ],
    layout: {
      name: 'circle',
      padding: 10
    }
  });
}

// 🔗 PUBLIC Google Sheet published as CSV
const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3eZlY581bQHv8_mK9eCmPwwJgrbTTXC9a1K7o5h_yN6jfWgI6ul_pWH-XPlItITXj1V1IXdJJL0k0/pub?gid=0&single=true&output=csv";

// Start render
window.onload = () => {
  fetchSheetData(sheetURL, renderGraph);
};
