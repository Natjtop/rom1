import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Replyma - AI-Powered Customer Support",
  description: "Innovating the spirit of AI support.",
}

export default function HomePage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover z-0"
      >
        <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4" type="video/mp4" />
      </video>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen w-full">
        {/* Left Panel */}
        <div className="relative w-full lg:w-[52%] p-4 lg:p-6">
          <div className="liquid-glass-strong absolute inset-4 lg:inset-6 rounded-3xl flex flex-col p-6 lg:p-10">
            {/* Nav */}
            <nav className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Logo" className="w-8 h-8" />
                <span className="font-semibold text-2xl tracking-tighter">bloom</span>
              </div>
              <button className="liquid-glass px-4 py-2 rounded-full flex items-center gap-2">
                Menu
              </button>
            </nav>

            {/* Hero */}
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <img src="/logo.png" alt="Logo" className="w-20 h-20 mb-8" />
              <h1 className="text-6xl lg:text-7xl tracking-[-0.05em] font-medium mb-8">
                Innovating the <em className="font-serif italic opacity-80">spirit</em> of bloom AI
              </h1>
              <div className="flex gap-3 mb-12">
                {["Artistic Gallery", "AI Generation", "3D Structures"].map((pill) => (
                  <button key={pill} className="liquid-glass px-4 py-2 rounded-full text-xs opacity-80">
                    {pill}
                  </button>
                ))}
              </div>
              <button className="liquid-glass-strong px-8 py-4 rounded-full flex items-center gap-3 hover:scale-105 transition-transform">
                Explore Now
                <div className="w-7 h-7 rounded-full bg-foreground/10 flex items-center justify-center">
                  {/* Download Icon */}
                </div>
              </button>
              <div className="mt-auto text-center">
                <p className="text-xs tracking-widest uppercase opacity-50 mb-2">VISIONARY DESIGN</p>
                <p className="text-xl italic font-serif">"We imagined a realm with no ending."</p>
                <p className="text-xs mt-2 opacity-70">— MARCUS AURELIO —</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="hidden lg:flex w-[48%] p-6 flex-col gap-6">
          <div className="liquid-glass px-6 py-4 rounded-full flex items-center justify-between">
            <div className="flex gap-4">
              <button className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center">Twitter</button>
              <button className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center">LinkedIn</button>
              <button className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center">Instagram</button>
            </div>
            <button className="liquid-glass px-4 py-2 rounded-full">Account</button>
          </div>
          <div className="liquid-glass p-6 rounded-3xl w-56">
            <h3 className="font-semibold">Enter our ecosystem</h3>
            <p className="text-sm opacity-70">Join the community</p>
          </div>
          <div className="mt-auto liquid-glass p-6 rounded-[2.5rem] flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="liquid-glass p-6 rounded-3xl flex-1">Processing</div>
              <div className="liquid-glass p-6 rounded-3xl flex-1">Growth Archive</div>
            </div>
            <div className="liquid-glass p-4 rounded-3xl flex items-center gap-4">
              <div className="w-24 h-16 bg-foreground/10 rounded-lg"></div>
              <div>
                <h4 className="font-semibold">Advanced Plant Sculpting</h4>
                <p className="text-sm opacity-70">Design your own</p>
              </div>
              <button className="ml-auto w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center">+</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
