const path = require('path');

// mailgun
const mailgun = require('mailgun-js')({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN
});

// email templates
const templateDir = path.join(__dirname, 'templates', 'contact');

const EmailTemplate = require('email-templates').EmailTemplate;
const contactTemplate = new EmailTemplate(templateDir);

exports.renderTemplate = (name, email, contact, cb) => {
  contactTemplate.render({name, contact}, (err, result) => {
    if(err) {
      return cb(err, 'ERROR (rendering email template)');
    }

    // return rendered template
    if(process.env.NODE_ENV !== 'prod') {
      return cb(null, result);
    }

    // send email
    const mailData = {
      from: 'Contacto <contacto@ideenegocios.com.ar>',
      to: email,
      subject: `Nuevo contacto en ${name}`,
      html: result.html
    };

    return mailgun.messages().send(mailData, (err, body) => {
      if(err) {
        return cb(err, 'ERROR (sending email)');
      }

      return cb(null, 'OK');
    });
  });
}
