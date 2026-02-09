import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { ClassNames } from "../../utils";
import { SearchBoxInput } from "../atoms/SearchBoxInput";

type SearchBoxProps = {
  onSearch?: (value: string) => void;
  defaultValue?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  className?: ClassNames;
  placeholder?: string;
};

export const SearchBox = observer(({
  placeholder = "Search here...",
  className,
  onSearch,
  onChange,
  value: v,
  defaultValue,
}: SearchBoxProps) => {
  const [value, setValue] = useState(defaultValue ?? "");

  useEffect(() => {
    setValue(v ?? "");
  }, [v]);

  return (
    <SearchBoxInput
      className={className}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        onChange?.(e);
        setValue(e.target.value);
      }}
      onKeyDown={(e) =>
        e.key === "Enter" && value.trim() && onSearch?.(value)}
      value={value}
      placeholder={placeholder}
    />
  );
});
