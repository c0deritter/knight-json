import { expect } from 'chai'
import 'mocha'
import { fillJsonObj } from '../src/json'

describe('fillJsonObj', function() {
  it('should add simple properties', function() {
    let test = { }
    let obj = { a: 'a', b: 1 }

    fillJsonObj(test, obj)

    expect(test).to.deep.equal({
      a: 'a',
      b: 1
    })
  })

  it('should add simple properties from a JSON string', function() {
    let test = { }
    let obj = JSON.stringify({ a: 'a', b: 1 })

    fillJsonObj(test, obj)

    expect(test).to.deep.equal({
      a: 'a',
      b: 1
    })
  })

  it('should do nothing if the given object is not an object', function() {
    let test = { }
    let obj = ''

    fillJsonObj(test, obj)

    expect(test).to.deep.equal({})
  })

  it('should add object properties', function() {
    let test = { }
    let obj = { a: { a: 'a', b: 1 } }

    fillJsonObj(test, obj)

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

    fillJsonObj(test, obj)

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

  it('should use fillJsonObj method if available', function() {
    let test = new TestClass3()
    let jsonObj = { a: 'a' }

    fillJsonObj(test, jsonObj)

    expect(test.a).to.equal('aa')
  })

  it('should return if obj is undefined', function() {
    fillJsonObj(undefined, {})
  })

  it('should return if obj is null', function() {
    fillJsonObj(null, {})
  })

  it('should return if obj is not object', function() {
    fillJsonObj('', {})
    fillJsonObj(1, {})
    fillJsonObj(true, {})
  })

  it('should fill a property of type object', function() {
    let test = {
      a: {
        b: 'b',
        c: 1
      }
    }

    let fillWith = {
      a: {
        c: 2,
        d: 'd'
      }
    }

    fillJsonObj(test, fillWith)

    expect(test).to.deep.equal({
      a: {
        b: 'b',
        c: 2,
        d: 'd'
      }
    })
  })

  it('should replace a property of type object with null', function(){
    let test = {
      a: {
        b: 'b',
        c: 1
      }
    }

    let fillWith = {
      a: null
    }

    fillJsonObj(test, fillWith)

    expect(test).to.deep.equal({
      a: null
    })
  })

  it('should replace a property of type object with any primitive value', function() {
    let test = {
      a: {
        b: 'b',
        c: 1
      }
    }

    let fillWith = {
      a: 'a'
    }

    fillJsonObj(test, fillWith)

    expect(test).to.deep.equal({
      a: 'a'
    })
  })

  it('should not use the custom fill method on the object if the corresponding option is set', function() {
    let test = new TestClass1()
    test.b = new TestClass1()
    fillJsonObj(test, { a: 'a', b: { a: 'a' } }, { doNotUseCustomToJsonMethodOfFirstObject: true })
    expect(test.a).to.equal('a')
    expect(test.b.a).to.equal('aa')
  })

  it('should convert a property of type Date', function() {
    let date = new Date
    let obj: any = { }
    fillJsonObj(obj, { a: { '@class': 'Date', date: date.toISOString() }})
    expect(obj.a).to.be.instanceOf(Date)
    expect(obj.a.toISOString()).to.equal(date.toISOString())
  })
})

class TestClass1 {
  a!: string
  b!: any
  fillJsonObj(jsonObj: any) {
    this.a = jsonObj.a + 'a'
  }
}

class TestClass3 {
  a!: string
  fillJsonObj(jsonObj: any) { 
    this.a = jsonObj.a + 'a'
  }
}
