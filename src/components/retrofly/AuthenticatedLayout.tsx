import TopNav from "@/components/retrofly/TopNav";
import AuroraBackground from "@/components/retrofly/AuroraBackground";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean;
  immersive?: boolean;
}

const AuthenticatedLayout = ({ children, fullWidth = false, immersive = false }: AuthenticatedLayoutProps) => {
  if (immersive) {
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  return (
    <div className="relative min-h-screen">
      <AuroraBackground />
      <div className="relative z-10">
        <TopNav />
        <main className={fullWidth ? "px-4 py-4 md:px-6 md:py-6" : "mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-8"}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AuthenticatedLayout;
