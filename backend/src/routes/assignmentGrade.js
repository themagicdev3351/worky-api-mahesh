const router = require("express").Router();
const assignmentGradeController = require("../controllers/assignmentGrade");

router.post('/list', (req, res, next) => assignmentGradeController.list(req, res, next));

router.post('/getBy/id', (req, res, next) => assignmentGradeController.getById(req, res, next));

router.post('/', (req, res, next) => assignmentGradeController.create(req, res, next));

router.put('/:id', (req, res, next) => assignmentGradeController.update(req, res, next));

router.delete('/:id', (req, res, next) => assignmentGradeController.delete(req, res, next));

module.exports = router;