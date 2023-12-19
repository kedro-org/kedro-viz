import React from 'react';
import { createRoot } from 'react-dom/client';
import KedroViz from './components/container';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<KedroViz />);
