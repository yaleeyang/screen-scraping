#!/usr/bin/env node

/**
 * Module dependencies.
 */
var program = require('commander')
    , pkg = require('../package.json')
    , version = pkg.version;
var fs = require('fs');
var request = require('request');
var Socks5ClientHttpsAgent = require('socks5-https-client/lib/Agent');
var cheerio = require('cheerio');
var async = require('async');
var validator = require('validator');
var rules;

program
    .version(version)
    .usage('[options] <url rulejson>')
    .option('-s, --socks', 'add socks support')
    .option('-H, --sockshost [host]', 'add socks host (defaults to 127.0.0.1)', '127.0.0.1')
    .option('-p, --socksport [port]', 'add socks port (defaults to 1080)', 1080)
//    .option('-u, --url', 'add url (defaults to jade)')
//  .option('-J, --jshtml', 'add jshtml engine support (defaults to jade)')
//  .option('-H, --hogan', 'add hogan.js engine support')
//  .option('-c, --css <engine>', 'add stylesheet <engine> support (less|stylus) (defaults to plain css)')
//  .option('-f, --force', 'force on non-empty directory')
    .parse(process.argv);

function isJsonFile(filename) {
    try {
        var buf = fs.readFileSync(filename, "utf8");
        rules = JSON.parse(buf);
    }
    catch(e) {
        console.error(e);
        return false;
    }
    
    return true;
}

var options = {
//    url: 'https://itunes.apple.com/us/app/gmail-email-from-google/id422689480?mt=8', //'https://www.google.com/',
    timeout: 10000,
};

var validParameters = false;
if (program.args.length == 2) {
    if (validator.isURL(program.args[0])) {
        options.url = program.args[0];
        
        if (isJsonFile(program.args[1])) {
            validParameters = true;
        }
    }
}

if (!validParameters) {
    console.error("Must input one valid url and rule json file to proceed!");
    process.exit(1);
}

if (program.socks) {
    console.log(program.sockshost + program.socksport);
    
    var socksInfo = {};
    if (program.sockshost) {
        socksInfo.socksHost = program.sockshost;
    }
    if (program.socksport) {
        socksInfo.socksPort = program.socksport;
    }
    options.agent = new Socks5ClientHttpsAgent(socksInfo);
}

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
        var pFunc = [];
        
        rules.forEach(function(rule) {
            var links = $(rule.rule.div);
            $(links).each(function(i, link) {
                var imgUrl = $(link).attr(rule.rule.attr);
                pFunc.push(function(callback) {                
                    download(imgUrl, rule.download.path + rule.download.name + i, callback);
                });
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
                process.exit(1);
            });
        }
        else {
            console.log('no content found!');
            process.exit();
        }        
    }
    else {
        console.log(error.code);
        process.exit(1);
    }
});
  