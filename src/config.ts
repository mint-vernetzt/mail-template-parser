import { readFileSync} from "node:fs";
import yaml from "yaml";

type Config = {
    files: {
        baseDir: string;
        include: string[];
        exclude?: string[];
        layout?: string;
    }
}

let config: Config;

try {
    const data = readFileSync(`${process.cwd()}/config.yaml`, "utf8");
    config = yaml.parse(data);
}  catch (err) {
    console.error(err);
    process.exit(1);
    
};

export { config};