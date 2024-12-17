package monero.ecwid.server.repository;

import java.math.BigInteger;
import java.util.Date;

import jakarta.persistence.*;

@Entity
@Table(name = "payment_requests")
public class PaymentRequest {
    @Id()
    @Column(name = "tx_id", nullable = false)
    private String txId;

    @Column(name = "store_id", nullable = false)
    private Integer storeId;

    @Column(name = "store_token", nullable = false)
    private String storeToken;

    @Column(name = "address", nullable = false)
    private String address;

    @Column(name = "address_account_index", nullable = false)
    private Integer addressAccountIndex;

    @Column(name = "address_index", nullable = false)
    private Integer addressIndex;

    @Column(name = "amount_usd", nullable = false)
    private Float amountUsd;

    @Column(name = "amount_xmr", nullable = false)
    private BigInteger amountXmr;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "return_url", nullable = false)
    private String returnUrl;

    @Column(name = "created_at", nullable = true)
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;

    @Column(name = "updated_at", nullable = true)
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt;

    public String getTxId() {
        return txId;
    }

    public void setTxId(String value) {
        txId = value;
    }

    public Integer getStoreId() {
        return storeId;
    }

    public void setStoreId(Integer value) {
        storeId = value;
    }

    public String getStoreToken() {
        return storeToken;
    }

    public void setStoreToken(String value) {
        storeToken = value;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String value) {
        address = value;
    }

    public Integer getAddressAccountIndex() {
        return addressAccountIndex;
    }

    public void setAddressAccountIndex(Integer index) {
        addressAccountIndex = index;
    }

    public Integer getAddressIndex() {
        return addressIndex;
    }

    public void setAddressIndex(Integer value) {
        addressIndex = value;
    }
    
    public Float getAmountUsd() {
        return amountUsd;
    }

    public void setAmountUsd(Float value) {
        amountUsd = value;
    }

    public BigInteger getAmountXmr() {
        return amountXmr;
    }

    public void setAmountXmr(BigInteger value) {
        amountXmr = value;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String value) {
        status = value;
    }

    public String getReturnUrl() {
        return returnUrl;
    }

    public void setReturnUrl(String url) {
        returnUrl = url;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public Date getUpdatedAt() {
        return updatedAt;
    }

}
