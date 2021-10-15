'use strict';

const Service = require('@fabric/core/types/service');
const Client = require('twitter');

class Twitter extends Service {
  constructor (settings = {}) {
    super(settings);

    this.settings = Object.assign({
      username: 'sensemaker'
    }, settings);

    this.name = 'Twitter';
    this.twitter = new Client({
      consumer_key: settings.consumer.key,
      consumer_secret: settings.consumer.secret,
      access_token_key: settings.token.key,
      access_token_secret: settings.token.secret
    });

    return this;
  }

  /**
   * Establish connection to Twitter.
   * @return {Twitter} Connected instance of Twitter.
   */
  connect () {
    this.stream = this.twitter.stream('statuses/filter', {
      track: '#test'
    });

    // TODO: bind to event handler on this class
    this.stream.on('data', function (event) {
      console.log('stream data event:', event);
    });

    this.stream.on('error', function (err) {
      console.log('stream error:', err);
    });

    return this;
  }

  start () {
    this.connect();
    return this;
  }

  getProfile () {
    this.twitter.get('statuses/user_timeline', {
      screen_name: this.settings.username
    }, function (error, tweets, response) {
      if (!error) {
        console.log(tweets);
      }
    });
  }
}

module.exports = Twitter;
