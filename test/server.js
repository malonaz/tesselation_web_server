require('dotenv').config({ silent: true });

const server = require('../src/server');
process.env.LOG_SILENT = true;
process.env.SOLVER_PATH = '../aps-app/bin/mock_processor';

let serverInstance = server.start(process.env.PORT || 3000);
module.exports = serverInstance;
