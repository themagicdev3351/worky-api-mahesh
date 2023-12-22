const http = require('http');
const app = require('./src/bin/express');
const { env, port } = require('./src/bin/env-vars');
const { Connect } = require('./src/bin/mongoose');
const setGLobal = require('./src/constant/index');
const { initializeApp } = require('./src/bin/common');
// const { seedAllConfig } = require('./src/bin/seeder/seeder');
const { log } = require('./src/lib/utils/utils');

const server = http.createServer(app);
global.appPath = __dirname;

server.listen(port);

server.on("listening", async () => {
  await Connect();
  setGLobal.setGlobal();
  // await seedAllConfig();
  await initializeApp();

  log(`We're flying on ${env.toUpperCase()}_${port}`);
});


server.on("error", (error) => {
  log(`Server connection error : ${error.message}`);
});


module.exports = server;
