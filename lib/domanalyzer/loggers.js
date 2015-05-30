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

var util = require('util');

var loggers = {};

loggers.WARN = function() { VERBOSE_LEVEL >= 0 && console.log.apply(console, arguments); }
loggers.INFO = function() { VERBOSE_LEVEL >= 1 && console.log.apply(console, arguments); }
loggers.DEBUG = function() { VERBOSE_LEVEL >= 2 && console.log.apply(console, arguments); }

loggers.log = function(title, data) {
    loggers.DEBUG('---------------------------------------------------------');
    loggers.DEBUG(util.format('[*] %s', title));
    loggers.DEBUG('---------------------------------------------------------\n');
    loggers.DEBUG(data);
    loggers.DEBUG('\n')
};

module.exports = loggers;
