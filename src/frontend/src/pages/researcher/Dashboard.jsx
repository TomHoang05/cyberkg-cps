import { Routes, Route } from 'react-router-dom';
import AppHeader from '../../components/shared/AppHeader';
import ResearcherHome from './ResearcherHome';
import QueryConsole from './QueryConsole';
import EntityExplorer from './EntityExplorer';
import RelationAnalysis from './RelationAnalysis';
import ProvenanceExport from './ProvenanceExport';

export default function ResearcherDashboard() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <AppHeader />
      <main style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>
        <Routes>
          <Route index element={<ResearcherHome />} />
          <Route path="query" element={<QueryConsole />} />
          <Route path="entities" element={<EntityExplorer />} />
          <Route path="relations" element={<RelationAnalysis />} />
          <Route path="provenance" element={<ProvenanceExport />} />
        </Routes>
      </main>
    </div>
  );
}
