import { render, screen } from '@testing-library/react';
import App from './App';

test('renders main heading', () => {
  render(<App />);
  const heading = screen.getByText(/Control de Desinfección Vehicular/i);
  expect(heading).toBeInTheDocument();
});
