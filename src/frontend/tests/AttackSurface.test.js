import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import AttackSurface from '../src/components/viz/AttackSurface';

const MOCK_Q1 = {
  attack_id: 'colonial_pipeline_2021',
  nodes: [
    {
      id: 'TEC-T1078',
      type: 'ATT_CK_Technique',
      properties: {
        name: 'Valid Accounts',
        plane: 'cyber',
        purdue_level: 4,
        evidence_class: 'documented_fact',
      },
    },
    {
      id: 'ATK-COL-001',
      type: 'Attack',
      properties: { name: 'Colonial Pipeline 2021', plane: 'bridge', purdue_level: null },
    },
  ],
  edges: [
    { id: 'e1', source: 'ATK-COL-001', target: 'TEC-T1078', type: 'HAS_TECHNIQUE', properties: {} },
  ],
};

describe('AttackSurface', () => {
  test('renders SVG element without crashing', () => {
    const { container } = render(<AttackSurface data={MOCK_Q1} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  test('renders when data is null (no crash)', () => {
    const { container } = render(<AttackSurface data={null} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  test('renders when nodes array is empty (no crash)', () => {
    const { container } = render(<AttackSurface data={{ nodes: [], edges: [] }} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  test('calls onNodeClick prop when provided (no crash)', () => {
    const onClick = jest.fn();
    const { container } = render(<AttackSurface data={MOCK_Q1} onNodeClick={onClick} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
