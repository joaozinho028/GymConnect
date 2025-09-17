/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { IInputProps } from "@/types/formInterfaces";
import { CalendarDays, Eye, EyeOff, X } from "lucide-react";
import React, { Fragment, useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import * as yup from "yup";
import { FormatFields } from "../../utils";
import { Calendar } from "../ui/calendar";
import Button from "./Button";

const Input = ({
  label,
  formulario,
  name = "",
  width,
  type,
  cols,
  rows,
  mascara,
  defaultValue,
  error,
  required,
  prefix,
  onChange,
  checked = false,
  equals,
  typeFile,
  isPassword = false,
  onInputProp,
  onRemoveFile,
  clearBtn = false,
  inputClassName = "",
  prefixWidth = "",
  dynamic = false,
  textSize = "text-md",
  labelSize = "text-md",
  schema,
  onDateChange,
  // value,
  ...rest
}: IInputProps) => {
  useEffect(() => {
    if (formulario) {
      const newSchema = formulario.yupSchema.fields;
      newSchema[name] = required ? yup.string().required(error) : yup.string();
      if (equals) {
        newSchema[name] = newSchema[name].oneOf(
          [yup.ref(equals), null],
          "Senhas devem ser iguais!"
        );
      }
      if (isPassword) {
        const upperCaseRegex = /(?=[A-Z])/;
        const lowerCaseRegex = /(?=[a-z])/;
        const numericRegex = /(?=.*[0-9])/;
        const magicRegex = /\W|_/;
        newSchema[name] = newSchema[name]
          .min(8, "Mínimo 8 caracteres")
          .matches(upperCaseRegex, "Ao menos um maiúsculo")
          .matches(lowerCaseRegex, "Ao menos um minúsculo")
          .matches(numericRegex, "Ao menos um número")
          .matches(magicRegex, "Um especial '!@#$'");
      }
      if (type == "email") {
        newSchema[name] = required
          ? yup.string().email("Escreva um email correto!").required(error)
          : yup.string().email("Escreva um email correto!");
      }
      // newSchema[name] = yup.string();
      // if (required) {
      //     newSchema[name] = newSchema[name].required(error);
      // }
      newSchema[name] = schema || newSchema[name];
      formulario.setYupSchema(yup.object().shape(newSchema));

      if (
        defaultValue &&
        (!Object.keys(formulario?.control?._formValues).includes(name) ||
          formulario?.control?._formValues[name] == undefined ||
          formulario?.control?._formValues[name] == "")
      ) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        defaultValue = handleFormatInput(false, defaultValue);
        formulario.setValue(name as never, defaultValue as never);
      }
    }

    return () => {
      dynamic &&
        formulario?.control.unregister([name] as never[], {
          keepValue: false,
          keepError: false,
        });
    };
  }, []);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isChecked, setIsChecked] = useState<boolean>(checked);
  const [visible, setVisible] = useState(false);
  const [openPovData, setOpenPovData] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleFormatInput = (event: any, value = ""): string => {
    const input = event.target;
    if (type !== "file") {
      if (input) {
        value = input.value;
      }
      switch (mascara) {
        case "telefone":
          value = FormatFields.formatarTelefone(value);
          break;
        case "data":
          value = FormatFields.formatarData(value);
          break;
        case "cep":
          value = FormatFields.formatarCep(value);
          break;
        case "cpf":
          value = FormatFields.formatarCPF(value);
          break;
        case "cnpj":
          value = FormatFields.formatarCNPJ(value) || value;
          break;
        case "numero":
          value = FormatFields.formatarNumero(value);
          break;
        case "numerico":
          value = FormatFields.formatarNumerico(value);
          break;
        case "letras":
          value = FormatFields.formatarLetras(value);
          break;
        case "letrasNumeros":
          value = FormatFields.formatarLetrasNumeros(value);
          break;
        case "mesAno":
          value = FormatFields.formatarMesAno(value);
          break;
        case "numeroPreciso":
          value = FormatFields.formatarNumeroPreciso(value);
          break;
        case "hora":
          value = FormatFields.formatarHora(value);
          break;
        case "cpfCnpj":
          value = FormatFields.formatarCpfCnpj(value) || value;
          break;
        case "placa":
          value = FormatFields.formatarPlaca(value) || value;
          break;
        default:
          break;
      }
      if (input) {
        input.value = value;

        if (onChange) {
          onChange(event);
        }
      }
    }

    return value;
  };
  const handleDateChange = (date: any) => {
    const formattedDate = FormatFields.formatarDataCalendar(date);
    setSelectedDate(formattedDate);
    formulario?.setValue(name as never, formattedDate as never);

    setOpenPovData(false);

    if (onDateChange) {
      onDateChange(formattedDate, name);
    }
  };
  inputClassName = twMerge(
    `w-full h-[38px] mb-1 rounded  border border-gray-300 bg-white 
   text-gray-800 dark:bg-form-input dark:text-white
   placeholder:text-gray-400 dark:placeholder:text-gray-500
   transition duration-200 ease-in-out
   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
   hover:border-gray-400
   dark:border-form-strokedark dark:hover:border-gray-500 dark:focus:ring-blue-400
   ${textSize}`,
    inputClassName
  );

  useEffect(() => {
    setIsChecked(checked);
  }, [checked, formulario]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const value = e.dataTransfer.getData("text/plain");

    if (inputRef.current) {
      const input = inputRef.current;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;

      const currentValue = input.value;
      const newValue =
        currentValue.substring(0, start) + value + currentValue.substring(end);

      if (formulario) {
        formulario.setValue(name as never, newValue as never);
      } else {
        input.value = newValue;
      }

      // Atualiza a posição do cursor após a inserção
      input.selectionStart = start + value.length;
      input.selectionEnd = start + value.length;
    }
  };

  return rest.child ? (
    rest.child
  ) : (
    <div className={`${width ? width : "w-full mt-1"}`}>
      {label && type != "checkbox" && (
        <label
          htmlFor={name}
          className={`mb-1 block text-black dark:text-white whitespace-nowrap ${labelSize}`}
        >
          {label
            .split(" ")
            .map((str: string) =>
              str.length > 3 ? str[0].toUpperCase() + str.slice(1) : str
            )
            .join(" ")}{" "}
          <span className="text-red-500 font-semibold">{required && "*"}</span>
        </label>
      )}
      <div
        className={`w-full flex items-center gap-1 relative flex-row${
          type == "password"
        } align-middle`}
      >
        {type !== "textarea" ? (
          type === "checkbox" ? (
            <div className="flex w-full">
              <label
                className={`flex cursor-pointer select-none items-center ${textSize}`}
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    className={`sr-only ${textSize}`}
                    name={name}
                    {...formulario?.register(name)}
                    {...rest}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      if (onChange) {
                        onChange(e);
                      }
                      setIsChecked(e.target.checked);
                    }}
                    checked={isChecked}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                  />
                  <div
                    className={`mr-3 flex h-9 w-9 dark:border-white justify-center ${
                      isFocused && "ring-2 ring-blue-600 border-0"
                    } items-center rounded border border-black border-opacity-25 ${
                      isChecked &&
                      "border-primary dark:border-primary bg-gray dark:bg-transparent"
                    }`}
                  >
                    <span
                      className={`flex items-center h-6 w-6 rounded-sm font-bold text-3xl text-blue-800`}
                    >
                      {isChecked ? "✓" : ""}
                    </span>
                  </div>
                </div>
                <div className={`${labelSize}`}>{label}</div>
              </label>
            </div>
          ) : (
            <Fragment>
              <input
                name={name}
                className={inputClassName}
                onInput={handleFormatInput}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                {...formulario?.register(name)}
                ref={(el) => {
                  // Registra no react-hook-form
                  if (formulario) {
                    const { ref } = formulario.register(name);
                    ref(el);
                  }
                  // Atualiza nossa ref local
                  inputRef.current = el;
                }}
                type={type == "password" && visible ? "text" : type}
                style={{
                  paddingLeft:
                    type === "password"
                      ? "12px"
                      : prefixWidth
                      ? prefixWidth
                      : `${prefix ? `${prefix.length * 10 + 12}` : "12"}px`,
                  paddingRight: `${type == "password" ? "30px" : "12px"}`,
                }}
                autoComplete="one-time-code"
                defaultValue={
                  !formulario
                    ? defaultValue && handleFormatInput(false, defaultValue)
                    : undefined
                }
                {...rest}
              />

              {type === "password" && (
                <div
                  className="align-middle absolute right-2"
                  onClick={() => {
                    setVisible(!visible);
                  }}
                >
                  {visible ? <Eye /> : <EyeOff />}
                </div>
              )}
              {mascara === "data" && (
                // <Popover open={rest.disabled ? !rest.disabled : undefined}>
                <Popover open={openPovData} onOpenChange={setOpenPovData}>
                  <PopoverTrigger asChild>
                    <CalendarDays
                      className="cursor-pointer dark:text-white text-black absolute right-2"
                      size={17}
                    />
                  </PopoverTrigger>
                  <PopoverContent style={{ zIndex: "9999" }}>
                    <Calendar
                      onSelect={handleDateChange}
                      mode="single"
                      // disabled={(date) =>
                      //   date > new Date() || date < new Date("1900-01-01")
                      // }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
              {clearBtn && (
                <Button
                  type="button"
                  className={`bg-danger flex hover:bg-danger hover:brightness-95 h-8 w-9 p-0  justify-center items-center text-black font-medium`}
                  onClick={() =>
                    formulario?.setValue(name as never, "" as never)
                  }
                >
                  <X size={15} color="white" />
                </Button>
              )}
            </Fragment>
          )
        ) : (
          <textarea
            name={name}
            className="w-full rounded border-[1.5px] border-stroke border-gray-600 border-opacity-25 bg-transparent py-2 px-3 font-medium outline-none transition focus:ring-2 focus:ring-blue-600 active:border-primary disabled:cursor-default disabled:bg-bodydark2 dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            cols={cols ? cols : 25}
            rows={rows ? rows : 4}
            onInput={handleFormatInput}
            defaultValue={defaultValue}
            {...formulario?.register(name, {
              type: "string",
            })}
            {...rest}
          ></textarea>
        )}
        <span
          className="align-middle absolute ml-2"
          style={{
            userSelect: "none",
            // pointerEvents: "none"
          }}
        >
          {prefix}
        </span>
      </div>

      {formulario?.errors && name && formulario.errors[name] && (
        <span className="text-red-500 text-sm">
          {formulario.errors[name].message
            ?.split(" ")
            .map((str: string) =>
              str.length > 3 ? str[0].toUpperCase() + str.slice(1) : str
            )
            .join(" ")}
        </span>
      )}
    </div>
  );
};

export default Input;
