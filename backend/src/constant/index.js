const fs = require('fs');

// const models = require('../../models/indexModel');

exports.setGlobal = () => {

    global.config = {};

    /**
     * set all 'constant' file's 'objects' and 'variables' only, not index file.
     */
    let constantFiles = fs.readdirSync(__dirname);
    for (let file of constantFiles) {
        if (file != "index.js") {
            let fileName = require('./' + file);
            global.config = { ...global.config, ...fileName };
        }
    };

    /**
     * Set all 'collection' dynamically with 'filename' as a collection name with 'Model' like user to userModel.
     */
     const models = require('../models/indexModel');
    if (!Array.isArray(models)) {
        for (const [modelName, modelFile] of Object.entries(models)) {
            global[modelName] = modelFile;
        }
    } else {
        console.log(Date.now(), "Error while set models to Global Object. Check models/index* file.");
    }
    

    return "done";
}
