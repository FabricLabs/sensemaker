# Statute Scraper

```
const StatuteProvider = require('@jeeves/statute-scraper');
const service = new StatuteProvider();

service.on('debug', (...params) => console.debug(...params));

// Statutes
service.on('statute', (statute) => {

});

// Administrative Codes
service.on('code', (code) => {

});

// Court Rules
service.on('rule', (rule) => {

});
```
