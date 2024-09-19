import { globby } from "globby";
import { config } from "./src/config";
import { parse } from "./src/parser";
import { mkdir, rm, appendFile, writeFile } from "node:fs/promises";
import { outputFile, copyFile, copy } from "fs-extra";
import { relative, resolve } from "node:path";

async function main() {
  console.log(config);

  const include = config.files.include.map((pattern) => {
    return `${config.files.baseDir}/${pattern}`;
  });
  const exclude = Array.isArray(config.files.exclude)
    ? config.files.exclude.map((pattern) => {
        return `!${config.files.baseDir}/${pattern}`;
      })
    : [];

  const paths = await globby([...include, ...exclude]);
  const files = await parse(paths);

  
  await rm("public", { recursive: true, force: true });
  await mkdir("public");
  
  if (Array.isArray(config.files.copy)) {
    await Promise.all(
      config.files.copy.map(async (file) => {
        const filePath = resolve(config.files.baseDir, file);
        await copy(filePath, `public/${file}`);
      })
    );
  }

  await Promise.all(
    files.map(async (file) => {
      const filePath = relative(config.files.baseDir, file.path);
      await outputFile(`public/${filePath}`, file.content);
    })
  );
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
