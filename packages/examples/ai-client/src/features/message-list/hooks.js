import { update } from "funcfunc/lens";
import { swap } from "funcfunc/sigtree/core";
import { useCallback } from "react";
import { useAppDb } from "../app-db/app-db-hooks";
import { contentsLens, idsLens, messageListLens } from "./domain";

export function useAddMessageItem() {
  const db = useAppDb();

  return useCallback((text) => {
    const id = Math.floor(Math.random() * 32 ** 8).toString(32);

    swap(db, (prev) =>
      update(messageListLens, prev, (prev) =>
        update(idsLens, update(contentsLens, prev, (prev) => ({ ...prev, [id]: { text } })),
          (prev) => [...prev, id]),
      ));
  }, [db]);
}
