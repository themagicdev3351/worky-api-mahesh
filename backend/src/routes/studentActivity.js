const router = require('express').Router();
const studentActivityController = require("../controllers/studentActivity");

router.post('/', (req, res, next) => studentActivityController.create(req, res, next));

module.exports = router;