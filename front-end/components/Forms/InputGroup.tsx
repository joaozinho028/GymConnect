import React, { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

interface IInputGroup extends React.InputHTMLAttributes<HTMLInputElement> {
  children: ReactNode;
  align?: string;
  wrap?: string;
  className?: string;
}

const InputGroup = ({ children, align, wrap, className }: IInputGroup) => {
  const inputGroupClassName = twMerge(
    `mb-2 flex justify-${align} flex-col gap-2 lg:flex-row flex-${
      wrap ? "wrap" : "wrap-no-wrap"
    }`,
    className
  );
  return <div className={inputGroupClassName}>{children}</div>;
};
export default InputGroup;
