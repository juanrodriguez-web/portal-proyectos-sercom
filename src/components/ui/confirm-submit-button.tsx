"use client";

export function ConfirmSubmitButton({
  children,
  confirmMessage,
  className,
  style,
}: {
  children: React.ReactNode;
  confirmMessage: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="submit"
      className={className}
      style={style}
      onClick={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
