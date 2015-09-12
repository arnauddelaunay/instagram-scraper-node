
var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));
var fs      = Promise.promisifyAll(require('fs'));
var path    = require('path');
var qs      = require('querystring');
var url     = require('url');

module.exports = function(username) {
  var destDir = path.join('./', username);

  _mkdir(destDir, function(err) {
    if (err) {
      return console.err(err);
    }

    new Scraper(username).crawl();
  });
};

function Scraper(username) {
  this.username = username;
  this.baseUrl = url.format({
    protocol : 'http',
    host     : 'instagram.com',
    pathname : path.join(username, 'media')
  });
}

Scraper.prototype.crawl = function(maxId) {
  var url  = this.baseUrl + '?' + qs.stringify({maxId: maxId});

  return request.getAsync(url)
    .spread(function(resp, body) {
      var media = JSON.parse(body);

      if (media.more_available) {
        this.crawl( media.items[media.items.length - 1].id );
      }

      media.items.forEach(this.download.bind(this));
    }.bind(this));
}

Scraper.prototype.download = function(item) {
  var mediaUrl  = item[item['type'] + 's']['standard_resolution']['url'];
  var filename  = path.basename(mediaUrl);
  var localFile = path.join('./', this.username, filename);

  return request.getAsync(mediaUrl, {encoding: null})
    .spread(function(resp, body) {
      fs.writeFileAsync(localFile, body).then(function() {
        console.log('Downloaded ' + filename);
      });
    });
}

function _mkdir(path, mask, cb) {
  if (typeof mask == 'function') {
    cb = mask;
    mask = 0777;
  }

  fs.mkdir(path, mask, function(err) {
    if (err) {
      if (err.code == 'EEXIST') {
        cb(null);  // ignore the error if the folder already exists
      } else {
        cb(err); // something else went wrong
      }
    } else {
      cb(null); // successfully created folder
    }
  });
}
