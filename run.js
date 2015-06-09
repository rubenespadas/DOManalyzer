#!/usr/bin/env node

/*  DOManalyzer
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

if (process.getuid && process.getuid() === 0) {
    console.log('Please, running DOManalyzer as an unprivileged user.');
    process.exit(1);
}

global.__base = __dirname + '/';

var argv = require('yargs')
    .usage('Usage: $0 [OPTIONS]')
    .command('run', 'Analyze DOM from URL')
    .help('h')
    .alias('u', 'url')
    .alias('e', 'referer')
    .alias('m', 'method')
    .alias('n', 'nav')
    .alias('s', 'samples')
    .alias('r', 'reports')
    .alias('l', 'list')
    .alias('v', 'verbose')
    .alias('h', 'help')
    .describe('u', 'URL to analyze')
    .describe('e','Referer URL')
    .describe('m', 'method')
    .describe('n', 'Navigator')
    .describe('s', 'Samples path')
    .describe('r', 'Reports path')
    .describe('l', 'List navigators')
    .default('m', 'GET')
    .default('n', 'all')
    .default('s', './repository/samples')
    .default('r', './repository/reports')
    .count('verbose')
    .epilog('DOManalyzer - Copyright (C) 2015  Rubén Espadas \n\n\
    This program is free software: you can redistribute it and/or modify \n\
    it under the terms of the GNU General Public License as published by \n\
    the Free Software Foundation, either version 3 of the License, or \n\
    (at your option) any later version. \n\n\
    This program is distributed in the hope that it will be useful, \n\
    but WITHOUT ANY WARRANTY; without even the implied warranty of \n\
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the \n\
    GNU General Public License for more details. \n\n\
    You should have received a copy of the GNU General Public License \n\
    along with this program.  If not, see <http://www.gnu.org/licenses/>.\n')
    .argv;
var utils = require('./lib/domanalyzer/utils.js');
var domanalyzer = require('./lib/domanalyzer.js');

global.VERBOSE_LEVEL = argv.verbose;

if (argv.list) {
    utils.getNavigatorsList(function(navigators) {
        navigators.forEach(function(nav){
            console.log(nav);
        });
    });

} else if ((!argv.file)&&(argv.url)&&(argv.nav)) {
    if(argv.nav=="all") {
        utils.getNavigatorsList(function(navigators) {
            if(navigators) {
                domanalyzer.analyze(argv.url, argv.referer, argv.method, navigators, argv.samples, function(results){
                    utils.save(argv.reports, results.urlsha1, results, true);
                });
            } else {
                console.log('Blank Navigator list')
            }
        });
    } else {
        domanalyzer.analyze(argv.url, argv.referer, argv.method, [argv.nav], argv.samples, function(results){
            utils.save(argv.reports, results.urlsha1, results, true);
        });
    }
}
