import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F3F4F6',
      }}
    >
      <SignIn
        appearance={{
          elements: {
            // Oculta el footer con el enlace "¿No tienes cuenta? Regístrate"
            footer: { display: 'none' },
          },
        }}
      />
    </main>
  )
}
