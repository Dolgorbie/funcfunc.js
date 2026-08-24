import { createContext, use, useMemo, useState } from "react";

export function createFormHook(options) {
  const { name = "", form: Container = "form" } = options;

  const SetCtx = createContext();
  const GetCtx = createContext();

  const useForm = (formOptions) => {
    const { fields, props } = formOptions;

    const [Components] = useState(() => {
      function Form({ children }) {
        const [value, setValue] = useState();

        return <SetCtx.Provider value={setValue}>
          <GetCtx.Provider value={value}>{
            <Container {...props}>{children}</Container>
          }</GetCtx.Provider>
        </SetCtx.Provider>
      }
      Form.displayName = `${name}Form`;

      function Field({ name, render, children }) {
        const Comp = render ?? children;
        const value = use(GetCtx);
        return useMemo(() => <Comp name={name} value={value[name]} />, [Comp, name, value[name]]);
      };
      Field.displayName = `${name}Field`;

      return { Form, Field };
    });

    return Components;
  };

  return useForm;
}


const useForm = createFormHook({ name: "Some", form: "form" });

function SomeForm() {
  const { Form, Field } = useForm(() => ({
    fields: {
      foo: {
        value: "",
        onChange: validateOnChange,
        onBlur: validateOnBlur,
      },
      bar: {
        value: 123,
        onChange: validateOnChange,
      },
    },
    props: {
      onSubmit: (event, values, errors) => { }
    }
  }));

  return <Form>
    <Field name="foo">{
      (props) => {
        return <input {...props} />
      }
    }</Field>
  </Form>
}
