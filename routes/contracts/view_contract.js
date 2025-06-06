'use strict';

module.exports = async function (req, res, next) {
  res.format({
    html: () => {
      res.send(this.applicationString);
    },
    json: () => {
      if (req.params.id == 'terms-of-use') {
        return res.json({
          content: this.termsOfUse
        });
      } else {
        return res.status(404).json({
          status: 'error',
          message: 'Contract not found.'
        });
      }
    }
  });
};
