import { use } from "react";
import { AppDbContext } from "./internal/context";

export function useAppDb() {
  const db = use(AppDbContext);

  if (db == null) {
    throw Error("expects inside of AppDbProvider");
  }

  return db;
}
