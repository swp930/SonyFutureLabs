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

var TweetData = (function () {
    function TweetData() {
        this.tweetObject = null;
    }
    /**
     * Load the previous/next/current tweet data.
     * @param {string} type loaded tweet data type ('next'/'prev'/null)
     * @param {string} id Tweet ID
     */
    TweetData.prototype.load = function (type, id) {
        var _this = this;
        var url = TweetData.HOME_TIMELINE_BASE;
        switch (type) {
        case TweetData.NEXT:
            // Returns the next url with ID greater than the specified ID.
            url += TweetData.COUNT + 1 + TweetData.SINCE_ID + id;
            break;
        case TweetData.PREV:
            // Returns url with an ID less than or equal to the specified ID.
            url += TweetData.COUNT + 2 + TweetData.MAX_ID + id;
            break;
        default:
            // Returns result with the latest ID
            url += TweetData.COUNT + 1;
        }
        this.tweetObject = null;
        return this.getToken(false).then(function (token) {
            return _this.ajaxTwitter(_this.createSignedUrl(url, JSON.parse(token)));
        }, function (code) {
            return $.Deferred().reject(code);
        });
    };

    /**
     * Get the twitter token with getOAuthAccessToken API.
     * @param {boolean} cacheClear true: update chach of token forcedly
     */
    TweetData.prototype.getToken = function (cacheClear) {
        var deffer = $.Deferred();
        var oAuthCallBack = {
            onsuccess: function (token) {
                deffer.resolve(token);
            },
            onerror: function (error) {
                console.log('getToken error[' + error.code + ']');
                if (error.code === -1 || error.code === 1) {
                    getSegmentConfig().then(function (config) {
                        config.oauth = false;
                        setSegmentConfig(config);
                    });
                    deffer.reject(TweetData.OAUTH_ERROR);
                    return;
                }
                deffer.reject(TweetData.CONNECTION_ERROR);
                return;
            }
        };
        da.getOAuthAccessToken(TweetData.SEGMENT_OAUTH_ID, oAuthCallBack, cacheClear);
        return deffer.promise();
    };

    /**
     * Create singened URL for twitter by adding OAuth data
     * @param {string} url URL for twitter API
     * @param {object} token OAuth token data
     * @return {string} singed URL
     */
    TweetData.prototype.createSignedUrl = function (url, token) {
        var message = {
            method: 'GET',
            action: url,
            parameters: {
                oauth_signature_method: TweetData.OAUTH_SIGNATURE_METHOD,
                oauth_consumer_key: token.extra.access_token.consumer.key,
                oauth_token: token.extra.access_token.token
            }
        };
        var secretKeys = {
            consumerSecret: token.extra.access_token.consumer.secret,
            tokenSecret: token.extra.access_token.secret
        };
        OAuth.setTimestampAndNonce(message);
        OAuth.SignatureMethod.sign(message, secretKeys);
        var signedUrl = OAuth.addToURL(message.action, message.parameters);
        return signedUrl;
    };

    /**
     * Acquire tweet data
     * @param {string} url URL for Twitter API with OAuth data
     */
    TweetData.prototype.ajaxTwitter = function (url) {
        var _this = this;
        var def = $.Deferred();
        var setting = {
            url: url,
            type: 'GET',
            dataType: 'json',
            xhr: function () { return da.getXhr(); },
            success: function (data, textStatus, jqXHR) {
                console.log('ajax success');
                if (data.length === 0) {
                    def.resolve(TweetData.DATA_NOT_FOUND);
                    return;
                }
                _this.tweetObject = data[data.length - 1];
                def.resolve(TweetData.DATA_FOUND);
                return;
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log('ajax error jqXHR.status[' + jqXHR.status + ']');
                var msg;
                switch (jqXHR.status) {
                case 401:
                    msg = TweetData.OAUTH_ERROR;
                    break;
                case 404:
                    msg = TweetData.LISTS_NOT_FOUND;
                    break;
                default:
                    msg = TweetData.CONNECTION_ERROR;
                }
                def.reject(msg);
                return;
            }
        };
        $.ajax(setting);
        return def.promise();
    };

    /**
     * Get current tweet data
     * @return {object} tweet data
     */
    TweetData.prototype.getTweetData = function () {
        return this.tweetObject;
    };

    /**
     * Get ID of current tweet data
     * @return {string} ID of current tweet data
     */
    TweetData.prototype.getTweetID = function () {
        if (!this.tweetObject) {
            return null;
        }
        return this.tweetObject.id_str;
    };

    /**
     * Get tweet text for speaking
     * @param {boolean} isDetail true: tweet text with detail information
     * @return {string} tweet text for speasing
     */
    TweetData.prototype.getTweetText = function (isDetail) {
        if (!this.tweetObject) {
            return null;
        }
        var fromTweet = da.getString(TweetData.FROM_TWEET_KEY, { userName: this.tweetObject.user.name });
        var text = this.tweetObject.text;

        for (var i = 0; i < this.tweetObject.entities.user_mentions.length; i++) {
            var entity = this.tweetObject.entities.user_mentions[i];
            // Replace "RT @{user screen name}" to "ReTweet {user name}'s tweet".
            text = text.replace(new RegExp('[RQ]T[ ]+?@' + entity.screen_name + ':', 'gm'),
                da.getString(TweetData.RETWEET_NAME_FORMAT, { userName: entity.name }));
            // Replace first ".@{user screen name}" to {user name}.
            text = text.replace(new RegExp('.@' + entity.screen_name + '([^a-zA-Z0-9_]{1})', 'gm'),
                da.getString(TweetData.NAME_FORMAT, { userName: entity.name }) + '$1');
            // Replace first "@{user screen name}" to {user name}.
            text = text.replace(new RegExp('@' + entity.screen_name + '([^a-zA-Z0-9_]{1})', 'gm'),
                da.getString(TweetData.NAME_FORMAT, { userName: entity.name }) + '$1');
            // Replace last "@{user screen name}" to {user name}.
            text = text.replace(new RegExp('@' + entity.screen_name + '$', 'gm'),
                da.getString(TweetData.NAME_FORMAT, { userName: entity.name }));
        }
        // Delete "https://..." in text
        text = text.replace(new RegExp('https?://[a-zA-Z0-9./]+…?', 'gm'), '');

        // if there is media information in tweet, delete media information in text
        if (this.tweetObject.entities.media) {
            for (var k = 0; k < this.tweetObject.entities.media.length; k++) {
                text = text.replace(new RegExp(this.tweetObject.entities.media[k].url, 'gm'), '');
            }
        }

        // in case of detail command, add retweet count, and favorite count in text
        if (isDetail) {
            text += da.getString(TweetData.RETWEET_COUNT, {count: this.tweetObject.retweet_count});
            text += da.getString(TweetData.FAVORITE_COUNT, {count: this.tweetObject.favorite_count});
        }
        return fromTweet + text;
    };

    // for URL
    TweetData.HOME_TIMELINE_BASE = 'https://api.twitter.com/1.1/statuses/home_timeline.json?';
    TweetData.COUNT = 'count=';
    TweetData.SINCE_ID = '&since_id=';
    TweetData.MAX_ID = '&max_id=';
    TweetData.OAUTH_SIGNATURE_METHOD = 'HMAC-SHA1';

    // for key of getString API
    TweetData.OAUTH_FAIL = 'authErrMsg';
    TweetData.FROM_TWEET_KEY = 'fromTweetMsg';
    TweetData.BOOKMARK_MSG = 'bookmarkMsg';
    TweetData.ERROR_TEMPLATE = 'getDataFailMsg';
    TweetData.DATA_NOT_FOUND_MSG = 'dataNotFoundMsg';
    TweetData.NAME_FORMAT = 'nameFormat';
    TweetData.RETWEET_NAME_FORMAT = 'reTweetNameFormat';
    TweetData.CREATED_TIME = 'createdTime';
    TweetData.RETWEET_COUNT = 'retweetCount';
    TweetData.FAVORITE_COUNT = 'favoriteCount';

    // for callback result
    TweetData.DATA_NOT_FOUND = 0;
    TweetData.DATA_FOUND = 1;
    TweetData.CONNECTION_ERROR = 2;
    TweetData.OAUTH_ERROR = 3;
    TweetData.LISTS_NOT_FOUND = 4;

    // for timeline
    TweetData.TIMELINE_URL = 'https://twitter.com/';
    TweetData.TIMELINE_URL_STATE = '/status/';

    // for target of tweet
    TweetData.NEXT = 'next';
    TweetData.PREV = 'prev';

    // for segment OAuth ID associated with Access Token
    TweetData.SEGMENT_OAUTH_ID = 0;

    return TweetData;
})();
