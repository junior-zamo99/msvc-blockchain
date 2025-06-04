import { Injectable } from "@nestjs/common";

import * as CryptoJS from 'crypto-js';
import { VentaData } from "src/models/venta-data.interface";
@Injectable()
export class HashService {

  generateVentaHash(venta: VentaData): string {
    const hashInput = this.createHashInput(venta);
    const hash = CryptoJS.SHA256(hashInput).toString();
    return hash;
}

private createHashInput(ventaData: VentaData): string {
    const mainData = [
      `ventaId:${ventaData.ventaId}`,
      `tenantId:${ventaData.tenantId}`,
      `fechaVenta:${ventaData.fechaVenta}`,
      `total:${ventaData.total.toFixed(2)}`, 
      `estado:${ventaData.estado}`,
      `cuentaMesaId:${ventaData.cuentaMesaId}`
    ].join('|');

    const mesaData = [
      `mesaNumero:${ventaData.mesa.numero}`,
      `mesaCapacidad:${ventaData.mesa.capacidad}`
    ].join('|');

    const clienteData = ventaData.cliente ? [
      `clienteId:${ventaData.cliente.clienteId || 'null'}`,
      `clienteNombre:${ventaData.cliente.nombre || 'null'}`,
      `clienteEmail:${ventaData.cliente.email || 'null'}`
    ].join('|') : 'cliente:null';

    const productos = ventaData.productos
      .sort((a, b) => a.productoId - b.productoId)
      .map(producto => 
        `prod:${producto.productoId}:${producto.nombre}:${producto.cantidad}:${producto.precio.toFixed(2)}:${producto.subtotal.toFixed(2)}`
      )
      .join('|');

    const hashInput = [
      mainData,
      mesaData, 
      clienteData,
      productos
    ].join('||');

    return hashInput;
}

verifyHash(ventaData: VentaData, expectedHash: string): boolean {
    const calculatedHash = this.generateVentaHash(ventaData);
    return calculatedHash === expectedHash;
}

getHashDetails(ventaData: VentaData) {
    const hashInput = this.createHashInput(ventaData);
    const hash = CryptoJS.SHA256(hashInput).toString();
    
    return {
      hash,
      hashInput,
      inputLength: hashInput.length,
      algorithm: 'SHA-256',
      timestamp: new Date().toISOString()
    };
}

}