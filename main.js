var fs = require('fs');
var request = require('request');
var Socks5ClientHttpsAgent = require('socks5-https-client/lib/Agent');
var cheerio = require('cheerio');
var async = require('async');

var options = {
    url: 'https://itunes.apple.com/us/app/gmail-email-from-google/id422689480?mt=8', //'https://www.google.com/',
    timeout: 10000,
//    agent: new Socks5ClientHttpsAgent({
//        socksHost: 'localhost',
//        socksPort: 1080
//    })    
};

//request.get(options)
//    .on('error', function(err) {
//        console.log(err)
//    })
//    .pipe(fs.createWriteStream('test.html'))
//    .on('exit', function(code) {
//        process.exit(code);
//    });

var download = function(uri, filename, callback){
  request.head(uri, function(err, res, body){
      console.log('downloading ' + uri + ' content-length:', res.headers['content-length'] + ' ' + filename);
      var ext = res.headers['content-type'].split('/')[1];
      request(uri).pipe(fs.createWriteStream(filename + '.' + ext)).on('close', callback);
  });
};

request.get(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        var $ = cheerio.load(body);
//        var links = $('.iphone-screen-shots img');
        var links = $('.ipad-screen-shots img');
        var pFunc = [];
        $(links).each(function(i, link) {
            var imgUrl = $(link).attr('src');
            pFunc.push(function(callback) {                
//                download(imgUrl, './iphone' + i, callback);
                download(imgUrl, './ipad' + i, callback);
            });
        });
        
        if (pFunc.length > 0) {
            async.parallel(pFunc, function(err, results) {
                if (err) {
                    console.log(err);
                }
                else {
                    console.log('All done!');
                }
                process.exit();
            });
        }
        else {
            console.log('no content found!');
        }        
    }
    else {
        console.log(error.code);
    }
});