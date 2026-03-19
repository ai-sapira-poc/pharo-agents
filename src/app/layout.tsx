import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pharo Agents",
  description: "Cloud management interface for Sapira AI agents",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div className="flex h-screen">
          {/* Sidebar */}
          <aside className="w-64 border-r border-border bg-card flex flex-col">
            <div className="p-6 border-b border-border">
              <h1 className="text-xl font-bold text-primary">⚡ Pharo Agents</h1>
              <p className="text-xs text-muted-foreground mt-1">Agent Management Platform</p>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              <a href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors">
                <span>📊</span> Dashboard
              </a>
              <a href="/skills" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors">
                <span>🧠</span> Skills
              </a>
              <a href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors">
                <span>⚙️</span> Settings
              </a>
            </nav>
            <div className="p-4 border-t border-border">
              <p className="text-xs text-muted-foreground">OpenClaw Gateway</p>
              <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                Connected — localhost:18789
              </p>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
