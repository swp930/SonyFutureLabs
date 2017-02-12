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

var speechText;

/**
 * The callback to prepare a segment for play.
 * @param  {string} trigger The trigger type of a segment.
 * @param  {object} args    The input arguments.
 */
da.segment.onpreprocess = function (trigger, args) {
    console.log('[SpeechToText] onpreprocess', {trigger: trigger, args: args});
    speechText = "";
    da.startSegment(null, null);
};

/**
 * The callback to resume a segment for play.
 */
da.segment.onresume = function () {
    console.log('onresume');
    var synthesis = da.SpeechSynthesis.getInstance();
    synthesis.speak('The result is ' + speechText, {
        onstart: function () {
            console.log('[SpeechToText] speak start');
        },
        onend: function () {
            console.log('[SpeechToText] speak onend');
            da.stopSegment();
        },
        onerror: function (error) {
            console.log('[SpeechToText] speak cancel: ' + error.message);
            da.stopSegment();
        }
    });

    if (speechText != "") {
        var entry = {
            domain: "Input Speech Text",
            extension: {},
            title: speechText,
            url: "https://translate.google.co.jp/?hl=ja#en/ja/" + speechText,
            imageUrl: "http://www.sony.net/SonyInfo/News/Press/201603/16-025E/img01.gif",
            date: new Date().toISOString()
        };
        da.addTimeline({entries: [entry]});
    }
};

/**
 * The callback to start a segment.
 * @param  {string} trigger The trigger type of a segment.
 * @param  {object} args    The input arguments.
 */
da.segment.onstart = function (trigger, args) {
    console.log('[SpeechToText] onstart', {trigger: trigger, args: args});
    var synthesis = da.SpeechSynthesis.getInstance();

    if (da.getApiLevel === undefined) {
        // API_LEVEL = 1;
        synthesis.speak('This device software is not available for speech to text function.', {
            onstart: function () {
                console.log('[SpeechToText] speak start');
            },
            onend: function () {
                da.stopSegment();
            },
            onerror: function (error) {
                da.stopSegment();
            }
        });
    } else {
        // API_LEVEL = 2 or later;
        synthesis.speak('Please say something.', {
            onstart: function () {
                console.log('[SpeechToText] speak start');
            },
            onend: function () {
                console.log('[SpeechToText] speak onend');

                var speechToText = new da.SpeechToText();
                speechToText.startSpeechToText(callbackobject);
            },
            onerror: function (error) {
                console.log('[SpeechToText] speak cancel: ' + error.message);
                da.stopSegment();
            }
        });
    }
};

var callbackobject = {
    onsuccess: function (results) {
        console.log('[SpeechToText] : SpeechToText process has finished successfully');
        console.log('[SpeechToText] : Results = ' + results);

        var strResults = results.join(" ");
        speechText = strResults;
    },
    onerror: function (error) {
        console.log('[SpeechToText] : SpeechToText error message = ' + error.message)
        console.log('[SpeechToText] : SpeechToText error code = ' + error.code)

        var synthesis = da.SpeechSynthesis.getInstance();
        synthesis.speak('The speech to text API could not recognize what you said. Reason is ' + error.message, {
            onstart: function () {
                console.log('[SpeechToText] error message speak start');
            },
            onend: function () {
                console.log('[SpeechToText] error message speak onend');
                da.stopSegment();
            },
            onerror: function (error) {
                console.log('[SpeechToText] error message speak cancel: ' + error.message);
                da.stopSegment();
            }
        });
    }

};
