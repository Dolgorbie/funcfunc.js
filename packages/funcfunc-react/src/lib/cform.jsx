import { createContext, memo, use, useMemo, useReducer, useState } from "react";

export function createFormHook(options) {
  const { name = "", form: Container = "form" } = options;

  const SetCtx = createContext();
  const GetCtx = createContext();
  const SetErrorCtx = createContext();
  const GetErrorCtx = createContext();

  const useForm = () => {
    const [Components] = useState(() => {
      const Form = memo(({ fields, children, ...props }) => {
        const [value, dispatch] = useReducer(_reduce, fields, _initReduce);
        const [errors, dispatchError] = useReducer(_reduceError, fields, _initErrorReduce);

        return <SetErrorCtx.Provider value={dispatchError}>
          <GetErrorCtx.Provider value={errors}>
            <SetCtx.Provider value={dispatch}>
              <GetCtx.Provider value={value}>{
                <Container {...props}>{children}</Container>
              }</GetCtx.Provider>
            </SetCtx.Provider>
          </GetErrorCtx.Provider>
        </SetErrorCtx.Provider>
      });
      Form.displayName = `${name}Form`;

      function Field({ name, render, children }) {
        const value = use(GetCtx);
        const dispatch = use(SetCtx);
        const errors = use(GetErrorCtx);
        const dispatchError = use(SetErrorCtx);

        const Comp = render ?? children;
        return useMemo(() => <Comp name={name} value={value[name]} />, [Comp, name, value[name], errors[name]]);
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

function _initReduce(fields) {
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
