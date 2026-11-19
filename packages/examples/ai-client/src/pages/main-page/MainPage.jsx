import { useDirectRef } from "funcfunc-react/sigtree/hooks";
import { deref, reset } from "funcfunc/sigtree/core";
import { MessageList } from "../../features/message-list/MessageList";
import { useAddMessageItem } from "../../features/message-list/hooks";

export default function MainPage() {
  return <main>
    <MessageList />
    <MessageInput />
  </main>
}


function MessageInput() {
  const addMessageItem = useAddMessageItem();

  return <form onSubmit={(event) => {
    event.preventDefault();
    addMessageItem(deref(tmpAtom).value);
    reset(tmpAtom, { value: "" })
  }}>
    <input
      ref={useDirectRef(tmpAtom, { value: "value" })}
      type="text"
      onChange={({ target: { value } }) => reset(tmpAtom, { value })}
    />
    <button
      ref={useDirectRef(tmpAtom, { disabled: ({ value }) => value === "" })}
      type="submit"
    >
      送信
    </button>
  </form>
}
