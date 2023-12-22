const fs = require('fs');
const { env } = require('../bin/env-vars');
const { log } = require('../lib/utils/utils');

const SetupConfig = require('./setupConfig');
const ProjectConfig = require('./projectConfig');
const Role = require('./role');

function createModelName() {

    /**
     * You must add filename without extension as a string, and set into 'setToStatic' Array.
     * set 'model filename + Model' as a key for model variable and also set value from ./filename.js
     */
    const setToStatic = ['projectConfig', 'role', 'setupConfig'];
    const models = {
        setupConfigModel: SetupConfig,
        projectConfigModel: ProjectConfig,
        roleModel: Role
    };

    /**
     * You must check the 'filename' as same as 'collection' name in singular.
     * '/^([a-z][A-Za-z]*)Model$/', This regex is for modelName and we can use it to globally.
     * checked only the file name and modelKeyName are same ro not.
     * require all model file from models folder, It returns array of string with file extension (like 'example.js').
     */
    const modelNameRegex = /^([a-z][A-Za-z]*)Model$/;

    for (const modelNameKey in models) {
        const exist = setToStatic.includes(modelNameKey.replace('Model', ''));
        if (!modelNameRegex.test(modelNameKey) || !exist) {
            delete models[modelNameKey];
            log(`Error: You need to check --> '${modelNameKey}' <-- which is static set.( 'filename + Model' like as 'userModel' )`);
        }
        if (typeof models[modelNameKey] !== 'function' && exist) {
            delete models[modelNameKey];
            log(`Error: ${modelNameKey} from statically set, Has not set proper mongoose.model function, Check in ${__dirname}/${modelNameKey.replace('Model', '.js')}`);
        }
    }

    /** Whenever you change the models/index* filename then you must change the below file filter 'string' which is compared. */
    const modelFiles = fs.readdirSync(__dirname).filter(file => file !== 'indexModel.js' && !setToStatic.includes(file.replace('.js', '')));
    for (const file of modelFiles) {
        /**
         * replace '.js' file extension with Model, and Create model name using 'filename + Model'.
         * like user is a filename and concat with model string( userModel ).
         */
        const modelNameKey = file.replace('.js', 'Model');
        if (modelNameRegex.test(modelNameKey)) {
            /**
             * Here we can require particular 'model file'(model is a collection).
             */
            const modelFromFile = require('./' + file);
            /** 
             * $caught is a meta key of mongoose model, Whenever any model file has more than one model exported it can't be set in model object.
             * mongoose has default 17 keys, keys list are below
             * ['hooks','base','modelName','model','db','discriminators','events','$appliedMethods','$appliedHooks','_middleware','$__insertMany','schema','collection','$__collection','Query','$init','$caught']
            */
            const checkObjectHasOneModel = Object.keys(modelFromFile);
            if (!checkObjectHasOneModel.includes("$caught") && checkObjectHasOneModel.length < 17)
                log(`Error: More then one model exported in ${__dirname}/'${modelNameKey.replace('Model', '.js')}' model file.`);
            else if (typeof modelFromFile !== 'function')
                log(`Error: ${modelNameKey}, Has not set proper mongoose.model function, Check in ${__dirname}/${modelNameKey.replace('Model', '.js')}`);
            else models[modelNameKey] = modelFromFile;

        } else {
            log(`Error: You have to rename '${modelNameKey.replace('Model', '.js')}' file, thisIsDromedaryCamelCase formate used, Special characters and symbols are not allowed including white space.`);
        }
    };

    if (env === "development" || env === "local") {
        console.log("----------------------- List of Model Object -----------------------");
        console.log(`----------------------- Number of Models : ${setToStatic.length + modelFiles.length} -----------------------`);
        console.log(`----------------------- Available Models : ${Object.keys(models).length} -----------------------`);
        console.log(models);
        console.log("------------------------- End Of ModelList -------------------------");
    }

    return models;
}

module.exports = createModelName();