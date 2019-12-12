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

  it('should use fillWithObj method if available', function() {
    let test = new TestClass1()
    let jsonObj = { a: 'a' }

    fillWithJsonObj(test, jsonObj)

    expect(test.a).to.equal('aa')
  })

  it('should use fillWithJson method if available', function() {
    let test = new TestClass2()
    let jsonObj = { a: 'a' }

    fillWithJsonObj(test, jsonObj)

    expect(test.a).to.equal('aa')
  })

  it('should use fillWithJsonObj method if available', function() {
    let test = new TestClass3()
    let jsonObj = { a: 'a' }

    fillWithJsonObj(test, jsonObj)

    expect(test.a).to.equal('aa')
  })

  it('should return if obj is undefined', function() {
    fillWithJsonObj(undefined, {})
  })

  it('should return if obj is null', function() {
    fillWithJsonObj(null, {})
  })

  it('should return if obj is not object', function() {
    fillWithJsonObj('', {})
    fillWithJsonObj(1, {})
    fillWithJsonObj(true, {})
  })
})

class TestClass1 {
  a!: string
  fillWithObj(jsonObj: any) { 
    this.a = jsonObj.a + 'a'
  }
}

class TestClass2 {
  a!: string
  fillWithJson(jsonObj: any) { 
    this.a = jsonObj.a + 'a'
  }
}

class TestClass3 {
  a!: string
  fillWithJsonObj(jsonObj: any) { 
    this.a = jsonObj.a + 'a'
  }
}
