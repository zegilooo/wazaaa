import faker from 'faker'
import objectId from 'bson-objectid'

export function generateFakeEntry (fields = {}) {
  const basis = {
    id: objectId().toHexString(),
    url: faker.internet.url(),
    title: faker.lorem.sentence(),
    excerpt: faker.lorem.text(),
    postedAt: faker.date.past(),
    tags: [],
    poster: { name: 'Alphone Robichu', email: 'alphone@robichu.name', id: '@alphonse' },
    comments: [],

    score: 0,

    upVoters: [],
    downVoters: []
  }

  return { ...basis, ...fields, toJSON () { return this } }
}

export default generateFakeEntry
