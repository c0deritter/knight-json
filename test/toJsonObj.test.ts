import 'mocha'
import { expect } from 'chai'
import { toJsonObj } from '../src/json'

describe('toJsonObj', function() {
  it('should add the @class property if there is a specific class', function() {
    let test = new TestClass1()
    let obj = toJsonObj(test)

    expect(obj).to.deep.equal({
      '@class': 'TestClass1'
    })
  })

  it('should omit the @class property if class is Object', function() {
    let test = {}
    let obj = toJsonObj(test)

    expect(obj).to.deep.equal({ })
  })

  it('should omit the @class property when the corresponding option is set', function() {
    let test = new TestClass1()
    let obj = toJsonObj(test, { omitClassProperty: true })

    expect(obj).to.deep.equal({ })
  })

  it('should add all simple properties', function() {
    let test = new TestClass1('a', 1)
    let obj = toJsonObj(test)

    expect(obj).to.deep.equal({
      '@class': 'TestClass1',
      a: 'a',
      b: 1
    })
  })

  it('should omit undefined properties', function() {
    let test = new TestClass1(undefined, undefined)
    let obj = toJsonObj(test)

    expect(obj).to.deep.equal({
      '@class': 'TestClass1'
    })
  })

  it('should not omit null properties', function() {
    let test = new TestClass1(null, null)
    let obj = toJsonObj(test)

    expect(obj).to.deep.equal({
      '@class': 'TestClass1',
      a: null,
      b: null
    })
  })

  it('should omit excluded properties', function() {
    let test = new TestClass1('a', 1)
    let obj = toJsonObj(test, { exclude: ['b'] })

    expect(obj).to.deep.equal({
      '@class': 'TestClass1',
      a: 'a'
    })
  })

  it('should omit not included properties', function() {
    let test = new TestClass1('a', 1)
    let obj = toJsonObj(test, { include: ['b'] })

    expect(obj).to.deep.equal({
      '@class': 'TestClass1',
      b: 1
    })
  })

  it('should add a property starting with an underscore', function() {
    let test = new TestClass3()
    let obj = toJsonObj(test)

    expect(obj).to.deep.equal({
      '@class': 'TestClass3',
      '_a': 'a'
    })
  })

  it('should omit a property starting with an underscore if the corresponding option is set', function() {
    let test = new TestClass3()
    let obj = toJsonObj(test, { omitPrivateProperties: true })

    expect(obj).to.deep.equal({
      '@class': 'TestClass3'
    })
  })

  it('should not use the getter if the property is starting with an underscore', function() {
    let test = new TestClass4()
    let obj = toJsonObj(test, { omitPrivateProperties: true })

    expect(obj).to.deep.equal({
      '@class': 'TestClass4'
    })
  })

  it('should not use the getter if the property is starting with an underscore if the corresponding option is set', function() {
    let test = new TestClass4()
    let obj = toJsonObj(test, { omitPrivatePropertiesAndUseGetMethodsInstead: true })

    expect(obj).to.deep.equal({
      '@class': 'TestClass4',
      a: 'aa'
    })
  })

  it('should add properties of tpye object', function() {
    let test = new TestClass1(new TestClass1('a', 1))
    let obj = toJsonObj(test)

    expect(obj).to.deep.equal({
      '@class': 'TestClass1',
      a: {
        '@class': 'TestClass1',
        a: 'a',
        b: 1
      }
    })
  })

  it('should keep a property of type object if it is empty', function() {
    let test = new TestClass1({})
    let obj = toJsonObj(test)

    expect(obj).to.deep.equal({
      '@class': 'TestClass1',
      a: {}
    })
  })

  it('should omit a property of type object which is empty if the corresponding option is set', function() {
    let test = new TestClass1({})
    let obj = toJsonObj(test, { omitEmptyObjects: true })

    expect(obj).to.deep.equal({
      '@class': 'TestClass1'
    })
  })

  it('should add an array property consisting of simple values', function() {
    let test = new TestClass1([ 'a', 1 ])
    let obj = toJsonObj(test)

    expect(obj).to.deep.equal({
      '@class': 'TestClass1',
      a: [ 'a', 1 ]
    })
  })

  it('should keep an empty array property', function() {
    let test = new TestClass1([])
    let obj = toJsonObj(test)

    expect(obj).to.deep.equal({
      '@class': 'TestClass1',
      a: []
    })
  })

  it('should omit an empty array property if the corresponding option is set', function() {
    let test = new TestClass1([])
    let obj = toJsonObj(test, { omitEmptyArrays: true })

    expect(obj).to.deep.equal({
      '@class': 'TestClass1'
    })
  })

  it('should add an array of objects', function() {
    let test = new TestClass1([ new TestClass1('a', [ new TestClass1('b', 2)]), {} ])
    let obj = toJsonObj(test)

    expect(obj).to.deep.equal({
      '@class': 'TestClass1',
      a: [
        {
          '@class': 'TestClass1',
          a: 'a',
          b: [{
            '@class': 'TestClass1',
            a: 'b',
            b: 2
          }]
        },
        {}
      ]
    })
  })

  it('should add an array of array', function() {
    let test = new TestClass1([[ 'a', 1 ], [ new TestClass1('a', 1), {} ]])
    let obj = toJsonObj(test)

    expect(obj).to.deep.equal({
      '@class': 'TestClass1',
      a: [
        [ 'a', 1 ],
        [
          {
            '@class': 'TestClass1',
            a: 'a',
            b: 1
          },
          {}
        ]
      ]
    })
  })

  it('should use the given converter', function() {
    let test = new TestClass1('a')
    let obj = toJsonObj(test, { converter: { 'TestClass1': (obj, jsonObj) => { jsonObj.a = obj.a + 'a' }}})

    expect(obj).to.deep.equal({
      '@class': 'TestClass1',
      a: 'aa'
    })
  })  

  it('should use toObj method if available', function() {
    let test = {
      a: 'a',
      toObj: () => { return { a: 'aa' } }
    }

    let obj = toJsonObj(test)
    
    expect(obj).to.deep.equal({
      a: 'aa'
    })
  })

  it('should use toJson method if available', function() {
    let test = {
      a: 'a',
      toJson: () => { return { a: 'aa' } }
    }

    let obj = toJsonObj(test)
    
    expect(obj).to.deep.equal({
      a: 'aa'
    })
  })

  it('should use toJsonObj method if available', function() {
    let test = {
      a: 'a',
      toJsonObj: () => { return { a: 'aa' } }
    }

    let obj = toJsonObj(test)
    
    expect(obj).to.deep.equal({
      a: 'aa'
    })
  })

  it('should not use toObj method on first object if coresponding option is set', function() {
    let test = {
      a: 'a',
      b: {
        c: 1,
        toObj: () => { return { c: 11 } }
      },
      toObj: () => { return { a: 'aa' } }
    }

    let obj = toJsonObj(test, { doNotUseCustomToJsonMethodOfFirstObject: true })
    
    expect(obj.a).to.equal('a')
    expect(obj.b.c).to.equal(11)
  })

  it('should convert a Date', function() {
    let date = new Date
    
    let obj = toJsonObj(date)

    expect(obj['@class']).to.equal('Date')
    expect(obj.date).to.equal(date.toISOString())
  })
})

class TestClass1 {
  constructor(public a?: any, public b?: any) { }
}

class TestClass3 {
  private _a: string = 'a'
}

class TestClass4 {
  private _a: string = 'a'

  get a(): string {
    return this._a + 'a'
  }
}
