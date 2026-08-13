import { Routes, Route } from 'react-router-dom';
import AppHeader from '../../components/shared/AppHeader';
import AttackBrowser from './AttackBrowser';
import GraphExplorer from './GraphExplorer';
import ExportSettings from './ExportSettings';
import InstructorHome from './InstructorHome';
import LabBuilder from './LabBuilder';
import AssessmentBuilder from './AssessmentBuilder';
import CompareAttacks from './CompareAttacks';
import ModuleMap from './ModuleMap';
import Roadmap from './Roadmap';

export default function InstructorDashboard() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <AppHeader />
      <main style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>
        <Routes>
          <Route index element={<InstructorHome />} />
          <Route path="browse" element={<AttackBrowser />} />
          <Route path="explore/:attackId" element={<GraphExplorer />} />
          <Route path="export" element={<ExportSettings />} />
          <Route path="lab" element={<LabBuilder />} />
          <Route path="assess" element={<AssessmentBuilder />} />
          <Route path="compare" element={<CompareAttacks />} />
          <Route path="modules" element={<ModuleMap />} />
          <Route path="roadmap" element={<Roadmap />} />
        </Routes>
      </main>
    </div>
  );
}
