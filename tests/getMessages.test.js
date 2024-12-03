const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const handler = require('../routes/messages/list_messages');

describe('Get Messages Tests', () => {
  let req, res, next, dbStub;

  beforeEach(() => {
    req = { query: { conversation_id: 1 } };
    res = { format: sinon.stub(), send: sinon.stub() };
    next = sinon.stub();
    dbStub = {
      join: sinon.stub().returnsThis(),
      select: sinon.stub().returnsThis(),
      where: sinon.stub().returnsThis(),
      orderBy: sinon.stub().resolves([
        {
          username: 'user1',
          id: 1,
          user_id: 1,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          content: 'Hello',
          status: 'sent',
          cards: null
        }
      ])
    };
  });

  it('should fetch and format messages for a given conversation_id in JSON format', async () => {
    const testHandler = handler.bind({ db: () => dbStub });
    res.format.callsFake((handlers) => {
      handlers.json();
    });
    await testHandler(req, res, next);
    expect(res.send.calledOnce).to.be.true;
    expect(res.send.firstCall.args[0]).to.deep.equal([
      {
        username: 'user1',
        id: 1,
        user_id: 1,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        content: 'Hello',
        status: 'sent',
        cards: null,
        author: 'user1',
        role: 'assistant'
      }
    ]);
  });

  it('should map message properties correctly when id equals 1', async () => {
    const testHandler = handler.bind({ db: () => dbStub });
    res.format.callsFake((handlers) => {
      handlers.json();
    });
    await testHandler(req, res, next);
    const messages = res.send.firstCall.args[0];
    messages.forEach((message) => {
      expect(message).to.have.property('author');
      expect(message).to.have.property('role');
      expect(message.role).to.equal('assistant');
      expect(message.author).to.equal('user1')
    });
  });

    it('should map message properties correctly when id not equal to 1', async () => {
    const testHandler = handler.bind({ db: () => dbStub });
    dbStub.orderBy.resolves([
      {
        username: 'user2',
        id: 2,
        user_id: 2,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        content: 'Hello',
        status: 'sent',
        cards: null
      }
    ])
    res.format.callsFake((handlers) => {
      handlers.json(); 
    });
    await testHandler(req, res, next);
    const messages = res.send.firstCall.args[0];
    messages.forEach((message) => {
      expect(message).to.have.property('author');
      expect(message).to.have.property('role');
      expect(message.role).to.equal('user');
      expect(message.author).to.equal('user2')
    });
  })
});
