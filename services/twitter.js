'use strict';

const Fabric = require('@fabric/core');
const Client = require('twitter');

class Twitter extends Fabric.Service {
  constructor (settings = {}) {
    super(settings);
    this.name = 'Twitter';
    this.twitter = new Client({
      consumer_key: settings.consumer.key,
      consumer_secret: settings.consumer.secret,
      access_token_key: settings.token.key,
      access_token_secret: settings.token.secret
    });
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
  }
}

module.exports = Twitter;
