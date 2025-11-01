// utils/mascaras.js

export function mascaraCPF(valor) {
  valor = valor.replace(/\D/g, "");
  valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
  valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
  valor = valor.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  return valor;
}

export function mascaraCNPJ(valor) {
  valor = valor.replace(/\D/g, "");
  valor = valor.replace(/(\d{2})(\d)/, "$1.$2");
  valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
  valor = valor.replace(/(\d{3})(\d)/, "$1/$2");
  valor = valor.replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  return valor;
}
