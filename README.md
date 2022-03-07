# HATLAR

Simple NodeJS based API application for Mailgun

### Tech stack

![](https://camo.githubusercontent.com/a074f0beacc94a224c9179d5a453a102375549f458e6872d62e827169776bb7c/68747470733a2f2f7261772e6769746875622e636f6d2f6d61696c67756e2f6d656469612f6d61737465722f4d61696c67756e5f5072696d6172792e706e67)

- Mailgun API
- NodeJS
- ExpressJS

### Setup

As a first step - create account on Mailgun.

https://signup.mailgun.com/new/signup

### Add your credentials to Mailgun account
```
API_KEY=XXX
DOMAIN=XXX
```

### CSV file example

```
email,name,surname
hey@mail.com,Ivan,Ivanov
petr@gmail.com,Petr,Petrov
```

### Adjusting template

Please feel free to edit `template.hbs` and adjust yaml configuration in `config.yaml`, also see `app.js` for the email variables.

### Send one email request example

`POST /send/`

    curl -i -H 'Accept: application/json' -d 'email=petr@gmail.com' http://localhost:3030/send

### Response
`
{
  "status": "ok"
}
`

### Create email list and send emails request example

`POST /list/`

    curl -i -H 'Accept: application/json' -d 'listName=myList' http://localhost:3030/list

### Response
`
{
  "status": "ok"
}
`
