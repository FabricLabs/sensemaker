const sinon = require('sinon');
const { expect } = require('chai');
const handler = require('../routes/conversations/get_conversations'); 

describe('Get Messages', () => {
  let req, res, next, dbStub;

  beforeEach(() => {
    req = { user: { id: 1, state: { roles: [] } } };
    res = {
      format: sinon.stub(),
      send: sinon.stub(),
      status: sinon.stub().returnsThis(),
      end: sinon.stub()
    };
    next = sinon.stub();
    dbStub = {
      select: sinon.stub().returnsThis(),
      from: sinon.stub().returnsThis(),
      where: sinon.stub().returnsThis(),
      orderBy: sinon.stub().returnsThis(),
      join: sinon.stub(),
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should fetch all conversations if user is admin', async () => {
    req.user.state.roles = ['admin'];
    const mockResults = [
      { id: 1, title: 'Title 1', created_at: '2023-01-01', creator_name: 'user1', file_fabric_id: 1 },
      { id: 2, title: 'Title 2', created_at: '2023-01-02', creator_name: 'user2', file_fabric_id: 2 }
    ];
    dbStub.join.resolves(mockResults);

    const testHandler = handler.bind({ db: dbStub });
    res.format.callsFake(async (handlers) => {
      await handlers.json();
    });

    await testHandler(req, res, next);

    expect(dbStub.select.calledOnce).to.be.true;
    expect(dbStub.from.calledWith('conversations as c')).to.be.true;
    expect(dbStub.where.calledWith('help_chat', 0)).to.be.true;
    expect(dbStub.orderBy.calledWith('created_at', 'desc')).to.be.true;
    expect(dbStub.join.calledWith('users', 'c.creator_id', '=', 'users.id')).to.be.true;
    expect(res.send.calledOnce).to.be.true;
    expect(res.send.firstCall.args[0]).to.deep.equal(mockResults);
  });

  it('should fetch user-specific conversations if user is not admin', async () => {
    const mockResults = [
      { id: 1, title: 'Title 1', created_at: '2023-01-01', file_fabric_id: 1 },
      { id: 2, title: 'Title 2', created_at: '2023-01-02', file_fabric_id: 2 }
    ];
    dbStub.orderBy.resolves(mockResults);

    const testHandler = handler.bind({ db: dbStub });
    res.format.callsFake(async (handlers) => {
      await handlers.json();
    });

    await testHandler(req, res, next);

    expect(dbStub.select.calledOnce).to.be.true;
    expect(dbStub.from.calledWith('conversations')).to.be.true;
    expect(dbStub.where.calledWith({ creator_id: 1 })).to.be.true;
    expect(dbStub.where.calledWith('help_chat', 0)).to.be.true;
    expect(dbStub.orderBy.calledWith('created_at', 'desc')).to.be.true;
    expect(res.send.calledOnce).to.be.true;
    expect(res.send.firstCall.args[0]).to.deep.equal(mockResults);
  });
});
