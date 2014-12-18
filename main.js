var fs = require('fs');
var request = require('request');
var Socks5ClientHttpsAgent = require('socks5-https-client/lib/Agent');

var options = {
    url: 'https://www.google.com/',
    timeout: 5000,
    agent: new Socks5ClientHttpsAgent({
        socksHost: 'localhost',
        socksPort: 1080
    })    
};

request
    .get(options)
    .on('error', function(err) {
        console.log(err)
    })
    .pipe(fs.createWriteStream('test.html'))
    .on('exit', function(code) {
        process.exit(code);
    });

//request.get(options, function (error, response, body) {
//    if (!error && response.statusCode == 200) {
//        console.log(body) // Print the google web page.
//    }
//    else {
//        console.log(error.code);
//    }
//    
//    process.exit();
//})