/**
 * Indian Numbering System and Currency Formatters (₹ INR)
 * Supports GST Tax Invoice "Amount in Words" statutory requirement
 */

export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0.00';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatINRNumber(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0.00';
  }
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Converts a numeric amount into Indian English Words
 * e.g. 1540.50 => "Rupees One Thousand Five Hundred Forty and Fifty Paise Only"
 */
export function numberToIndianWords(amount: number): string {
  if (isNaN(amount) || amount === 0) return 'Rupees Zero Only';

  const singleDigits = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  ];
  const twoDigits = [
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tensMultiple = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
  ];

  function convertTwoDigits(n: number): string {
    if (n === 0) return '';
    if (n < 10) return singleDigits[n];
    if (n >= 10 && n < 20) return twoDigits[n - 10];
    const tens = Math.floor(n / 10);
    const unit = n % 10;
    return tensMultiple[tens] + (unit !== 0 ? ' ' + singleDigits[unit] : '');
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    let res = '';
    if (hundred > 0) {
      res += singleDigits[hundred] + ' Hundred';
      if (remainder > 0) res += ' ';
    }
    if (remainder > 0) {
      res += convertTwoDigits(remainder);
    }
    return res;
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const rupees = Math.floor(absAmount);
  const paise = Math.round((absAmount - rupees) * 100);

  let rupeesPart = '';

  // Indian groupings: Crores (1,00,00,000), Lakhs (1,00,000), Thousands (1,000), Hundreds (100)
  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const hundredAndBelow = rupees % 1000;

  if (crore > 0) {
    rupeesPart += convertTwoDigits(crore) + ' Crore ';
  }
  if (lakh > 0) {
    rupeesPart += convertTwoDigits(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    rupeesPart += convertTwoDigits(thousand) + ' Thousand ';
  }
  if (hundredAndBelow > 0) {
    rupeesPart += convertThreeDigits(hundredAndBelow) + ' ';
  }

  rupeesPart = rupeesPart.trim() || 'Zero';

  let result = (isNegative ? 'Minus ' : '') + 'Rupees ' + rupeesPart;

  if (paise > 0) {
    result += ' and ' + convertTwoDigits(paise) + ' Paise';
  }

  result += ' Only';
  return result;
}
