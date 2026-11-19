import { useAtom, useDirectRef } from "funcfunc-react/sigtree/hooks";
import { update } from "funcfunc/lens";
import { deref, reset, swap } from "funcfunc/sigtree/core";
import { useAppDb } from "../../features/app-db/app-db-hooks";
import { MessageList } from "../../features/message-list/MessageList";
import { messageListLens } from "../../features/message-list/data";

export default function MainPage() {
  return <main>
    <MessageList />
    <MessageInput />
  </main>
}


function MessageInput() {
  const db = useAppDb();

  const tmpAtom = useAtom({ value: "" });
  const inputRef = useDirectRef(tmpAtom, { value: "value" })
  const buttonRef = useDirectRef(tmpAtom, { disabled: ({ value }) => value === "" });

  return <form onSubmit={(event) => {
    event.preventDefault();

    const id = Math.floor(Math.random() * 32 ** 5).toString(32);

    swap(db, (prev) => update(messageListLens, prev, (prev) => ({
      contents: { ...prev.contents, [id]: { text: deref(tmpAtom).value } },
      ids: [...prev.ids, id]
    })));
    reset(tmpAtom, { value: "" })
  }}>
    <input ref={inputRef} type="text" onChange={({ target: { value } }) => reset(tmpAtom, { value })} />
    <button ref={buttonRef} type="submit">送信</button>
  </form>
}
