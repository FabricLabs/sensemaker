'use strict';

const chai = require('chai');
const sinon = require('sinon');
const expect = chai.expect;

const handler = require('../routes/matters/matter_view');

describe('Get Matters By ID Tests', () => {
  let req, res, next, dbStub;

  beforeEach(() => {
    req = { params: { id: 1 }, user: { id: 1 } };
    res = { format: sinon.stub(), send: sinon.stub(), status: sinon.stub() };
    next = sinon.stub();
    dbStub = {
      select: sinon.stub().returnsThis(),
      where: sinon.stub().returnsThis(),
      first: sinon.stub().resolves({ creator: 1 })
    };
  });

  it('should send matter if creator matches req.user.id in JSON format', async () => {
    const testHandler = handler.bind({ db: () => dbStub });
    res.format.callsFake((handlers) => {
      handlers.json();
    });
    await testHandler(req, res, next);
    expect(res.send.calledOnce).to.be.true;
    expect(res.send.firstCall.args[0]).to.deep.equal({ creator: 1 });
  });

  it('should send error if creator does not match req.user.id in JSON format', async () => {
    const testHandler = handler.bind({ db: () => dbStub });
    dbStub.first.resolves({ creator: 2 }); 
    res.format.callsFake((handlers) => {
      handlers.json(); 
    });
    await testHandler(req, res, next);
    expect(res.status.calledWith(401)).to.be.true;
    expect(res.send.calledOnce).to.be.true;
    expect(res.send.firstCall.args[0]).to.deep.equal({ type: 'FetchMatchError', content: 'Invalid Matter' });
  });
});;