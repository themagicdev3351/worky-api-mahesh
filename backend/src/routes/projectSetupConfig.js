const router = require("express").Router();
const projectSetupConfigController = require('../controllers/projectSetupConfig');
const isAuth = require('../middleware/auth');

router.get('/project', isAuth, (req, res, next) => projectSetupConfigController.getProjectConfig(req, res, next))

router.get('/setup', isAuth, (req, res, next) => projectSetupConfigController.getSetupConfig(req, res, next))

router.put('/project', isAuth, (req, res, next) => projectSetupConfigController.updateProjectConfig(req, res, next))

router.put('/setup', (req, res, next) => projectSetupConfigController.updateSetupConfig(req, res, next))

module.exports = router;