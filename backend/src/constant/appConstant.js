const { google } = require('googleapis')
var dotenv = require('dotenv')
dotenv.config();

const NODE_ENV = process.env.NODE_ENV

let ssl;
let frontendUrl;
let apiURL;
let googleRedirectUrl;
let adminFrontendUrl;

if (NODE_ENV === 'local') {
    ssl = 'http://';
    frontendUrl = 'localhost:3000/';
    apiURL = 'http://localhost:3001/';
    googleRedirectUrl = 'http://localhost:3001';
    adminFrontendUrl = 'http://localhost:3000';
}

if (NODE_ENV === 'development') {
    ssl = 'https://';
    frontendUrl = 'appdev.workybooks.com/';
    apiURL = 'https://apidev.workybooks.com/';
    googleRedirectUrl = 'https://apidev.workybooks.com';
    adminFrontendUrl = 'https://appdev.workybooks.com';
}

const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    googleRedirectUrl,
    // {passReqToCallback: true}
)

module.exports = {
    dataTable: { limit: 100, skip: 0 },

    awsContentImageUrl: "https://workybooks.s3.us-west-1.amazonaws.com/THUMBS/",

    aWSBucket: {
        development: { bucketName: '', s3BaseURL: '' },
        documentDirectory: '',
        subjectDirectory: '',
        region: '',
    },

    SMTPConfig: {
        EMAIL: 'themagicdev3351@gmail.com',
        PASSWORD: 'fnji hvru uxoa xxia', // Here Password is master key from smtp
        HOST: 'smtp.gmail.com',
        PORT: 587,
        FROM_EMAIL: 'themagicdev3351@gmail.com',
    },

    USER: { TYPE: { ADMIN: 3, TEACHER: 2, STUDENT: 1, GOOGLE: 4 } },

    SEEDER_DATA_CONFIG: {
        // roles: {
        //     uniqueField: 'type',
        //     model: 'roleModel'
        // }
    },

    ssl,
    frontendUrl,
    apiURL,
    adminFrontendUrl,
    oAuth2Client,
    NODE_ENV,
}