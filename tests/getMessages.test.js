const chai = require('chai');
const { interfaces } = require('mocha');
const { json } = require('react-router-dom');
const { SegmentInline } = require('semantic-ui-react');
const expect = chai.expect;
const sinon = require('sinon');
const handler = require('../routes/messages/get_messages');

describe('Handler function tests', () => {
    let dbMock;
    let req;
    let res;
    let next;
  
    beforeEach(() => {
      dbMock = {
        join: sinon.stub().returnsThis(),
        select: sinon.stub().returnsThis(),
        where: sinon.stub().returnsThis(),
        orderBy: sinon.stub().returnsThis(),
      };
  
      req = {
        query: {},
      };
  
      res = {
        format: sinon.stub(),
        send: sinon.spy(),
        json: sinon.spy(),
      };
  
      next = sinon.spy();
    });

    afterEach(() => {
      sinon.restore();
    });
  
    it('should return messages with conversation_id', async () => {
      const messages = [
        { username: 'user1', id: 1, user_id: 1, created_at: '2021-01-01', updated_at: '2021-01-01', content: 'message1', status: 'sent', cards: null }
      ];
  
      req.query.conversation_id = 1; 
      dbMock.join.resolves(messages);
  
      res.format.callsFake((formats) => {
        if (formats.json) {
          return formats.json();
        }
      });
  
      const handlerInstance = handler.bind({
        db: dbMock
      });
  
      await res.json(handlerInstance(req, res, next));

      expect(res.format.calledOnce).to.be.true;
      expect(res.json.firstCall.args).to.be.an('array');
      sinon.assert.calledOnce(res.json);
      //expect(res.json.firstCall.args[0].some((item) => item.id === 1)).to.be.true;
    });
  }); 