import 'mocha'
import { expect } from 'chai'
import { fromJsonObj } from '../src/json'

describe('fromJsonObj', function() {
  it('should create an empty object', function() {
    let jsonObj = {}

    let obj = fromJsonObj(jsonObj)

    expect(obj).to.deep.equal({ })
  })
})