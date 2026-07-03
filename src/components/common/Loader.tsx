import { useEffect, useState } from "react";
import { motion } from "motion/react";

const MESSAGES = [
  "Uploading source…",
  "Extracting text…",
  "Analyzing structure…",
  "Generating summary…",
];

export default function Loader() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % MESSAGES.length), 1200);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16">
      <div className="relative h-20 w-20">
        <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
        <div className="absolute inset-3 rounded-full bg-primary/10 animate-pulse-ring" />
        <div className="absolute inset-0 flex items-center justify-center font-display text-primary text-lg font-bold">
          Nº
        </div>
      </div>
      <motion.p
        key={i}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-sm text-muted-foreground"
      >
        {MESSAGES[i]}
      </motion.p>
    </div>
  );
}
