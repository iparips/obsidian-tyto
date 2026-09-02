// The panel subscribes for the life of a session; the plugin owns the list so
// the engine publishes without knowing the panel.
export class Listeners<T> {
  private readonly listeners: ((value: T) => void)[] = []

  subscribe(listener: (value: T) => void): () => void {
    this.listeners.push(listener)
    return () => this.listeners.splice(this.listeners.indexOf(listener), 1)
  }

  publish(value: T): void {
    this.listeners.forEach((listener) => listener(value))
  }
}
