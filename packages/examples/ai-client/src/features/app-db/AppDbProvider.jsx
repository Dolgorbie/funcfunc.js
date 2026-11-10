import { useAtom } from "funcfunc-react/sigtree/hooks";
import { AppDbContext } from "./internal/context";

const INITIAL_DB = {
  messages: {
    contents: {},
    ids: []
  },
  toasts: [],
};

export default function AppDbProvider({ children }) {
  const db = useAtom(INITIAL_DB);
  return <AppDbContext value={db}>{children}</AppDbContext>
}
