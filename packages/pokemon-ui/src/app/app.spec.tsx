import { render } from '@testing-library/react';
import App from './app';

vi.mock('./pages/ProfileListPage', () => ({
  ProfileListPage: () => <div>Profile List</div>,
}));

describe('App', () => {
  it('renders successfully', () => {
    const { baseElement } = render(<App />);
    expect(baseElement).toBeTruthy();
  });

  it('renders ProfileListPage at the root route', () => {
    const { getByText } = render(<App />);
    expect(getByText('Profile List')).toBeTruthy();
  });
});
