export interface ToJsonOptions {
  include?: string[]
  exclude?: string[]
  converter?: { [propertyName: string]: (propertyValue: any) => any }
  keepEmptyArrays?: boolean
  keepEmptyObjects?: boolean
  omitClassProperty?: boolean
  doNotUseCustomToJsonMethodOfFirstObject?: boolean
}

export function toJsonObj(obj: any, options?: ToJsonOptions): any {
  if (typeof obj !== 'object') {
    return obj
  }

  if (obj instanceof Array) {
    let jsonArray = []

    for (let element of obj) {
      let jsonObj = toJsonObj(element, options)
      jsonArray.push(jsonObj)
    }

    return jsonArray
  }

  if ((! options || options && ! options.doNotUseCustomToJsonMethodOfFirstObject) && obj !== null) {
    if (typeof obj.toObj === 'function') {
      return obj.toObj()
    }

    if (typeof obj.toJson === 'function') {
      return obj.toJson()
    }

    if (typeof obj.toJsonObj === 'function') {
      return obj.toJsonObj()
    }
  }

  if (options) {
    delete options.doNotUseCustomToJsonMethodOfFirstObject
  }

  let jsonObj: any = {}

  // add class information
  if ((! options || options && ! options.omitClassProperty) && obj.constructor.name != 'Object') {
    jsonObj['@class'] = obj.constructor.name
  }

  // copy any field that is not private and not the parent
  for (let prop in obj) {
    if (! Object.prototype.hasOwnProperty.call(obj, prop)) {
      continue
    }

    let propName = prop.toString()
    let propValue: any

    // if the property is a private or protected one it should start with _
    if (prop.indexOf('_') == 0) {
      // get property name which should be the same but without the _
      propName = prop.substr(1)

      // if there is a property on the object use it to retrieve the value
      if (propName in obj) {
        propValue = (<any> obj)[propName]
      }
    }
    // if it is not private just retrieve the value
    else {
      propValue = (<any> obj)[propName]
    }

    if (options && options.include && options.include.indexOf(propName) == -1) {
      continue
    }

    if (options && options.exclude && options.exclude.indexOf(propName) != -1) {
      continue
    }

    // if the value is undefined skip it
    if (propValue === undefined) {
      continue
    }

    // skip empty arrays if we do not keep empty arrays
    if ((! options || options && ! options.keepEmptyArrays) 
        && propValue instanceof Array && propValue.length == 0) {
      continue
    }

    // skip empty objects if we do not keep empty objects
    if ((! options || options && ! options.keepEmptyObjects) 
        && typeof propValue === 'object' && propValue !== null && Object.keys(propValue).length == 0) {
      continue
    }

    // start conversion

    // if there is a custom converter for the property
    if (options && options.converter && propName in options.converter) {
      let converter = options.converter[propName]
      jsonObj[propName] = converter(propValue)
    }

    // else if it is an array we need to iterate every single array item
    else if (propValue instanceof Array) {
      let jsonArray = toJsonObj(propValue, options)
      jsonObj[propName] = jsonArray
    }

    // if the value is an object it may have the 'toObj' method
    else if (typeof propValue == 'object' && propValue !== null) {
      jsonObj[propName] = toJsonObj(propValue, options)
    }

    // otherwise just set it
    else {
      jsonObj[propName] = propValue
    }
  }

  return jsonObj
}

export interface FillWithJsonObjOptions {
  include?: string[]
  exclude?: string[]
  instantiator?: Instantiator
  doNotUseCustomToJsonMethodOfFirstObject?: boolean
}

export function fillWithJsonObj(obj: any, fillWith: any, options?: FillWithJsonObjOptions) {
  if (typeof obj !== 'object' || obj === null) {
    return 
  }

  if (typeof fillWith === 'string') {
    try {
      let parsed = JSON.parse(fillWith)
      fillWithJsonObj(obj, parsed)
    }
    catch (e) {
      // if it is not a JSON string we can do nothing
      return
    }
  }

  // if the given value to fill with is not an object just do nothing
  if (typeof fillWith !== 'object') {
    return 
  }

  if (! options || options && ! options.doNotUseCustomToJsonMethodOfFirstObject) {
    if (typeof obj.fillWithObj === 'function') {
      obj.fillWithObj(fillWith)
      return
    }
    else if (typeof obj.fillWithJson === 'function') {
      obj.fillWithJson(fillWith)
      return
    }
    else if (typeof obj.fillWithJsonObj === 'function') {
      obj.fillWithJsonObj(fillWith)
      return
    }
  }

  if (options) {
    delete options.doNotUseCustomToJsonMethodOfFirstObject
  }

  for (let prop in fillWith) {
    if (! Object.prototype.hasOwnProperty.call(fillWith, prop)) {
      continue
    }

    if (prop == '@class') {
      continue
    }

    let propName = prop.toString()
    let originalValue = obj[propName]
    let fillWithValue = fillWith[propName]

    if (typeof originalValue === 'object' && originalValue !== null 
        && typeof fillWithValue === 'object' && fillWithValue !== null) {
      fillWithJsonObj(originalValue, fillWithValue, options)
    }
    else {
      if (typeof fillWithValue === 'object') {
        obj[propName] = fromJsonObj(fillWithValue, options ? options.instantiator : undefined)
      }
      else {
        obj[propName] = fillWithValue
      }  
    }
  }
}

export function fromJsonObj(jsonObj: any, instantiator?: Instantiator): any {
  if (typeof jsonObj === 'string') {
    try {
      let parsed = JSON.parse(jsonObj)
      fromJsonObj(parsed, instantiator)
    }
    catch (e) {
      return jsonObj
    }
  }

  if (typeof jsonObj !== 'object' || jsonObj === null) {
    return jsonObj
  }

  if (jsonObj instanceof Array) {
    let values = []
      
    for (let value of jsonObj) {
      values.push(fromJsonObj(value, instantiator))
    }

    return values
  }

  let obj

  if ('@class' in jsonObj && typeof jsonObj['@class'] === 'string' && instantiator != undefined) {
    let cls: string = jsonObj['@class']

    if (cls in instantiator) {
      let instantiatorFunction = instantiator[cls]
      obj = instantiatorFunction()
    }
    else {
      obj = {}
    }
  }
  else {
    obj = {}
  }

  if (typeof obj.fillWithObj === 'function') {
    obj.fillWithObj(jsonObj)
  }
  else if (typeof obj.fillWithJson === 'function') {
    obj.fillWithJson(jsonObj)
  }
  else if (typeof obj.fillWithJsonObj === 'function') {
    obj.fillWithJsonObj(jsonObj)
  }
  else {
    fillWithJsonObj(obj, jsonObj, { instantiator: instantiator })
  }

  return obj
}

export class Instantiator {
  
  [propertyName: string]: () => any

  constructor(...instantiators: Instantiator[]) {
    for (let instantiator of instantiators) {
      for (let prop in instantiator) {
        if (Object.prototype.hasOwnProperty.call(instantiator, prop)) {
          this[prop] = instantiator[prop]
        }
      }
    }
  }
}