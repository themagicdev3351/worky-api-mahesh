const router = require("express").Router();
const collectionController = require("../controllers/collection");

router.post('/list', (req, res, next) => collectionController.list(req, res, next));

router.post('/getBy/id', (req, res, next) => collectionController.getById(req, res, next));

router.get('/optionList', (req, res, next) => collectionController.optionList(req, res, next));

router.get('/favoriteList', (req, res, next) => collectionController.getFavoriteList(req, res, next));

router.post('/', (req, res, next) => collectionController.create(req, res, next));

router.put('/:id', (req, res, next) => collectionController.update(req, res, next));

router.delete('/:id', (req, res, next) => collectionController.delete(req, res, next));

module.exports = router;