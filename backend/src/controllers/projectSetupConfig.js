const Boom = require('@hapi/boom')
const { log } = require('../lib/utils/utils')
const { responseMessageObject } = require('../lib/responseMessages/message')
const { getProjectConfig, getSetupConfig, updateConfig } = require('../lib/config/projectSetupConfig')

module.exports = {
    getProjectConfig: async (req, res, next) => {
        try {
            const projectConfig = await getProjectConfig()
            if (!projectConfig) return next(Boom.notFound((await responseMessageObject('Config')).notFoundError))
    
            return res.status(200).json({ message: (await responseMessageObject('Project config', 'fetch')).success, projectConfig })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },
    
    getSetupConfig: async (req, res, next) => {
        try {
            let setupConfig = await getSetupConfig()
            if (!setupConfig) return next(Boom.notFound((await responseMessageObject('Config')).notFoundError))
    
            return res.status(200).json({ message: (await responseMessageObject('Setup config', 'fetch')).success, setupConfig })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },
    
    updateProjectConfig: async (req, res, next) => {
        try {
            let params = req.body
            const projectConfig = await updateConfig(params, 'projectConfigModel')
            if (!projectConfig) return next(Boom.notFound((await responseMessageObject('Project config', 'updated')).error))
    
            return res.status(200).json({ message: (await responseMessageObject('Project config', 'updated')).success, projectConfig })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },
    
    updateSetupConfig: async (req, res, next) => {
        try {
            let params = req.body
            const setupConfig = await updateConfig(params, 'setupConfigModel', true)
            if (!setupConfig) return next(Boom.notFound((await responseMessageObject('Setup config', 'updated')).error))
    
            return res.status(200).json({ message: (await responseMessageObject('Setup config', 'updated')).success, setupConfig })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },
}
