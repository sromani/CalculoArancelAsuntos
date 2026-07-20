import { BadRequestException, Injectable } from '@nestjs/common';
import { listaActosSimuladorOrdenada, parseActoKey } from '../arancel/actos-simulador';
import { calcularHonorario, resolverClaveRegla, type ValoresForm } from '../arancel/compute';
import { datosPorCapitulo } from '../arancel/data';
import type { MonedaEntrada, TasasLineas } from '../arancel/conversion';
import type { Regla } from '../arancel/types';
import {
  calcularDesgloseLiquido,
  calcularDesglosePresupuestoHonario,
  honorarioEnPrincipal,
} from '../arancel/liquido-escribano';

export type SimuladorCalcularDto = {
  actoKey: string;
  valorAsignadoPartes?: number;
  moneda?: MonedaEntrada;
  urSemestralPesos: number;
  uiPesos?: number;
  dolarPesos?: number;
  fonasaPct?: number;
  irpfPct?: number;
  honorarioACobrar?: number;
  posBien?: number;
};

function resolverRegla(
  capituloId: string,
  posDoc: number,
  posBien: number | null,
  tieneSeleccionBien: boolean,
  reglas: Record<string, Regla>,
): Regla | undefined {
  if (capituloId === 'certificaciones' || capituloId === 'actas-protocolizaciones') {
    return reglas[String(posDoc)];
  }
  if (capituloId === 'actos-contratos') {
    const key = resolverClaveRegla(posDoc, posBien, tieneSeleccionBien);
    return key ? reglas[key] : undefined;
  }
  return undefined;
}

@Injectable()
export class SimuladorService {
  listarActos() {
    return listaActosSimuladorOrdenada().map((a) => ({
      key: a.key,
      nombre: a.nombre,
      capituloId: a.capituloId,
    }));
  }

  calcular(dto: SimuladorCalcularDto) {
    const parsed = parseActoKey(dto.actoKey);
    if (!parsed) throw new BadRequestException('Acto inválido.');

    const data = datosPorCapitulo[parsed.capituloId];
    if (!data) throw new BadRequestException('Capítulo no encontrado.');

    const documento = data.documentos.find((d) => d.posDoc === parsed.posDoc);
    if (!documento) throw new BadRequestException('Documento no encontrado.');

    const posBien =
      dto.posBien ??
      (documento.tieneSeleccionBien ? (documento.opcionesBien[0]?.posBien ?? null) : null);

    const regla = resolverRegla(
      parsed.capituloId,
      parsed.posDoc,
      posBien,
      documento.tieneSeleccionBien,
      data.reglas,
    );
    if (!regla) throw new BadRequestException('No hay regla para este acto.');

    const moneda: MonedaEntrada = dto.moneda ?? 'UYU';
    const tasas: TasasLineas = {
      urSemestralPesos: dto.urSemestralPesos,
      uiPesos: dto.uiPesos ?? 0,
      dolarComprador: dto.dolarPesos ?? 0,
    };

    const valores: ValoresForm = {
      valorAsignadoPartes: dto.valorAsignadoPartes != null ? String(dto.valorAsignadoPartes) : '',
    };

    const resultado = calcularHonorario(regla, valores, { monedaPrincipal: moneda, tasas });
    if ('error' in resultado) {
      throw new BadRequestException(resultado.error);
    }

    const fonasaPct = dto.fonasaPct ?? 6;
    const irpfPct = dto.irpfPct ?? 15;
    const hPrincipal = honorarioEnPrincipal(resultado, tasas);
    const lineasArancel = calcularDesgloseLiquido(hPrincipal, moneda, tasas, fonasaPct, irpfPct);

    let lineasPresupuesto = lineasArancel;
    if (dto.honorarioACobrar != null && lineasArancel) {
      const desglose = calcularDesglosePresupuestoHonario(
        lineasArancel.honorario,
        dto.honorarioACobrar,
        moneda,
        tasas,
        fonasaPct,
        irpfPct,
      );
      if (desglose) lineasPresupuesto = desglose.lineasPresupuesto;
    }

    const honorarioLabel =
      'honorarioPrincipalFormateado' in resultado
        ? resultado.honorarioPrincipalFormateado
        : resultado.montoPrincipalFormateado;

    const honorarioPesos =
      'honorarioPesos' in resultado
        ? resultado.honorarioPesos
        : 'montoPesos' in resultado
          ? resultado.montoPesos
          : 0;

    return {
      acto: { key: dto.actoKey, nombre: documento.nombre, articulo: regla.articulo },
      resultado: {
        honorarioPesos,
        honorarioPrincipalFormateado: honorarioLabel,
        monedaPrincipal: resultado.monedaPrincipal,
      },
      lineasArancel,
      lineasPresupuesto,
    };
  }
}
