export interface HashResponse {
    success: boolean;
    ventaId: number;
    tenantId: number;
    hash: string;
    hashAlgorithm: string;
    timestamp: string;
    dataSize: number;
    hashInput?: string; 
    error?: string;
  }