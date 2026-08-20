import { createContext, use, useMemo, useState } from "react";

export function createForm(options) {
  const { container: Container = "form" } = options;
  const valueCtx = createContext();
  const setterCtx = createContext();

  const useForm = (formOptions) => {

    const Form = (props) => {
      const [value, setValue] = useState();

      return <setterCtx.Provider value={setValue}>
        <valueCtx.Provider value={value}>{
          <Container {...props} />
        }</valueCtx.Provider>
      </setterCtx.Provider>;
    };

    const Field = ({ name, render, children }) => {
      const Comp = render ?? children;
      const value = use(valueCtx);
      return useMemo(() => <Comp name={name} value={value[name]} />, [Comp, name, value[name]]);
    };

    return { Form, Field };
  };

  return useForm;
}
