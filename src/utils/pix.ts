import QRCode from 'qrcode';

function sanitizeAscii(text: string, maxLen: number): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 .\-]/g, '')
    .trim()
    .slice(0, maxLen)
    .toUpperCase();
}

function tlv(id: string, value: string): string {
  const len = String(value.length).padStart(2, '0');
  return `${id}${len}${value}`;
}

/**
 * CRC16-CCITT (polynomial 0x1021, initial value 0xFFFF)
 * Required by Banco Central do Brasil EMVCo PIX BR Code specification
 */
function crc16ccitt(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export interface PixParams {
  key: string;
  name: string;
  city: string;
  amount?: number | null;
  txid?: string;
  description?: string;
}

export function generatePixPayload({
  key,
  name,
  city,
  amount,
  txid = 'LENKYXAPP',
  description,
}: PixParams): string {
  const cleanKey = key.trim();
  const cleanName = sanitizeAscii(name || 'LENKYX', 25) || 'LENKYX';
  const cleanCity = sanitizeAscii(city || 'BRASIL', 15) || 'BRASIL';
  const cleanTxid = (txid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 25) || 'LENKYXAPP');

  const gui = tlv('00', 'br.gov.bcb.pix');
  const keyField = tlv('01', cleanKey);
  const descField = description ? tlv('02', sanitizeAscii(description, 40)) : '';
  const merchantAccountInfo = tlv('26', `${gui}${keyField}${descField}`);

  const parts = [
    tlv('00', '01'), // Payload Format Indicator
    merchantAccountInfo,
    tlv('52', '0000'), // Merchant Category Code
    tlv('53', '986'), // BRL currency
  ];

  if (amount && amount > 0) {
    parts.push(tlv('54', amount.toFixed(2)));
  }

  parts.push(
    tlv('58', 'BR'),
    tlv('59', cleanName),
    tlv('60', cleanCity),
    tlv('62', tlv('05', cleanTxid)),
    '6304'
  );

  const withoutCrc = parts.join('');
  return withoutCrc + crc16ccitt(withoutCrc);
}

export async function generatePixQrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    width: 320,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#14082b',
      light: '#ffffff',
    },
  });
}
