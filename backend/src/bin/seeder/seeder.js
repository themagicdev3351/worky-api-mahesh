const fs = require("fs");
const { log } = require("../../lib/utils/utils");
const _ = require("lodash");
const { SEEDER_DATA_CONFIG } = require("../../constant/appConstant");

async function seedData() {
    try {
        /** we will read like a pro**/
        let files = fs.readdirSync(`${global.appPath}/src/seeder-data`);

        /** get file names which are not listed in constant.json > SEEDER_DATA_CONFIG, for developer message.*/
        const checkToConstant = files.filter(fileName => !SEEDER_DATA_CONFIG[fileName.replace('.json', '')]);
        /** remove file which are not listed in constant.json > SEEDER_DATA_CONFIG*/
        files = files.filter(fileName => SEEDER_DATA_CONFIG[fileName.replace('.json', '')]);
        
        if (checkToConstant.length) {
            log("Some seeder data info not provided in constant, Check global constant 'SEEDER_DATA_CONFIG' object.");
            log(`info you not provided for.... ${checkToConstant}`.replace(/.json,/g, '.json,   '));
        }

        /** its important that we loop through all files **/
        await Promise.all(_.map(files, async (file) => {
            let modelName = file.split(".")[0];

            /** read the data before you seed them **/
            let data = JSON.parse(fs.readFileSync(`${global.appPath}/src/seeder-data/${file}`, 'utf8'));
            const seederConfig = global.SEEDER_DATA_CONFIG[modelName];

            //gives unique filed name
            const uniqueField = seederConfig.uniqueField;

            //get model name
            const Model = seederConfig.model;

            //gives the total unique field array
            let uniqueDataFieldsData = _.map(data, uniqueField);

            //finding out the current total records
            let records = await global[Model].find({
                [uniqueField]: uniqueDataFieldsData
            });

            if (records && _.size(records) > 0) {
                for (let record of records) {
                    let index = _.findIndex(data, {
                        [uniqueField]: record[uniqueField]
                    });
                    if (index > -1) {
                        data.splice(index, 1);
                    }
                }
            }

            /** add each record one after one**/
            await Promise.all(_.map(data, async (record) => {
                try {
                    /** Create new seeder record **/
                    await global[Model].create(record);
                } catch (e) {
                    log(`Error while seeding: ${e}`);
                }
            }));

            log(`Congratulations, we have seeded ${modelName} model successfully.`);
        }));
    } catch (e) {
        log(`Error while seeding: ${e}`);
    }
}

module.exports = {
    async seedAllConfig() { await seedData() }
};