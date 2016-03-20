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
  getEntries (filter) {
    const tags = normalizeTags(_.isString(filter) ? filter : filter && filter.tags)
    const scope = this.find().select('-comments -upVoters -downVoters').populate('poster').sort({
      score: -1, postedAt: -1
    })

    if (tags.length === 0) {
      return scope.exec()
    }

    const op = (filter.tagMode === 'any' ? 'in' : 'all')
    return scope.where('tags')[op](tags).exec()
  },

  getEntry (id) {
    return this.findById(id).populate('poster comments.author').exec()
  },

  post (fields) {
    fields.tags = normalizeTags(fields.tags)
    return this.create(fields)
  },

  tags () {
    return this.aggregate(
      { $project: { tags: 1 } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ).exec().then((tuples) => _.pluck(tuples, '_id'))
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
