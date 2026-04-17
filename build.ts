import { spawnSync } from "child_process";

console.log("Building...");

const result = await Bun.build({
  entrypoints: ["src/index.ts"],
  outdir: "dist",
  target: "browser",
  external: ["react", "react-dom"],
  minify: true,
  sourcemap: "external",
});

if (!result.success) {
  console.error("Build failed");
  for (const message of result.logs) {
    console.error(message);
  }
  process.exit(1);
}

console.log("Generating declarations...");
const tscResult = spawnSync("bun", ["x", "tsc", "-p", "tsconfig.build.json"], { stdio: "inherit" });

if (tscResult.status !== 0) {
  console.error("TypeScript declaration generation failed");
  process.exit(1);
}

console.log("Build complete!");
