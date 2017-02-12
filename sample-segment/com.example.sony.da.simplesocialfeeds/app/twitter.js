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

var tts;
var awaitor;
var tweetData;
var tweetManager;
var oauthError = false;

/**
 * The callback to prepare a segment for play.
 * @param  {string} trigger The trigger type of a segment.
 * @param  {object} args    The input arguments.
 */
da.segment.onpreprocess = function (trigger, args) {
    console.log('onpreprocess', { trigger: trigger, args: args });
    awaitor = new SegmentAwaitor();
    tweetData = new TweetData();
    tts = new Tts(awaitor);
    tweetManager = new TweetManager(tts, tweetData);
    // Load the tweet data.
    tweetManager.preprocess().done(function (errorCode) {
        console.log('preprocess done errorCode[' + errorCode + ']');
        if (errorCode === TweetData.DATA_NOT_FOUND) {
            da.cancelSegment();
            return;
        }
        // Successfully loaded tweet data and start the segment.
        da.startSegment(InteruptParameter.FULL, null);
    }).fail(function (errorCode) {
        console.log('preprocess fail errorCode[' + errorCode + ']');
        if (errorCode === TweetData.CONNECTION_ERROR) {
            da.cancelSegment();
            return;
        }
        // Failed to load tweet data and start the segment with the failed message.
        da.startSegment(InteruptParameter.SIMPLE, {
            args: {
                msgId: TweetData.OAUTH_FAIL
            }
        });
        oauthError = true;
    });
};

/**
 * The callback to start a segment.
 * @param  {string} trigger The trigger type of a segment.
 * @param  {object} args    The input arguments.
 */
da.segment.onstart = function (trigger, args) {
    console.log('onstart', { trigger: trigger, args: args });
    if (args && args.msgId) {
        // If the OAuth error occurs, speak the error message and and stop the segment
        tts.speak(da.getString(args.msgId)).always(function () {
            da.stopSegment();
        });
    } else {
        // Otherwise speak the tweet data
        tweetManager.speakTweet(false);
    }
};
da.segment.onstop = function () {
    console.log('onstop');
};
da.segment.onpause = function () {
    console.log('onpause');
    awaitor.isPause = true;
};
da.segment.onresume = function () {
    console.log('onresume');
    awaitor.isPause = false;
};
// Implementation the oncommand callback
da.segment.oncommand = function (commandObject) {
    console.log('oncommand');
    console.log(JSON.stringify(commandObject));
    var consumed = true;
    tweetManager.cancelSpeak();
    if (oauthError) {
        tts.speak(da.getString(TweetData.OAUTH_FAIL)).always(function () {
            da.stopSegment();
        });
        return true;
    }
    switch (commandObject.command) {
    case Command.NEXT:
        // Speak the next tweet.
        tweetManager.speakOtherTweet(TweetData.NEXT);
        break;
    case Command.PREVIOUS:
        // speak previous tweet.
        tweetManager.speakOtherTweet(TweetData.PREV);
        break;
    case Command.AGAIN:
        // Repeat the current tweet.
        tweetManager.speakTweet(false);
        break;
    case Command.DETAIL:
        // Speak the current tweet with detail information.
        tweetManager.speakTweet(true);
        break;
    case Command.BOOKMARK:
        // Register the current tweet in the bookmark.
        tweetManager.registerBookmark();
        break;
    default :
        // Speak when the command is not supported.
        tts.speakNonSupportCommand().then(function () {
            return tweetManager.speakTweet();
        });
        consumed = false;
    }
    return consumed;
};
