const validarCPF = (cpf) => {
  if (!cpf) return { valido: false, erro: "CPF é obrigatório" };

  // Remove caracteres não numéricos
  const cpfLimpo = cpf.toString().replace(/[^\d]/g, "");

  // Verifica se tem 11 dígitos
  if (cpfLimpo.length !== 11) {
    return { valido: false, erro: "CPF deve ter 11 dígitos" };
  }

  // Verifica se não é uma sequência de números iguais
  if (/^(\d)\1{10}$/.test(cpfLimpo)) {
    return {
      valido: false,
      erro: "CPF não pode ser uma sequência de números iguais",
    };
  }

  // Validação do algoritmo do CPF
  let soma = 0;
  let resto;

  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cpfLimpo.substring(i - 1, i)) * (11 - i);
  }

  resto = (soma * 10) % 11;

  if (resto === 10 || resto === 11) {
    resto = 0;
  }

  if (resto !== parseInt(cpfLimpo.substring(9, 10))) {
    return {
      valido: false,
      erro: "CPF inválido - dígitos verificadores incorretos",
    };
  }

  soma = 0;

  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cpfLimpo.substring(i - 1, i)) * (12 - i);
  }

  resto = (soma * 10) % 11;

  if (resto === 10 || resto === 11) {
    resto = 0;
  }

  if (resto !== parseInt(cpfLimpo.substring(10, 11))) {
    return {
      valido: false,
      erro: "CPF inválido - dígitos verificadores incorretos",
    };
  }

  return { valido: true, cpfLimpo };
};

const validarEmail = (email) => {
  if (!email) return { valido: false, erro: "Email é obrigatório" };
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email)) {
    return { valido: false, erro: "Email inválido" };
  }
  return { valido: true };
};

const formatarCPF = (cpf) => {
  const cpfLimpo = cpf.replace(/[^\d]/g, "");
  if (cpfLimpo.length !== 11) return cpf;
  return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

const limparCPF = (cpf) => {
  return cpf.toString().replace(/[^\d]/g, "");
};

module.exports = {
  validarCPF,
  validarEmail,
  formatarCPF,
  limparCPF,
};
