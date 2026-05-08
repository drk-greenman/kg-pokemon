import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ProfileListPage } from './pages/ProfileListPage';
import { TeamBuilderPage } from './pages/TeamBuilderPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProfileListPage />} />
        <Route path="/profiles/:id" element={<TeamBuilderPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
