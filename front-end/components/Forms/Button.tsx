import LoaderGif from "@/public/assets/loaders/loader2.gif";
import Image from "next/image";
import { twMerge } from "tailwind-merge";
const Button = ({
  children,
  disabled,
  loading,
  className,
  ...rest
}: // }: ButtonHTMLAttributes<HTMLButtonElement>) => {
any) => {
  const classButton = twMerge(
    `flex justify-center w-fit justify-center items-center rounded bg-success p-2 px-4 font-medium text-gray ${
      (loading || disabled) && "opacity-80 cursor-not-allowed"
    }`,
    className
  );
  return (
    // <div className="justify-center flex">
    <button className={classButton} disabled={loading || disabled} {...rest}>
      {loading ? (
        <Image width={25} height={25} src={LoaderGif} alt="Logo" />
      ) : (
        children
      )}
    </button>
    // </div>
  );
};

export default Button;
