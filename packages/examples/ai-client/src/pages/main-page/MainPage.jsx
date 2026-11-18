import { useAtom, useDirectRef, useFocus, useValue } from "funcfunc-react/sigtree/hooks";
import { path, update } from "funcfunc/lens";
import { deref, reset, swap } from "funcfunc/sigtree/core";
import { useAppDb } from "../../features/app-db/app-db-hooks";

const messageIdsLens = path(["messages", "ids"]);

export default function MainPage() {
  return <main>
    <MessageList />
    <MessageInput />
  </main>
}

function MessageList() {
  const db = useAppDb();
  const idsNode = useFocus(messageIdsLens, db);
  const ids = useValue(idsNode)
  return ids.map((key) => <p key={key}>{key}</p>)
}

function MessageInput() {
  const db = useAppDb();

  const tmpAtom = useAtom({ value: "" });
  const inputRef = useDirectRef(tmpAtom, { value: "value" })
  const buttonRef = useDirectRef(tmpAtom, { disabled: ({ value }) => value === "" });

  return <form onSubmit={(event) => {
    event.preventDefault();
    swap(db, (prev) => update(messageIdsLens, prev, (ids) => [...ids, deref(tmpAtom).value]));
    reset(tmpAtom, { value: "" })
  }}>
    <input ref={inputRef} type="text" onChange={({ target: { value } }) => reset(tmpAtom, { value })} />
    <button ref={buttonRef} type="submit">送信</button>
  </form>
}
