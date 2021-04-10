# Knight JSON by Coderitter

A programming language object to JSON object converter. It preservers and recreates the original classes and the conversion process can be incluenced.

## Install

`npm install knight-json`

## Overview

The package offers the methods `toJsonObj()`, `fromJsonObj()` and `fillJsonObj()` which lay the conversion of the JSON string into your hands. If you do not need that, use `toJson()`, `fromJson()` and `fillJson()`.

### Convert to JSON

Converting an object to JSON happens in two steps.

In the first one, an object which is an instance of a specific class is converted into a plain JavaScript object (of class `Object`) through the use of `toJsonObj()`. This representation of the original object now possesses a property `@class` in which the class name of the original instance is stored.

In the second step, this plan JavaScript object can be converted into a JSON string by using the built-in `JSON.stringify()` method.

```typescript
import { toJsonObj } from 'knight-json'

class User {
  id = 1
  name = 'Ronny'
}

let user = new User
let userObj = toJsonObj(user)

userObj == {
  '@class': 'User',
  id: 1
  name: 'Ronny'
}

let userJson = JSON.stringify(userObj)

userJson == '{"@class":"User","id":1,"name":"Ronny"}'
```

To combine both steps use `toJson()`.

### Convert from JSON to an instance of that specific class

To convert a JSON back into the instance of that specific class you do the same steps as before but the other way around.

At first, convert the JSON string back by using `JSON.parse()`. The resulting plain JavaScript object will contain the special `@class` property, holding the class name.

Then use the function `fromJsonObj()` to convert the plain JavaScript object into the object of the specific class. To do so you need an instantiator object. It maps a class name to a function which instantiates an object of the corresponding class.

```typescript
import { fromJsonObj } from 'knight-json'

let userJson = '{"@class":"User","id":1,"name":"Ronny"}'
let userObj = JSON.parse(userJson)

// the instantiator
let instantiator = {
  'User': () => new User
}

let user = fromJsonObj(userObj, { instantiator: instantiator })

user instanceof User == true

user == {
  id: 1,
  name: 'Ronny'
}
```

To combine both steps use `fromJson()`.

### Fill an existing object with JSON

You can also take an existing object and fill it with the properties of that object in the JSON string.

The first step again is to convert the JSON string into the plain JavaScript object while in the next step this plain object is copied property by property into the given one using the method `fillJsonObj()`. In that case, the class name stored in the `@class` property is ignored.

```typescript
import { fillJsonObj } from 'knight-json'

let userJson = '{"@class":"User","id":2,"name":"Hagen"}'
let userObj = JSON.parse(userJson)
let user = new User

fillJsonObj(user, userObj)

user == {
  id: 2,
  name: 'Hagen'
}
```

To combine both steps use `fillJson()`.

### Include or exlude specific properties

You can specify properties to exclude.

```typescript
let userObj = toJsonObj(user, { exclude: ['password'] })
```

Or you can specify properties to be included.

```typescript
let userObj = toJsonObj(user, { include: ['id', 'name'] })
```

### Influence the JSON object generation

You can influence the generation of the JSON object by adding a `toJsonObj()` method to your object. It will be used by the `toJsonObj()` function if present.

This method can return any object you like. Most of the time though, you just want to exclude certain properties and still use the `toJsonObj()` function because it also considers sub objects or arrays. You can do this by setting the properties to exclude in the `options` parameter and then giving control back to `toJsonObj()` function.

```typescript
import { ToJsonOptions } from 'knight-json'

class User {
  id = 3
  name = 'Elias'
  password = 'eliasforpresident'

  // magic
  toJsonObj(options: ToJsonOptions = {}) {
    options.exclude = ['password']
    options.doNotUseCustomToJsonMethodOfFirstObject = true // prevent infinite recursion
    return toJsonObj(this, options)
  }
}

let user = new User
let userObj = toJsonObj(user)

userObj == {
  '@class': 'User',
  id: 3,
  name: 'Elias'
}
```

When you do this you need to consider that using the `toJsonObj()` function on `this` will again call the customized `toJsonObj()` method on the object. You will get into an infinite recursion loop. To prevent this from happening set the option `doNotUseCustomToJsonMethodOfFirstObject` to true. It will not use the customized `toJsonObj()` method on the first object which in this case is `this`.

### Influence how an object is filled

You can influence how an object is filled with the plain JavaScript object by adding a `fillJsonObj()` method to your object. It will be used by the `fillJsonObj()` function if present.

To be able to reuse the `fillJsonObj()` function inside that method you will need to set the option `doNotUseCustomToJsonMethodOfFirstObject` to avoid an infinite recursion loop.

```typescript
import { FillJsonObjOptions } from 'knight-json'

class User {
  id = 3
  name = 'Elias'
  password = 'eliasforpresident'

  fillJsonObj(obj: any, options: FillJsonObjOptions = {}) {
    options.include = ['id', 'name']
    options.doNotUseCustomToJsonMethodOfFirstObject = true
    fillJsonObj(this, obj, options)
  }
}

fillJsonObj(user, userObj)
```

### Custom converters

You can also influence the conversion process by defining converters which you can give into the options of `toJsonObj()`, `fromJsonObj()` and `fillJsonObj()`. They should be used when converting 3rd party objects. If you want to influence the conversion process of your own classes, use the methods described above.

```typescript
/* converter for fromJsonObj() */
let converter = {
  'Locale': (locale: Locale, jsonObj: any) => {
    // you do not need to set the `@class` property because this will be done by the algorithm
    jsonObj.locale = locale.toString()
  }
}

/* converter for toJsonObj() or fillJsonObj() */
let converter = {
  'Locale': (jsonObj: any) => new Intl.Locale(jsonObj.locale)
}
```

There is default support for JavaScript `Date` and `BigInt`. You can overwrite those converters by setting your own in the options parameter.