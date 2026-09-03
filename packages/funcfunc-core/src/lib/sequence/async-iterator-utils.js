import { DStackQueue } from "../queue/double-stack-queue";

export async function* createAyncIter(builder) {
  const valueBuffer = new DStackQueue();
  const contBuffer = new DStackQueue();

  const resolve = (value) => {
    valueBuffer.push(value);
  };
  builder(resolve);

  for (; ;) {
    yield await new Promise((resolve) => {
      contBuffer.push(resolve);

      if (valueBuffer.size > 0) {
        (valueBuffer.pop());
        return;
      }
    });
  }
}


createAyncIter((resolve) => {
  setInterval(resolve, 1000);
});