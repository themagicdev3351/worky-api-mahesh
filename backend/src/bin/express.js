const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const route = require('../routes/indexRoute');
const adminRoute = require('../routes/admin/indexRoute');

let app = express();
const AppConfig = require('../lib/config/appConfig')

app.use(cors({ origin: '*' }));

// Body-Parser middleware
app.use(AppConfig.trimParams)

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "../public")));
app.use(express.static(path.join(__dirname, "../templates")));

app.use("/api/v1", route);
app.use("/admin/api/v1", adminRoute);

app.get("*", function (req, res, next) {
    res.sendFile(path.join(__dirname, "../templates/index.html"));
});

app.use(AppConfig.handleError)

module.exports = app;
