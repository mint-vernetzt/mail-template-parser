import { readFile } from "node:fs/promises";
import { config } from "./config";
import handlebars from "handlebars";
import dedent from "dedent";

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
      const templateContent = await readFile(path, "utf8");
      const template = handlebars.compile(templateContent);

      const title = path.replace(config.files.baseDir, "").replace(".hbs", "");
      const data = typeof config.data !== "undefined" ? config.data : {};

      if (path.endsWith("text.hbs") || layout === null) {
        const content = template(data);
        return { path, content };
      }
      const htmlTemplate = handlebars.compile(dedent`
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
        </html>
      `);

      const layoutTemplate = handlebars.compile(layout);
      handlebars.registerPartial("body", template(data));
      const content = htmlTemplate({
        title,
        content: layoutTemplate({}),
      });
      return { path, content };
    })
  );

  return files;
}
