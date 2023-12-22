const _ = require('lodash')
const path = require('path')
const moment = require('moment');
var dotenv = require('dotenv')
dotenv.config()
const { recordLimit } = require("../../bin/env-vars");
const config = require("../../constant/appConstant");
const { staticResponseMessageObject } = require('../../lib/responseMessages/message');

async function isBase64(v, opts) {
    try {
        if (v instanceof Boolean || typeof v === 'boolean') { return false }

        if (!(opts instanceof Object)) { opts = {} }

        if (opts.allowEmpty === false && v === '') { return false }

        let regex = '(?:[A-Za-z0-9+\\/]{4})*(?:[A-Za-z0-9+\\/]{2}==|[A-Za-z0-9+\/]{3}=)?'
        const mimeRegex = '(data:\\w+\\/[a-zA-Z\\+\\-\\.]+;base64,)'

        if (opts.mimeRequired === true) {
            regex = mimeRegex + regex
        } else if (opts.allowMime === true) {
            regex = mimeRegex + '?' + regex
        }

        if (opts.paddingRequired === false) { regex = '(?:[A-Za-z0-9+\\/]{4})*(?:[A-Za-z0-9+\\/]{2}(==)?|[A-Za-z0-9+\\/]{3}=?)?' }

        return (new RegExp('^' + regex + '$', 'gi')).test(v)
    } catch (error) {
        throw new Error(error.message)
    }
}

async function getImageUrlList(list, id) {
    try {
        let result = []
        if (list && list.length) {
            result = await Promise.all(list.map((oneRecord) => {
                let item = {};
                item[id] = oneRecord._id;
                Object.assign(oneRecord, item)
                const regExp = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/
                if (regExp.test(oneRecord.image)) return oneRecord

                oneRecord.image = (path.join(__dirname, '/../../', '/public/upload/') + oneRecord.image).replace(/\\/g, '/')
                return oneRecord
            }))
        }
        return result
    } catch (error) {
        throw new Error(error.message)
    }
}

async function getOneImageUrL(image) {
    try {
        const regExp = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/
        if (regExp.test(image)) return image

        image = (path.join(__dirname, '/../../', '/public/upload/') + image).replace(/\\/g, '/')
        return image
    } catch (error) {
        throw new Error(error.message)
    }
}

module.exports = {
    log: (data) => {
        console.log(new Date(), data);
    },

    getCurrentTime() {
        return moment().valueOf();
    },

    getCurrentDateTime() {
        return moment().toISOString();
    },

    getCustomTime: async () => {
        const year = moment().year();
        const month = moment().month();
        const day = moment().day();
        const hour = moment().hour();
        const minute = moment().minute();
        const second = moment().second();
        const millisecond = moment().millisecond();

        return new Date(year, month, day, hour, minute, second, millisecond);
    },

    getStartOfDay: async (date) => moment(date).startOf('day').format(),

    getEndOfDay: async (date) => moment(date).endOf('day').format(),

    formatDate: async (date) => moment().format(date),

    addTime: (value, time = null, unit = 'minutes') => {
        if (!time) {
            return moment().add(value, unit).toISOString();
        }
        return moment(time).add(value, unit).toISOString();
    },

    sumOfTime: async (durations) => {
        const totalDurations = durations.slice(1).reduce((prev, cur) => moment.duration(cur).add(prev), moment.duration(durations[0]))
        const result = moment.utc(totalDurations.asMilliseconds()).format("HH:mm:ss")
        return result
    },

    isDatePast(date, dateToCompare) {
        return moment(date).isBefore(dateToCompare);
    },

    isDateFuture(date, dateToCompare) {
        return moment(date).isAfter(dateToCompare);
    },

    checkRequiredParams: async (fields, params) => {
        for (let field of fields) {
            if (
                typeof params[field] !== 'boolean' &&
                params[field] !== 0 &&
                !params[field]
            ) throw staticResponseMessageObject.badRequest;
        }
    },

    getSearchRegexp: async (value) => {
        if (value.toString().startsWith('+')) { return value.slice(1) }
        const result = { $regex: '.*' + value.trim() + '.*', $options: '-i' }
        return result
    },

    emailRegex: async (value) => {
        const emailRegex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/
        const isValidEmail = emailRegex.test(value)
        return isValidEmail
    },

    getFilter: async (options) => {
        let filter = { where: { or: [] } };
        if (options.page && options.limit) {
            if (options.limit > recordLimit) {
                filter.skip = (options.page - 1) * recordLimit;
                filter.limit = recordLimit;
            } else {
                filter.skip = (options.page - 1) * options.limit;
                filter.limit = options.limit;
            }
        }
        return filter;
    },

    // aWSBucket: { region, bucketName, documentDirectory }
    uploadImageToAwsS3: async (base64Document, documentName, aWSBucket) => {
        try {
            return new Promise(async (resolve, reject) => {
                const s3 = new aws.S3({
                    secretAccessKey: process.env.AWS_SECRET,
                    accessKeyId: process.env.AWS_ACCESSKEY,
                    region: aWSBucket.region,
                })

                let docContentType = await isBase64(base64Document, { allowMime: true })
                if (!docContentType) { return reject(new Error('Image must be in base64 format')) }
                const base64 = base64Document.indexOf(';base64,')

                const docExtension = base64Document.substring('data:image/'.length, base64Document.indexOf(';base64'))
                docContentType = base64Document.substring('data:'.length, base64)
                const buffer = Buffer.from(base64Document.replace(/^data:image\/\w+;base64,/, ''), 'base64')
                const regex = / /gi
                const fileName = documentName.replace(regex, '-') + '-' + new Date().getTime() + '.' + docExtension

                const option = {
                    Key: fileName,
                    Body: buffer,
                    ContentEncoding: 'base64',
                    ContentType: docContentType,
                    Bucket: `${aWSBucket.bucketName}/${aWSBucket.documentDirectory}`,
                }

                s3.putObject(option, (s3err, result) => {
                    if (s3err) reject('Error while uploading image')
                    return result
                })

                resolve(fileName)
            })

        } catch (e) {
            throw new Error(e.message)
        }
    },

    getImageUrlList,
    getOneImageUrL,
}