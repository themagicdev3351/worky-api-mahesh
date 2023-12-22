const express = require('express');
const router = express.Router();
const submittedAssignmentController = require('../controllers/submittedAssignment');

router.post('/getListBy/student', (req, res, next) => submittedAssignmentController.getListByStudent(req, res, next));

router.post('/getBy/student/assignment', (req, res, next) => submittedAssignmentController.getByStudent(req, res, next));

router.post('/', (req, res, next) => submittedAssignmentController.create(req, res, next));

router.put('/grade/list', (req, res, next) => submittedAssignmentController.updateGradeList(req, res, next));

router.put('/:id', (req, res, next) => submittedAssignmentController.update(req, res, next));

module.exports = router;