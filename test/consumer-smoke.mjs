import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

const packageRoot = join(import.meta.dirname, "..");
const packageJson = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
const temporaryRoot = await mkdtemp(join(tmpdir(), "mutsuna-ui-consumer-"));
const packedDirectory = join(temporaryRoot, "packed");
const consumerDirectory = join(temporaryRoot, "consumer");

function run(command, args, cwd) {
  execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: "inherit",
  });
}

try {
  await mkdir(packedDirectory, { recursive: true });
  await mkdir(join(consumerDirectory, "src"), { recursive: true });

  run("pnpm", ["run", "build"], packageRoot);
  const packOutput = execFileSync("npm", ["pack", "--json", "--ignore-scripts", "--pack-destination", packedDirectory], {
    cwd: packageRoot,
    encoding: "utf8",
  });
  const [{ filename }] = JSON.parse(packOutput);
  if (typeof filename !== "string") {
    throw new Error("npm pack did not return a tarball filename");
  }
  const tarballPath = join(packedDirectory, basename(filename));

  await writeFile(
    join(consumerDirectory, "package.json"),
    `${JSON.stringify(
      {
        name: "mutsuna-ui-consumer-smoke",
        private: true,
        type: "module",
        scripts: {
          build: "vite build",
        },
        dependencies: {
          "@mutsuna/ui": `file:${tarballPath}`,
        },
        devDependencies: {
          "@sveltejs/vite-plugin-svelte": packageJson.devDependencies["@sveltejs/vite-plugin-svelte"],
          "@tailwindcss/vite": packageJson.devDependencies["@tailwindcss/vite"],
          svelte: packageJson.peerDependencies.svelte,
          tailwindcss: packageJson.peerDependencies.tailwindcss,
          vite: packageJson.devDependencies.vite,
        },
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(join(consumerDirectory, "index.html"), '<div id="app"></div><script type="module" src="/src/main.ts"></script>\n');
  await writeFile(
    join(consumerDirectory, "vite.config.ts"),
    'import { svelte } from "@sveltejs/vite-plugin-svelte";\nimport tailwindcss from "@tailwindcss/vite";\nimport { defineConfig } from "vite";\n\nexport default defineConfig({ plugins: [tailwindcss(), svelte()] });\n',
  );
  await writeFile(
    join(consumerDirectory, "src/main.ts"),
    'import "@mutsuna/ui/theme.css";\nimport { mount } from "svelte";\nimport App from "./App.svelte";\n\nmount(App, { target: document.getElementById("app")! });\n',
  );
  await writeFile(
    join(consumerDirectory, "src/App.svelte"),
    `<script lang="ts">
import { Button } from "@mutsuna/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@mutsuna/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@mutsuna/ui/dialog";
</script>

<Card class="m-8 max-w-md">
  <CardHeader><CardTitle>External consumer</CardTitle></CardHeader>
  <CardContent>
    <Dialog>
      <DialogTrigger>
        {#snippet child({ props })}<Button {...props}>Open</Button>{/snippet}
      </DialogTrigger>
      <DialogContent><DialogTitle>Installed from tarball</DialogTitle></DialogContent>
    </Dialog>
  </CardContent>
</Card>
`,
  );

  run("npm", ["install", "--no-audit", "--no-fund"], consumerDirectory);
  run("npm", ["run", "build"], consumerDirectory);
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
