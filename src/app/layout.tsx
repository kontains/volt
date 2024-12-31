
// layout.tsx

export const metadata = {
  title: 'Volt',
  description: 'Coding Agent',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
