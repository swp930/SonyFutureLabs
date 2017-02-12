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

var NEXT_COMMAND = 'next';
var PREVIOUS_COMMAND = 'previous';
var DETAIL_COMMAND = 'detail';
var AGAIN_COMMAND = 'again';
var BOOKMARK_COMMAND = 'bookmark';

/**
 * The class to execute TTS.
 * @class Tts
 */
var Tts = (function () {
    function Tts(awaitor) {
        this.segmentAwaitor = awaitor;
    }

    /**
     * Speak text after waiting onresume in case of a pause state
     * @param {string} text speaked message
     */
    Tts.prototype.speak = function (text) {
        var _this = this;
        return this.segmentAwaitor.waitActive().then(function () {
            return _this.executeSpeak(text).then(function () {
                return _this.segmentAwaitor.waitActive();
            });
        });
    };

    /**
     * Speak non support command message
     */
    Tts.prototype.speakNonSupportCommand = function () {
        var _this = this;
        return this.executeSpeak(da.getString('noSupported')).then(function () {
            return _this.segmentAwaitor.waitActive();
        });
    };

    /**
     * Call speak API
     * @param {string} text speaked message
     */
    Tts.prototype.executeSpeak = function (text) {
        var deffer = $.Deferred();
        this.synthesis = da.SpeechSynthesis.getInstance();
        this.synthesis.speak(text, {
            onstart: function (duration) {
                console.log('speak start [' + duration + ']');
            },
            onerror: function (error) {
                console.log('speak cancel: ' + error.message);
            },
            onend: function () {
                console.log('speak onend');
                deffer.resolve();
            }
        });
        return deffer.promise();
    };

    /**
     * Cancel speaking
     */
    Tts.prototype.cancel = function () {
        this.synthesis.cancel();
        this.segmentAwaitor.cancel();
    };
    return Tts;
})();

/**
 * The class to control pausing or resuming the segment.
 * @class SegmentAwaitor
 */
var SegmentAwaitor = (function () {
    function SegmentAwaitor() {
        this.resumeMethod = null;
        this.isPause = false;
    }

    /**
     * Wait onresume in case of a pause state
     */
    SegmentAwaitor.prototype.waitActive = function () {
        var _this = this;
        var deffer = $.Deferred();
        console.log('waitActive / isPause : ' + this.isPause);
        if (!this.isPause) {
            deffer.resolve();
            return deffer.promise();
        }
        this.resumeMethod = da.segment.onresume;
        da.segment.onresume = function () {
            if (_this.resumeMethod) {
                _this.resumeMethod();
            }
            deffer.resolve();
            da.segment.onresume = _this.resumeMethod;
            _this.resumeMethod = null;
        };
        return deffer.promise();
    };

    /**
     * Cancel method for waiting
     */
    SegmentAwaitor.prototype.cancel = function () {
        if (!this.isPause || !this.resumeMethod) {
            return;
        }
        da.segment.onresume = this.resumeMethod;
        this.resumeMethod = null;
    };
    return SegmentAwaitor;
})();

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
 * Save the segment configuration. This method is implemented by setSegmentConfigh API.
 * @return {object} Promise
 */
var setSegmentConfig = function (config) {
    var def = $.Deferred();
    var callback = {
        onsuccess: function (result) {
            console.log('setSegmentConfig success', result);
            def.resolve(result);
        },
        onerror: function (error) {
            console.log('setSegmentConfig fail.');
            def.resolve(null);
        }
    };
    da.setSegmentConfig(callback, config);
    return def.promise();
};

var InteruptParameter = (function () {
    function InteruptParameter() {
    }
    InteruptParameter.SIMPLE = 'simple';
    InteruptParameter.FULL = 'full';
    return InteruptParameter;
})();

var LaunchMode = (function () {
    function LaunchMode() {
    }
    LaunchMode.LAUNCH_RULE = 'launchRule';
    LaunchMode.WORKER = 'worker';
    LaunchMode.VOICE = 'voice';
    return LaunchMode;
})();

var Command = (function () {
    function Command() {
    }
    Command.NEXT = 'next';
    Command.PREVIOUS = 'previous';
    Command.DETAIL = 'detail';
    Command.AGAIN = 'again';
    Command.BOOKMARK = 'bookmark';
    Command.OTHER = 'other';
    return Command;
})();