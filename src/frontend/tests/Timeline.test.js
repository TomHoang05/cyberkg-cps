import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import Timeline from '../src/components/viz/Timeline';

const MOCK_Q2 = {
  chain: [
    { step: 1, mitre_id: 'T1078', name: 'Valid Accounts',     tactic: 'initial-access', plane: 'cyber' },
    { step: 2, mitre_id: 'T1021', name: 'Remote Services',    tactic: 'lateral-movement', plane: 'bridge' },
    { step: 3, mitre_id: 'T0822', name: 'Remote File Copy',   tactic: 'lateral-movement', plane: 'physical' },
    { step: 4, mitre_id: 'T0813', name: 'Denial of Control',  tactic: 'inhibit-response', plane: 'physical' },
  ],
  bridge_mechanisms: [
    { bridge_id: 'BRG-VPN', name: 'VPN without MFA', bridge_type: 'authorized', purdue_from: 'L4', purdue_to: 'L3' },
  ],
};

describe('Timeline', () => {
  test('renders SVG element without crashing', () => {
    const { container } = render(<Timeline data={MOCK_Q2} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  test('renders when data is null (no crash)', () => {
    const { container } = render(<Timeline data={null} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  test('renders when chain is empty (no crash)', () => {
    const { container } = render(<Timeline data={{ chain: [], bridge_mechanisms: [] }} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  test('renders with bridge_mechanisms missing (no crash)', () => {
    const { container } = render(<Timeline data={{ chain: MOCK_Q2.chain }} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
