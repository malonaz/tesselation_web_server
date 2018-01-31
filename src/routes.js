const fs = require("fs");
const path = require("path");

const API_PREFIX = "/v1";
const ENDPOINTS_PATH = path.join(__dirname, 'endpoints');

// eslint-disable-next-line no-sync
  
module.routes = (app) => {
  fs.readdir(ENDPOINTS_PATH, (files) => {
    files
      .filter((file) => file.endsWith(".js"))
      .forEach((file) => {
        app.use(API_PREFIX + '/' + file, require('./endpoints/' + file));
      });
  });
};