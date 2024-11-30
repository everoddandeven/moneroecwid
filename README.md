# Monero ECWID

This project provides a payment integration solution for Ecwid stores using Monero as a payment method. It leverages the Monero Light Wallet Server (LWS) API for seamless integration, ensuring secure and private payments.

## Features

- **Monero Payment Gateway**: Integrate Monero as a payment method in your Ecwid store.
- **Light Wallet Server (LWS)**: Uses Monero's LWS API for transaction management.
- **Easy Setup**: Simplified integration process for Ecwid store owners.
- **Secure Transactions**: Monero ensures privacy and security for both merchants and customers.
- **Real-Time Payment Status**: Get immediate updates on payment status using the LWS API.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** (v14 or later)
- **Monero Light Wallet Server (LWS)**: A running instance of LWS for managing Monero transactions. You can set it up following the instructions in the [Monero LWS repository](https://github.com/vtnerd/monero-lws).
- **Ecwid Store**: An active Ecwid store with API access enabled.

## Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/everoddandeven/monero-ecwid.git
   cd monero-ecwid
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start server application**

   ```bash
   npm start
   ```

## Usage

1. Create Payment Request: The integration will handle creating a Monero payment request when a customer proceeds to checkout in your Ecwid store.
2. Handle Payment: Once the payment is initiated, the integration will monitor the transaction using LWS and provide real-time updates to both the merchant and the customer.
3. Payment Confirmation: Once the payment is confirmed, the order status in Ecwid will be updated, and the customer will be redirected to the confirmation page.
4. Error Handling: If there are any issues with the payment (e.g., payment not received or canceled), appropriate error messages will be displayed to the customer.

## Example Flow

1. A customer selects Monero as the payment method at checkout.
2. The server generates a Monero invoice using the LWS API.
3. The customer pays the invoice to complete the transaction.
4. Once the transaction is confirmed, the Ecwid store's order status is updated to "Paid".
5. The customer is redirected to a confirmation page.

## Donating

Please consider donating to support the development of this project.

### Monero

<p align="center">
 <img src="xmr_qrcode.png" width="115" height="115" alt="xmrQrCode"/><br>
 <code>87qmeEtvQvuELasb4ybjV4iE17KF14SKTPvhgzAwrD5k1vWZUTqsWM52pbyHy8Wb97jCkq4pm5hLKaw39pEnvUKPPf3GFJA</code>
</p>
