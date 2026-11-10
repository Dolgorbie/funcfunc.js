import AppContextProvider from "./AppContextProvider";
import MainPage from "./pages/main-page/MainPage";

export default function App() {
  return <AppContextProvider>
    <MainPage />
  </AppContextProvider>;
}
