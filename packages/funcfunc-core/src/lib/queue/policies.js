export const infinite = {
  onOverflow(value, queue) {
    queue.extend(queue.capacity * 2);
    return queue.tryAdd(value);
  },

  onUnderflow(queue) {

  },
};
