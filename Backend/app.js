import express from "express";
import cors from 'cors';
import 'dotenv/config';

import userRoute          from './routes/userRoute.js';
import inventoryRoute     from './routes/inventoryRoute.js';
import stockMovementRoute from './routes/stockMovementRoute.js';
import saleRoute          from './routes/saleRoute.js';

const corsOptions = {
    origin: ['http://localhost:5173'],
};

const app = express();

app.use(express.json({ limit: '5mb' }));
app.use(cors(corsOptions));

app.use('/user',           userRoute);
app.use('/inventory',      inventoryRoute);
app.use('/stock-movement', stockMovementRoute);
app.use('/sale',           saleRoute);

try {
    const port = 3001;
    app.listen(port, () => {
        console.log(`listening to port ${port}...`);
    });
} catch (e) {
    console.log(e);
}
