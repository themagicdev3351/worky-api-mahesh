const { verifyToken } = require("../lib/passport/passport");
const { tokenResponseObject } = require('../lib/responseMessages/message')
const { USER } = require('../constant/appConstant')

module.exports = async (req, res, next) => {
  try {
    const token = req.body.token || req.query.token || req.headers['authorization']
    if (token) {
      const payload = await verifyToken(token);
      if (payload.id && payload.email && payload.type == USER.TYPE.ADMIN) {
        req.user = payload;
      } else if (payload.expiredAt) {
        return res.status(401).json(tokenResponseObject.tokenExpired)
      } else {
        return res.status(401).json(tokenResponseObject.unauthUser)
      }
      next();
    } else {
      return res.status(401).send(tokenResponseObject.noTokenPro)
    }
  } catch (error) {
    return res.status(401).send(tokenResponseObject.tokenError)
  }
};