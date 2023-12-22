const router = require("express").Router();
const classroomController = require("../controllers/classroom");
const multer = require('multer');
const path = require('path');

const st = multer.diskStorage({
    destination(req, file, cb) {
      cb(null, path.join(__dirname, "../public/upload"));
    },
    filename(req, file, cb) {
        cb(null, "student.csv");
    },
});
const storage = multer({ storage: st, limits: { fieldSize: 25 * 1024 * 1024 } });

router.post('/list', (req, res, next) => classroomController.list(req, res, next));

router.post('/getBy/id', (req, res, next) => classroomController.getById(req, res, next));

router.get('/optionList', (req, res, next) => classroomController.optionList(req, res, next));

router.post('/', (req, res, next) => classroomController.create(req, res, next));

router.put('/:id', (req, res, next) => classroomController.update(req, res, next));

router.delete('/:id', (req, res, next) => classroomController.delete(req, res, next));

router.post('/importStudent', storage.single('file'), (req, res, next) => classroomController.importStudent(req, res, next))

router.post('/importClassroom', (req, res, next) => classroomController.importClassroom(req, res, next))

router.post('/googleClassroom', (req, res, next) => classroomController.googleClassroom(req, res, next))

router.post('/importGoogleClassroom', (req, res, next) => classroomController.importGoogleClassroom(req, res, next))

module.exports = router;