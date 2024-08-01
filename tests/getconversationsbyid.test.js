const sinon = require('sinon');
const chai = require('chai');
const expect = chai.expect;
const middleware = require('../routes/conversations/get_conversations_by_id');

describe('Get Conversations By ID', function() {
  it('should retrieve conversation and messages', async function() {
    const req = { params: { id: 1 } };
    const res = {
      format: sinon.stub().callsFake(function(formatFn) {
        formatFn.json();
      }),
      send: sinon.spy()
    };
    const next = sinon.spy();
    const fakeDb = {
      select: sinon.stub().resolves({ id: 1, title: 'Test Conversation', created_at: new Date(), log: [1, 2, 3], matter_id: 'matter_id', file_fabric_id: 'file_fabric_id' }),
      from: sinon.stub().returnsThis(),
      where: sinon.stub().returnsThis(),
      first: sinon.stub().resolves({ id: 1 })
    };
    const fakeMessages = [
      { id: 1, content: 'Message 1', created_at: new Date() },
      { id: 2, content: 'Message 2', created_at: new Date() },
      { id: 3, content: 'Message 3', created_at: new Date() }
    ];
    const fakeDbKnex = sinon.stub().callsFake(() => ({
      whereIn: sinon.stub().returnsThis(),
      select: sinon.stub().resolves(fakeMessages)
    }));
    const fakeApplicationString = '<html><body>Test</body></html>';
    const middlewareInstance = middleware.bind({
      db: {
        select: fakeDb.select,
        from: fakeDb.from,
        where: fakeDb.where,
        first: fakeDb.first,
        knex: fakeDbKnex
      },
      applicationString: fakeApplicationString
    });

    await middlewareInstance(req, res, next);

    // Assertions
    expect(res.format.calledOnce).to.be.true;
    expect(fakeDb.select.calledOnce).to.be.true;
    expect(fakeDb.select.calledOnceWith('id', 'title', 'created_at', 'log', 'matter_id', 'file_fabric_id')).to.be.true;
  });
});

