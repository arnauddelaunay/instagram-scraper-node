
var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));
var fs = Promise.promisifyAll(require('fs'));
var path = require('path');

module.exports = function(username) {
    crawl(username);
};

function crawl(username, maxId) {
  var url = 'http://instagram.com/' + username + '/media' + ( '?&max_id=' + (maxId || '') );

  request.getAsync(url)
    .spread(function(resp, body) {
      var media = JSON.parse(body);

      if (media.more_available) {
        crawl(username, media.items[media.items.length -1].id);
      }

      media.items.forEach(function(item) {
          var mediaUrl = item[item['type'] + 's']['standard_resolution']['url'];
          var filename = path.basename(mediaUrl);
          var destDir = path.join('./', username);
          var file = path.join('./', username, filename);

        mkdir(destDir, function(err) {
          if (err) {
            return console.err(err);
          }

          request.getAsync(mediaUrl, {encoding: null})
            .spread(function(resp, body) {
              fs.writeFileAsync(file, body).then(function() {
                console.log('Downloaded ' + filename);
              });
            });
        });
      });
    });
}

function mkdir(path, mask, cb) {
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
