import { useState } from "react";

export function useListEditor(initialValues: string[]) {
  const [values, setValues] = useState(initialValues);

  function update(index: number, value: string) {
    setValues((current) => current.map((item, itemIndex) => itemIndex === index ? value : item));
  }

  function add(value = "") {
    setValues((current) => [...current, value]);
  }

  function remove(index: number) {
    setValues((current) => current.length > 1 ? current.filter((_, itemIndex) => itemIndex !== index) : current);
  }

  function reset(nextValues = initialValues) {
    setValues(nextValues);
  }

  return { values, update, add, remove, reset };
}
