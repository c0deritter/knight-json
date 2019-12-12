import 'mocha'
import { expect } from 'chai'
import { fromJsonObj, Instantiator } from '../src/json'

describe('fromJsonObj', function() {
  it('should create an empty object', function() {
    let jsonObj = {}

    let obj = fromJsonObj(jsonObj)

    expect(obj).to.deep.equal({ })
  })

  it('should create the corresponding class', function() {
    let jsonObj = {
      '@class': 'TestClass1',
      a: {
        '@class': 'TestClass2'
      }
    }

    let obj = fromJsonObj(jsonObj, new TestInstantiator())

    expect(obj).to.be.instanceOf(TestClass1)
    expect(obj.a).to.be.instanceOf(TestClass2)
  })

  it('should create the a plain object if the instantiator does not have a corresponding class', function() {
    let jsonObj = {
      '@class': 'TestClass100',
      a: {
        '@class': 'TestClass2'
      }
    }

    let obj = fromJsonObj(jsonObj, new TestInstantiator())

    expect(obj).to.be.instanceOf(Object)
    expect(obj.a).to.be.instanceOf(TestClass2)
  })
})

class TestClass1 {}
class TestClass2 {}

class TestInstantiator extends Instantiator {
  'TestClass1' = () => new TestClass1()
  'TestClass2' = () => new TestClass2()
}