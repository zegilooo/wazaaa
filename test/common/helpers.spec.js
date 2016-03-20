import { expect } from 'chai'

import populateHelpers from '../../common/helpers'

const scope = {}
populateHelpers(scope)

describe('formatDate', () => {
  const { formatDate } = scope

  it('should use French')

  it('should honor a custom format')

  it('should default to current datetime')

  it('should default to a fixed, long-form format')

  it('should honor the `postedAt` property of its argument, if present')
})

describe('pluralize', () => {
  const { pluralize } = scope

  it('should use untouched singular if below 2')

  it('should use s-suffixed singular if above 1 and no custom plural')

  it('should use custom plural if provided and above 1')
})
