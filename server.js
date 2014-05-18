var express = require('express');
var logfmt = require("logfmt");

var app = express();
app.use(logfmt.requestLogger());

app.get('/', function(req, res){
  res.send('Hello World');
});

app.get('/ping', function(req, res){
  res.send('OK');
});

var port = Number(process.env.PORT || 5000);
app.listen(port, function listen() {
  console.log("Started on " + port);
});

// keep it up
var url = process.env.HEROKU_URL || 'http://localhost:' + port + '/ping';
var Heartbeater = require('wakeitup');
var heartbeater = new Heartbeater(url);
setInterval(function () { heartbeater.run(); }, 1000 * 60 * 2);
