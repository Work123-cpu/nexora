export function makeIdFactory(prefix: string) {
  let counter = 0
  return function nextId(): string {
    counter += 1
    return `${prefix}-${String(counter).padStart(4, '0')}`
  }
}
