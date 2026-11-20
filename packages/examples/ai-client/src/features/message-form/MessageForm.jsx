import { useAtom, useDirectRef, usePathFocus } from "funcfunc-react/sigtree/hooks";
import { deref, reset } from "funcfunc/sigtree/core";
import { FlexibleTextarea } from "../../components/flexible-textarea/FlexibleTextarea";
import { useAddMessageItem } from "../message-list/hooks";

export function MessageForm() {
  const addMessageItem = useAddMessageItem();

  const tmpAtom = useAtom({ value: "" });

  return <form onSubmit={(event) => {
    event.preventDefault();
    addMessageItem(deref(tmpAtom).value);
    reset(tmpAtom, { value: "" })
  }}>
    <FlexibleTextarea valueAtom={usePathFocus(["value"], tmpAtom)} />
    <button
      ref={useDirectRef(tmpAtom, { disabled: ({ value }) => value.trim() === "" })}
      type="submit"
    >
      送信
    </button>
  </form>
}
