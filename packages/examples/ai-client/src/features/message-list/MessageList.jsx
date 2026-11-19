import { useDirectRef, useFocus, useValue } from "funcfunc-react/sigtree/hooks";
import { chain, idlens, path } from "funcfunc/lens";
import { memo, useMemo } from "react";
import { useAppDb } from "../app-db/app-db-hooks";
import { messageListContentsLens, messageListIdsLens } from "./data";

export function MessageList() {
  const db = useAppDb();
  const idsAtom = useFocus(messageListIdsLens, db);
  const ids = useValue(idsAtom);

  return <ul>{
    ids.map((id) => <MessageItem key={id} id={id} />)
  }</ul>
}

const MessageItem = memo(function MessageItem({ id }) {
  console.log("render")
  const db = useAppDb();
  const lns = useMemo(() => chain([messageListContentsLens, path([id, "text"])]), [id]);
  const contentAtom = useFocus(lns, db);
  const ref = useDirectRef(contentAtom, { children: idlens });

  return <li ref={ref} />
});
