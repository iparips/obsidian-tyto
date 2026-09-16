// The panel subscribes for the life of a session; the plugin owns the list so
// the engine reports a chain without knowing the panel.
export class InstructionListeners {
  private readonly listeners: ((text: string) => void)[] = []

  subscribe(listenerFn: (text: string) => void): () => void {
    this.listeners.push(listenerFn)
    return () => this.listeners.splice(this.listeners.indexOf(listenerFn), 1)
  }

  publish(text: string): void {
    this.listeners.forEach((listenerFn) => listenerFn(text))
  }
}
