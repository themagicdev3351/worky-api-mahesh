let path = require('path');
const fs = require('fs-extra');
const Handlebars = require('handlebars');

path = path.join(__dirname, "../templates");

const forgotPasswordTemplateSource = fs.readFileSync(`${path}/forgotPassword.html`, { encoding: 'utf8' });
const getForgotTemplate = Handlebars.compile(forgotPasswordTemplateSource);

module.exports = {
  getForgotTemplate,
};
