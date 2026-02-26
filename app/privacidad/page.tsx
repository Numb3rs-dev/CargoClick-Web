import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Política de Privacidad – CargoClick',
  description: 'Política de privacidad y uso de datos de CargoClick.',
  robots: { index: false, follow: false },
};

export default function PrivacidadPage() {
  const fechaActualizacion = '26 de febrero de 2026';

  return (
    <>
      <Header />
      <main style={{ background: '#F5F7FA', minHeight: '100vh', paddingTop: '40px', paddingBottom: '80px' }}>
        <div
          style={{ maxWidth: '800px', margin: '0 auto', background: '#FFFFFF', borderRadius: '12px', padding: '48px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          className="px-6 md:px-12"
        >
          <h1 style={{ color: '#0B3D91', fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
            Política de Privacidad
          </h1>
          <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '40px' }}>
            Última actualización: {fechaActualizacion}
          </p>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#1E3A5F', fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
              1. Responsable del tratamiento
            </h2>
            <p style={{ color: '#374151', lineHeight: '1.8', fontSize: '15px' }}>
              <strong>CargoClick</strong>, operado por <strong>Transportes Nuevo Mundo S.A.S.</strong> (NIT 830068506-9),
              con domicilio en Bogotá, Colombia, es responsable del tratamiento de los datos personales
              recopilados a través del sitio web <strong>cargoclick.com.co</strong>.
            </p>
            <p style={{ color: '#374151', lineHeight: '1.8', fontSize: '15px', marginTop: '8px' }}>
              Contacto: <a href="mailto:info@cargoclick.com.co" style={{ color: '#0B3D91' }}>info@cargoclick.com.co</a>
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#1E3A5F', fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
              2. Datos que recopilamos
            </h2>
            <p style={{ color: '#374151', lineHeight: '1.8', fontSize: '15px', marginBottom: '12px' }}>
              Recopilamos los siguientes datos cuando usted utiliza nuestro sitio:
            </p>
            <ul style={{ color: '#374151', lineHeight: '2', fontSize: '15px', paddingLeft: '24px' }}>
              <li><strong>Datos de cotización:</strong> nombre, empresa, teléfono, correo electrónico, origen y destino del servicio, tipo de carga y peso.</li>
              <li><strong>Datos de navegación:</strong> dirección IP, tipo de dispositivo, páginas visitadas, tiempo de visita, fuente de tráfico (mediante Google Analytics).</li>
              <li><strong>Datos de autenticación:</strong> correo electrónico y contraseña (gestionados por Clerk, proveedor externo de autenticación).</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#1E3A5F', fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
              3. Finalidad del tratamiento
            </h2>
            <ul style={{ color: '#374151', lineHeight: '2', fontSize: '15px', paddingLeft: '24px' }}>
              <li>Gestionar y responder solicitudes de cotización de transporte de carga.</li>
              <li>Contactar al solicitante para coordinar el servicio.</li>
              <li>Analizar el uso del sitio web para mejorar la experiencia del usuario (Google Analytics).</li>
              <li>Cumplir con obligaciones legales y regulatorias aplicables en Colombia.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#1E3A5F', fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
              4. Cookies y tecnologías de seguimiento
            </h2>
            <p style={{ color: '#374151', lineHeight: '1.8', fontSize: '15px', marginBottom: '12px' }}>
              Este sitio utiliza cookies y tecnologías similares para los siguientes fines:
            </p>
            <ul style={{ color: '#374151', lineHeight: '2', fontSize: '15px', paddingLeft: '24px' }}>
              <li><strong>Cookies de sesión (Clerk):</strong> necesarias para mantener su sesión iniciada. Sin estas cookies el sitio no funciona correctamente.</li>
              <li><strong>Cookies de analítica (Google Analytics):</strong> recopilan información anónima sobre cómo los visitantes usan el sitio. Puede conocer más en <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#0B3D91' }}>policies.google.com/privacy</a>.</li>
            </ul>
            <p style={{ color: '#374151', lineHeight: '1.8', fontSize: '15px', marginTop: '12px' }}>
              Puede deshabilitar las cookies en la configuración de su navegador. Tenga en cuenta que esto puede afectar el funcionamiento del sitio.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#1E3A5F', fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
              5. Compartición de datos con terceros
            </h2>
            <p style={{ color: '#374151', lineHeight: '1.8', fontSize: '15px', marginBottom: '12px' }}>
              Sus datos pueden ser compartidos con los siguientes terceros únicamente para los fines descritos:
            </p>
            <ul style={{ color: '#374151', lineHeight: '2', fontSize: '15px', paddingLeft: '24px' }}>
              <li><strong>Google Analytics (Google LLC):</strong> análisis de tráfico web anónimo.</li>
              <li><strong>Clerk Inc.:</strong> gestión de autenticación y sesiones de usuario.</li>
              <li><strong>Railway (Railway Corp.):</strong> alojamiento de la aplicación en servidores en la nube.</li>
            </ul>
            <p style={{ color: '#374151', lineHeight: '1.8', fontSize: '15px', marginTop: '12px' }}>
              No vendemos ni cedemos sus datos personales a terceros con fines comerciales o publicitarios.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#1E3A5F', fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
              6. Base legal — Ley 1581 de 2012 (Colombia)
            </h2>
            <p style={{ color: '#374151', lineHeight: '1.8', fontSize: '15px' }}>
              El tratamiento de sus datos personales se realiza con base en su <strong>consentimiento expreso</strong>
              al enviar el formulario de cotización, y en el <strong>cumplimiento de la relación contractual</strong>
              derivada de la prestación del servicio de transporte de carga. Cumplimos con la Ley Estatutaria
              1581 de 2012 y el Decreto 1377 de 2013 sobre Protección de Datos Personales en Colombia.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#1E3A5F', fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
              7. Sus derechos
            </h2>
            <p style={{ color: '#374151', lineHeight: '1.8', fontSize: '15px', marginBottom: '12px' }}>
              De acuerdo con la Ley 1581 de 2012, usted tiene derecho a:
            </p>
            <ul style={{ color: '#374151', lineHeight: '2', fontSize: '15px', paddingLeft: '24px' }}>
              <li><strong>Conocer</strong> los datos personales que tenemos sobre usted.</li>
              <li><strong>Actualizar y rectificar</strong> sus datos cuando sean inexactos o incompletos.</li>
              <li><strong>Solicitar la supresión</strong> de sus datos cuando no sean necesarios para la finalidad para la que fueron recopilados.</li>
              <li><strong>Revocar su consentimiento</strong> al tratamiento de datos.</li>
              <li><strong>Presentar quejas</strong> ante la Superintendencia de Industria y Comercio (SIC).</li>
            </ul>
            <p style={{ color: '#374151', lineHeight: '1.8', fontSize: '15px', marginTop: '12px' }}>
              Para ejercer estos derechos, escríbanos a{' '}
              <a href="mailto:info@cargoclick.com.co" style={{ color: '#0B3D91' }}>info@cargoclick.com.co</a>.
              Responderemos en un plazo máximo de 10 días hábiles.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#1E3A5F', fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
              8. Retención de datos
            </h2>
            <p style={{ color: '#374151', lineHeight: '1.8', fontSize: '15px' }}>
              Los datos de cotización se conservan durante el tiempo necesario para gestionar el servicio
              solicitado y cumplir con las obligaciones legales aplicables (mínimo 5 años según normativa
              comercial colombiana). Los datos de analítica web se retienen según la configuración de
              Google Analytics (por defecto, 14 meses).
            </p>
          </section>

          <section>
            <h2 style={{ color: '#1E3A5F', fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
              9. Cambios a esta política
            </h2>
            <p style={{ color: '#374151', lineHeight: '1.8', fontSize: '15px' }}>
              Nos reservamos el derecho de actualizar esta política. Cualquier cambio significativo
              será notificado a través del sitio web. Le recomendamos revisar esta página periódicamente.
            </p>
          </section>

        </div>
      </main>
      <Footer />
    </>
  );
}
