export interface Node {
    id: string;
    radius: number;
    x: number;
    y: number;
  }

  export interface GraphLink {
    source: string;
    target: string;
    value: number;
  }

  export interface ForceGraphProps {
    comparisonStats: Record<string, { yes: number; no: number }>;
    items: string[];
  }

  export interface SimulationState {
    nodes: Node[];
    links: GraphLink[];
  }