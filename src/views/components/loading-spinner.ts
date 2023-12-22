const sizeMap = {
  small: "16px",
  medium: "24px",
  large: "40px",
  xlarge: "48px",
};

export const loadingSpinner = ({
  size,
}: {
  size: "small" | "medium" | "large";
}) => {
  return `<i class="codicon codicon-loading gcp-spinner" style="font-size: ${sizeMap[size]};"></i>`;
};
