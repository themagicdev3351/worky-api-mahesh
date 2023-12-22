const mongoose = require('mongoose');
const { env, mongo: { uri, options } } = require('./env-vars');
const { log } = require('../lib/utils/utils');


mongoose.set('debug', env === 'development' || env === 'local');

mongoose.connection.on('error', (err) => {
  log(`Mongo Engine is down : ${err}`);
});

mongoose.connection.on('connected', () => {
  log(`Mongo Engine is up on ${env}`);
});

exports.Connect = async () => {
  mongoose.connect(uri, options);
  console.log('first')
  return mongoose.connection;
};
