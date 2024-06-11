'use strict';

const chai = require('chai');
const sinon = require('sinon');
const expect = chai.expect;

const handler = require('../routes/cases/get_cases_id_pdf'); 

describe('Get Cases By ID Tests', () => {
    let req, res, next, dbStub;

    beforeEach(() => {
      req = { params: { id: 1 } };
      res = {
        format: sinon.stub(),
        send: sinon.stub(),
        redirect: sinon.stub(),
        status: sinon.stub().returnsThis(),
        end: sinon.stub()
      };
      next = sinon.stub();
      dbStub = {
        select: sinon.stub().returnsThis(),
        from: sinon.stub().returnsThis(),
        where: sinon.stub().returnsThis(),
        first: sinon.stub()
      };
    });
  
    afterEach(() => {
      sinon.restore();
    });
  
    it('should redirect to the PDF URL if the instance is found and has a PDF', async () => {
      const mockInstance = {
        id: 1,
        harvard_case_law_pdf: 'http://example.com/pdf'
      };
      dbStub.first.resolves(mockInstance);
  
      const testHandler = handler.bind({ db: dbStub });
      res.format.callsFake(async (handlers) => {
        await handlers.json();
      });
  
      await testHandler(req, res, next);
  
      expect(dbStub.select.calledOnce).to.be.true;
      expect(dbStub.from.calledWith('cases')).to.be.true;
      expect(dbStub.where.calledWith({ id: 1, pdf_acquired: true })).to.be.true;
      expect(dbStub.first.calledOnce).to.be.true;
      expect(res.redirect.calledOnce).to.be.true;
      expect(res.redirect.firstCall.args[0]).to.equal(mockInstance.harvard_case_law_pdf);
    });
  
    it('should respond with 404 if the instance is not found', async () => {
        dbStub.first.resolves(null);
    
        const testHandler = handler.bind({ db: dbStub });
        res.format.callsFake(async (handlers) => {
          await handlers.json();
        });
    
        await testHandler(req, res, next);
    
        expect(dbStub.select.calledOnce).to.be.true;
        expect(dbStub.from.calledWith('cases')).to.be.true;
        expect(dbStub.where.calledWith({ id: 1, pdf_acquired: true })).to.be.true;
        expect(dbStub.first.calledOnce).to.be.true;
        expect(res.end.calledWith(404)).to.be.true;
        expect(res.end.calledOnce).to.be.true;
      });
    
      it('should respond with 404 if the instance does not have a PDF', async () => {
        const mockInstance = {
          id: 1,
          harvard_case_law_pdf: null
        };
        dbStub.first.resolves(mockInstance);
    
        const testHandler = handler.bind({ db: dbStub });
        res.format.callsFake(async (handlers) => {
          await handlers.json();
        });
    
        await testHandler(req, res, next);
    
        expect(dbStub.select.calledOnce).to.be.true;
        expect(dbStub.from.calledWith('cases')).to.be.true;
        expect(dbStub.where.calledWith({ id: 1, pdf_acquired: true })).to.be.true;
        expect(dbStub.first.calledOnce).to.be.true;
        expect(res.end.calledWith(404)).to.be.true;
        expect(res.end.calledOnce).to.be.true;
      });
  }); 