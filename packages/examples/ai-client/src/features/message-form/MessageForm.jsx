import { useAtom, useDirectRef } from "funcfunc-react/sigtree/hooks";
import { deref, reset } from "funcfunc/sigtree/core";
import { useAddMessageItem } from "../message-list/hooks";

export function MessageForm() {
  const addMessageItem = useAddMessageItem();

  const tmpAtom = useAtom({ value: "" });

  return <form onSubmit={(event) => {
    event.preventDefault();
    addMessageItem(deref(tmpAtom).value);
    reset(tmpAtom, { value: "" })
  }}>
    <textarea
      ref={useDirectRef(tmpAtom, {
        value: "value",
        rows: ({ value }) => Math.min((value.match(/\n/g) ?? []).length + 1, 10)
      })}
      onChange={({ target: { value } }) => reset(tmpAtom, { value })}
    />
    <button
      ref={useDirectRef(tmpAtom, { disabled: ({ value }) => value.trim() === "" })}
      type="submit"
    >
      送信
    </button>
  </form>
}
