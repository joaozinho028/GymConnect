"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { Dispatch, SetStateAction, useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";

export class FormatFields {
  static formatarTelefone = (value: string) => {
    // A função formatará o telefone no formato "(99) 99999-9999"
    value = value.slice(0, 15).replace(/\D/g, "");
    value = value.replace(/^(\d{2})(\d)/, "($1) $2");
    if (value.length === 14) {
      value = value.replace(/(\d{5})(\d)/, "$1-$2");
    } else {
      value = value.replace(/(\d{4})(\d)/, "$1-$2");
    }
    return value;
  };
  static formatarDataHora(dataHora: any, format = "dd/mm/AAAA, HH:MM:SS") {
    const data = new Date(dataHora);
    if (isNaN(data.getTime())) return dataHora;
    const dia = data.getDate();
    const mes = data.getMonth() + 1;
    const ano = data.getFullYear();
    const hora = data.getHours();
    const minutos = data.getMinutes();
    const segundos = data.getSeconds();

    // Adicione zero à esquerda para dias, meses, horas e minutos menores que 10
    const diaFormatado = dia < 10 ? `0${dia}` : dia;
    const mesFormatado = mes < 10 ? `0${mes}` : mes;
    const horaFormatada = hora < 10 ? `0${hora}` : hora;
    const minutosFormatados = minutos < 10 ? `0${minutos}` : minutos;
    const segundosFormatados = segundos < 10 ? `0${segundos}` : segundos;

    format = format.replaceAll("dd", String(diaFormatado));
    format = format.replaceAll("mm", String(mesFormatado));
    format = format.replaceAll("AAAA", String(ano));
    format = format.replaceAll("HH", String(horaFormatada));
    format = format.replaceAll("MM", String(minutosFormatados));
    format = format.replaceAll("SS", String(segundosFormatados));
    return format;
  }

  static formatarDataCalendar = (date: Date) => {
    if (!(date instanceof Date)) {
      // Se 'date' não for uma instância de Date, retorne um valor vazio ou trate o erro conforme necessário
      return "";
    }

    // Obtém o dia, mês e ano da data
    const dia = date.getDate();
    const mes = date.getMonth() + 1; // Os meses em JavaScript são baseados em zero, então adicionamos 1
    const ano = date.getFullYear();

    // Formata os componentes de data para que tenham sempre dois dígitos
    const diaFormatado = String(dia).padStart(2, "0");
    const mesFormatado = String(mes).padStart(2, "0");

    // Constrói a data formatada no formato "dd/mm/aaaa"
    const dataFormatada = `${diaFormatado}/${mesFormatado}/${ano}`;
    return dataFormatada;
  };

  static formatarData = (value: string) => {
    let partes = value.split(/\/|-/);
    if (partes[0].length === 4) {
      const ano = partes[0];
      const mes = partes[1];
      const dia = partes[2];
      value = `${dia}${mes}${ano}`;
    }
    // A função formatará a data no formato "dd/mm/aaaa"
    value = value.slice(0, 10).replace(/\D/g, "");
    value = value.replace(/^(\d{2})(\d)/, "$1/$2");
    value = value.replace(/^(\d{2}\/\d{2})(\d)/, "$1/$2");
    return value;
  };

  static formatarCep = (value: string): string => {
    // A função formatará o CEP no formato "99999-999"
    value = value.slice(0, 9).replace(/\D/g, "");
    return value.replace(/^(\d{5})(\d)/, "$1-$2");
  };

  static formatarCPF = (value: string) => {
    // A função formatará o CPF no formato "999.999.999-99"
    value = value.slice(0, 14);
    if (!value.match(/^(\d{3}).(\d{3}).(\d{3})-(\d{2})$/)) {
      value = value.replace(/\D/g, "");
      value = value.replace(/(\d{3})(\d)/, "$1.$2");
      value = value.replace(/(\d{3})(\d)/, "$1.$2");
      value = value.replace(/(\d{3})(\d{1})$/, "$1-$2");
    }
    return value;
  };

  static formatarCNPJ = (value: string | undefined) => {
    if (!value) return "";

    value = value.toString();

    // Remove caracteres não numéricos
    value =
      value && value.length == 18
        ? value?.slice(0, 18).replace(/\D/g, "")
        : value;

    // Aplica a formatação do CNPJ: 00.000.000/0000-00
    value = value?.replace(/^(\d{2})(\d)/, "$1.$2");
    value = value?.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    value = value?.replace(/\.(\d{3})(\d)/, ".$1/$2");
    value = value?.replace(/(\d{4})(\d)/, "$1-$2");
    return value;
  };

  static formatarCpfCnpj = (value: string | undefined) => {
    if (value && value.length < 14) {
      return FormatFields.formatarCPF(value);
    } else if (value) {
      return FormatFields.formatarCNPJ(value);
    } else {
      return value;
    }
  };

  static formatarNumerico = (value: any) => {
    value = String(value);
    let numericValue = value.replace(/[^\d]/g, "");
    return numericValue;
  };

  static formatarMonetario = (value: any) => {
    value = String(value);
    let numericValue = FormatFields.formatarNumero(value);
    return `R$ ${numericValue}`;
  };

  static formatarNumero = (value: any) => {
    if (value === null || value === undefined) return "0,00";
    if (value.length === 1) return "0,0" + value;

    if (+value == +value) {
      return new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    }
    let numericValue = value.replace(/[^\d]/g, "");
    // let numericValue = value;

    // Remove zeros à esquerda desnecessários
    numericValue = numericValue.replace(/^0+/, "");

    if (numericValue.length === 0 || parseInt(numericValue) === 0) {
      return "0,00";
    }

    // Divide a parte inteira da parte decimal
    const integerPart = numericValue.slice(0, -2) || "0";
    const decimalPart = numericValue.slice(-2).padStart(2, "0");
    // numericValue = (+numericValue).toFixed(2);

    //  const [integerPart, decimalPart] = value.split(".");

    // Formata a parte inteira com separadores de milhares
    let formattedIntegerPart = "";
    for (let i = integerPart.length - 1, j = 1; i >= 0; i--, j++) {
      formattedIntegerPart = integerPart[i] + formattedIntegerPart;
      if (j % 3 === 0 && i !== 0) {
        formattedIntegerPart = "." + formattedIntegerPart;
      }
    }

    // Combina a parte inteira e a parte decimal
    const formattedPrice = `${formattedIntegerPart},${decimalPart}`;

    return formattedPrice;
  };

  static formatarNumeroPreciso = (value: any) => {
    let numericValue = value.replace(/[^\d]/g, "");

    // Remove zeros à esquerda desnecessários
    numericValue = numericValue.replace(/^0+/, "");

    if (numericValue.length === 0 || parseInt(numericValue) === 0) {
      return "0,0000000";
    }

    // Divide a parte inteira da parte decimal
    const integerPart = numericValue.slice(0, -7) || "0";
    const decimalPart = numericValue.slice(-7).padStart(7, "0");

    // Formata a parte inteira com separadores de milhares
    let formattedIntegerPart = "";
    for (let i = integerPart.length - 1, j = 1; i >= 0; i--, j++) {
      formattedIntegerPart = integerPart[i] + formattedIntegerPart;
      if (j % 3 === 0 && i !== 0) {
        formattedIntegerPart = "." + formattedIntegerPart;
      }
    }

    // Combina a parte inteira e a parte decimal
    const formattedPrice = `${formattedIntegerPart},${decimalPart}`;

    return formattedPrice;
  };

  static formatarNumeroDecimal = (value: any) => {
    let numericValue = value.replace(/[^\d]/g, "");

    // Remove zeros à esquerda desnecessários
    numericValue = numericValue.replace(/^0+/, "");

    if (numericValue.length === 0 || parseInt(numericValue) === 0) {
      return "0,00";
    }

    // Divide a parte inteira da parte decimal (garantindo 2 casas decimais)
    const integerPart = numericValue.slice(0, -2) || "0";
    const decimalPart = numericValue.slice(-2).padStart(2, "0");

    // Formata a parte inteira com separadores de milhares
    let formattedIntegerPart = "";
    for (let i = integerPart.length - 1, j = 1; i >= 0; i--, j++) {
      formattedIntegerPart = integerPart[i] + formattedIntegerPart;
      if (j % 3 === 0 && i !== 0) {
        formattedIntegerPart = "." + formattedIntegerPart;
      }
    }

    // Combina a parte inteira e a parte decimal
    const formattedPrice = `${formattedIntegerPart},${decimalPart}`;

    return formattedPrice;
  };

  static formatarNumerosEspacos(value: any) {
    // Remove todos os caracteres que não são números ou espaços.
    value = value.replace(/[^0-9 ]/g, "");

    // Remove todos os espaços em branco múltiplos.
    value = value.replace(/\s+/g, " ");

    return value;
  }

  static formatarLetras = (value: any): string => {
    // Remove caracteres não alfabéticos e espaços extras usando uma expressão regular
    const letrasEspacosApenas = value
      .replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ\s]+/g, "")
      .replace(/\s+/g, " ")
      .trimStart();
    return letrasEspacosApenas;
  };

  static formatarLetrasNumeros = (value: any): string => {
    // Remove caracteres não alfanuméricos e espaços extras usando uma expressão regular
    const alfanumericosEspacosApenas = value
      .replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ0-9\s]+/g, "")
      .replace(/\s+/g, " ")
      .trimStart();
    return alfanumericosEspacosApenas;
  };
  static formatarHora = (value: any): string => {
    // Remova todos os caracteres não numéricos da entrada
    const horaNumerica = value.replace(/[^0-9]/g, "");

    // Verifique se a hora numérica tem pelo menos 2 dígitos
    if (horaNumerica.length >= 2) {
      // Extraia os primeiros dois dígitos para as horas
      const horas = horaNumerica.slice(0, 2);

      // Os dígitos restantes (a partir do terceiro dígito) representam os minutos
      const minutos = horaNumerica.slice(2);

      // Formate a hora no formato "hh:mm"
      const horaFormatada = `${horas}:${minutos}`;
      return horaFormatada;
    } else {
      // Se não houver pelo menos 2 dígitos numéricos, retorne "--:--"
      return "--:--";
    }
  };

  static formatarMesAno = (value: any): string => {
    value = value.slice(0, 7).replace(/\D/g, "");
    value = value.replace(/^(\d{2})(\d)/, "$1/$2");
    return value.replace(/^(\d{2})(\d)/, "$1/$2");
  };

  static desformatarNumeros = (value: any): string | number => {
    if (
      typeof value === "string" &&
      (value.includes(".") || value.includes(",")) &&
      +value !== +value &&
      isNumeroPortuguesCompleto(value)
    ) {
      return value.replaceAll(".", "").replace(",", ".");
    } else if (typeof value === "number" || +value == +value) {
      return value;
    } else {
      // return value;
      return "0";
    }
  };

  static formatarNumeroDeNumero = (value: number) => {
    const [integerPart, decimalPart] = String(value).split(".");

    // Formata a parte inteira com separadores de milhares
    let formattedIntegerPart = "";
    for (let i = integerPart.length - 1, j = 1; i >= 0; i--, j++) {
      formattedIntegerPart = integerPart[i] + formattedIntegerPart;
      if (j % 3 === 0 && i !== 0) {
        formattedIntegerPart = "." + formattedIntegerPart;
      }
    }

    // Combina a parte inteira e a parte decimal
    const formattedPrice = `${formattedIntegerPart},${decimalPart || "00"}`;

    return +formattedIntegerPart != +formattedIntegerPart
      ? formattedPrice
      : value;
  };

  static formatarPlaca = (value: string): string => {
    if (!value) return "";

    const limpa = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const limitado = limpa.slice(0, 8);

    if (limitado.length < 7) return limitado;

    const parte1 = limitado.slice(0, 3);
    const parte2 = limitado.slice(3);

    return `${parte1}-${parte2}`;
  };
}

function isNumeroPortuguesCompleto(texto: any) {
  const regex = /^(\d+)(?:[.,]{1}[\d]+)*$/;
  return regex.test(texto);
}

export function GetForm(
  yupSchema?: yup.ObjectSchema<{}, yup.AnyObject, {}, "">,
  setYupSchema?: Dispatch<
    SetStateAction<yup.ObjectSchema<{}, yup.AnyObject, {}, "">>
  >
) {
  const [schema, setSchema] = useState<
    yup.ObjectSchema<{}, yup.AnyObject, {}, "">
  >(yupSchema || yup.object().shape({}));
  const [key, setKey] = useState(1);

  const {
    register,
    handleSubmit,
    control,
    setValue: formSetValue,
    formState: { errors, isSubmitting },
    clearErrors: formClearErrors,
    ...rest
  } = useForm({
    resolver: yupResolver(
      schema.transform((originalSchema) =>
        Object.fromEntries(
          Object.entries(originalSchema).map(([field, value]) => {
            if (isNumeroPortuguesCompleto(value)) {
              value = FormatFields.desformatarNumeros(value);
            } else if (typeof value == "string") {
              value = String(value).trim();
            }
            return [
              field,
              value,
              // typeof value == "string" ? String(value).trim() : value,
            ];
          })
        )
      )
    ),
  });

  function clearErrors(name: string) {
    return formClearErrors(name as never);
  }

  function setValue(
    name: string,
    value: any,
    options?:
      | Partial<{
          shouldValidate: boolean;
          shouldDirty: boolean;
          shouldTouch: boolean;
        }>
      | undefined
  ) {
    formSetValue(name as never, value as never, options);
  }

  function reload() {
    setKey((prev) => prev + 1);
    setSchema(yupSchema || yup.object().shape({}));
  }

  return {
    register,
    isSubmitting,
    errors,
    control,
    yupSchema: schema,
    setYupSchema: setSchema,
    handleSubmit,
    setValue,
    clearErrors,
    key,
    setKey,
    reload,
    ...rest,
  };
}

export function valueLabel(arr: any[], label: string, value: string) {
  return arr.map((element: any) => {
    return {
      label: element[label],
      value: element[value],
    };
  });
}

export function getDateTimeBrasil(options = {}, date = new Date()) {
  options = {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    ...options,
  };

  const dataHora = date
    .toLocaleString("pt-BR", options as any)
    .replace(",", "");
  return dataHora;
}

export function capitalizeMonth(data: string) {
  const month = data.split(" ")[2];
  return data.replace(
    month,
    month[0].toUpperCase() + month.slice(1).replace(" ", "")
  );
}
export function validarDataNascimento(data: string): boolean {
  const dataNascimento = new Date(data);
  const hoje = new Date();

  if (isNaN(dataNascimento.getTime())) {
    return false; // A data não é válida
  }

  const diferencaAnos = hoje.getFullYear() - dataNascimento.getFullYear();
  const diferencaMeses = hoje.getMonth() - dataNascimento.getMonth();
  const diferencaDias = hoje.getDate() - dataNascimento.getDate();

  let idade = diferencaAnos;

  if (diferencaMeses < 0 || (diferencaMeses === 0 && diferencaDias < 0)) {
    idade--;
  }

  if (idade >= 18 && idade <= 110) {
    return true; // A data de nascimento é válida
  }

  return false; // A data de nascimento não é válida
}

export function validarCPF(cpf: string) {
  // Remover caracteres não numéricos
  cpf = cpf.replace(/[^\d]/g, "");

  // Verificar se CPF possui 11 dígitos
  if (cpf.length !== 11) {
    return false;
  }

  // Calcular primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let primeiroDigito = 11 - (soma % 11);
  if (primeiroDigito > 9) {
    primeiroDigito = 0;
  }

  // Verificar primeiro dígito verificador
  if (parseInt(cpf.charAt(9)) !== primeiroDigito) {
    return false;
  }

  // Calcular segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  let segundoDigito = 11 - (soma % 11);
  if (segundoDigito > 9) {
    segundoDigito = 0;
  }

  // Verificar segundo dígito verificador
  return parseInt(cpf.charAt(10)) === segundoDigito;
}
export function validarCNPJ(cnpj: string) {
  // Remover caracteres não numéricos
  cnpj = cnpj.replace(/[^\d]/g, "");

  // Verificar se CNPJ possui 14 dígitos
  if (cnpj.length !== 18) {
    return false;
  }

  // Calcular primeiro dígito verificador
  let soma = 0;
  let peso = 2;
  for (let i = 11; i >= 0; i--) {
    soma += parseInt(cnpj.charAt(11 - i)) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  let primeiroDigito = soma % 11 < 2 ? 0 : 11 - (soma % 11);

  // Verificar primeiro dígito verificador
  if (parseInt(cnpj.charAt(12)) !== primeiroDigito) {
    return false;
  }

  // Calcular segundo dígito verificador
  soma = 0;
  peso = 2;
  for (let i = 12; i >= 0; i--) {
    soma += parseInt(cnpj.charAt(12 - i)) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  let segundoDigito = soma % 11 < 2 ? 0 : 11 - (soma % 11);

  // Verificar segundo dígito verificador
  return parseInt(cnpj.charAt(13)) === segundoDigito;
}

export function validaCPFCNPJ(value: string) {
  if (value.length <= 18) {
    return validarCPF(value);
  } else {
    return validarCNPJ(value);
  }
}

export function calcularParcela(taxa: number, parcelas: number, valor: number) {
  // Cálculo do valor da parcela
  taxa = taxa / 100;

  const parcela =
    (valor * taxa * Math.pow(1 + taxa, parcelas)) /
    (Math.pow(1 + taxa, parcelas) - 1);

  // Retorno do valor da parcela
  return parcela;
}
export function convertDatePtToEng(dateStr: any) {
  if (!dateStr) return null;
  const [day, month, year] = dateStr.split("/");
  return `${year}-${month}-${day}`;
}

export function formatarValor(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

export function calcularAnosEMeses(meses: number) {
  // Definindo variáveis
  const ano = Math.floor(meses / 12);
  const mesesRestantes = meses % 12;

  // Construindo a string de retorno
  let resultado = "";

  // Verificando se há anos completos
  if (ano > 0) {
    resultado += `${ano} ano${ano > 1 ? "s" : ""}`;

    // Adicionando "e" se houver meses restantes
    if (mesesRestantes > 0) {
      resultado += " e ";
    }
  }

  // Incluindo os meses restantes
  if (mesesRestantes > 0) {
    resultado += `${mesesRestantes} mes${mesesRestantes > 1 ? "es" : ""}`;
  }

  // Retornando o resultado
  return resultado;
}

export function calcularDiferencaDias(
  dataInicial: string,
  dataFinal: string = new Date().toISOString().slice(0, 10)
) {
  // Converter datas para objetos Date
  const data1 = new Date(dataInicial); // Data de vencimento
  const data2 = new Date(dataFinal); // Data atual ou fornecida como base

  // Validar se as datas são válidas
  if (isNaN(data1.getTime()) || isNaN(data2.getTime())) {
    console.warn({
      title: "Data Invalida",
      text: "Uma ou ambas as datas fornecidas são inválidas.",
      icon: "error",
    });
  }

  // Calcular a diferença em milissegundos e converter para dias
  const diffTime = data1.getTime() - data2.getTime();
  const diffDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Retornar a diferença
  return diffDias;
}

// export function GetGallery() {
//   const [galleryArr, setGalleryArr] = useState<any[]>([
//     { src: "string", name: "string" },
//   ]);
// const { setCurrentDoc, setIsOpen, galleryState, setGalleryState } =
//   useScreenContext();

// const [isOpen, setIsOpen] = useState(false);
// const [currentDoc, setCurrentDoc] = useState(0);

// function openGallery(index = 0, useGalleryArr = true) {
//   if (useGalleryArr) setGallery(galleryArr);
//   setCurrentDoc(index);
//   setIsOpen(true);
// }

//   function setGallery(
//     gallery: { src: string; name: string }[],
//     origin: any = "undefined"
//   ) {
//     if (
//       !(
//         galleryState.every((elemento: any) => gallery.includes(elemento)) &&
//         gallery.every((elemento) => galleryState.includes(elemento))
//       ) ||
//       gallery?.length == 0 ||
//       galleryState.length == 0
//     ) {
//       const newGallery = gallery.map((e) => ({
//         ...e,
//         asset: e.src,
//         title: e.name,
//       }));
//       setGalleryArr(newGallery);
//       setGalleryState(newGallery);
//       return newGallery;
//     }
//   }

//   return { openGallery, setGallery };
// }

export function proximoNumero(ranges: any[]) {
  // Verificar se o array está vazio
  if (ranges.length === 0) {
    return 1; // Retorna 1 como o próximo número em uma sequência vazia
  }

  // Ordenar os ranges pelo valor inicial
  ranges.sort((a, b) => a[0] - b[0]);

  // Inicializar o último número encontrado
  let ultimoNumero = ranges[0][0] - 1;

  // Iterar pelos ranges
  for (let i = 0; i < ranges.length; i++) {
    const [inicio, fim] = ranges[i];

    // Verificar se existe uma lacuna
    if (inicio - ultimoNumero > 1) {
      return ultimoNumero + 1;
    }

    ultimoNumero = fim;
  }

  // Se não encontrou nenhuma lacuna, retornar o próximo número após o último range
  return ultimoNumero + 1;
}

export function proximoNumeroFloat(ranges: any[]) {
  if (ranges.length === 0) {
    return 0.01;
  }

  ranges.sort((a, b) => a[0] - b[0]);
  let ultimoNumero = 0.01; // Inicia a contagem a partir de 0.01

  for (let i = 0; i < ranges.length; i++) {
    const [inicio, fim] = ranges[i];

    // Adicionar uma pequena tolerância para comparação de floats
    const tolerancia = 0.015; // Ajuste a tolerância conforme necessário
    if (inicio - ultimoNumero > tolerancia) {
      return ultimoNumero + 0.01;
    }

    ultimoNumero = fim;
  }

  return ultimoNumero + 0.01;
}

// Função auxiliar para verificar interseção
export function intersect(r1: number[], r2: number[]) {
  return r1[0] <= r2[1] && r2[0] <= r1[1] && r1[2] == r2[2];
}

export function validarRanges(ranges: number[][]) {
  const intersecoes: { [x: string]: number[] } = {};

  for (let i = 0; i < ranges.length - 1; i++) {
    for (let j = i + 1; j < ranges.length; j++) {
      if (intersect(ranges[i], ranges[j])) {
        if (!intersecoes[i]) intersecoes[i] = [];
        if (!intersecoes[j]) intersecoes[j] = [];
        intersecoes[i].push(j);
        intersecoes[j].push(i);
      }
    }
  }

  return intersecoes;
}

export function compararArraysDeObjetosPorLabel(array1: any[], array2: any[]) {
  // Função auxiliar para encontrar um objeto com a mesma label em um array
  const encontrarPorLabel = (array: any[], label: string) =>
    array.find((obj) => obj.label === label);

  // Verifica se todos os objetos de array1 têm um correspondente em array2
  const todosEmArray2 = array1.every((obj1) =>
    encontrarPorLabel(array2, obj1.label)
  );

  // Verifica se todos os objetos de array2 têm um correspondente em array1
  const todosEmArray1 = array2.every((obj2) =>
    encontrarPorLabel(array1, obj2.label)
  );

  // Retorna true se algum objeto não tiver correspondente
  return !(todosEmArray1 && todosEmArray2);
}

export const handleDownload = (anexo: File) => {
  const url = URL.createObjectURL(anexo);
  const link = document.createElement("a");
  link.href = url;
  link.download = anexo.name;
  link.click();
  URL.revokeObjectURL(url);
};

export function filtrarPorMultiSelecao(
  row: any,
  columnId: string,
  filterValue: any[]
) {
  if (!row.original[columnId]) {
    return true;
  }
  if (
    filterValue?.length == 0 ||
    filterValue.some(
      (optionSelected) =>
        optionSelected.value == "*" ||
        optionSelected.label == row.original[columnId]
    )
  ) {
    return true;
  }

  return false;
}

export function filtrarPorValorMultiSelecao(
  row: any,
  columnId: string,
  filterValue: any[]
) {
  if (!row.original[columnId]) {
    return true;
  }
  if (
    filterValue?.length == 0 ||
    filterValue.some(
      (optionSelected) =>
        optionSelected.value == "*" ||
        optionSelected.value == row.original[columnId]
    )
  ) {
    return true;
  }

  return false;
}

export function filtrarPorMultiSelecaoEmArray(
  row: any,
  columnId: string,
  filterValue: any[]
) {
  if (!row.original[columnId]) {
    return true;
  }
  if (
    filterValue?.length == 0 ||
    filterValue.some(
      (optionSelected) =>
        optionSelected.value == "*" ||
        row.original[columnId].split(", ").includes(optionSelected.label)
    )
  ) {
    return true;
  }

  return false;
}

export function filtrarPorTexto(
  row: any,
  columnId: string,
  filterValue: string
) {
  if (!row.original[columnId]) {
    return true;
  }

  if (
    filterValue == "" ||
    filterValue == "Todos" ||
    filterValue == "Todas" ||
    filterValue == row.original[columnId]
  ) {
    return true;
  }

  return false;
}
