import { redirect } from 'next/navigation'

// The middleware handles locale detection and redirects automatically.
// This page is a fallback for the root path.
export default function RootPage() {
  redirect('/en')
}
