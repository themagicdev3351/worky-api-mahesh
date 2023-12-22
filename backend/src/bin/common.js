const { buildProjectConfig, buildSetupConfig } = require("../lib/config/projectSetupConfig");

module.exports = {
    async initializeApp() {
        console.log('buildProjectConfig');
        await buildProjectConfig();
        console.log('buildSetupConfig');
        await buildSetupConfig();
    }
}