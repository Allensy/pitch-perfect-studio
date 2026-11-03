import * as Tabs from '@radix-ui/react-tabs';
import { modes } from './navigation';

export function ModeNavigation() {
  return (
    <Tabs.List className="mode-nav" aria-label="Training modes">
      {modes.map((mode) => (
        <Tabs.Trigger key={mode.id} value={mode.id} className="mode-button">
          <mode.icon className="mode-icon" strokeWidth={1.75} aria-hidden="true" />
          <span>{mode.label}</span>
        </Tabs.Trigger>
      ))}
    </Tabs.List>
  );
}
