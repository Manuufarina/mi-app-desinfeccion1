import { render, screen } from '@testing-library/react';
import HomePage from './components/pages/HomePage';

jest.mock('./hooks/useAuth', () => ({
  useAuth: () => ({ currentUser: { uid: 'test', isAnonymous: true }, isAuthReady: true })
}));

jest.mock('./hooks/useSnackbar', () => ({
  useSnackbar: () => ({ snackbar: { open: false, message: '', severity: 'info' }, showSnackbar: jest.fn(), handleCloseSnackbar: jest.fn() })
}));

jest.mock('@mui/material/useMediaQuery', () => {
  return () => false;
});

jest.mock('./services/firestoreService', () => ({
  handleUpdateValorMetroCubico: jest.fn(),
  fetchInitialConfig: jest.fn(() => () => {}),
  fetchAllVehicles: jest.fn(() => () => {}),
  handleRegisterVehicle: jest.fn(),
  handleUpdateVehicle: jest.fn(),
  handleSelectVehicleForDetail: jest.fn(),
  handleAddDisinfection: jest.fn(),
  handleDeleteVehicle: jest.fn(),
  handleUpdateDisinfection: jest.fn(),
  handleDeleteDisinfection: jest.fn()
}));

beforeAll(() => {
  window.matchMedia = window.matchMedia || function() {
    return {
      matches: false,
      media: '',
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn()
    };
  };
});

test('renders main heading', () => {
  render(<HomePage navigate={() => {}} />);
  const heading = screen.getByText(/Sistema de Control de Desinfección Vehicular/i);
  expect(heading).toBeInTheDocument();
});
