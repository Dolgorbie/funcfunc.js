export class AbstractQueue {
  constructor(policy = null) {
    this.policy = policy;
  }

  isFull() {
    return this.filled === this.capacity;
  }

  isEmpty() {
    return this.size === 0;
  }

  add(value) {
    const res = this.tryAdd(value);
    if (!res) {
      const { policy } = this;
      if (policy && typeof policy.onOverflow === "function") {
        return policy.onOverflow(value, this);
      }
    }
    return res;
  }

  pop() {
    const res = this.tryPop();
    if (!res.success) {
      const { policy } = this;
      if (policy && typeof policy.onUnderflow === "function") {
        return policy.onUnderflow(this);
      }
    }
    return res;
  }
}
