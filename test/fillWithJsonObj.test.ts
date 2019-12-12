import 'mocha'
import { expect } from 'chai'
import { fillWithJsonObj } from '../src/json'

describe('fillWithJsonObj', function() {
  it('should add simple properties', function() {
    let test = { }
    let obj = { a: 'a', b: 1 }

    fillWithJsonObj(test, obj)

    expect(test).to.deep.equal({
      a: 'a',
      b: 1
    })
  })

  it('should add simple properties from a JSON string', function() {
    let test = { }
    let obj = JSON.stringify({ a: 'a', b: 1 })

    fillWithJsonObj(test, obj)

    expect(test).to.deep.equal({
      a: 'a',
      b: 1
    })
  })

  it('should do nothing if the given object is not an object', function() {
    let test = { }
    let obj = ''

    fillWithJsonObj(test, obj)

    expect(test).to.deep.equal({})
  })

  it('should add object properties', function() {
    let test = { }
    let obj = { a: { a: 'a', b: 1 } }

    fillWithJsonObj(test, obj)

    expect(test).to.deep.equal({
      a:
      {
        a: 'a',
        b: 1
      }
    })
  })

  it('should add array properties', function() {
    let test = { }
    let obj = { a: [[ 'a', 1 ], [ { a: 'a', b: 1 }, {}]] }

    fillWithJsonObj(test, obj)

    expect(test).to.deep.equal({
      a: [
        [ 'a', 1 ],
        [
          { a: 'a', b: 1 },
          {}
        ]
      ]
    })
  })
})
