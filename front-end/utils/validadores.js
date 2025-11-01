// Validadores.js

export function validarCPF(cpf) {
  cpf = cpf.replace(/[\D]/g, "");
  if (cpf.length !== 11 || /^([0-9])\1+$/.test(cpf)) return false;
  let soma = 0, resto;
  for (let i = 1; i <= 9; i++) soma += parseInt(cpf[i - 1]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf[9])) return false;
  soma = 0;
  for (let i = 1; i <= 10; i++) soma += parseInt(cpf[i - 1]) * (12 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf[10])) return false;
  return true;
}

export function validarSenha(senha) {
  // Somente letras, mínimo 6 caracteres
  return /^[A-Za-z]{6,}$/.test(senha);
}

export function validarSomenteLetras(valor) {
  return /^[A-Za-zÀ-ÿ\s]+$/.test(valor);
}
