import crypto, { createHash } from 'crypto';

type CipherAlgorithm = 'aes128' | 'aes-128-cbc' | 'aes192' | 'aes256';

interface EncryptionHelperType {
  CIPHERS: Record<string, CipherAlgorithm>;
  decryptText: (
    cipher_alg: CipherAlgorithm,
    key: Buffer,
    text: string,
    encoding: BufferEncoding
  ) => Buffer;
}

const EncryptionHelper: EncryptionHelperType = (function () {
  function decryptText(
    cipher_alg: CipherAlgorithm,
    key: Buffer,
    text: string,
    encoding: BufferEncoding
  ): Buffer {
    const bText = Buffer.from(text, encoding);
    const iv = bText.subarray(0, 16); // Usato subarray al posto di slice
    const payload = bText.subarray(16);
    const decipher = crypto.createDecipheriv(cipher_alg, key, iv);
    return Buffer.concat([decipher.update(payload), decipher.final()]);
  }

  return {
    CIPHERS: {
      AES_128: 'aes128', // Requires 16-byte key
      AES_128_CBC: 'aes-128-cbc', // Requires 16-byte key
      AES_192: 'aes192', // Requires 24-byte key
      AES_256: 'aes256', // Requires 32-byte key
    },
    decryptText,
  };
})();

interface DecryptDataOutput {
  (client_sec: string | Buffer, payload: string): Promise<Buffer | any>;
}

const decryptData: DecryptDataOutput = (client_sec, payload) => {
  return new Promise((resolved, rejected) => {
    const encryption_key = Buffer.from(client_sec).subarray(0, 16); // Usato subarray per estrarre i primi 16 byte
    const originalBase64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const algorithm: CipherAlgorithm = EncryptionHelper.CIPHERS.AES_128_CBC;

    try {
      const decrypted = EncryptionHelper.decryptText(algorithm, encryption_key, originalBase64, 'base64');
      try {
        // Tenta di interpretare il risultato come JSON
        if (typeof payload !== 'object') {
          throw new Error();
        }

        const payloadObject = JSON.parse(decrypted.toString());
        resolved(payloadObject);
      } catch {
        // Se non è un oggetto JSON, risolve con il buffer decriptato
        resolved(decrypted);
      }
    } catch (e) {
      console.error('Errore durante la decriptazione:', e);
      rejected(e);
    }
  });
};

interface RequestHash {
  (data: string): string;
}

const makeHash: RequestHash = (data: string): string => {
  const hash = createHash('sha256');
  hash.update(data);
  const finalHash = hash.digest('hex');
  return finalHash;
}

export { EncryptionHelper, EncryptionHelperType, decryptData, makeHash };
