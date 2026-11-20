import { useUnsyncedValue } from "funcfunc-react/sigtree/hooks";
import { reset } from "funcfunc/sigtree/core";
import { createCx } from "../../lib/create-cx";
import styles from "./FlexibleTextarea.module.css";

const c = createCx(styles)

export function FlexibleTextarea({ valueAtom }) {
  const value = useUnsyncedValue(valueAtom);

  return <div className={c("container")}>
    <div className={c("dummy")}>{value}</div>
    <textarea className={c("textarea")} value={value} onChange={({ target: { value } }) => reset(valueAtom, value)} />
  </div>
}
