var express = require('express');
var logfmt = require('logfmt');
var redis = require('redis');
var url = require('url');

// redis
var redisUrl = url.parse(process.env.REDISCLOUD_URL || 'redis://test:test@localhost:6379');
var redisHost = redisUrl.hostname;
var redisPort = redisUrl.port;
var redisPassword = redisUrl.auth.split(':')[1];
var redisClient = redis.createClient(redisPort, redisHost, { no_ready_check: true });
redisClient.auth(redisPassword);


// server
var app = express();
app.use(logfmt.requestLogger());
app.use(express.static(__dirname + '/public'));

app.get('/:id', function(req, res){
  redisClient.hgetall(req.params.id, function hmget(error, replies) {
    if (error) { res.jsonp(403, {}); }
    res.jsonp(replies);
  });
});

app.get('/ping', function(req, res){
  res.send('OK');
});


// main
var port = Number(process.env.PORT || 5000);
app.listen(port, function listen() {
  console.log("Started on " + port);
});

var Loader = require('./loader');
var loader = new Loader(redisHost, redisPort, redisPassword);
loader.run(function run(error, loaded) {
  if (error) { console.log('Loader failed: ' + error.message); }
  console.log('Loader loaded zipcodes: ' + loaded);
});


// keep it up
var url = process.env.HEROKU_URL || 'http://localhost:' + port + '/ping';
var Heartbeater = require('wakeitup');
var heartbeater = new Heartbeater(url);
setInterval(function () { heartbeater.run(); }, 1000 * 60 * 2);
