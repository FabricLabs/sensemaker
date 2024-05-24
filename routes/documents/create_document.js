'use strict';

const merge = require('lodash.merge');
const Actor = require('@fabric/core/types/actor');

module.exports = async function (req, res, next) {
  // TODO: make error messages nicer, use both HTML and JSON depending on header
  if (!req.user || !req.user.id) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }

  // ATTENTION: this allows the user to set any fields on the document, including 'status' and 'owner'
  const obj = merge({}, req.body, { created: (new Date()).toISOString() });
  console.debug('[NOVO]', '[HTTP]', 'Creating new document:', obj);

  this.generateDocumentOutline({
    type: 'Demand Letter', // TODO: allow configuration of document type
    parameters: obj
  }).catch((exception) => {
    console.error('[NOVO]', '[HTTP]', 'Error generating document outline:', exception);
    res.error(500, 'Error generating document outline');
  }).then(async (output) => {
    console.debug('[NOVO]', '[HTTP]', 'Generated document outline:', output);

    /*
    const section = { outline: output, target: 'Introduction' };
    this.generateDocumentSection(section).catch((exception) => {
      console.error('[NOVO]', '[HTTP]', 'Error generating document section:', exception);
      res.error(500, 'Error generating document section');
    }).then((generated) => {
      console.debug('[NOVO]', '[HTTP]', 'Generated document section:', generated);
    });
    */

    // TODO: parse JSON, return to object before creating Actor
    const actor = new Actor(obj);
    const type = obj.type || 'document';

    // TODO: handle errors
    const created = await this.db('documents').insert({
      creator: req.user.id,
      fabric_id: actor.id,
      title: obj.title || `Untitled ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      content: obj.content,
      status: 'draft'
    });

    return res.redirect(`/documents/${actor.id}`);
  });
};
