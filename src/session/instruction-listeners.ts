// The panel subscribes for the life of a session; the plugin owns the list so
// the engine reports a chain without knowing the panel.
export class InstructionListeners {
  private readonly listeners: ((text: string) => void)[] = []

  subscribe(listener: (text: string) => void): () => void {
    this.listeners.push(listener)
    return () => this.listeners.splice(this.listeners.indexOf(listener), 1)
  }

  publish(text: string): void {
    this.listeners.forEach((listener) => listener(text))
  }
}
