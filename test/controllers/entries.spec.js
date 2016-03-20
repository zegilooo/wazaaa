import mongoose from 'mongoose'
import request from 'supertest'
import sinon from 'sinon'

import { didFlash } from '../custom-assertions'
import generateFakeEntry from '../fixtures/entries'

import app from '../../app'
import Entry from '../../models/entry'
import User from '../../models/user'

describe('Entries controller', () => {
  let findStub

  before(() => {
    mongoose.models = {}
    mongoose.modelSchemas = {}
    findStub = sinon.stub(User, 'findOne').returns(Promise.resolve({ _id: '@alphonse', name: 'Alphonse Robichu' }))
  })

  after(() => {
    findStub.restore()
  })

  it('should route to listing on `/entries`', (done) => {
    request(app)
      .get('/entries')
      .expect(200)
      .expect(/bookmarks/)
      .end(done)
  })

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

  it('should render the entry creation form on `/entries/new`', (done) => {
    request(app)
      .get('/entries/new')
      .expect(200)
      .expect(/Nouveau bookmark/)
      .end(done)
  })
})
