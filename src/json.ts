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

export function toJsonObj(obj: any, options?: ToJsonOptions, alreadyConverted: any[] = []): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }

  if (obj instanceof Array) {
    let jsonArray = []

    for (let element of obj) {
      let jsonObj = toJsonObj(element, options, alreadyConverted)
      jsonArray.push(jsonObj)
    }

    return jsonArray
  }

  options = options || {}
  options.converter = options.converter || {}

  if (! ('Date' in options.converter)) {
    options.converter['Date'] = (obj: Date, jsonObj: any) => {
      jsonObj.date = obj.toISOString()
    }
  }

  if ((! options || options && ! options.doNotUseCustomToJsonMethodOfFirstObject) && obj !== null) {
    if (typeof obj.toJsonObj == 'function') {
      return obj.toJsonObj(options)
    }
  }

  let recursionOptions = undefined
  if (options) {
    recursionOptions = {
      converter: options.converter,
      omitPrivateProperties: options.omitPrivateProperties,
      omitPrivatePropertiesAndUseGetMethodsInstead: options.omitPrivatePropertiesAndUseGetMethodsInstead,
      omitEmptyArrays: options.omitEmptyArrays,
      omitEmptyObjects: options.omitEmptyObjects,
      omitClassProperty: options.omitClassProperty
    }
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
    alreadyConverted.push(obj)

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
        let jsonArray = toJsonObj(propValue, recursionOptions, alreadyConverted)
        jsonObj[propName] = jsonArray
      }

      // if the value is an object it may have the 'toJsonObj' method
      else if (typeof propValue == 'object' && propValue !== null) {
        if (alreadyConverted.indexOf(propValue) == -1) {
          alreadyConverted.push(propValue)
          jsonObj[propName] = toJsonObj(propValue, recursionOptions, alreadyConverted)
        }
      }

      else if (typeof propValue == 'bigint') {
        jsonObj[propName] = {
          '@class': 'BigInt',
          value: propValue.toString()
        }
      }

      // otherwise just set it
      else {
        jsonObj[propName] = propValue
      }
    }
  }

  return jsonObj
}

export interface FillJsonObjOptions extends FromJsonObjOptions {
  include?: string[]
  exclude?: string[]
  doNotUseCustomToJsonMethodOfFirstObject?: boolean
}

export function fillJsonObj(obj: any, jsonObj: any, options?: FillJsonObjOptions): void {
  if (typeof obj != 'object' || obj === null) {
    return 
  }

  if (typeof jsonObj == 'string') {
    try {
      let parsed = JSON.parse(jsonObj)
      fillJsonObj(obj, parsed)
    }
    catch (e) {
      // if it is not a JSON string we can do nothing
      return
    }
  }

  // if the given value to fill with is not an object just do nothing
  if (typeof jsonObj != 'object') {
    return 
  }

  if (! options || options && ! options.doNotUseCustomToJsonMethodOfFirstObject) {
    if (typeof obj.fillJsonObj == 'function') {
      obj.fillJsonObj(jsonObj, options)
      return
    }
  }

  let recursionOptions = undefined
  if (options) {
    recursionOptions = {
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
    let fillValue = jsonObj[propName]

    if (typeof originalValue == 'object' && originalValue !== null 
        && typeof fillValue == 'object' && fillValue !== null) {
      fillJsonObj(originalValue, fillValue, recursionOptions)
    }
    else {
      if (typeof fillValue == 'object') {
        obj[propName] = fromJsonObj(fillValue, recursionOptions)
      }
      else {
        obj[propName] = fillValue
      }  
    }
  }
}

export interface FromJsonObjOptions {
  instantiator?: { [className: string]: () => any }
  converter?: { [className: string]: (jsonObj: any, options?: FromJsonObjOptions) => any }
}

export function fromJsonObj(jsonObj: any, options?: FromJsonObjOptions): any {
  if (typeof jsonObj == 'string') {
    try {
      let parsed = JSON.parse(jsonObj)
      return fromJsonObj(parsed, options)
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
      values.push(fromJsonObj(value, options))
    }

    return values
  }

  let obj

  options = options || {}
  options.converter = options.converter || {}
  
  if (! ('BigInt' in options.converter)) {
    options.converter['BigInt'] = (jsonObj: any) => {
      if (typeof jsonObj.value == 'number') {
        return BigInt(jsonObj.value)
      }

      if (typeof jsonObj.value == 'string') {
        try {
          return BigInt(jsonObj.value)
        }
        catch (e) {
          return jsonObj.value
        }
      }

      if (jsonObj.value === true) {
        return BigInt(1)
      }

      if (jsonObj.value === false) {
        return BigInt(0)
      }
      
      return jsonObj.value
    }
  }

  if (! ('Date' in options.converter)) {
    options.converter['Date'] = (jsonObj: any) => new Date(jsonObj.date)
  }

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

  if (typeof obj.fillJsonObj == 'function') {
    obj.fillJsonObj(jsonObj, options)
  }
  else {
    fillJsonObj(obj, jsonObj, options)
  }

  return obj
}

export function toJson(obj: any, options?: ToJsonOptions): string {
  return JSON.stringify(toJsonObj(obj, options))
}

export function fromJson(json: any, options?: FromJsonObjOptions): any {
  return fromJsonObj(JSON.parse(json), options)
}

export function fillJson(obj: any, json: any, options?: FillJsonObjOptions): void {
  fillJsonObj(obj, JSON.parse(json), options)
}