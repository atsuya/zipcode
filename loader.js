var util = require('util');
var fs = require('fs');
var underscore = require('underscore');
underscore.str = require('underscore.string');
var DoneCriteria = require('done-criteria');
var redis = require('redis');

function Loader(host, port, password) {
  this.redisClient = redis.createClient(port, host, { no_ready_check: true });
  this.redisClient.auth(password);
}

Loader.prototype.run = function (callback) {
  var self = this;
  self.isLoaded(function isLoaded(error, loaded) {
    if (error) { return callback(error); }

    if (!loaded) {
      self.load(function load(error) {
        return callback(error, true);
      });
    } else {
      return callback(null, false);
    }
  });
};

Loader.prototype.isLoaded = function(callback) {
  this.redisClient.keys('*', function keys(error, replies) {
    if (error) { return callback(error); }

    var loaded = replies.length != 0;
    return callback(null, loaded);
  });
};

Loader.prototype.load = function (callback) {
  var prefectures = underscore.range(1, 48);
  var doneCriteria = new DoneCriteria(prefectures, function done(error) {
    return callback(error);
  });

  var self = this;
  prefectures.forEach(function each(value, index) {
    var number = underscore.str.pad(value, 2, '0');
    console.log('value: ' + value);
    console.log('number: ' + number);
    var path = util.format('./data/%s.json', number);
    console.log('Loading: ' + path);
    self.loadFile(path, function load(error) {
      if (error) { doneCriteria.error(error); }
      console.log('Done: ' + value);
      doneCriteria.done(value);
    });
  });
};

Loader.prototype.loadFile = function (path, callback) {
  var self = this;

  fs.readFile(path, function read(error, data) {
    var json = JSON.parse(data);
    var prefecture = json['name'];

    json.cities.forEach(function city(value, index) {
      var city = value.name;

      value.divisions.forEach(function division(value, index) {
        var division = value.name;
        var zipCode = value.zip_code;

        self.redisClient.hmset(zipCode, { prefecture: prefecture, city: city, division: division });
      });
    });

    return callback(null);
  });
};

module.exports = Loader;
