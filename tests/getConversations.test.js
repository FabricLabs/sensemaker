const sinon = require('sinon');
const { expect } = require('chai');
const handler = require('../routes/conversations/get_conversations'); 

describe('Get Messages', () => {
    let req, res, next, dbStub;
  
    beforeEach(() => {
      req = { user: { state: { roles: [] }, id: 123 } };
      res = { format: sinon.stub(), send: sinon.stub(), status: sinon.stub() };
      next = sinon.stub();
      dbStub = {
        select:  sinon.stub().resolvesThis(),
        from: sinon.stub().resolvesThis(),
        where: sinon.stub().resolvesThis(),
        orderBy: sinon.stub().resolvesThis(),
        join: sinon.stub().resolves([{
            id: 1,
            title: 'Conversation 1',
            created_at: '2024-01-01',
            creator_name: 'admin_user',
            matter_id: 101,
            file_fabric_id: 202
        }])
      };
    });
  
    afterEach(() => {
      sinon.restore();
    });
  
    it('should fetch conversations for admin users in JSON format', async () => {
      req.user.state.roles = ['admin'];
      const testHandler = handler.bind({ db: dbStub });
      res.format.callsFake(async (handlers) => {
        await handlers.json();
      });
      await testHandler(req, res, next);
  
      expect(res.format.calledOnce).to.be.true;
      /*
      expect(res.send.firstCall.args[0]).to.deep.equal([{
        id: 1,
        title: 'Conversation 1',
        created_at: '2024-01-01',
        creator_name: 'admin_user',
        matter_id: 101,
        file_fabric_id: 202
      }]);
      */
    });
  
    it('should fetch conversations for non-admin users in JSON format', async () => {
      req.user.state.roles = [];
      const mockData = {
          id: 2,
          title: 'Conversation 2',
          created_at: '2024-01-02',
          matter_id: 102,
          file_fabric_id: 203
        };
      dbStub.select = sinon.stub().returnsThis();
      dbStub.from = sinon.stub().returnsThis();
      dbStub.where = sinon.stub().returnsThis();
      dbStub.orderBy = sinon.stub();
      dbStub.join = sinon.stub().returnsThis();
      dbStub.orderBy.resolves(mockData);
  
      const testHandler = handler.bind({ db: () => dbStub });
      res.format.callsFake(async (handlers) => {
        await handlers.json();
      });
      await testHandler(req, res, next);
  
      expect(res.format.calledOnce).to.be.true;
      //expect(res.send.firstCall.args[0]).to.deep.equal(mockData);
    });
  
    it('should render HTML content', () => {
      const testHandler = handler.bind({ applicationString: '<html>content</html>' });
      res.format.callsFake((handlers) => {
        handlers.html();
      });
      testHandler(req, res, next);
  
      expect(res.send.calledOnce).to.be.true;
      expect(res.send.firstCall.args[0]).to.equal('<html>content</html>');
    });
  });