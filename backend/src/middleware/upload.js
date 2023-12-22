const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { staticResponseMessageObject } = require('../lib/responseMessages/message')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const location = path.join(__dirname, "../public/upload");
        if (fs.statSync(location) && file.fieldname == "image")
            cb(null, location);
        else
            cb(null, path.join(__dirname, "../public"));
    },
    filename: function (req, file, cb) {
        const randomName = Array(8).fill(null).map(() => (Math.round(Math.random() * 16)).toString(8)).join('') + (new Date().valueOf());
        cb(null, `${randomName}${path.extname(file.originalname)}`);
    }
});

const fileFilter = (req, file, cb) => {
    console.log("File filter", file);
    const mimeTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (mimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb("Invalid mime type.");//new Error('Invalid mime type.')
    }
}

const upload = multer({
    limits: { fileSize: 1024 * 1024 * 5 },// 5Mb
    fileFilter: fileFilter,
    storage: storage,
});

function storeMiddleWare(filename) {
    return function (req, res, next) {
        upload.fields([{ name: filename, maxCount: 5 }])(req, res, function (err) {
            if (err instanceof multer.MulterError) //console.log("Error: ",err);
                return res.badRequest(null, staticResponseMessageObject.fileTooLarge);
            if (err === "Invalid mime type.")
                return res.badRequest(null, staticResponseMessageObject.invalidMimeType);
            next();
        });
    }
}

// let simpleUpload = multer({ storage: storage });
// module.exports = simpleUpload;

module.exports = storeMiddleWare;