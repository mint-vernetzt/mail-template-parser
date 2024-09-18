import { globby } from "globby";
import { config } from "./src/config";

async function main() {
  console.log(config);

  const include = config.files.include.map((pattern) => {
    return `${config.files.baseDir}/${pattern}`;
  });
  const exclude = Array.isArray(config.files.exclude) ? config.files.exclude.map((pattern) => {
    return `!${config.files.baseDir}/${pattern}`;
  }) : [];
  
  const paths = await globby([...include, ...exclude]);

  console.log(paths);

}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
