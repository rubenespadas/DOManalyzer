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

var jsdom = require('jsdom');
var util = require('util');
var htmlparser = require('htmlparser2');
var Parser = require('parse5').Parser;
var par = new Parser();

var utils = require('../utils.js');
var loggers = require('../loggers.js');

exports.Window = function(html, url, config, cookie, mimetype, callback) {
    var document = undefined;
    var window = undefined;
    try {
        html = utils.fixedHtml(html, mimetype);
        try {
            document = jsdom.jsdom(
                html,
                {
                    FetchExternalResources: [],
                    ProcessExternalResources: [],
                    SkipExternalResources: true
                }
            )
        } catch(e) {
            loggers.log('ERROR', e.toString());
        }
        //document.readyState = 'loaded';
        document.cookie = cookie;
        var _setTimeout = setTimeout;
        global.setTimeout = function(func, timeout){
            var msg = 'setTimeout()'
            window.results.activity = utils.addString(window.results.activity, msg);
            msg = util.format('setTimeout(%s)', timeout);
            loggers.log(msg, func.toString());
            var result = undefined;
            if(func!=undefined){
                try {
                    result = func.call();
                } catch (e) {
                    try {
                        result = _eval(window, func);
                    } catch (e) {
                        loggers.log('ERROR', e.toString());
                        window.results.errors = utils.addString(window.results.errors, e.toString());
                    }
                }
            }
            if(document.isReady){
                window.onload();
            }
            return result;
        };
        global.clearTimeout = function(timer){
            var msg = 'clearTimeout()';
            window.results.activity = utils.addString(window.results.activity, msg),
            loggers.log('clearTimeout', timer);
        };
        window = document.defaultView;
        window.document = document;
        var _SetInterval = window.SetInterval;
        window.SetInterval = function(func, timeout){
            var msg = util.format('SetInterval(%s)', timeout);
            window.results.activity = utils.addString(window.results.activity, msg);
            loggers.log(msg, func.toString());
            var result = undefined;
           if(func!=undefined){
                try {
                    result = func.call();
                } catch (e) {
                    try {
                        result = _eval(window, func);
                    } catch (e) {
                        loggers.log('ERROR', e.toString());
                        window.results.errors = utils.addString(window.results.errors, e.toString());
                    }
                }
            }
            return result;
        };
        Object.defineProperty(window, 'onload', {
            set: function(code) {
                var msg = 'Rewrite onload function.';
                window.results.scripts = utils.addString(window.results.scripts, code.toString());
                window.results.activity = utils.addString(window.results.activity, msg);
                loggers.log(msg, code.toString());
            },
            get: function () {
                try {
                    window.document.body.valueOf = function() {
                        throw new Error('');
                    }
                    window.parser.write(html);
                    window.parser.end();
                    window.results.cookies = utils.addString(window.results.cookies, document.cookie);
                } catch (e) {
                    loggers.log('ERROR', e.toString());
                    window.results.errors = utils.addString(window.results.errors, e.toString());
                }
                callback(window.results);
                window.close();
            }
        });
        window.results = {
            'url': url,
            'scripts': [],
            'writes': [],
            'scripts_src': [],
            'iframes': [],
            'frames': [],
            'forms': [],
            'objects': [],
            'ajax': [],
            'gets': [],
            'locations': [],
            'actions_get': [],
            'actions_post': [],
            'staylink': [],
            'results': [],
            'visualBasic': [],
            'activity': [],
            'classids': [],
            'statuscode': undefined,
            'cookies': [],
            'files': [],
            'errors': []
        };
        var _addEvent = window.addEvent;
        window.addEvent = function(ev, func) {
            var result = undefined;
            var msg = util.format('window.addEvent(%s)', ev);
            window.results.scripts = utils.addString(window.results.scripts, func.toString());
            window.results.activity = utils.addString(window.results.activity, msg);
            if(_addEvent){
                result = _addEvent.call(window, ev, func);
            }
            loggers.log(msg, func.toString());
            return result;
        };
        var _addEventListener = window.addEventListener;
        window.addEventListener = function(ev, func, v) {
            var result = undefined;
            var msg = util.format('window.addEventListener(%s)', ev);
            window.results.scripts = utils.addString(window.results.scripts, func.toString());
            window.results.activity = utils.addString(window.results.activity, msg);
            if(_addEventListener){
                result = _addEventListener.call(window, ev, func);
            }
            loggers.log(msg, func.toString());
            if(func!=undefined){
                try {
                    result = func.call();
                } catch (e) {
                    try {
                        result = _eval(window, func);
                    } catch (e) {
                        loggers.log('ERROR', e.toString());
                        window.results.errors = utils.addString(window.results.errors, e.toString());
                    }
                }
            }
            return result;
        };
        var _attachEvent = window.attachEvent;
        window.attachEvent = function(ev, func, v) {
            var result = undefined;
            var msg = util.format('window.attachEvent(%s)', ev);
            window.results.scripts = utils.addString(window.results.scripts, func.toString());
            window.results.activity = utils.addString(window.results.activity, msg);
            if(_attachEvent){
                result = _attachEvent.call(window, ev, func);
            }
            loggers.log(msg, func.toString());
            return result;
        };
        window.getResults = function() {
            return this.results;
        };
        window.getDocument = function() {
            return this.document;
        };
        Object.defineProperty(window, 'StayLink', {
                set: function(url) {
                    var u = utils.absoluteUrl(window.results.url, url);
                    window.results.staylink = utils.addString(window.results.staylink, u);
                    loggers.log('StayLink', u);
                    return;
                }
            }
        );
        window.location.replace = function(url) {
            var msg = 'window.location.replace()';
            window.results.activity = utils.addString(window.results.activity, msg);
            var u = utils.absoluteUrl(window.results.url, url);
            window.results.locations = utils.addString(window.results.locations, u);
            loggers.log(msg, u);
            return;
        }
        window.onerror = function(func) {
            var msg = 'window.onerror()';
            window.results.activity = utils.addString(window.results.activity, msg);
            loggers.log(msg, funct.toString());
        };
        var _ajax = function(data) {
            var msg = '$.ajax()';
            if(typeof data == 'string'){
                var u = utils.absoluteUrl(window.results.url, data);
                window.results.ajax = utils.addString(window.results.ajax, u);
                loggers.log('$.ajax()', u);
            } else {
                var u = utils.absoluteUrl(window.results.url, data.url);
                window.results.ajax = utils.addString(window.results.ajax, u);
                loggers.log('$.ajax()', u);
            }
            if(data.success) {
                loggers.log('$ajax() SUCCESS', data.success.toString());
                try{
                    data.success.call();
                } catch (e) {
                    window.results.errors = utils.addString(window.results.errors, e.toString());
                    loggers.log('ERROR', e.toString());
                }
            }
            window.results.activity = utils.addString(window.results.activity, msg);
        };
        var _get = function(url, data) {
            var u = utils.absoluteUrl(window.results.url, url);
            var msg = util.format('$.get(%s)', u);
            window.results.activity = utils.addString(window.results.activity, msg);
            window.results.gets = utils.addString(window.results.gets, u);
            loggers.log('$.get()', util.format('(%s, %s)', url, data));
            if(data.success) {
                loggers.log('$.get() SUCESS', data.success.toString());
                try{
                    data.success.call();
                } catch (e) {
                    window.results.errors = utils.addString(window.results.errors, e.toString());
                    loggers.log('ERROR', e.toString());
                }
            }
        };
        var _eval = window.eval;
        window.eval = function(source, except) {
            var result = undefined;
            try{
                loggers.log('EVAL', source);
                if(!window.$) {
                    window.$ = {
                        ajax: _ajax,
                        get: _get
                    }
                } else {
                    window.$.ajax = _ajax;
                    window.$.get = _get;
                }
                if(window.jQuery) {
                    global.jQuery = window.jQuery;
                }
                if(except===undefined){
                    window.results.scripts = utils.addString(window.results.scripts, source.toString());
                    window.results.activity = utils.addString(window.results.activity, 'window.eval()');
                }
                try {
                    result = _eval.call(window, source);
                } catch(e) {
                    window.results.errors = utils.addString(window.results.errors, e.toString());
                    loggers.log('ERROR', e.toString());
                }
                if ((document)&&(document.location.href.indexOf(result) !== -1)) {
                    var u = utils.absoluteUrl(window.results.url, result);
                    window.results.locations = utils.addString(window.results.locations, u);
                    loggers.log('LOCATION', u);
                }
                if ((window.document)&&(window.document.location.href.indexOf(result) !== -1)) {
                    var u = utils.absoluteUrl(window.results.url, result);
                    window.results.locations = utils.addString(window.results.locations, u);
                    loggers.log('LOCATION', u);
                }
                window.results.cookies = utils.addString(window.results.cookies, document.cookie);
                if (result!==undefined) {
                    if ((typeof result!=='object')&&(result!=='undefined')) {
                        window.results.results = utils.addString(window.results.results, result.toString());
                        result = unescape(result.toString());
                        window.parser.write(result);
                        var fragment = par.parseFragment(result);
                        loggers.log('RESULT', result.toString());
                    } else {
                        //window.results.results = utils.addString(window.results.results, result);
                        loggers.log('RESULT', result);
                    }
                }
            } catch(e) {
                window.results.errors = utils.addString(window.results.errors, e.toString());
                loggers.log('ERROR', e.toString());
            }
            return result;
        };
        window.CollectGarbage = function() {
            var msg = 'window.CollectGarbage()';
            window.results.activity = utils.addString(window.results.activity, msg);
            loggers.log(msg, true);
        };
        window.SWFObject = function (movie, type, width, height, data) {
            var msg = 'window.SWFObject()';
            window.results.activity = utils.addString(window.results.activity, msg);
            window.results.objects = utils.addString(window.results.objects, utils.absoluteUrl(window.results.url, movie));
            loggers.log(msg, movie);
            this.addParam = function(param, value) {
                loggers.log(param, value);
                if(param=='flashvars'){
                    if(value.indexOf('&file=') == 0) {
                        value = value.substring(6);
                        window.results.objects = utils.addString(window.results.objects, value);
                    }
                }
            }
            this.embedSWF = function(movie, id, width, height, version, swfurl, vars, par, att, callback) {
                var msg = 'window.SWFObject.embedSWF()';
                window.results.activity = utils.addString(window.results.activity, msg);
                window.results.objects = utils.addString(window.results.objects, utils.absoluteUrl(window.results.url, movie));
                loggers.log(msg, movie);
            }
            this.registerObject = function(name) {
                var msg = util.format('window.SWFObject.registerObject(%s)', name);
                window.results.activity = utils.addString(window.results.activity, msg);
                loggers.log('window.SWFObject.embedSWF()', movie);
            }
            this.write = function(str) {
                loggers.log('SWFObject.write', str);
            }
        };
        window.swfobject = window.SWFObject;
        window.XMLHttpDownload = function(xml, url) {
            var msg = 'window.XMLHttpDownload()';
            var u =  utils.absoluteUrl(window.results.url, url);
            window.results.activity = utils.addString(window.results.activity, msg);
            window.results.objects = utils.addString(window.results.objects, u);
            loggers.log(msg, u);
            return u;
        };
        global.XMLHttpDownload = window.XMLHttpDownload;
        window.ActiveXObject = function(type) {
            var msg = util.format('window.ActiveXObject(%s)', type);
            window.results.activity = utils.addString(window.results.activity, msg);
            loggers.log('window.ActiveXObject()', type);
        };
        window.CreateObject = function(element, name) {
            var obj = {
                open: function(method, url, async) {
                    var u = utils.absoluteUrl(window.results.url, url)
                    window.results.objects = utils.addString(window.results.objects, u);
                }
            }
            var msg = util.format('window.CreateObject(%s)', name);
            window.results.activity = utils.addString(window.results.activity, msg);
            loggers.log(msg, name);
            return obj;
        };
        window.AD2BDStreamSave = function(o, name, data) {
            window.results.activity = utils.addString(window.results.activity, 'Drive-By');
            window.results.files.push(
                {
                    'name': name,
                    'url': data
                }
            )
            return 1;
        }
        var _write = document.write;
        document.write = function(text) {
            var result = undefined;
            try {
                if(window.results.writes.indexOf(text)==-1) {
                    window.results.writes = utils.addString(window.results.writes, text);
                    loggers.log('document.write()', text);
                    result = _write.call(document, text);
                    window.parser.write(text);
                    var fragment = par.parseFragment(text);
                    for(var i in fragment.childNodes) {
                        if (fragment.childNodes[i].nodeName === 'script') {
                            loggers.log('ATTRIBS', fragment.childNodes[i].attrs);
                            if ((fragment.childNodes[i].attrs[0]!==undefined)&&(fragment.childNodes[i].attrs[0].name==='src')) {
                                var msg = 'document.write(script)';
                                window.results.activity = utils.addString(window.results.activity, msg);
                                var u = utils.absoluteUrl(window.results.url, fragment.childNodes[i].attrs[0].value);
                                window.results.scripts_src = utils.addString(window.results.scripts_src, u);
                                loggers.log(msg, u);
                            } else if ((fragment.childNodes[i].attrs[1]!==undefined)&&(fragment.childNodes[i].attrs[1].name==='src')) {
                                var msg = 'document.write(script)';
                                window.results.activity = utils.addString(window.results.activity, msg);
                                var u = utils.absoluteUrl(window.results.url, fragment.childNodes[i].attrs[1].value);
                                window.results.scripts_src = utils.addString(window.results.scripts_src, u);
                                loggers.log(msg, u);
                            }
                        } else if (fragment.childNodes[i].nodeName === 'iframe') {
                            if ((fragment.childNodes[i].attrs[0]!==undefined)&&(fragment.childNodes[i].attrs[0].name==='src')) {
                                var msg = 'document.write(iframe)';
                                window.results.activity = utils.addString(window.results.activity, msg);
                                var u = utils.absoluteUrl(window.results.url, fragment.childNodes[i].attrs[0].value);
                                window.results.iframes = utils.addString(window.results.iframes, u);
                                loggers.log(msg, u);
                            }
                        } else if (fragment.childNodes[i].nodeName === 'img') {
                            if ((fragment.childNodes[i].attrs[0]!==undefined)&&(fragment.childNodes[i].attrs[0].name==='src')) {
                                var msg = 'document.write(img)';
                                window.results.activity = utils.addString(window.results.activity, msg);
                                var u = utils.absoluteUrl(window.results.url, fragment.childNodes[i].attrs[0].value);
                                window.results.scripts_src = utils.addString(window.results.scripts_src, u);
                                loggers.log(msg, u);
                            }
                        } else if (fragment.childNodes[i].nodeName === 'a') {
                            if ((fragment.childNodes[i].attrs[0]!==undefined)&&(fragment.childNodes[i].attrs[0].name==='href')) {
                                var msg = 'document.write(a)';
                                window.results.activity = utils.addString(window.results.activity, msg);
                                var u = utils.absoluteUrl(window.results.url, fragment.childNodes[i].attrs[0].value);
                                window.results.scripts_src = utils.addString(window.results.scripts_src, u);
                                loggers.log(msg, u);
                            }
                        } else {
                            var msg = util.format('document.write(%s)', fragment.childNodes[i].nodeName.replace('#',''));
                            window.results.activity = utils.addString(window.results.activity, msg);
                            loggers.log(msg, fragment.childNodes[i]);
                        }
                }
                }
                if (result!==undefined) {
                    loggers.log('RESULT', result.toString());
                }
            } catch (e) {
                window.results.errors = utils.addString(window.results.errors, e.toString());
                loggers.log('ERROR', e.toString());
            }
            return result;
        }
        window.results.userAgent = config.userAgent;
        window.document.write = document.write;
        window.document.writeln = document.write;
        Object.defineProperty(window.navigator, 'appVersion', {
                get: function() {
                    var msg = 'window.navigator.appVersion';
                    window.results.activity = utils.addString(window.results.activity, msg);
                    loggers.log(msg, true);
                    return config.appVersion;
                }
            }
        );
        Object.defineProperty(window.navigator, 'cookieEnabled', {
                get: function() {
                    var msg = 'window.navigator.cookieEnabled';
                    window.results.activity = utils.addString(window.results.activity, msg);
                    loggers.log(msg, true);
                    return config.cookieEnabled;
                }
            }
        );
        Object.defineProperty(window.navigator, 'platform', {
                get: function() {
                    var msg = 'window.navigator.platform';
                    window.results.activity = utils.addString(window.results.activity, msg);
                    loggers.log(msg, true);
                    return config.platform;
                }
            }
        );
        Object.defineProperty(window.navigator, 'javascript', {
                get: function() {
                    var msg = 'window.navigator.javascript';
                    window.results.activity = utils.addString(window.results.activity, msg);
                    loggers.log(msg, true);
                    return config.javascript;
                }
            }
        );
        Object.defineProperty(window.navigator, 'language', {
                get: function() {
                    var msg = 'window.navigator.language';
                    window.results.activity = utils.addString(window.results.activity, msg);
                    loggers.log(msg, true);
                    return config.language;
                }
            }
        );
        Object.defineProperty(window.navigator, 'userAgent', {
                get: function() {
                    var msg = 'window.navigator.userAgent';
                    window.results.activity = utils.addString(window.results.activity, msg);
                    loggers.log(msg, true);
                    return config.userAgent;
                }
            }
        );
        Object.defineProperty(window.navigator, 'appName', {
                get: function() {
                    var msg = 'window.navigator.appName';
                    window.results.activity = utils.addString(window.results.activity, msg);
                    loggers.log(msg, true);
                    return config.appName;
                }
            }
        );
        Object.defineProperty(window.navigator, 'javaEnabled', {
                get: function() {
                    var msg = 'window.navigator.javaEnabled';
                    window.results.activity = utils.addString(window.results.activity, msg);
                    loggers.log(msg, true);
                    return config.javaEnabled;
                }
            }
        );
        window.navigator.mimeTypes = {
            'application/x-shockwave-flash': {}
        }
        window.navigator.mimeTypes['application/x-shockwave-flash'].enabledPlugin = config.activeFlash;
        window.navigator.mimeTypes.length = 1;
        global.navigator = window.navigator;
        Object.defineProperty(window, 'ScriptEngine', {
                get: function() {
                    var msg = 'window.navigator.ScriptEngine';
                    window.results.activity = utils.addString(window.results.activity, msg);
                    loggers.log(msg, true);
                    return config.ScriptEngine;
                }
            }
        );
        Object.defineProperty(window, 'ScriptEngineMajorVersion', {
                get: function() {
                    var msg = 'window.navigator.ScriptEngineMajorVersion';
                    window.results.activity = utils.addString(window.results.activity, msg);
                    loggers.log(msg, true);
                    return config.ScriptEngineMajorVersion;
                }
            }
        );
        Object.defineProperty(window, 'ScriptEngineMinorVersion', {
                get: function() {
                    var msg = 'window.navigator.ScriptEngineMinorVersion';
                    window.results.activity = utils.addString(window.results.activity, msg);
                    loggers.log(msg, true);
                    return config.ScriptEngineMinorVersion;
                }
            }
        );
        Object.defineProperty(window, 'ScriptEngineBuildVersion', {
                get: function() {
                    var msg = 'window.navigator.ScriptEngineBuildVersion';
                    window.results.activity = utils.addString(window.results.activity, msg);
                    loggers.log(msg, true);
                    return config.ScriptEngineBuildVersion;
                }
            }
        );
        window._last_script = '';
        window._control = false;
        window._visualBasic = false;
        window.parser = new htmlparser.Parser(
            {
                onopentag: function(name, attribs){
                    if (name === 'script') {
                        if (attribs.src) {
                            var u = utils.absoluteUrl(window.results.url, attribs.src);
                            window.results.scripts_src = utils.addString(window.results.scripts_src, u);
                            loggers.log('SCRIPT SRC', u);
                        } else {
                            loggers.log('SCRIPT ATTRIBS', attribs);
                            if((attribs.language)&&(attribs.language==='VBScript')) {
                                window._visualBasic = true;
                            }
                            window._control = true;
                        }
                    } else if (name === 'iframe'){
                        if(attribs.src) {
                            var u = utils.absoluteUrl(window.results.url, attribs.src);
                            window.results.iframes = utils.addString(window.results.iframes, u);
                            loggers.log('IFRAME', u);
                            if ((attribs.style)&&(attribs.style.indexOf('hidden')!=-1)) {
                                window.results.activity = utils.addString(window.results.activity, 'Hidden iFrame');
                                loggers.log('HIDDEN', true)
                            }
                        }
                    } else if ((name === 'frame')&&(attribs.src)) {
                        var u = utils.absoluteUrl(window.results.url, attribs.src);
                        window.results.frames = utils.addString(window.results.frames, u);
                        loggers.log('FRAME', u);
                    } else if ((name === 'object')&&(attribs.classid)) {
                        window.results.classids = utils.addString(window.results.classids, attribs.classid);
                        loggers.log('OBJECT', attribs.classid);
                    } else if ((name === 'embed')&&(attribs.src)) {
                        var u = utils.absoluteUrl(window.results.url, attribs.src);
                        window.results.objects = utils.addString(window.results.objects, u);
                        loggers.log('EMBED', u);
                    } else if ((name === 'meta')&&(attribs['http-equiv'])) {
                        if(attribs['http-equiv'].toLowerCase() === 'refresh') {
                            var msg = 'Meta http-equiv=REFRESH';
                            window.results.activity = utils.addString(window.results.activity, msg);
                            try {
                                var data = attribs.content.split(';');
                                var u = data[1];
                                if (u.indexOf('url=')!=-1) {
                                    var tmp = u.split('=');
                                    var u2 = '';
                                    for( var i = 1; i <= tmp.length ; i++){
                                        if(tmp[i]!==undefined){
                                            u2 += util.format('=%s', tmp[i])
                                        }
                                    }
                                    u = u2.substring(1, u2.length);
                                } else if (u.indexOf('URL=')!=-1) {
                                    var tmp = u.split('=');
                                    var u2 = '';
                                    for( var i = 1; i <= tmp.length ; i++){
                                        if(tmp[i]!==undefined){
                                            u2 += util.format('=%s', tmp[i])
                                        }
                                    }
                                    u = u2.substring(1, u2.length);
                                }
                                var redirect =  utils.absoluteUrl(window.results.url, u);
                                window.results.locations = utils.addString(window.results.locations, redirect);
                                loggers.log('REDIRECT', redirect);
                            } catch (e) {
                                window.results.errors = utils.addString(window.results.errors, e.toString());
                                loggers.log('ERROR', e.toString());
                            }
                        }
                    } else if (name === 'form') {
                        var u = window.results.url;
                        if (attribs.action) {
                            u = utils.absoluteUrl(window.results.url, attribs.action);
                        }
                        if(attribs.method==='get'){
                            window.results.actions_get = utils.addString(window.results.actions_get, u);
                        } else {
                            window.results.actions_post = utils.addString(window.results.actions_post, u);
                        }
                        loggers.log('ATTRIBS', attribs);
                        loggers.log('ACTION', attribs.action);
                        loggers.log('METHOD', attribs.method);
                    }
                },
                onclosetag: function(tag) {
                    if(tag==='script') {
                        window._last_script = window._last_script.replace(/^\s+|\s+$|^\t+|\t+$|^\r+|\r+$\^\n+|\n+$/g, '')
                        if(window._last_script != ''){
                            loggers.log('SCRIPT', window._last_script);
                            if(!window._visualBasic) {
                                if(window.results.scripts.indexOf(window._last_script)==-1){
                                    window.results.scripts = utils.addString(window.results.scripts, window._last_script);
                                    window.eval(window._last_script, true);
                                }
                            } else {
                                var msg = 'VBScript';
                                window.results.activity = utils.addString(window.results.activity, msg);
                                window.results.visualBasic = utils.addString(window.results.visualBasic, window._last_script);
                            }
                            window._last_script = '';
                        }
                        window._visualBasic = false;
                        window._control = false;
                    }
                },
                ontext: function(text) {
                    if(window._control===true) {
                        if(text!=='') {
                            window._last_script += text
                        }
                    }
                }
            },
            {
                decodeEntities: true,
                lowerCaseTags: true
            }
        );
        var _getElementsByTagName = document.getElementsByTagName;
        document.getElementsByTagName = function(name) {
            var elements = [];
            try {
                elements = _getElementsByTagName.call(document, name);
                for(i=0; elements[i]; i++) {
                    elements[i].appendChild = function(child) {
                        try {
                            if((child._localName.toLowerCase()==='script')&&(child._attributes.src)&&(child._attributes.src._nodeValue != undefined)) {
                                window.results.scripts_src = utils.addString(window.results.scripts_src, utils.absoluteUrl(window.results.url, child._attributes.src._nodeValue));
                            } else if((child._localName.toLowerCase()==='iframe')&&(child._attributes.src)&&(child._attributes.src._nodeValue != undefined)) {
                                window.results.iframes = utils.addString(window.results.iframes, utils.absoluteUrl(window.results.url, child._attributes.src._nodeValue));
                            } else if((child._localName.toLowerCase()==='frame')&&(child._attributes.src)&&(child._attributes.src._nodeValue != undefined)) {
                                window.results.frames = utils.addString(window.results.frames, utils.absoluteUrl(window.results.url, child._attributes.src._nodeValue));
                            } else if((child._localName.toLowerCase()==='object')&&(child._attributes.value)&&(child._attributes.value._nodeValue != undefined)) {
                                window.results.objects = utils.addString(window.results.objects, utils.absoluteUrl(window.results.url, child._attributes.value._nodeValue));
                            }
                        } catch (e) {
                            loggers.log('ERROR', e.toString());
                            window.results.errors = utils.addString(window.results.errors, e.toString());
                        }
                    }
                }
            } catch (e) {
                window.results.errors = utils.addString(window.results.errors, e.toString());
                loggers.log('ERROR', e.toString());
            }
            return elements;
        };
        var _getElementById = document.getElementById;
        document.getElementById = function(id) {
            element = undefined;
            try {
                element = _getElementById.call(document, id);
                if(element){
                    element.appendChild = function(child) {
                        if (child._localName) {
                            var msg = util.format('appendChild(%s)', child._localName.toLowerCase());
                            window.results.activity = utils.addString(window.results.activity, msg);
                            try {
                                if ((child._localName.toLowerCase()==='script')&&(child._attributes.src!=undefined)&&(child._attributes.src._nodeValue != undefined)) {
                                    window.results.scripts_src = utils.addString(window.results.scripts_src, utils.absoluteUrl(window.results.url, child._attributes.src._nodeValue));
                                } else if((child._localName.toLowerCase()==='iframe')&&(child._attributes.src!=undefined)&&(child._attributes.src._nodeValue != undefined)) {
                                    window.results.iframes = utils.addString(window.results.iframes, utils.absoluteUrl(window.results.url, child._attributes.src._nodeValue));
                                } else if((child._localName.toLowerCase()==='frame')&&(child._attributes.src!=undefined)&&(child._attributes.src._nodeValue != undefined)) {
                                    window.results.frames = utils.addString(window.results.frames, utils.absoluteUrl(window.results.url, child._attributes.src._nodeValue));
                                } else if((child._localName.toLowerCase()==='object')&&(child._attributes.value!=undefined)&&(child._attributes.value._nodeValue != undefined)) {
                                    window.results.objects = utils.addString(window.results.objects, utils.absoluteUrl(window.results.url, child._attributes.value._nodeValue));
                                }
                            } catch (e) {
                                loggers.log('ERROR', e.toString());
                                window.results.errors = utils.addString(window.results.errors, e.toString());
                            }
                        }
                    }
                    var _setAttribute  = element.setAttribute;
                    element.setAttribute = function(attr, value) {
                        if(attr.toLowerCase()==='src') {
                            try {
                                if((el.toLowerCase()==='script')&&(value != undefined)) {
                                    window.results.scripts_src = utils.addString(window.results.scripts_src, utils.absoluteUrl(window.results.url, value));
                                } else if((el.toLowerCase()==='iframe')&&(value != undefined)) {
                                    window.results.iframes = utils.addString(window.results.iframes, utils.absoluteUrl(window.results.url, value));
                                } else if((el.toLowerCase()==='frame')&&(value != undefined)) {
                                    window.results.frames = utils.addString(window.results.frames, utils.absoluteUrl(window.results.url, value));
                                } else if(((el.toLowerCase()==='object')||(el.toLowerCase()==='embed'))&&(value != undefined)) {
                                    window.results.objects = utils.addString(window.results.objects, utils.absoluteUrl(window.results.url, value));
                                }
                            } catch (e) {
                                loggers.log('ERROR', e.toString());
                                window.results.errors = utils.addString(window.results.errors, e.toString());
                            }
                        } else if ((attr.toLowerCase()==='style')&&(value==='visibility:hidden')) {
                            window.results.activity = utils.addString(window.results.activity, 'visibility:hidden');
                        } else if (attr.toLowerCase() == 'classid') {
                            window.results.classids = utils.addString(window.results.classids, value);
                        }
                    }
                }
            } catch(e) {
                loggers.log('ERROR', e.toString());
            }
            return element
        }
        var _createElement = document.createElement;
        document.createElement = function(el) {
            var element = undefined;
            try {
                var msg = util.format('createElement(%s)', el.toLowerCase());
                window.results.activity = utils.addString(window.results.activity, msg);
                element = _createElement.call(document, el);
                if(element){
                    element.appendChild = function(child) {
                        if (child._localName) {
                            var msg = util.format('appendChild(%s)', child._localName.toLowerCase());
                            window.results.activity = utils.addString(window.results.activity, msg);
                            try {
                                if ((child._localName.toLowerCase()==='script')&&(child._attributes.src!=undefined)&&(child._attributes.src._nodeValue != undefined)) {
                                    window.results.scripts_src = utils.addString(window.results.scripts_src, utils.absoluteUrl(window.results.url, child._attributes.src._nodeValue));
                                } else if((child._localName.toLowerCase()==='iframe')&&(child._attributes.src!=undefined)&&(child._attributes.src._nodeValue != undefined)) {
                                    window.results.iframes = utils.addString(window.results.iframes, utils.absoluteUrl(window.results.url, child._attributes.src._nodeValue));
                                } else if((child._localName.toLowerCase()==='frame')&&(child._attributes.src!=undefined)&&(child._attributes.src._nodeValue != undefined)) {
                                    window.results.frames = utils.addString(window.results.frames, utils.absoluteUrl(window.results.url, child._attributes.src._nodeValue));
                                } else if((child._localName.toLowerCase()==='object')&&(child._attributes.value!=undefined)&&(child._attributes.value._nodeValue != undefined)) {
                                    window.results.objects = utils.addString(window.results.objects, utils.absoluteUrl(window.results.url, child._attributes.value._nodeValue));
                                }
                            } catch (e) {
                                loggers.log('ERROR', e.toString());
                                window.results.errors = utils.addString(window.results.errors, e.toString());
                            }
                        }
                    }
                    var _setAttribute  = element.setAttribute;
                    element.setAttribute = function(attr, value) {
                        if(attr.toLowerCase()==='src') {
                            try {
                                if((el.toLowerCase()==='script')&&(value != undefined)) {
                                    window.results.scripts_src = utils.addString(window.results.scripts_src, utils.absoluteUrl(window.results.url, value));
                                } else if((el.toLowerCase()==='iframe')&&(value != undefined)) {
                                    window.results.iframes = utils.addString(window.results.iframes, utils.absoluteUrl(window.results.url, value));
                                } else if((el.toLowerCase()==='frame')&&(value != undefined)) {
                                    window.results.frames = utils.addString(window.results.frames, utils.absoluteUrl(window.results.url, value));
                                } else if(((el.toLowerCase()==='object')||(el.toLowerCase()==='embed'))&&(value != undefined)) {
                                    window.results.objects = utils.addString(window.results.objects, utils.absoluteUrl(window.results.url, value));
                                }
                            } catch (e) {
                                loggers.log('ERROR', e.toString());
                                window.results.errors = utils.addString(window.results.errors, e.toString());
                            }
                        } else if ((attr.toLowerCase()==='style')&&(value==='visibility:hidden')) {
                            window.results.activity = utils.addString(window.results.activity, 'visibility:hidden');
                        } else if (attr.toLowerCase() == 'classid') {
                            window.results.classids = utils.addString(window.results.classids, value);
                        }
                    }
                }
            } catch(e) {
                loggers.log('ERROR', e.toString());
            }
            return element;
        };
    } catch (e) {
        loggers.log('ERROR', e.toString());
    }
    return window;
}
