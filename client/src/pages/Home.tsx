import { motion } from "framer-motion";
import ChatWidget from "@/components/chat/ChatWidget";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary/20">
      
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-200/50 rounded-full blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-200/50 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-3xl space-y-6"
        >
          <div className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
             AI Powered Concierge
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground">
            Navigation Made <span className="text-primary">Simple.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Experience our new bilingual chat assistant. Ask for directions, shops, or facilities in English or Bisaya.
          </p>
          
          <div className="pt-8 flex gap-4 justify-center">
             <a href="/admin" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors underline underline-offset-4">
                Go to Admin Dashboard &rarr;
             </a>
          </div>
        </motion.div>

        {/* Mock Content to show scrolling */}
        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.5, duration: 1 }}
           className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl text-left"
        >
          {[
            { title: "Bilingual Support", desc: "Seamlessly switches between English and Bisaya for local context." },
            { title: "Interactive Maps", desc: "Visual guidance with dynamic map overlays highlighting your destination." },
            { title: "Voice Enabled", desc: "Just speak naturally to get directions hands-free." }
          ].map((feature, i) => (
            <div key={i} className="p-6 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </motion.div>

      </main>

      <ChatWidget />
    </div>
  );
}
