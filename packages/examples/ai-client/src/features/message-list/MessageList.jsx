import { useFocus, usePathFocus, useValue } from "funcfunc-react/sigtree/hooks";
import { memo } from "react";
import { useAppDb } from "../app-db/app-db-hooks";
import { messageListContentsLens, messageListIdsLens } from "./domain";

export function MessageList() {
  const db = useAppDb();
  const contentsAtom = useFocus(messageListContentsLens, db);
  const idsAtom = useFocus(messageListIdsLens, db);
  const ids = useValue(idsAtom);

  return <ul>{
    ids.map((id) => <MessageItem key={id} id={id} contentsAtom={contentsAtom} />)
  }</ul>
}

const MessageItem = memo(function MessageItem({ id, contentsAtom }) {
  const textAtom = usePathFocus([id, "text"], contentsAtom);
  const text = useValue(textAtom);

  return <li>{text}</li>
});
