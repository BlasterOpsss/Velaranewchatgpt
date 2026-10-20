export function Mark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <img
      src="/brand/velara-mark.png"
      alt=""
      aria-hidden="true"
      width={512}
      height={512}
      className={`${className} object-contain`}
      draggable={false}
    />
  );
}

export function Wordmark({ className = "text-xl" }: { className?: string }) {
  return <span className={`wordmark ${className}`}>VELARA</span>;
}
