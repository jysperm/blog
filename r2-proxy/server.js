const express = require('express')
const {createProxyMiddleware} = require('http-proxy-middleware')

const app = express()

app.enable('trust proxy')

app.use((req, res, next) => {
  if (req.secure || req.url.startsWith('/__engine') || req.url.startsWith('/1.1/functions/_ops')) {
    next();
  } else {
    res.redirect('https://' + req.headers.host + req.url)
  }
})

app.use(createProxyMiddleware({
  target: 'https://pub-1d41c22a487d48109aa8404fc047e563.r2.dev',
  changeOrigin: true
}))

app.listen(process.env.LEANCLOUD_APP_PORT || 3000);
