import { build } from "esbuild";

const runBuild = async () => {
  try {
    await build({
      entryPoints: ["./app.ts"], // File TypeScript di ingresso
      bundle: true,                // Crea un unico bundle
      outfile: "dist/app.js",      // File di output
      platform: "node",            // Target: ambiente Node.js
      target: "es2022",            // Versione JS supportata
      sourcemap: false,             // Genera una sourcemap per il debug
      minify: true,                // Minimizza il file per la produzione
      format: "cjs",
      allowOverwrite: true,
      
    });
    console.log("Build completata con successo!");
  } catch (error) {
    console.error("Errore durante la build:", error);
    process.exit(1);
  }
};

runBuild();

export { runBuild }