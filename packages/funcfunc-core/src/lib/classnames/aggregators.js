export function autoBem(names) {
  const { length } = names;
  if (length === 0) {
    return "";
  }
  const [block] = names;
  const acc = new Array(length);
  acc[0] = block;
  for (let i = 1; i < length; ++i) {
    const name = names[i];
    const isTarget = typeof name === "string" && name.match(/^(?:--|__)/);
    acc[i] = isTarget ? `${block}${name}` : name;
  }
  return acc.join(" ");
}

export { defaultAggregator as joinWithSpaces } from "./core";
