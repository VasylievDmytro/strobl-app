const currencyFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR"
});

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "medium"
});

const quantityFormatter = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

export function toInputDate(value?: string) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}

export function hoursLabel(value: number) {
  return `${value.toFixed(1)} h`;
}

export function formatQuantity(value: number) {
  return quantityFormatter.format(value);
}
