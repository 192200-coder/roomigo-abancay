// Carga datos de demostración realistas de Abancay usando la API de RoomiGo.
//
// Requisitos: backend corriendo en http://localhost:8081 y api/.env con
// APP_ADMIN_INITIAL_EMAIL y APP_ADMIN_INITIAL_PASSWORD (para aprobar publicaciones).
// Uso (desde la raíz del repo):  node scripts/datos-demo.mjs
//
// Se puede ejecutar varias veces: no duplica usuarios, inmuebles, publicaciones, reservas ni visitas.
// Las publicaciones demo anteriores a la Fase 5 reciben sus fotos obligatorias (fachada, habitación, baño).
// Todas las cuentas usan correos @roomix.test y la contraseña Demo12345!
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const API = process.env.ROOMIGO_API || 'http://localhost:8081/api/v1';
const CLAVE = 'Demo12345!';

const env = Object.fromEntries(fs.readFileSync(path.join(RAIZ, 'api', '.env'), 'utf8').split(/\r?\n/)
  .filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]));

const resumen = { cuentasNuevas: 0, inmuebles: 0, publicaciones: 0, fotosCompletadas: 0, aprobadas: 0, reservas: 0, resenas: 0, visitas: 0 };
const esperar = ms => new Promise(r => setTimeout(r, ms));
async function api(metodo, ruta, token, cuerpo, intento = 1) {
  const r = await fetch(API + ruta, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  if (r.status === 429 && intento <= 3) { // límite de peticiones del backend: esperar y reintentar
    console.log(`  límite de peticiones alcanzado; esperando 65 s (intento ${intento}/3)...`);
    await esperar(65000);
    return api(metodo, ruta, token, cuerpo, intento + 1);
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(`${metodo} ${ruta} -> ${r.status} ${j.message || ''}`); e.status = r.status; throw e; }
  return j.data;
}
const entrar = (email, password) => api('POST', '/auth/login', null, { email, password });
/** Inicia sesión si la cuenta existe; si no, la registra (evita llamadas innecesarias al registro). */
async function cuenta(nombre, apellido, email, telefono, rol) {
  try { return await entrar(email, CLAVE); } catch (e) { if (e.status === 429) throw e; }
  await api('POST', '/auth/register', null, { firstName: nombre, lastName: apellido, email, password: CLAVE, phone: telefono, role: rol });
  resumen.cuentasNuevas++;
  return entrar(email, CLAVE);
}
const dia = n => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
// Fotos de referencia (frontend/public): habitaciones del sitio + fachadas y baños en images/demo (ver CREDITOS.md).
const HABITACIONES = ['/images/landing/room-a.jpg', '/images/landing/room-b.jpg', '/images/landing/room-c.jpg', '/images/landing/hero-room.jpg'];
const FACHADAS = ['/images/demo/fachada-1.jpg', '/images/demo/fachada-2.jpg', '/images/demo/fachada-3.jpg'];
const BANOS = ['/images/demo/bano-1.jpg', '/images/demo/bano-2.jpg', '/images/demo/bano-3.jpg'];
const SALA = '/images/landing/owner-home.jpg';
/** Fotos obligatorias (y sala en departamentos y casas). La primera es la portada del catálogo. */
function fotos(i, tipo) {
  const cuarto = { url: HABITACIONES[i % HABITACIONES.length], category: 'ROOM' };
  const fachada = { url: FACHADAS[i % FACHADAS.length], category: 'FACADE' };
  const bano = { url: BANOS[i % BANOS.length], category: 'BATHROOM' };
  return tipo === 'ROOM' ? [cuarto, bano, fachada] : [fachada, cuarto, bano, { url: SALA, category: 'LIVING_KITCHEN' }];
}

// ------------------------------------------------------------------ datos
// [título, tipo, precio, depósito, m², extra]
// Tipos: ROOM = cuarto (estudiantes) · MINI_APARTMENT = minidepartamento (parejas)
//        APARTMENT = departamento (familias) · HOUSE = casa entera
// En venta (extra.op = 'SALE'): «precio» es el precio de venta y no hay depósito.
const PROPIETARIOS = [
  { nombre: 'Luis', apellido: 'Quispe Mamani', email: 'luis.quispe@roomix.test', tel: '+51984221730', inmuebles: [
    { titulo: 'Casa Las Américas', dir: 'Av. Las Américas 455', zona: 'Las Américas', lat: -13.6392, lng: -72.8853, desc: 'Cerca a la UTEA y a paraderos de combis.', cuartos: [
      ['Cuarto cerca a la UTEA', 'ROOM', 320, 150, 12, { desc: 'A tres cuadras de la UTEA, con escritorio y ropero.' }],
      ['Cuarto con baño propio · Las Américas', 'ROOM', 420, 250, 15, { privateBathroom: true, desc: 'Baño privado y terma eléctrica.' }],
      ['Cuarto compartido para dos estudiantes', 'ROOM', 200, 100, 18, { capacity: 2, desc: 'Dos camas, precio por persona.' }],
    ] },
    { titulo: 'Residencial Bellavista', dir: 'Jr. Bellavista 128', zona: 'Bellavista', lat: -13.6331, lng: -72.8771, desc: 'Zona residencial tranquila con vista a la ciudad.', cuartos: [
      ['Minidepartamento amoblado en Bellavista', 'MINI_APARTMENT', 650, 400, 30, { capacity: 2, privateBathroom: true, desc: 'Dormitorio, sala-comedor y cocina equipada.' }],
      ['Departamento de 3 dormitorios · Bellavista', 'APARTMENT', 1250, 1000, 90, { capacity: 5, bedrooms: 3, bathrooms: 2, privateBathroom: true, acceptsPets: true, desc: 'Tres dormitorios, dos baños y patio. Ideal para familias.' }],
    ] },
    { titulo: 'Casa Villa Ampay', dir: 'Jr. Los Pinos 230', zona: 'Villa Ampay', lat: -13.6268, lng: -72.8835, desc: 'Casa propia en zona residencial al pie del Ampay.', cuartos: [
      ['Casa de 2 pisos en Villa Ampay', 'HOUSE', 285000, null, 160, { op: 'SALE', bedrooms: 4, bathrooms: 2, landAreaSqm: 200, desc: 'Casa de material noble con título de propiedad, cochera y patio. A 10 minutos del centro.' }],
    ] },
  ] },
  { nombre: 'Carmen', apellido: 'Ayquipa Huillca', email: 'carmen.ayquipa@roomix.test', tel: '+51973118452', inmuebles: [
    { titulo: 'Casa Condebamba', dir: 'Av. Condebamba 702', zona: 'Condebamba', lat: -13.6455, lng: -72.8902, desc: 'Casa familiar con jardín.', cuartos: [
      ['Cuarto amplio con jardín · Condebamba', 'ROOM', 300, 150, 16, { acceptsPets: true, desc: 'Acceso a jardín y lavandería.' }],
      ['Minidepartamento para pareja · Condebamba', 'MINI_APARTMENT', 580, 300, 28, { capacity: 2, privateBathroom: true, desc: 'Entrada independiente y cocina propia.' }],
      ['Cuarto económico para estudiante', 'ROOM', 230, 100, 10, { offersWifi: false, desc: 'Cuarto sencillo, ideal para quien busca ahorrar.' }],
      ['Departamento en venta · Condebamba', 'APARTMENT', 210000, null, 95, { op: 'SALE', bedrooms: 3, bathrooms: 2, desc: 'Segundo piso independiente, con sala-comedor amplia y lavandería.' }],
    ] },
  ] },
  { nombre: 'Jorge', apellido: 'Huamán Taype', email: 'jorge.huaman@roomix.test', tel: '+51962334190', inmuebles: [
    { titulo: 'Edificio Plaza de Armas', dir: 'Jr. Arequipa 210', zona: 'Centro', lat: -13.6355, lng: -72.8812, desc: 'A una cuadra de la Plaza de Armas.', cuartos: [
      ['Cuarto en pleno Centro de Abancay', 'ROOM', 400, 200, 13, { desc: 'Cerca a bancos, mercado y transporte.' }],
      ['Minidepartamento frente al parque', 'MINI_APARTMENT', 780, 500, 34, { capacity: 2, privateBathroom: true, desc: 'Vista al parque, con kitchenette y balcón.' }],
      ['Departamento ejecutivo de 2 dormitorios', 'APARTMENT', 1350, 1000, 75, { capacity: 4, bedrooms: 2, bathrooms: 2, privateBathroom: true, desc: 'Ideal para familias o profesionales.' }],
      ['Minidepartamento en venta cerca a la Plaza', 'MINI_APARTMENT', 135000, null, 42, { op: 'SALE', bedrooms: 1, bathrooms: 1, desc: 'Ideal para pareja o como inversión para alquilar. Edificio con portería.' }],
    ] },
    { titulo: 'Casa Pueblo Joven Centenario', dir: 'Psje. Los Andes 145', zona: 'Pueblo Joven Centenario', lat: -13.6301, lng: -72.8745, desc: 'Barrio tranquilo, cerca al hospital.', cuartos: [
      ['Cuarto cerca al Hospital Guillermo Díaz de la Vega', 'ROOM', 330, 150, 12, { desc: 'Ideal para internos y personal de salud.' }],
      ['Cuarto con terma solar · Centenario', 'ROOM', 350, 200, 14, { desc: 'Agua caliente con terma solar.' }],
    ] },
  ] },
  { nombre: 'Maribel', apellido: 'Sarmiento Ccahua', email: 'maribel.sarmiento@roomix.test', tel: '+51951447803', inmuebles: [
    { titulo: 'Casa Illanya', dir: 'Av. Illanya 330', zona: 'Illanya', lat: -13.6211, lng: -72.8866, desc: 'Zona alta con aire limpio y vista al Ampay.', cuartos: [
      ['Cuarto con vista al nevado · Illanya', 'ROOM', 280, 150, 14, { acceptsPets: true, desc: 'Ventana amplia con vista al Ampay.' }],
      ['Departamento familiar con cochera · Illanya', 'APARTMENT', 1100, 800, 85, { capacity: 5, bedrooms: 3, bathrooms: 2, privateBathroom: true, acceptsPets: true, desc: 'Tres dormitorios, cochera y terraza.' }],
      ['Casa entera en alquiler · Illanya', 'HOUSE', 1800, 1800, 150, { capacity: 6, bedrooms: 4, bathrooms: 3, privateBathroom: true, acceptsPets: true, desc: 'Casa completa de dos pisos con jardín, para familias grandes.' }],
    ] },
    { titulo: 'Casa Patibamba Baja', dir: 'Jr. Patibamba 520', zona: 'Patibamba', lat: -13.6389, lng: -72.8795, desc: 'Cerca al Estadio Condebamba y a mercados.', cuartos: [
      ['Cuarto para deportista · Patibamba', 'ROOM', 310, 150, 13, { desc: 'A pasos del complejo deportivo.' }],
      ['Minidepartamento nuevo en Patibamba', 'MINI_APARTMENT', 700, 400, 32, { capacity: 2, privateBathroom: true, desc: 'Construcción nueva, acabados modernos.' }],
    ] },
  ] },
  { nombre: 'Wilber', apellido: 'Pumacayo Soto', email: 'wilber.pumacayo@roomix.test', tel: '+51940775216', inmuebles: [
    { titulo: 'Residencia Universitaria Tamburco', dir: 'Av. Panamericana 1480', zona: 'Tamburco', lat: -13.6195, lng: -72.8698, desc: 'Residencia para estudiantes de la UNAMBA.', cuartos: [
      ['Cuarto en residencia universitaria', 'ROOM', 260, 100, 11, { desc: 'Sala de estudio compartida y wifi de fibra.' }],
      ['Cuarto compartido UNAMBA (2 camas)', 'ROOM', 180, 80, 16, { capacity: 2, desc: 'Precio por persona, a 5 minutos del campus.' }],
      ['Cuarto con baño propio cerca a la UNAMBA', 'ROOM', 380, 200, 14, { privateBathroom: true, desc: 'Baño privado y escritorio amplio.' }],
      ['Minidepartamento para estudiantes de posgrado', 'MINI_APARTMENT', 600, 300, 26, { capacity: 2, privateBathroom: true, desc: 'Ideal para dos estudiantes o una pareja.' }],
    ] },
    { titulo: 'Terreno con casa · Tamburco', dir: 'Calle Las Retamas 88', zona: 'Tamburco', lat: -13.6178, lng: -72.8712, desc: 'Casa con huerto a 5 minutos de la UNAMBA.', cuartos: [
      ['Casa con huerto en Tamburco', 'HOUSE', 320000, null, 180, { op: 'SALE', bedrooms: 5, bathrooms: 3, landAreaSqm: 350, desc: 'Casa amplia con huerto frutal, ideal para familia grande o para habilitar cuartos de alquiler.' }],
    ] },
  ] },
];

const INQUILINOS = [
  { clave: 'kevin', nombre: 'Kevin', apellido: 'Tito Chalco', email: 'kevin.tito@roomix.test', tel: '+51985660123' },
  { clave: 'flor', nombre: 'Flor', apellido: 'Quispe Ramos', email: 'flor.quispe@roomix.test', tel: '+51974881209' },
  { clave: 'raul', nombre: 'Raúl', apellido: 'Mendoza Arce', email: 'raul.mendoza@roomix.test', tel: '+51963229874' },
  { clave: 'yesica', nombre: 'Yésica', apellido: 'Huarcaya León', email: 'yesica.huarcaya@roomix.test', tel: '+51952117640' },
];

// [inquilino, título del cuarto, días hasta el inicio, meses, acción del propietario, reseña]
const RESERVAS = [
  ['kevin', 'Cuarto en residencia universitaria', 6, 5, 'CONFIRMED', [5, 'Muy cerca a la universidad y el dueño es muy amable.']],
  ['flor', 'Minidepartamento frente al parque', 9, 6, 'CONFIRMED', [5, 'Excelente ubicación, todo muy limpio.']],
  ['raul', 'Departamento ejecutivo de 2 dormitorios', 12, 12, 'CONFIRMED', [4, 'Amplio y cómodo; el agua caliente tarda un poco.']],
  ['yesica', 'Cuarto cerca al Hospital Guillermo Díaz de la Vega', 4, 3, 'CONFIRMED', [5, 'Perfecto para mi internado, muy tranquilo.']],
  ['kevin', 'Cuarto con vista al nevado · Illanya', 30, 4, null, null],
  ['flor', 'Minidepartamento nuevo en Patibamba', 20, 6, null, null],
  ['raul', 'Cuarto económico para estudiante', 15, 2, 'REJECTED', null],
  ['yesica', 'Departamento familiar con cochera · Illanya', 25, 12, 'CONFIRMED', null],
];

// Pedidos de visita a publicaciones en venta: [inquilino, título, días hasta la visita, hora, respuesta del propietario]
const VISITAS = [
  ['kevin', 'Casa de 2 pisos en Villa Ampay', 3, '10:30', null],
  ['flor', 'Casa con huerto en Tamburco', 5, '16:30', 'CONFIRMED'],
];

// ------------------------------------------------------------------ carga
const admin = await entrar(env.APP_ADMIN_INITIAL_EMAIL, env.APP_ADMIN_INITIAL_PASSWORD).catch(() => {
  throw new Error('No se pudo entrar como administrador: revisa APP_ADMIN_INITIAL_EMAIL / _PASSWORD en api/.env');
});

const cuartos = new Map(); // título -> { id, token del propietario }
let foto = 0;
/** Publicación demo anterior a la Fase 5 (sin fotos categorizadas): se completa con las obligatorias. */
async function completarFotos(cuarto, token, i, tipo) {
  const detalle = await api('GET', `/rooms/${cuarto.id}`, null);
  const categorias = new Set((detalle.photos || []).map(f => f.category));
  if (['FACADE', 'ROOM', 'BATHROOM'].every(c => categorias.has(c))) return;
  await api('PUT', `/rooms/${cuarto.id}`, token, { photos: fotos(i, tipo), privateBathroom: detalle.privateBathroom,
    offersWifi: detalle.offersWifi, acceptsPets: detalle.acceptsPets });
  resumen.fotosCompletadas++;
}
for (const p of PROPIETARIOS) {
  const s = await cuenta(p.nombre, p.apellido, p.email, p.tel, 'ROLE_OWNER');
  const misInmuebles = await api('GET', '/properties/my-properties', s.accessToken);
  const misCuartos = await api('GET', '/rooms/my-rooms', s.accessToken);
  for (const inm of p.inmuebles) {
    let prop = misInmuebles.find(x => x.title === inm.titulo);
    if (!prop) {
      prop = await api('POST', '/properties', s.accessToken, { title: inm.titulo, address: `${inm.dir} (${inm.zona})`, city: 'Abancay', country: 'Perú', latitude: inm.lat, longitude: inm.lng, description: inm.desc });
      resumen.inmuebles++;
    }
    for (const [titulo, tipo, precio, deposito, m2, extra] of inm.cuartos) {
      let cuarto = misCuartos.find(x => x.title === titulo);
      const i = foto++;
      const venta = extra.op === 'SALE';
      if (!cuarto) {
        cuarto = await api('POST', '/rooms', s.accessToken, {
          propertyId: prop.id, title: titulo, description: extra.desc, operation: venta ? 'SALE' : 'RENT',
          pricePerMonth: venta ? null : precio, depositPrice: venta ? null : deposito, salePrice: venta ? precio : null,
          roomType: tipo, sizeSqm: m2, capacity: extra.capacity || 1, bedrooms: extra.bedrooms ?? null,
          bathrooms: extra.bathrooms ?? null, landAreaSqm: extra.landAreaSqm ?? null,
          privateBathroom: !!extra.privateBathroom, offersWifi: !venta && extra.offersWifi !== false,
          acceptsPets: !venta && !!extra.acceptsPets, photos: fotos(i, tipo),
        });
        resumen.publicaciones++;
      } else {
        await completarFotos(cuarto, s.accessToken, i, tipo);
      }
      if (cuarto.status === 'PENDING_APPROVAL') { await api('PATCH', `/admin/rooms/${cuarto.id}/approve`, admin.accessToken); resumen.aprobadas++; }
      cuartos.set(titulo, { id: cuarto.id, token: s.accessToken });
    }
  }
}

const inquilinos = {};
for (const t of INQUILINOS) { inquilinos[t.clave] = await cuenta(t.nombre, t.apellido, t.email, t.tel, 'ROLE_TENANT'); }

for (const [quien, titulo, inicio, meses, accion, resena] of RESERVAS) {
  const t = inquilinos[quien], c = cuartos.get(titulo);
  const mias = await api('GET', '/bookings/my-bookings', t.accessToken);
  let reserva = mias.find(b => b.room?.id === c.id);
  if (!reserva) {
    try {
      reserva = await api('POST', '/bookings', t.accessToken, { roomId: c.id, startDate: dia(inicio), months: meses, notes: 'Solicitud de demostración.' });
      resumen.reservas++;
    } catch (e) { console.warn('  reserva omitida:', titulo, '-', e.message); continue; }
  }
  if (accion && reserva.status === 'PENDING') await api('PATCH', `/bookings/${reserva.id}/status?status=${accion}`, c.token);
  if (resena && accion === 'CONFIRMED') {
    try { await api('POST', '/reviews', t.accessToken, { bookingId: reserva.id, rating: resena[0], comment: resena[1] }); resumen.resenas++; }
    catch (e) { if (e.status !== 409) throw e; }
  }
}

for (const [quien, titulo, enDias, hora, respuesta] of VISITAS) {
  const t = inquilinos[quien], c = cuartos.get(titulo);
  const mias = await api('GET', '/visit-requests/mine', t.accessToken);
  let visita = mias.find(v => v.roomId === c.id && (v.status === 'PENDING' || v.status === 'CONFIRMED'));
  if (!visita) {
    visita = await api('POST', '/visit-requests', t.accessToken, { roomId: c.id, preferredDate: dia(enDias), preferredTime: hora,
      message: 'Me interesa conocer el inmueble. ¿Podría mostrármelo?' });
    resumen.visitas++;
  }
  if (respuesta && visita.status === 'PENDING') {
    await api('PATCH', `/visit-requests/${visita.id}/status`, c.token, { status: respuesta, note: 'La espero en la puerta principal.' });
  }
}

console.log('Datos demo cargados:', resumen);
console.log('Cuentas: *@roomix.test · contraseña', CLAVE);
