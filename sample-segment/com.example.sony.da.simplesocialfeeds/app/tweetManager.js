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

var TweetManager = (function () {
    function TweetManager(tts, tweetData) {
        this.tts = tts;
        this.tweetData = tweetData;
    }
    /**
     * Preprocess to load tweet data.
     */
    TweetManager.prototype.preprocess = function () {
        return this.tweetData.load(null);
    };

    /**
     * Speak the loaded tweet and add it to the timeline.
     * @param {boolean} isDetail true: tweet text with detail information
     */
    TweetManager.prototype.speakTweet = function (isDetail) {
        var text = this.tweetData.getTweetText(isDetail);
        if (!text) {
            text = da.getString(TweetData.DATA_NOT_FOUND_MSG);
        } else {
            this.addTimeline();
        }
        this.tts.speak(text).done(da.stopSegment).fail(function () {
            this.tts.speak(da.getString(TweetData.ERROR_TEMPLATE))
                .always(function () {
                    da.stopSegment();
                });
        });
    }

    /**
     * Cancel the speak.
     */
    TweetManager.prototype.cancelSpeak = function () {
        this.tts.cancel();
    };

    /**
     * Speak the previous or next tweet
     * @param {string} target "next": next tweet, "prev": previous tweet
     */
    TweetManager.prototype.speakOtherTweet = function (target) {
        var _this = this;
        var tweetID = this.tweetData.getTweetID();
        if (tweetID) {
            return this.tweetData.load(target, tweetID).then(function () {
                _this.speakTweet(false);
            });
        }
    };

    /**
     * Add the tweet data to timeline
     */
    TweetManager.prototype.addTimeline = function () {
        var item = this.tweetData.getTweetData();
        if (!item) {
            return;
        }
        var url = TweetData.TIMELINE_URL + item.user.screen_name + TweetData.TIMELINE_URL_STATE + item.id_str;
        var entry = {
            domain: url.split('/')[2],
            extension: {},
            title: item.text,
            url: url,
            imageUrl: item.user.profile_image_url,
            date: new Date().toISOString()
        };
        da.addTimeline({ entries: [entry] });
    };

    /**
     * Add the tweet data to the bookmark
     */
    TweetManager.prototype.registerBookmark = function () {
        var item = this.tweetData.getTweetData();
        if (!item) {
            return;
        }
        var url = TweetData.TIMELINE_URL + item.user.screen_name + TweetData.TIMELINE_URL_STATE + item.id_str;
        var entry = {
            domain: url.split('/')[2],
            extension: {},
            title: item.text,
            url: url,
            imageUrl: item.user.profile_image_url,
            date: new Date().toISOString()
        };
        da.registerBookmark({ entries: [entry] });
        this.tts.speak(da.getString(TweetData.BOOKMARK_MSG, { userName: item.user.name }))
            .always(function () {
                da.stopSegment();
            });
    };

    return TweetManager;
})();
