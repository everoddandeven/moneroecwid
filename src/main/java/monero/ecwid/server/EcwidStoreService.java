package monero.ecwid.server;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

import org.json.JSONObject;

public class EcwidStoreService {

    private final Integer id;
    private final String token;

    public EcwidStoreService(Integer storeId, String token) {
        this.token = token;
        this.id = storeId;
    }

    public String updateOrderPaymentStatus(String orderId, String paymentStatus) throws Exception {
        // URL dell'API Ecwid
        String urlString = "https://app.ecwid.com/api/v3/" + id + "/orders/" + orderId;

        // Creazione dell'oggetto JSON per il payload
        JSONObject objectJson = new JSONObject();
        objectJson.put("paymentStatus", paymentStatus);
        String dataJson = objectJson.toString();

        // Apertura della connessione HTTP
        URL url = new URL(urlString);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();

        try {
            // Configurazione della connessione
            connection.setRequestMethod("PUT");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setRequestProperty("Authorization", "Bearer " + token);
            connection.setDoOutput(true);

            // Scrittura del payload nel corpo della richiesta
            try (OutputStream os = connection.getOutputStream()) {
                byte[] input = dataJson.getBytes("utf-8");
                os.write(input, 0, input.length);
            }

            // Lettura della risposta
            int responseCode = connection.getResponseCode();
            if (responseCode >= 200 && responseCode < 300) {
                return "Success: " + responseCode;
            } else {
                return "Error: " + responseCode + " " + connection.getResponseMessage();
            }
        } finally {
            // Chiusura della connessione
            connection.disconnect();
        }
    }

}
