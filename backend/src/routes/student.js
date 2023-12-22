const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const studentController = require("../controllers/student");

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

router.post('/list', (req, res, next) => studentController.list(req, res, next));

router.post('/getby/id', (req, res, next) => studentController.getById(req, res, next));

router.post('/', storage.single('avatar'), (req, res, next) => studentController.create(req, res, next));

router.post('/create/list', (req, res, next) => studentController.createList(req, res, next));

router.put('/:id', storage.single('avatar'), (req, res, next) => studentController.update(req, res, next));

router.delete('/:id', (req, res, next) => studentController.delete(req, res, next));

module.exports = router;