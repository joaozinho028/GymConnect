"use client";
import Button from "@/components/Forms/Button";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertCircle,
  ChevronRight,
  Download,
  FileText,
  Save,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import Swal from "sweetalert2";

// Definir interface para os dados do aluno
interface DadosAluno {
  nome_aluno: string;
  email_aluno: string;
  telefone_aluno: string;
  cpf_aluno: string;
  plano_aluno: string;
  forma_pagamento: string;
  linha?: number;
  [key: string]: any;
}

const ImportarAlunos = () => {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [dadosPreview, setDadosPreview] = useState<DadosAluno[]>([]);
  const [errosValidacao, setErrosValidacao] = useState<string[]>([]);
  const [importando, setImportando] = useState(false);
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Função para baixar template CSV
  const baixarTemplate = () => {
    const csvContent =
      "nome_aluno,email_aluno,telefone_aluno,cpf_aluno,plano_aluno,forma_pagamento\n" +
      "João Silva,joao.silva@email.com,11999999999,12345678909,mensal,pix\n" +
      "Maria Santos,maria.santos@email.com,11888888888,98765432100,trimestral,credito\n" +
      "Pedro Oliveira,pedro.oliveira@email.com,11777777777,11122233344,anual,boleto\n" +
      "Ana Costa,ana.costa@email.com,11666665555,55566677788,semestral,debito";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "template_importacao_alunos.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Função para validar formato de email
  const validarEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Função para validar formato de CPF (algoritmo completo)
  const validarCPF = (cpf: string): boolean => {
    const cpfLimpo = cpf.replace(/[^\d]/g, "");

    if (cpfLimpo.length !== 11) return false;

    // Verifica sequências iguais
    if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;

    // Algoritmo de validação
    let soma = 0;
    for (let i = 1; i <= 9; i++) {
      soma += parseInt(cpfLimpo.substring(i - 1, i)) * (11 - i);
    }

    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpfLimpo.substring(9, 10))) return false;

    soma = 0;
    for (let i = 1; i <= 10; i++) {
      soma += parseInt(cpfLimpo.substring(i - 1, i)) * (12 - i);
    }

    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpfLimpo.substring(10, 11))) return false;

    return true;
  };

  // Função para processar arquivo CSV
  const processarArquivo = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        if (!csv) {
          throw new Error("Arquivo vazio");
        }

        const linhas = csv.split("\n").filter((linha) => linha.trim() !== "");

        if (linhas.length < 2) {
          throw new Error(
            "Arquivo deve conter pelo menos o cabeçalho e uma linha de dados"
          );
        }

        const cabecalho = linhas[0]
          .split(",")
          .map((col) => col.trim().replace(/"/g, ""));

        // Validar cabeçalho
        const cabecalhoEsperado = [
          "nome_aluno",
          "email_aluno",
          "telefone_aluno",
          "cpf_aluno",
          "plano_aluno",
          "forma_pagamento",
        ];

        const cabecalhoValido = cabecalhoEsperado.every((col) =>
          cabecalho.includes(col)
        );

        if (!cabecalhoValido) {
          Swal.fire({
            icon: "error",
            title: "Arquivo Inválido",
            html: `
              <p>O cabeçalho do arquivo não está correto.</p>
              <br>
              <p><strong>Esperado:</strong></p>
              <p><code>${cabecalhoEsperado.join(", ")}</code></p>
              <br>
              <p><strong>Encontrado:</strong></p>
              <p><code>${cabecalho.join(", ")}</code></p>
              <br>
              <p>Baixe o template e verifique o formato.</p>
            `,
          });
          return;
        }

        // Processar dados
        const dados: DadosAluno[] = [];
        const erros: string[] = [];

        for (let i = 1; i < linhas.length; i++) {
          const linha = linhas[i].trim();
          if (!linha) continue;

          const valores = linha
            .split(",")
            .map((val) => val.trim().replace(/^"|"$/g, ""));
          const dadosLinha: DadosAluno = {
            nome_aluno: "",
            email_aluno: "",
            telefone_aluno: "",
            cpf_aluno: "",
            plano_aluno: "",
            forma_pagamento: "",
            linha: i + 1,
          };

          cabecalho.forEach((col, index) => {
            dadosLinha[col] = valores[index] || "";
          });

          // Validações básicas
          if (!dadosLinha.nome_aluno || dadosLinha.nome_aluno.length < 2) {
            erros.push(
              `Linha ${
                i + 1
              }: Nome é obrigatório e deve ter pelo menos 2 caracteres`
            );
          }

          if (!dadosLinha.email_aluno) {
            erros.push(`Linha ${i + 1}: Email é obrigatório`);
          } else if (!validarEmail(dadosLinha.email_aluno)) {
            erros.push(
              `Linha ${i + 1}: Email "${dadosLinha.email_aluno}" é inválido`
            );
          }

          if (!dadosLinha.cpf_aluno) {
            erros.push(`Linha ${i + 1}: CPF é obrigatório`);
          } else if (!validarCPF(dadosLinha.cpf_aluno)) {
            erros.push(
              `Linha ${i + 1}: CPF "${dadosLinha.cpf_aluno}" é inválido`
            );
          }

          if (!dadosLinha.plano_aluno) {
            erros.push(`Linha ${i + 1}: Plano é obrigatório`);
          } else {
            const planosValidos = [
              "mensal",
              "trimestral",
              "semestral",
              "anual",
            ];
            if (!planosValidos.includes(dadosLinha.plano_aluno.toLowerCase())) {
              erros.push(
                `Linha ${i + 1}: Plano "${
                  dadosLinha.plano_aluno
                }" é inválido. Use: ${planosValidos.join(", ")}`
              );
            }
          }

          if (!dadosLinha.forma_pagamento) {
            erros.push(`Linha ${i + 1}: Forma de pagamento é obrigatória`);
          } else {
            const formasValidas = [
              "pix",
              "boleto", 
              "credito",
              "crédito",
              "debito", 
              "débito",
              // Manter algumas variações comuns para compatibilidade
              "cartão de crédito",
              "cartão de credito", 
              "cartao de credito",
              "cartão de débito",
              "cartão de debito",
              "cartao de debito",
            ];
            
            const formaNormalizada = dadosLinha.forma_pagamento.toLowerCase().trim();
            if (!formasValidas.includes(formaNormalizada)) {
              erros.push(
                `Linha ${i + 1}: Forma de pagamento "${
                  dadosLinha.forma_pagamento
                }" é inválida. Use: pix, boleto, credito, debito`
              );
            }
          }

          dados.push(dadosLinha);
        }

        setDadosPreview(dados);
        setErrosValidacao(erros);

        if (erros.length > 0) {
          Swal.fire({
            icon: "warning",
            title: "Erros de Validação Encontrados",
            html: `
              <div style="text-align: left;">
                <p><strong>${erros.length} erro(s) encontrado(s):</strong></p>
                <br>
                <div style="max-height: 300px; overflow-y: auto; padding: 10px; background: #f9f9f9; border-radius: 5px;">
                  ${erros
                    .slice(0, 10)
                    .map(
                      (erro) =>
                        `<p style="margin: 5px 0; font-size: 14px;">• ${erro}</p>`
                    )
                    .join("")}
                  ${
                    erros.length > 10
                      ? `<p><strong>...e mais ${
                          erros.length - 10
                        } erro(s)</strong></p>`
                      : ""
                  }
                </div>
                <br>
                <p>Corrija os erros antes de importar.</p>
              </div>
            `,
            width: "600px",
          });
        } else {
          Swal.fire({
            icon: "success",
            title: "Arquivo Processado!",
            text: `${dados.length} aluno(s) válido(s) pronto(s) para importação!`,
            timer: 2000,
            showConfirmButton: false,
          });
        }
      } catch (error) {
        console.error("Erro ao processar arquivo:", error);
        Swal.fire({
          icon: "error",
          title: "Erro ao Processar Arquivo",
          text: "Não foi possível processar o arquivo. Verifique se está no formato correto.",
        });
        setDadosPreview([]);
        setErrosValidacao([]);
      }
    };

    reader.onerror = () => {
      Swal.fire({
        icon: "error",
        title: "Erro ao Ler Arquivo",
        text: "Não foi possível ler o arquivo selecionado.",
      });
    };

    reader.readAsText(file, "UTF-8");
  };

  // Função para selecionar arquivo
  const selecionarArquivo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        Swal.fire({
          icon: "error",
          title: "Formato Inválido",
          text: "Por favor, selecione um arquivo CSV (.csv)",
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: "error",
          title: "Arquivo Muito Grande",
          text: "O arquivo deve ter no máximo 5MB",
        });
        return;
      }

      setArquivo(file);
      processarArquivo(file);
    }
  };

  // Função para limpar formulário
  const limparFormulario = () => {
    setArquivo(null);
    setDadosPreview([]);
    setErrosValidacao([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Função para importar alunos
  const importarAlunos = async () => {
    if (!arquivo || dadosPreview.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Nenhum Arquivo",
        text: "Por favor, selecione um arquivo para importar.",
      });
      return;
    }

    if (errosValidacao.length > 0) {
      Swal.fire({
        icon: "error",
        title: "Erros de Validação",
        text: "Corrija os erros antes de prosseguir com a importação.",
      });
      return;
    }

    const result = await Swal.fire({
      icon: "question",
      title: "Confirmar Importação",
      text: `Deseja importar ${dadosPreview.length} aluno(s)?`,
      showCancelButton: true,
      confirmButtonText: "Sim, Importar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) return;

    setImportando(true);

    Swal.fire({
      icon: "info",
      title: "Importando Alunos",
      text: "Processando importação...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/alunos/importar-alunos`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ alunos: dadosPreview }),
        }
      );

      const data = await response.json();

      Swal.close();

      // Verificar se houve sucesso (mesmo com alguns erros)
      if (data.success || (data.data && data.data.sucesso > 0)) {
        const { sucesso, erros, detalhes } = data.data;

        await Swal.fire({
          icon: sucesso > 0 ? "success" : "error",
          title: sucesso > 0 ? "Importação Concluída!" : "Falha na Importação",
          html: `
            <div style="text-align: left;">
              <p><strong>Total processados:</strong> ${
                data.data.total_processados
              }</p>
              <p><strong>Alunos importados:</strong> ${sucesso}</p>
              <p><strong>Erros:</strong> ${erros}</p>
              ${
                detalhes && detalhes.length > 0
                  ? `<br><div style="background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #dc2626;">
                  <p style="font-weight: bold; color: #dc2626; margin-bottom: 10px;">Detalhes dos Erros:</p>
                  <div style="max-height: 200px; overflow-y: auto;">
                    ${detalhes
                      .map(
                        (detalhe: any, index: any) =>
                          `<p style="margin: 5px 0; font-size: 14px; color: #991b1b;">
                        ${index + 1}. ${detalhe}
                      </p>`
                      )
                      .join("")}
                  </div>
                </div>`
                  : ""
              }
            </div>
          `,
          confirmButtonText: "OK",
          width: "700px",
        });

        // Limpar formulário se pelo menos alguns alunos foram importados
        if (sucesso > 0) {
          limparFormulario();
        }
      } else {
        // Mostrar erros detalhados mesmo quando todos falharam
        const { detalhes, erros } = data.data || {};

        await Swal.fire({
          icon: "error",
          title: "Falha na Importação",
          html: `
            <div style="text-align: left;">
              <p><strong>Nenhum aluno foi importado com sucesso.</strong></p>
              <p><strong>Total de erros:</strong> ${erros || 0}</p>
              ${
                detalhes && detalhes.length > 0
                  ? `<br><div style="background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #dc2626;">
                  <p style="font-weight: bold; color: #dc2626; margin-bottom: 10px;">Erros encontrados:</p>
                  <div style="max-height: 250px; overflow-y: auto;">
                    ${detalhes
                      .map(
                        (detalhe: any, index: any) =>
                          `<p style="margin: 5px 0; font-size: 14px; color: #991b1b;">
                        ${index + 1}. ${detalhe}
                      </p>`
                      )
                      .join("")}
                  </div>
                </div>`
                  : ""
              }
              <br>
              <p style="color: #6b7280;">Corrija os erros e tente novamente.</p>
            </div>
          `,
          confirmButtonText: "Entendi",
          width: "700px",
        });
      }
    } catch (error) {
      console.error("Erro ao importar alunos:", error);
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Erro de Conexão",
        text: "Erro ao conectar com o servidor. Verifique sua conexão e tente novamente.",
      });
    } finally {
      setImportando(false);
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-8">
      <div className="w-full max-w-none bg-white p-6 rounded-lg shadow-md sm:p-10">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-muted-foreground mb-6">
          <span className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer">
            Página Inicial
          </span>
          <ChevronRight className="mx-2 h-4 w-4" />
          <span className="font-medium text-primary">Importar Alunos</span>
        </div>

        {/* Título */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Importar Alunos
          </h1>
          <p className="text-gray-600">
            Importe múltiplos alunos de uma só vez usando um arquivo CSV
          </p>
        </div>

        {/* Botão baixar modelo */}
        <div className="mb-6">
          <Button
            onClick={baixarTemplate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <Download size={18} className="mr-2" />
            Baixar Modelo CSV
          </Button>
        </div>

        {/* Campo de Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Arquivo de Importação
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <span>Clique para fazer upload</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept=".csv"
                    onChange={selecionarArquivo}
                    ref={fileInputRef}
                  />
                </label>
                <p className="pl-1">ou arraste e solte</p>
              </div>
              <p className="text-xs text-gray-500">CSV até 5MB</p>
              {arquivo && (
                <div className="mt-2">
                  <p className="text-sm text-green-600 font-medium">
                    ✓ {arquivo.name} ({(arquivo.size / 1024).toFixed(1)} KB)
                  </p>
                  <button
                    onClick={limparFormulario}
                    className="text-xs text-red-500 cursor-pointer hover:text-red-700 mt-1"
                  >
                    Remover arquivo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Erros de validação */}
        {errosValidacao.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center mb-2">
              <AlertCircle className="text-red-500 mr-2" size={20} />
              <h3 className="text-lg font-medium text-red-800">
                Erros de Validação ({errosValidacao.length})
              </h3>
            </div>
            <ul className="list-disc list-inside text-red-700 space-y-1 max-h-40 overflow-y-auto">
              {errosValidacao.map((erro, index) => (
                <li key={index}>{erro}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Preview dos dados */}
        {dadosPreview.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <FileText className="mr-2" size={20} />
              Preview dos Dados ({dadosPreview.length} aluno
              {dadosPreview.length !== 1 ? "s" : ""})
            </h3>
            {/* Container com altura fixa e scroll */}
            <div className="border rounded-lg">
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Telefone
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        CPF
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plano
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pagamento
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dadosPreview.map((aluno, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {aluno.nome_aluno}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {aluno.email_aluno}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {aluno.telefone_aluno}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {aluno.cpf_aluno}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {aluno.plano_aluno}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {aluno.forma_pagamento}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Botão de importação */}
        {dadosPreview.length > 0 && errosValidacao.length === 0 && (
          <div className="flex justify-end">
            <Button
              onClick={importarAlunos}
              disabled={importando}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Save size={18} className="mr-2" />
              {importando ? "Importando..." : "Importar Alunos"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportarAlunos;
