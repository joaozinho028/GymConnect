import { ReactNode } from "react";
import { UseFormSetValue } from "react-hook-form";
import {
  FormatOptionLabelMeta,
  GroupBase,
  OptionsOrGroups,
} from "react-select";
import * as yup from "yup";

export interface IValueLabel {
  value: string;
  label: string;
}

export interface IInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "defaultChecked"> {
  label?: string;
  rows?: number;
  typeFile?: string;
  cols?: number;
  formulario?:
    | {
        register: Function;
        errors: any;
        control: any;
        //   yupSchema:
        //       | yup.ObjectSchema<FieldValues, yup.AnyObject, any, "">
        //       | yup.Lazy<{ [x: string]: any }, yup.AnyObject, any>;
        yupSchema: any;
        //   yupSchema: yup.ObjectSchema<{}, yup.AnyObject, {}, "">;
        setYupSchema: any;
        setValue: UseFormSetValue<{}>;
      }
    | undefined;
  mascara?:
    | "telefone"
    | "data"
    | "cep"
    | "cpf"
    | "cnpj"
    | "numero"
    | "numeroPreciso"
    | "numeroDecimal"
    | "numerico"
    | "letras"
    | "letrasNumeros"
    | "mesAno"
    | "hora"
    | "cpfCnpj"
    | "placa";
  defaultValue?: string;
  [rest: string]: any;
  error?: string;
  name?: string;
  isPassword?: boolean;
  equals?: string;
  onInputProp?: Function;
  onRemoveFile?: Function;
  clearBtn?: Boolean;
  inputClassName?: string;
  prefixWidth?: string | false;
  prefix?: any;
  dynamic?: Boolean;
  maxLength?: number;
  schema?: yup.AnyObject;
  textSize?: string;
  labelSize?: string;
}

export interface IInputSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  width?: string;
  removeDocumentBody?: boolean;
  creatable?: boolean;
  minimumCharacter?: boolean;
  captureInputChange?: any;
  menuPlacement?: string | undefined | any;
  options:
    | OptionsOrGroups<any, GroupBase<any>>
    | { value: string; label: string }[];
  //  newOptions:
  //   | OptionsOrGroups<any, GroupBase<any>>
  //   | { value: string; label: string }[];
  formulario?:
    | {
        register: Function;
        errors: any;
        control: any;
        //   yupSchema: yup.ObjectSchema<FieldValues, yup.AnyObject, any, ""> | yup.Lazy<{ [x: string]: any; }, yup.AnyObject, any>;
        yupSchema: any;
        setYupSchema: any;
        setValue: UseFormSetValue<{}>;
      }
    | undefined;
  name?: string;
  defaultValue?: any;
  required?: boolean;
  isMulti?: boolean;
  error?: string;
  skipEffect?: boolean;
  placeholder?: string;
  dynamic?: boolean;
  textSize?: string;
  labelSize?: string;
  maxLength?: number;
  formatOptionLabel?: (
    data: any,
    formatOptionLabelMeta: FormatOptionLabelMeta<any>
  ) => ReactNode;
  schema?: yup.AnyObject;
}

export interface IValueLabelConstructor {
  arr: any[];
  value: string;
  label: string;
}
