
const _ = require('lodash');
const crypto = require('crypto');
const omittedFields = ["-_id", "-dt_added", "-dt_upd"];

async function getConfigObj(model) {
    let config = await global[model].find({}).select(omittedFields).lean();
    config = config[0];
    return config;
}

async function setValueToSailsConfig(configObj, decryptionNeeded = false) {
    let configValue;
        for (let prop in configObj) {
        if (decryptionNeeded && !_.isString(configObj[prop])) {
            continue;
        }
        if (decryptionNeeded) {
            configValue = this.decrypt(configObj[prop]);
        } else {
            configValue = configObj[prop];
        }
        
        global.config[this.camelCaseToCapitalUnderscore(prop)] = configValue;
    }
}

module.exports = {
    async buildProjectConfig() {
        const projectConfig = await getConfigObj('projectConfigModel');
        setValueToSailsConfig(projectConfig);
    },

    async buildSetupConfig() {
        const setupConfig = await getConfigObj('setupConfigModel');
        setValueToSailsConfig(setupConfig, true);
    },

    decrypt(encText) {
        if (encText === '') {
            return encText;
        }
        const workingKey = "JDS2FBDJH41DSSF1DE6FBD1DV8UDSF5F7HNGI1FUSJ2J";
        let m = crypto.createHash('md5');
        m.update(workingKey);
        let key = m.digest();
        let iv = '\x0c\x0d\x0e\x0f\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b';
        let decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
        let decoded = decipher.update(encText, 'hex', 'utf8');
        decoded += decipher.final('utf8');

        return decoded;
    },

    camelCaseToCapitalUnderscore(inputStr) {
        let str = inputStr.replace(/(?:^|\.?)([A-Z])/g, (x, y) => {
            return `_${y}`;
        }).replace(/^_/, '');

        return str.toUpperCase();
    },


    getDecryptedObj(configObj) {
        let decryptedValue;
        let configValue;
        // eslint-disable-next-line guard-for-in
        for (let prop in configObj) {
            configValue = configObj[prop];
            if (!_.isString(configValue) || configValue === '') {
                continue;
            }
            decryptedValue = this.decrypt(configValue);
            configObj[prop] = decryptedValue;
        }

        return configObj;
    },

    encrypt(plainText) {
        if (plainText === '') {
            return plainText;
        }
        const workingKey = "JDS2FBDJH41DSSF1DE6FBD1DV8UDSF5F7HNGI1FUSJ2J";
        let m = crypto.createHash('md5');
        m.update(workingKey);
        if (m) {
            let key = m.digest();
            let iv = '\x0c\x0d\x0e\x0f\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b';
            let cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
            let encoded = cipher.update(plainText, 'utf8', 'hex');
            encoded += cipher.final('hex');

            return encoded;
        }
    },

    // from admin controller
    async updateConfig(params, model, securityEnabled = false) {

        let paramsToUpdate = _.omit(params, ['_id']);
        if (securityEnabled) {
            // eslint-disable-next-line guard-for-in
            for (let prop in paramsToUpdate) {
                paramsToUpdate[prop] = this.encrypt(paramsToUpdate[prop]);
            }
        }
        let updatedRecord = await global[model].findByIdAndUpdate({ _id: params._id }, paramsToUpdate, { new: true }).select(omittedFields).exec();
        setValueToSailsConfig(updatedRecord, securityEnabled);
        if (securityEnabled) {
            updatedRecord = this.getDecryptedObj(updatedRecord);
        }

        return updatedRecord;
    },

    // from admin controller
    async getSetupConfig() {
        let setupConfig = await getConfigObj('setupConfigModel');
        setupConfig = this.getDecryptedObj(setupConfig);

        return setupConfig;
    },

    // from admin controller
    async getProjectConfig() {
        const projectConfig = await getConfigObj('projectConfigModel');

        return projectConfig;
    }
}