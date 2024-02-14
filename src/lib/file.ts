export function download(file: File) {
  const a = document.createElement("a");
  a.download = file.name;
  a.href = URL.createObjectURL(file);
  a.click();
  URL.revokeObjectURL(a.href);
}

export function open(accept?: string) {
  const input = document.createElement("input");
  input.type = "file";

  if (accept) input.accept = accept;

  return new Promise<File[]>(resolve => {
    input.onchange = async () => resolve(Array.from(input.files || []));
    input.click();
  });
}
