'use strict';

module.exports = async function (req, res, next) {
  const reviews = await this.db('reviews').whereNotNull('id');
  const response = {
    accuracy: {
      positive: 0,
      negative: 0,
      neutral: 0
    },
    total: reviews.length
  };

  for (let review of reviews) {
    switch (review.intended_sentiment) {
      case 'positive':
        response.accuracy.positive++;
        break;
      case 'negative':
        response.accuracy.negative++;
        break;
      default:
        response.accuracy.neutral++;
        break;
    }
  }

  res.send(response);
};
