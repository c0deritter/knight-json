export interface ToJsonOptions {
  include?: string[]
  exclude?: string[]
  converter?: { [className: string]: (obj: any, jsonObj: any) => void }
  omitPrivateProperties?: boolean
  omitPrivatePropertiesAndUseGetMethodsInstead?: boolean
  omitEmptyArrays?: boolean
  omitEmptyObjects?: boolean
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
    if (typeof obj.toObj == 'function') {
      return obj.toObj(options)
    }

    if (typeof obj.toJson == 'function') {
      return obj.toJson(options)
    }

    if (typeof obj.toJsonObj == 'function') {
      return obj.toJsonObj(options)
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

  if (options && options.converter && obj.constructor.name in options.converter) {
    let converter = options.converter[obj.constructor.name]
    converter(obj, jsonObj)
  }
  else {
    // copy all fields
    for (let prop in obj) {
      if (! Object.prototype.hasOwnProperty.call(obj, prop)) {
        continue
      }

      let propName = prop.toString()
      let propValue: any

      // if the property is a private or protected one it should start with _
      if (prop.indexOf('_') == 0 && options && (options.omitPrivateProperties || options.omitPrivatePropertiesAndUseGetMethodsInstead)) {
        if (options.omitPrivatePropertiesAndUseGetMethodsInstead) {
          // get property name which should be the same but without the _
          propName = prop.substr(1)

          // if there is a property on the object use it to retrieve the value
          if (propName in obj) {
            propValue = (<any> obj)[propName]
          }
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

      // skip empty arrays if the corresponding option is set
      if (options && options.omitEmptyArrays && propValue instanceof Array && propValue.length == 0) {
        continue
      }

      // skip empty objects if the corresponding option is set
      if (options && options.omitEmptyObjects && typeof propValue == 'object' && 
          propValue !== null && Object.keys(propValue).length == 0) {
        continue
      }

      // start conversion

      // else if it is an array we need to iterate every single array item
      if (propValue instanceof Array) {
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
  }

  return jsonObj
}

export interface FillWithJsonObjOptions extends FromJsonObjOptions {
  include?: string[]
  exclude?: string[]
  doNotUseCustomToJsonMethodOfFirstObject?: boolean
}

export function fillWithJsonObj(obj: any, jsonObj: any, options?: FillWithJsonObjOptions): void
export function fillWithJsonObj(obj: any, jsonObj: any, instantiator?: Instantiator): void

export function fillWithJsonObj(obj: any, jsonObj: any, optionsOrInstantiator?: FillWithJsonObjOptions|Instantiator): void {
  let options
  if (optionsOrInstantiator instanceof Instantiator) {
    options = { instantiator: optionsOrInstantiator }
  }
  else {
    options = optionsOrInstantiator
  }

  if (typeof obj != 'object' || obj === null) {
    return 
  }

  if (typeof jsonObj == 'string') {
    try {
      let parsed = JSON.parse(jsonObj)
      fillWithJsonObj(obj, parsed)
    }
    catch (e) {
      // if it is not a JSON string we can do nothing
      return
    }
  }

  // if the given value to fill with is not an object just do nothing
  if (typeof jsonObj !== 'object') {
    return 
  }

  if (! options || options && ! options.doNotUseCustomToJsonMethodOfFirstObject) {
    if (typeof obj.fillWithObj == 'function') {
      obj.fillWithObj(jsonObj, options)
      return
    }
    else if (typeof obj.fillWithJson == 'function') {
      obj.fillWithJson(jsonObj, options)
      return
    }
    else if (typeof obj.fillWithJsonObj == 'function') {
      obj.fillWithJsonObj(jsonObj, options)
      return
    }
  }

  if (options) {
    options = {
      instantiator: options.instantiator,
      converter: options.converter
    }
  }

  for (let prop in jsonObj) {
    if (! Object.prototype.hasOwnProperty.call(jsonObj, prop)) {
      continue
    }

    if (prop == '@class') {
      continue
    }

    let propName = prop.toString()
    let originalValue = obj[propName]
    let fillWithValue = jsonObj[propName]

    if (typeof originalValue == 'object' && originalValue !== null 
        && typeof fillWithValue == 'object' && fillWithValue !== null) {
      fillWithJsonObj(originalValue, fillWithValue, options)
    }
    else {
      if (typeof fillWithValue == 'object') {
        obj[propName] = fromJsonObj(fillWithValue, options)
      }
      else {
        obj[propName] = fillWithValue
      }  
    }
  }
}

export interface FromJsonObjOptions {
  instantiator?: Instantiator
  converter?: { [className: string]: (obj: any, options?: FromJsonObjOptions) => any }
}

export function fromJsonObj(jsonObj: any, options?: FromJsonObjOptions): any
export function fromJsonObj(jsonObj: any, instantiator?: Instantiator): any

export function fromJsonObj(jsonObj: any, optionsOrInstantiator?: FromJsonObjOptions|Instantiator): any {
  let options
  if (optionsOrInstantiator instanceof Instantiator) {
    options = { instantiator: optionsOrInstantiator }
  }
  else {
    options = optionsOrInstantiator
  }

  if (typeof jsonObj == 'string') {
    try {
      let parsed = JSON.parse(jsonObj)
      return fromJsonObj(parsed, optionsOrInstantiator)
    }
    catch (e) {
      return jsonObj
    }
  }

  if (typeof jsonObj != 'object' || jsonObj === null) {
    return jsonObj
  }

  if (jsonObj instanceof Array) {
    let values = []
      
    for (let value of jsonObj) {
      values.push(fromJsonObj(value, optionsOrInstantiator))
    }

    return values
  }

  let obj

  if ('@class' in jsonObj && typeof jsonObj['@class'] == 'string') {
    if (options && options.converter && jsonObj['@class'] in options.converter) {
      let converterFunction = options.converter[jsonObj['@class']]
      return converterFunction(jsonObj, options)
    }
    else if (options?.instantiator != undefined && jsonObj['@class'] in options.instantiator) {
      let instantiatorFunction = options.instantiator[jsonObj['@class']]
      obj = instantiatorFunction()
    }
    else {
      obj = {}
    }
  }
  else {
    obj = {}
  }

  if (typeof obj.fillWithObj == 'function') {
    obj.fillWithObj(jsonObj, options)
  }
  else if (typeof obj.fillWithJson == 'function') {
    obj.fillWithJson(jsonObj, options)
  }
  else if (typeof obj.fillWithJsonObj == 'function') {
    obj.fillWithJsonObj(jsonObj, options)
  }
  else {
    fillWithJsonObj(obj, jsonObj, options)
  }

  return obj
}

export class Instantiator {
  
  [className: string]: () => any

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