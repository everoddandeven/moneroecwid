import express, { NextFunction } from 'express';
import requestpayment from './routes/payment';
import { paymentRouter } from './routers/paymentRouter';
import cors from 'cors';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import cookie from 'cookie-parser';
import webworker from 'web-worker'

const PORT = process.env.PORT || 8000;
console.log(`testnet: ${process.env.TESTNET}, type: ${typeof process.env.TESTNET}`);
console.log(webworker);
const corsOptions = {
	origin: '*',
	optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('./public'));
app.use(cookie());
app.use(cors(corsOptions));

app.use('/v1/monero/ecwid', paymentRouter);

app.get('/process_payment', (req, res) => {
	//const __filename = fileURLToPath(import.meta.url);
	const _filename = fileURLToPath(__filename);
	console.log(_filename);
	// res.sendFile('/public/process.html', path.dirname(__filename));
	res.sendFile(path.join(path.dirname(_filename), './public', 'process.html'));
});
app.use((err: any, req: any, res: any, next: NextFunction) => {
	res.status(500).json({
		error: err.message || 'unknown error',
		errrCode: err.status || 500,
	});
});
app.listen(PORT, () => {
	console.log('app is running on ' + PORT);
});
