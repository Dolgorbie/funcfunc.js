export function c(...names) {
  const acc = [];
  _c(acc, names);
  return acc.join(" ");
}


function _c(acc, names) {
  const { length } = names;
  for (let i = 0; i < length; ++i) {
    const name = names[i];
    if (name) {
      if (Array.isArray(name)) {
        _c(acc, name);
      } else {
        acc.push(name);
      }
    }
  }
}
