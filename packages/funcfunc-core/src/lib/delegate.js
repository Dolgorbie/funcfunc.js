export function delegate(principalClass, agentName, methodNames) {
  const { length } = methodNames;
  for (let i = 0; i < length; ++i) {
    const nameI = methodNames[i];
    if (nameI == null) {
      continue;
    }

    switch (typeof nameI) {
      case "number":
      case "string":
      case "symbol": {
        principalClass.prototype[nameI] = function (...args) {
          return this[agentName][nameI](...args);
        }
        break;
      }
      case "object": {
        const fromNameArray = Object.keys(nameI)
        const nFromNames = fromNameArray.length;
        for (let j = 0; j < nFromNames; ++j) {
          const fromName = fromNameArray[j];
          const toName = nameI[fromName];
          principalClass.prototype[fromName] = function (...args) {
            return this[agentName][toName](...args);
          }
        }
        break;
      }
      default: {
        throw Error("unsupported name type.");
      }
    }
  }
}
