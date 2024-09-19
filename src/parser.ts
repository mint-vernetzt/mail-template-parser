import { readFile } from "node:fs/promises";
import { config } from "./config";
import handlebars from "handlebars";

let layout: string | null = null;

export async function parse(
  path: string[]
): Promise<{ path: string; content: string }[]> {
  if (typeof config.files.layout === "string" && layout === null) {
    layout = await readFile(
      `${config.files.baseDir}/${config.files.layout}`,
      "utf8"
    );
  }

  const files = await Promise.all(
    path.map(async (path) => {
      const baseTemplate = handlebars.compile(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>{{ title }}</title>
          </head>
              <body>
                  {{{ content }}}
              </body>
          </html>`);

      const data = await readFile(path, "utf8");
      const template = handlebars.compile(data);

      const targetPath = path.replace(".hbs", ".html");
      const title = path.replace(config.files.baseDir, "").replace(".hbs", "");

      if (path.endsWith("text.hbs") || layout === null) {
        const content = baseTemplate({ title, content: template({}) });
        return { path: targetPath, content };
      }

      const layoutTemplate = handlebars.compile(layout);
      handlebars.registerPartial("body", template({}));
      const content = baseTemplate({
        title,
        content: layoutTemplate({}),
      });
      return { path: targetPath, content };
    })
  );

  console.log(files);

  return files;
}
