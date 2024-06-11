'use strict';

const merge = require('lodash.merge');
const Actor = require('@fabric/core/types/actor');

module.exports = async function (req, res, next) {
  const { type, content } = req.body;
  // TODO: make error messages nicer, use both HTML and JSON depending on header
  if (!req.user || !req.user.id) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }
  // ATTENTION: this allows the user to set any fields on the document, including 'status' and 'owner'
  const obj = merge({}, content, { created: (new Date()).toISOString() });
  console.debug('[NOVO]', '[HTTP]', 'Creating new document:', obj);

  this.generateDocumentOutline({
    type: type, // TODO: allow configuration of document type
    parameters: obj
  }).catch((exception) => {
    console.error('[NOVO]', '[HTTP]', 'Error generating document outline:', exception);
    res.status(500).json({ status: 'error', message: 'Error generating document outline.' });
  }).then(async (output) => {
    console.debug('[NOVO]', '[HTTP]', 'Generated document outline:', output);
    if (!output || !output.content) {
      return res.status(500).json({ status: 'error', message: 'Error retrieving document outline.' });
    }

    //nahuel: i've commented the next lines cause it was trying to parce output.content which was already parsed

    // let outline = null;

    // try {
    //   outline = JSON.parse(output.content);
    // } catch (exception) {
    //   return res.status(500).json({ status: 'error', message: 'Error parsing document outline.', error: exception });
    // }


    //nahuel: replaced previous lines for thesse, seems to be working fine
    let outline = output.content;
//    console.debug('[NOVO]', '[HTTP]', 'Parsed document outline:', outline);


    //nahuel: this is the section creation code that was commented out,
    //this ends up returning in generated.content a message that starts with:
    // Here is the response in JSON format:
    //```json
    //and then the actual JSON, we should try to exctract that JSON there or we can
    //just try to tell the sections outliner to just give the actual json and not that previous text
    //after that, we will need to store each section in the DB, thats not made yet
    // const section = { outline: output, target: 'Introduction' };
    // this.generateDocumentSection(section).catch((exception) => {
    //   console.error('[NOVO]', '[HTTP]', 'Error generating document section:', exception);
    //   res.error(500, 'Error generating document section');
    // }).then((generated) => {
    //   console.debug('[NOVO]', '[HTTP]', 'Generated document section:', generated.content);
    // });


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

    const documentId = created[0];  // Assuming created returns an array with the new document ID

    // Insert each section into the 'document_sections' table
    for (let section of outline) {
      const sectionActor = new Actor({name: section.content, content: actor.id});
      await this.db('document_sections').insert({
        document_id: documentId,
        section_number: section.number,
        title: section.content,
        fabric_id: sectionActor.id,
        creator: req.user.id
      });
    }

    return res.redirect(`/documents/${actor.id}`);
  });
};
