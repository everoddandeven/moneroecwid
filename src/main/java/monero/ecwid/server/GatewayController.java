package monero.ecwid.server;

import java.math.BigInteger;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import monero.ecwid.model.EcwidPaymentData;
import monero.ecwid.model.EcwidPaymentDataDecoder;
import monero.ecwid.model.EcwidPaymentRequest;
import monero.ecwid.server.core.XmrConverter;
import monero.ecwid.server.repository.PaymentRequest;
import monero.ecwid.server.repository.PaymentRequestService;

import org.springframework.ui.Model;


@Controller
public class GatewayController {
    private static final Logger logger = LoggerFactory.getLogger(GatewayController.class);

    @Autowired
    private final PaymentRequestService paymentRequestService;

    public GatewayController(PaymentRequestService paymentRequestService) {
        this.paymentRequestService = paymentRequestService;
    }

    public static BigInteger convertUsdToXmr(Float usdTotal) throws Exception {
        return XmrConverter.convertUsdToPiconero(usdTotal);
    }

    @PostMapping(path = "/v1/monero/ecwid", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public String onPayment(EcwidPaymentRequest requestBody, Model model) {
        EcwidPaymentData paymentData;

        try {
            String clientSecret = "";

            paymentData = EcwidPaymentDataDecoder.decode(requestBody.data, clientSecret);
        }
        catch(Exception e) {
            logger.error(e.getMessage());
            model.addAttribute("error", e.getMessage());

            return "error.html";
        }

        String orderId = paymentData.cart.order.id;
        String txId = paymentData.cart.order.referenceTransactionId;
        Float usdTotal = paymentData.cart.order.usdTotal;
        String returnUrl = paymentData.returnUrl;

        logger.info("onPaymentRequest(): order id: " + orderId + ", tx id: " + txId + ", usd total: " + usdTotal);

        PaymentRequest request;

        try {
            request = paymentRequestService.newPaymentRequest(txId, usdTotal, convertUsdToXmr(usdTotal), returnUrl);
        }
        catch (Exception e) {
            logger.error(txId, e);
            model.addAttribute("error", e.getMessage());

            return "error.html";
        }
        
        BigInteger xmrAmount = request.getAmountXmr().divide(BigInteger.valueOf(1000000000000l));
        model.addAttribute("title", "Monero Payment | Order " + txId);
        model.addAttribute("returnUrl", returnUrl);
        model.addAttribute("address", request.getAddress());
        model.addAttribute("amountXmr", xmrAmount + " XMR");
        model.addAttribute("txId", txId);
        model.addAttribute("amountUsd", request.getAmountUsd() + " USD");
        model.addAttribute("status", request.getStatus());

        return "payment.html";
    }

    @PostMapping(path = "/v1/monero/ecwid/test")
    public String onTestPayment(@RequestBody(required = true) EcwidPaymentData paymentData, Model model) {
        String orderId = paymentData.cart.order.id;
        String txId = paymentData.cart.order.referenceTransactionId;
        Float usdTotal = paymentData.cart.order.usdTotal;
        String returnUrl = paymentData.returnUrl;

        logger.info("onPaymentRequest(): order id: " + orderId + ", tx id: " + txId + ", usd total: " + usdTotal);

        PaymentRequest request;

        try {
            request = paymentRequestService.newPaymentRequest(txId, usdTotal, convertUsdToXmr(usdTotal), returnUrl);
        }
        catch (Exception e) {
            logger.error(txId, e);
            model.addAttribute("error", e.getMessage());

            return "error.html";
        }
        
        BigInteger xmrAmount = request.getAmountXmr().divide(BigInteger.valueOf(1000000000000l));
        model.addAttribute("title", "Monero Payment | Order " + txId);
        model.addAttribute("returnUrl", returnUrl);
        model.addAttribute("address", request.getAddress());
        model.addAttribute("amountXmr", xmrAmount + " XMR");
        model.addAttribute("txId", txId);
        model.addAttribute("amountUsd", request.getAmountUsd() + " USD");
        model.addAttribute("status", request.getStatus());

        return "payment.html";
    }

    @GetMapping(path = "/v1/monero/ecwid/payment")
    public String getPaymentPage(@RequestParam(required = true) String id, Model model) {
        PaymentRequest request;

        try {
            Optional<PaymentRequest> result = paymentRequestService.repository.findById(id);

            if (result.isEmpty()) {
                throw new Exception("Order " + id + " not found");
            }

            request = result.get();
        }
        catch (Exception e) {
            logger.error(e.getMessage(), e);
            model.addAttribute("error", e.getMessage());

            return "error.html";
        }

        String returnUrl = request.getReturnUrl();

        BigInteger xmrAmount = request.getAmountXmr().divide(BigInteger.valueOf(1000000000000l));

        model.addAttribute("returnUrl", returnUrl);
        model.addAttribute("title", "Monero Payment | Order " + id);
        model.addAttribute("txId", id);
        model.addAttribute("address", request.getAddress());
        model.addAttribute("amountXmr", xmrAmount + " XMR");
        model.addAttribute("amountUsd", request.getAmountUsd() + " USD");
        model.addAttribute("status", request.getStatus());
        return "payment.html"; // Nome del file HTML nella cartella `src/main/resources/templates`
    }

    @PostMapping(path = "/v1/monero/ecwid/getPayment")
    @ResponseBody
    public PaymentRequest getPayment(@RequestParam(required = true) String id) throws Exception {
        Optional<PaymentRequest> req = paymentRequestService.repository.findById(id);

        if (req.isPresent()) {
            return req.get();
        }

        throw new Exception("Request " + id + " not found");
    }

}
