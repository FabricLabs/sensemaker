'use strict';

const chai = require('chai');
const sinon = require('sinon');
const expect = chai.expect;

const handler = require('../routes/documents/get_document_by_id'); 
describe('Get Documents By ID', () => {
  let req, res, next, dbStub;

  beforeEach(() => {
    req = { params: { fabricID: 123 } }; 
    res = { format: sinon.stub(), send: sinon.stub(), status: sinon.stub() };
    next = sinon.stub();
    dbStub = {
      select: sinon.stub().returnsThis(),
      where: sinon.stub().returnsThis(),
      first: sinon.stub()
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should fetch the document and respond in JSON format', async () => {
    const mockDocument = {
      id: 1,
      description: 'Test Document',
      created_at: '2024-01-01',
      fabric_id: 123
    };
    dbStub.first.resolves(mockDocument);

    const testHandler = handler.bind({ db: () => dbStub });
    res.format.callsFake(async (handlers) => {
      await handlers.json();
    });
    res.format.onSecondCall().callsFake((handlers) => {
      handlers.json();
    });

    await testHandler(req, res, next);

    expect(dbStub.select.calledOnce).to.be.true;
    expect(dbStub.where.calledWith('fabric_id', 123)).to.be.true;
    expect(dbStub.first.calledOnce).to.be.true;
    expect(res.send.calledOnce).to.be.true;
    expect(res.send.firstCall.args[0]).to.deep.equal(mockDocument);
  });

  it('should respond with HTML content', async () => {
    const testHandler = handler.bind({ db: () => dbStub, applicationString: '<html>content</html>' });
    res.format.callsFake(async (handlers) => {
      await handlers.json();
    });
    res.format.onSecondCall().callsFake((handlers) => {
      handlers.html();
    });
    await testHandler(req, res, next);

    expect(res.send.calledOnce).to.be.true;
    expect(res.send.firstCall.args[0]).to.equal('<html>content</html>');
  });
});
