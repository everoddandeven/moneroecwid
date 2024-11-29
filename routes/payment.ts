import express from 'express';
import { decryptData, makeHash, makeRequest, makePayment, PaymentError, PaymentResult, responseDes } from '../utils';

const router = express.Router();
const codes = JSON.parse(responseDes);

router.post('/', async (req, res, next) => {
	if (req.body) {
		try {
			let data = await decryptData(process.env.CLIENT_SECRET as string, req.body.data);
			let paymentData = JSON.parse(data);
			const { referenceTransactionId } = paymentData.cart.order;
			const { storeId, token } = paymentData;
			const { merchantkey } = paymentData.merchantAppSettings;
			res.cookie('refrenceTransactionId', referenceTransactionId);
			res.cookie('storeId', storeId);
			res.cookie('token', token);
			res.cookie('merchantKey', merchantkey);
			let _response = await makePayment(paymentData);
            let response = _response as string;
            let responseError = _response as PaymentError;
			console.log(response);
			console.log('checking the error code', responseError.error);
			console.log('checking the type', typeof responseError.error);
			
            if (responseError.error) {
				let updateUrl = `https://app.ecwid.com/api/v3/${storeId}/orders/${referenceTransactionId}?token=${token}`;
				let updateReqeust = await makeRequest(updateUrl, 'PUT', { paymentStatus: 'INCOMPLETE' });
				console.log('initial to pg failed', updateReqeust);
				console.log(responseError.error);
				let encode = encodeURI(`${responseError.returnUrl}&errorMsg=${codes[responseError.error]}`);
				res.status(200).redirect(encode);
			}
			
            console.log(response);

			if (!responseError.error) res.status(200).redirect(response);
		} catch (err) {
			console.log('from payment route', err.message);
			next(err);
		}
	}
});

router.post('/validate_payment', async (req, res, next) => {
	const { TranId, TrackId, amount, UserField1, Result, ResponseCode, responseCode, responseHash } = req.body;
	let updateUrl = `https://app.ecwid.com/api/v3/${req.cookies.storeId}/orders/${req.cookies.refrenceTransactionId}?token=${req.cookies.token}`;
	let mer = req.cookies.merchantKey;
	mer = mer + '';
	mer = mer.trim();
	let hash = await makeHash(`${TranId}|${mer}|${ResponseCode || responseCode}|${amount}`);
	let fullReturnUrl = `${UserField1}&clientId=${process.env.CLIENT_KEY}`;
	let updateReqeust;
	console.log(ResponseCode);
	let encode = encodeURI(
		`${fullReturnUrl}&errorMsg=${codes[ResponseCode || responseCode] || 'transaction unsucessful'}`
	);
	try {
		if (hash === responseHash) {
			if (Result === 'Successful' || ResponseCode === '000' || Result === 'Success') {
				updateReqeust = await makeRequest(updateUrl, 'PUT', { paymentStatus: 'PAID' });
				if (updateReqeust.error) {
					console.log('to paid failed', updateReqeust, updateReqeust.body);
				}
				res.status(200).json({
					result: 'success',
					code: 200,
					urlToReturn: fullReturnUrl,
				});
			} else {
				updateReqeust = await makeRequest(updateUrl, 'PUT', { paymentStatus: 'INCOMPLETE' });
				console.log('transaction failed', updateReqeust);
				res.status(200).json({
					result: 'failure',
					code: 400,
					urlToReturn: encode,
				});
			}
		} else {
			res.status(200).json({
				result: 'failure',
				code: 400,
				urlToReturn: encode,
			});
		}
	} catch (err) {
		next(err);
	}
});
export default router;
