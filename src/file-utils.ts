export function attachmentHref(name: string): string {
  const base = import.meta.env.BASE_URL;
  if (/\.(xlsx|xls|csv)$/i.test(name)) return `${base}samples/education-sample.xlsx`;
  if (/\.(docx|doc)$/i.test(name)) return `${base}samples/education-sample.docx`;
  if (/\.(svg|png|jpg|jpeg)$/i.test(name)) return `${base}samples/campus-poster.svg`;
  return `${base}samples/education-sample.pdf`;
}
