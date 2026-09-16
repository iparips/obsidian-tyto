// The panel subscribes for the life of a session; the plugin owns the list so
// the engine publishes without knowing the panel.
export class Listeners<T> {
  private readonly listeners: ((value: T) => void)[] = []

  subscribe(listenerFn: (value: T) => void): () => void {
    this.listeners.push(listenerFn)
    return () => this.listeners.splice(this.listeners.indexOf(listenerFn), 1)
  }

  publish(value: T): void {
    this.listeners.forEach((listenerFn) => listenerFn(value))
  }
}
