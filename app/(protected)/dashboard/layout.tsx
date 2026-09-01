export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // The protected AppShell already provides the outer padding and sidebar offset.
  // Keep this layout padding-free so dashboard pages align with the navbar.
  return <>{children}</>;
}
