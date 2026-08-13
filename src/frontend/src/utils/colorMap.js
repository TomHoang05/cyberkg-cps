/**
 * Canonical plane → color mapping — CYB-08 §2.2 design tokens.
 * Sprint 4 v1.30 QA resync: ai=#8B5CF6 (violet), bridge=#00C9A7 (teal).
 * Never hardcode these hex values in JSX; always import from here.
 */
export const PLANE_COLOR = {
  cyber:    '#3B82F6',  // blue-500
  physical: '#F59E0B',  // amber-500
  ai:       '#8B5CF6',  // violet-500  (was wrongly #00C9A7 in some older files)
  human:    '#EC4899',  // pink-500
  bridge:   '#00C9A7',  // teal        (was wrongly #EF4444 in older tokens)
  cross:    '#6B7280',  // gray-500
  default:  '#9CA3AF',  // gray-400
};

/** Return fill color for a graph node based on its plane property. */
export const nodeColor = (node) =>
  PLANE_COLOR[(node.properties?.plane || '').toLowerCase()] || PLANE_COLOR.default;

/**
 * Canonical entity type → plane mapping.
 * Matches backend/src/api/models/responses.py EntityType enum values (real Neo4j labels).
 */
export const PLANE_BY_ENTITY_TYPE = {
  Attack:                'cyber',
  ATT_CK_Technique:      'cyber',
  Vulnerability:         'cyber',
  Weakness:              'cyber',
  Attack_Pattern:        'cyber',
  IT_System:             'cyber',
  OT_System:             'physical',
  Network_Zone:          'physical',
  Physical_Process:      'physical',
  Consequence:           'physical',
  Bridge_Mechanism:      'physical',
  AI_Component:          'ai',
  AI_Attack_Surface:     'ai',
  Human_Actor:           'human',
  Human_Action:          'human',
  Instructional_Concept: 'cross',
  Question:              'cross',
};

/**
 * Purdue level → SVG Y position (CYB-08 Q6 wireframe).
 * AUDIT-FIXED: level 5 was missing — any L5 node fell to null/mid fallback.
 * L5 = near top (70), L0 = near bottom (470), null → middle (350).
 */
export const PURDUE_Y = {
  5: 70,
  4: 150,
  3: 230,
  2: 310,
  1: 390,
  0: 470,
  null: 350,
};

export const getPurdueY = (level) =>
  PURDUE_Y[level] ?? PURDUE_Y[null];
