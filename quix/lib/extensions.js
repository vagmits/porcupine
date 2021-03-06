//=============================================================================
//  Copyright (c) 2005-2011 Tassos Koutsovassilis and Contributors
//
//  This file is part of Porcupine.
//  Porcupine is free software; you can redistribute it and/or modify
//  it under the terms of the GNU Lesser General Public License as published by
//  the Free Software Foundation; either version 2.1 of the License, or
//  (at your option) any later version.
//  Porcupine is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Lesser General Public License for more details.
//  You should have received a copy of the GNU Lesser General Public License
//  along with Porcupine; if not, write to the Free Software
//  Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
//=============================================================================

//=============================================================================
//  Date extensions
//=============================================================================

Date.prototype.Months = (function() {
    switch (navigator.locale) {
        case 'el':
            return ['Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος',
                    'Μάϊος', 'Ιούνιος', 'Ιούλιος', 'Αύγουστος',
                    'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'];
        default:
            return ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November',
                    'December'];
    }
})();

Date.prototype.Days = (function() {
    switch (navigator.locale) {
        case 'el':
            return ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη',
                    'Παρασκευή', 'Σάββατο'];
        default:
            return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday',
                    'Friday', 'Saturday'];
    }
})();

Date.prototype.AM = (function() {
    switch (navigator.locale) {
        case 'el':
            return 'πμ';
        default:
            return 'AM';
    }
})();

Date.prototype.PM = (function() {
    switch (navigator.locale) {
        case 'el':
            return 'μμ';
        default:
            return 'PM';
    }
})();

Date.prototype.toUtc = function() {
    return new Date(this.getTime() + (this.getTimezoneOffset() * 60000));
}

Date.prototype.toLocal = function() {
    return new Date(this.getTime() - (this.getTimezoneOffset() * 60000));
}

Date.prototype.format = function(format) {
    var dateString = format;
    dateString = dateString.replace(new RegExp("yyyy", "gi"),
                                    this.getFullYear());
    dateString = dateString.replace(
        new RegExp("yy", "gi"),
        new String(this.getFullYear()).substring(2,4));
    dateString = dateString.replace(new RegExp("month", "gi"),
                                    this.Months[this.getMonth()]);
    dateString = dateString.replace(
        new RegExp("mon", "gi"),
        new String(this.Months[this.getMonth()]).substring(0,3));
    dateString = dateString.replace(new RegExp("mmm", "gi"),
                                    (this.getMonth() + 1));

    var hh = new String(this.getHours());
    if (hh.length == 1) hh = "0" + hh;
    dateString = dateString.replace(new RegExp("hh", "gi"), hh);

    var mm = new String(this.getMinutes());
    if (mm.length == 1) mm = "0" + mm;
    dateString = dateString.replace(new RegExp("mm", "gi"), mm);

    var ss = new String( this.getSeconds() );
    if (ss.length == 1) ss = "0" + ss;

    dateString = dateString.replace(new RegExp("ss", "gi"), ss);
    dateString = dateString.replace(
        new RegExp("ddd", "gi"),
        new String(this.Days[this.getDay()] ).substring(0,3));
    dateString = dateString.replace(new RegExp("dd", "gi"), this.getDate());
    dateString = dateString.replace(new RegExp("day", "gi"),
                                    this.Days[this.getDay()]);

    tz = this.getTimezoneOffset();
    timezone = "";
    if (tz < 0)
        timezone = "GMT-" +  tz / 60;
    else if (tz == 0)
        timezone = "GMT";
    else
        timezone = "GMT+" + tz / 60;
    dateString = dateString.replace(new RegExp("timezone", "gi"), timezone);

    var minutes = new String(this.getMinutes());
    if (minutes.length == 1) minutes = "0" + minutes;//pad if single digit
    var time24 = new String(this.getHours() + ":" + minutes);
    dateString = dateString.replace(new RegExp("time24", "gi"), time24);

    var time;
    var ampm;
    var hour = this.getHours();
    if ( hour < 12) {
        if (hour == 0) hour = 12;
        ampm = this.AM;
    }
    else {
        if (hour !=12) hour = hour - 12;
        ampm = this.PM;
    }
    time = new String(hour + ":" + minutes + " " + ampm);
    dateString = dateString.replace(new RegExp("time", "gi"), time);

    return dateString;
}

Date.prototype.toIso8601 = function() {
    var s = doYear(this.getUTCFullYear()) + "-" +
            doZero(this.getUTCMonth() + 1) + "-" +
            doZero(this.getUTCDate()) + "T" +
            doZero(this.getUTCHours()) + ":" +
            doZero(this.getUTCMinutes()) + ":" +
            doZero(this.getUTCSeconds()) + "." +
            doZero(this.getUTCMilliseconds()) + "Z";
    return(s);

    function doZero(nr) {
        nr = new String("0" + nr);
        return nr.substr(nr.length-2, 2);
    }

    function doYear(year) {
        if (year > 9999 || year < 0)
            throw new QuiX.Exception('Date.toIso8601',
                                     'Malformed date string. ' +
                                     'Unsupported year: ' + year);

        year = new String("0000" + year)
        return year.substr(year.length-4, 4);
    }
}

Date._iso8601Re =
/^(\d\d\d\d)(-)?(\d\d)(-)?(\d\d)(T)?(\d\d)(:)?(\d\d)(:)?(\d\d)(\.\d+)?(Z|([+-])(\d\d)(:)?(\d\d))/;

Date.parseIso8601 = function(s) {
    var date = new Date();
    if (s.toString().match(Date._iso8601Re)) {
        var d = s.match(Date._iso8601Re);
        var offset = 0;
        date.setUTCDate(1);
        date.setUTCFullYear(parseInt(d[1], 10));
        date.setUTCMonth(parseInt(d[3], 10) - 1);
        date.setUTCDate(parseInt(d[5], 10));
        date.setUTCHours(parseInt(d[7], 10));
        date.setUTCMinutes(parseInt(d[9], 10));
        date.setUTCSeconds(parseInt(d[11], 10));
        if (d[12])
            date.setUTCMilliseconds(parseFloat(d[12]) * 1000);
        else
            date.setUTCMilliseconds(0);
        if (d[13] != 'Z') {
            offset = (d[15] * 60) + parseInt(d[17], 10);
            offset *= ((d[14] == '-') ? -1 : 1);
            date.setTime(date.getTime() - offset * 60 * 1000);
        }
    }
    else {
        date.setTime(Date.parse(s));
    }
    return date;
}

//=============================================================================
//  String extensions
//=============================================================================

String.prototype.xmlDecode = function() {
    var s = this.replace(/&gt;/g , '>').replace(/&lt;/g, '<').
            replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    return s;
}

String.prototype.xmlEncode = function() {
    var s = this.replace(/&/g, '&amp;').replace(/</g, '&lt;').
            replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    return s;
}

String.prototype.trim = function() {
    var s = this.replace(/^\s+/, '').replace(/\s+$/, '');
    return s;
}

String.prototype.reverse = function() {
    var theString = "";
    for (var i=this.length-1; i>=0; i--)
        theString += this.charAt(i);
    return theString;
}

//=============================================================================
//  Array extensions
//=============================================================================

Array.prototype.hasItem = function(item) {
    for (var i=0; i<this.length; i++) {
        if (this[i] === item) {
            return true;
        }
    }
    return false;
}

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(elt /*, from*/) {
        var len = this.length;
        var from = Number(arguments[1]) || 0;

        from = (from < 0) ? Math.ceil(from) : Math.floor(from);
        if (from < 0) {
            from += len;
        }

        for (; from < len; from++) {
            if (from in this && this[from] === elt) {
                return from;
            }
        }
        return -1;
    }
}

if (!Array.prototype.filter) {
    Array.prototype.filter = function(fun /*, thisp*/) {
        if (this === void 0 || this === null) {
            throw new TypeError();
        }
        if (typeof fun !== "function") {
            throw new TypeError();
        }

        var t = Object(this);
        var len = t.length >>> 0;
        var res = [];
        var thisp = arguments[1];

        for (var i = 0; i < len; i++) {
            if (i in t) {
                var val = t[i]; // in case fun mutates this
                if (fun.call(thisp, val, i, t)) {
                    res.push(val);
                }
            }
        }
        return res;
    };
}

Array.prototype.each = function(fun) {
    if (this === void 0 || this === null) {
        throw new TypeError();
    }
    if (typeof fun !== "function") {
        throw new TypeError();
    }
    for (var i=0; i<this.length; i++) {
        if (fun.call(this[i], i) === false) {
            return false;
        }
    }
    return true;
}

Array.prototype.removeItem = function(item) {
    for (var i=0; i<this.length; i++) {
        if (this[i] === item) {
            this.splice(i,1);
            return true;
        }
    }
    return false;
}

Array.prototype.sortByAttribute = function(prop) {
    function sortfunc(a, b) {
        var prop1 = a[prop];
        var prop2 = b[prop];
        if (prop1 < prop2 || !prop1) return -1
        else if (prop1 > prop2 || !prop2) return 1
        else return 0
    }
    this.sort(sortfunc);
}
