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
var iz = require('iz');
var dns = require('dns');
var util = require('util');
var crypto = require('crypto');
var mmmagic = require('mmmagic');
var request = require('request');

var utils = require('./domanalyzer/utils.js');
var loggers = require('./domanalyzer/loggers.js');
var win = require('./domanalyzer/window/window.js');

var domanalyzer = {}

var Magic = mmmagic.Magic;
var magic = new Magic();

var count = 0;

domanalyzer.analyze = function (url, referer, method, navs, repository, callback){
    console.log(util.format('[-] Analyze:\t\t%s\n[-] Navigators:\t\t%s\n'), url, navs);
    var results = {
        url: url,
        urlsha1: crypto.createHash('sha1').update(url).digest('hex'),
        navigators: {},
        errors: []
    };
    navs.forEach(function(nav){
        count++;
        domanalyzer.analyzeUrl(url, referer, method, nav, repository, function(error, r){
            if(!error) {
                r.url = undefined;
                results.navigators[nav] = r;
            } else {
                results.errors = [error.toString()]
            }
            count--;
            //loggers.log('COUNT', count);
            if(count === 0) {
                callback(results);
            }
        });
    });
};

domanalyzer.analyzeUrl = function(url, referer, method, nav, repository, callback) {
    var filepath_nav = util.format('./domanalyzer/navigators/%s.json', nav);
    try {
        var config = require(filepath_nav);
        loggers.log('CONFIG', util.format('Load %s navigator config', nav));
        var options = {
            'method': method,
            'url': url,
            'followRedirect': false,
            'strictSSL': false,
            'headers': {
                'User-Agent': config.userAgent
            },
            'encoding': 'binary',
            'timeout': 20000,
            'jar': true,
            'gzip': false
        }
        if (referer!==undefined) {
            options.headers['Referer'] = referer;
        }
        loggers.log('OPTIONS', options);
        request(
            options,
            function (e, response, body) {
                if(!e) {
                    try {
                        loggers.log('RESPONSE', response.toJSON());
                        var cookie = '';
                        var mimetype = undefined;
                        if ((response.headers)&&(response.headers['set-cookie'])) {
                            cookie = response.headers['set-cookie'][0];
                        }
                        if ((response.headers)&&(response.headers['content-type'])) {
                            mimetype = response.headers['content-type'];
                        }
                        var buf = new Buffer(body);
                        magic.detect(buf, function(err, mimetype_description) {
                            if(!err) {
                                win.Window(body, url, config, cookie, mimetype, function(results){
                                    results.mimetypeDescription = mimetype_description;
                                    results.mimetype = mimetype;
                                    if(response.headers) {
                                        results.headers = response.headers;
                                        loggers.log('HEADERS', response.headers);
                                        if(response.headers.location){
                                            var u = utils.absoluteUrl(results.url, response.headers.location);
                                            results.locations = utils.addString(results.locations, u);
                                            loggers.log('REDIRECT', u);
                                        }
                                    }
                                    results.statuscode = response.statusCode;
                                    if(body!==undefined){
                                        results.sha1 = crypto.createHash('sha1').update(body).digest('hex');
                                        loggers.log('BODY SHA-1', results.sha1);
                                    }
                                    dns.resolve4(response.socket._httpMessage._headers.host, function (error, addresses) {
                                        try {
                                            if(error) {
                                                loggers.log('ERROR', error.toString());
                                                if(iz.ip(response.socket._httpMessage._headers.host)) {
                                                    results.remoteAddress = [response.socket._httpMessage._headers.host];
                                                    loggers.log('REMOTE ADDRESSES', results.remoteAddress);
                                                }
                                            } else if (addresses) {
                                                results.remoteAddress = addresses;
                                                loggers.log('REMOTE ADDRESSES', results.remoteAddress);
                                            } else {
                                                results.errors = utils.addString(results.errors, error.toString());
                                                loggers.log('ERROR', error);
                                            }
                                        } catch (e) {
                                            results.errors = utils.addString(results.errors, e.toString());
                                            loggers.log('ERROR', e.toString());
                                        }
                                        if (results.sha1) {
                                            utils.save(repository, results.sha1, body, false);
                                        }
                                        callback(undefined, results);
                                    });
                                });
                            } else {
                                var results = {
                                    'errors': [err.toString()],
                                    'navigator': nav
                                }
                                callback(err, results);
                            }
                        });
                    } catch(e) {
                        var results = {
                            'errors': [e.toString()],
                            'navigator': nav
                        }
                        callback(e, results);
                    }
                } else {
                    var results = {
                        'errors': [e.toString()],
                        'navigator': nav
                    }
                    callback(e, results);
                }
            }
        );
    } catch (e) {
        console.log(e);
    }
}

module.exports = domanalyzer;
