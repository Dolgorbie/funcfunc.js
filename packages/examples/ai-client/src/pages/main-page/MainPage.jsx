import { useAtom, usePathFocus, useValue } from "funcfunc-react/sigtree/hooks";
import { deref, reset, swap } from "funcfunc/sigtree/core";
import { useAppDb } from "../../features/app-db/app-db-hooks";

export default function MainPage() {
  return <main>
    <MessageList />
    <MessageInput />
  </main>
}

function MessageList() {
  const db = useAppDb();
  const idsNode = usePathFocus(["messages", "ids"], db);
  const ids = useValue(idsNode)
  return ids.map((key) => <p key={key}>{key}</p>)
}

function MessageInput() {
  const db = useAppDb();

  const tmpAtom = useAtom("");
  const value = useValue(tmpAtom);

  console.log(value)

  return <form onSubmit={(event) => {
    event.preventDefault();
    swap(db, (prev) => ({ ...prev, messages: { ...prev.messages, ids: [...prev.messages.ids, deref(tmpAtom)] } }));
    reset(tmpAtom, { value: "" })
  }}>
    <input type="text" value={value} onChange={({ target: { value } }) => reset(tmpAtom, value)} />
    <button type="submit">送信</button>
  </form>
}
