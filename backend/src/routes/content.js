const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const contentController = require('../controllers/content');

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

router.post('/list', (req, res, next) => contentController.list(req, res, next));

router.post('/getBy/id', (req, res, next) => contentController.getById(req, res, next));

router.post('/', storage.single('image'), (req, res, next) => contentController.create(req, res, next));

router.post('/getBy/subGradeCcsTopic/search', (req, res, next) => contentController.search(req, res, next));

router.post('/getBy/keyw/ccs/sub/suggestion/search', (req, res, next) => contentController.getSuggestionSearch(req, res, next));

router.put('/like/:id', (req, res, next) => contentController.updateLike(req, res, next));

router.get('/favoriteList', (req, res, next) => contentController.getFavoriteList(req, res, next));

router.post('/populateList', (req, res, next) => contentController.getPopulateList(req, res, next));

router.get('/recent/contentList', (req, res, next) => contentController.getRecentContentList(req, res, next));

module.exports = router;