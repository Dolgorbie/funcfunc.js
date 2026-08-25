import { createContext, use, useMemo, useReducer, useState } from "react";

export function createFormHook(options) {
  const { name = "", form: Container = "form" } = options;

  const SetCtx = createContext();
  const GetCtx = createContext();

  const useForm = (formOptions) => {
    const { fields, props } = formOptions;

    const [Components] = useState(() => {
      function Form({ children }) {
        const [value, dispatch] = useReducer(_reduce, fields, _initReducer);

        return <SetCtx.Provider value={dispatch}>
          <GetCtx.Provider value={value}>{
            <Container {...props}>{children}</Container>
          }</GetCtx.Provider>
        </SetCtx.Provider>
      }
      Form.displayName = `${name}Form`;

      function Field({ name, render, children }) {
        const value = use(GetCtx);
        const dispatch = use(SetCtx);

        const Comp = render ?? children;
        return useMemo(() => <Comp name={name} value={value[name]} />, [Comp, name, value[name]]);
      };
      Field.displayName = `${name}Field`;

      return { Form, Field };
    });

    return Components;
  };

  return useForm;
}


function _reduce(prev, event) {
  const { target } = event;
  const { name, value, checked } = target;
  const prevValue = prev[name];

  if (typeof prevValue === "boolean") {
    return prevValue === checked ? prev : { ...prev, [name]: checked };
  }

  if (Array.isArray(prevValue)) {
    const includes = prevValue.includes(value);
    if (checked && includes || !checked && !includes) {
      return prev;
    }
    return { ...prev, [name]: checked ? [...prevValue, value] : prevValue.filter((x) => !Object.is(x, value)) };
  }

  return Object.is(prevValue, value) ? prev : { ...prev, [name]: value };
}

function _initReducer(fields) {
  return Object.fromEntries(Object.keys(fields).map((key) => [key, fields[key].value]));
}


// const useForm = createFormHook({ name: "Some", form: "form" });

// function SomeForm() {
//   const { Form, Field } = useForm(() => ({
//     fields: {
//       foo: {
//         value: "",
//         onChange: validateOnChange,
//         onBlur: validateOnBlur,
//       },
//       bar: {
//         value: 123,
//         onChange: validateOnChange,
//       },
//     },
//     props: {
//       onSubmit: (event, values, errors) => { }
//     }
//   }));

//   return <Form>
//     <Field name="foo">{
//       (props) => {
//         return <input {...props} />
//       }
//     }</Field>
//   </Form>
// }
