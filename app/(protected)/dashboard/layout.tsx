export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Protected layout already wraps pages with AppShell.
  // Dashboard layout should only provide page-specific containering.
  return (
    <div className="space-y-6">
      <div className="min-w-0 px-4 lg:px-8">{children}</div>
    </div>
  );
}
