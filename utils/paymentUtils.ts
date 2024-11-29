import { makeRequest, RequestError, RequestResult } from './requestUtils';
import { makeHash } from './cryptoUtils';

interface PaymentData {
  cart: {
    order: {
      id: string;
      total: number;
      email: string;
    };
    currency: string;
  };
  merchantAppSettings: {
    terminalid: string;
    merchantkey: string;
    password: string;
    testmode: string;
  };
  returnUrl: string;
}

interface PaymentGatewayResponse {
  payid: string | null;
  targetUrl: string | null;
  responseCode?: string;
}

interface PaymentError {
  error: string;
  returnUrl: string;
}

type PaymentResult = string | PaymentError;

const makePayment = async (paymentData: PaymentData): Promise<PaymentResult> => {
  const { id, total, email } = paymentData.cart.order;
  const { terminalid, merchantkey, password, testmode } = paymentData.merchantAppSettings;
  const { currency } = paymentData.cart;
  const { returnUrl } = paymentData;

  try {
    // Determina l'URL del gateway di pagamento
    const paymentGateWayUrl = testmode === 'true' ? process.env.TEST : process.env.LIVE;
    if (!paymentGateWayUrl) {
      throw new Error('Payment gateway URL is not defined in the environment variables.');
    }

    // Crea il hash per la richiesta
    const hash = await makeHash(`${id}|${terminalid}|${password}|${merchantkey}|${total}|${currency}`);

    const paymentPayload = {
      terminalId: terminalid,
      password: password,
      amount: total,
      trackid: id,
      action: '1',
      requestHash: hash,
      merchantIp: '10.10.10.10',
      currency: currency,
      customerEmail: email,
      country: 'SA',
      udf2: 'https://urway-ecwid.herokuapp.com/process_payment',
      udf1: returnUrl,
      udf3: '',
      udf4: '',
      udf5: '',
    };

    // Effettua la richiesta al gateway di pagamento
    const _payRes: RequestResult<PaymentGatewayResponse> = await makeRequest<PaymentGatewayResponse>(
      paymentGateWayUrl,
      'POST',
      paymentPayload
    );

    const payRes = _payRes as PaymentGatewayResponse;
    const payError = _payRes as RequestError;

    // Gestione degli errori nella risposta
    if (!payRes.payid || !payRes.targetUrl) {
      console.error('Errore nella risposta del gateway:', payRes);

      return {
        error: payError.error || 'Unknown error',
        returnUrl,
      };
    }

    // Costruisci l'URL di reindirizzamento
    const redirectUrl = `${payRes.targetUrl}?paymentid=${payRes.payid}`;
    return redirectUrl;

  } catch (err) {
    console.error('Errore durante la richiesta di pagamento:', err);
    throw new Error(err instanceof Error ? err.message : 'Errore sconosciuto');
  }
};

export { makePayment, PaymentResult, PaymentError, PaymentGatewayResponse, PaymentData }