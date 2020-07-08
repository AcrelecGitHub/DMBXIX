
interface Object {
  hasSet(properties: string): boolean;
}


Object.prototype.hasSet = function(paramsChain: string): boolean {
  // we will use the dump variable to iterate in the object
  let dump: any;
  const props = paramsChain.split('.');
  const propsLength = props.length - 1;
  const object = this;
  // loop in the properties
  for (let i = 0; i < props.length; i++) {
    // first prop?
    if (i === 0) {
        // add the object to dump (object.props1)
        dump = object[props[i]];
        continue;
    }

    // Undefined? return false
    if (typeof dump === 'undefined' || typeof dump[props[i]] === 'undefined') {
        return false;
    } else {
        // move in the object level
        // object.props1.props2
        // object.props1.props2.props3
        dump = dump[props[i]];
        // return true, of even return the object back
        if (i === propsLength) {
            return true;
        }
    }
  }
  return true;
};

// Object.defineProperty(Object.prototype, 'hasSet', {
//   value: function(object: any, paramsChain: string) {
//     let dump: any;
//     const props = paramsChain.split('.');
//     const propsLength = props.length - 1;
//     //const object = this;
//     // loop in the properties
//     for (let i = 0; i < props.length; i++) {
//       // first prop?
//       if (i === 0) {
//         // add the object to dump (object.props1)
//         dump = object[props[i]];
//         continue;
//       }

//       // Undefined? return false
//       if (typeof dump === 'undefined' || typeof dump[props[i]] === 'undefined') {
//         return false;
//       } else {
//         // move in the object level
//         // object.props1.props2
//         // object.props1.props2.props3
//         dump = dump[props[i]];
//         // return true, of even return the object back
//         if (i === propsLength) {
//           return true;
//         }
//       }
//     }
//   },
//   enumerable : false
// });
