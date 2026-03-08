export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-red-900/50 p-8 rounded-2xl shadow-2xl shadow-red-900/20 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-red-900"></div>
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-red-600 rounded-full blur-3xl opacity-10 pointer-events-none"></div>
        
        {children}
      </div>
    </div>
  );
}
