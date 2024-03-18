'use strict';

module.exports = async function (req, res, next) {
  try {
    const request = req.body;
    const reporters = await this._searchReporters(request);
    const result = {
      reporters: reporters || []
    };

    return res.send({
      type: 'SearchReportersResult',
      content: result,
      results: reporters
    });
  } catch (exception) {
    res.status(503);
    return res.send({
      type: 'SearchReportersError',
      content: exception
    });
  }
};
