// Vista Detalle del Alumno (Planificador de Rutinas y Biometría)
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';
import { GraficosBiometria } from '../../components/GraficosBiometria';
import plusIcon from '../../assets/plus.svg';

export const DetalleAlumno = ({ alumnoId, volver }) => {
  const [alumno, setAlumno] = useState(null);
  const [rutinaActiva, setRutinaActiva] = useState(null);
  const [biometria, setBiometria] = useState([]);
  const [historialEntrenamientos, setHistorialEntrenamientos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Catálogo completo de ejercicios
  const [catalogoEjercicios, setCatalogoEjercicios] = useState([]);

  // Estado de errores de validación al crear rutina
  const [erroresValidacion, setErroresValidacion] = useState([]);

  // Estados para Edición de Ficha Médica
  const [editandoFicha, setEditandoFicha] = useState(false);
  const [objetivos, setObjetivos] = useState('');
  const [historialSalud, setHistorialSalud] = useState('');
  const [telefono, setTelefono] = useState('');
  const [contactoEmergencia, setContactoEmergencia] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [genero, setGenero] = useState('');

  // Estados para Registro de Nueva Biometría
  const [mostrarModalBiometria, setMostrarModalBiometria] = useState(false);
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [porcentajeGrasa, setPorcentajeGrasa] = useState('');
  const [porcentajeMusculo, setPorcentajeMusculo] = useState('');
  
  // Perímetros detallados
  const [cintura, setCintura] = useState('');
  const [pecho, setPecho] = useState('');
  const [cadera, setCadera] = useState('');
  const [bicepIzq, setBicepIzq] = useState('');
  const [bicepDer, setBicepDer] = useState('');
  const [musloIzq, setMusloIzq] = useState('');
  const [musloDer, setMusloDer] = useState('');
  const [mostrarPerimetros, setMostrarPerimetros] = useState(false);

  // Estados para el Creador de Rutinas
  const [mostrarCreadorRutina, setMostrarCreadorRutina] = useState(false);
  const [nombreRutina, setNombreRutina] = useState('Rutina Personalizada');
  const [descripcionRutina, setDescripcionRutina] = useState('');
  const [diasRutina, setDiasRutina] = useState([
    { nombre_dia: 'Día A', orden: 1, ejercicios_rutina: [] }
  ]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const datosAlumno = await api.obtenerDetalleAlumno(alumnoId);
      setAlumno(datosAlumno);

      // Cargar campos de ficha
      setObjetivos(datosAlumno.perfil_alumno?.objetivos_iniciales || '');
      setHistorialSalud(datosAlumno.perfil_alumno?.historial_salud || '');
      setTelefono(datosAlumno.perfil_alumno?.telefono || '');
      setContactoEmergencia(datosAlumno.perfil_alumno?.contacto_emergencia || '');
      setFechaNacimiento(datosAlumno.perfil_alumno?.fecha_nacimiento || '');
      setGenero(datosAlumno.perfil_alumno?.genero || '');

      // Cargar catálogo de ejercicios (solo activos para asignar a rutinas)
      const ejercicios = await api.listarEjercicios('', '', true);
      setCatalogoEjercicios(ejercicios);

      // Cargar rutina activa (manejar 404 si no hay)
      try {
        const rutina = await api.obtenerRutinaActiva(alumnoId);
        setRutinaActiva(rutina);
      } catch (e) {
        setRutinaActiva(null);
      }

      // Cargar registros biométricos
      const bio = await api.obtenerBiometriaAlumno(alumnoId);
      setBiometria(bio);

      // Cargar historial de entrenamientos completados
      const hist = await api.obtenerHistorialEntrenamientos(alumnoId);
      setHistorialEntrenamientos(hist);

    } catch (err) {
      alert('Error al cargar la información del alumno: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [alumnoId]);

  // Guardar cambios en el perfil del alumno (Ficha médica)
  const manejarGuardarFicha = async () => {
    try {
      await api.modificarPerfilAlumno(alumnoId, {
        objetivos_iniciales: objetivos,
        historial_salud: historialSalud,
        telefono,
        contacto_emergencia: contactoEmergencia,
        fecha_nacimiento: fechaNacimiento || null,
        genero: genero || null
      });
      setEditandoFicha(false);
      cargarDatos();
    } catch (err) {
      alert('Error al guardar la ficha: ' + err.message);
    }
  };

  // Registrar nueva medición biométrica
  const manejarAgregarBiometria = async (e) => {
    e.preventDefault();
    if (!peso || !altura) {
      alert('El peso y la altura son obligatorios.');
      return;
    }

    try {
      await api.registrarBiometria(alumnoId, {
        peso: parseFloat(peso),
        altura: parseFloat(altura),
        porcentaje_grasa: porcentajeGrasa ? parseFloat(porcentajeGrasa) : null,
        porcentaje_musculo: porcentajeMusculo ? parseFloat(porcentajeMusculo) : null,
        cintura: cintura ? parseFloat(cintura) : null,
        pecho: pecho ? parseFloat(pecho) : null,
        cadera: cadera ? parseFloat(cadera) : null,
        bicep_izq: bicepIzq ? parseFloat(bicepIzq) : null,
        bicep_der: bicepDer ? parseFloat(bicepDer) : null,
        muslo_izq: musloIzq ? parseFloat(musloIzq) : null,
        muslo_der: musloDer ? parseFloat(musloDer) : null
      });
      setMostrarModalBiometria(false);
      setPeso('');
      setAltura('');
      setPorcentajeGrasa('');
      setPorcentajeMusculo('');
      setCintura('');
      setPecho('');
      setCadera('');
      setBicepIzq('');
      setBicepDer('');
      setMusloIzq('');
      setMusloDer('');
      cargarDatos();
    } catch (err) {
      alert('Error al registrar medidas: ' + err.message);
    }
  };

  // --- MÉTODOS DEL CREADOR DE RUTINA ---

  const agregarDia = () => {
    setDiasRutina([
      ...diasRutina,
      { nombre_dia: `Día ${String.fromCharCode(65 + diasRutina.length)}`, orden: diasRutina.length + 1, ejercicios_rutina: [] }
    ]);
  };

  const eliminarDia = (indice) => {
    if (diasRutina.length === 1) return;
    const nuevosDias = diasRutina.filter((_, idx) => idx !== indice);
    // Reordenar
    nuevosDias.forEach((d, idx) => {
      d.orden = idx + 1;
    });
    setDiasRutina(nuevosDias);
  };

  const cambiarNombreDia = (indice, nombre) => {
    const nuevosDias = [...diasRutina];
    nuevosDias[indice].nombre_dia = nombre;
    setDiasRutina(nuevosDias);
  };

  const agregarEjercicioADia = (diaIndice, ejercicioId) => {
    const nuevosDias = [...diasRutina];
    const dia = nuevosDias[diaIndice];

    // Obtener el ejercicio seleccionado del catálogo
    const ejercicio = catalogoEjercicios.find(e => e.id === parseInt(ejercicioId));
    if (!ejercicio) return;

    dia.ejercicios_rutina.push({
      ejercicio_id: ejercicio.id,
      ejercicio_nombre: ejercicio.nombre,
      series: 4,
      repeticiones: '10',
      carga_objetivo: '70% RPE 8',
      descanso_segundos: 90,
      orden: dia.ejercicios_rutina.length + 1
    });

    setDiasRutina(nuevosDias);
  };

  const eliminarEjercicioDeDia = (diaIndice, ejIndice) => {
    const nuevosDias = [...diasRutina];
    const dia = nuevosDias[diaIndice];
    dia.ejercicios_rutina = dia.ejercicios_rutina.filter((_, idx) => idx !== ejIndice);
    // Reordenar
    dia.ejercicios_rutina.forEach((e, idx) => {
      e.orden = idx + 1;
    });
    setDiasRutina(nuevosDias);
  };

  const cambiarParametroEjercicio = (diaIndice, ejIndice, campo, valor) => {
    const nuevosDias = [...diasRutina];
    const ejercicio = nuevosDias[diaIndice].ejercicios_rutina[ejIndice];

    if (campo === 'series' || campo === 'descanso_segundos') {
      ejercicio[campo] = parseInt(valor) || 0;
    } else {
      ejercicio[campo] = valor;
    }

    setDiasRutina(nuevosDias);
  };

  const manejarGuardarRutina = async () => {
    // Validar que haya días y que tengan ejercicios
    const tieneEjercicios = diasRutina.some(d => d.ejercicios_rutina.length > 0);
    if (!tieneEjercicios) {
      alert('La rutina debe contener al menos un día con ejercicios.');
      return;
    }

    setErroresValidacion([]); // Limpiar errores anteriores

    try {
      // Formatear payload para cumplir el Pydantic RutinaCrear
      const payload = {
        nombre: nombreRutina,
        descripcion: descripcionRutina,
        alumno_id: alumnoId,
        dias: diasRutina.map(d => ({
          nombre_dia: d.nombre_dia,
          orden: d.orden,
          ejercicios_rutina: d.ejercicios_rutina.map(e => ({
            ejercicio_id: e.ejercicio_id,
            series: e.series,
            repeticiones: e.repeticiones,
            carga_objetivo: e.carga_objetivo,
            descanso_segundos: e.descanso_segundos,
            orden: e.orden
          }))
        }))
      };

      await api.crearRutina(payload);
      setMostrarCreadorRutina(false);
      setErroresValidacion([]);
      cargarDatos();
    } catch (err) {
      // mostrar errores de validación en la UI en vez de alert genérico
      if (err.erroresValidacion && err.erroresValidacion.length > 0) {
        setErroresValidacion(err.erroresValidacion);
      } else {
        alert('Error al crear rutina: ' + err.message);
      }
    }
  };

  if (cargando) return <div className="cargando-contenedor">Cargando detalles de alumno...</div>;
  if (!alumno) return <div className="alerta-error">Alumno no encontrado.</div>;

  return (
    <div className="detalle-alumno-seccion animacion-aparicion">
      <button onClick={volver} className="btn btn-secundario boton-volver">
        ← Volver al Listado
      </button>

      {/* Cabecera / Perfil Alumno */}
      <div className="perfil-cabecera tarjeta-vidrio">
        <div className="perfil-cabecera-info">
          <div className="avatar-alumno grande">
            {alumno.nombre_completo.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <div>
            <h2>{alumno.nombre_completo}</h2>
            <p className="email-alumno">{alumno.email}</p>
            <div className="datos-contacto">
              {alumno.perfil_alumno?.telefono && <span>📞 {alumno.perfil_alumno.telefono}</span>}
              {alumno.perfil_alumno?.contacto_emergencia && <span>🚨 Emergencia: {alumno.perfil_alumno.contacto_emergencia}</span>}
              {alumno.perfil_alumno?.fecha_nacimiento && <span>🎂 Nacimiento: {alumno.perfil_alumno.fecha_nacimiento}</span>}
              {alumno.perfil_alumno?.genero && <span>👤 Género: {alumno.perfil_alumno.genero}</span>}
            </div>
          </div>
        </div>

        {/* Ficha Médica y Objetivos */}
        <div className="ficha-medica-contenido">
          {editandoFicha ? (
            <div className="ficha-edicion-formulario">
              <div className="input-grupo">
                <label>Objetivos Iniciales</label>
                <textarea
                  className="input-control"
                  value={objetivos}
                  onChange={(e) => setObjetivos(e.target.value)}
                  rows="2"
                />
              </div>
              <div className="input-grupo">
                <label>Historial Médico / Salud / Lesiones</label>
                <textarea
                  className="input-control"
                  value={historialSalud}
                  onChange={(e) => setHistorialSalud(e.target.value)}
                  rows="2"
                />
              </div>
              <div className="fila-inputs">
                <div className="input-grupo">
                  <label>Fecha de Nacimiento</label>
                  <input
                    type="date"
                    className="input-control"
                    value={fechaNacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                  />
                </div>
                <div className="input-grupo">
                  <label>Género</label>
                  <select
                    className="input-control"
                    value={genero}
                    onChange={(e) => setGenero(e.target.value)}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>
              <div className="fila-inputs">
                <div className="input-grupo">
                  <label>Teléfono</label>
                  <input
                    type="text"
                    className="input-control"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                  />
                </div>
                <div className="input-grupo">
                  <label>Contacto de Emergencia</label>
                  <input
                    type="text"
                    className="input-control"
                    value={contactoEmergencia}
                    onChange={(e) => setContactoEmergencia(e.target.value)}
                  />
                </div>
              </div>
              <div className="ficha-acciones">
                <button onClick={() => setEditandoFicha(false)} className="btn btn-secundario">Cancelar</button>
                <button onClick={manejarGuardarFicha} className="btn btn-primario">Guardar Ficha</button>
              </div>
            </div>
          ) : (
            <div className="ficha-lectura">
              <div className="bloque-ficha">
                <strong>Salud e Historial Clínico:</strong>
                {alumno.perfil_alumno?.historial_salud ? (
                  <p className="alerta-salud">{alumno.perfil_alumno.historial_salud}</p>
                ) : (
                  <p className="sin-alerta">Sin condiciones de salud registradas.</p>
                )}
              </div>
              <div className="bloque-ficha">
                <strong>Objetivos de Entrenamiento:</strong>
                <p>{alumno.perfil_alumno?.objetivos_iniciales || 'No especificados.'}</p>
              </div>
              <button onClick={() => setEditandoFicha(true)} className="btn btn-secundario btn-editar-ficha">
                Editar Ficha
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sección de Rutina Asignada */}
      <div className="seccion-rutina-planificador">
        {mostrarCreadorRutina ? (
          <div className="tarjeta-vidrio creador-rutina-bloque animacion-aparicion">
            <div className="creador-cabecera">
              <h3>Planificador de Rutina Técnica</h3>
              <div className="creador-cabecera-acciones">
                <button onClick={() => { setMostrarCreadorRutina(false); setErroresValidacion([]); }} className="btn btn-secundario">Cerrar</button>
                <button onClick={manejarGuardarRutina} className="btn btn-primario">Guardar y Asignar</button>
              </div>
            </div>

            {/* Errores de Validación */}
            {erroresValidacion.length > 0 && (
              <div className="alerta-validacion">
                <strong>⚠️ Problemas detectados: No se puede guardar la rutina</strong>
                <ul className="lista-errores-validacion">
                  {erroresValidacion.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="fila-inputs-rutina">
              <div className="input-grupo flex-2">
                <label>Nombre de la Rutina</label>
                <input
                  type="text"
                  className="input-control"
                  value={nombreRutina}
                  onChange={(e) => setNombreRutina(e.target.value)}
                />
              </div>
              <div className="input-grupo flex-3">
                <label>Observaciones / Descripción General</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Ej: Frecuencia 2, priorizar sobrecarga progresiva."
                  value={descripcionRutina}
                  onChange={(e) => setDescripcionRutina(e.target.value)}
                />
              </div>
            </div>

            {/* Días y Ejercicios */}
            <div className="dias-lista">
              {diasRutina.map((dia, diaIdx) => (
                <div key={diaIdx} className="creador-dia-tarjeta">
                  <div className="dia-tarjeta-cabecera">
                    <input
                      type="text"
                      className="input-control input-nombre-dia"
                      value={dia.nombre_dia}
                      onChange={(e) => cambiarNombreDia(diaIdx, e.target.value)}
                    />
                    <button onClick={() => eliminarDia(diaIdx)} className="btn-eliminar-dia" title="Eliminar Día">✕</button>
                  </div>

                  {/* Ejercicios del Día */}
                  <div className="tabla-contenedor">
                    <table className="tabla-ejercicios-creador" style={{ minWidth: '600px' }}>
                      <thead>
                        <tr>
                          <th>Ejercicio</th>
                          <th style={{ width: '80px' }}>Series</th>
                          <th style={{ width: '100px' }}>Repes</th>
                          <th style={{ width: '150px' }}>Carga / RPE</th>
                          <th style={{ width: '100px' }}>Descanso</th>
                          <th style={{ width: '60px' }}>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dia.ejercicios_rutina.map((ej, ejIdx) => (
                          <tr key={ejIdx} className={ej.habilitado_actual === false ? 'ej-no-habilitado-fila' : ''}>
                            <td>
                              <strong>{ej.ejercicio_nombre}</strong>
                              {ej.habilitado_actual === false && (
                                <span className="badge-no-habilitado-prof">⚠️ No habilitado</span>
                              )}
                            </td>
                            <td>
                              <input
                                type="number"
                                className="input-control-tabla"
                                value={ej.series}
                                onChange={(e) => cambiarParametroEjercicio(diaIdx, ejIdx, 'series', e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="input-control-tabla"
                                value={ej.repeticiones}
                                onChange={(e) => cambiarParametroEjercicio(diaIdx, ejIdx, 'repeticiones', e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="input-control-tabla"
                                value={ej.carga_objetivo}
                                onChange={(e) => cambiarParametroEjercicio(diaIdx, ejIdx, 'carga_objetivo', e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="input-control-tabla"
                                value={ej.descanso_segundos}
                                onChange={(e) => cambiarParametroEjercicio(diaIdx, ejIdx, 'descanso_segundos', e.target.value)}
                              />
                            </td>
                            <td>
                              <button
                                type="button"
                                onClick={() => eliminarEjercicioDeDia(diaIdx, ejIdx)}
                                className="btn-eliminar-ej"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="agregar-ejercicio-control">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            agregarEjercicioADia(diaIdx, e.target.value);
                            e.target.value = ''; // Resetear
                          }
                        }}
                        className="input-control select-ejercicio"
                      >
                        <option value="">+ Agregar Ejercicio al día...</option>
                        {catalogoEjercicios
                          .filter(e => e.activo !== false && (!e.equipamiento || e.equipamiento.disponible !== false))
                          .map(e => (
                            <option key={e.id} value={e.id}>{e.nombre} ({e.grupo_muscular})</option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={agregarDia} className="btn btn-secundario btn-agregar-dia">
                <img
                  src={plusIcon}
                  alt="Más"
                  className="icono-agregar"
                />
                Agregar Día de Entrenamiento
              </button>
            </div>
          </div>
        ) : (
          <div className="tarjeta-vidrio panel-rutina">
            <div className="cabecera-bloque-rutina">
              <div>
                <h3>Rutina Técnica Asignada</h3>
                {rutinaActiva ? (
                  <p className="nombre-rutina-activa">✓ Activa: <strong>{rutinaActiva.nombre}</strong> ({rutinaActiva.descripcion || 'Sin observaciones'})</p>
                ) : (
                  <p className="sin-rutina-alerta">El alumno no tiene ninguna rutina activa asignada actualmente.</p>
                )}
              </div>
              <button onClick={() => {
                setNombreRutina(rutinaActiva ? rutinaActiva.nombre : 'Rutina Personalizada');
                setDescripcionRutina(rutinaActiva ? (rutinaActiva.descripcion || '') : '');
                setDiasRutina(rutinaActiva ? rutinaActiva.dias.map(d => ({
                  nombre_dia: d.nombre_dia,
                  orden: d.orden,
                  ejercicios_rutina: d.ejercicios_rutina.map(e => ({
                    ejercicio_id: e.ejercicio_id,
                    ejercicio_nombre: e.ejercicio.nombre,
                    series: e.series,
                    repeticiones: e.repeticiones,
                    carga_objetivo: e.carga_objetivo,
                    descanso_segundos: e.descanso_segundos,
                    orden: e.orden,
                    habilitado_actual: e.habilitado_actual
                  }))
                })) : [{ nombre_dia: 'Día A', orden: 1, ejercicios_rutina: [] }]);
                setMostrarCreadorRutina(true);
              }} className="btn btn-primario">
                {rutinaActiva ? 'Re-Planificar Rutina' : 'Diseñar Nueva Rutina'}
              </button>
            </div>

            {/* Visualización de la rutina activa */}
            {rutinaActiva && (
              <div className="rutina-vista-detalles">
                {rutinaActiva.dias.map((dia) => (
                  <div key={dia.id} className="rutina-vista-dia">
                    <h4>{dia.nombre_dia}</h4>
                    <div className="tabla-contenedor">
                      <table className="tabla-premium">
                        <thead>
                          <tr>
                            <th>Ejercicio</th>
                            <th>Series</th>
                            <th>Repeticiones</th>
                            <th>Carga Objetivo</th>
                            <th>Descanso</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dia.ejercicios_rutina.map((ej) => (
                            <tr key={ej.id} className={!ej.habilitado_actual ? 'ej-no-habilitado-fila' : ''}>
                              <td>
                                <strong>{ej.ejercicio.nombre}</strong>
                                <span className="grupo-muscular-etiqueta">{ej.ejercicio.grupo_muscular}</span>
                                {!ej.habilitado_actual && (
                                  <span className="badge-no-habilitado-prof">⚠️ No habilitado</span>
                                )}
                              </td>
                              <td>{ej.series}</td>
                              <td>{ej.repeticiones}</td>
                              <td><span className="badge badge-primario">{ej.carga_objetivo}</span></td>
                              <td>{ej.descanso_segundos}s</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Evolución Biométrica */}
      <div className="seccion-biometria-datos">
        <div className="tarjeta-vidrio">
          <div className="cabecera-bloque-biometria">
            <h3>Seguimiento Biométrico</h3>
            <button onClick={() => {
              if (biometria.length > 0) {
                const ultima = biometria[biometria.length - 1];
                setPeso(ultima.peso || '');
                setAltura(ultima.altura || '');
                setPorcentajeGrasa(ultima.porcentaje_grasa || '');
                setPorcentajeMusculo(ultima.porcentaje_musculo || '');
                setCintura(ultima.cintura || '');
                setPecho(ultima.pecho || '');
                setCadera(ultima.cadera || '');
                setBicepIzq(ultima.bicep_izq || '');
                setBicepDer(ultima.bicep_der || '');
                setMusloIzq(ultima.muslo_izq || '');
                setMusloDer(ultima.muslo_der || '');
              } else {
                setPeso('');
                setAltura('');
                setPorcentajeGrasa('');
                setPorcentajeMusculo('');
                setCintura('');
                setPecho('');
                setCadera('');
                setBicepIzq('');
                setBicepDer('');
                setMusloIzq('');
                setMusloDer('');
              }
              setMostrarModalBiometria(true);
            }} className="btn btn-secundario">
              <img src={plusIcon} alt="Más" className="icono-agregar" />
              Nueva Medición
            </button>
          </div>

          <GraficosBiometria registros={biometria} />

          {biometria.length > 0 && (
            <div className="tabla-contenedor" style={{ marginTop: '20px' }}>
              <table className="tabla-premium">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Peso</th>
                    <th>Altura</th>
                    <th>% Grasa</th>
                    <th>% Músculo</th>
                    <th>Perímetros</th>
                  </tr>
                </thead>
                <tbody>
                  {[...biometria].reverse().slice(0, 5).map((reg) => (
                    <tr key={reg.id}>
                      <td>{new Date(reg.fecha_registro).toLocaleDateString()}</td>
                      <td><strong>{reg.peso} kg</strong></td>
                      <td>{reg.altura} cm</td>
                      <td>{reg.porcentaje_grasa ? `${reg.porcentaje_grasa}%` : '-'}</td>
                      <td>{reg.porcentaje_musculo ? `${reg.porcentaje_musculo}%` : '-'}</td>
                      <td>
                        <div className="tooltip-contenedor">
                          <div className="tooltip-texto">
                            {reg.cintura ? `Cintura: ${reg.cintura} cm` : ''}
                            {reg.pecho ? `\nPecho: ${reg.pecho} cm` : ''}
                            {reg.cadera ? `\nCadera: ${reg.cadera} cm` : ''}
                            {reg.bicep_izq ? `\nBrazo I: ${reg.bicep_izq} cm` : ''}
                            {reg.bicep_der ? `\nBrazo D: ${reg.bicep_der} cm` : ''}
                            {reg.muslo_izq ? `\nPierna I: ${reg.muslo_izq} cm` : ''}
                            {reg.muslo_der ? `\nPierna D: ${reg.muslo_der} cm` : ''}
                            {!reg.cintura && !reg.pecho && !reg.cadera && !reg.bicep_izq && !reg.bicep_der && !reg.muslo_izq && !reg.muslo_der && 'Sin datos registrados'}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Historial de Sesiones Completadas */}
      <div className="seccion-historial-entrenamientos">
        <div className="tarjeta-vidrio">
          <h3>Historial de Sesiones Completadas</h3>
          {historialEntrenamientos.length === 0 ? (
            <p className="sin-sesiones">El alumno no ha registrado ninguna sesión de entrenamiento finalizada.</p>
          ) : (
            <div className="historial-lista">
              {historialEntrenamientos.map((sesion) => (
                <div key={sesion.id} className="sesion-tarjeta-historial">
                  <div className="sesion-historial-cabecera">
                    <div>
                      <h4>{sesion.dia_rutina?.nombre_dia || 'Sesión de Entrenamiento'}</h4>
                      <p className="fecha-sesion">{new Date(sesion.fecha_inicio).toLocaleString()}</p>
                    </div>
                    <span className="badge badge-exito">Finalizado</span>
                  </div>
                  {sesion.notas && <p className="notas-sesion-historial"><strong>Nota:</strong> {sesion.notas}</p>}

                  <div className="series-resumen-historial">
                    <h5>Series Ejecutadas:</h5>
                    <div className="grilla-series-historial">
                      {sesion.series_completadas.map((serie) => (
                        <div key={serie.id} className="item-serie-historial">
                          <span className="ej-nombre">{serie.ejercicio.nombre}</span>
                          <span className="ej-valores">Serie {serie.numero_serie}: {serie.repeticiones_completadas} reps @ {serie.peso_levantado} kg</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal para Registrar Biometría */}
      {mostrarModalBiometria && createPortal(
        <div className="modal-pantalla">
          <div className="tarjeta-vidrio modal-contenido animacion-aparicion" style={{ maxWidth: '450px' }}>
            <div className="modal-cabecera">
              <h3>Registrar Datos Biométricos</h3>
              <button onClick={() => setMostrarModalBiometria(false)} className="btn-cerrar">✕</button>
            </div>

            <form onSubmit={manejarAgregarBiometria}>
              <div className="fila-inputs">
                <div className="input-grupo">
                  <label>Peso (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input-control"
                    placeholder="75.5"
                    value={peso}
                    onChange={(e) => setPeso(e.target.value)}
                    required
                  />
                </div>
                <div className="input-grupo">
                  <label>Altura (cm) *</label>
                  <input
                    type="number"
                    className="input-control"
                    placeholder="175"
                    value={altura}
                    onChange={(e) => setAltura(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="fila-inputs">
                <div className="input-grupo">
                  <label>% Grasa Corporal</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input-control"
                    placeholder="15.2"
                    value={porcentajeGrasa}
                    onChange={(e) => setPorcentajeGrasa(e.target.value)}
                  />
                </div>
                <div className="input-grupo">
                  <label>% Masa Muscular</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input-control"
                    placeholder="42.5"
                    value={porcentajeMusculo}
                    onChange={(e) => setPorcentajeMusculo(e.target.value)}
                  />
                </div>
              </div>

              {/* Accordion de Perímetros Detallados */}
              <div className="accordion-perimetros">
                <button 
                  type="button" 
                  className="btn-accordion"
                  onClick={() => setMostrarPerimetros(!mostrarPerimetros)}
                >
                  <span>{mostrarPerimetros ? '▼' : '▶'} Perímetros Detallados (Opcionales)</span>
                </button>
                
                {mostrarPerimetros && (
                  <div className="contenido-accordion animacion-aparicion">
                    <div className="input-grupo">
                      <label>Cintura (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="input-control"
                        placeholder="Ej: 84"
                        value={cintura}
                        onChange={(e) => setCintura(e.target.value)}
                      />
                    </div>
                    <div className="input-grupo">
                      <label>Pecho (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="input-control"
                        placeholder="Ej: 105"
                        value={pecho}
                        onChange={(e) => setPecho(e.target.value)}
                      />
                    </div>
                    <div className="input-grupo">
                      <label>Cadera (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="input-control"
                        placeholder="Ej: 90"
                        value={cadera}
                        onChange={(e) => setCadera(e.target.value)}
                      />
                    </div>
                    <div className="fila-inputs">
                      <div className="input-grupo flex-1">
                        <label>Bícep Izq. (cm)</label>
                        <input
                          type="number"
                          step="0.1"
                          className="input-control"
                          placeholder="Ej: 35"
                          value={bicepIzq}
                          onChange={(e) => setBicepIzq(e.target.value)}
                        />
                      </div>
                      <div className="input-grupo flex-1">
                        <label>Bícep Der. (cm)</label>
                        <input
                          type="number"
                          step="0.1"
                          className="input-control"
                          placeholder="Ej: 35.5"
                          value={bicepDer}
                          onChange={(e) => setBicepDer(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="fila-inputs">
                      <div className="input-grupo flex-1">
                        <label>Muslo Izq. (cm)</label>
                        <input
                          type="number"
                          step="0.1"
                          className="input-control"
                          placeholder="Ej: 60"
                          value={musloIzq}
                          onChange={(e) => setMusloIzq(e.target.value)}
                        />
                      </div>
                      <div className="input-grupo flex-1">
                        <label>Muslo Der. (cm)</label>
                        <input
                          type="number"
                          step="0.1"
                          className="input-control"
                          placeholder="Ej: 60.5"
                          value={musloDer}
                          onChange={(e) => setMusloDer(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-acciones">
                <button
                  type="button"
                  onClick={() => setMostrarModalBiometria(false)}
                  className="btn btn-secundario"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primario">
                  Guardar Mediciones
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .boton-volver {
          margin-bottom: 20px;
        }

        /* Errores de Validación */
        .alerta-validacion {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-left: 4px solid var(--color-peligro);
          padding: 15px;
          margin-top: 15px;
          margin-bottom: 20px;
          border-radius: 6px;
          color: #fca5a5;
        }

        .lista-errores-validacion {
          margin-top: 10px;
          margin-bottom: 0;
          padding-left: 20px;
          font-size: 0.9rem;
        }

        .lista-errores-validacion li {
          color: #fca5a5;
          font-size: 0.9rem;
        }

        .lista-errores-validacion li {
          margin-bottom: 4px;
        }

        /* Ejercicios no habilitados en vista del profesor */
        .ej-no-habilitado-fila td {
          opacity: 0.55;
          background: rgba(239, 68, 68, 0.04);
        }

        .badge-no-habilitado-prof {
          display: inline-block;
          font-size: 0.65rem;
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
          border-radius: 4px;
          padding: 2px 6px;
          margin-left: 8px;
          vertical-align: middle;
        }

        .perfil-cabecera {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 24px;
        }

        .perfil-cabecera-info {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          border-bottom: 1px solid var(--color-borde);
          padding-bottom: 15px;
        }

        .avatar-alumno {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-primario), #312e81);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.2rem;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }

        .avatar-alumno.grande {
          width: 70px;
          height: 70px;
          font-size: 1.6rem;
        }

        .datos-contacto {
          display: flex;
          gap: 15px;
          font-size: 0.85rem;
          color: var(--color-texto-secundario);
          margin-top: 6px;
          flex-wrap: wrap;
        }

        .ficha-medica-contenido {
          font-size: 0.95rem;
        }

        .bloque-ficha {
          margin-bottom: 12px;
        }

        .bloque-ficha strong {
          color: var(--color-texto-secundario);
          display: block;
          margin-bottom: 4px;
        }

        .alerta-salud {
          color: #fca5a5;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 8px;
          padding: 8px 12px;
          display: inline-block;
        }

        .sin-alerta {
          color: var(--color-texto-desvanecido);
          font-style: italic;
        }

        .btn-editar-ficha {
          margin-top: 10px;
          font-size: 0.85rem;
        }

        .ficha-edicion-formulario {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .fila-inputs {
          display: flex;
          gap: 15px;
        }

        .fila-inputs .input-grupo {
          flex: 1;
        }

        .ficha-acciones {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 10px;
        }

        .seccion-rutina-planificador,
        .seccion-biometria-datos,
        .seccion-historial-entrenamientos {
          margin-bottom: 24px;
        }

        .cabecera-bloque-rutina,
        .cabecera-bloque-biometria {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .sin-rutina-alerta {
          color: var(--color-texto-desvanecido);
          font-style: italic;
          font-size: 0.9rem;
        }

        .nombre-rutina-activa {
          font-size: 0.9rem;
        }

        /* Diseñador de Rutina */
        .creador-cabecera {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--color-borde);
          padding-bottom: 15px;
          margin-bottom: 20px;
        }

        .creador-cabecera-actions {
          display: flex;
          gap: 10px;
        }

        .fila-inputs-rutina {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
        }

        .flex-2 { flex: 2; }
        .flex-3 { flex: 3; }

        .dias-lista {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .creador-dia-tarjeta {
          background: rgba(13, 17, 28, 0.5);
          border: 1px solid var(--color-borde);
          border-radius: var(--radio-esquina);
          padding: 20px;
        }

        .icono-agregar {
          width: 2em;
          height: 2em;
        }

        .dia-tarjeta-cabecera {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .input-nombre-dia {
          max-width: 200px;
          font-weight: 700;
        }

        .btn-eliminar-dia, .btn-eliminar-ej {
          background: none;
          border: none;
          color: var(--color-texto-secundario);
          font-size: 1.1rem;
          cursor: pointer;
        }

        .btn-eliminar-dia:hover, .btn-eliminar-ej:hover {
          color: var(--color-peligro);
        }

        .tabla-ejercicios-creador {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
          font-size: 0.9rem;
        }

        .tabla-ejercicios-creador th {
          text-align: left;
          padding: 8px;
          color: var(--color-texto-secundario);
          border-bottom: 1px solid var(--color-borde);
        }

        .tabla-ejercicios-creador td {
          padding: 8px;
          border-bottom: 1px solid var(--color-borde);
        }

        .input-control-tabla {
          width: 100%;
          background: rgba(0,0,0,0.3);
          border: 1px solid var(--color-borde);
          border-radius: 6px;
          padding: 6px 10px;
          color: white;
        }

        .agregar-ejercicio-control {
          max-width: 280px;
        }

        .btn-agregar-dia {
          align-self: flex-start;
        }

        /* Vista Rutina Activa */
        .rutina-vista-detalles {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-top: 20px;
        }

        .rutina-vista-dia {
          border-top: 1px solid var(--color-borde);
          padding-top: 15px;
        }

        .rutina-vista-dia h4 {
          margin-bottom: 10px;
          color: #a5b4fc;
        }

        .grupo-muscular-etiqueta {
          display: block;
          font-size: 0.75rem;
          color: var(--color-texto-secundario);
          font-weight: 400;
        }

        /* Historial */
        .sin-sesiones {
          color: var(--color-texto-desvanecido);
          font-style: italic;
          font-size: 0.9rem;
        }

        .historial-lista {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-top: 15px;
        }

        .sesion-tarjeta-historial {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--color-borde);
          border-radius: var(--radio-boton);
          padding: 15px;
        }

        .sesion-historial-cabecera {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .fecha-sesion {
          font-size: 0.78rem;
          color: var(--color-texto-secundario);
        }

        .notas-sesion-historial {
          font-size: 0.85rem;
          color: var(--color-texto-secundario);
          margin-bottom: 10px;
          background: rgba(0,0,0,0.15);
          padding: 6px 10px;
          border-radius: 6px;
        }

        .series-resumen-historial h5 {
          font-size: 0.85rem;
          color: var(--color-texto-secundario);
          margin-bottom: 6px;
        }

        .grilla-series-historial {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
          gap: 6px;
        }

        .item-serie-historial {
          background: rgba(0,0,0,0.2);
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 0.8rem;
          display: flex;
          flex-direction: column;
        }

        .item-serie-historial .ej-nombre {
          font-weight: 600;
        }
        
        .item-serie-historial .ej-valores {
          color: #34d399;
          font-size: 0.75rem;
        }

        @media (max-width: 768px) {
          .fila-inputs {
            flex-direction: column;
            gap: 10px;
          }
          .fila-inputs-rutina {
            flex-direction: column;
            gap: 10px;
          }
        }

        .accordion-perimetros {
          margin-top: 15px;
          margin-bottom: 15px;
          border: 1px solid var(--color-borde);
          border-radius: var(--radio-esquina);
          overflow: hidden;
        }

        .btn-accordion {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: none;
          padding: 12px 15px;
          text-align: left;
          color: #a5b4fc;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.9rem;
          transition: background 0.2s;
        }

        .btn-accordion:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .contenido-accordion {
          padding: 15px;
          background: rgba(0, 0, 0, 0.2);
          border-top: 1px solid var(--color-borde);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .tooltip-contenedor {
          position: relative;
          display: inline-block;
          cursor: help;
        }

        .icono-perimetros {
          background: rgba(255,255,255,0.05);
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.85rem;
          color: #a5b4fc;
        }

        .tooltip-texto {
          visibility: hidden;
          width: 160px;
          background-color: rgba(13, 17, 28, 0.95);
          color: #fff;
          text-align: left;
          border-radius: 8px;
          padding: 10px;
          position: absolute;
          z-index: 10;
          top: 50%;
          right: 100%;
          transform: translateY(-50%);
          margin-right: 10px;
          opacity: 0;
          transition: opacity 0.3s;
          border: 1px solid var(--color-borde);
          box-shadow: 0 4px 15px rgba(0,0,0,0.5);
          white-space: pre-line;
          font-size: 0.8rem;
          line-height: 1.4;
        }

        .tooltip-contenedor:hover .tooltip-texto {
          visibility: visible;
          opacity: 1;
        }
      `}</style>
    </div>
  );
};
