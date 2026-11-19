import { useAtom } from "funcfunc-react/sigtree/hooks";
import { INITIAL_MESSAGE_LIST } from "../message-list/data";
import { AppDbContext } from "./internal/context";

const INITIAL_DB = {
  ...INITIAL_MESSAGE_LIST,
  toasts: [],
};

export default function AppDbProvider({ children }) {
  const db = useAtom(INITIAL_DB);
  return <AppDbContext value={db}>{children}</AppDbContext>
}
