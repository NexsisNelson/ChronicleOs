'use client'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-dark to-slate-900">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 w-64 h-screen border-r border-slate-700 bg-slate-800/50 backdrop-blur-sm p-6 overflow-y-auto">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">DASHBOARD</h2>
        <nav className="space-y-2">
          <NavLink href="/dashboard" label="Overview" />
          <NavLink href="/dashboard/memory" label="Memory Timeline" />
          <NavLink href="/dashboard/artifacts" label="Artifact Explorer" />
          <NavLink href="/dashboard/agents" label="Agent Monitor" />
          <NavLink href="/dashboard/history" label="Execution History" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-64">
        {children}
      </main>
    </div>
  )
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="block px-3 py-2 rounded text-slate-300 hover:bg-slate-700 hover:text-white transition text-sm"
    >
      {label}
    </a>
  )
}
