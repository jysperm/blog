const express = require('express');
const proxy = require('express-http-proxy');

const app = express();

app.enable('trust proxy');

app.use((req, res, next) => {
  if (req.secure || req.url.startsWith('/__engine') || req.url.startsWith('/1.1/functions/_ops')) {
    next();
  } else {
    res.redirect('https://' + req.headers.host + req.url);
  }
});

app.use(express.static('public/jysperm.me'));

app.use( (req, res, next) => {
  res.status(404).sendFile(`${__dirname}/public/${req.matchedDomain}/404/index.html`);
});

app.listen(process.env.LEANCLOUD_APP_PORT || 3000);
