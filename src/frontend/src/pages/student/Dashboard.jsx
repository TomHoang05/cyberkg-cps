import { Routes, Route } from 'react-router-dom';
import AppHeader from '../../components/shared/AppHeader';
import StudentHome from './StudentHome';
import ScenarioExplorer from './ScenarioExplorer';
import GraphView from './GraphView';

export default function StudentDashboard() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <AppHeader />
      <main style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>
        <Routes>
          <Route index element={<StudentHome />} />
          <Route path="scenarios" element={<ScenarioExplorer />} />
          <Route path="graph/:attackId" element={<GraphView />} />
        </Routes>
      </main>
    </div>
  );
}
