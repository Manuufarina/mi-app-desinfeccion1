import { render, screen } from '@testing-library/react';
import App from './App';

test('muestra la pantalla de carga al iniciar', () => {
  render(<App />);
  const loadingElement = screen.getByText(/cargando.../i);
  expect(loadingElement).toBeInTheDocument();
});
