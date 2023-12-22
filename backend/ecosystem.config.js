module.exports = {
    apps : [{
    name   : "worky_api_dev",
    script : "./server.js",
    instances : "2",
    exec_mode : "cluster",    
    merge_logs : true,
    log_date_format : "YYYY-MM-DD HH:mm:ss Z"
  },
  {
    name   : "worky_api_test",
    script : "./server.js",
    instances : "2",
    exec_mode : "cluster",    
    merge_logs : true,
    log_date_format : "YYYY-MM-DD HH:mm:ss Z"
  },
  {
    name   : "worky_api",
    script : "./server.js",
    instances : "2",
    exec_mode : "cluster",    
    merge_logs : true,
    log_date_format : "YYYY-MM-DD HH:mm:ss Z"
  }]
}