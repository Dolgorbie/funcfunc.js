import { useFocus, useValue } from "funcfunc-react/sigtree/hooks";
import { path } from "funcfunc/lens";
import { memo, useMemo } from "react";
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
  const contentAtom = useFocus(useMemo(() => path([id, "text"]), [id, contentsAtom]), db);
  const text = useValue(contentAtom);

  return <li>{text}</li>
});
