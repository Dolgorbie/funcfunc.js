import AppDbProvider from "./features/app-db/AppDbProvider";

const PROVIDERS = [AppDbProvider];

export default function AppContextProvider({ children }) {
  return PROVIDERS.reduceRight((children, Provider) => <Provider>{children}</Provider>, children);
}
