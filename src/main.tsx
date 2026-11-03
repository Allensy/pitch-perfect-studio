import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { createRuntime } from './runtime';
import './styles.css';
const element = document.getElementById('root');
if (!element) throw new Error('Pitch Perfect Studio could not find its application root.');
const runtime = createRuntime();
runtime.attach();
const root = createRoot(element);
root.render(
  <StrictMode>
    <App runtime={runtime} />
  </StrictMode>,
);
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    root.unmount();
    runtime.dispose();
  });
