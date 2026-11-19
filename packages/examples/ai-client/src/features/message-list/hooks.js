import { idlens, update } from "funcfunc/lens";
import { useCallback } from "react";
import { useAppDb } from "../app-db/app-db-hooks";
import { contentsLens, messageListLens } from "./domain";

export function useAddMessageItem() {
  const db = useAppDb();

  return useCallback((text) => {
    const id = Math.floor(Math.random() * 32 ** 5).toString(32);
    console.debug("message id:", id);

    swap(db, (prev) => update(messageListLens, prev, (prev) => ({
      ...update(contentsLens, prev, (prev) => ({ ...prev, [id]: { text } })),
      ...update(idlens, prev, (prev) => [...prev, id]),
    })));
  }, [db]);
}
