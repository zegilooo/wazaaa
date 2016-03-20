import chai, { expect } from 'chai'
import mongoose from 'mongoose'
import nock from 'nock'
import request from 'supertest'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

import { didFlash } from '../custom-assertions'
import stubPassport from '../stubs/passport-stub'
import generateFakeEntry from '../fixtures/entries'

import app from '../../app'
import Entry from '../../models/entry'
import ws from '../../controllers/web-sockets'

chai.use(sinonChai)

describe('Entries controller', () => {
  let passportStub

  before(() => {
    passportStub = stubPassport(app)
    mongoose.models = {}
    mongoose.modelSchemas = {}
  })

  after(() => {
    passportStub.uninstall()
  })

  describe('when logged out', () => {
    beforeEach(() => passportStub.logout())

    it('should redirect+flash on anonymous `/entries`', (done) => {
      const agent = request.agent(app)
      agent
        .get('/entries')
        .expect(302)
        .expect('location', '/')
        .end((err, res) => {
          if (err) return done(err)
          didFlash(res, 'info', /Vous devez être authentifié/)
          agent
            .get('/')
            .expect(/Vous devez être authentifié-e/)
            .end(done)
        })
    })
  })

  describe('when logged in', () => {
    beforeEach(() => passportStub.login({ user: 'Alphonse Robichu' }))
    afterEach(() => passportStub.logout())

    it('should route to listing on authenticated `/entries`', sinon.test(function (done) {
      this.stub(Entry, 'getEntries').returns(Promise.resolve([]))
      this.stub(Entry, 'tags').returns(Promise.resolve([]))
      this.stub(Entry, 'count').returns({
        exec () { return Promise.resolve(0) }
      })

      request(app)
        .get('/entries')
        .expect(200)
        .expect(/bookmarks/)
        .end(done)
    }))

    it('should load a valid entry URL just fine', sinon.test(function (done) {
      const entry = generateFakeEntry()
      this.stub(Entry, 'getEntry').returns(Promise.resolve(entry))

      request(app)
        .get(`/entries/${entry.id}`)
        .expect(200)
        .expect(new RegExp(entry.title))
        .end(done)
    }))

    it('should deny an invalid-BSON entry URL', (done) => {
      request(app)
        .get('/entries/foobar')
        .expect(302)
        .expect('location', '/entries')
        .end((err, res) => {
          if (err) return done(err)
          didFlash(res, 'info', /Ce bookmark n[’']existe pas/)
          done()
        })
    })

    it('should render the entry creation form on `/entries/new`', sinon.test(function (done) {
      this.stub(Entry, 'tags').returns(Promise.resolve([]))

      request(app)
        .get('/entries/new')
        .expect(200)
        .expect(/Nouveau bookmark/)
        .end(done)
    }))

    it('should trigger a proper-payload websocket broadcast on entry creation', sinon.test(function (done) {
      let spy
      if (ws.sockets) {
        spy = this.stub(ws.sockets, 'emit')
      } else {
        ws.sockets = { emit: (spy = this.spy()) }
      }
      const entry = generateFakeEntry({ url: 'http://www.example.com' })
      this.stub(Entry, 'post').returns(Promise.resolve(entry))
      nock(entry.url)
        .get('/')
        .reply(200, '<head><title>That was fast</title></head><body><p>42 tips to mock your network code</body>')

      request(app)
        .post('/entries')
        .send(`url=${entry.url}`)
        .expect(302)
        .expect('location', `/entries/${entry.id}`)
        .end((err, res) => {
          if (err) return done(err)
          expect(spy).to.have.been.calledWith('new-entry', entry)
          done()
        })
    }))
  })
})
