import { EcwidPaymentData } from './EcwidPaymentData';
import crypto from 'crypto';

export type CipherAlgorithm = 'aes128' | 'aes-128-cbc' | 'aes192' | 'aes256';

export abstract class EcwidPaymentDataDecoder {

  private static readonly CIPHERS: Record<string, CipherAlgorithm> = {
    AES_128: 'aes128', // Requires 16-byte key
    AES_128_CBC: 'aes-128-cbc', // Requires 16-byte key
    AES_192: 'aes192', // Requires 24-byte key
    AES_256: 'aes256', // Requires 32-byte key
  };

  private static decryptText(cipher_alg: CipherAlgorithm, key: Buffer, text: string, encoding: BufferEncoding): Buffer {
    const bText = Buffer.from(text, encoding);
    const iv = bText.subarray(0, 16); // Usato subarray al posto di slice
    const payload = bText.subarray(16);
    const decipher = crypto.createDecipheriv(cipher_alg, key, iv);
    return Buffer.concat([decipher.update(payload), decipher.final()]);
  }

  private static decryptData(client_sec: string | Buffer, payload: string): Buffer | any {
    const encryption_key = Buffer.from(client_sec).subarray(0, 16); // Usato subarray per estrarre i primi 16 byte
    const originalBase64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const algorithm: CipherAlgorithm | undefined = this.CIPHERS.AES_128_CBC;

    if (!algorithm) {
      throw new Error('Algorithm not found');
    }

    const decrypted = this.decryptText(algorithm, encryption_key, originalBase64, 'base64');
    
    try {
      // Tenta di interpretare il risultato come JSON
      if (typeof payload !== 'object') {
        throw new Error();
      }

      return JSON.parse(decrypted.toString());
    } catch {
      // Se non è un oggetto JSON, risolve con il buffer decriptato
      return decrypted;
    }
  };

  public static decodePaymentData(client_sec: string | Buffer, payload: string): EcwidPaymentData {
    return JSON.parse(this.decryptData(client_sec, payload)) as EcwidPaymentData;
  }

  public static makeHash(data: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(data);
    const finalHash = hash.digest('hex');
    return finalHash;
  }
}