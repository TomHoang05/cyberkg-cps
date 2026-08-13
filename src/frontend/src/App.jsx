import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RoleProvider } from './contexts/RoleContext';
import RoleSelection from './pages/RoleSelection';
import InstructorDashboard from './pages/instructor/Dashboard';
import StudentDashboard from './pages/student/Dashboard';
import ResearcherDashboard from './pages/researcher/Dashboard';

export default function App() {
  return (
    <RoleProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"              element={<RoleSelection />} />
          <Route path="/instructor/*"  element={<InstructorDashboard />} />
          <Route path="/student/*"     element={<StudentDashboard />} />
          <Route path="/researcher/*"  element={<ResearcherDashboard />} />
          <Route path="*"              element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </RoleProvider>
  );
}
