const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpirationInterval: process.env.JWT_EXPIRATION_MINUTES,
  mongo: {
    uri: process.env.NODE_ENV === 'development' ? process.env.MONGO_URI_TEST : process.env.MONGO_URI,
    options: {
      /**
       * By default, mongoose will automatically build indexes defined in your schema when it connects. This is great for development,
       * but not ideal for large production deployments, because index builds can cause performance degradation.
       * If you set autoIndex to false, mongoose will not automatically build indexes for any model associated with this connection
       */
      autoIndex: true,
      /**
       * For long running applications, it is often prudent to enable keepAlive with a number of milliseconds.
       * Without it, after some period of time you may start to see "connection closed" errors for what seems like no reason.
       * If so, after reading this, you may decide to enable keepAlive
       */
      keepAlive: true,
      /**
       * The maximum number of sockets the MongoDB driver will keep open for this connection. By default, maxPoolSize is 100.
       * Keep in mind that MongoDB only allows one operation per socket at a time, so you may want to increase this if you find
       * you have a few slow queries that are blocking faster queries from proceeding. See Slow Trains in MongoDB and Node.js.
       * You may want to decrease maxPoolSize if you are running into connection limits
       */
      maxPoolSize: 10, // Default maxPoolSize: 100
      useNewUrlParser: true, // set by mongoose by default true.
      // useUnifiedTopology: true, // set by mongoose by default true.
      /**
       * Whether to connect using IPv4 or IPv6. This option passed to Node.js' dns.lookup() function.
       * If you don't specify this option, the MongoDB driver will try IPv6 first and then IPv4 if IPv6 fails
       */
      // family: 4,

      // // Support dropped  mongoose v 6.0.0 before
      // useCreateIndex: true, // set by mongoose by default true.
      // useFindAndModify: false, // set by mongoose by default false.
      // bufferMaxEntries: 0,
    },
  },
  rateLimitTime: process.env.RATE_LIMIT_TIME,
  rateLimitRequest: process.env.RATE_LIMIT_REQUEST,
  encryptionKey: process.env.ENCRYPTION_KEY,
  recordLimit: process.env.RECORD_LIMIT,
  // saltRound: process.env.NODE_ENV === 'development' ? 5 : 10,
  // logs: process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
  // Level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
  // morganConfig: process.env.NODE_ENV === 'production' ? MorganProd : {},
  // redisPort: process.env.REDIS_PORT, 
  // redisHost: process.env.REDIS_HOST,
};
