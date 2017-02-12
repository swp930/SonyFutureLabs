/*
 * Copyright 2016 Sony Corporation
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions, and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE REGENTS AND CONTRIBUTORS ``AS IS'' AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
 * OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
 */

/**
 * Speak the input text. This method is implemented by speak API.
 * @param  {string} text
 * @return {object} Promise
 */
var speak = function (text) {
    var def = $.Deferred();
    var synthesis = da.SpeechSynthesis.getInstance();
    synthesis.speak(text, {
        onstart: function () {
            console.log('speak start');
        },
        onend: function () {
            console.log('speak onend');
            def.resolve();
        },
        onerror: function (error) {
            console.log('speak cancel: ' + error.message);
            def.resolve();
        }
    });
    return def.promise();
};

/**
 * Get current position. This method is implemented by getCurrentPosition API.
 * @return {object} Promise
 */
var getCurrentPosition = function () {
    var def = $.Deferred();
    var callbacks = {
        onsuccess: function (result) {
            console.log('getCurrentPosition success.', result);
            def.resolve(result);
        },
        onerror: function (error) {
            console.log('getCurrentPosition fail.' + error.message);
            def.resolve(null);
        }
    };
    var option = {
        timeout: 30000,
        enablehighaccuracy: true
    };
    var geo = new da.Geolocation();
    geo.getCurrentPosition(callbacks, option);
    return def.promise();
};

/**
 * Get the segment configuration. This method is implemented by getSegmentConfig API.
 * @return {object} Promise
 */
var getSegmentConfig = function () {
    var def = $.Deferred();
    var callback = {
        onsuccess: function (result) {
            console.log('getSegmentConfig success.', result);
            def.resolve(result);
        },
        onerror: function (error) {
            console.log('getSegmentConfig fail.');
            def.resolve(null);
        }
    };
    da.getSegmentConfig(callback);
    return def.promise();
};

/**
 * Convert time format to 12 hour clock and signify AM or PM.
 * @param  {number} hours
 * @param  {number} minutes
 * @return {string} converted time
 */
var convertTimeFormat = function (hours, minutes) {
    var ampm = 'AM';
    if (hours >= 12) {
        hours = hours - 12;
        ampm = 'PM';
    }
    if (hours === 0) {
        hours = 12;
    }
    return hours + ' ' + minutes + ' ' + ampm;
};
