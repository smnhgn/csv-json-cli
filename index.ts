import { parseArgs, log } from "./deps.ts";

interface ParsedRow {
  [header: string]: string | number;
}

const usage = `
Usage: 
  csv-json-cli -f ./sample.csv -o ./sample.json

Required:
  file: -f <csv> or --f=<csv>
  output: -o <json> or --o=<json>
Optional: 
  help: -h or --h
  separator: -s <separator> or --s=<separator> (default ",")
  pretty: -p or --p (default "false")
`;

function printHelp() {
  log.warning(usage);
}

function isNumberString(value: string): boolean {
  return /^(\d+\.)?\d+/g.test(value);
}

async function main(args: string[]) {
  const {
    h: help,
    f: file,
    o: output,
    s: separator = ",",
    p: pretty,
  } = parseArgs(args);

  if (help) {
    printHelp();
    Deno.exit();
  }

  if (typeof output !== "string" || !output.endsWith(".json")) {
    log.error("Please specify output");
    printHelp();
    Deno.exit(1);
  }

  let content;

  try {
    content = await Deno.readTextFile(file);
  } catch (error) {
    log.error(error);
    Deno.exit(1);
  }

  const [headerRow, ...rows] = content.split("\n");
  const headers = headerRow.split(separator);

  const parsedRows: ParsedRow[] = [];

  for (const row of rows) {
    const columns = row.split(separator);
    const parsedRow: ParsedRow = {};

    for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
      const columnHeader = headers[columnIndex];
      const columnData = isNumberString(columns[columnIndex])
        ? parseFloat(columns[columnIndex])
        : columns[columnIndex];

      parsedRow[columnHeader] = columnData;
    }

    parsedRows.push(parsedRow);
  }

  try {
    const json = pretty
      ? JSON.stringify(parsedRows, null, 2)
      : JSON.stringify(parsedRows);

    await Deno.writeTextFile(output, json);
  } catch (error) {
    log.error(error);
    Deno.exit(1);
  }
}

await main(Deno.args);
