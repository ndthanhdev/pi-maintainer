import Convert from "ansi_up";
const convert = new Convert();

export default function ansiToHtml(str: string) {
  return convert.ansi_to_html(str);
}
