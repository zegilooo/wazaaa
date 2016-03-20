import mongoose, { Schema } from 'mongoose'
import _ from 'underscore'

const entrySchema = new Schema({
  url: { type: String, required: true },
  title: String,
  excerpt: String,
  postedAt: { type: Date, default: Date.now, index: true },
  tags: { type: [String], index: true },

  poster: { type: String, ref: 'User' },

  comments: [{
    text: { type: String, required: true },
    author: { type: String, ref: 'User' },
    postedAt: { type: Date, default: Date.now, index: true }
  }],

  score: { type: Number, default: 0, index: true },

  upVoters: [{ type: String, ref: 'User' }],
  downVoters: [{ type: String, ref: 'User' }]
})

Object.assign(entrySchema.statics, {
  getEntry (id) {
    return this.findById(id).populate('poster comments.author').exec()
  },

  post (fields) {
    fields.tags = normalizeTags(fields.tags)
    return this.create(fields)
  }
})

Object.assign(entrySchema.methods, {
  comment (author, text) {
    return this.update({ $push: { comments: { author, text } } }).exec()
  },

  voteBy (user, offset) {
    user = user.id || user

    return this.update({
      $inc: { score: offset },
      $addToSet: { [offset > 0 ? 'upVoters' : 'downVoters']: user }
    }).exec()
  },

  votedBy (user) {
    user = user.id || user
    return _.contains(this.upVoters, user) || _.contains(this.downVoters, user)
  }
})

const Model = mongoose.model('Entry', entrySchema)

export default Model

function normalizeTags (tags) {
  tags = _.flatten([_.isString(tags) ? tags.trim() : tags])
  tags = _.chain(tags).compact().map((s) => s.toLowerCase().split(/[,\s]+/))
    .flatten().invoke('trim').value().sort()
  return _.unique(tags, true)
}
