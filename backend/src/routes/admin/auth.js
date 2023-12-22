const router = require("express").Router();
const authController = require('../../controllers/admin/auth');
const isAdmin = require('../../middleware/isAdmin')

router.post('/login', (req, res, next) => authController.login(req, res, next));

router.post('/change-password', isAdmin, (req, res, next) => authController.changePassword(req, res, next));

module.exports = router;