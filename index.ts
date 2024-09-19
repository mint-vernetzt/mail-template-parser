import { copy, outputFile } from "fs-extra";
import { globby } from "globby";
import { mkdir, rm } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { config } from "./src/config";
import { parse } from "./src/parser";

async function main() {
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

        let target;
        if (
          typeof config.files.rewrite !== "undefined" &&
          Array.isArray(config.files.rewrite.copy)
        ) {
          target = config.files.rewrite.copy.reduce((previous, current) => {
            return previous.replace(current.from, current.to);
          }, file);
        } else {
          target = file;
        }

        await copy(filePath, `public/${target}`);
      })
    );
  }

  await Promise.all(
    files.map(async (file) => {
      const filePath = relative(config.files.baseDir, file.path);

      let target;
      if (
        typeof config.files.rewrite !== "undefined" &&
        Array.isArray(config.files.rewrite.compile)
      ) {
        target = config.files.rewrite.compile.reduce((previous, current) => {
          return previous.replace(current.from, current.to);
        }, filePath);
      } else {
        target = filePath;
      }

      await outputFile(`public/${target}`, file.content);
    })
  );
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
