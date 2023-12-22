const router = require("express").Router();
const assignmentController = require("../../controllers/assignment");

router.post('/list', (req, res, next) => assignmentController.list(req, res, next));

router.post('/getBy/id', (req, res, next) => assignmentController.getById(req, res, next));

router.post('/', (req, res, next) => assignmentController.create(req, res, next));

router.put('/:id', (req, res, next) => assignmentController.update(req, res, next));

router.delete('/:id', (req, res, next) => assignmentController.delete(req, res, next));

module.exports = router;