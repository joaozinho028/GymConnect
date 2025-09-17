"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useColorContext } from "@/contexts/ColorContext";
import { IInputSelectProps } from "@/types/formInterfaces";
import { compararArraysDeObjetosPorLabel } from "@/utils";
import { forwardRef, useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import Select, {
  GroupBase,
  OptionsOrGroups,
  SelectInstance,
} from "react-select";
import CreatableSelect from "react-select/creatable";
import * as yup from "yup";

const InputSelectComponent = forwardRef<SelectInstance, IInputSelectProps>(
  (
    {
      name,
      label,
      width,
      options: newOptions,
      formulario,
      creatable,
      onChange,
      isMulti = false,
      defaultValue,
      required,
      disabled,
      menuPlacement = "auto",
      skipEffect = false,
      minimumCharacter = false,
      captureInputChange,
      removeDocumentBody = false,
      error,
      placeholder,
      dynamic = false,
      textSize = "text-md",
      labelSize = "text-md",
      formatOptionLabel,
      schema,
    }: IInputSelectProps,
    ref
  ) => {
    const SelectComponent = creatable ? CreatableSelect : Select;
    const { colorMode } = useColorContext();
    const [abertoPorSeta, setAbertoPorSeta] = useState(false);

    const [options, setOptions] = useState<
      OptionsOrGroups<any, GroupBase<any>> | { value: string; label: string }[]
    >([]);

    const [menuIsOpen, setMenuIsOpen] = useState(false);

    useEffect(() => {
      if (
        compararArraysDeObjetosPorLabel(
          newOptions as any[],
          options as any[]
        ) ||
        newOptions?.length === 0
      ) {
        setOptions(newOptions);
      }
    }, [newOptions]);

    useEffect(() => {
      if (formulario && name != undefined) {
        const newSchema = formulario.yupSchema.fields;
        if (isMulti) {
          newSchema[name] = required
            ? yup
                .array()
                .of(
                  yup
                    .string()
                    .transform((e) => (e.value ? String(e.value) : ""))
                )
                .min(1, "É necessário selecionar pelo menos um")
                .required(error)
            : yup
                .array()
                .of(
                  yup
                    .string()
                    .transform((e) => (e.value ? String(e.value) : ""))
                );
        } else {
          newSchema[name] = required
            ? yup
                .string()
                .transform((e) => (e.value ? String(e.value) : ""))
                .required(error)
            : yup.string().transform((e) => (e.value ? String(e.value) : ""));
        }
        newSchema[name] = schema || newSchema[name];
        formulario.setYupSchema(yup.object().shape(newSchema));
        if (
          defaultValue !== undefined &&
          options[0] != undefined &&
          !Object.keys(formulario.control._formValues).includes(name)
        ) {
          formulario.setValue(
            name as never,
            formulario.control._formValues[name] as never
          );
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

    useEffect(() => {
      if (skipEffect) return;
      if (defaultValue !== undefined && options[0] != undefined) {
        formulario?.setValue(
          name as never,
          (isMulti
            ? options.filter((option) => {
                if (typeof defaultValue === "string") {
                  return defaultValue.split(",").includes(String(option.value));
                }
                return false;
              })
            : options.find((option) => option.value == defaultValue)) as never
        );
      }
    }, [defaultValue, options, skipEffect]);

    return (
      <div className={`${width ? width : "w-full mt-1"}`}>
        {label && (
          <label
            htmlFor={name}
            className={`mb-1 block text-black dark:text-white whitespace-nowrap ${labelSize}`}
          >
            {label
              ?.split(" ")
              .map((str: string) => {
                return str.length > 3
                  ? str[0].toUpperCase() + str.slice(1)
                  : str;
              })
              .join(" ")}{" "}
            <span className="text-[#ff2b2b] font-semibold">
              {required && "*"}
            </span>
          </label>
        )}
        {minimumCharacter ||
        (options?.length > 0 &&
          options[0] !== undefined &&
          name !== undefined &&
          formulario !== undefined) ? (
          <Controller
            name={name || ""}
            control={formulario?.control}
            defaultValue={defaultValue ?? (isMulti ? [] : "")}
            render={({ field }) => {
              const {
                ref: fieldRef,
                onChange: fieldOnChange,
                ...restField
              } = field;

              return (
                <SelectComponent
                  onMenuOpen={() => setMenuIsOpen(true)}
                  onMenuClose={() => setMenuIsOpen(false)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown" && !menuIsOpen) {
                      e.preventDefault();
                      setMenuIsOpen(true);
                      setAbertoPorSeta(true);
                    }

                    if (e.key === "ArrowUp" && menuIsOpen && abertoPorSeta) {
                      e.preventDefault();
                      setMenuIsOpen(false);
                      setAbertoPorSeta(false);
                      const parent =
                        document.activeElement?.closest(".select__control");
                      if (parent) {
                        (parent as HTMLElement).focus();
                      }
                    }
                  }}
                  {...restField}
                  ref={(instance: any) => {
                    if (fieldRef) {
                      if (typeof fieldRef === "function") {
                        fieldRef(instance);
                      } else {
                        (fieldRef as React.MutableRefObject<any>).current =
                          instance;
                      }
                    }
                    if (ref) {
                      if (typeof ref === "function") {
                        ref(instance);
                      } else if ("current" in ref) {
                        (ref as React.MutableRefObject<any>).current = instance;
                      }
                    }
                  }}
                  onFocus={() => {
                    setMenuIsOpen(false);
                    setAbertoPorSeta(false);
                  }}
                  onBlur={() => {
                    setMenuIsOpen(false);
                    setAbertoPorSeta(false);
                  }}
                  onChange={(selectedOption, actionMeta) => {
                    fieldOnChange(selectedOption, actionMeta);
                    if (onChange) onChange(selectedOption);
                    if (!isMulti) setMenuIsOpen(false);
                  }}
                  options={options}
                  isMulti={isMulti}
                  menuPlacement={menuPlacement}
                  isDisabled={disabled}
                  menuIsOpen={menuIsOpen}
                  placeholder={placeholder || "Selecione uma opção"}
                  styles={{
                    option: (provided, state) => ({
                      ...provided,
                      backgroundColor: state.isSelected
                        ? "#2684FF"
                        : state.isFocused
                        ? colorMode == "dark"
                          ? "#2c3e50"
                          : "#f0f0f0"
                        : colorMode == "dark"
                        ? "#1d2a39"
                        : "#fff",
                      color: state.isSelected
                        ? "#fff"
                        : colorMode == "dark"
                        ? "#fff"
                        : "inherit",
                      padding: "3px 9px",
                    }),
                    menuPortal: (base) => ({
                      ...base,
                      zIndex: 9999999999,
                      backgroundColor:
                        colorMode == "dark"
                          ? "#1d2a39 !important"
                          : "#fff !important",
                      fontSize: "13px !important",
                    }),
                    valueContainer: (base) => ({
                      ...base,
                      display: "flex",
                      flexWrap: "wrap",
                      maxHeight: 38,
                      overflowY: "auto",
                      scrollSnapType: "y mandatory",
                      scrollPaddingTop: 4,
                      scrollBehavior: "smooth",
                    }),
                    multiValue: (base) => ({
                      ...base,
                      scrollSnapAlign: "start",
                      margin: "2px 4px",
                      flexShrink: 0,
                    }),
                    control: (base) => ({
                      ...base,
                      minHeight: 38,
                    }),
                    input: (base) => ({
                      ...base,
                      margin: "0px",
                      padding: "0px",
                    }),
                    indicatorsContainer: (base) => ({
                      ...base,
                      height: "38px",
                    }),
                  }}
                  menuPortalTarget={removeDocumentBody ? null : document.body}
                  formatOptionLabel={formatOptionLabel}
                />
              );
            }}
          />
        ) : (
          <Skeleton className="relative w-full h-[33px] css-t3ipsp-control" />
        )}
        {formulario?.errors && name && formulario.errors[name] && (
          <span className="text-red-500 text-sm">
            {formulario.errors[name]?.message
              ?.split(" ")
              .map((str: string) => {
                return str.length > 3
                  ? str[0].toUpperCase() + str.slice(1)
                  : str;
              })
              .join(" ")}
          </span>
        )}
      </div>
    );
  }
);

export default InputSelectComponent;
