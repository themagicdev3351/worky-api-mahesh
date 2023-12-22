const AWS = require('aws-sdk')
var dotenv = require('dotenv')
dotenv.config()

module.exports = {

    getS3Instance: () => {
        AWS.config.update({ accessKeyId: process.env.AWS_ACCESSKEY, secretAccessKey: process.env.AWS_SECRET })
        // AWS.config.update({ accessKeyId: "AKIA5H4KG6VGPTXSACDD", secretAccessKey: "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" })
        var S3 = new AWS.S3()

        return S3
    }
}