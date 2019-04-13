// PACKAGE IMPORTS
const bodyParser = require('body-parser');
const cluster = require('express-cluster');
const cors = require('cors');
const cpuCount = require('os').cpus().length;
const errorCodes = require('./misc/errors/errorCodes');
const errors = require('./misc/errors/errorHandler');
const express = require('express');
const helmet = require('helmet');
const responseTime = require('response-time');
const timeout = require('connect-timeout');
const toobusy = require('express-toobusy')();

const constants = require('./config');
// EXPRESS THREAD COUNT SET UP
let threadCount;
if (process.env.THREAD_COUNT === 'CPU_COUNT' || process.env.THREAD_COUNT === 'CPU') {
  threadCount = cpuCount;
} else {
  try {
    threadCount = parseInt(process.env.THREAD_COUNT);
  } catch (e) {
    throw new Error('INVALID "INSTANCE_COUNT" environment variable. Exiting...');
  }
}

// EXPRESS SET UP
const app = express();
const globalEndpoint = constants.express.GLOBAL_ENDPOINT;

cluster(
  worker => {
    app.enable('trust proxy');

    app.use(timeout(constants.express.RESPONSE_TIMEOUT_MILLI));
    app.use(toobusy);
    app.use(
      bodyParser.urlencoded({
        extended: false
      })
    );
    app.use(bodyParser.json());
    app.use(cors());
    app.use(helmet());
    app.use(responseTime());

    // MAIN ENDPOINTS
    app.get(`${globalEndpoint}/`, (req, res) => {
      const response = errors.getResponseJSON(
        'ENDPOINT_FUNCTION_SUCCESS',
        'Welcome to the API! :)'
      );
      res.status(response.code).send(response.res);
    });

    app.get(`${globalEndpoint}/ping`, (req, res) => {
      const response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', 'pong');
      res.status(response.code).send(response.res);
    });

    app.use(require('./routes'));

    app.use((req, res, next) => {
      if (!req.timedout) next();
    });

    // Check that all error codes in errorCodes.js are unique
    function runTests() {
      const responseCodes = [];
      for (const currentError in errorCodes) {
        if (responseCodes.includes(errorCodes[currentError].RESPONSE_CODE)) return 1;
        responseCodes.push(errorCodes[currentError].RESPONSE_CODE);
      }
      return typeof process.env.PORT !== 'undefined' && process.env.PORT != null ? 0 : 1;
    }

    // Start server
    if (runTests() === 0) {
      const server = app.listen(process.env.PORT, () => {
        if (worker.id === 1) {
          console.log(`Listening on port ${server.address().port} with ${threadCount} threads.`);
        }
      });
    } else {
      throw new Error(
        'Please check that process.ENV.PORT is set and that all error codes in errorCodes.js are unique.'
      );
    }
  },
  {
    count: threadCount
  }
);
