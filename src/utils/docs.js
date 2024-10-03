const path = require('path');

function generateAPIDocs(app) {
    // Serve OpenAPI spec file
app.get('/openapi.yaml', (req, res) => {
    res.sendFile(path.join(path.resolve(__dirname, '../..'), 'openapi.yaml')); // The YAML file should be in the root of the project
  });
  
  // Serve Redoc
app.get('/docs', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>API Docs</title>
        <script src="https://cdn.jsdelivr.net/npm/redoc@latest/bundles/redoc.standalone.js"></script>
      </head>
      <body>
        <redoc spec-url='/openapi.yaml'></redoc>
        <script>
          Redoc.init('/openapi.yaml', {}, document.querySelector('redoc'));
        </script>
      </body>
      </html>
    `);
  });
}


module.exports = generateAPIDocs
