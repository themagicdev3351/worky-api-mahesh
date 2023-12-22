const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const subjectController = require('../controllers/subject');

const st = multer.diskStorage({
    destination(req, file, cb) {
      cb(null, path.join(__dirname, "../public/upload"));
    },
    filename(req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix)
    },
});
const storage = multer({ storage: st, limits: { fieldSize: 25 * 1024 * 1024 } });

router.post('/list', (req, res, next) => subjectController.list(req, res, next));

router.post('/getBy/subject/list', (req, res, next) => subjectController.getBySubject(req, res, next));

router.post('/getBy/id/and/grade', (req, res, next) => subjectController.getByIdAndGrade(req, res, next));

router.post('/getBy/subject/topic/content/list', (req, res, next) => subjectController.getContentBySubjectTopic(req, res, next));

router.post('/', storage.single('image'), (req, res, next) => subjectController.create(req, res, next));

module.exports = router;