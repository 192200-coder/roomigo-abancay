// Carga datos de demostración realistas de Abancay usando la API de RoomiGo.
//
// Requisitos: backend corriendo en http://localhost:8081 y api/.env con
// APP_ADMIN_INITIAL_EMAIL y APP_ADMIN_INITIAL_PASSWORD (para aprobar publicaciones).
// Uso (desde la raíz del repo):  node scripts/datos-demo.mjs
//
// Se puede ejecutar varias veces: no duplica usuarios, inmuebles, publicaciones ni reservas.
// Todas las cuentas usan correos @roomix.test y la contraseña Demo12345!
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const API = process.env.ROOMIGO_API || 'http://localhost:8081/api/v1';
const CLAVE = 'Demo12345!';

const env = Object.fromEntries(fs.readFileSync(path.join(RAIZ, 'api', '.env'), 'utf8').split(/\r?\n/)
  .filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]));

const resumen = { cuentasNuevas: 0, inmuebles: 0, publicaciones: 0, aprobadas: 0, reservas: 0, resenas: 0 };
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
const FOTOS = ['/images/landing/room-a.jpg', '/images/landing/room-b.jpg', '/images/landing/room-c.jpg',
  '/images/landing/hero-room.jpg', '/figma/auth/login-room.jpeg'];

// ------------------------------------------------------------------ datos
// Tipos: SINGLE = cuarto (estudiantes) · DOUBLE = minidepartamento (parejas)
//        SUITE = departamento (familias) · SHARED = cuarto compartido
const PROPIETARIOS = [
  { nombre: 'Luis', apellido: 'Quispe Mamani', email: 'luis.quispe@roomix.test', tel: '+51984221730', inmuebles: [
    { titulo: 'Casa Las Américas', dir: 'Av. Las Américas 455', zona: 'Las Américas', lat: -13.6392, lng: -72.8853, desc: 'Cerca a la UTEA y a paraderos de combis.', cuartos: [
      ['Cuarto cerca a la UTEA', 'SINGLE', 320, 150, 12, { desc: 'A tres cuadras de la UTEA, con escritorio y ropero.' }],
      ['Cuarto con baño propio · Las Américas', 'SINGLE', 420, 250, 15, { privateBathroom: true, desc: 'Baño privado y terma eléctrica.' }],
      ['Cuarto compartido para dos estudiantes', 'SHARED', 200, 100, 18, { capacity: 2, desc: 'Dos camas, precio por persona.' }],
    ] },
    { titulo: 'Residencial Bellavista', dir: 'Jr. Bellavista 128', zona: 'Bellavista', lat: -13.6331, lng: -72.8771, desc: 'Zona residencial tranquila con vista a la ciudad.', cuartos: [
      ['Minidepartamento amoblado en Bellavista', 'DOUBLE', 650, 400, 30, { capacity: 2, privateBathroom: true, desc: 'Dormitorio, sala-comedor y cocina equipada.' }],
      ['Departamento de 3 dormitorios · Bellavista', 'SUITE', 1250, 1000, 90, { capacity: 5, privateBathroom: true, acceptsPets: true, desc: 'Tres dormitorios, dos baños y patio. Ideal para familias.' }],
    ] },
  ] },
  { nombre: 'Carmen', apellido: 'Ayquipa Huillca', email: 'carmen.ayquipa@roomix.test', tel: '+51973118452', inmuebles: [
    { titulo: 'Casa Condebamba', dir: 'Av. Condebamba 702', zona: 'Condebamba', lat: -13.6455, lng: -72.8902, desc: 'Casa familiar con jardín.', cuartos: [
      ['Cuarto amplio con jardín · Condebamba', 'SINGLE', 300, 150, 16, { acceptsPets: true, desc: 'Acceso a jardín y lavandería.' }],
      ['Minidepartamento para pareja · Condebamba', 'DOUBLE', 580, 300, 28, { capacity: 2, privateBathroom: true, desc: 'Entrada independiente y cocina propia.' }],
      ['Cuarto económico para estudiante', 'SINGLE', 230, 100, 10, { offersWifi: false, desc: 'Cuarto sencillo, ideal para quien busca ahorrar.' }],
    ] },
  ] },
  { nombre: 'Jorge', apellido: 'Huamán Taype', email: 'jorge.huaman@roomix.test', tel: '+51962334190', inmuebles: [
    { titulo: 'Edificio Plaza de Armas', dir: 'Jr. Arequipa 210', zona: 'Centro', lat: -13.6355, lng: -72.8812, desc: 'A una cuadra de la Plaza de Armas.', cuartos: [
      ['Cuarto en pleno Centro de Abancay', 'SINGLE', 400, 200, 13, { desc: 'Cerca a bancos, mercado y transporte.' }],
      ['Minidepartamento frente al parque', 'DOUBLE', 780, 500, 34, { capacity: 2, privateBathroom: true, desc: 'Vista al parque, con kitchenette y balcón.' }],
      ['Departamento ejecutivo de 2 dormitorios', 'SUITE', 1350, 1000, 75, { capacity: 4, privateBathroom: true, desc: 'Ideal para familias o profesionales.' }],
    ] },
    { titulo: 'Casa Pueblo Joven Centenario', dir: 'Psje. Los Andes 145', zona: 'Pueblo Joven Centenario', lat: -13.6301, lng: -72.8745, desc: 'Barrio tranquilo, cerca al hospital.', cuartos: [
      ['Cuarto cerca al Hospital Guillermo Díaz de la Vega', 'SINGLE', 330, 150, 12, { desc: 'Ideal para internos y personal de salud.' }],
      ['Cuarto con terma solar · Centenario', 'SINGLE', 350, 200, 14, { desc: 'Agua caliente con terma solar.' }],
    ] },
  ] },
  { nombre: 'Maribel', apellido: 'Sarmiento Ccahua', email: 'maribel.sarmiento@roomix.test', tel: '+51951447803', inmuebles: [
    { titulo: 'Casa Illanya', dir: 'Av. Illanya 330', zona: 'Illanya', lat: -13.6211, lng: -72.8866, desc: 'Zona alta con aire limpio y vista al Ampay.', cuartos: [
      ['Cuarto con vista al nevado · Illanya', 'SINGLE', 280, 150, 14, { acceptsPets: true, desc: 'Ventana amplia con vista al Ampay.' }],
      ['Departamento familiar con cochera · Illanya', 'SUITE', 1100, 800, 85, { capacity: 5, privateBathroom: true, acceptsPets: true, desc: 'Tres dormitorios, cochera y terraza.' }],
    ] },
    { titulo: 'Casa Patibamba Baja', dir: 'Jr. Patibamba 520', zona: 'Patibamba', lat: -13.6389, lng: -72.8795, desc: 'Cerca al Estadio Condebamba y a mercados.', cuartos: [
      ['Cuarto para deportista · Patibamba', 'SINGLE', 310, 150, 13, { desc: 'A pasos del complejo deportivo.' }],
      ['Minidepartamento nuevo en Patibamba', 'DOUBLE', 700, 400, 32, { capacity: 2, privateBathroom: true, desc: 'Construcción nueva, acabados modernos.' }],
    ] },
  ] },
  { nombre: 'Wilber', apellido: 'Pumacayo Soto', email: 'wilber.pumacayo@roomix.test', tel: '+51940775216', inmuebles: [
    { titulo: 'Residencia Universitaria Tamburco', dir: 'Av. Panamericana 1480', zona: 'Tamburco', lat: -13.6195, lng: -72.8698, desc: 'Residencia para estudiantes de la UNAMBA.', cuartos: [
      ['Cuarto en residencia universitaria', 'SINGLE', 260, 100, 11, { desc: 'Sala de estudio compartida y wifi de fibra.' }],
      ['Cuarto compartido UNAMBA (2 camas)', 'SHARED', 180, 80, 16, { capacity: 2, desc: 'Precio por persona, a 5 minutos del campus.' }],
      ['Cuarto con baño propio cerca a la UNAMBA', 'SINGLE', 380, 200, 14, { privateBathroom: true, desc: 'Baño privado y escritorio amplio.' }],
      ['Minidepartamento para estudiantes de posgrado', 'DOUBLE', 600, 300, 26, { capacity: 2, privateBathroom: true, desc: 'Ideal para dos estudiantes o una pareja.' }],
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

// ------------------------------------------------------------------ carga
const admin = await entrar(env.APP_ADMIN_INITIAL_EMAIL, env.APP_ADMIN_INITIAL_PASSWORD).catch(() => {
  throw new Error('No se pudo entrar como administrador: revisa APP_ADMIN_INITIAL_EMAIL / _PASSWORD en api/.env');
});

const cuartos = new Map(); // título -> { id, token del propietario }
let foto = 0;
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
      if (!cuarto) {
        const img = FOTOS[foto++ % FOTOS.length];
        cuarto = await api('POST', '/rooms', s.accessToken, {
          propertyId: prop.id, title: titulo, description: extra.desc, pricePerMonth: precio, depositPrice: deposito,
          roomType: tipo, sizeSqm: m2, capacity: extra.capacity || 1, privateBathroom: !!extra.privateBathroom,
          offersWifi: extra.offersWifi !== false, acceptsPets: !!extra.acceptsPets, mainImageUrl: img, imageUrls: [img],
        });
        resumen.publicaciones++;
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

console.log('Datos demo cargados:', resumen);
console.log('Cuentas: *@roomix.test · contraseña', CLAVE);
