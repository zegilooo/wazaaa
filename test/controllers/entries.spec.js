import request from 'supertest'

import app from '../../app'

describe('Entries controller', () => {
  it('should route to listing on `/entries`', (done) => {
    request(app)
      .get('/entries')
      .expect(200)
      .expect(/bookmarks/)
      .end(done)
  })

  it('should render the entry creation form on `/entries/new`', (done) => {
    request(app)
      .get('/entries/new')
      .expect(200)
      .expect(/Nouveau bookmark/)
      .end(done)
  })
})
