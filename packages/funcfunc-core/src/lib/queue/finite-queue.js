import { toUInt } from "../asfunc";
import { InfQueue } from "./inf-queue";

export class FiniteQueue extends InfQueue {
  constructor(capacity) {
    super();
    this._capacity = toUInt(capacity);
  }

  get capacity() {
    return this._capacity;
  }

  add(value) {
    if (this.size >= this._capacity) {
      return false;
    }
    return super.add(value);
  }
}
