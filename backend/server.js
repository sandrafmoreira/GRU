const express = require('express');
const cors = require('cors');
const path = require('path')

require('dotenv').config();
require('./cron/collection-guide.cron.js')

const app = express();
const port = process.env.PORT;
const host = process.env.HOST;

app.use(cors({
    origin: 'http://localhost:5173'
}));

app.use(express.json());

app.use('/users', require('./routes/users.routes.js'));
app.use('/feedbacks', require('./routes/feedbacks.routes.js'));
app.use('/collection-points', require('./routes/collection-points.routes.js'));
app.use('/collection-guides', require('./routes/collection-guides.routes.js'));
app.use('/readings', require('./routes/readings.routes.js'));
app.use('/collection-plan', require('./routes/collection-plan.routes.js'));

app.use((err, req, res, next) => {
    console.error(err);

    if (err.type === 'entity.parse.failed')
        return res.status(400).json({ error: 'Invalid JSON payload! Check if your body data is a valid JSON.' });

    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
            error: 'Validation error',
            details: err.errors.map(e => ({
                field: e.path,
                message: e.message
            }))
        });
    }

    if (err.name === 'SequelizeDatabaseError') {
        if (err.original.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
            return res.status(400).json({
                error: 'Invalid value for enumerated field',
                message: err.message
            });
        }
        if (err.original.code === 'ER_BAD_NULL_ERROR') {
            return res.status(400).json({
                error: 'Missing mandatory field',
                message: err.message
            });
        }
        if (err.original.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                error: 'Duplicate entry',
                message: err.message
            });
        }
    }
    res.status(err.statusCode || 500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(port, host, () => {
    console.log(`App listening at http://${host}:${port}/`)
})