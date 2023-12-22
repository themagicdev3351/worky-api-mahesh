const router = require("express").Router();
const gradeController = require("../controllers/grade");

router.post('/list', (req, res, next) => gradeController.list(req, res, next));

router.post('/getBy/id', (req, res, next) => gradeController.getById(req, res, next));

router.post('/getBy/grade/list', (req, res, next) => gradeController.getByGrade(req, res, next));

router.post('/', (req, res, next) => gradeController.create(req, res, next));

router.put('/:id', (req, res, next) => gradeController.update(req, res, next));

router.delete('/:id', (req, res, next) => gradeController.delete(req, res, next));

module.exports = router;