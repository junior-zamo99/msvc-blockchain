export interface DatosProducto {
  productoId: number;
  nombre: string;
  cantidad: number;
  precio: number;
  subtotal: number;
}

export interface DatosCliente {
  clienteId?: number;
  nombre?: string;
  email?: string;
}

export interface DatosMesa {
  numero: number;
  capacidad: number;
}

export interface DatosVenta {
  ventaId: number;
  tenantId: number;
  fechaVenta: string;
  total: number;
  estado: string;
  cuentaMesaId: number;
  mesa: DatosMesa;
  cliente?: DatosCliente;
  productos: DatosProducto[];
}

export interface VentaHashRequest {
  ventaId: number;
  tenantId: number;
  datosVenta: DatosVenta;  
}


export type VentaData = DatosVenta;