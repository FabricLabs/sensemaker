'use strict';

const stripe = require('stripe');
const Service = require('@fabric/core/types/service');

class Stripe extends Service {
  constructor (settings = {}) {
    super(settings);

    this.settings = Object.assign({
      token: {
        public: null,
        private: null
      }
    }, settings);

    this.remote = stripe(this.settings.token.private)

    return this;
  }

  async enumerateProducts () {
    const result = await this.remote.products.list();
    return result.data;
  }
}

module.exports = Stripe;
