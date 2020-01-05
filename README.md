# Quick start

A mega nice programming language object to JSON object converter.

## toJsonObj()

Convert one of your classes to a plain JavaScript object called a JSON object which is ready to be converted to a JSON string.

```typescript
class User {
  id = 1
  name = 'Ronny'
}

var user = new User
var userObj = toJsonObj(user) // magic

userObj == {
  '@class': 'User',
  id: 1
  name: 'Ronny'
}

var userJson = JSON.stringify(userObj)

userJson == '{"@class":"User","id":1,"name":"Ronny"}'
```

## fromJsonObj()

Take a JSON containing a JSON object created by this library. Combine it with an instantiator and convert the JSON object back to the primordial used classes.

```typescript
var userJson = '{"@class":"User","id":1,"name":"Ronny"}'
var userObj = JSON.parse(userJson)

// magic
var instantiator = {
  'User': () => new User()
}

var user = fromJsonObj(userObj, instantiator) // magic

user instanceof User == true

user == {
  id: 1,
  name: 'Ronny'
}
```

## fillWithJsonObj()

Fill that object that you already have in place.

```typescript
var userJson = '{"@class":"User","id":2,"name":"Hagen"}'
var userObj = JSON.parse(userJson)
var user = new User

fillWithJsonObj(user, userObj) // magic

user == {
  id: 2,
  name: 'Hagen'
}
```

## Exclusion of properties starting with an underscore

Normally you do not want to include the private properties of an object in the JSON which you want to send over the wire. This library will skip properties starting with an underscore `_` which signals a private property.

```typescript
class User {
  id = 2
  name = 'Hagen'
  private _password = 'hagenforever'
}

var user = new User
var userObj = toJsonObj(user) // magic

userObj == {
  '@class': 'User',
  id: 2,
  name: 'Hagen'
}
```

If there is a property getter in place it will be used instead.

```typescript
class User {
  id = 2
  name = 'Hagen'
  private _password = 'hagenforever'

  get password() {
    return 'secret'
  }
}

var user = new User
var userObj = toJsonObj(user) // magic

userObj == {
  '@class': 'User',
  id: 2,
  name: 'Hagen',
  password: 'secret'
}
```

## Blacklist or whitelist properties

You can specify properties to exclude.

```typescript
var userObj = toJsonObj(user, { exclude: ['password'] })
```

Or you can specify properties to be included.

```typescript
var userObj = toJsonObj(user, { include: ['id', 'name'] })
```

## Customize toJsonObj

If you need to do something custom when converting one of your objects define a `toJsonObj` method which will be used to convert your object. Additionally there is also support to name this method `toJson` or `toObj`.

```typescript
class User {
  id = 3
  name = 'Elias'
  password = 'eliasforpresident'

  // magic
  toJsonObj() {
    var options = {
      exclude: ['password'],
      doNotUseCustomToJsonMethodOfFirstObject: true
    }

    return toJsonObj(this, options)
  }
}

var user = new User
var userObj = toJsonObj(user) // magic

userObj == {
  '@class': 'User',
  id: 3,
  name: 'Elias'
}
```

If you still want to use `toJsonObj` as the basis of you converstion process it is important to use the `doNotUseCustomToJsonMethodOfFirstObject` option which will ensure that you will not get stuck in the recursion. 

## Customize fillWithJsonObj

If you need to do something special when filling one of your objects with a JSON object define the `fillWithJsonObj` method. Additionally there is also support to name this method `fillWithJson` or `fillWithObj`.

```typescript
class User {
  id = 3
  name = 'Elias'
  password = 'eliasforpresident'

  // magic
  fillWithJsonObj() {
    var options = {
      include: ['id', 'name'],
      doNotUseCustomToJsonMethodOfFirstObject: true
    }

    fillWithJsonObj(this, options)
  }
}

var userObj = {
  id: 3,
  name: 'Elias',
  password: 'hackattack'
}

var user = new User
fillWithJsonObj(user, userObj) // magic

user == {
  id: 3,
  name: 'Elias',
  password: undefined
}
```

## Combine instantiators

You can combine instantiators by using the provided `Instantiator` class. It has a constructor taking arbitrary many instantiators and merging them into itself.

```typescript
import { Instantiator } from 'mega-nice-json'

class UserInstantiator extends Instantiator {
  'User' = () => new User
}

class AppInstantiator extends Instantiator {
  'SomeClass' = () => new SomeClass

  constructor() {
    super(new UserInstantiator) // magic
  }
}

var instantiator = new AppInstantiator

instantiator == {
  'SomeClass': () => new SomeClass
  'User': () => new User
}
```