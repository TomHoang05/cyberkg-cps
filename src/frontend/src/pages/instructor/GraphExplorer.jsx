import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAttackData } from '../../hooks/useAttackData';
import AttackSurface, { ENT_COLOR, ENT_LABEL } from '../../components/viz/AttackSurface';
import Timeline from '../../components/viz/Timeline';
import PurdueModel from '../../components/viz/PurdueModel';
import DownloadDossierButton from '../../components/shared/DownloadDossierButton';
import { toTimelineChain } from '../../utils/graphTransform';

// ═══════════════════════════════════════════════════════════════════
// STATIC DATA — mirrors CYB-19 v6 HTML VIZ_DATA + VIZ_INTERP exactly
// ═══════════════════════════════════════════════════════════════════

const VIZ_DATA = {
  colonial_pipeline_2021: {
    name: 'Colonial Pipeline',
    purdue: [
      { level: 5,   label: 'L5 Corporate',    systems: [] },
      { level: 4,   label: 'L4 Enterprise',   systems: [{ n: 'Active Directory', p: 'cyber' }, { n: 'VPN Gateway', p: 'cyber', bridge: true }, { n: 'Email Server', p: 'cyber' }] },
      { level: 3.5, label: 'L3.5 DMZ',        systems: [{ n: 'Firewall', p: 'cyber' }, { n: 'Jump Server', p: 'cyber' }] },
      { level: 3,   label: 'L3 Site',         systems: [{ n: 'SCADA Servers', p: 'cyber' }, { n: 'HMI Workstations', p: 'cyber' }, { n: 'Billing Systems', p: 'cyber' }] },
      { level: 2,   label: 'L2 Supervisory',  systems: [{ n: 'OT Network (Shutdown)', p: 'physical' }] },
      { level: 1,   label: 'L1 Control',      systems: [] },
      { level: 0,   label: 'L0 Field',        systems: [] },
    ],
    bridgeRow: 1, bridgeLabel: 'Authorized VPN Bridge (T0822)',
  },
  triton_2017: {
    name: 'TRITON / TRISIS',
    purdue: [
      { level: 5,   label: 'L5 Corporate',    systems: [] },
      { level: 4,   label: 'L4 Enterprise',   systems: [{ n: 'Enterprise IT', p: 'cyber' }, { n: 'Email Server', p: 'cyber' }] },
      { level: 3.5, label: 'L3.5 DMZ',        systems: [] },
      { level: 3,   label: 'L3 Site',         systems: [{ n: 'Eng.WS (IT side)', p: 'cyber' }] },
      { level: 2,   label: 'L2 Supervisory',  systems: [{ n: 'Eng.WS (OT side)', p: 'cyber', bridge: true }] },
      { level: 1,   label: 'L1 Control',      systems: [{ n: 'Triconex SIS', p: 'physical' }] },
      { level: 0,   label: 'L0 Field',        systems: [] },
    ],
    bridgeRow: 4, bridgeLabel: 'Unauthorized — Dual-Homed WS (T0864)',
  },
  german_steel_mill_2014: {
    name: 'German Steel Mill',
    purdue: [
      { level: 5,   label: 'L5 Corporate',    systems: [] },
      { level: 4,   label: 'L4 Enterprise',   systems: [{ n: 'Office Network', p: 'cyber' }, { n: 'Employee PC', p: 'cyber' }] },
      { level: 3.5, label: 'L3.5 DMZ',        systems: [{ n: '⚠ No DMZ (flat)', p: 'cyber', bridge: true }] },
      { level: 3,   label: 'L3 Site',         systems: [{ n: 'SCADA Network', p: 'physical' }] },
      { level: 2,   label: 'L2 Supervisory',  systems: [{ n: 'HMI/Control', p: 'physical' }] },
      { level: 1,   label: 'L1 Control',      systems: [{ n: 'Blast Furnace PLC', p: 'physical' }] },
      { level: 0,   label: 'L0 Field',        systems: [{ n: 'Blast Furnace (dmg)', p: 'physical' }] },
    ],
    bridgeRow: 2, bridgeLabel: 'Structural Exposure — Flat Network',
  },
  stuxnet_2010: {
    name: 'Stuxnet',
    purdue: [
      { level: 5,   label: 'L5 Corporate',    systems: [] },
      { level: 4,   label: 'L4 Enterprise',   systems: [{ n: 'Windows WS', p: 'cyber' }] },
      { level: 3.5, label: 'L3.5 DMZ',        systems: [] },
      { level: 3,   label: 'L3 Site',         systems: [{ n: 'Contractor WS (USB)', p: 'cyber' }, { n: 'Windows Network', p: 'cyber' }] },
      { level: 2,   label: 'L2 Supervisory',  systems: [{ n: 'Step 7 Eng.WS', p: 'cyber', bridge: true }, { n: 'SCADA HMI (DoV)', p: 'physical' }] },
      { level: 1,   label: 'L1 Control',      systems: [{ n: 'S7-315 PLC', p: 'physical' }, { n: 'S7-417 PLC', p: 'physical' }] },
      { level: 0,   label: 'L0 Field',        systems: [{ n: 'IR-1 Centrifuge (~1000)', p: 'physical' }] },
    ],
    bridgeRow: 4, bridgeLabel: 'Air-Gap Bypass — USB → Step 7 WS (T0847)',
  },
};

// ATT&CK technique per Purdue level per attack
const PURDUE_TECH = {
  colonial_pipeline_2021: {
    4:   [{ id: 'T1078', name: 'Valid Accounts (VPN)' }],
    3.5: [{ id: 'T1021', name: 'Remote Services' }],
    3:   [{ id: 'T1059', name: 'Command Scripting' }, { id: 'T1486', name: 'Data Encrypted' }],
  },
  triton_2017: {
    4:   [{ id: 'T1566', name: 'Phishing' }],
    3:   [{ id: 'T0886', name: 'Remote Services ICS' }, { id: 'T0822', name: 'External Remote Services' }],
    2:   [{ id: 'T0864', name: 'Transient Cyber Asset' }],
    1:   [{ id: 'T0880', name: 'Safety Logic Manipulation' }],
  },
  german_steel_mill_2014: {
    4:   [{ id: 'T1566', name: 'Phishing' }],
    3.5: [{ id: 'STRUCT', name: 'Flat Network' }],
    3:   [{ id: 'T0873', name: 'PLC Modification' }],
    2:   [{ id: 'T0831', name: 'Manipulation of Control' }],
    1:   [{ id: 'T0831', name: 'Manipulation of Control' }],
  },
  stuxnet_2010: {
    4:   [{ id: 'T1091', name: 'Removable Media' }],
    3:   [{ id: 'T1543', name: 'System Process' }, { id: 'T1055', name: 'Process Injection' }],
    2:   [{ id: 'T0847', name: 'Air-Gap Bypass' }, { id: 'T0832', name: 'Manipulation of View' }],
    1:   [{ id: 'T0873', name: 'Project File Infection' }],
    0:   [{ id: 'T0831', name: 'Manipulation of Control' }],
  },
};

const VIZ_INTERP = {
  colonial_pipeline_2021: {
    bridgeType: 'Authorized Bridge',
    bridgeNote: '<b>Mechanism (T0822):</b> VPN credential theft via phishing. The attacker used <i>legitimate</i> credentials — no new network path was created. Defining characteristic of financially-motivated ransomware: exploit authorized paths rather than engineering new ones. Detection difficulty: HIGH (traffic looks legitimate).',
  },
  triton_2017: {
    bridgeType: 'Unauthorized Bridge',
    bridgeNote: '<b>Mechanism (T0864):</b> Dual-homed engineering workstation — a single host with simultaneous IT and OT network connections. Not designed as a gateway, making it an Unauthorized Bridge. Nation-state actors identified and exploited this single architectural failure after an estimated 2-year dwell period.',
  },
  german_steel_mill_2014: {
    bridgeType: 'Structural Exposure',
    bridgeNote: '<b>Mechanism (Structural Exposure):</b> Flat network architecture — no DMZ, no segmentation between IT office and OT production networks. The attacker moved directly from a spearphished PC to blast furnace control. No specialized bridge needed because the bridge was built into the flat infrastructure itself.',
  },
  stuxnet_2010: {
    bridgeType: 'Air-Gap Bypass',
    bridgeNote: '<b>Mechanism (T0847):</b> USB drop exploiting 4 Windows zero-day vulnerabilities. The Natanz facility was air-gapped (no internet). Stuxnet crossed via infected USB drives carried by contractors, propagated via Windows network, then crossed to S7-315/417 PLCs via Siemens Step 7 software. Unprecedented multi-stage air-gap defeat.',
  },
};

// Q3 — Four-linked-layers: cyber → bridge → physical → consequence
// Fix 0.2: adds layer_2_bridge (was entirely absent in the previous flat-table view)
const Q3_DATA = {
  colonial_pipeline_2021: {
    classification: 'Indirect Disruption', badgeColor: '#F59E0B',
    note: 'Attack did NOT touch OT control logic. Ransomware on IT triggered a precautionary OT shutdown. Physical disruption = operator decision, not attacker command. Distinguishes Colonial from Stuxnet (direct) and TRITON (safety suppression).',
    layer_1_cyber: [
      { technique_id: 'T1078', name: 'Valid Accounts', tactic: 'initial-access', plane: 'cyber' },
      { technique_id: 'T1021', name: 'Remote Services', tactic: 'lateral-movement', plane: 'cyber' },
      { technique_id: 'T0822', name: 'External Remote Services', tactic: 'initial-access', plane: 'bridge' },
      { technique_id: 'T1486', name: 'Data Encrypted for Impact', tactic: 'impact', plane: 'cyber' },
    ],
    layer_2_bridge: [
      { bridge_id: 'BRG-VPN', name: 'Authorized VPN Bridge (T0822)', bridge_type: 'authorized', purdue_from: 'L4', purdue_to: 'L2' },
    ],
    layer_3_physical: [
      { system_name: 'Pipeline OT Control Network', process_name: 'Fuel delivery (5,500 mi)', purdue_level: 2 },
    ],
    layer_4_consequence: [
      { consequence_id: 'CONS-SHUT', name: '5,500-mile Pipeline Shutdown', severity: 'Critical (national)', was_realized: true, consequence_type: 'Indirect Disruption', duration: '6 days' },
      { consequence_id: 'CONS-FIN',  name: '$4.4M Ransom Payment',        severity: 'High',               was_realized: true, consequence_type: 'Financial',           duration: 'One-time' },
    ],
  },
  triton_2017: {
    classification: 'Safety Suppression', badgeColor: '#EF4444',
    note: 'Only known attack explicitly targeting a Safety Instrumented System (SIS) — the last physical defense layer. TRITON did not destroy equipment directly; it attempted to disable the system designed to prevent catastrophic process failures. If fully successful, a subsequent process attack could have caused loss of life.',
    layer_1_cyber: [
      { technique_id: 'T1566', name: 'Phishing', tactic: 'initial-access', plane: 'cyber' },
      { technique_id: 'T0886', name: 'Remote Services (ICS)', tactic: 'lateral-movement', plane: 'cyber' },
      { technique_id: 'T0864', name: 'Transient Cyber Asset', tactic: 'initial-access', plane: 'bridge' },
      { technique_id: 'T0880', name: 'Safety Logic Manipulation', tactic: 'inhibit-response-function', plane: 'physical' },
    ],
    layer_2_bridge: [
      { bridge_id: 'BRG-DH', name: 'Dual-Homed Engineering Workstation', bridge_type: 'unauthorized', purdue_from: 'L3', purdue_to: 'L1' },
    ],
    layer_3_physical: [
      { system_name: 'Triconex Safety Instrumented System', process_name: 'Petrochemical process safety', purdue_level: 1 },
    ],
    layer_4_consequence: [
      { consequence_id: 'CONS-SAF',  name: 'Safety System Disabled', severity: 'Critical (potential)', was_realized: false, consequence_type: 'Safety Suppression', duration: 'Prevented by bug' },
      { consequence_id: 'CONS-TRIP', name: 'Accidental Process Trip (TRITON bug)', severity: 'High', was_realized: true, consequence_type: 'Operational Disruption', duration: '~hours' },
    ],
  },
  german_steel_mill_2014: {
    classification: 'Direct Manipulation', badgeColor: '#FF6B35',
    note: 'Attacker directly manipulated blast furnace control systems. One of the first publicly confirmed cases of a cyberattack causing physical damage to industrial infrastructure. OT systems were directly compromised — not a precautionary shutdown.',
    layer_1_cyber: [
      { technique_id: 'T1566', name: 'Phishing', tactic: 'initial-access', plane: 'cyber' },
      { technique_id: 'T0873', name: 'Project File Infection', tactic: 'persistence', plane: 'physical' },
      { technique_id: 'T0831', name: 'Manipulation of Control', tactic: 'impair-process-control', plane: 'physical' },
    ],
    layer_2_bridge: [
      { bridge_id: 'BRG-FLAT', name: 'Flat Network (Structural Exposure — no DMZ)', bridge_type: 'structural', purdue_from: 'L4', purdue_to: 'L2' },
    ],
    layer_3_physical: [
      { system_name: 'Blast Furnace PLC Controller', process_name: 'Steel furnace operation', purdue_level: 1 },
      { system_name: 'SCADA Control System', process_name: 'Industrial control', purdue_level: 2 },
    ],
    layer_4_consequence: [
      { consequence_id: 'CONS-DMG', name: 'Blast Furnace Physical Damage', severity: 'Critical', was_realized: true, consequence_type: 'Direct Manipulation', duration: 'Months (repair)' },
    ],
  },
  stuxnet_2010: {
    classification: 'Direct Manip. + DoV', badgeColor: '#8B5CF6',
    note: 'Dual payload: (1) PLC logic rewrite — centrifuges commanded to destructive over-speed while reporting normal to Step 7; (2) HMI/SCADA replay — operators fed pre-recorded normal sensor data. Human oversight fully neutralized for ~18 months.',
    layer_1_cyber: [
      { technique_id: 'T1091', name: 'Replication Through Removable Media', tactic: 'initial-access', plane: 'cyber' },
      { technique_id: 'T1543', name: 'Create/Modify System Process (rootkit)', tactic: 'persistence', plane: 'cyber' },
      { technique_id: 'T1055', name: 'Process Injection (Step 7 DLL)', tactic: 'defense-evasion', plane: 'cyber' },
      { technique_id: 'T0847', name: 'Removable Media (air-gap bypass)', tactic: 'lateral-movement', plane: 'bridge' },
      { technique_id: 'T0873', name: 'Project File Infection (PLC)', tactic: 'persistence', plane: 'physical' },
      { technique_id: 'T0831', name: 'Manipulation of Control', tactic: 'impair-process-control', plane: 'physical' },
      { technique_id: 'T0832', name: 'Manipulation of View (SCADA replay)', tactic: 'impair-process-control', plane: 'physical' },
    ],
    layer_2_bridge: [
      { bridge_id: 'BRG-USB', name: 'USB Air-Gap Bypass → Siemens Step 7 WS (T0847)', bridge_type: 'air_gap', purdue_from: 'L4', purdue_to: 'L0' },
    ],
    layer_3_physical: [
      { system_name: 'Siemens S7-315/S7-417 PLCs', process_name: 'IR-1 centrifuge frequency control', purdue_level: 1 },
      { system_name: 'WinCC HMI (operator console)', process_name: 'SCADA display (replay)', purdue_level: 2 },
    ],
    layer_4_consequence: [
      { consequence_id: 'CONS-CENT', name: '~1,000 IR-1 Centrifuges Destroyed (−30% capacity)', severity: 'Critical', was_realized: true, consequence_type: 'Direct Manipulation',   duration: '~18 months' },
      { consequence_id: 'CONS-DECP', name: 'Operator Deception — 18 months no alarms',         severity: 'High',     was_realized: true, consequence_type: 'Denial of View',        duration: '~18 months' },
    ],
  },
};

// Q4 — AI Plane + Human Plane + AI Attack Surfaces + Decision Points
// Fix 0.1: added ai_attack_surfaces and decision_points blocks
const Q4_DATA = {
  colonial_pipeline_2021: {
    ai: 'No documented AI involvement (2021). V1 scenario: AI-based anomaly detection on VPN traffic could have flagged unusual lateral movement and credential access patterns before ransomware deployed.',
    human: {
      action: 'Operations manager shutdown OT pipeline proactively — the direct cause of physical disruption.',
      roleType: 'Decision-Maker under uncertainty.',
      lesson: 'Human risk aversion translates cyber compromise into physical consequence.',
    },
    ai_attack_surfaces: [
      { surface_id: 'AIS-PI', name: 'Indirect Prompt Injection', surface_type: 'adversarial', table1_category: 'AI Attack Surface', mitre_atlas_id: 'AML.T0052',
        description: 'Attacker embeds malicious instructions in data processed by an AI assistant (e.g., SCADA log summary). AI executes attacker instructions without awareness.' },
      { surface_id: 'AIS-DT', name: 'Domain Transfer / Distribution Shift', surface_type: 'resilience', table1_category: 'AI Resilience',
        description: 'AI trained on IT traffic fails to generalize to Modbus/DNP3 OT protocol patterns — misses anomalies specific to industrial control traffic.', evidence_class: 'instructional_extension' },
      { surface_id: 'AIS-EP', name: 'Error Propagation / Cascading Failure', surface_type: 'resilience', table1_category: 'AI Resilience',
        description: 'Small AI perception error (anomaly score 2% above threshold) amplified through feedback loop into false-positive alert storm, causing operator to disable the IDS.', evidence_class: 'instructional_extension' },
    ],
    decision_points: [
      { action_id: 'ACT-COL-DEC', description: 'Operations manager decides to proactively shut down 5,500-mile pipeline to prevent potential OT spread — indirect physical disruption.', action_type: 'decision' },
    ],
  },
  triton_2017: {
    ai: 'No documented AI involvement (2017). V1 scenario: AI-based behavioral anomaly detection on TriStation protocol traffic could have flagged unauthorized programming commands issued to the SIS from the dual-homed engineering workstation.',
    human: {
      action: "Plant engineer noticed an unexpected SIS safe-state trip — the only event that exposed TRITON's presence.",
      roleType: 'Inadvertent Defender (accident-dependent detection).',
      lesson: "The attack was discovered only due to a bug in the attacker's own malware — not proactive human detection.",
    },
    ai_attack_surfaces: [
      { surface_id: 'AIS-PI', name: 'Indirect Prompt Injection', surface_type: 'adversarial', table1_category: 'AI Attack Surface', mitre_atlas_id: 'AML.T0052',
        description: 'Attacker embeds prompt in SIS error log summary processed by LLM monitoring assistant → AI reports "no anomalies" while TRITON runs.' },
      { surface_id: 'AIS-PP', name: 'Physical Perturbation', surface_type: 'adversarial', table1_category: 'AI Attack Surface',
        description: 'Manipulation of TriStation protocol sensor readings fed to an AI-based process anomaly detector, causing it to classify dangerous SIS states as normal.' },
    ],
    decision_points: [],
  },
  german_steel_mill_2014: {
    ai: 'No documented AI involvement (2014). V1 scenario: AI-based process monitoring on furnace temperature and pressure sensors could have detected anomalous control commands deviating from normal production parameters.',
    human: {
      action: 'Control operators lost ability to safely shut down the blast furnace after attacker overrode safety interlocks.',
      roleType: 'Victim — operators had no independent override capability.',
      lesson: 'Physical backstops independent of digital control are essential when human operators are the last line of defense.',
    },
    ai_attack_surfaces: [
      { surface_id: 'AIS-PP', name: 'Physical Perturbation', surface_type: 'adversarial', table1_category: 'AI Attack Surface',
        description: 'Attacker spoofs furnace temperature and pressure sensors fed to AI quality-control model. AI misclassifies dangerous overheating as normal production state.' },
    ],
    decision_points: [],
  },
  stuxnet_2010: {
    ai: 'No documented AI involvement (2010). V1 scenario: ML-based anomaly detection on centrifuge vibration and operational data could have flagged the speed deviation pattern even while PLC outputs reported normal — providing an independent monitoring channel.',
    human: {
      action: 'Operators monitored SCADA dashboards showing normal readings for ~18 months while physical destruction occurred.',
      roleType: 'Neutralized Defender (Denial of View).',
      lesson: 'Human oversight is only as good as the data layer beneath it. When sensor feeds are compromised (T0832), operators cannot detect what they cannot see.',
    },
    ai_attack_surfaces: [
      { surface_id: 'AIS-PP', name: 'Physical Perturbation', surface_type: 'adversarial', table1_category: 'AI Attack Surface',
        description: 'Stuxnet replays 21s of pre-recorded normal sensor readings to WinCC SCADA. AI frequency detector receives only the replayed 1,064 Hz — within training distribution → outputs NORMAL. (T0832)' },
      { surface_id: 'AIS-DT', name: 'Domain Transfer / Distribution Shift', surface_type: 'resilience', table1_category: 'AI Resilience',
        description: 'Hypothetical LSTM detector (AIC-STX) trained on normal centrifuge IT traffic fails to generalize to OT protocol behavior — misses anomalous S7 command patterns.', evidence_class: 'instructional_extension' },
    ],
    decision_points: [],
  },
};

// ═══════════════════════════════════════════════════════════════════
// KG_DATA — Static graph data for Q1 surface (mirrors CYB-19 v6 HTML exactly)
// ═══════════════════════════════════════════════════════════════════

const KG_DATA = {
  colonial: {
    nodes: [
      { id: 'COL-2021',   label: 'CPS_Attack',       name: 'Colonial Pipeline Attack',            year: '2021', sector: 'energy',   bridge_type: 'Authorized VPN',             consequence_type: 'Indirect Disruption' },
      { id: 'ITS-VPN',    label: 'ITSystem',          name: 'External VPN Portal',                 zone: 'dmz',         purdue_level: 4 },
      { id: 'ITS-JMP',    label: 'ITSystem',          name: 'IT Jump Server',                      zone: 'enterprise',  purdue_level: 3 },
      { id: 'ITS-CORP',   label: 'ITSystem',          name: 'Corporate IT Network',                zone: 'enterprise',  purdue_level: 3 },
      { id: 'BRG-VPN',    label: 'Bridge',            name: 'Authorized VPN Bridge',               bridge_type: 'authorized', purdue_from: 'L3', purdue_to: 'L2' },
      { id: 'OTS-PIPE',   label: 'OTSystem',          name: 'Pipeline OT Control Network',         zone: 'control',     purdue_level: 2 },
      { id: 'PHY-FUEL',   label: 'PhysicalSystem',    name: 'Fuel Delivery Infrastructure',        purdue_level: 0 },
      { id: 'T1078',      label: 'ATT_CK_Technique',  name: 'Valid Accounts',                      tactic: 'initial-access',    plane: 'cyber',  step_order: 1 },
      { id: 'T1021',      label: 'ATT_CK_Technique',  name: 'Remote Services',                     tactic: 'lateral-movement',  plane: 'cyber',  step_order: 2 },
      { id: 'T0822',      label: 'ATT_CK_Technique',  name: 'External Remote Services',            tactic: 'initial-access',    plane: 'bridge', step_order: 3 },
      { id: 'T1059',      label: 'ATT_CK_Technique',  name: 'Command & Scripting Interpreter',     tactic: 'execution',         plane: 'cyber',  step_order: 4 },
      { id: 'T1486',      label: 'ATT_CK_Technique',  name: 'Data Encrypted for Impact',           tactic: 'impact',            plane: 'cyber',  step_order: 5 },
      { id: 'HA-OPS',     label: 'Human_Actor',       name: 'Operations Manager',                  role_type: 'decision-maker', plane: 'human' },
      { id: 'HACT-SHUT',  label: 'Human_Action',      name: 'Proactive OT Shutdown',               decision_type: 'precautionary', plane: 'human' },
      { id: 'CONS-SHUT',  label: 'Consequence',       name: '5,500-mile Pipeline Shutdown',        severity: 'critical', duration: '6 days' },
      { id: 'CONS-FIN',   label: 'Consequence',       name: '$4.4M Ransom Payment',               severity: 'high' },
      { id: 'NZ-DMZ',     label: 'NetworkZone',       name: 'DMZ / Internet Zone',                 zone_type: 'dmz' },
      { id: 'NZ-OT',      label: 'NetworkZone',       name: 'OT Control Zone',                     zone_type: 'control' },
    ],
    edges: [
      { source: 'COL-2021',  target: 'T1078',     type: 'USES_TECHNIQUE' },
      { source: 'COL-2021',  target: 'T1021',     type: 'USES_TECHNIQUE' },
      { source: 'COL-2021',  target: 'T0822',     type: 'USES_TECHNIQUE' },
      { source: 'COL-2021',  target: 'T1059',     type: 'USES_TECHNIQUE' },
      { source: 'COL-2021',  target: 'T1486',     type: 'USES_TECHNIQUE' },
      { source: 'T1078',     target: 'T1021',     type: 'TECHNIQUE_ORDER' },
      { source: 'T1021',     target: 'T0822',     type: 'TECHNIQUE_ORDER' },
      { source: 'T0822',     target: 'T1059',     type: 'TECHNIQUE_ORDER' },
      { source: 'T1059',     target: 'T1486',     type: 'TECHNIQUE_ORDER' },
      { source: 'T1078',     target: 'ITS-VPN',   type: 'EXPLOITS' },
      { source: 'T0822',     target: 'ITS-VPN',   type: 'EXPLOITS' },
      { source: 'T1021',     target: 'ITS-JMP',   type: 'COMPROMISES' },
      { source: 'T1021',     target: 'ITS-CORP',  type: 'COMPROMISES' },
      { source: 'T1486',     target: 'ITS-CORP',  type: 'COMPROMISES' },
      { source: 'T0822',     target: 'BRG-VPN',   type: 'TRAVERSES' },
      { source: 'BRG-VPN',   target: 'OTS-PIPE',  type: 'CROSSES_INTO' },
      { source: 'COL-2021',  target: 'BRG-VPN',   type: 'INVOLVES' },
      { source: 'COL-2021',  target: 'CONS-SHUT', type: 'CAUSES_CONSEQUENCE' },
      { source: 'COL-2021',  target: 'CONS-FIN',  type: 'CAUSES_CONSEQUENCE' },
      { source: 'COL-2021',  target: 'HA-OPS',    type: 'INVOLVES' },
      { source: 'HA-OPS',    target: 'HACT-SHUT', type: 'PERFORMS' },
      { source: 'HACT-SHUT', target: 'OTS-PIPE',  type: 'AFFECTS' },
      { source: 'HACT-SHUT', target: 'CONS-SHUT', type: 'CAUSES' },
      { source: 'OTS-PIPE',  target: 'PHY-FUEL',  type: 'IMPACTS' },
      { source: 'NZ-DMZ',    target: 'ITS-VPN',   type: 'CONTAINS' },
      { source: 'NZ-OT',     target: 'OTS-PIPE',  type: 'CONTAINS' },
      { source: 'NZ-DMZ',    target: 'NZ-OT',     type: 'TRANSITIONS_TO' },
      { source: 'COL-2021',  target: 'NZ-DMZ',    type: 'HAS_ZONE' },
      { source: 'COL-2021',  target: 'NZ-OT',     type: 'HAS_ZONE' },
      { source: 'ITS-JMP',   target: 'ITS-CORP',  type: 'CONNECTS' },
    ],
  },
  triton: {
    nodes: [
      { id: 'TRI-2017',    label: 'CPS_Attack',      name: 'TRITON / TRISIS Attack',                year: '2017', sector: 'energy',        bridge_type: 'Unauthorized (dual-homed WS)', consequence_type: 'Safety Suppression' },
      { id: 'ITS-CORP',    label: 'ITSystem',         name: 'Corporate IT Network',                  zone: 'enterprise', purdue_level: 4 },
      { id: 'ITS-EWS',     label: 'ITSystem',         name: 'Engineering Workstation (IT side)',      zone: 'enterprise', purdue_level: 3 },
      { id: 'BRG-DH',      label: 'Bridge',           name: 'Dual-Homed Engineering WS',             bridge_type: 'unauthorized', purdue_from: 'L3', purdue_to: 'L1' },
      { id: 'OTS-SIS',     label: 'OTSystem',         name: 'Safety Instrumented System (Triconex)', zone: 'sis',     purdue_level: 1 },
      { id: 'OTS-HMI',     label: 'OTSystem',         name: 'Engineering HMI / TriStation',          zone: 'control', purdue_level: 2 },
      { id: 'PHY-PROC',    label: 'PhysicalSystem',   name: 'Petrochemical Process',                 purdue_level: 0 },
      { id: 'T1566',       label: 'ATT_CK_Technique', name: 'Phishing',                              tactic: 'initial-access',          plane: 'cyber',    step_order: 1 },
      { id: 'T0886',       label: 'ATT_CK_Technique', name: 'Remote Services (ICS)',                 tactic: 'lateral-movement',        plane: 'cyber',    step_order: 2 },
      { id: 'T0822',       label: 'ATT_CK_Technique', name: 'External Remote Services',              tactic: 'initial-access',          plane: 'bridge',   step_order: 3 },
      { id: 'T0864',       label: 'ATT_CK_Technique', name: 'Transient Cyber Asset',                 tactic: 'initial-access',          plane: 'bridge',   step_order: 4 },
      { id: 'T0880',       label: 'ATT_CK_Technique', name: 'Safety Logic Manipulation',             tactic: 'inhibit-response-function', plane: 'physical', step_order: 5 },
      { id: 'T0857',       label: 'ATT_CK_Technique', name: 'System Firmware (TRITON payload)',      tactic: 'persistence',             plane: 'physical', step_order: 6 },
      { id: 'HA-ENG',      label: 'Human_Actor',      name: 'Plant Engineer',                        role_type: 'technician', plane: 'human' },
      { id: 'HACT-MAINT',  label: 'Human_Action',     name: 'Routine WS Maintenance',                decision_type: 'routine', plane: 'human' },
      { id: 'CONS-SAF',    label: 'Consequence',      name: 'Safety System Disabled',                severity: 'critical' },
      { id: 'CONS-TRIP',   label: 'Consequence',      name: 'Accidental Process Trip (TRITON bug)',  severity: 'high' },
      { id: 'NZ-CORP',     label: 'NetworkZone',      name: 'Corporate Network',                     zone_type: 'enterprise' },
      { id: 'NZ-CTRL',     label: 'NetworkZone',      name: 'Control Network Zone',                  zone_type: 'control' },
      { id: 'NZ-SIS',      label: 'NetworkZone',      name: 'SIS Network Zone',                      zone_type: 'sis' },
    ],
    edges: [
      { source: 'TRI-2017',   target: 'T1566',      type: 'USES_TECHNIQUE' },
      { source: 'TRI-2017',   target: 'T0886',      type: 'USES_TECHNIQUE' },
      { source: 'TRI-2017',   target: 'T0822',      type: 'USES_TECHNIQUE' },
      { source: 'TRI-2017',   target: 'T0864',      type: 'USES_TECHNIQUE' },
      { source: 'TRI-2017',   target: 'T0880',      type: 'USES_TECHNIQUE' },
      { source: 'TRI-2017',   target: 'T0857',      type: 'USES_TECHNIQUE' },
      { source: 'T1566',      target: 'T0886',      type: 'TECHNIQUE_ORDER' },
      { source: 'T0886',      target: 'T0822',      type: 'TECHNIQUE_ORDER' },
      { source: 'T0822',      target: 'T0864',      type: 'TECHNIQUE_ORDER' },
      { source: 'T0864',      target: 'T0880',      type: 'TECHNIQUE_ORDER' },
      { source: 'T0880',      target: 'T0857',      type: 'TECHNIQUE_ORDER' },
      { source: 'T1566',      target: 'ITS-CORP',   type: 'COMPROMISES' },
      { source: 'T0886',      target: 'ITS-EWS',    type: 'COMPROMISES' },
      { source: 'T0864',      target: 'BRG-DH',     type: 'EXPLOITS' },
      { source: 'T0880',      target: 'OTS-SIS',    type: 'COMPROMISES' },
      { source: 'T0857',      target: 'OTS-SIS',    type: 'COMPROMISES' },
      { source: 'BRG-DH',     target: 'OTS-SIS',    type: 'CROSSES_INTO' },
      { source: 'TRI-2017',   target: 'BRG-DH',     type: 'INVOLVES' },
      { source: 'TRI-2017',   target: 'HA-ENG',     type: 'INVOLVES' },
      { source: 'TRI-2017',   target: 'CONS-SAF',   type: 'CAUSES_CONSEQUENCE' },
      { source: 'TRI-2017',   target: 'CONS-TRIP',  type: 'CAUSES_CONSEQUENCE' },
      { source: 'HA-ENG',     target: 'HACT-MAINT', type: 'PERFORMS' },
      { source: 'HACT-MAINT', target: 'BRG-DH',     type: 'ENABLES' },
      { source: 'OTS-SIS',    target: 'PHY-PROC',   type: 'IMPACTS' },
      { source: 'OTS-HMI',    target: 'OTS-SIS',    type: 'CONNECTS' },
      { source: 'NZ-CORP',    target: 'ITS-CORP',   type: 'CONTAINS' },
      { source: 'NZ-CORP',    target: 'ITS-EWS',    type: 'CONTAINS' },
      { source: 'NZ-CTRL',    target: 'OTS-HMI',    type: 'CONTAINS' },
      { source: 'NZ-SIS',     target: 'OTS-SIS',    type: 'CONTAINS' },
      { source: 'NZ-CORP',    target: 'NZ-CTRL',    type: 'TRANSITIONS_TO' },
      { source: 'NZ-CTRL',    target: 'NZ-SIS',     type: 'TRANSITIONS_TO' },
      { source: 'TRI-2017',   target: 'NZ-CORP',    type: 'HAS_ZONE' },
      { source: 'TRI-2017',   target: 'NZ-SIS',     type: 'HAS_ZONE' },
      { source: 'T0886',      target: 'OTS-HMI',    type: 'COMPROMISES' },
      { source: 'T0822',      target: 'ITS-EWS',    type: 'EXPLOITS' },
      { source: 'CONS-SAF',   target: 'PHY-PROC',   type: 'AFFECTS' },
      { source: 'T0880',      target: 'CONS-SAF',   type: 'CAUSES' },
      { source: 'TRI-2017',   target: 'NZ-CTRL',    type: 'HAS_ZONE' },
      { source: 'BRG-DH',     target: 'NZ-SIS',     type: 'CONNECTS' },
    ],
  },
  steel: {
    nodes: [
      { id: 'GSM-2014',   label: 'CPS_Attack',      name: 'German Steel Mill Attack',          year: '2014', sector: 'manufacturing', bridge_type: 'Structural Exposure (flat network)', consequence_type: 'Direct Manipulation' },
      { id: 'ITS-CORP',   label: 'ITSystem',         name: 'Office IT Network',                 zone: 'enterprise', purdue_level: 4 },
      { id: 'ITS-WS',     label: 'ITSystem',         name: 'Phished Office Workstation',        zone: 'enterprise', purdue_level: 3 },
      { id: 'BRG-FLAT',   label: 'Bridge',           name: 'Flat Network (Structural Exposure)', bridge_type: 'structural', purdue_from: 'L3', purdue_to: 'L2' },
      { id: 'OTS-SCADA',  label: 'OTSystem',         name: 'SCADA Control System',              zone: 'control', purdue_level: 2 },
      { id: 'OTS-HMI',    label: 'OTSystem',         name: 'HMI Workstation',                   zone: 'control', purdue_level: 2 },
      { id: 'OTS-PLC',    label: 'OTSystem',         name: 'Furnace PLC Controller',            zone: 'field',   purdue_level: 1 },
      { id: 'PHY-FURN',   label: 'PhysicalSystem',   name: 'Blast Furnace',                     purdue_level: 0 },
      { id: 'T1566',      label: 'ATT_CK_Technique', name: 'Phishing',                          tactic: 'initial-access',       plane: 'cyber',    step_order: 1 },
      { id: 'T0873',      label: 'ATT_CK_Technique', name: 'Project File Infection',            tactic: 'persistence',          plane: 'physical', step_order: 2 },
      { id: 'T0831',      label: 'ATT_CK_Technique', name: 'Manipulation of Control',           tactic: 'impair-process-control', plane: 'physical', step_order: 3 },
      { id: 'T0832',      label: 'ATT_CK_Technique', name: 'Manipulation of View',              tactic: 'impair-process-control', plane: 'physical', step_order: 4 },
      { id: 'CONS-DMG',   label: 'Consequence',      name: 'Blast Furnace Physical Damage',     severity: 'critical' },
      { id: 'NZ-CORP',    label: 'NetworkZone',      name: 'Office Network (flat)',              zone_type: 'enterprise' },
      { id: 'NZ-OT',      label: 'NetworkZone',      name: 'OT Network (flat, no DMZ)',         zone_type: 'control' },
    ],
    edges: [
      { source: 'GSM-2014',  target: 'T1566',     type: 'USES_TECHNIQUE' },
      { source: 'GSM-2014',  target: 'T0873',     type: 'USES_TECHNIQUE' },
      { source: 'GSM-2014',  target: 'T0831',     type: 'USES_TECHNIQUE' },
      { source: 'GSM-2014',  target: 'T0832',     type: 'USES_TECHNIQUE' },
      { source: 'T1566',     target: 'T0873',     type: 'TECHNIQUE_ORDER' },
      { source: 'T0873',     target: 'T0831',     type: 'TECHNIQUE_ORDER' },
      { source: 'T0873',     target: 'T0832',     type: 'TECHNIQUE_ORDER' },
      { source: 'T1566',     target: 'ITS-WS',    type: 'COMPROMISES' },
      { source: 'T1566',     target: 'ITS-CORP',  type: 'COMPROMISES' },
      { source: 'T0873',     target: 'BRG-FLAT',  type: 'TRAVERSES' },
      { source: 'BRG-FLAT',  target: 'OTS-SCADA', type: 'CROSSES_INTO' },
      { source: 'T0831',     target: 'OTS-SCADA', type: 'EXPLOITS' },
      { source: 'T0831',     target: 'OTS-PLC',   type: 'EXPLOITS' },
      { source: 'T0832',     target: 'OTS-HMI',   type: 'EXPLOITS' },
      { source: 'GSM-2014',  target: 'BRG-FLAT',  type: 'INVOLVES' },
      { source: 'GSM-2014',  target: 'CONS-DMG',  type: 'CAUSES_CONSEQUENCE' },
      { source: 'OTS-SCADA', target: 'PHY-FURN',  type: 'IMPACTS' },
      { source: 'OTS-PLC',   target: 'PHY-FURN',  type: 'IMPACTS' },
      { source: 'NZ-CORP',   target: 'ITS-CORP',  type: 'CONTAINS' },
      { source: 'NZ-CORP',   target: 'ITS-WS',    type: 'CONTAINS' },
      { source: 'NZ-OT',     target: 'OTS-SCADA', type: 'CONTAINS' },
      { source: 'NZ-OT',     target: 'OTS-HMI',   type: 'CONTAINS' },
      { source: 'NZ-OT',     target: 'OTS-PLC',   type: 'CONTAINS' },
      { source: 'NZ-CORP',   target: 'NZ-OT',     type: 'TRANSITIONS_TO' },
      { source: 'GSM-2014',  target: 'NZ-CORP',   type: 'HAS_ZONE' },
      { source: 'GSM-2014',  target: 'NZ-OT',     type: 'HAS_ZONE' },
      { source: 'ITS-CORP',  target: 'OTS-SCADA', type: 'CONNECTS' },
    ],
  },
  stuxnet: {
    nodes: [
      { id: 'STX-2010',       label: 'CPS_Attack',      name: 'Stuxnet Attack (Natanz 2010)',               year: '2010', sector: 'nuclear', bridge_type: 'Air-Gap Bypass (USB)', consequence_type: 'Direct Manipulation + Denial of View' },
      { id: 'ITS-WIN',        label: 'ITSystem',         name: 'Windows Workstations (infected)',           zone: 'enterprise', purdue_level: 4 },
      { id: 'ITS-S7WS',       label: 'ITSystem',         name: 'Siemens Step 7 Engineering WS',            zone: 'control',    purdue_level: 3 },
      { id: 'ITS-WNCC',       label: 'ITSystem',         name: 'Siemens WinCC SCADA Server',               zone: 'control',    purdue_level: 2 },
      { id: 'BRG-USB',        label: 'Bridge',           name: 'USB Air-Gap Bypass',                        bridge_type: 'air-gap-bypass', purdue_from: 'L4', purdue_to: 'L1' },
      { id: 'OTS-PLC',        label: 'OTSystem',         name: 'Siemens S7-315/S7-417 PLCs',               zone: 'field',   purdue_level: 1 },
      { id: 'OTS-HMI',        label: 'OTSystem',         name: 'WinCC HMI (operator console)',              zone: 'control', purdue_level: 2 },
      { id: 'PHY-CENT',       label: 'PhysicalSystem',   name: 'IR-1 Centrifuges (~1,000)',                 purdue_level: 0 },
      { id: 'T1091',          label: 'ATT_CK_Technique', name: 'Replication Through Removable Media',       tactic: 'initial-access',       plane: 'cyber',    step_order: 1 },
      { id: 'T1543',          label: 'ATT_CK_Technique', name: 'Create/Modify System Process (rootkit)',    tactic: 'persistence',          plane: 'cyber',    step_order: 2 },
      { id: 'T1055',          label: 'ATT_CK_Technique', name: 'Process Injection (Step7 DLL hijack)',      tactic: 'defense-evasion',      plane: 'cyber',    step_order: 3 },
      { id: 'T0847',          label: 'ATT_CK_Technique', name: 'Replication Via Removable Media (air-gap)', tactic: 'lateral-movement',     plane: 'bridge',   step_order: 4 },
      { id: 'T0873',          label: 'ATT_CK_Technique', name: 'Project File Infection (PLC code)',         tactic: 'persistence',          plane: 'physical', step_order: 5 },
      { id: 'T0831',          label: 'ATT_CK_Technique', name: 'Manipulation of Control (centrifuge)',      tactic: 'impair-process-control', plane: 'physical', step_order: 6 },
      { id: 'T0832',          label: 'ATT_CK_Technique', name: 'Manipulation of View (SCADA replay)',       tactic: 'impair-process-control', plane: 'physical', step_order: 7 },
      { id: 'CVE-2010-2568',  label: 'CVE',              name: 'Windows Shell LNK Vulnerability',           cvss: '9.3', cwe: 'CWE-78' },
      { id: 'CVE-2010-2729',  label: 'CVE',              name: 'Print Spooler Remote Code Execution',       cvss: '9.3', cwe: 'CWE-264' },
      { id: 'CVE-2010-2772',  label: 'CVE',              name: 'WinCC Hardcoded Password',                  cvss: '10.0', cwe: 'CWE-798' },
      { id: 'CWE-798',        label: 'CWE',              name: 'Use of Hard-coded Credentials',             abstraction: 'Base' },
      { id: 'CWE-78',         label: 'CWE',              name: 'Improper Neutralization (OS Command Injection)', abstraction: 'Base' },
      { id: 'CONS-CENT',      label: 'Consequence',      name: '~1,000 Centrifuges Destroyed (−30% capacity)', severity: 'critical', duration: '18 months' },
      { id: 'CONS-DECP',      label: 'Consequence',      name: 'Operator Deception — 18 months no alarms', severity: 'high' },
      { id: 'NZ-EXT',         label: 'NetworkZone',      name: 'External / Contractor Zone',                zone_type: 'external' },
      { id: 'NZ-IT',          label: 'NetworkZone',      name: 'IT Enterprise Zone',                        zone_type: 'enterprise' },
      { id: 'NZ-OT',          label: 'NetworkZone',      name: 'OT Field Zone (air-gapped)',                zone_type: 'field' },
    ],
    edges: [
      { source: 'STX-2010',      target: 'T1091',         type: 'USES_TECHNIQUE' },
      { source: 'STX-2010',      target: 'T1543',         type: 'USES_TECHNIQUE' },
      { source: 'STX-2010',      target: 'T1055',         type: 'USES_TECHNIQUE' },
      { source: 'STX-2010',      target: 'T0847',         type: 'USES_TECHNIQUE' },
      { source: 'STX-2010',      target: 'T0873',         type: 'USES_TECHNIQUE' },
      { source: 'STX-2010',      target: 'T0831',         type: 'USES_TECHNIQUE' },
      { source: 'STX-2010',      target: 'T0832',         type: 'USES_TECHNIQUE' },
      { source: 'T1091',         target: 'T1543',         type: 'TECHNIQUE_ORDER' },
      { source: 'T1543',         target: 'T1055',         type: 'TECHNIQUE_ORDER' },
      { source: 'T1055',         target: 'T0847',         type: 'TECHNIQUE_ORDER' },
      { source: 'T0847',         target: 'T0873',         type: 'TECHNIQUE_ORDER' },
      { source: 'T0873',         target: 'T0831',         type: 'TECHNIQUE_ORDER' },
      { source: 'T0873',         target: 'T0832',         type: 'TECHNIQUE_ORDER' },
      { source: 'T0831',         target: 'T0832',         type: 'TECHNIQUE_ORDER' },
      { source: 'T1091',         target: 'CVE-2010-2568', type: 'EXPLOITS' },
      { source: 'T1543',         target: 'CVE-2010-2729', type: 'EXPLOITS' },
      { source: 'T0873',         target: 'CVE-2010-2772', type: 'EXPLOITS' },
      { source: 'CVE-2010-2568', target: 'CWE-78',        type: 'HAS_CWE' },
      { source: 'CVE-2010-2772', target: 'CWE-798',       type: 'HAS_CWE' },
      { source: 'T1091',         target: 'ITS-WIN',       type: 'COMPROMISES' },
      { source: 'T1543',         target: 'ITS-WIN',       type: 'COMPROMISES' },
      { source: 'T1055',         target: 'ITS-S7WS',      type: 'COMPROMISES' },
      { source: 'T0873',         target: 'OTS-PLC',       type: 'COMPROMISES' },
      { source: 'T0832',         target: 'OTS-HMI',       type: 'COMPROMISES' },
      { source: 'T0831',         target: 'OTS-PLC',       type: 'EXPLOITS' },
      { source: 'T0847',         target: 'BRG-USB',       type: 'USES' },
      { source: 'BRG-USB',       target: 'OTS-PLC',       type: 'CROSSES_INTO' },
      { source: 'STX-2010',      target: 'BRG-USB',       type: 'INVOLVES' },
      { source: 'STX-2010',      target: 'CONS-CENT',     type: 'CAUSES_CONSEQUENCE' },
      { source: 'STX-2010',      target: 'CONS-DECP',     type: 'CAUSES_CONSEQUENCE' },
      { source: 'T0832',         target: 'CONS-DECP',     type: 'CAUSES' },
      { source: 'T0831',         target: 'CONS-CENT',     type: 'CAUSES' },
      { source: 'OTS-PLC',       target: 'PHY-CENT',      type: 'IMPACTS' },
      { source: 'OTS-HMI',       target: 'PHY-CENT',      type: 'AFFECTS' },
      { source: 'NZ-EXT',        target: 'ITS-WIN',       type: 'CONTAINS' },
      { source: 'NZ-IT',         target: 'ITS-S7WS',      type: 'CONTAINS' },
      { source: 'NZ-IT',         target: 'ITS-WNCC',      type: 'CONTAINS' },
      { source: 'NZ-OT',         target: 'OTS-PLC',       type: 'CONTAINS' },
      { source: 'NZ-OT',         target: 'OTS-HMI',       type: 'CONTAINS' },
      { source: 'NZ-EXT',        target: 'NZ-IT',         type: 'TRANSITIONS_TO' },
      { source: 'NZ-IT',         target: 'NZ-OT',         type: 'TRANSITIONS_TO' },
      { source: 'STX-2010',      target: 'NZ-IT',         type: 'HAS_ZONE' },
      { source: 'STX-2010',      target: 'NZ-OT',         type: 'HAS_ZONE' },
      { source: 'ITS-S7WS',      target: 'ITS-WNCC',      type: 'CONNECTS' },
      { source: 'ITS-WIN',       target: 'ITS-S7WS',      type: 'CONNECTS' },
      { source: 'ITS-WNCC',      target: 'CVE-2010-2772', type: 'HAS_VULNERABILITY' },
      { source: 'BRG-USB',       target: 'ITS-WIN',       type: 'CONNECTS' },
      { source: 'T0847',         target: 'NZ-OT',         type: 'TARGETS' },
      { source: 'STX-2010',      target: 'NZ-EXT',        type: 'HAS_ZONE' },
      { source: 'T1543',         target: 'ITS-WNCC',      type: 'COMPROMISES' },
      { source: 'T1055',         target: 'ITS-WNCC',      type: 'COMPROMISES' },
    ],
  },
};

// Map URL slugs → KG_DATA keys
const KG_KEY = {
  colonial_pipeline_2021: 'colonial',
  triton_2017:            'triton',
  german_steel_mill_2014: 'steel',
  stuxnet_2010:           'stuxnet',
};

// ═══════════════════════════════════════════════════════════════════
// SMALL HELPERS
// ═══════════════════════════════════════════════════════════════════

function InlineBadge({ text, color }) {
  if (!text) return null;
  return (
    <span style={{
      display: 'inline-block', fontSize: 10, padding: '2px 8px',
      borderRadius: 12, fontWeight: 600,
      background: color ? `${color}26` : 'rgba(100,116,139,.15)',
      color: color || '#64748b',
    }}>{text}</span>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Q3 — CONSEQUENCE VIEW — four linked layers (fix 0.2)
// Layer 1 Cyber → Layer 2 Bridge → Layer 3 Physical → Layer 4 Consequence
// ═══════════════════════════════════════════════════════════════════

const LAYER_COLORS = {
  cyber:    '#3B82F6',
  bridge:   '#00C9A7',
  physical: '#F59E0B',
  consequence: '#F97316',
};

const PLANE_BADGE = {
  cyber:    { color: '#3B82F6', label: 'Cyber' },
  bridge:   { color: '#00C9A7', label: 'Bridge' },
  physical: { color: '#F59E0B', label: 'Physical' },
};

function LayerSection({ color, title, children, note }) {
  return (
    <div style={{
      borderLeft: `3px solid ${color}`, paddingLeft: 12, marginBottom: 14,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 6, letterSpacing: '.04em' }}>
        {title}
      </div>
      {note && <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 6, lineHeight: 1.5 }}>{note}</div>}
      {children}
    </div>
  );
}

function ConsequenceView({ attackId }) {
  const d = Q3_DATA[attackId] || Q3_DATA['colonial_pipeline_2021'];
  return (
    <>
      {/* Classification header */}
      <div style={{
        background: `${d.badgeColor}0a`, border: `1px solid ${d.badgeColor}50`,
        borderRadius: 10, padding: 14, marginBottom: 16,
      }}>
        <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 5 }}>
          Classification: <InlineBadge text={d.classification} color={d.badgeColor} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          {d.note}
        </div>
      </div>

      {/* Layer 1 — Cyber */}
      <LayerSection color={LAYER_COLORS.cyber} title="Layer 1 — Cyber  (USES_TECHNIQUE)">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {d.layer_1_cyber.map((t) => {
            const pc = PLANE_BADGE[t.plane] || PLANE_BADGE.cyber;
            return (
              <span key={t.technique_id} style={{
                fontSize: 10, padding: '3px 8px', borderRadius: 4,
                background: `${pc.color}18`, color: pc.color,
                border: `1px solid ${pc.color}40`,
              }}>
                <code style={{ fontFamily: 'monospace', marginRight: 4 }}>{t.technique_id}</code>
                {t.name}
              </span>
            );
          })}
        </div>
      </LayerSection>

      {/* Layer 2 — Bridge */}
      <LayerSection color={LAYER_COLORS.bridge} title="Layer 2 — Bridge  (USES_BRIDGE)">
        {d.layer_2_bridge.length === 0
          ? <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>No bridge mechanism documented</span>
          : d.layer_2_bridge.map((b) => (
            <div key={b.bridge_id} style={{
              background: 'rgba(0,201,167,.07)', border: '1px solid rgba(0,201,167,.25)',
              borderRadius: 7, padding: '8px 12px', fontSize: 11,
            }}>
              <span style={{ fontWeight: 700, color: '#00C9A7' }}>{b.name}</span>
              {b.bridge_type && <InlineBadge text={b.bridge_type} color="#00C9A7" />}
              {b.purdue_from && (
                <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginLeft: 8 }}>
                  {b.purdue_from} → {b.purdue_to}
                </span>
              )}
            </div>
          ))
        }
      </LayerSection>

      {/* Layer 3 — Physical */}
      <LayerSection color={LAYER_COLORS.physical} title="Layer 3 — Physical  (AFFECTS_PROCESS)">
        {d.layer_3_physical.map((p, i) => (
          <div key={i} style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
            <span style={{ color: '#F59E0B', fontWeight: 600 }}>{p.system_name}</span>
            {p.process_name && <span> → {p.process_name}</span>}
            {p.purdue_level !== undefined && (
              <InlineBadge text={`L${p.purdue_level}`} color="#F59E0B" />
            )}
          </div>
        ))}
      </LayerSection>

      {/* Layer 4 — Consequence */}
      <LayerSection color={LAYER_COLORS.consequence} title="Layer 4 — Consequence  (CAUSES_CONSEQUENCE)">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>
                {['Consequence', 'Type', 'Severity', 'Realized'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '7px 10px',
                    borderBottom: '1px solid var(--color-border)',
                    color: 'var(--color-text-secondary)', fontWeight: 600,
                    fontSize: 9, textTransform: 'uppercase', letterSpacing: '.5px',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.layer_4_consequence.map((c, i) => (
                <tr key={c.consequence_id || i} style={{ borderBottom: '1px solid var(--bg3)' }}>
                  <td style={{ padding: '7px 10px', verticalAlign: 'middle', fontWeight: 600 }}>{c.name}</td>
                  <td style={{ padding: '7px 10px', verticalAlign: 'middle' }}>
                    {c.consequence_type
                      ? <InlineBadge text={c.consequence_type} color={d.badgeColor} />
                      : <span style={{ color: 'var(--color-text-secondary)' }}>—</span>}
                  </td>
                  <td style={{ padding: '7px 10px', verticalAlign: 'middle', color: 'var(--color-text-secondary)' }}>{c.severity || '—'}</td>
                  <td style={{ padding: '7px 10px', verticalAlign: 'middle' }}>
                    {c.was_realized === true
                      ? <InlineBadge text="Yes" color="#10B981" />
                      : c.was_realized === false
                        ? <InlineBadge text="Prevented" color="#F59E0B" />
                        : <span style={{ color: 'var(--color-text-secondary)' }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LayerSection>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Q4 — AI/HUMAN ROLE VIEW (fix 0.1: adds AI Attack Surfaces + Decision Points)
// ═══════════════════════════════════════════════════════════════════

const SURFACE_TYPE_COLOR = {
  adversarial: '#9333EA',
  resilience:  '#F59E0B',
};

function RolesView({ attackId }) {
  const d = Q4_DATA[attackId] || Q4_DATA['colonial_pipeline_2021'];
  const surfaces = d.ai_attack_surfaces || [];
  const decisionPts = d.decision_points || [];
  return (
    <>
      {/* Row 1: AI Plane + Human Plane cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* AI Plane card */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid rgba(139,92,246,.3)',
          borderRadius: 10, padding: 14,
        }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--purple)', marginBottom: 8 }}>
            AI Plane
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            {d.ai}
          </div>
        </div>

        {/* Human Plane card */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid rgba(236,72,153,.3)',
          borderRadius: 10, padding: 14,
        }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--pink)', marginBottom: 8 }}>
            Human Plane
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            <b style={{ color: 'var(--color-text-primary)' }}>Key action:</b> {d.human.action}<br />
            <b style={{ color: 'var(--color-text-primary)' }}>Role type:</b> {d.human.roleType}<br />
            <b style={{ color: 'var(--color-text-primary)' }}>Lesson:</b> {d.human.lesson}
          </div>
        </div>
      </div>

      {/* Card 3: AI Attack Surfaces (fix 0.1) */}
      {surfaces.length > 0 && (
        <div style={{
          background: 'var(--bg2)', border: '1px solid rgba(139,92,246,.25)',
          borderRadius: 10, padding: 14, marginBottom: 14,
        }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--purple)', marginBottom: 10 }}>
            AI Attack Surfaces
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {surfaces.map((s) => {
              const col = SURFACE_TYPE_COLOR[s.surface_type] || '#9333EA';
              return (
                <div key={s.surface_id} style={{
                  background: 'var(--bg3)', borderRadius: 8, padding: '9px 12px',
                  borderLeft: `3px solid ${col}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 11, color: col }}>{s.name}</span>
                    {s.table1_category && <InlineBadge text={s.table1_category} color={col} />}
                    {s.mitre_atlas_id && (
                      <span style={{ fontSize: 9, color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                        {s.mitre_atlas_id}
                      </span>
                    )}
                    {s.evidence_class === 'instructional_extension' && (
                      <InlineBadge text="Instructional" color="#64748b" />
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                    {s.description}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Decision Points block (fix 0.1) */}
      {decisionPts.length > 0 && (
        <div style={{
          background: 'rgba(249,115,22,.06)', border: '1px solid rgba(249,115,22,.3)',
          borderRadius: 10, padding: 14,
        }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: '#F97316', marginBottom: 8 }}>
            Decision Points
          </div>
          {decisionPts.map((dp) => (
            <div key={dp.action_id} style={{
              fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.7,
              padding: '6px 0', borderBottom: '1px solid var(--bg3)',
            }}>
              {dp.description}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Q5 — FULL GRAPH VIEW (matches v6 dt7 panel exactly)
// ═══════════════════════════════════════════════════════════════════

function FullView() {
  return (
    <>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        Full Graph — Combined Cross-Plane View
      </div>
      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 10 }}>
        Combines Q1–Q4 into a single narrative: entry point and surface exposure (Q1) → IT-to-OT movement
        across the bridge (Q2) → resulting physical consequence (Q3) → AI/Human plane involvement at each
        step (Q4). This MVP view shows the four cross-plane tabs (Q1–Q4) side-by-side; V1 will additionally
        render a single continuous graph traversal in COMP-02 (D3 Graph Canvas).
      </div>
      <div style={{
        background: 'rgba(245,158,11,.04)', border: '1px solid var(--v1-border)',
        borderRadius: 10, padding: 14,
        fontSize: 11, color: 'var(--color-text-secondary)',
      }}>
        ✓ MVP: All 5 query types available (Q1–Q4 via tabs above; Q5 full chain shown here as composite
        view). COMP-02 D3 force-directed rendering of Q5 combined graph → V1.
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Q6 — PURDUE LEVEL VIEW (matches v6 dt8 panel exactly)
// Left = compact D3 SVG, Right = system breakdown table + bridge note
// Bottom = 5-color plane legend
// ═══════════════════════════════════════════════════════════════════

const PLANE_COLS = { cyber: '#3B82F6', physical: '#F59E0B', ai: '#00C9A7', human: '#EC4899' };
const PLANE_NAMES = { cyber: 'Cyber', physical: 'Physical', ai: 'AI', human: 'Human' };

function hexAlpha(hex, a) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function PurdueView({ attackId }) {
  const vd = VIZ_DATA[attackId] || VIZ_DATA['colonial_pipeline_2021'];
  const interp = VIZ_INTERP[attackId] || VIZ_INTERP['colonial_pipeline_2021'];
  const techMap = PURDUE_TECH[attackId] || {};

  const rows = vd.purdue.filter(p => p.systems?.length > 0);

  return (
    <>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        Attack Surface — Purdue Level Diagram
      </div>
      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
        Systems arranged by ISA-95 Purdue Level. Color = plane. Bridge shown with dashed outline.
      </div>

      {/* 2-column layout: left = SVG, right = table + bridge note */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Left: Purdue SVG */}
        <div style={{
          background: 'var(--bg3)', borderRadius: 10, padding: 12,
          overflowX: 'auto', flex: '1 1 0', minWidth: 0,
        }}>
          <PurdueModel attackData={vd} />
        </div>

        {/* Right: system breakdown table + bridge note */}
        <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--teal)', letterSpacing: '.04em' }}>
            📋 PURDUE LEVEL — SYSTEM BREAKDOWN
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {['LEVEL', 'SYSTEMS', 'PLANE', 'TECHNIQUE'].map((h, hi) => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '4px 5px',
                      color: '#475569', fontWeight: 600,
                      fontSize: 9, whiteSpace: hi === 0 || hi === 2 ? 'nowrap' : undefined,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((p, ri) => {
                  const hasBridge = p.systems.some(s => s.bridge);
                  const isOT = p.level <= 2;
                  const techs = techMap[p.level] || [];
                  const planes = [...new Set(p.systems.map(s => s.p))];
                  return (
                    <tr key={ri} style={{
                      background: hasBridge ? 'rgba(0,201,167,0.06)' : 'transparent',
                      borderLeft: `2px solid ${hasBridge ? '#00C9A7' : 'transparent'}`,
                    }}>
                      <td style={{ padding: '4px 5px', whiteSpace: 'nowrap', color: isOT ? '#F59E0B' : '#64748b', fontWeight: 700, fontSize: 9 }}>
                        {p.label.split(' ').slice(0, 1).join('')}
                      </td>
                      <td style={{ padding: '4px 5px' }}>
                        {p.systems.map((s, si) => {
                          const col = PLANE_COLS[s.p] || '#64748b';
                          return (
                            <span key={si} style={{
                              display: 'inline-block', margin: '1px 2px 1px 0',
                              padding: '1px 5px', borderRadius: 3,
                              background: hexAlpha(col, 0.12),
                              color: col,
                              border: `1px solid ${hexAlpha(col, 0.3)}`,
                              fontSize: 9, whiteSpace: 'nowrap',
                            }}>
                              {s.n}{s.bridge ? ' 🌉' : ''}
                            </span>
                          );
                        })}
                      </td>
                      <td style={{ padding: '4px 5px' }}>
                        {planes.map((pl, pi) => {
                          const col = PLANE_COLS[pl] || '#64748b';
                          return (
                            <span key={pi} style={{
                              display: 'inline-block', padding: '1px 5px', borderRadius: 3,
                              background: hexAlpha(col, 0.15), color: col,
                              fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap',
                            }}>
                              {PLANE_NAMES[pl] || pl}
                            </span>
                          );
                        })}
                      </td>
                      <td style={{ padding: '4px 5px' }}>
                        {techs.length === 0
                          ? <span style={{ color: '#334155', fontSize: 9 }}>—</span>
                          : techs.map((t, ti) => {
                              const tc = isOT ? '#F59E0B' : '#3B82F6';
                              return (
                                <span key={ti} style={{
                                  display: 'inline-block', margin: '1px 2px 1px 0',
                                  padding: '1px 5px', borderRadius: 3,
                                  background: 'rgba(100,116,139,0.12)',
                                  fontSize: 9, whiteSpace: 'nowrap',
                                }}>
                                  <code style={{ color: tc, fontFamily: 'monospace', fontSize: 9 }}>{t.id}</code>
                                  {' '}<span style={{ color: '#64748b' }}>{t.name}</span>
                                </span>
                              );
                            })
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bridge note */}
          <div style={{
            padding: '8px 10px',
            background: 'rgba(0,201,167,0.06)', border: '1px solid rgba(0,201,167,0.22)',
            borderRadius: 7, fontSize: 10, lineHeight: 1.7,
          }}>
            <span dangerouslySetInnerHTML={{ __html:
              `<span style="color:#00C9A7;font-weight:700;">🌉 Bridge Type: ${interp.bridgeType}</span><br>${interp.bridgeNote}`
            }} />
          </div>
        </div>
      </div>

      {/* Bottom legend — 5 colors matching v6 exactly */}
      <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap', fontSize: 11 }}>
        {[
          ['#3B82F6', 'Cyber'], ['#F59E0B', 'Physical'], ['#00C9A7', 'AI'],
          ['#EC4899', 'Human'], ['#EF4444', 'Bridge (node)'],
        ].map(([col, lbl]) => (
          <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: col }} />
            <span>{lbl}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LLM EXPLAIN TAB (matches v6 dt6 v1-screen panel exactly)
// ═══════════════════════════════════════════════════════════════════

function LLMTabContent() {
  return (
    <div style={{
      border: '1px solid var(--v1-border)', borderRadius: 12,
      padding: '12px 16px', background: 'rgba(245,158,11,.03)',
    }}>
      {/* v1-screen-header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 12, color: 'var(--v1-text)', fontWeight: 600, marginBottom: 10,
      }}>
        LLM-Powered Natural Language Explanation
      </div>

      {/* form-groups */}
      <div style={{ marginBottom: 10 }}>
        <label style={{ display: 'block', fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: 5 }}>
          Select Explanation Depth
        </label>
        <select disabled style={{ width: '100%', opacity: .6 }}>
          <option>Student-friendly (no jargon)</option>
          <option>Intermediate (CS background)</option>
          <option>Expert (security analyst)</option>
        </select>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={{ display: 'block', fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: 5 }}>
          Focus Plane
        </label>
        <select disabled style={{ width: '100%', opacity: .6 }}>
          <option>Full cross-plane narrative</option>
          <option>Cyber Plane only</option>
          <option>IT-OT Transition only</option>
          <option>Physical Consequences only</option>
          <option>AI &amp; Human only</option>
        </select>
      </div>

      {/* Preview text block */}
      <div style={{
        background: 'var(--bg)', border: '1px solid var(--v1-border)',
        borderRadius: 8, padding: 14, fontSize: 12,
        color: 'var(--color-text-secondary)', lineHeight: 1.7, fontStyle: 'italic',
        marginBottom: 10,
      }}>
        <b style={{ color: 'var(--v1-text)' }}>[V1 Preview — SecureBERT/CySecBERT output]</b><br /><br />
        "The Colonial Pipeline attack is a textbook example of how a cyber intrusion can cause physical
        consequences without the attacker ever touching the operational technology network. In May 2021,
        a DarkSide affiliate obtained valid VPN credentials — likely through a dark web marketplace — and
        used them to enter Colonial Pipeline's enterprise IT network. Once inside, the attacker deployed
        ransomware that encrypted billing and operations data. The critical physical consequence — the
        6-day shutdown of the largest fuel pipeline in the United States — was not caused by the attacker.
        It was caused by a human decision. Faced with uncertainty about whether OT systems were also
        compromised, Colonial Pipeline operators chose to proactively shut down the pipeline. This makes
        Colonial Pipeline the canonical example of Indirect Disruption: the attacker's code never commanded
        a valve to close or a pump to stop. The physical system was brought down by the humans who operated
        it, acting rationally under incomplete information..."
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button disabled style={{
          padding: '8px 14px', borderRadius: 8,
          border: '1px solid var(--v1-border)', background: 'none',
          color: 'var(--v1-text)', fontWeight: 600, fontSize: 12,
          cursor: 'not-allowed', opacity: .6,
        }}>🔒 Generate (V1)</button>
        <button disabled style={{
          padding: '8px 14px', borderRadius: 8,
          border: '1px solid var(--color-border)', background: 'none',
          color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: 12,
          cursor: 'not-allowed', opacity: .6,
        }}>🔒 Regenerate with different model</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════

const ATTACKS = [
  { value: 'colonial_pipeline_2021', label: 'Colonial Pipeline (2021 · USA)' },
  { value: 'triton_2017',            label: 'TRITON / TRISIS (2017 · Middle East)' },
  { value: 'german_steel_mill_2014', label: 'German Steel Mill (2014 · Germany)' },
  { value: 'stuxnet_2010',           label: 'Stuxnet (2010 · Iran)' },
];

const TABS = [
  { key: 'surface',     label: 'Q1 · Surface Graph' },
  { key: 'chain',       label: 'Q2 · Attack Chain' },
  { key: 'consequence', label: 'Q3 · Consequences' },
  { key: 'roles',       label: 'Q4 · AI/Human Role' },
  { key: 'full',        label: 'Q5 · Full Graph' },
  { key: 'purdue',      label: 'Q6 · Purdue Levels' },
  { key: 'llm',         label: 'LLM Explain', v1: true },
];

// Tabs that use live API data (show loading/error)
const DYNAMIC_TABS = new Set(['surface', 'chain']);

export default function GraphExplorer() {
  const { attackId: paramId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('surface');
  const [attackId, setAttackId] = useState(paramId || 'colonial_pipeline_2021');

  // Q1 entity detail state: { node, edges, nodes } | null
  const [q1Detail, setQ1Detail] = useState(null);
  // Ref exposed to AttackSurface so we can trigger zoom reset from outside
  const q1ResetRef = useRef(null);

  // Sync URL param → local state when AttackBrowser navigates to a different attack
  // without remounting this component (same route pattern, different :attackId param).
  useEffect(() => {
    if (paramId && paramId !== attackId) {
      setAttackId(paramId);
      setTab('surface');
      setQ1Detail(null);
    }
  }, [paramId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Q1 uses static KG_DATA — no API needed.
  // Q2 chain still uses the live API.
  const fetchTab = tab === 'chain' ? 'chain' : null;
  const { data, loading, error } = useAttackData(attackId, fetchTab);

  const vizData = useMemo(() => {
    if (!data || tab !== 'chain') return null;
    const raw = data?.data ?? data;
    return toTimelineChain(Array.isArray(raw) ? raw : raw?.chain || []);
  }, [data, tab]);

  // Static KG_DATA for Q1 graph
  const q1GraphData = KG_DATA[KG_KEY[attackId]] || KG_DATA.colonial;

  const handleAttackChange = (id) => {
    setAttackId(id);
    setQ1Detail(null);
    navigate(`../explore/${id}`, { replace: true });
  };

  const title = ATTACKS.find(a => a.value === attackId)?.label?.split(' (')[0] || attackId;

  return (
    <div>
      {/* Page header */}
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
        Attack Graph Explorer
        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
          letterSpacing: '.5px', textTransform: 'uppercase',
          background: 'rgba(0,201,167,.12)', color: 'var(--teal)', border: '1px solid rgba(0,201,167,.3)' }}>
          SCR-INS-03
        </span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
        5 query types (Q1–Q5) over the selected case's knowledge graph, plus Purdue-level diagram (COMP-02)
      </div>

      {/* Attack selector row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate('../browse')}
          style={{
            padding: '7px 14px', borderRadius: 8, background: 'none',
            border: '1px solid var(--color-border)', color: 'var(--color-text-primary)',
            fontSize: 12, cursor: 'pointer', flexShrink: 0,
          }}
        >← Attack Browser</button>

        <div style={{ flex: 1, minWidth: 200, maxWidth: 340 }}>
          <label style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 5, fontWeight: 600 }}>
            Switch Attack
          </label>
          <select value={attackId} onChange={e => handleAttackChange(e.target.value)} style={{ width: '100%' }}>
            {ATTACKS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </div>

        <button
          onClick={() => navigate('../export')}
          style={{
            padding: '7px 14px', borderRadius: 8, background: 'none',
            border: '1px solid var(--color-border)', color: 'var(--color-text-primary)',
            fontSize: 12, cursor: 'pointer', flexShrink: 0, marginTop: 18,
          }}
        >↗ Export (SCR-INS-06)</button>
      </div>

      {/* Main dossier card */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          📄 Dossier — {title}
        </div>

        {/* Tab bar */}
        <div style={{
          display: 'flex', gap: 2,
          borderBottom: '1px solid var(--color-border)',
          marginBottom: 18, flexWrap: 'wrap',
        }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setQ1Detail(null); }}
              style={{
                background: 'none', border: 'none',
                color: t.v1
                  ? 'var(--v1-text)'
                  : tab === t.key ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                fontWeight: tab === t.key ? 600 : 400,
                borderBottom: `2px solid ${tab === t.key
                  ? (t.v1 ? 'var(--v1-text)' : 'var(--teal)')
                  : 'transparent'}`,
                padding: '9px 14px', fontSize: 12, cursor: 'pointer',
                marginBottom: -1, whiteSpace: 'nowrap', transition: '.15s',
                opacity: t.v1 ? .65 : 1,
              }}
            >{t.label}{t.v1 && ' 🔒'}</button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ position: 'relative', minHeight: 280 }}>

          {/* ── Q1: Surface Graph (static KG_DATA, matches CYB-19 v6 exactly) */}
          {tab === 'surface' && (() => {
            // Build legend from labels present in data
            const seenLabels = [...new Set(q1GraphData.nodes.map((n) => n.label))];
            // COMP-03 detail panel helpers
            const SKIP_PROPS = new Set(['id','label','name','x','y','vx','vy','fx','fy','index']);
            const detail = q1Detail?.node || null;
            const detailEdges = q1Detail?.edges || [];
            const detailNodes = q1Detail?.nodes || [];
            const nodeMap = Object.fromEntries(detailNodes.map((n) => [n.id, n]));

            return (
              <>
                {/* Section header */}
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  Attack Surface — COMP-02 KG Subgraph
                  <span style={{ fontSize: 9, fontWeight: 400, color: 'var(--color-text-secondary)' }}>
                    GET /attacks/{'{'+ 'id}'}/surface → D3 force-directed · data from Neo4j
                  </span>
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 10, alignItems: 'center' }}>
                  {seenLabels.map((lbl) => {
                    const col = ENT_COLOR[lbl] || '#888';
                    const txt = ENT_LABEL[lbl] || lbl;
                    return (
                      <span key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <svg width="10" height="10"><circle cx="5" cy="5" r="5" fill={col} /></svg>
                        <span style={{ color: 'var(--color-text-secondary)' }}>{txt}</span>
                      </span>
                    );
                  })}
                </div>

                {/* 2-column: graph + COMP-03 */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>

                  {/* Graph area */}
                  <div style={{ flex: 1, minWidth: 0, background: 'var(--bg3)', borderRadius: 10, padding: 10 }}>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>
                        Nodes: <b style={{ color: 'var(--color-text-primary)' }}>{q1GraphData.nodes.length}</b>
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>
                        Edges: <b style={{ color: 'var(--color-text-primary)' }}>{q1GraphData.edges.length}</b>
                      </span>
                      <button
                        onClick={() => q1ResetRef.current && q1ResetRef.current()}
                        style={{ fontSize: 10, padding: '2px 8px', background: 'var(--bg4)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', borderRadius: 4, cursor: 'pointer' }}
                      >↺ Reset View</button>
                      <div style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--color-text-secondary)' }}>
                        Drag nodes · Scroll to zoom · Click node for details
                      </div>
                    </div>
                    <AttackSurface
                      data={q1GraphData}
                      onNodeClick={(node, edges, nodes) => setQ1Detail(node ? { node, edges, nodes } : null)}
                      onResetRef={q1ResetRef}
                    />
                    <div style={{ fontSize: 9, color: 'var(--color-text-secondary)', marginTop: 4, textAlign: 'right' }}>
                      COMP-02 · D3 v7 force-directed · forceLink(110) + forceManyBody(−300) · data: KG_DATA (CYB-26 Q1)
                    </div>
                  </div>

                  {/* COMP-03 Entity Detail Panel */}
                  <div style={{ flex: '0 0 250px', minWidth: 210, background: 'var(--bg3)', borderRadius: 10, padding: 12, minHeight: 460 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--teal)', letterSpacing: '.06em', marginBottom: 10 }}>
                      COMP-03 · ENTITY DETAIL
                    </div>

                    {!detail ? (
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', padding: '30px 0', textAlign: 'center', lineHeight: 2 }}>
                        ↖ Click any node<br />to view entity details
                      </div>
                    ) : (() => {
                      const col = ENT_COLOR[detail.label] || '#888';
                      const lbl = ENT_LABEL[detail.label] || detail.label;
                      const propKeys = Object.keys(detail).filter((k) => !SKIP_PROPS.has(k));
                      const outEdges = detailEdges.filter((e) => {
                        const sid = typeof e.source === 'object' ? e.source.id : e.source;
                        return sid === detail.id;
                      });
                      const inEdges = detailEdges.filter((e) => {
                        const tid = typeof e.target === 'object' ? e.target.id : e.target;
                        return tid === detail.id;
                      });
                      return (
                        <>
                          {/* Type badge */}
                          <div style={{
                            fontSize: 9, fontWeight: 700, letterSpacing: '.08em',
                            padding: '3px 8px', borderRadius: 4, display: 'inline-block', marginBottom: 8,
                            background: `${col}22`, color: col, border: `1px solid ${col}55`,
                          }}>{lbl}</div>

                          {/* ID */}
                          <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', fontFamily: 'monospace', marginBottom: 2 }}>
                            {detail.id}
                          </div>

                          {/* Name */}
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 10, lineHeight: 1.4 }}>
                            {detail.name || detail.id}
                          </div>

                          {/* Properties */}
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-secondary)', letterSpacing: '.05em', marginBottom: 5 }}>
                            PROPERTIES
                          </div>
                          <div style={{ fontSize: 10, lineHeight: 2, marginBottom: 10 }}>
                            {propKeys.length === 0
                              ? <span style={{ color: 'var(--color-text-secondary)' }}>—</span>
                              : propKeys.map((k) => (
                                <div key={k} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 4, borderBottom: '1px solid #1e2d42', padding: '2px 0' }}>
                                  <span style={{ color: '#64748b' }}>{k}</span>
                                  <span style={{ color: '#e2e8f0', wordBreak: 'break-all' }}>{String(detail[k])}</span>
                                </div>
                              ))
                            }
                          </div>

                          {/* Relations */}
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-secondary)', letterSpacing: '.05em', marginBottom: 5 }}>
                            RELATIONS
                          </div>
                          <div style={{ fontSize: 10, lineHeight: 1.9 }}>
                            {outEdges.length === 0 && inEdges.length === 0
                              ? <span style={{ color: 'var(--color-text-secondary)' }}>No relations</span>
                              : <>
                                  {outEdges.map((e, i) => {
                                    const tid = typeof e.target === 'object' ? e.target.id : e.target;
                                    const tn = nodeMap[tid] || { id: tid, label: '?' };
                                    const tc = ENT_COLOR[tn.label] || '#888';
                                    return (
                                      <div key={`out-${i}`}>
                                        → <span style={{ color: tc }}>{tid}</span>
                                        <span style={{ color: '#475569', marginLeft: 4, fontSize: 9 }}>({e.type})</span>
                                      </div>
                                    );
                                  })}
                                  {inEdges.map((e, i) => {
                                    const sid = typeof e.source === 'object' ? e.source.id : e.source;
                                    const sn = nodeMap[sid] || { id: sid, label: '?' };
                                    const sc = ENT_COLOR[sn.label] || '#888';
                                    return (
                                      <div key={`in-${i}`}>
                                        ← <span style={{ color: sc }}>{sid}</span>
                                        <span style={{ color: '#475569', marginLeft: 4, fontSize: 9 }}>({e.type})</span>
                                      </div>
                                    );
                                  })}
                                </>
                            }
                          </div>
                        </>
                      );
                    })()}
                  </div>

                </div>
              </>
            );
          })()}

          {/* ── Q2: Attack Chain (dynamic) */}
          {tab === 'chain' && (
            <>
              {loading && <p style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>Loading attack chain…</p>}
              {error   && <p style={{ color: 'var(--red)', fontSize: 12 }}>{error}</p>}
              {!loading && !error && vizData && <Timeline data={vizData} />}
            </>
          )}

          {/* ── Q3: Consequences (static) */}
          {tab === 'consequence' && <ConsequenceView attackId={attackId} />}

          {/* ── Q4: AI/Human Role (static) */}
          {tab === 'roles' && <RolesView attackId={attackId} />}

          {/* ── Q5: Full Graph (static text + V1 note) */}
          {tab === 'full' && <FullView />}

          {/* ── Q6: Purdue Levels (static SVG + table) */}
          {tab === 'purdue' && <PurdueView attackId={attackId} />}

          {/* ── LLM Explain (V1 locked) */}
          {tab === 'llm' && <LLMTabContent />}

        </div>
      </div>
    </div>
  );
}
