'use client'
import { useState } from 'react';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';

// Definimos los tipos de bienes
const TIPOS_BIEN = [
  { value: 'BIEN_INMUEBLE', label: 'Bien Inmueble' },
  { value: 'BIEN_MUEBLE', label: 'Bien Mueble' },
  { value: 'DERECHO_MUEBLE', label: 'Derecho Mueble' },
  { value: 'ESTABLECIMIENTO_COMERCIAL', label: 'Establecimiento Comercial e Industrial' },
  { value: 'AERONAVE', label: 'Aeronave' },
  { value: 'BUQUE', label: 'Buque' },
  { value: 'VARIOS', label: 'Varios' },
];

// Tipos de contratos (estos aplican para la mayoría de bienes)
const TIPOS_CONTRATO = [
  { value: 'COMPRAVENTA', label: 'Compraventa' },
  { value: 'CESION_DERECHOS', label: 'Cesión de Derechos' },
  { value: 'DACION_PAGO', label: 'Dación en Pago' },
  { value: 'DONACION', label: 'Donación' },
  { value: 'PERMUTA', label: 'Permuta' },
  { value: 'RENTA_VITALICIA', label: 'Renta Vitalicia' },
  { value: 'TRANSACCION', label: 'Transacción' },
  { value: 'CONSTITUCION_FIDEICOMISO', label: 'Constitución de Fideicomiso' },
  { value: 'DERECHO_REAL_SERVIDUMBRE', label: 'Derecho Real - Servidumbre' },
  { value: 'DERECHO_REAL_USUFRUCTO', label: 'Derecho Real - Usufructo' },
  { value: 'DERECHO_REAL_USO', label: 'Derecho Real - Uso' },
  { value: 'TITULO_HABIL', label: 'Título Hábil para Adquirir' },
  { value: 'DECLARATORIA', label: 'Declaratoria que Atribuya Dominio a Terceros' },
];

// Tipos de moneda
const TIPOS_MONEDA = [
  { value: 'PESOS', label: 'Pesos Uruguayos ($)' },
  { value: 'DOLARES', label: 'Dólares (USD)' },
  { value: 'UR', label: 'Unidades Reajustables (UR)' },
  { value: 'UI', label: 'Unidades Indexadas (UI)' },
];

export default function SimuladorPage() {
  // Estado del formulario
  const [formData, setFormData] = useState({
    alias: '',
    tipoBien: '',
    tipoContrato: '',
    valorAsignadoPartes: '',
    moneda: '',
    valorCatastral: '',
  });

  // Estado para mostrar el modal de login
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Función para actualizar el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Función para cuando hacen submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // TODO: Aquí verificamos si está logueado
    // Por ahora simulamos que no lo está
    const isLoggedIn = false;
    
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    
    // Si está logueado, hacemos el cálculo
    console.log('Calculando con datos:', formData);
  };

  return (
    <div className="simulador-container">
      <div className="simulador-content">
        
        <div className="simulador-header">
          <h1>Simulador de Arancel Notarial</h1>
          <p>Calculá de forma rápida y precisa los honorarios según el Arancel Notarial vigente</p>
        </div>

        <form onSubmit={handleSubmit} className="simulador-form">
          
          <div className="form-field">
            <Input
              label="Alias del cálculo"
              name="alias"
              value={formData.alias}
              onChange={handleChange}
              placeholder="Ej: Compra Casa Juan Pérez (opcional)"
            />
            <span className="form-hint">
              Poné un nombre para identificar este cálculo en tu historial
            </span>
          </div>

          <hr className="form-divider" />

          <div className="form-section">
            <h2>Paso 1: Tipo de Acto/Contrato</h2>
            <Select
              label="Seleccioná el tipo de acto o contrato"
              name="tipoContrato"
              value={formData.tipoContrato}
              onChange={handleChange}
              options={TIPOS_CONTRATO}
              required
            />
          </div>

          {formData.tipoContrato && (
            <>
              <hr className="form-divider" />
              <div className="form-section">
                <h2>Paso 2: Tipo de Bien</h2>
                <Select
                  label="Seleccioná el tipo de bien"
                  name="tipoBien"
                  value={formData.tipoBien}
                  onChange={handleChange}
                  options={TIPOS_BIEN}
                  required
                />
              </div>
            </>
          )}

          {formData.tipoBien && formData.tipoContrato && formData.tipoBien !== 'VARIOS' && (
            <>
              <hr className="form-divider" />
              <div className="form-section">
                <h2>Paso 3: Valores del {formData.tipoBien === 'BIEN_INMUEBLE' ? 'Inmueble' : 'Bien'}</h2>
                
                <div className="form-grid">
                  <Input
                    label="Valor asignado por las partes"
                    name="valorAsignadoPartes"
                    type="number"
                    value={formData.valorAsignadoPartes}
                    onChange={handleChange}
                    placeholder="0"
                    required
                  />

                  <Select
                    label="Moneda"
                    name="moneda"
                    value={formData.moneda}
                    onChange={handleChange}
                    options={TIPOS_MONEDA}
                    required
                  />
                </div>

                {formData.tipoBien === 'BIEN_INMUEBLE' && (
                  <div className="form-field">
                    <Input
                      label="Valor Catastral (en pesos)"
                      name="valorCatastral"
                      type="number"
                      value={formData.valorCatastral}
                      onChange={handleChange}
                      placeholder="0"
                    />
                    <span className="form-hint">
                      Valor real fijado por la Dirección Nacional de Catastro
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {formData.tipoBien === 'VARIOS' && (
            <>
              <hr className="form-divider" />
              <div className="form-note">
                <p>
                  <strong>Nota:</strong> Los actos clasificados como "VARIOS" tienen un honorario fijo de 12 UR semestrales.
                </p>
              </div>
            </>
          )}

          <div className="form-actions">
            <Button type="submit" variant="primary">
              Calcular Honorarios
            </Button>
          </div>

        </form>

        {showLoginModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Iniciá sesión para continuar</h3>
              <p>
                Para realizar cálculos y guardar tu historial, necesitás tener una cuenta.
                ¡No te preocupes! Tus datos se guardarán.
              </p>
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={() => console.log('Ir a login')}>
                  Iniciar Sesión
                </button>
                <button className="btn btn-outline" onClick={() => setShowLoginModal(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}