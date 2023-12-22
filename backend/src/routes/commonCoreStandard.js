const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const commonCoreStandardController = require('../controllers/commonCoreStandard');

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

router.post('/list', (req, res, next) => commonCoreStandardController.list(req, res, next));

router.post('/getBy/id/and/grade', (req, res, next) => commonCoreStandardController.getByIdAndGrade(req, res, next));

router.post('/getBy/ccs/topic/content/list', (req, res, next) => commonCoreStandardController.getContentByCCSTopic(req, res, next));

router.post('/', storage.single('image'), (req, res, next) => commonCoreStandardController.create(req, res, next));

module.exports = router;