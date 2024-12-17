package monero.ecwid.server.repository;

import java.math.BigInteger;
import java.util.Date;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import monero.ecwid.model.EcwidStoreService;
import monero.ecwid.server.core.WalletUtils;
import monero.wallet.MoneroWalletFull;
import monero.wallet.model.MoneroOutputWallet;
import monero.wallet.model.MoneroSubaddress;
import monero.wallet.model.MoneroWalletListener;

@Service
public class PaymentRequestService {
    @Autowired
    public final PaymentRequestRepository repository;
    @Autowired
    public final MoneroTransactionRepository transactionRepository;
    public final MoneroWalletFull wallet;
    private static final Logger logger = LoggerFactory.getLogger(PaymentRequestService.class);

    private class WalletListener extends MoneroWalletListener {

        private PaymentRequestService paymentRequestService;

        public WalletListener(PaymentRequestService paymentRequestService) {
            this.paymentRequestService = paymentRequestService;
        }

        private void refreshPaymentRequests() {
            List<PaymentRequest> requests = paymentRequestService.repository.findAll();

            for (PaymentRequest paymentRequest : requests) {
                Date now = new Date();
                long diffInMillis = Math.abs(paymentRequest.getCreatedAt().getTime() - now.getTime());
                long diffInMinutes = diffInMillis / (60 * 1000); // Converti in minuti
                String status = paymentRequest.getStatus();
                String txId = paymentRequest.getTxId();
                
                if (status.equals("UNPAID") && diffInMinutes >= 15) {
                    EcwidStoreService storeService = EcwidStoreService.getService(paymentRequest.getStoreId(), paymentRequest.getStoreToken());
                    
                    try {
                        storeService.setOrderCancelled(txId);
                                        
                        logger.info("Setting tx " + txId + " as expired");
                        paymentRequest.setStatus("EXPIRED");
                        paymentRequestService.repository.save(paymentRequest);
                    }
                    catch (Exception e) {
                        logger.error("Could not set order cancelled", e);
                    }
                }
            }
        }
        
        @Override
        public void onOutputReceived(MoneroOutputWallet output) {
            BigInteger amount = output.getAmount();
            String txHash = output.getTx().getHash();
            Boolean isConfirmed = output.getTx().isConfirmed();
            Boolean isLocked = output.getTx().isLocked();
            Long confirmations = output.getTx().getNumConfirmations();

            Optional<MoneroTransaction> moneroTransaction = this.paymentRequestService.transactionRepository.findById(txHash);

            if (!moneroTransaction.isEmpty()) {
                logger.info("output already processed " + amount + ", tx hash: " + txHash + ", confirmed: " + isConfirmed + ", is locked: " + isLocked);
                return;
            }

            logger.info("Received output " + amount + ", tx hash: " + txHash + ", confirmed: " + isConfirmed + ", is locked: " + isLocked + ", confirmations: " + confirmations);

            MoneroSubaddress address = this.paymentRequestService.wallet.getSubaddress(output.getAccountIndex(), output.getSubaddressIndex());

            logger.info("Got address: " + address);

            PaymentRequest req = this.paymentRequestService.repository.findByAddress(address.getAddress());

            if (req == null) {
                logger.info("No payment request found");
                return;
            }

            logger.info("Geot req amount: " + req.getAmountXmr());

            if (req.getStatus().equals("UNPAID") && req.getAmountXmr().equals(amount)) {
                req.setStatus("PAID");
            }
            else {
                logger.info("Partially paid");
            }

            MoneroTransaction transaction = new MoneroTransaction();
            
            transaction.setTxHash(txHash);
            transaction.setTxId(req.getTxId());
            transaction.setAmount(amount);
            
            // Send update status to ecwid before redirect

            EcwidStoreService storeService = EcwidStoreService.getService(req.getStoreId(), req.getStoreToken());

            try {
                if (req.getStatus() == "PAID") {
                    storeService.setOrderPaid(req.getTxId());
                }

                this.paymentRequestService.transactionRepository.save(transaction);
            }
            catch (Exception e) {
                logger.error("Could not update order status", e);
            }

        }

        @Override
        public void onSyncProgress(long height, long startHeight, long endHeight, double percentDone, String message) {
            logger.info(message + " " + percentDone*100 + "%");

            refreshPaymentRequests();
        }
    }

    private MoneroWalletListener walletListener;

    public PaymentRequestService(PaymentRequestRepository repository, MoneroTransactionRepository transactionRepository) {
        this.repository = repository;
        this.wallet = WalletUtils.getWallet();
        this.walletListener = new WalletListener(this);
        this.wallet.addListener(walletListener);
        this.transactionRepository = transactionRepository;
    }

    public List<PaymentRequest> getAll() {
        return this.repository.findAll();
    }

    public PaymentRequest newPaymentRequest(String txId, Integer storeId, String storeToken, Float amountUsd, BigInteger amountXmr, String returnUrl) throws PaymentRequestAlreadyExistsException {
        if (this.repository.existsById(txId)) {
            throw new PaymentRequestAlreadyExistsException(txId);
        }
        
        PaymentRequest request = new PaymentRequest();
        MoneroSubaddress subaddress = WalletUtils.getUnusedSubaddress(this.wallet, txId);

        request.setTxId(txId);
        request.setAddress(subaddress.getAddress());
        request.setAddressAccountIndex(subaddress.getAccountIndex());
        request.setAddressIndex(subaddress.getIndex());
        request.setAmountUsd(amountUsd);
        request.setAmountXmr(amountXmr);
        request.setStatus("UNPAID");
        request.setReturnUrl(returnUrl);
        request.setStoreId(storeId);
        request.setStoreToken(storeToken);

        return this.repository.save(request);
    }
}
