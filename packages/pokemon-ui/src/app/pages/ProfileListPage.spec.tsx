import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProfileListPage } from './ProfileListPage';
import * as profilesApi from '../api/profiles';

vi.mock('../api/profiles');

const mockProfiles = [
  { id: 1, name: 'Ash' },
  { id: 2, name: 'Misty' },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <ProfileListPage />
    </MemoryRouter>
  );
}

describe('ProfileListPage', () => {
  beforeEach(() => {
    vi.mocked(profilesApi.getProfiles).mockResolvedValue(mockProfiles);
  });

  it('renders profiles returned by the API', async () => {
    renderPage();
    expect(await screen.findByText('Ash')).toBeTruthy();
    expect(screen.getByText('Misty')).toBeTruthy();
  });

  it('opens the dialog when "+ New Profile" is clicked', async () => {
    renderPage();
    await screen.findByText('Ash');
    fireEvent.click(screen.getByText('+ New Profile'));
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('appends the new profile to the list after successful creation', async () => {
    vi.mocked(profilesApi.createProfile).mockResolvedValue({ id: 3, name: 'Brock' });
    renderPage();
    await screen.findByText('Ash');
    fireEvent.click(screen.getByText('+ New Profile'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Brock' } });
    fireEvent.click(screen.getByRole('button', { name: /create/i }));
    await waitFor(() => expect(screen.getByText('Brock')).toBeTruthy());
  });

  it('shows a loading indicator while fetching', () => {
    vi.mocked(profilesApi.getProfiles).mockReturnValue(new Promise(() => undefined));
    renderPage();
    expect(screen.getByRole('progressbar')).toBeTruthy();
  });

  it('shows an error alert when the fetch fails', async () => {
    vi.mocked(profilesApi.getProfiles).mockRejectedValue(new Error('Network error'));
    renderPage();
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByText(/something went wrong/i)).toBeTruthy();
  });
});
