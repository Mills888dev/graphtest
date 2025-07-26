// Setup Tabletop.js to fetch Google Sheets data
window.onload = function() {
  Tabletop.init({
    key: 'https://docs.google.com/spreadsheets/d/18ai-9n8gJz9X79aw2Wq7UndpzYFDksJtpyFb7PuU11I', // Mock Google Sheet URL
    simpleSheet: true,
    callback: function(data) {
      console.log(data);  // Log the data fetched
      renderGraph(data);  // Call render function with fetched data
    }
  });
};

// Render graph using Cytoscape.js
function renderGraph(data) {
  const elements = data.map(row => ({
    data: {
      id: row.ID,
      label: row.Label,
      parent: row.Parent || null,
      size: parseInt(row.Size) || 50,
      color: row.Color || "#FFFFFF"
    }
  }));

  // Define Cytoscape.js Graph
  const cy = cytoscape({
    container: document.getElementById('cy'),

    elements: elements,
    
    style: [
      {
        selector: 'node',
        style: {
          'shape': 'ellipse',
          'width': 'data(size)',
          'height': 'data(size)',
          'background-color': 'data(color)',
          'label': 'data(label)',
          'color': '#fff',
          'text-valign': 'center',
          'text-halign': 'center',
          'font-size': '14px'
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 2,
          'line-color': '#ccc',
          'target-arrow-color': '#ccc',
          'target-arrow-shape': 'triangle'
        }
      }
    ],

    layout: {
      name: 'circle',
      padding: 10
    }
  });

  // Adding parent-child relationships (edges)
  data.forEach(row => {
    if (row.Parent) {
      cy.add({
        data: {
          id: `${row.Parent}-${row.ID}`,
          source: row.Parent,
          target: row.ID
        }
      });
    }
  });

  cy.layout({
    name: 'circle',
    padding: 10
  }).run();
}
