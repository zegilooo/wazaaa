import mongoose, { Schema } from 'mongoose'
import _ from 'underscore'

const entrySchema = new Schema({
  url: { type: String, required: true },
  title: String,
  excerpt: String,
  postedAt: { type: Date, default: Date.now, index: true },
  tags: { type: [String], index: true }
})

Object.assign(entrySchema.statics, {
  getEntry (id) {
    return this.findById(id).exec()
  },

  post (fields) {
    fields.tags = normalizeTags(fields.tags)
    return this.create(fields)
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
