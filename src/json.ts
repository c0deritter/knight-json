export interface ToJsonOptions {
  include?: string[]
  exclude?: string[]
  converter?: { [propertyName: string]: (propertyValue: any) => any }
  keepEmptyArrays?: boolean
  keepEmptyObjects?: boolean
  omitClassProperty?: boolean
}

export function toJsonObj(obj: any, options?: ToJsonOptions): any {
  if (typeof obj !== 'object') {
    return obj
  }

  let jsonObj: any

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

    // if the value is undefined skip it. We do not want to have it in the object.
    if (propValue == undefined) {
      continue
    }

    // skip empty arrays if we do not keep empty arrays
    if (options && ! options.keepEmptyArrays && propValue instanceof Array && ! propValue) {
      continue
    }

    // skip empty objects if we do not keep empty objects
    if (options && ! options.keepEmptyObjects && typeof propValue === 'object' && ! propValue) {
      continue
    }

    // start conversion

    // add class information
    if (! options || options && ! options.omitClassProperty) {
      jsonObj['@class'] = obj.constructor.name
    }

    // if there is a custom converter for the property
    if (options && options.converter && propName in options.converter) {
      let converter = options.converter[propName]
      jsonObj[propName] = converter(propValue)
    }

    // if the value is an object it may have the 'toObj' method
    else if (typeof propValue.toObj === 'function') {
      jsonObj[propName] = propValue.toObj()
    }

    // else if it is an array we need to iterate every single array item
    else if (propValue instanceof Array) {
      let jsonArray = []

      for (let arrayValue of propValue) {
        if (typeof arrayValue.toObj === 'function') {
          jsonArray.push(arrayValue.toObj())
        }
        else {
          jsonArray.push(arrayValue)
        }
      }

      jsonObj[propName] = jsonArray
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
}

export function fillWithJsonObj(obj: any, fillWith: any, options?: FillWithJsonObjOptions) {
  if (typeof fillWith === 'string') {
    try {
      let parsed = JSON.parse(fillWith)
      fillWithJsonObj(obj, parsed)
    }
    catch (e) {
      throw new Error('Could not parse given JSON string')
    }
  }

  // if the given value to fill with is not an object just do nothing
  if (typeof fillWith !== 'object') {
    return 
  }

  for (let prop in fillWith) {
    if (! Object.prototype.hasOwnProperty.call(fillWith, prop)) {
      continue
    }

    let propName = prop.toString()
    let propValue = fillWith[propName]

    if (typeof propValue === 'object') {
      obj[propName] = fromJsonObj(propValue, options ? options.instantiator : undefined)
    }
    
    else if (propValue instanceof Array) {
      let values = []
      
      for (let value of propValue) {
        if (typeof value === 'object') {
          values.push(fromJsonObj(value))
        }
        else {
          values.push(value)
        }
      }

      obj[propName] = values
    }

    else {
      obj[propName] = propValue
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
      throw new Error('Could not parse given JSON string')
    }
  }

  if (typeof jsonObj !== 'object') {
    return jsonObj
  }

  let obj

  if ('@class' in jsonObj && typeof jsonObj['@class'] === 'string' && instantiator) {
    let cls: string = jsonObj['@class']

    if (cls in instantiator) {
      let i = instantiator[cls]
      obj = i()
    }
  }
  else {
    obj = {}
  }

  if (typeof obj.fillWithObj === 'function') {
    obj.fillWithObj(jsonObj)
  }
  else {
    fillWithJsonObj(obj, jsonObj, { instantiator: instantiator })
  }
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