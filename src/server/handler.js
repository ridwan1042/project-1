const predictClassification = require('../services/inferenceService');
const crypto = require('crypto');
const { storeData, getData } = require('../services/storeData');

const postPredictHandler = async (request, h) => {
    const { image } = request.payload;
    const { model } = request.server.app;

    // Memeriksa ukuran gambar
    if (image.length > 1000000) { // Jika lebih dari 1MB
        return h.response({
            status: 'fail',
            message: 'Payload content length greater than maximum allowed: 1000000'
        }).code(413);
    }

    try {
        const { confidenceScore } = await predictClassification(model, image);
        const id = crypto.randomUUID();
        const createdAt = new Date().toISOString();

        // Klasifikasi hasil prediksi sebagai 'Cancer' atau 'Non-cancer'
        const result = confidenceScore > 50 ? 'Cancer' : 'Non-cancer';
        const suggestion = confidenceScore > 50 ? 'Segera periksa ke dokter!' : 'Anda sehat! Terus menjaga kesehatan.';

        const data = {
            id,
            result,
            suggestion,
            createdAt,
        };

        await storeData(id, data);

        // Response body sesuai dengan format yang diminta
        return h.response({
            status: 'success',
            message: 'Model is predicted successfully',
            data: [data]
        }).code(201);
    } catch (error) {
        // Mengatasi kesalahan saat melakukan prediksi
        return h.response({
            status: 'fail',
            message: 'Terjadi kesalahan dalam melakukan prediksi'
        }).code(400);
    }
};

const getHistoryHandler = async (_, h) => {
    try {
        const histories = await getData();
        return h.response({
            status: 'success',
            data: histories,
        }).code(200);
    } catch (error) {
        return h.response({
            status: 'fail',
            message: 'Terjadi kesalahan saat mengambil data history'
        }).code(500);
    }
};

const postCheckFailHandler = (request, h) => {
    const response = request.response;

    if (response.isBoom && response.output.statusCode === 500) {
        return h.response({
            status: 'fail',
            message: 'Terjadi kesalahan dalam melakukan prediksi',
        }).code(400);
    }

    if (response.isBoom && response.output.statusCode === 413) {
        return h.response({
            status: 'fail',
            message: 'Payload content length greater than maximum allowed: 1000000',
        }).code(413);
    }

    return h.continue;
};

module.exports = { postPredictHandler, getHistoryHandler, postCheckFailHandler };
