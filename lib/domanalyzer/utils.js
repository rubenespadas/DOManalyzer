/*  This file is part of DOManalyzer.

    Copyright (C) 2015  Rubén Espadas

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var fs = require('fs');
var dns = require('dns');
var glob = require('glob');
var util = require('util');
var path = require('path');
var urlparse = require('url');
var punycode = require('punycode');

var loggers = require('./loggers.js');

var utils = {};

utils.absoluteUrl = function(url, src) {
    var u = src;
    if (src.indexOf('itms-services:') != -1 ) {
        src = src.split('url=', 2)[1];
    }
    if (src.indexOf('about:') != -1 ) {
        src = src.replace('about:', 'http:');
    }
    if ((src.indexOf('/') > 0)&&(url.indexOf(src) >= 0)&&(src.indexOf('http://')>0)) {
        src = '/' + src;
        u = urlparse.resolve(url, src);
    } else if (src.indexOf('//') == 0) {
        u = 'http:' + src;
    } else if ((src.indexOf('http') == -1) && (src.indexOf('\.com/') != -1)){
        u = 'http://' + src;
    } else if ((src.indexOf('http:') == 0) && (src.indexOf('//') == -1)){
        u = src.replace('http:', 'http://');
    } else if ((src.indexOf('http') != 0) && (src.indexOf('ftp') != 0)){
        u = urlparse.resolve(url, src);
    } else if (src.indexOf('about') == 0){
        u = urlparse.resolve(url, src.substring(6));
    } else {
        u = urlparse.resolve(url, src);
    }
    return u;
}

utils.addString = function (element, str) {
    if ((str !== undefined) && (str !=="") && (element.indexOf(str) === -1)) {
        try {
            element.push(punycode.toUnicode(str));
        } catch(e) {
            loggers.WARN(e);
            element.push(str);
        }
    }
    return element;
}

utils.save = function (dir, sha1, content, tojson) {
    try {
        try {
            fs.mkdirSync(dir);
        } catch (e) {
            if(e.code != 'EEXIST') {
                loggers.log('ERROR', e.toString());
            }
        }
        var path = dir + '/' + sha1.substring(0, 2)
        try {
            fs.mkdirSync(path);
        } catch (e) {
            if(e.code != 'EEXIST') {
                loggers.log('ERROR', e.toString());
            }
        }
        var filepath = path + '/' + sha1;
        var rewrite = true;
        if(tojson===true){
            content = JSON.stringify(content, null, 4);
            loggers.DEBUG('---------------------------------------------------------');
            loggers.DEBUG('[*] RESULTS');
            loggers.DEBUG('---------------------------------------------------------\n');
            loggers.DEBUG(content);
        } else {
            if (fs.existsSync(filepath)) {
                rewrite = false;
            }
        }
        if(rewrite===true){
            if(tojson) {
                fs.writeFile(filepath, content, 'utf-8', function(e) {
                    if(!e) {
                        console.log('[*] Saved report:\t%s\n', filepath);
                    } else {
                        loggers.log('ERROR', e.toString());
                    }
                });
            } else {
                fs.writeFile(filepath, content, 'binary', function(e) {
                    if(!e) {
                        console.log('[*] Saved sample:\t%s\n', filepath);
                    } else {
                        loggers.log('ERROR', e.toString());
                    }
                });
            }
        }
    } catch (e) {
        loggers.log('ERROR', e.toString());
    }
}

utils.getNavigatorsList = function(callback) {
    var reg = util.format('%s\/%s', __dirname, 'navigators/*.json');
    console.log(reg);
    glob(reg, { matchBase: true, nodir: false }, function (er, files) {
        var navigators = []
        if(!er) {
            files.forEach( function(file) {
                navigators.push(path.basename(file, '.json'));
            });
        } else {
            console.log(er);
        }
        callback(navigators);
    });
}

utils.fixedHtml = function(body, mimetype) {
    if (mimetype && mimetype.indexOf('html') != -1) {
        if (body.toLowerCase().indexOf('<html') == -1 && body.toLowerCase().indexOf('<!doctype html') == -1) {
            if (body.toLowerCase().indexOf('<head') != -1 ) {
                body = '<html>'+body+'</html>';
            } else {
                if (body.toLowerCase().indexOf('<script') == 0 ) {
                    body = '<html><head></head>'+body+'<body></body></html>';
                } else if (body.toLowerCase().indexOf('<form') == 0 ) {
                    body = '<html><head></head><body>'+body+'</body></html>';
                } else if (body.toLowerCase().indexOf('<meta http-equiv="refresh"') == 0 ) {
                    body = '<html><head>'+body+'<head><body></body></html>';
                } else if (body.toLowerCase().indexOf('<iframe') == 0) {
                    body = '<html><head><head><body>'+body+'</body></html>';
                } else if (body.toLowerCase().indexOf('<noscript') != -1) {
                    body = body.replace('<noscript>', '');
                    body = body.replace('</noscript>', '');
                    body = '<html><head><head><body>'+body+'</body></html>';
                } else {
                    body = '<html><head></head><script>'+body+'</script><body></body></html>';
                }
            }
        }
    } else if (mimetype &&  mimetype.indexOf('javascript') != -1) {
        if (body.toLowerCase().indexOf('<script') == 0 ) {
            body = '<html><head></head>'+body+'<body></body></html>';
        } else if (body.toLowerCase().indexOf('<form') == 0 ) {
                    body = '<html><head></head><body>'+body+'</body></html>';
        } else if (body.toLowerCase().indexOf('<meta http-equiv="refresh"') == 0 ) {
            body = '<html><head>'+body+'<head><body></body></html>';
        } else if (body.toLowerCase().indexOf('<iframe') == 0) {
            body = '<html><head><head><body>'+body+'</body></html>';
        } else if (body.toLowerCase().indexOf('<noscript') != -1) {
            body = body.replace('<noscript>', '');
            body = body.replace('</noscript>', '');
            body = '<html><head><head><body>'+body+'</body></html>';
        } else {
            body = '<html><head></head><script>'+body+'</script><body></body></html>';
        }
    }
    return body
}

utils.resolve = function(domain, timeout, callback) {
    var callbackCalled = false;
    var doCallback = function(err, ips) {
    if (callbackCalled) return;
        callbackCalled = true;
        callback(err, ips);
    };

    setTimeout(function() {
        doCallback(new Error("Timeout exceeded"), null);
    }, timeout);
    dns.resolve4(domain, doCallback);
};

module.exports = utils;
