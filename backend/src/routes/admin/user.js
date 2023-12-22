const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const usersController = require('../../controllers/user')

const st = multer.diskStorage({
    destination(req, file, cb) {
      cb(null, path.join(__dirname, "../../public/upload"))
    },
    filename(req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix)
    },
})

const storage = multer({ storage: st, limits: { fieldSize: 25 * 1024 * 1024 } })

router.post('/list', (req, res, next) => usersController.list(req, res, next))

router.post('/getby/id', (req, res, next) => usersController.getById(req, res, next))

router.post('/', storage.single('avatar'), (req, res, next) => usersController.create(req, res, next))

router.put('/:id', storage.single('avatar'), (req, res, next) => usersController.update(req, res, next))

router.delete('/:id', (req, res, next) => usersController.delete(req, res, next))

module.exports = router