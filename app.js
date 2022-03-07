require('dotenv').config();

const express = require('express');
// PREPARE MAILGUN CLIENT
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
// INITIALIZE APP
const app = express();
// REQUIRE LIBRARIES
const { body, validationResult } = require('express-validator');
const yaml = require('js-yaml');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const path = require("path");
const handlebars = require("handlebars");
const fs = require("fs");
const csv = require('csv-parser');
// PREPARE MAILGUN CLIENT
const apiKey = process.env.API_KEY;
const domain = process.env.DOMAIN;
const mailgunClient = mailgun.client({ username: 'api', key: apiKey || '' });
// READ CONFIG
const fileContents = fs.readFileSync('config.yaml', 'utf8');
const CONFIG = yaml.load(fileContents);
// PREPARE TEMPLATE
const emailTemplateSource = fs.readFileSync(path.join(__dirname, "/template.hbs"), "utf8");
const template = handlebars.compile(emailTemplateSource)
const htmlToSend = template({message: "Hello"})
const fromWho = CONFIG.from;

app.post('/send', jsonParser, body('email').isEmail().withMessage('should be email'), async function (req, res) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const recipient = req.body.email;

  const data = {
    from: fromWho,
    to: recipient,
    subject: CONFIG.subject,
    html: htmlToSend
  };

  try {
    await mailgunClient.messages.create(domain, data);
    return res.json({ status: 'ok', email: req.params.mail });
  } catch (error) {
    return res.json({ status: 'error', error: error });
  }
});

app.post('/list', jsonParser, body('listName').isLength({ min: 2 }).withMessage('should exist and be min 2 characters length'), async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const listName = req.body.listName;

  try {
    let mailingList = '';
    const validListName = `${listName}@${domain}`;

    mailingList = await mailgunClient.lists.get(validListName).catch(async (err) => {
      if (err.status === 404) {
        const createdMailingList = await mailgunClient.lists.create({ address: validListName });

        console.info(`New mailing list ${createdMailingList.address} was created`);
        return createdMailingList;
      }
      throw new Error(err);
    });

    let members = [];
    
    const msgData = {
      from: fromWho,
      to: mailingList.address,
      subject: CONFIG.subject,
      html: htmlToSend
    };

    fs.createReadStream(CONFIG.csv_file)
    .pipe(csv())
    .on('data', async function(row) {
      try {
        members.push({
          address: row.email,
          name: row.name,
          subscribed: true
        });
        const message = `New member ${row.email} was added to mailing list: ${mailingList.address}`;
        console.info(message);
      }
      catch(err) {
        console.log(err);
      }
    })
    .on('end', async function() {
      await mailgunClient.lists.members.createMembers(mailingList.address, { members: members });

      try {
        await mailgunClient.messages.create(domain, msgData);
      } catch (error) {
        return res.json({ error: error });
      }

      return res.json({status: 'ok'});
    });
  } catch (error) {
    let transformedError = error;
    if (error.status === 400 && error.details) {
      transformedError = error.details;
    }
    return res.json({ error: transformedError });
  }
});

const port = 3030;
app.listen(port, () => {
  console.info(`server is listening on ${port}`);
});
