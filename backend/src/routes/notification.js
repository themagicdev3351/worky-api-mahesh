const router = require("express").Router();
const notificationController = require("../controllers/notification");

router.post('/list', (req, res, next) => notificationController.list(req, res, next));

router.post('/getBy/id', (req, res, next) => notificationController.getById(req, res, next));

router.post('/', (req, res, next) => notificationController.create(req, res, next));

router.put('/:id', (req, res, next) => notificationController.update(req, res, next));

router.delete('/:id', (req, res, next) => notificationController.delete(req, res, next));

module.exports = router;