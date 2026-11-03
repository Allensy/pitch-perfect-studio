import { Button } from '@/components/ui/button';
import type { Runtime } from '@/domain/types';
import { Component, type ErrorInfo, type ReactNode } from 'react';

/** A render failure must stop the independent audio and microphone owners. */
export class StudioBoundary extends Component<
  { runtime: Runtime; children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch(_error: Error, _info: ErrorInfo) {
    this.props.runtime.stopAll();
  }
  render() {
    return this.state.error ? (
      <main className="error-page">
        <p className="eyebrow">Practice paused</p>
        <h1>Let’s reset the room.</h1>
        <p>The interface encountered an error. Audio and microphone input have been stopped.</p>
        <Button onClick={() => this.setState({ error: false })}>Try again</Button>
      </main>
    ) : (
      this.props.children
    );
  }
}
