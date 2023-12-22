const router = require("express").Router()
const isAdmin = require('../../middleware/isAdmin')

// Admin
router.use('/auth', require('./auth'))
router.use('/user', isAdmin, require('./user'))
router.use('/student', isAdmin, require('./student'))
router.use('/assignment', isAdmin, require('./assignment'))

module.exports = router