import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import PurdueModel from '../src/components/viz/PurdueModel';

const MOCK_Q6 = {
  attack_id: 'colonial_pipeline_2021',
  levels: [
    {
      level: 4,
      label: 'L4 — Business/Enterprise IT',
      systems: [{ node_id: 'ITS-HIST', name: 'Historian Server', entity_type: 'ITSystem' }],
    },
    {
      level: 3,
      label: 'L3 — Site Operations',
      systems: [{ node_id: 'ITS-JMP', name: 'Jump Server', entity_type: 'ITSystem' }],
    },
    {
      level: 2,
      label: 'L2 — Control Systems',
      systems: [{ node_id: 'OTS-HMI', name: 'HMI Workstation', entity_type: 'OTSystem' }],
    },
  ],
  bridge: { bridge_id: 'BRG-VPN', name: 'VPN without MFA', bridge_type: 'authorized' },
};

describe('PurdueModel', () => {
  test('renders SVG element without crashing', () => {
    const { container } = render(<PurdueModel data={MOCK_Q6} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  test('renders when data is null (no crash)', () => {
    const { container } = render(<PurdueModel data={null} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  test('renders when levels is empty (no crash)', () => {
    const { container } = render(<PurdueModel data={{ levels: [], bridge: null }} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  test('renders without bridge data (no crash)', () => {
    const { container } = render(<PurdueModel data={{ levels: MOCK_Q6.levels }} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
